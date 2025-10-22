# API Reference - PID Playground

## Visión General

Esta documentación describe todas las APIs públicas del PID Playground, incluyendo interfaces TypeScript, hooks de React, y métodos de los componentes principales.

## Índice

1. [Tipos y Interfaces](#tipos-y-interfaces)
2. [SimulationProvider API](#simulationprovider-api)
3. [WorkerManager API](#workermanager-api)
4. [Componentes UI](#componentes-ui)
5. [Configuración](#configuración)
6. [Eventos y Mensajes](#eventos-y-mensajes)

## Tipos y Interfaces

### Tipos Base de Mensajes

```typescript
// Tipos de mensajes soportados
export type MessageType = 
  // Control de simulación
  | 'INIT' | 'START' | 'PAUSE' | 'RESET'
  // Configuración de parámetros  
  | 'SET_PID' | 'SET_PLANT' | 'SET_SP' | 'SET_NOISE' | 'SET_SSR'
  // Acciones dinámicas
  | 'ADD_DISTURBANCE' | 'APPLY_PRESET' | 'SET_WINDOW'
  // Respuestas del Worker
  | 'TICK' | 'METRICS' | 'STATE' | 'ERROR' | 'READY'

// Mensaje base para todos los comandos y eventos
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
```

### Estado de Simulación

```typescript
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
```

### Métricas de Performance

```typescript
export interface PerformanceMetrics {
  avg_cycle_time: number    // Tiempo promedio por ciclo [ms]
  max_cycle_time: number    // Tiempo máximo observado [ms]
  cpu_usage_estimate: number // Estimación de uso CPU [%]
  uptime: number           // Tiempo de ejecución [s]
  samples_processed: number // Total de muestras procesadas
}
```

## SimulationProvider API

### Context Value

```typescript
export interface SimulationContextValue {
  state: SimulationContextState
  actions: SimulationContextActions
}
```

### Estado del Context

```typescript
export interface SimulationContextState {
  // Estado de conexión
  isConnected: boolean
  isInitialized: boolean
  isRunning: boolean
  workerState: StateEvent['payload']['state']
  
  // Datos actuales
  currentData: TickEvent['payload'] | null
  buffer: SimulationBuffer['data']
  
  // Métricas de rendimiento
  performance: PerformanceMetrics
  
  // Errores
  lastError: ErrorEvent['payload'] | null

  // Métricas de control
  metrics: {
    overshoot: number
    t_peak: number
    settling_time: number
    is_calculating: boolean
    sp_previous: number
    pv_max: number
    pv_min: number
    t_start: number
    t_current: number
    samples_count: number
  } | null
  
  // Configuración actual
  config: {
    timestep: number
    bufferSize: number
    debugMode: boolean
  }
}
```

### Acciones del Context

```typescript
export interface SimulationContextActions {
  // Control de simulación
  start: () => Promise<void>
  pause: () => Promise<void>
  reset: (preserveParams?: boolean) => Promise<void>
  
  // Configuración de parámetros
  setPID: (params: SetPIDCommand['payload']) => Promise<void>
  setPlant: (params: SetPlantCommand['payload']) => Promise<void>
  setSetpoint: (value: number, rampRate?: number) => Promise<void>
  setNoise: (enabled: boolean, sigma?: number, seed?: number) => Promise<void>
  
  // Utilidades
  getWindowData: (windowSeconds: number) => SimulationBuffer['data']
  clearBuffer: () => void
  clearError: () => void
  
  // Estado del Worker
  getWorkerStatus: () => WorkerManagerStatus

  // Exportación CSV
  exportCSV: (range: { type: 'window'; seconds: number } | { type: 'all' }) => void
}
```

### Hooks Especializados

```typescript
// Hook principal
export function useSimulation(): SimulationContextValue

// Hook para datos de simulación
export function useSimulationData(): {
  currentData: TickEvent['payload'] | null
  buffer: SimulationBuffer['data']
  isRunning: boolean
  isConnected: boolean
}

// Hook para controles
export function useSimulationControls(): SimulationContextActions & {
  isConnected: boolean
  isRunning: boolean
  workerState: StateEvent['payload']['state']
}

// Hook para performance
export function useSimulationPerformance(): {
  performance: PerformanceMetrics
  lastError: ErrorEvent['payload'] | null
  workerState: StateEvent['payload']['state']
}
```


## WorkerManager API

### Configuración

```typescript
export interface WorkerManagerConfig {
  timestep?: number      // Timestep de simulación [s]
  bufferSize?: number    // Tamaño del buffer de datos
  debugMode?: boolean    // Habilitar logs detallados
  workerPath?: string    // Ruta al archivo del worker
  createWorker?: () => Worker // Factoría opcional (tests)
}
```

### Callbacks

```typescript
export interface WorkerManagerCallbacks {
  onTick?: (data: TickEvent['payload']) => void
  onState?: (data: StateEvent['payload']) => void
  onReady?: (data: ReadyEvent['payload']) => void
  onError?: (data: SimulationErrorEvent['payload']) => void
  onMetrics?: (data: MetricsEvent['payload']) => void
  onConnectionLost?: () => void
}
```

### Estado del Manager

```typescript
export interface WorkerManagerStatus {
  connected: boolean
  workerState: StateEvent['payload']['state']
  lastTick: number
  performance: PerformanceMetrics
}
```

### Métodos Públicos

```typescript
class WorkerManager {
  // Inicialización
  async initialize(): Promise<void>
  
  // Control de simulación
  async start(): Promise<void>
  async pause(): Promise<void>
  async reset(preserveParams?: boolean): Promise<void>
  
  // Configuración
  async setPID(params: SetPIDCommand['payload']): Promise<void>
  async setPlant(params: SetPlantCommand['payload']): Promise<void>
  async setSetpoint(value: number, rampRate?: number): Promise<void>
  async setNoise(enabled: boolean, sigma?: number, seed?: number): Promise<void>
  
  // Callbacks
  setCallbacks(callbacks: WorkerManagerCallbacks): void
  
  // Datos
  getBufferData(): SimulationBuffer['data']
  getWindowData(windowSeconds: number): SimulationBuffer['data']
  clearBuffer(): void
  
  // Estado
  getStatus(): WorkerManagerStatus
  isConnected(): boolean
  isRunning(): boolean
  
  // Limpieza
  destroy(): void
}
```


## Comandos y Eventos

### Comandos UI → Worker

#### INIT Command

```typescript
export interface InitCommand extends CommandMessage {
  type: 'INIT'
  payload: {
    timestep: number      // T_s en segundos (default: 0.1)
    bufferSize: number    // Tamaño máximo del buffer
    debugMode: boolean    // Habilitar logs detallados
  }
}
```

#### SET_PID Command

```typescript
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
```

#### SET_PLANT Command

```typescript
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
```

#### SET_SP Command

```typescript
export interface SetSPCommand extends CommandMessage {
  type: 'SET_SP'
  payload: {
    value: number       // Setpoint en °C
    rampRate?: number   // Velocidad de rampa [°C/s] (default: instantáneo)
  }
}
```

### Eventos Worker → UI

#### TICK Event

```typescript
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
```

#### STATE Event

```typescript
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
```

#### ERROR Event

```typescript
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
```

## Componentes UI

### SimulationProvider Props

```typescript
export interface SimulationProviderProps {
  children: React.ReactNode
  config?: {
    timestep?: number
    bufferSize?: number
    debugMode?: boolean
    workerPath?: string
  }
}
```

### UnifiedControlPanel Props

```typescript
interface UnifiedControlPanelProps {
  state: SimulatorState
  onStateChange: (updates: Partial<SimulatorState>) => void
  onReset: () => void
  onExportWindow: () => void
  onExportAll: () => void
  metrics: {
    overshoot: number
    t_peak: number
    settling_time: number
    is_calculating: boolean
    sp_previous: number
    pv_max: number
    pv_min: number
    t_start: number
    t_current: number
    samples_count: number
  }
  currentPV: number
  compact?: boolean
}
```

### ChartsPanel Props

```typescript
interface ChartsPanelProps {
  data: ChartDataPoint[]
  timeWindow: TimeWindow
  isRunning: boolean
}
```

## Configuración

### APP_CONFIG

```typescript
export const APP_CONFIG = {
  dev: DEV_CONFIG,
  simulation: SIMULATION_CONFIG,
  pid: PID_CONFIG,
  plant: PLANT_CONFIG,
  presets: PRESETS,
  ui: UI_CONFIG,
  export: EXPORT_CONFIG,
  validation: VALIDATION_CONFIG,
}
```

### SIMULATION_CONFIG

```typescript
export const SIMULATION_CONFIG = {
  worker: {
    version: '1.0.0',
    defaultTimestep: 0.1,  // 100ms = 10 Hz
    defaultBufferSize: 10000,  // ~16 minutos de datos a 10Hz
    maxBufferSize: 100000,     // ~2.7 horas máximo
    format: 'es',
  },
  
  limits: {
    maxTimestep: 1.0,
    minTimestep: 0.01,
    maxBufferSize: 100000,
    maxSimulationTime: 3600, // 1 hora máximo
  },
  
  performance: {
    targetCycleTime: 100, // ms
    maxCycleTime: 80,     // 80% del target
    cycleTimeBuffer: 100, // muestras para promedio
  },
  
  noise: {
    defaultSeed: Math.floor(Math.random() * 0xffffffff),
    maxSigma: 10.0, // °C
    minSigma: 0.0,
  },
  
  metrics: {
    overshootThreshold: 0.1, // % mínimo para considerar overshoot
    settlingBand: 0.05,      // ±5% del setpoint para establecimiento
    settlingTimeWindow: 60,  // segundos para calcular establecimiento
  }
}
```

### PID_CONFIG

```typescript
export const PID_CONFIG = {
  limits: {
    kp: { min: 0, max: 100, default: 1.0 },
    ki: { min: 0, max: 10, default: 0.1 },
    kd: { min: 0, max: 100, default: 0.0 },
    N: { min: 1, max: 50, default: 10 },
    Tt: { min: 0.1, max: 100, default: 2.5 },
  },
  
  saturation: {
    outputMin: 0,
    outputMax: 1,
  },
  
  antiWindup: {
    enabled: true,
    backCalculation: true,
    autoTt: true, // Calcular Tt automáticamente
  },
  
  derivativeFilter: {
    enabled: true,
    defaultN: 10,
    maxN: 50,
  }
}
```

## Utilidades de Configuración

### Funciones de Validación

```typescript
/**
 * Valida que un valor esté dentro de los límites configurados
 */
export function validateValue(
  value: number,
  limits: { min: number; max: number },
  name: string
): { valid: boolean; error?: string }

/**
 * Obtiene el valor por defecto de un parámetro
 */
export function getDefaultValue<T extends keyof PIDConfig['limits'] | keyof PlantConfig['limits']>(
  category: 'pid' | 'plant',
  parameter: T
): number

/**
 * Obtiene configuración específica del entorno
 */
export function getConfig<T extends keyof AppConfig>(key: T): AppConfig[T]
```

## Códigos de Error

### Categorías de Error

- **INIT_***: Errores de inicialización
- **COM_***: Errores de comunicación
- **SIM_***: Errores de simulación
- **PERF_***: Errores de performance
- **WORKER_***: Errores del Worker
- **CON_***: Errores de conexión

### Ejemplos de Códigos

```typescript
// Errores de inicialización
'INIT_001': 'Error inicializando worker'
'INIT_002': 'Error inicializando simulación'

// Errores de comunicación
'COM_001': 'Error procesando comando'
'COM_002': 'Error procesando mensaje'
'COM_003': 'Tipo de comando no reconocido'
'COM_004': 'Mensaje malformado recibido'
'COM_005': 'Error de serialización en comunicación con Worker'
'COM_006': 'Error procesando evento'

// Errores de simulación
'SIM_001': 'Error en ciclo de simulación'
'SIM_002': 'No se puede iniciar simulación desde estado'

// Errores de performance
'PERF_001': 'Ciclo de simulación lento'

// Errores del Worker
'WORKER_001': 'Error no capturado'
'WORKER_002': 'Error crítico en Worker'

// Errores de conexión
'CON_001': 'Timeout conectando con Worker'
```

## Mejores Prácticas

### Uso de Hooks

1. **Usar hooks especializados** cuando sea posible para optimizar el rendimiento y claridad del código.

2. **Manejar errores** en todas las operaciones asíncronas para proporcionar una experiencia de usuario robusta.

### Configuración

1. **Usar presets** para configuraciones comunes y validadas.

2. **Validar parámetros** antes de enviarlos para evitar errores de simulación.

### Performance

1. **Usar ventanas de tiempo** apropiadas para los datos según el caso de uso (tiempo real vs análisis histórico).

2. **Limpiar buffers** cuando sea necesario, especialmente al cambiar configuraciones importantes.

## Conclusión

Esta API reference proporciona una guía completa para interactuar con el PID Playground. La arquitectura está diseñada para ser intuitiva y fácil de usar, mientras mantiene la flexibilidad necesaria para casos de uso avanzados.

Para ejemplos más específicos y casos de uso, consulta la documentación de usuario y los tutoriales disponibles.

---

