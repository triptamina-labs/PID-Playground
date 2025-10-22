/**
 * WorkerManager - Gestor de comunicación con el Web Worker de simulación
 * 
 * Encapsula la comunicación bidireccional con el Worker usando el patrón Actor Model.
 * Proporciona una API tipada y manejo de errores robusto para la UI.
 */

import type {
  SimulationCommand,
  SimulationEvent,
  SimulationBuffer,
  PerformanceMetrics,
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
  ErrorEvent as SimulationErrorEvent,
  MetricsEvent
} from './types'

// ============================================================================
// TIPOS PARA EL MANAGER
// ============================================================================

export interface WorkerManagerConfig {
  timestep?: number      // Timestep de simulación [s]
  bufferSize?: number    // Tamaño del buffer de datos
  debugMode?: boolean    // Habilitar logs detallados
  workerPath?: string    // Ruta al archivo del worker
  createWorker?: () => Worker // Factoría opcional (tests)
}

export interface WorkerManagerCallbacks {
  onTick?: (data: TickEvent['payload']) => void
  onState?: (data: StateEvent['payload']) => void
  onReady?: (data: ReadyEvent['payload']) => void
  onError?: (data: SimulationErrorEvent['payload']) => void
  onMetrics?: (data: MetricsEvent['payload']) => void
  onConnectionLost?: () => void
}

export interface WorkerManagerStatus {
  connected: boolean
  workerState: StateEvent['payload']['state']
  lastTick: number
  performance: PerformanceMetrics
}

// ============================================================================
// WORKER MANAGER CLASS
// ============================================================================

export class WorkerManager {
  private worker: Worker | null = null
  private callbacks: WorkerManagerCallbacks = {}
  private config: Omit<Required<WorkerManagerConfig>, 'createWorker'> & { createWorker?: () => Worker }
  private status: WorkerManagerStatus
  private buffer: SimulationBuffer
  private messageQueue: SimulationCommand[] = []
  private connectionTimeout: number | null = null
  private isInitialized = false

  constructor(config: WorkerManagerConfig = {}) {
    this.config = {
      timestep: config.timestep || 0.1,
      bufferSize: config.bufferSize || 10000,
      debugMode: config.debugMode || false,
      // Recomendado: ruta relativa estática para que Vite reescriba en build
      // Si se provee workerPath, se intentará usar; de lo contrario, usar default bundle-safe
      workerPath: config.workerPath || '../../workers/simulation.worker.ts',
      createWorker: config.createWorker
    }

    this.status = {
      connected: false,
      workerState: 'initializing',
      lastTick: 0,
      performance: {
        avg_cycle_time: 0,
        max_cycle_time: 0,
        cpu_usage_estimate: 0,
        uptime: 0,
        samples_processed: 0
      }
    }

    this.buffer = {
      maxSize: this.config.bufferSize,
      data: []
    }
  }

  // ============================================================================
  // INICIALIZACIÓN Y CONEXIÓN
  // ============================================================================

  /**
   * Inicializa y conecta con el Worker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('WorkerManager ya está inicializado')
    }

    try {
      // Crear Worker: preferir factoría inyectada (tests), luego workerPath, luego default
      let createdWorker: Worker | null = null
      if (this.config.createWorker) {
        createdWorker = this.config.createWorker()
      } else {
        try {
          const path = this.config.workerPath
          if (path) {
            if (path.startsWith('.') || path.startsWith('..')) {
              createdWorker = new Worker(new URL(path, import.meta.url), { type: 'module' })
            } else {
              // Ruta absoluta/URL servida; útil en dev. En prod podría no existir si no fue bundleada.
              createdWorker = new Worker(path as string, { type: 'module' })
            }
          }
        } catch (_) {
          createdWorker = null
        }
      }

      this.worker = createdWorker || new Worker(new URL('../../workers/simulation.worker.ts', import.meta.url), { type: 'module' })
      
      // Configurar event listeners
      this.setupEventListeners()
      
      // Configurar timeout de conexión
      this.connectionTimeout = window.setTimeout(() => {
        this.handleConnectionTimeout()
      }, 5000) // 5 segundos

      // Enviar INIT real según contrato
      const initCommand: InitCommand = {
        id: this.generateId(),
        type: 'INIT',
        timestamp: performance.now(),
        payload: {
          timestep: this.config.timestep,
          bufferSize: this.config.bufferSize,
          debugMode: this.config.debugMode
        }
      }

      this.worker.postMessage(initCommand)
      
      if (this.config.debugMode) {
        console.log('WorkerManager inicializando...')
      }

    } catch (error) {
      throw new Error(`Error inicializando Worker: ${error.message}`)
    }
  }

  /**
   * Configura los event listeners del Worker
   */
  private setupEventListeners(): void {
    if (!this.worker) return

    this.worker.addEventListener('message', (event) => {
      this.handleWorkerMessage(event.data as SimulationEvent)
    })

    this.worker.addEventListener('error', (event: ErrorEvent) => {
      this.handleWorkerDomError(event)
    })

    this.worker.addEventListener('messageerror', (event) => {
      console.error('Error de serialización en mensaje del Worker:', event)
      this.callbacks.onError?.({
        severity: 'error',
        code: 'COM_005',
        message: 'Error de serialización en comunicación con Worker',
        timestamp: performance.now(),
        recoverable: true
      })
    })
  }

  /**
   * Maneja timeout de conexión
   */
  private handleConnectionTimeout(): void {
    if (!this.status.connected) {
      this.callbacks.onError?.({
        severity: 'critical',
        code: 'CON_001',
        message: 'Timeout conectando con Worker (5s)',
        timestamp: performance.now(),
        recoverable: false
      })
    }
  }

  // ============================================================================
  // COMUNICACIÓN CON WORKER
  // ============================================================================

  /**
   * Envía un comando al Worker
   */
  async sendCommand(command: SimulationCommand): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker no está inicializado')
    }

    try {
      // Validar comando básico
      if (!command.id || !command.type) {
        throw new Error('Comando malformado: falta id o type')
      }

      this.worker.postMessage(command)
      
      if (this.config.debugMode) {
        console.log('Comando enviado:', command.type, command.payload)
      }

    } catch (error) {
      throw new Error(`Error enviando comando ${command.type}: ${error.message}`)
    }
  }

  /**
   * Maneja mensajes recibidos del Worker
   */
  private handleWorkerMessage(event: SimulationEvent): void {
    try {
      if (this.config.debugMode) {
        console.log('Evento recibido:', event.type)
      }

      switch (event.type) {
        case 'READY':
          this.handleReadyEvent(event as ReadyEvent)
          break

        case 'TICK':
          this.handleTickEvent(event as TickEvent)
          break

        case 'STATE':
          this.handleStateEvent(event as StateEvent)
          break

        case 'ERROR':
          this.handleErrorEvent(event as SimulationErrorEvent)
          break

        case 'METRICS':
          this.handleMetricsEvent(event as MetricsEvent)
          break

        default:
          console.warn('Tipo de evento no reconocido')
      }

    } catch (error) {
      console.error('Error procesando mensaje del Worker:', error)
      this.callbacks.onError?.({
        severity: 'error',
        code: 'COM_006',
        message: `Error procesando evento ${event.type}: ${error.message}`,
        timestamp: performance.now(),
        recoverable: true
      })
    }
  }

  /**
   * Maneja evento READY del Worker
   */
  private handleReadyEvent(event: ReadyEvent): void {
    this.status.connected = true
    this.status.workerState = 'ready'
    this.isInitialized = true
    
    // Limpiar timeout de conexión
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }

    // Procesar cola de mensajes pendientes
    this.processMessageQueue()

    // Para el worker de prueba, crear payload compatible
    const payload = event.payload || {
      version: 'test',
      capabilities: ['basic'],
      limits: { max_timestep: 1, min_timestep: 0.01, max_buffer_size: 1000 }
    }

    this.callbacks.onReady?.(payload)
    
    if (this.config.debugMode) {
      console.log('Worker listo:', payload)
    }
  }

  /**
   * Maneja evento TICK del Worker
   */
  private handleTickEvent(event: TickEvent): void {
    // Añadir al buffer solo si t > 0 (no eventos de reset)
    if (event.payload.t > 0) {
      this.addToBuffer(event.payload)
    }
    
    // Actualizar status
    this.status.lastTick = event.timestamp
    
    // Callback a la UI
    this.callbacks.onTick?.(event.payload)
  }

  /**
   * Maneja evento STATE del Worker
   */
  private handleStateEvent(event: StateEvent): void {
    this.status.workerState = event.payload.state
    this.status.performance = {
      ...event.payload.performance,
      uptime: event.payload.uptime,
      samples_processed: event.payload.samples_processed
    }
    
    this.callbacks.onState?.(event.payload)
  }

  /**
   * Maneja evento ERROR del Worker
   */
  private handleErrorEvent(event: SimulationErrorEvent): void {
    if (event.payload.severity === 'critical') {
      this.status.connected = false
      this.status.workerState = 'error'
    }
    
    this.callbacks.onError?.(event.payload)
  }

  /**
   * Maneja evento METRICS del Worker
   */
  private handleMetricsEvent(event: MetricsEvent): void {
    if (this.config.debugMode) {
      console.log('Métricas recibidas:', event.payload)
    }
    
    this.callbacks.onMetrics?.(event.payload)
  }

  /**
   * Maneja errores del Worker
   */
  private handleWorkerDomError(event: ErrorEvent): void {
    console.error('Error en Worker:', event)
    
    this.status.connected = false
    this.status.workerState = 'error'
    
    this.callbacks.onError?.({
      severity: 'critical',
      code: 'WORKER_002',
      message: `Error crítico en Worker: ${event.message || 'Error desconocido'}`,
      timestamp: performance.now(),
      recoverable: false
    })
    
    this.callbacks.onConnectionLost?.()
  }

  // ============================================================================
  // GESTIÓN DEL BUFFER
  // ============================================================================

  /**
   * Añade datos al buffer circular
   */
  private addToBuffer(data: TickEvent['payload']): void {
    const bufferEntry = {
      t: data.t,
      SP: data.SP,
      PV: data.PV,
      PV_clean: data.PV_clean,
      u: data.u,
      error: data.error,
      P_term: data.P_term,
      I_term: data.I_term,
      D_term: data.D_term
    }

    this.buffer.data.push(bufferEntry)

    // Mantener tamaño máximo del buffer
    if (this.buffer.data.length > this.buffer.maxSize) {
      this.buffer.data.shift()
    }
  }

  /**
   * Obtiene los datos del buffer
   */
  getBufferData(): SimulationBuffer['data'] {
    return [...this.buffer.data]  // Copia defensiva
  }

  /**
   * Obtiene datos de una ventana de tiempo específica
   * Implementa un buffer FIFO eficiente que mantiene solo los últimos N puntos
   */
  getWindowData(windowSeconds: number): SimulationBuffer['data'] {
    if (this.buffer.data.length === 0) return []

    // Calcular cuántos puntos necesitamos basado en la ventana de tiempo
    // Usar el timestep configurado en lugar de hardcodear
    const maxPoints = Math.ceil(windowSeconds / this.config.timestep)
    
    // Si tenemos menos puntos que el máximo, devolver todos
    if (this.buffer.data.length <= maxPoints) {
      return [...this.buffer.data]
    }
    
    // Si tenemos más puntos, devolver solo los últimos N puntos (FIFO)
    return this.buffer.data.slice(-maxPoints)
  }

  /**
   * Limpia el buffer
   */
  clearBuffer(): void {
    this.buffer.data = []
  }

  // ============================================================================
  // COLA DE MENSAJES
  // ============================================================================

  /**
   * Procesa la cola de mensajes pendientes
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const command = this.messageQueue.shift()
      if (command) {
        this.sendCommand(command).catch(error => {
          console.error('Error enviando comando de la cola:', error)
        })
      }
    }
  }

  // ============================================================================
  // API PÚBLICA
  // ============================================================================

  /**
   * Registra callbacks para eventos del Worker
   */
  setCallbacks(callbacks: WorkerManagerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  /**
   * Inicia la simulación
   */
  async start(): Promise<void> {
    const command: StartCommand = {
      id: this.generateId(),
      type: 'START',
      timestamp: performance.now(),
      payload: {}
    }
    
    await this.sendCommand(command)
  }

  /**
   * Pausa la simulación
   */
  async pause(): Promise<void> {
    const command: PauseCommand = {
      id: this.generateId(),
      type: 'PAUSE',
      timestamp: performance.now(),
      payload: {}
    }
    
    await this.sendCommand(command)
  }

  /**
   * Resetea la simulación
   */
  async reset(preserveParams: boolean = false): Promise<void> {
    // Limpiar buffer ANTES de enviar el comando
    this.clearBuffer()
    
    const command: ResetCommand = {
      id: this.generateId(),
      type: 'RESET',
      timestamp: performance.now(),
      payload: { preserveParams }
    }
    
    await this.sendCommand(command)
  }

  /**
   * Configura parámetros PID
   */
  async setPID(params: SetPIDCommand['payload']): Promise<void> {
    const command: SetPIDCommand = {
      id: this.generateId(),
      type: 'SET_PID',
      timestamp: performance.now(),
      payload: params
    }
    
    await this.sendCommand(command)
  }

  /**
   * Configura parámetros de planta
   */
  async setPlant(params: SetPlantCommand['payload']): Promise<void> {
    const command: SetPlantCommand = {
      id: this.generateId(),
      type: 'SET_PLANT',
      timestamp: performance.now(),
      payload: params
    }
    
    await this.sendCommand(command)
  }

  /**
   * Configura setpoint
   */
  async setSetpoint(value: number, rampRate?: number): Promise<void> {
    const command: SetSPCommand = {
      id: this.generateId(),
      type: 'SET_SP',
      timestamp: performance.now(),
      payload: { value, rampRate }
    }
    
    await this.sendCommand(command)
  }

  /**
   * Configura ruido
   */
  async setNoise(enabled: boolean, sigma: number = 0, seed?: number): Promise<void> {
    const command: SetNoiseCommand = {
      id: this.generateId(),
      type: 'SET_NOISE',
      timestamp: performance.now(),
      payload: { enabled, sigma, seed }
    }
    
    await this.sendCommand(command)
  }

  /**
   * Obtiene el estado actual del manager
   */
  getStatus(): WorkerManagerStatus {
    return { ...this.status }  // Copia defensiva
  }

  /**
   * Termina y limpia el Worker
   */
  destroy(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }

    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }

    this.status.connected = false
    this.status.workerState = 'error'
    this.isInitialized = false
    this.clearBuffer()
    this.messageQueue = []
    
    if (this.config.debugMode) {
      console.log('WorkerManager destruido')
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Genera ID único para mensajes
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.status.connected && this.isInitialized
  }

  /**
   * Verifica si la simulación está ejecutándose
   */
  isRunning(): boolean {
    return this.status.workerState === 'running'
  }
}
