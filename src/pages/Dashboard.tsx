import { useState, useEffect, useCallback, useRef } from "react";
import html2canvas from 'html2canvas';
import { Header } from "@/components/Header";
import { UnifiedControlPanel } from "@/components/UnifiedControlPanel";
import { ChartsPanel } from "@/components/ChartsPanel";
import { ChartPVSP } from "@/components/ChartPVSP";
import { ChartOutput } from "@/components/ChartOutput";
import { SimulatorState, ChartDataPoint, TimeWindow } from "@/lib/types";
import { useSimulation, useSimulationData, useSimulationControls } from "@/components/SimulationProvider";

const initialState: SimulatorState = {
  mode: 'horno',
  setpoint: 25,
  pid: {
    kp: 2.00,
    ki: 0.10,
    kd: 10
  },
  plant: {
    k: 75.0,    // Horno Compacto (preset por defecto)
    tau: 45,    // 45 segundos - respuesta rápida
    l: 3,       // 3 segundos - muy preciso
    t_amb: 25   // Temperatura ambiente
  },
  noise: {
    enabled: false,
    intensity: 0.2
  },
  ssr: {
    enabled: false,
    period: 2
  },
  timeWindow: 60
};

export const Dashboard = () => {
  const [state, setState] = useState<SimulatorState>(initialState);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { state: simState, actions } = useSimulation();
  const { currentData, buffer } = useSimulationData();
  const controls = useSimulationControls();
  const exportRef = useRef<HTMLDivElement>(null);

  // Mapear buffer del Worker a datos de charts con ventana FIFO
  useEffect(() => {
    // Si no hay buffer o está vacío, limpiar chartData
    if (!buffer || buffer.length === 0) {
      setChartData([]);
      return;
    }
    
    // Obtener datos de la ventana de tiempo seleccionada
    const windowData = actions.getWindowData(state.timeWindow);
    
    // Si no hay datos en la ventana, limpiar chartData
    if (windowData.length === 0) {
      setChartData([]);
      return;
    }
    
    // Transformar datos: tiempo absoluto -> tiempo relativo al momento actual
    const mapped: ChartDataPoint[] = windowData.map(d => {
      // Calcular tiempo relativo al momento actual: 0s = actual, valores negativos = pasado
      const currentTime = windowData[windowData.length - 1]?.t || 0;
      const timeFromCurrent = d.t - currentTime;
      
      return {
        time: timeFromCurrent,
        pv: d.PV,
        sp: d.SP,
        output: d.u * 100
      };
    });
    
    setChartData(mapped);
  }, [buffer, state.timeWindow, actions]);

  // Función de exportar a PNG
  const handleExportClick = useCallback(async () => {
    if (!exportRef.current || !buffer || buffer.length === 0) {
      console.warn('No hay datos para exportar')
      return
    }

    try {
      // Mostrar el contenedor temporalmente
      exportRef.current.style.display = 'block'
      
      // Esperar a que se renderice
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Capturar la imagen
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#080808', // --notion-bg en dark mode (hsl(0 0% 3%))
        scale: 2, // Mayor resolución
        logging: false,
        width: 1200,
        height: 800
      })
      
      // Ocultar el contenedor nuevamente
      exportRef.current.style.display = 'none'
      
      // Convertir a blob y descargar
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
          link.download = `pid-simulation-${timestamp}.png`
          link.href = url
          link.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    } catch (error) {
      console.error('Error al exportar:', error)
      // Asegurar que el contenedor se oculte incluso si hay error
      if (exportRef.current) {
        exportRef.current.style.display = 'none'
      }
    }
  }, [buffer, state])

  const handleStateChange = useCallback((updates: Partial<SimulatorState>) => {
    setState(prev => {
      const next = { ...prev, ...updates };

      // Mapear cambios a acciones del Worker
      // 1) Setpoint
      if (typeof updates.setpoint === 'number') {
        actions.setSetpoint(updates.setpoint).catch(console.error);
      }

      // 2) PID (enviar payload completo tras merge)
      if (updates.pid) {
        const pid = { ...prev.pid, ...updates.pid };
        actions.setPID({ kp: pid.kp, ki: pid.ki, kd: pid.kd }).catch(console.error);
      }

      // 3) Planta y modo (mapear k->K, l->L, t_amb->T_amb)
      if (updates.plant || typeof updates.mode === 'string') {
        const plant = { ...prev.plant, ...(updates.plant || {}) };
        const mode = (typeof updates.mode === 'string' ? updates.mode : prev.mode) as 'horno' | 'chiller';
        actions.setPlant({
          K: plant.k,
          tau: plant.tau,
          L: plant.l,
          T_amb: plant.t_amb,
          mode
        }).catch(console.error);
      }

      // 4) Ruido (intensity -> sigma)
      if (updates.noise) {
        const noise = { ...prev.noise, ...updates.noise };
        actions.setNoise(Boolean(noise.enabled), Number(noise.intensity || 0)).catch(console.error);
      }

      // 5) SSR: no soportado en Worker aún → sin comando (UI local)

      return next;
    });
  }, [actions]);

  // Atajos de teclado: S (start/pause), R (reset), ↑↓ (setpoint), ←→ (ventana)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      
      // Start/Pause with S
      if (e.key === 's' || e.key === 'S') {
        if (controls.isRunning) {
          actions.pause().catch(console.error);
        } else {
          actions.start().catch(console.error);
        }
      }
      
      // Reset with R
      if (e.key === 'r' || e.key === 'R') {
        actions.reset(true).catch(console.error);
      }
      
      // Modify setpoint with up/down arrows
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        
        const currentSP = state.setpoint;
        const step = e.shiftKey ? 1 : 0.1;
        
        let newSP: number;
        if (e.key === 'ArrowUp') {
          newSP = currentSP + step;
        } else {
          newSP = currentSP - step;
        }
        
        if (state.mode === 'horno') {
          newSP = Math.max(0, Math.min(200, newSP));
        } else {
          newSP = Math.max(-50, Math.min(50, newSP));
        }
        
        // Redondear a 1 decimal para evitar problemas de punto flotante
        newSP = Math.round(newSP * 10) / 10;
        
        handleStateChange({ setpoint: newSP });
      }
      
      // Modify time window with left/right arrows
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        
        const currentWindow = state.timeWindow;
        const availableWindows: TimeWindow[] = [60, 300, 1800];
        const currentIndex = availableWindows.indexOf(currentWindow);
        
        let newIndex: number;
        if (e.key === 'ArrowRight') {
          newIndex = Math.min(availableWindows.length - 1, currentIndex + 1);
        } else {
          newIndex = Math.max(0, currentIndex - 1);
        }
        
        const newWindow = availableWindows[newIndex];
        
        if (newWindow !== currentWindow) {
          handleStateChange({ timeWindow: newWindow });
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [actions, controls.isRunning, state.setpoint, state.mode, state.timeWindow, handleStateChange]);

  // Callback para detectar cuando el header se expande/comprime con animación
  const handleHeaderStateChange = useCallback((expanded: boolean) => {
    setIsTransitioning(true);
    setIsHeaderExpanded(expanded);
    
    // Permitir que la animación se complete antes de permitir otra transición
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // Duración de la transición más un pequeño buffer
  }, []);

  return (
    <div className="dark h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header con altura fija y animación */}
      <div className="flex-shrink-0 z-50 transition-all duration-500 ease-in-out">
        <Header 
          state={state} 
          onStateChange={handleStateChange}
          onExpansionChange={handleHeaderStateChange}
          onExportClick={handleExportClick}
          canExport={buffer !== null && buffer.length > 0}
        />
      </div>
      
      {/* Contenido principal con layout dinámico y animaciones */}
      <div className={`flex-1 min-h-0 relative ${isHeaderExpanded ? 'lg:overflow-hidden overflow-y-auto' : ''}`}>
        {/* Overlay de transición para suavizar cambios */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 transition-opacity duration-300 ease-in-out" />
        )}
        
        {/* Layout expandido con animaciones */}
        <div 
          className={`lg:absolute lg:inset-0 transition-all duration-500 ease-in-out ${
            isHeaderExpanded 
              ? 'opacity-100 translate-y-0 block' 
              : 'opacity-0 -translate-y-4 pointer-events-none hidden'
          }`}
        >
          <div className="h-auto lg:h-full flex flex-col lg:flex-row gap-3 p-3 lg:gap-4 lg:p-4 pb-4 lg:pb-4">
            {/* Contenedor centrado con ancho máximo igual al header */}
            <div className="w-full max-w-full sm:max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-3 lg:gap-4 h-auto lg:h-full">
            {/* Panel de control lateral con animación de entrada */}
            <div className="flex-shrink-0 w-full lg:w-80 xl:w-96 animate-in slide-in-from-left-4 duration-500">
              <UnifiedControlPanel 
                state={state} 
                onStateChange={handleStateChange}
                onReset={() => actions.reset(true)}
                onExport={(range) => actions.exportCharts(range)}
                metrics={simState.metrics || {
                  overshoot: 0,
                  t_peak: 0,
                  settling_time: 0,
                  is_calculating: false,
                  sp_previous: 0,
                  pv_max: -Infinity,
                  pv_min: Infinity,
                  t_start: 0,
                  t_current: 0,
                  samples_count: 0
                }}
                currentPV={chartData.length > 0 ? chartData[chartData.length - 1]?.pv || 0 : 0}
              />
            </div>
            
                         {/* Panel de gráficas con animación de entrada */}
             <div className="flex-1 min-h-[400px] lg:min-h-0 animate-in slide-in-from-right-4 duration-500 delay-100">
               <ChartsPanel data={chartData} timeWindow={state.timeWindow} isRunning={controls.isRunning} />
             </div>
            </div>
          </div>
        </div>
        
        {/* Layout comprimido con animaciones */}
        <div 
          className={`lg:absolute lg:inset-0 transition-all duration-500 ease-in-out ${
            !isHeaderExpanded 
              ? 'opacity-100 translate-y-0 block' 
              : 'opacity-0 translate-y-4 pointer-events-none hidden'
          }`}
        >
          <div className="h-auto lg:h-full flex flex-col gap-2 p-1 sm:p-2">
            {/* Contenedor centrado con ancho máximo igual al header */}
            <div className="w-full max-w-full sm:max-w-[1200px] mx-auto flex flex-col gap-1 sm:gap-2 h-auto lg:h-full">
              {/* Panel de control con animación de entrada - altura fija */}
              <div className="flex-shrink-0 w-full animate-in slide-in-from-top-4 duration-500">
                <UnifiedControlPanel 
                  state={state} 
                  onStateChange={handleStateChange}
                  onReset={() => actions.reset(true)}
                  onExport={(range) => actions.exportCharts(range)}
                  metrics={simState.metrics || {
                    overshoot: 0,
                    t_peak: 0,
                    settling_time: 0,
                    is_calculating: false,
                    sp_previous: 0,
                    pv_max: -Infinity,
                    pv_min: Infinity,
                    t_start: 0,
                    t_current: 0,
                    samples_count: 0
                  }}
                  currentPV={chartData.length > 0 ? chartData[chartData.length - 1]?.pv || 0 : 0}
                  compact={true}
                />
              </div>
              
                             {/* Panel de gráficas con animación de entrada - altura restante */}
               <div className="flex-1 min-h-[400px] lg:min-h-0 animate-in slide-in-from-bottom-4 duration-500 delay-150">
                 <ChartsPanel data={chartData} timeWindow={state.timeWindow} isRunning={controls.isRunning} />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenedor oculto para exportar gráficas */}
      <div 
        ref={exportRef} 
        className="dark"
        style={{ 
          display: 'none',
          position: 'fixed',
          top: -10000,
          left: -10000,
          width: '1200px',
          height: '800px',
          backgroundColor: 'hsl(0 0% 3%)', // --notion-bg
          padding: '40px',
          zIndex: -1
        }}
      >
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Título */}
          <div style={{ 
            color: 'hsl(0 0% 98%)', // --notion-text
            fontSize: '24px', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            marginBottom: '10px' 
          }}>
            PID Playground - Simulación
          </div>
          
          {/* Gráfica de Temperatura (arriba) */}
          <div style={{ 
            flex: 1, 
            minHeight: 0, 
            backgroundColor: 'hsl(0 0% 4%)', // --notion-surface
            border: '1px solid hsl(0 0% 8%)', // --notion-border
            borderRadius: '8px', 
            padding: '20px' 
          }}>
            <div style={{ 
              color: 'hsl(0 0% 98%)', // --notion-text
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '10px' 
            }}>
              Temperatura (PV/SP)
            </div>
            <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
              {buffer && buffer.length > 0 && (
                <ChartPVSP 
                  data={buffer.map(d => ({
                    time: d.t - (buffer[buffer.length - 1]?.t || 0),
                    pv: d.PV,
                    sp: d.SP,
                    output: d.u * 100
                  }))} 
                  embedded 
                  timeWindow={state.timeWindow}
                />
              )}
            </div>
          </div>
          
          {/* Gráfica de Salida (abajo) */}
          <div style={{ 
            flex: 1, 
            minHeight: 0, 
            backgroundColor: 'hsl(0 0% 4%)', // --notion-surface
            border: '1px solid hsl(0 0% 8%)', // --notion-border
            borderRadius: '8px', 
            padding: '20px' 
          }}>
            <div style={{ 
              color: 'hsl(0 0% 98%)', // --notion-text
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '10px' 
            }}>
              Salida de Control (%)
            </div>
            <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
              {buffer && buffer.length > 0 && (
                <ChartOutput 
                  data={buffer.map(d => ({
                    time: d.t - (buffer[buffer.length - 1]?.t || 0),
                    pv: d.PV,
                    sp: d.SP,
                    output: d.u * 100
                  }))} 
                  embedded 
                  timeWindow={state.timeWindow}
                />
              )}
            </div>
          </div>
          
          {/* Footer con información */}
          <div style={{ 
            color: 'hsl(0 0% 65%)', // --notion-text-secondary
            fontSize: '11px', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div>
              <strong style={{ color: 'hsl(0 0% 98%)' }}>Exportado:</strong> {new Date().toLocaleString('es-ES')} | 
              <strong style={{ color: 'hsl(0 0% 98%)' }}> Modo:</strong> {state.mode === 'horno' ? 'Horno' : 'Chiller'}
            </div>
            <div>
              <strong style={{ color: 'hsl(0 0% 98%)' }}>PID:</strong> Kp = {state.pid.kp.toFixed(2)} | 
              Ki = {state.pid.ki.toFixed(3)} s⁻¹ | 
              Kd = {state.pid.kd.toFixed(1)} s | 
              <strong style={{ color: 'hsl(0 0% 98%)' }}> SP:</strong> {state.setpoint.toFixed(1)}°C
            </div>
            <div>
              <strong style={{ color: 'hsl(0 0% 98%)' }}>Planta:</strong> K = {state.plant.k.toFixed(1)}°C | 
              τ = {state.plant.tau.toFixed(1)}s | 
              L = {state.plant.l.toFixed(1)}s | 
              T_amb = {state.plant.t_amb.toFixed(1)}°C
            </div>
            <div style={{ 
              marginTop: '8px', 
              paddingTop: '8px', 
              borderTop: '1px solid hsl(0 0% 8%)',
              fontSize: '10px',
              color: 'hsl(0 0% 55%)'
            }}>
              Simulación generada por PID Playground (Desarrollado por Tripta Labs Co.)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
