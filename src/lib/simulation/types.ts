/**
 * Tipos y interfaces para la simulación PID
 * Basado en el contrato de mensajes definido en docs/02-architecture-and-contract.md
 */

// ============================================================================
// TIPOS BASE DE MENSAJES
// ============================================================================

export type MessageType = 
  // Control de simulación
  | 'INIT' | 'START' | 'PAUSE' | 'RESET'
  // Configuración de parámetros  
  | 'SET_PID' | 'SET_PLANT' | 'SET_SP' | 'SET_NOISE' | 'SET_SSR'
  // Acciones dinámicas
  | 'ADD_DISTURBANCE' | 'APPLY_PRESET' | 'SET_WINDOW'
  // Respuestas del Worker
  | 'TICK' | 'METRICS' | 'STATE' | 'ERROR' | 'READY'

export interface BaseMessage {
  id: string          // UUID para correlación request/response
  type: MessageType
  timestamp: number   // performance.now()
}

export interface CommandMessage extends BaseMessage {
  payload: unknown
}

export interface EventMessage extends BaseMessage {
  payload: unknown
}

// ============================================================================
// COMANDOS UI → WORKER
// ============================================================================

export interface InitCommand extends CommandMessage {
  type: 'INIT'
  payload: {
    timestep: number      // T_s en segundos (default: 0.1)
    bufferSize: number    // Tamaño máximo del buffer
    debugMode: boolean    // Habilitar logs detallados
  }
}

export interface StartCommand extends CommandMessage {
  type: 'START'
  payload: Record<string, never>
}

export interface PauseCommand extends CommandMessage {
  type: 'PAUSE'  
  payload: Record<string, never>
}

export interface ResetCommand extends CommandMessage {
  type: 'RESET'
  payload: {
    preserveParams?: boolean  // Si true, solo resetea PV/estado, no parámetros
  }
}

export interface SetPIDCommand extends CommandMessage {
  type: 'SET_PID'
  payload: {
    kp: number           // Ganancia proporcional [adimensional]
    ki: number           // Ganancia integral [s⁻¹]  
    kd: number           // Tiempo derivativo [s]
    N?: number           // Factor filtro derivada (default: 10)
    Tt?: number          // Tiempo tracking anti-windup [s] (default: auto)
    enabled?: boolean    // Habilitar/deshabilitar PID (default: true)
  }
}

export interface SetPlantCommand extends CommandMessage {
  type: 'SET_PLANT'
  payload: {
    K: number           // Ganancia efectiva [°C/s por unidad u]
    tau: number         // Constante de tiempo [s]
    L: number           // Tiempo muerto [s]  
    T_amb: number       // Temperatura ambiente [°C]
    mode: 'horno' | 'chiller'  // Modo de operación
  }
}

export interface SetSPCommand extends CommandMessage {
  type: 'SET_SP'
  payload: {
    value: number       // Setpoint en °C
    rampRate?: number   // Velocidad de rampa [°C/s] (default: instantáneo)
  }
}

export interface SetNoiseCommand extends CommandMessage {
  type: 'SET_NOISE'
  payload: {
    enabled: boolean    // Habilitar ruido
    sigma: number       // Desviación estándar [°C]
    seed?: number       // Semilla para reproducibilidad (default: random)
  }
}

// ============================================================================
// EVENTOS WORKER → UI
// ============================================================================

export interface TickEvent extends EventMessage {
  type: 'TICK'
  payload: {
    t: number              // Tiempo de simulación [s]
    SP: number             // Setpoint actual [°C]
    PV: number             // Process Variable (medida) [°C] 
    u: number              // Salida de control [0-1]
    PV_clean: number       // PV sin ruido [°C]
    error: number          // Error SP - PV [°C]
    
    // Componentes del PID
    P_term: number         // Término proporcional
    I_term: number         // Término integral  
    D_term: number         // Término derivativo
    
    // Estado de la planta
    plant_state: number    // Estado interno x = T - T_amb
    
    // Límites y saturación
    u_raw: number         // Salida PID antes de saturar
    saturated: boolean    // True si u está saturado
    
    // Información de ventana
    bounds: {
      t_min: number       // Tiempo mínimo en buffer
      t_max: number       // Tiempo máximo en buffer  
      PV_min: number      // PV mínimo en ventana
      PV_max: number      // PV máximo en ventana
    }
  }
}

export interface StateEvent extends EventMessage {
  type: 'STATE'
  payload: {
    state: 'initializing' | 'ready' | 'running' | 'paused' | 'error'
    uptime: number          // Tiempo de ejecución [s]
    samples_processed: number // Total de muestras procesadas
    performance: {
      avg_cycle_time: number    // Tiempo promedio por ciclo [ms]
      max_cycle_time: number    // Tiempo máximo observado [ms]
      cpu_usage_estimate: number // Estimación de uso CPU [%]
    }
  }
}

export interface ReadyEvent extends EventMessage {
  type: 'READY'
  payload: {
    version: string         // Versión del Worker
    capabilities: string[]  // Características soportadas
    limits: {
      max_timestep: number      // T_s máximo [s]
      min_timestep: number      // T_s mínimo [s]
      max_buffer_size: number   // Buffer máximo
    }
  }
}

export interface ErrorEvent extends EventMessage {
  type: 'ERROR'
  payload: {
    severity: 'warning' | 'error' | 'critical'
    code: string           // Código de error único
    message: string        // Mensaje human-readable
    details?: {
      parameter?: string   // Parámetro relacionado
      value?: unknown     // Valor que causó el error
      expected?: string   // Valor esperado
      context?: string    // Contexto adicional
    }
    
    stack?: string        // Stack trace si aplica
    timestamp: number     // Timestamp del error
    suggestions?: string[]
    recoverable: boolean
  }
}

export interface MetricsEvent extends EventMessage {
  type: 'METRICS'
  payload: {
    overshoot: number        // Overshoot porcentual actual
    t_peak: number          // Tiempo del pico máximo [s]
    settling_time: number   // Tiempo de establecimiento [s]
    is_calculating: boolean // True si está calculando métricas
    sp_previous: number     // Setpoint anterior para detectar cambios
    pv_max: number          // Valor máximo de PV detectado
    pv_min: number          // Valor mínimo de PV detectado
    t_start: number         // Tiempo de inicio del cálculo [s]
    t_current: number       // Tiempo actual [s]
    samples_count: number   // Número de muestras procesadas
  }
}

// ============================================================================
// UNION TYPES
// ============================================================================

export type SimulationCommand = 
  | InitCommand | StartCommand | PauseCommand | ResetCommand
  | SetPIDCommand | SetPlantCommand | SetSPCommand 
  | SetNoiseCommand

export type SimulationEvent = 
  | TickEvent | StateEvent | ReadyEvent | ErrorEvent | MetricsEvent

// ============================================================================
// TIPOS DE ESTADO DE SIMULACIÓN
// ============================================================================

export interface SimulationState {
  // Estado temporal
  t: number                 // Tiempo actual [s]
  
  // Variables principales
  SP: number               // Setpoint actual [°C]
  PV: number               // Process Variable [°C]
  u: number                // Salida de control [0-1]
  
  // Estado de la planta FOPDT
  plant_state: number      // Estado interno x = T - T_amb
  dead_time_buffer: number[] // Buffer para tiempo muerto
  
  // Estado del PID
  pid_integral: number     // Acumulador integral
  pid_derivative_prev: number // Estado previo para derivada filtrada
  pid_error_prev: number   // Error previo
  
  // Configuración actual
  config: {
    timestep: number       // T_s [s]
    pid: SetPIDCommand['payload']
    plant: SetPlantCommand['payload'] 
    noise: SetNoiseCommand['payload']
  }
}

// ============================================================================
// TIPOS PARA LA UI
// ============================================================================

export interface SimulationBuffer {
  maxSize: number
  data: Array<{
    t: number
    SP: number
    PV: number
    PV_clean: number
    u: number
    error: number
    P_term: number
    I_term: number
    D_term: number
  }>
}

export interface PerformanceMetrics {
  avg_cycle_time: number
  max_cycle_time: number  
  cpu_usage_estimate: number
  uptime: number
  samples_processed: number
}
