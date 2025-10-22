/**
 * Web Worker de simulación PID en tiempo real
 * 
 * Ejecuta la simulación en un hilo separado para mantener la UI fluida.
 * Frecuencia: 10 Hz exactos (Ts = 100ms)
 * Patrón: Actor Model con mensajes tipados
 * 
 * Arquitectura:
 * - SimulationEngine: Lógica principal de simulación
 * - MessageHandler: Procesamiento de comandos UI → Worker
 * - StateManager: Gestión de estado interno
 * - PerformanceMonitor: Monitoreo de rendimiento
 */

import { FOPDTPlant, PLANT_PRESETS } from '../lib/simulation/plant-model'
import { PIDController, PID_PRESETS } from '../lib/simulation/pid-controller'
import { MetricsCalculator } from '../lib/simulation/metrics-calculator'
import type {
  SimulationCommand,
  SimulationEvent,
  SimulationState,
  InitCommand,
  StartCommand,
  PauseCommand,
  ResetCommand,
  SetPIDCommand,
  SetPlantCommand,
  SetSPCommand,
  SetNoiseCommand,
  TickEvent,
  StateEvent,
  ReadyEvent,
  ErrorEvent,
  MetricsEvent
} from '../lib/simulation/types'

import { SIMULATION_CONFIG } from '../config/app.config'

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const WORKER_VERSION = SIMULATION_CONFIG.worker.version
const DEFAULT_TIMESTEP = SIMULATION_CONFIG.worker.defaultTimestep  // 100ms = 10 Hz
const DEFAULT_BUFFER_SIZE = SIMULATION_CONFIG.worker.defaultBufferSize  // ~16 minutos de datos a 10Hz
const MAX_BUFFER_SIZE = SIMULATION_CONFIG.worker.maxBufferSize     // ~2.7 horas máximo

// ============================================================================
// ESTADO DEL WORKER
// ============================================================================

interface WorkerState {
  status: 'initializing' | 'ready' | 'running' | 'paused' | 'error'
  config: {
    timestep: number
    bufferSize: number
    debugMode: boolean
  }
  simulation: SimulationState
  performance: {
    startTime: number
    lastTickTime: number
    cycleCount: number
    cycleTimes: number[]  // Últimos 100 tiempos de ciclo
    maxCycleTime: number
  }
}

// Estado global del worker
let workerState: WorkerState
let plant: FOPDTPlant
let pidController: PIDController
let metricsCalculator: MetricsCalculator
let simulationTimer: ReturnType<typeof setInterval> | null = null
let noiseGenerator: { enabled: boolean; sigma: number; seed: number } = {
  enabled: false,
  sigma: 0,
  seed: Math.floor(Math.random() * 0xffffffff)
}
let noisePRNG: (() => number) | null = null

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Genera UUID simple para correlación de mensajes
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * PRNG determinista (mulberry32) para reproducibilidad
 */
function createMulberry32(seed: number): () => number {
  let a = (seed >>> 0) || 1
  return function() {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function setNoiseSeed(seed: number): void {
  const s = (Math.floor(seed) >>> 0) || 1
  noiseGenerator.seed = s
  noisePRNG = createMulberry32(s)
}

/**
 * Genera ruido gaussiano usando Box-Muller con PRNG determinista
 */
function generateGaussianNoise(sigma: number): number {
  if (!noiseGenerator.enabled || sigma <= 0) return 0
  if (!noisePRNG) setNoiseSeed(noiseGenerator.seed)
  
  // Box-Muller transform con fuente determinista
  let u1 = 0
  let u2 = 0
  // Evitar 0 exacto para log
  do { u1 = noisePRNG!() } while (u1 <= Number.EPSILON)
  u2 = noisePRNG!()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return sigma * z0
}

/**
 * Envía un evento al hilo principal
 */
function postEvent(event: SimulationEvent): void {
  try {
    self.postMessage(event)
  } catch (error) {
    console.error('Error enviando evento:', error)
  }
}

/**
 * Envía un error al hilo principal
 */
function postError(
  severity: 'warning' | 'error' | 'critical',
  code: string,
  message: string,
  details?: unknown,
  recoverable: boolean = true
): void {
  const errorEvent: ErrorEvent = {
    id: generateId(),
    type: 'ERROR',
    timestamp: performance.now(),
    payload: {
      severity,
      code,
      message,
      details,
      timestamp: performance.now(),
      recoverable
    }
  }
  
  postEvent(errorEvent)
  
  if (severity === 'critical') {
    workerState.status = 'error'
    stopSimulation()
  }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa el worker con configuración por defecto
 */
function initializeWorker(config: InitCommand['payload']): void {
  try {
    // Validar configuración
    if (config.timestep <= 0 || config.timestep > 1) {
      throw new Error(`Timestep inválido: ${config.timestep} (rango: 0-1s)`)
    }
    
    if (config.bufferSize <= 0 || config.bufferSize > MAX_BUFFER_SIZE) {
      throw new Error(`Buffer size inválido: ${config.bufferSize} (máximo: ${MAX_BUFFER_SIZE})`)
    }

    // Configurar estado inicial
    workerState = {
      status: 'initializing',
      config: {
        timestep: config.timestep || DEFAULT_TIMESTEP,
        bufferSize: config.bufferSize || DEFAULT_BUFFER_SIZE,
        debugMode: config.debugMode || false
      },
      simulation: {
        t: 0,
        SP: 25,  // Setpoint inicial
        PV: 25,  // Temperatura inicial = ambiente
        u: 0,    // Salida inicial
        plant_state: 0,
        dead_time_buffer: [],
        pid_integral: 0,
        pid_derivative_prev: 0,
        pid_error_prev: 0,
        config: {
          timestep: config.timestep || DEFAULT_TIMESTEP,
          pid: PID_PRESETS.conservador,
          plant: { ...PLANT_PRESETS.horno_industrial },
          noise: { enabled: false, sigma: 0, seed: Math.random() }
        }
      },
      performance: {
        startTime: performance.now(),
        lastTickTime: 0,
        cycleCount: 0,
        cycleTimes: [],
        maxCycleTime: 0
      }
    }

    // Inicializar planta, controlador y calculador de métricas
    plant = new FOPDTPlant(workerState.simulation.config.plant, workerState.config.timestep)
    // Asegurar que todos los campos PID estén presentes
    const pidConfig = {
      ...PID_PRESETS.conservador,
      ...workerState.simulation.config.pid
    }
    pidController = new PIDController(pidConfig, workerState.config.timestep)
    metricsCalculator = new MetricsCalculator({ debug: workerState.config.debugMode })
    // Inicializar PRNG de ruido con semilla inicial
    setNoiseSeed(workerState.simulation.config.noise.seed)

    workerState.status = 'ready'

    // Enviar evento de inicialización completa
    const readyEvent: ReadyEvent = {
      id: generateId(),
      type: 'READY',
      timestamp: performance.now(),
      payload: {
        version: WORKER_VERSION,
        capabilities: ['FOPDT', 'PID', 'Noise', 'Metrics'],
        limits: {
          max_timestep: 1.0,
          min_timestep: 0.01,
          max_buffer_size: MAX_BUFFER_SIZE
        }
      }
    }
    
    postEvent(readyEvent)

    if (workerState.config.debugMode) {
      console.log('Simulation Worker inicializado:', workerState.config)
    }

  } catch (error) {
    const err = error as Error
    postError('critical', 'INIT_001', `Error inicializando worker: ${err.message}`, err, false)
  }
}

// ============================================================================
// SIMULACIÓN
// ============================================================================

/**
 * Ejecuta un ciclo de simulación
 */
function executSimulationCycle(): void {
  const cycleStartTime = performance.now()
  
  try {
    // Incrementar tiempo de simulación
    workerState.simulation.t += workerState.config.timestep

    // Ejecutar PID
    const pidOutput = pidController.compute(workerState.simulation.SP, workerState.simulation.PV)
    
    // Ejecutar planta
    const plantTemperature = plant.step(pidOutput.u)
    
    // Aplicar ruido si está habilitado
    const noisyTemperature = plantTemperature + generateGaussianNoise(noiseGenerator.sigma)
    
    // Actualizar estado
    workerState.simulation.PV = noisyTemperature
    workerState.simulation.u = pidOutput.u
    const plantState = plant.getState()
    workerState.simulation.plant_state = plantState.x

    // Calcular métricas de control
    const metrics = metricsCalculator.processSample(
      workerState.simulation.t,
      workerState.simulation.SP,
      workerState.simulation.PV
    )

    // Enviar evento de métricas si hay cambios
    if (metrics.is_calculating || metrics.overshoot > 0) {
      const metricsEvent: MetricsEvent = {
        id: generateId(),
        type: 'METRICS',
        timestamp: performance.now(),
        payload: metrics
      }
      postEvent(metricsEvent)
    }

    // Calcular error
    const error = workerState.simulation.SP - workerState.simulation.PV

    // Obtener bounds de ventana (simplificado para ahora)
    const bounds = {
      t_min: Math.max(0, workerState.simulation.t - 60), // Últimos 60s
      t_max: workerState.simulation.t,
      PV_min: workerState.simulation.PV - 5,  // Placeholder
      PV_max: workerState.simulation.PV + 5   // Placeholder
    }

    // Enviar datos del tick
    const tickEvent: TickEvent = {
      id: generateId(),
      type: 'TICK',
      timestamp: performance.now(),
      payload: {
        t: workerState.simulation.t,
        SP: workerState.simulation.SP,
        PV: workerState.simulation.PV,
        u: pidOutput.u,
        PV_clean: plantTemperature,
        error,
        P_term: pidOutput.P_term,
        I_term: pidOutput.I_term,
        D_term: pidOutput.D_term,
        plant_state: plantState.x,
        u_raw: pidOutput.u_raw,
        saturated: pidOutput.saturated,
        bounds
      }
    }
    
    postEvent(tickEvent)

    // Actualizar métricas de performance
    const cycleTime = performance.now() - cycleStartTime
    workerState.performance.cycleCount++
    workerState.performance.cycleTimes.push(cycleTime)
    
    // Mantener solo los últimos 100 tiempos
    if (workerState.performance.cycleTimes.length > 100) {
      workerState.performance.cycleTimes.shift()
    }
    
    workerState.performance.maxCycleTime = Math.max(workerState.performance.maxCycleTime, cycleTime)
    workerState.performance.lastTickTime = performance.now()

    // Alertar si el ciclo tomó demasiado tiempo
    if (cycleTime > workerState.config.timestep * 1000 * 0.8) {
      postError('warning', 'PERF_001', 
        `Ciclo de simulación lento: ${cycleTime.toFixed(2)}ms (${(workerState.config.timestep * 1000).toFixed(0)}ms target)`,
        { cycleTime, targetTime: workerState.config.timestep * 1000 }
      )
    }

  } catch (error) {
    const err = error as Error
    postError('error', 'SIM_001', `Error en ciclo de simulación: ${err.message}`, err)
  }
}

/**
 * Inicia la simulación con timer de alta precisión
 */
function startSimulation(): void {
  if (workerState.status !== 'ready' && workerState.status !== 'paused') {
    postError('error', 'SIM_002', `No se puede iniciar simulación desde estado: ${workerState.status}`)
    return
  }

  workerState.status = 'running'
  
  // Usar setInterval para máxima compatibilidad
  // TODO: Considerar usar Worker Timer más preciso en el futuro
  const intervalMs = workerState.config.timestep * 1000
  simulationTimer = self.setInterval(executSimulationCycle, intervalMs)
  
  // Enviar evento de estado
  postStateEvent()
  
  if (workerState.config.debugMode) {
    console.log(`Simulación iniciada: ${1/workerState.config.timestep} Hz`)
  }
}

/**
 * Pausa la simulación
 */
function pauseSimulation(): void {
  if (workerState.status !== 'running') return
  
  workerState.status = 'paused'
  stopSimulation()
  postStateEvent()
}

/**
 * Detiene el timer de simulación
 */
function stopSimulation(): void {
  if (simulationTimer !== null) {
    self.clearInterval(simulationTimer)
    simulationTimer = null
  }
}

/**
 * Resetea la simulación a estado inicial
 */
function resetSimulation(preserveParams: boolean = false): void {
  
  // Detener simulación
  stopSimulation()
  
  // Resetear componentes
  plant.reset()
  pidController.reset()
  
  // Resetear variables de estado
  workerState.simulation.t = 0
  workerState.simulation.PV = workerState.simulation.config.plant.T_amb
  workerState.simulation.u = 0
  workerState.simulation.plant_state = 0
  
  // Resetear variables PID internas
  workerState.simulation.pid_integral = 0
  workerState.simulation.pid_derivative_prev = 0
  workerState.simulation.pid_error_prev = 0
  
  // Limpiar buffer de dead time
  workerState.simulation.dead_time_buffer = []
  
  // Resetear setpoint solo si no preservamos parámetros
  if (!preserveParams) {
    workerState.simulation.SP = workerState.simulation.config.plant.T_amb
  }
  
  // Resetear métricas de performance
  workerState.performance.cycleCount = 0
  workerState.performance.cycleTimes = []
  workerState.performance.maxCycleTime = 0
  workerState.performance.startTime = performance.now()
  
  workerState.status = 'ready'
  
  // Enviar evento de estado
  postStateEvent()
  
  // NO enviar evento de tick de reset - esto causa que se acumule en el buffer
  // En su lugar, solo enviar el evento de estado
  
  // Enviar evento de métricas reseteado
  const resetMetricsEvent: MetricsEvent = {
    id: generateId(),
    type: 'METRICS',
    timestamp: performance.now(),
    payload: {
      overshoot: 0,
      t_peak: 0,
      settling_time: 0,
      is_calculating: false,
      sp_previous: workerState.simulation.SP,
      pv_max: workerState.simulation.PV,
      pv_min: workerState.simulation.PV,
      t_start: 0,
      t_current: 0,
      samples_count: 0
    }
  }
  
  postEvent(resetMetricsEvent)
}

// ============================================================================
// EVENTOS DE ESTADO
// ============================================================================

/**
 * Envía evento de estado actual
 */
function postStateEvent(): void {
  const uptime = (performance.now() - workerState.performance.startTime) / 1000
  const avgCycleTime = workerState.performance.cycleTimes.length > 0 
    ? workerState.performance.cycleTimes.reduce((a, b) => a + b) / workerState.performance.cycleTimes.length
    : 0
  
  const stateEvent: StateEvent = {
    id: generateId(),
    type: 'STATE',
    timestamp: performance.now(),
    payload: {
      state: workerState.status,
      uptime,
      samples_processed: workerState.performance.cycleCount,
      performance: {
        avg_cycle_time: avgCycleTime,
        max_cycle_time: workerState.performance.maxCycleTime,
        cpu_usage_estimate: Math.min(100, (avgCycleTime / (workerState.config.timestep * 1000)) * 100)
      }
    }
  }
  
  postEvent(stateEvent)
}

// ============================================================================
// PROCESAMIENTO DE COMANDOS
// ============================================================================

/**
 * Procesa comandos recibidos del hilo principal
 */
function handleCommand(command: SimulationCommand): void {
  try {
    if (workerState && workerState.config && workerState.config.debugMode) {
      console.log('Comando recibido:', command.type, command.payload)
    }

    switch (command.type) {
      case 'INIT':
        // Compatibilidad: aceptar payload directo o payload.config
        {
          const raw = (command as unknown as { payload: unknown }).payload
          const initPayload = (raw && (raw as { config?: unknown }).config) ? (raw as { config: unknown }).config : raw
          const safePayload = initPayload && typeof initPayload.timestep === 'number'
            ? initPayload as InitCommand['payload']
            : { timestep: DEFAULT_TIMESTEP, bufferSize: DEFAULT_BUFFER_SIZE, debugMode: false }
          initializeWorker(safePayload)
        }
        break

      case 'START':
        startSimulation()
        break

      case 'PAUSE':
        pauseSimulation()
        break

      case 'RESET': {
        const resetCmd = command as ResetCommand
        resetSimulation(resetCmd.payload.preserveParams)
        break
      }

      case 'SET_PID': {
        const pidCmd = command as SetPIDCommand
        // Asegurar que todos los campos requeridos estén presentes
        const pidParams = {
          ...workerState.simulation.config.pid,
          ...pidCmd.payload,
          N: pidCmd.payload.N ?? workerState.simulation.config.pid.N,
          Tt: pidCmd.payload.Tt ?? workerState.simulation.config.pid.Tt,
          enabled: pidCmd.payload.enabled ?? workerState.simulation.config.pid.enabled
        }
        pidController.updateParameters(pidParams)
        workerState.simulation.config.pid = pidParams
        break
      }

      case 'SET_PLANT': {
        const plantCmd = command as SetPlantCommand
        plant.updateParameters(plantCmd.payload)
        workerState.simulation.config.plant = { ...workerState.simulation.config.plant, ...plantCmd.payload }
        break
      }

      case 'SET_SP': {
        const spCmd = command as SetSPCommand
        workerState.simulation.SP = spCmd.payload.value
        // TODO: Implementar rampa si rampRate está especificado
        break
      }

      case 'SET_NOISE': {
        const noiseCmd = command as SetNoiseCommand
        noiseGenerator = {
          enabled: noiseCmd.payload.enabled,
          sigma: noiseCmd.payload.sigma,
          seed: (noiseCmd.payload.seed !== undefined)
            ? Math.floor(noiseCmd.payload.seed)
            : noiseGenerator.seed
        }
        // Re-inicializar PRNG cuando cambie la semilla
        setNoiseSeed(noiseGenerator.seed)
        workerState.simulation.config.noise = { ...noiseCmd.payload, seed: noiseGenerator.seed }
        break
      }

      default: {
        const unknownCommand = command as { type: string }
        postError('warning', 'COM_003', `Tipo de comando no reconocido: ${unknownCommand.type}`)
        break
      }
    }

  } catch (error) {
    postError('error', 'COM_001', `Error procesando comando ${command.type}: ${error.message}`, error)
  }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

// Escuchar mensajes del hilo principal
self.addEventListener('message', (event) => {
  try {
    const command = event.data as SimulationCommand
    
    // Validación básica del mensaje
    if (!command || !command.type || !command.id) {
      postError('error', 'COM_004', 'Mensaje malformado recibido')
      return
    }
    
    handleCommand(command)
    
  } catch (error) {
    const err = error as Error
    postError('error', 'COM_002', `Error procesando mensaje: ${err.message}`, err)
  }
})

// Manejar errores no capturados
self.addEventListener('error', (event) => {
  postError('critical', 'WORKER_001', `Error no capturado: ${event.message}`, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  }, false)
})

// Inicialización automática cuando se carga el worker
self.addEventListener('DOMContentLoaded', () => {
  if (workerState?.config?.debugMode) {
    console.log('Simulation Worker cargado y listo')
  }
})

// ============================================================================
// EXPORT PARA TYPESCRIPT
// ============================================================================

// Necesario para que TypeScript reconozca este archivo como módulo
export {}

// Indicar que estamos en un Worker context
declare const self: typeof globalThis & {
  setInterval: typeof setInterval
  clearInterval: typeof clearInterval
  addEventListener: typeof addEventListener
  postMessage: typeof postMessage
}
