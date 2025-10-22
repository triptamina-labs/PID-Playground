
/**
 * SimulationProvider - Context Provider para la simulación PID
 * 
 * Gestiona el estado global de la simulación y proporciona una API limpia
 * para que los componentes interactúen con el Worker de simulación.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { WorkerManager, type WorkerManagerCallbacks } from '../lib/simulation/worker-manager'
import type {
  SimulationBuffer,
  PerformanceMetrics,
  SetPIDCommand,
  SetPlantCommand,
  TickEvent,
  StateEvent,
  ReadyEvent,
  ErrorEvent
} from '../lib/simulation/types'
import html2canvas from 'html2canvas'

// ============================================================================
// TIPOS DEL CONTEXTO
// ============================================================================

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
  getWorkerStatus: () => import('../lib/simulation/worker-manager').WorkerManagerStatus

  // Exportación de gráficas
  exportCharts: (range: { type: 'window'; seconds: number } | { type: 'all' }) => void
}

export interface SimulationContextValue {
  state: SimulationContextState
  actions: SimulationContextActions
}

import { SIMULATION_CONFIG } from '../config/app.config'

// ============================================================================
// FUNCIÓN DE CAPTURA DE GRÁFICAS
// ============================================================================

async function captureElementAsCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false
  })
}

function downloadCanvasAsImage(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      console.log(`✅ Gráficas combinadas exportadas: ${filename}`)
    }
  }, 'image/png')
}

export interface SimulationProviderProps {
  children: React.ReactNode
  config?: {
    timestep?: number
    bufferSize?: number
    debugMode?: boolean
    workerPath?: string
  }
}

// ============================================================================
// CONTEXTO
// ============================================================================

const SimulationContext = createContext<SimulationContextValue | null>(null)

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function SimulationProvider({ children, config = {} }: SimulationProviderProps) {
  // Referencias
  const workerManagerRef = useRef<WorkerManager | null>(null)
  const isInitializingRef = useRef(false)
  
  // Estado local
  const [state, setState] = useState<SimulationContextState>({
    isConnected: false,
    isInitialized: false,
    isRunning: false,
    workerState: 'initializing',
    currentData: null,
    buffer: [],
    performance: {
      avg_cycle_time: 0,
      max_cycle_time: 0,
      cpu_usage_estimate: 0,
      uptime: 0,
      samples_processed: 0
    },
    lastError: null,
    metrics: null,
    config: {
      timestep: config.timestep || SIMULATION_CONFIG.worker.defaultTimestep,
      bufferSize: config.bufferSize || SIMULATION_CONFIG.worker.defaultBufferSize,
      debugMode: config.debugMode || false
    }
  })

  // ============================================================================
  // CALLBACKS DEL WORKER
  // ============================================================================

  const workerCallbacks: WorkerManagerCallbacks = {
    onReady: useCallback((data: ReadyEvent['payload']) => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isInitialized: true,
        workerState: 'ready',
        lastError: null
      }))
      
      if (config.debugMode) {
        console.log('Simulación lista:', data)
      }
    }, [config.debugMode]),

    onTick: useCallback((data: TickEvent['payload']) => {
      setState(prev => ({
        ...prev,
        currentData: data,
        buffer: workerManagerRef.current?.getBufferData() || []
      }))
    }, []),

    onState: useCallback((data: StateEvent['payload']) => {
      setState(prev => ({
        ...prev,
        workerState: data.state,
        isRunning: data.state === 'running',
        performance: {
          avg_cycle_time: data.performance.avg_cycle_time,
          max_cycle_time: data.performance.max_cycle_time,
          cpu_usage_estimate: data.performance.cpu_usage_estimate,
          // FIX: uptime y samples_processed están al nivel raíz del payload, no dentro de performance
          uptime: data.uptime || 0,
          samples_processed: data.samples_processed || 0
        }
      }))
    }, []),

    onMetrics: useCallback((data) => {
      setState(prev => ({
        ...prev,
        metrics: data
      }))
    }, []),

    onError: useCallback((data: ErrorEvent['payload']) => {
      setState(prev => ({
        ...prev,
        lastError: data,
        isConnected: data.severity !== 'critical',
        isInitialized: data.severity !== 'critical'
      }))
      
      console.error(`Error de simulación [${data.severity}]:`, data.message)
      
      if (data.suggestions) {
        console.log('Sugerencias:', data.suggestions)
      }
    }, []),

    onConnectionLost: useCallback(() => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        isRunning: false,
        workerState: 'error'
      }))
      
      console.error('Conexión con Worker perdida')
    }, [])
  }

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  useEffect(() => {
    const initializeWorker = async () => {
      if (isInitializingRef.current || workerManagerRef.current) {
        return
      }
      
      isInitializingRef.current = true
      
      try {
        // Crear WorkerManager
        workerManagerRef.current = new WorkerManager({
          timestep: config.timestep,
          bufferSize: config.bufferSize,
          debugMode: config.debugMode,
          workerPath: config.workerPath
        })
        
        // Configurar callbacks
        workerManagerRef.current.setCallbacks(workerCallbacks)
        
        // Inicializar
        await workerManagerRef.current.initialize()
        
      } catch (error) {
        console.error('Error inicializando WorkerManager:', error)
        setState(prev => ({
          ...prev,
          lastError: {
            severity: 'critical',
            code: 'INIT_002',
            message: `Error inicializando simulación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            timestamp: performance.now(),
            recoverable: false
          }
        }))
      } finally {
        isInitializingRef.current = false
      }
    }

    initializeWorker()

    // Cleanup al desmontar
    return () => {
      if (workerManagerRef.current) {
        workerManagerRef.current.destroy()
        workerManagerRef.current = null
      }
      isInitializingRef.current = false
    }
  }, []) // Solo ejecutar una vez

  // ============================================================================
  // ACCIONES
  // ============================================================================

  const actions: SimulationContextActions = {
    start: useCallback(async () => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.start()
    }, []),

    pause: useCallback(async () => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.pause()
    }, []),

    reset: useCallback(async (preserveParams = false) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      
      // Limpiar estado local ANTES del reset
      setState(prev => ({
        ...prev,
        currentData: null,
        buffer: [],
        metrics: {
          overshoot: 0,
          t_peak: 0,
          settling_time: 0,
          is_calculating: false,
          sp_previous: 0,
          pv_max: 0,
          pv_min: 0,
          t_start: 0,
          t_current: 0,
          samples_count: 0
        }
      }))
      
      await workerManagerRef.current.reset(preserveParams)
    }, []),

    setPID: useCallback(async (params: SetPIDCommand['payload']) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.setPID(params)
    }, []),

    setPlant: useCallback(async (params: SetPlantCommand['payload']) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.setPlant(params)
    }, []),

    setSetpoint: useCallback(async (value: number, rampRate?: number) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.setSetpoint(value, rampRate)
    }, []),

    setNoise: useCallback(async (enabled: boolean, sigma = 0, seed?: number) => {
      if (!workerManagerRef.current) {
        throw new Error('Worker no inicializado')
      }
      await workerManagerRef.current.setNoise(enabled, sigma, seed)
    }, []),

    getWindowData: useCallback((windowSeconds: number) => {
      if (!workerManagerRef.current) {
        return []
      }
      return workerManagerRef.current.getWindowData(windowSeconds)
    }, []),

    clearBuffer: useCallback(() => {
      if (workerManagerRef.current) {
        workerManagerRef.current.clearBuffer()
      }
      setState(prev => ({
        ...prev,
        buffer: []
      }))
    }, []),

    clearError: useCallback(() => {
      setState(prev => ({
        ...prev,
        lastError: null
      }))
    }, []),

    getWorkerStatus: useCallback(() => {
      if (!workerManagerRef.current) {
        return {
          connected: false,
          workerState: 'error' as const,
          lastTick: 0,
          performance: {
            avg_cycle_time: 0,
            max_cycle_time: 0,
            cpu_usage_estimate: 0,
            uptime: 0,
            samples_processed: 0
          }
        }
      }
      return workerManagerRef.current.getStatus()
    }, []),

    exportCharts: useCallback((range) => {
      setTimeout(async () => {
        try {
          const elements = document.querySelectorAll('.recharts-wrapper')
          console.log(`🔍 Encontrados ${elements.length} elementos .recharts-wrapper`)
          
          if (elements.length < 2) {
            console.warn(`❌ No se encontraron suficientes gráficas. Encontradas: ${elements.length}`)
            return
          }

          // Capturar ambas gráficas
          const [tempCanvas, outputCanvas] = await Promise.all([
            captureElementAsCanvas(elements[0] as HTMLElement),
            captureElementAsCanvas(elements[1] as HTMLElement)
          ])

          // Crear canvas combinado
          const combinedCanvas = document.createElement('canvas')
          const ctx = combinedCanvas.getContext('2d')
          
          if (!ctx) {
            console.error('❌ No se pudo obtener el contexto del canvas')
            return
          }

          // Configurar dimensiones
          const maxWidth = Math.max(tempCanvas.width, outputCanvas.width)
          const totalHeight = tempCanvas.height + outputCanvas.height + 20
          
          combinedCanvas.width = maxWidth
          combinedCanvas.height = totalHeight

          // Dibujar gráficas
          ctx.fillStyle = '#0f172a'
          ctx.fillRect(0, 0, maxWidth, totalHeight)
          ctx.drawImage(tempCanvas, 0, 0)
          ctx.drawImage(outputCanvas, 0, tempCanvas.height + 20)

          // Generar nombre y descargar
          const nowIso = new Date().toISOString().replace(/[:.]/g, '-')
          const windowSuffix = range.type === 'all' ? 'all' : `${range.seconds}s`
          const filename = `pid-playground-charts-${windowSuffix}-${nowIso}.png`
          
          downloadCanvasAsImage(combinedCanvas, filename)
          
        } catch (error) {
          console.error('❌ Error capturando gráficas combinadas:', error)
        }
      }, 100)
    }, [state.config.bufferSize, state.config.timestep])
  }

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: SimulationContextValue = {
    state,
    actions
  }

  return (
    <SimulationContext.Provider value={contextValue}>
      {children}
    </SimulationContext.Provider>
  )
}

// ============================================================================
// HOOK PERSONALIZADO
// ============================================================================

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext)
  
  if (!context) {
    throw new Error('useSimulation debe usarse dentro de un SimulationProvider')
  }
  
  return context
}

// ============================================================================
// HOOKS ESPECIALIZADOS
// ============================================================================

/**
 * Hook para obtener solo el estado actual de simulación
 */
export function useSimulationData() {
  const { state } = useSimulation()
  return {
    currentData: state.currentData,
    buffer: state.buffer,
    isRunning: state.isRunning,
    isConnected: state.isConnected
  }
}

/**
 * Hook para obtener solo las acciones de control
 */
export function useSimulationControls() {
  const { actions, state } = useSimulation()
  return {
    ...actions,
    isConnected: state.isConnected,
    isRunning: state.isRunning,
    workerState: state.workerState
  }
}

/**
 * Hook para obtener solo las métricas de rendimiento
 */
export function useSimulationPerformance() {
  const { state } = useSimulation()
  return {
    performance: state.performance,
    lastError: state.lastError,
    workerState: state.workerState
  }
}
