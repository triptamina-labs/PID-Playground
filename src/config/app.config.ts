/**
 * Configuración unificada del PID Playground
 * 
 * Este archivo centraliza todos los parámetros de configuración del proyecto,
 * incluyendo configuración de desarrollo, simulación, UI y presets.
 */

// ============================================================================
// CONFIGURACIÓN DE DESARROLLO
// ============================================================================

export const DEV_CONFIG = {
  // Configuración del servidor de desarrollo
  server: {
    host: "::",
    port: 8080,
  },
  
  // Configuración de build
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  
  // Configuración de testing
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    include: ['tests/**/*.{test,spec}.ts'],
    reporters: 'default'
  },
  
  // Configuración de linting
  lint: {
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['dist', 'node_modules'],
  }
} as const

// ============================================================================
// CONFIGURACIÓN DE SIMULACIÓN
// ============================================================================

export const SIMULATION_CONFIG = {
  // Configuración del Worker
  worker: {
    version: '1.0.0',
    defaultTimestep: 0.1,  // 100ms = 10 Hz
    defaultBufferSize: 10000,  // ~16 minutos de datos a 10Hz
    maxBufferSize: 100000,     // ~2.7 horas máximo
    format: 'es',
  },
  
  // Límites de simulación
  limits: {
    maxTimestep: 1.0,
    minTimestep: 0.01,
    maxBufferSize: 100000,
    maxSimulationTime: 3600, // 1 hora máximo
  },
  
  // Configuración de performance
  performance: {
    targetCycleTime: 100, // ms
    maxCycleTime: 80,     // 80% del target
    cycleTimeBuffer: 100, // muestras para promedio
  },
  
  // Configuración de ruido
  noise: {
    defaultSeed: Math.floor(Math.random() * 0xffffffff),
    maxSigma: 10.0, // °C
    minSigma: 0.0,
  },
  
  // Configuración de métricas
  metrics: {
    overshootThreshold: 0.1, // % mínimo para considerar overshoot
    settlingBand: 0.05,      // ±5% del setpoint para establecimiento
    settlingTimeWindow: 60,  // segundos para calcular establecimiento
  }
} as const

// ============================================================================
// CONFIGURACIÓN DE CONTROL PID
// ============================================================================

export const PID_CONFIG = {
  // Límites de ganancias
  limits: {
    kp: { min: 0, max: 100, default: 1.0 },
    ki: { min: 0, max: 10, default: 0.1 },
    kd: { min: 0, max: 100, default: 0.0 },
    N: { min: 1, max: 50, default: 10 },
    Tt: { min: 0.1, max: 100, default: 2.5 },
  },
  
  // Configuración de saturación
  saturation: {
    outputMin: 0,
    outputMax: 1,
  },
  
  // Configuración de anti-windup
  antiWindup: {
    enabled: true,
    backCalculation: true,
    autoTt: true, // Calcular Tt automáticamente
  },
  
  // Configuración de filtro derivativo
  derivativeFilter: {
    enabled: true,
    defaultN: 10,
    maxN: 50,
  }
} as const

// ============================================================================
// CONFIGURACIÓN DE PLANTA FOPDT
// ============================================================================

export const PLANT_CONFIG = {
  // Límites de parámetros
  limits: {
    K: { min: -100, max: 200, default: 75.0 },
    tau: { min: 1, max: 600, default: 90 }, // 1s a 10min
    L: { min: 0, max: 60, default: 5 },     // 0s a 1min
    T_amb: { min: -20, max: 50, default: 25 }, // -20°C a 50°C
  },
  
  // Configuración de discretización
  discretization: {
    method: 'exact', // 'exact' vs 'euler'
    stabilityCheck: true,
  },
  
  // Configuración de tiempo muerto
  deadTime: {
    bufferResize: true,
    interpolation: false, // Usar valor más reciente
  }
} as const

// ============================================================================
// PRESETS PREDEFINIDOS
// ============================================================================

export const PRESETS = {
  // Presets de PID
  pid: {
    conservador: {
      name: 'Conservador',
      description: 'Respuesta lenta pero estable',
      kp: 1.0,
      ki: 0.1,
      kd: 0.0,
      N: 10,
      Tt: 2.5,
      enabled: true
    },
    balanceado: {
      name: 'Balanceado',
      description: 'Respuesta equilibrada',
      kp: 2.0,
      ki: 0.2,
      kd: 5.0,
      N: 10,
      Tt: 2.5,
      enabled: true
    },
    agresivo: {
      name: 'Agresivo',
      description: 'Respuesta rápida pero puede oscilar',
      kp: 5.0,
      ki: 0.5,
      kd: 10.0,
      N: 10,
      Tt: 2.0,
      enabled: true
    }
  },
  
  // Presets de planta
  plant: {
    horno_industrial: {
      name: 'Horno Industrial',
      description: 'Horno industrial de gran tamaño (hasta 200°C)',
      K: 175.0,    // Puede alcanzar 200°C (25 + 175)
      tau: 360,    // 6 minutos - mucha inercia térmica
      L: 25,       // 25 segundos - retardo grande por tamaño
      T_amb: 25,
      mode: 'horno' as const
    },
    horno_compacto: {
      name: 'Horno Compacto',
      description: 'Horno de laboratorio compacto y preciso (hasta 100°C)',
      K: 75.0,     // Puede alcanzar 100°C (25 + 75)
      tau: 45,     // 45 segundos - respuesta rápida
      L: 3,        // 3 segundos - muy preciso
      T_amb: 25,
      mode: 'horno' as const
    },
    chiller_industrial: {
      name: 'Chiller Industrial',
      description: 'Sistema de enfriamiento industrial (hasta -40°C)',
      K: -65.0,    // Puede alcanzar -40°C (25 + (-65))
      tau: 90,     // 1.5 minutos - inercia moderada
      L: 10,       // 10 segundos - retardo medio
      T_amb: 25,
      mode: 'chiller' as const
    }
  }
} as const

// ============================================================================
// CONFIGURACIÓN DE UI
// ============================================================================

export const UI_CONFIG = {
  // Configuración de gráficas
  charts: {
    defaultTimeWindow: 60, // segundos
    timeWindows: [30, 60, 300] as const, // 30s, 1min, 5min
    updateRate: 10, // Hz
    maxDataPoints: 1000,
    colors: {
      setpoint: '#3b82f6',    // blue-500
      processVariable: '#10b981', // emerald-500
      output: '#f59e0b',      // amber-500
      error: '#ef4444',       // red-500
    }
  },
  
  // Configuración de controles
  controls: {
    debounceDelay: 100, // ms
    sliderStep: 0.01,
    numberInputStep: 0.1,
    maxDecimals: 3,
  },
  
  // Configuración de métricas
  metrics: {
    updateInterval: 1000, // ms
    displayDecimals: 2,
    units: {
      temperature: '°C',
      time: 's',
      percentage: '%',
      gain: 'adim',
      frequency: 's⁻¹',
    }
  },
  
  // Configuración de tema
  theme: {
    default: 'dark',
    colors: {
      industrial: {
        blue: 'hsl(var(--industrial-blue))',
        orange: 'hsl(var(--industrial-orange))',
        green: 'hsl(var(--industrial-green))',
        panel: 'hsl(var(--industrial-panel))',
        glass: 'hsl(var(--industrial-glass))'
      }
    }
  }
} as const

// ============================================================================
// CONFIGURACIÓN DE EXPORTACIÓN
// ============================================================================

export const EXPORT_CONFIG = {
  csv: {
    defaultFilename: 'pid-simulation-data',
    dateFormat: 'YYYY-MM-DD_HH-mm-ss',
    separator: ',',
    decimalSeparator: '.',
    includeHeaders: true,
    maxRows: 100000,
  },
  
  formats: {
    supported: ['csv'] as const,
    default: 'csv',
  }
} as const

// ============================================================================
// CONFIGURACIÓN DE VALIDACIÓN
// ============================================================================

export const VALIDATION_CONFIG = {
  // Validación de entrada
  input: {
    temperature: {
      min: -273,
      max: 1000,
      decimals: 1,
    },
    time: {
      min: 0,
      max: 3600,
      decimals: 1,
    },
    gain: {
      min: 0,
      max: 100,
      decimals: 3,
    },
  },
  
  // Mensajes de error
  messages: {
    invalidTemperature: 'Temperatura debe estar entre -273°C y 1000°C',
    invalidTime: 'Tiempo debe ser mayor a 0 y menor a 1 hora',
    invalidGain: 'Ganancia debe ser mayor a 0 y menor a 100',
    simulationError: 'Error en la simulación',
    workerError: 'Error en el worker de simulación',
  }
} as const

// ============================================================================
// CONFIGURACIÓN COMPLETA
// ============================================================================

export const APP_CONFIG = {
  dev: DEV_CONFIG,
  simulation: SIMULATION_CONFIG,
  pid: PID_CONFIG,
  plant: PLANT_CONFIG,
  presets: PRESETS,
  ui: UI_CONFIG,
  export: EXPORT_CONFIG,
  validation: VALIDATION_CONFIG,
} as const

// ============================================================================
// TIPOS DE CONFIGURACIÓN
// ============================================================================

export type AppConfig = typeof APP_CONFIG
export type SimulationConfig = typeof SIMULATION_CONFIG
export type PIDConfig = typeof PID_CONFIG
export type PlantConfig = typeof PLANT_CONFIG
export type UIConfig = typeof UI_CONFIG

// ============================================================================
// UTILIDADES DE CONFIGURACIÓN
// ============================================================================

/**
 * Obtiene configuración específica del entorno
 */
export function getConfig<T extends keyof AppConfig>(key: T): AppConfig[T] {
  return APP_CONFIG[key]
}

/**
 * Valida que un valor esté dentro de los límites configurados
 */
export function validateValue(
  value: number,
  limits: { min: number; max: number },
  name: string
): { valid: boolean; error?: string } {
  if (value < limits.min || value > limits.max) {
    return {
      valid: false,
      error: `${name} debe estar entre ${limits.min} y ${limits.max}`
    }
  }
  return { valid: true }
}

/**
 * Obtiene el valor por defecto de un parámetro
 */
export function getDefaultValue<T extends keyof PIDConfig['limits'] | keyof PlantConfig['limits']>(
  category: 'pid' | 'plant',
  parameter: T
): number {
  if (category === 'pid') {
    return PID_CONFIG.limits[parameter as keyof PIDConfig['limits']].default
  } else {
    return PLANT_CONFIG.limits[parameter as keyof PlantConfig['limits']].default
  }
}

export default APP_CONFIG
