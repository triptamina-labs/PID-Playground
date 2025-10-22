
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Thermometer,
  Snowflake,
  Clock,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react'
import { SimulatorState } from '@/lib/types'
import { useSimulation, useSimulationData, useSimulationControls } from './SimulationProvider'

interface MetricsData {
  overshoot: number;
  t_peak: number;
  is_calculating: boolean;
  sp_previous: number;
  pv_max: number;
  pv_min: number;
  t_start: number;
  t_current: number;
  samples_count: number;
}

interface UnifiedControlPanelProps {
  state: SimulatorState;
  onStateChange: (updates: Partial<SimulatorState>) => void;
  onReset: () => void;
  onExport: (range: { type: 'window'; seconds: number } | { type: 'all' }) => void;
  metrics: MetricsData;
  currentPV: number;
  compact?: boolean;
}

export const UnifiedControlPanel = ({ 
  state, 
  onStateChange, 
  onReset, 
  onExport,
  metrics,
  currentPV,
  compact = false
}: UnifiedControlPanelProps) => {
  const { state: simState } = useSimulation()
  const { currentData, isRunning, isConnected } = useSimulationData()
  const { start, pause, reset } = useSimulationControls()

  // Handlers
  const handleStart = async () => {
    try {
      await start()
    } catch (error) {
      console.error('Error iniciando simulación:', error)
    }
  }

  const handlePause = async () => {
    try {
      await pause()
    } catch (error) {
      console.error('Error pausando simulación:', error)
    }
  }

  const handleReset = async () => {
    try {
      await reset()
      onReset()
    } catch (error) {
      console.error('Error reseteando simulación:', error)
    }
  }

  // Status helpers
  const getConnectionStatus = () => {
    if (!isConnected) {
      return {
        variant: 'destructive' as const,
        icon: <AlertCircle className="h-3 w-3" />,
        text: 'Desconectado'
      }
    }
    
    if (!simState.isInitialized) {
      return {
        variant: 'secondary' as const,
        icon: <Clock className="h-3 w-3" />,
        text: 'Inicializando'
      }
    }
    
    return {
      variant: 'default' as const,
      icon: <CheckCircle className="h-3 w-3" />,
      text: 'Conectado'
    }
  }

  const connectionStatus = getConnectionStatus()

  // Format helpers
  const formatOvershoot = (overshoot: number) => {
    if (overshoot === 0) return "0%";
    return `${overshoot.toFixed(1)}%`;
  }

  const formatTime = (time: number) => {
    if (time === 0) return "N/A";
    return `${time.toFixed(1)}s`;
  }

  const formatTemperature = (temp: number) => {
    return `${temp.toFixed(1)}°C`;
  }

  const getOvershootColor = (overshoot: number) => {
    if (overshoot === 0) return "bg-gray-500";
    if (overshoot < 5) return "bg-green-500";
    if (overshoot < 15) return "bg-yellow-500";
    if (overshoot < 30) return "bg-orange-500";
    return "bg-red-500";
  }

  return (
    <Card className={`notion-panel ${compact ? 'h-auto' : 'h-full flex flex-col'} transition-all duration-300 ease-in-out`}>
      <CardHeader className={`flex-shrink-0 ${compact ? 'pb-2' : 'pb-3'} transition-all duration-200 ease-in-out`}>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[hsl(var(--notion-blue))] transition-transform duration-200" />
            <span className="font-semibold text-[hsl(var(--notion-text))]">Panel de Control</span>
          </div>
          <Badge variant={connectionStatus.variant} className="flex items-center gap-1 text-xs h-5 px-2 transition-all duration-200 ease-in-out notion-badge">
            {connectionStatus.icon}
            {connectionStatus.text}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className={`${compact ? 'p-3 sm:p-4 pt-0' : 'flex-1 min-h-0 overflow-y-auto p-4 pt-0'} space-y-3 sm:space-y-4 transition-all duration-300 ease-in-out`}>
        {compact ? (
          // Layout compacto responsive con animaciones
          <div className="space-y-3 sm:space-y-4">
            {/* Controles principales - siempre visibles en móvil */}
            <div className="animate-in slide-in-from-left-2 duration-500 delay-100">
              <h4 className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 sm:mb-2">Controles</h4>
              <div className="grid grid-cols-3 gap-2 sm:gap-2">
                                 <Button
                   onClick={handleStart}
                   disabled={!isConnected || isRunning}
                   size="sm"
                   className="flex items-center justify-center h-8 sm:h-9 text-[10px] sm:text-xs transition-all duration-200 active:scale-95 notion-button-primary"
                 >
                   <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                   <span className="hidden sm:inline ml-1">Iniciar</span>
                 </Button>
                 
                 <Button
                   onClick={handlePause}
                   disabled={!isConnected || !isRunning}
                   variant="outline"
                   size="sm"
                   className="flex items-center justify-center h-8 sm:h-9 text-[10px] sm:text-xs transition-all duration-200 active:scale-95 notion-button"
                 >
                   <Pause className="h-3 w-3 sm:h-4 sm:w-4" />
                   <span className="hidden sm:inline ml-1">Pausar</span>
                 </Button>
                 
                 <Button
                   onClick={handleReset}
                   disabled={!isConnected}
                   variant="outline"
                   size="sm"
                   className="flex items-center justify-center h-8 sm:h-9 text-[10px] sm:text-xs transition-all duration-200 active:scale-95 notion-button"
                 >
                   <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                   <span className="hidden sm:inline ml-1">Reset</span>
                 </Button>
              </div>
            </div>

            {/* Contenido scrolleable en móvil - oculto por defecto en móvil */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3 lg:gap-4 animate-in fade-in-0 duration-500">
                {/* Estado actual */}
                <div className="space-y-2 sm:space-y-2 animate-in slide-in-from-left-2 duration-500 delay-200">
                  <h4 className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</h4>
                  <div className="space-y-1 text-[10px] sm:text-xs">
                                     <div className="flex justify-between items-center transition-all duration-200 hover:bg-[hsl(var(--notion-accent))] rounded px-1 py-0.5">
                       <span className="text-[hsl(var(--notion-text-secondary))]">Modo:</span>
                       <Badge variant={state.mode === 'horno' ? 'default' : 'secondary'} className="h-6 w-6 p-0 transition-all duration-200 notion-badge flex items-center justify-center">
                         {state.mode === 'horno' ? (
                           <Thermometer className="w-4 h-4" />
                         ) : (
                           <Snowflake className="w-4 h-4" />
                         )}
                       </Badge>
                     </div>
                     <div className="flex justify-between items-center transition-all duration-200 hover:bg-[hsl(var(--notion-accent))] rounded px-1 py-0.5">
                       <span className="text-[hsl(var(--notion-text-secondary))]">SP:</span>
                       <span className="font-mono font-semibold text-[hsl(var(--notion-text))]">{state.setpoint.toFixed(1)}°C</span>
                     </div>
                     <div className="flex justify-between items-center transition-all duration-200 hover:bg-[hsl(var(--notion-accent))] rounded px-1 py-0.5">
                       <span className="text-[hsl(var(--notion-text-secondary))]">PV:</span>
                       <span className="font-mono font-semibold text-[hsl(var(--notion-text))]">{formatTemperature(currentPV)}</span>
                     </div>
                  </div>
                </div>

                {/* Métricas */}
                <div className="space-y-2 sm:space-y-2 animate-in slide-in-from-left-2 duration-500 delay-300">
                  <h4 className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Métricas</h4>
                  <div className="space-y-1 text-[10px] sm:text-xs">
                                     <div className="flex justify-between items-center transition-all duration-200 hover:bg-[hsl(var(--notion-accent))] rounded px-1 py-0.5">
                       <span className="text-[hsl(var(--notion-text-secondary))]">Overshoot:</span>
                       <Badge 
                         variant="outline" 
                         className={`${getOvershootColor(metrics.overshoot)} text-white border-0 text-[10px] sm:text-xs h-4 sm:h-5 px-2 sm:px-2 transition-all duration-200`}
                       >
                         {formatOvershoot(metrics.overshoot)}
                       </Badge>
                     </div>
                     <div className="flex justify-between items-center transition-all duration-200 hover:bg-[hsl(var(--notion-accent))] rounded px-1 py-0.5">
                       <span className="text-[hsl(var(--notion-text-secondary))]">Ventana:</span>
                       <span className="font-mono font-semibold text-[hsl(var(--notion-text))]">
                         {state.timeWindow === 60 ? '1m' : state.timeWindow === 300 ? '5m' : '30m'}
                       </span>
                     </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Área scrolleable para móvil - solo visible en móvil */}
            <div className="sm:hidden">
              <div className="max-h-36 overflow-y-auto mobile-scroll-area border border-[hsl(var(--notion-border))] rounded-md p-3 bg-[hsl(var(--notion-surface))]">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                  {/* Estado compacto para móvil - Columna 1 */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(var(--notion-text-secondary))]">Modo:</span>
                      <Badge variant={state.mode === 'horno' ? 'default' : 'secondary'} className="h-6 w-6 p-0 flex items-center justify-center">
                        {state.mode === 'horno' ? (
                          <Thermometer className="w-4 h-4" />
                        ) : (
                          <Snowflake className="w-4 h-4" />
                        )}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(var(--notion-text-secondary))]">SP:</span>
                      <span className="font-mono font-semibold">{state.setpoint.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(var(--notion-text-secondary))]">PV:</span>
                      <span className="font-mono font-semibold">{formatTemperature(currentPV)}</span>
                    </div>
                  </div>
                  
                  {/* Métricas compactas para móvil - Columna 2 */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(var(--notion-text-secondary))]">Overshoot:</span>
                      <Badge variant="outline" className={`${getOvershootColor(metrics.overshoot)} text-white border-0 text-[10px] h-4 px-2`}>
                        {formatOvershoot(metrics.overshoot)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(var(--notion-text-secondary))]">Ventana:</span>
                      <span className="font-mono font-semibold">
                        {state.timeWindow === 60 ? '1m' : state.timeWindow === 300 ? '5m' : '30m'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Layout normal vertical con animaciones
          <div className="animate-in fade-in-0 duration-500 space-y-4">
            {/* Controles principales */}
            <div className="grid grid-cols-3 gap-2 animate-in slide-in-from-top-4 duration-500 delay-100">
              <Button
                onClick={handleStart}
                disabled={!isConnected || isRunning}
                size="sm"
                className="flex items-center gap-1 h-8 text-xs transition-all duration-200 active:scale-95"
              >
                <Play className="h-3 w-3" />
                Iniciar
              </Button>
              
              <Button
                onClick={handlePause}
                disabled={!isConnected || !isRunning}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 h-8 text-xs transition-all duration-200 active:scale-95"
              >
                <Pause className="h-3 w-3" />
                Pausar
              </Button>
              
              <Button
                onClick={handleReset}
                disabled={!isConnected}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 h-8 text-xs transition-all duration-200 active:scale-95"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>

            <Separator className="animate-in fade-in-0 duration-500 delay-200" />

            {/* Estado actual compacto */}
            <div className="space-y-3 animate-in slide-in-from-top-4 duration-500 delay-300">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado Actual</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-center transition-all duration-200 hover:bg-muted/20 rounded px-2 py-1">
                    <span className="text-muted-foreground">Modo:</span>
                    <Badge variant={state.mode === 'horno' ? 'default' : 'secondary'} className="h-6 w-6 p-0 transition-all duration-200 flex items-center justify-center">
                      {state.mode === 'horno' ? (
                        <Thermometer className="w-4 h-4" />
                      ) : (
                        <Snowflake className="w-4 h-4" />
                      )}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center transition-all duration-200 hover:bg-muted/20 rounded px-2 py-1">
                    <span className="text-muted-foreground">SP:</span>
                    <span className="control-value font-mono font-semibold">{state.setpoint.toFixed(1)}°C</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center transition-all duration-200 hover:bg-muted/20 rounded px-2 py-1">
                    <span className="text-muted-foreground">PV:</span>
                    <span className="control-value font-mono font-semibold">{formatTemperature(currentPV)}</span>
                  </div>
                  <div className="flex justify-between items-center transition-all duration-200 hover:bg-muted/20 rounded px-2 py-1">
                    <span className="text-muted-foreground">Ventana:</span>
                    <span className="control-value font-mono font-semibold">
                      {state.timeWindow === 60 ? '1m' : state.timeWindow === 300 ? '5m' : '30m'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="animate-in fade-in-0 duration-500 delay-400" />

            {/* Métricas de control */}
            <div className="space-y-3 animate-in slide-in-from-top-4 duration-500 delay-500">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Target className="h-3 w-3" />
                Métricas de Control
              </h4>
              
              {/* Estado de cálculo */}
              <div className="flex items-center justify-between p-2 bg-muted/20 rounded-md transition-all duration-200 hover:bg-muted/30">
                <span className="text-xs text-muted-foreground">
                  {metrics.is_calculating ? "Calculando..." : "En espera"}
                </span>
                <Badge 
                  variant={metrics.is_calculating ? "default" : "secondary"}
                  className={`text-xs h-4 px-2 ${metrics.is_calculating ? "bg-blue-500" : ""} transition-all duration-200`}
                >
                  {metrics.is_calculating ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              {/* Overshoot */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs font-medium">Overshoot</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`${getOvershootColor(metrics.overshoot)} text-white border-0 text-xs h-4 px-2 transition-all duration-200`}
                  >
                    {formatOvershoot(metrics.overshoot)}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min(100, metrics.overshoot / 2)} 
                  className="h-1 transition-all duration-500 ease-in-out"
                />
              </div>

            </div>

            <Separator className="animate-in fade-in-0 duration-500 delay-600" />

            {/* Datos en tiempo real */}
            {currentData && (
              <>
                <Separator className="animate-in fade-in-0 duration-500 delay-800" />
                <div className="grid grid-cols-2 gap-2 text-xs animate-in slide-in-from-top-4 duration-500 delay-900">
                  <div className="text-center p-2 bg-muted/20 rounded transition-all duration-200 hover:bg-muted/30">
                    <div className="text-muted-foreground mb-1">Tiempo</div>
                    <div className="font-mono font-semibold">{currentData.t.toFixed(1)}s</div>
                  </div>
                  <div className="text-center p-2 bg-muted/20 rounded transition-all duration-200 hover:bg-muted/30">
                    <div className="text-muted-foreground mb-1">Salida</div>
                    <div className="font-mono font-semibold">{(currentData.u * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </>
            )}

            {/* Atajos de teclado */}
            <div className="pt-2 border-t border-muted/20 animate-in fade-in-0 duration-500 delay-1000">
              <div className="text-[10px] text-muted-foreground space-y-1">
                <div className="flex justify-between items-center">
                  <span><kbd className="text-[9px] bg-muted px-1 rounded transition-all duration-200 hover:bg-muted/80">S</kbd> Start/Pause</span>
                  <span><kbd className="text-[9px] bg-muted px-1 rounded transition-all duration-200 hover:bg-muted/80">R</kbd> Reset</span>
                </div>
                <div className="flex justify-between items-center">
                  <span><kbd className="text-[9px] bg-muted px-1 rounded transition-all duration-200 hover:bg-muted/80">↑/↓</kbd> SP ±0.1°C</span>
                  <span><kbd className="text-[9px] bg-muted px-1 rounded transition-all duration-200 hover:bg-muted/80">←/→</kbd> Ventana</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
    </Card>
  );
};
