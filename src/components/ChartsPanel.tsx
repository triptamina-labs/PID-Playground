
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartPVSP } from "@/components/ChartPVSP";
import { ChartOutput } from "@/components/ChartOutput";
import { ChartDataPoint } from "@/lib/types";
import { useEffect, useState, useRef } from "react";

interface ChartsPanelProps {
  data: ChartDataPoint[];
  timeWindow?: number;
  isRunning?: boolean;
}

export const ChartsPanel = ({ data, timeWindow, isRunning = false }: ChartsPanelProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUpdateTime = useRef<number>(0);
  const lastTimeWindow = useRef<number | undefined>(timeWindow);

  // Asegurar que las gráficas se rendericen después de que el componente esté visible
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Forzar re-renderizado de las gráficas
      setKey(prev => prev + 1);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Forzar re-renderizado cuando cambien los datos o la ventana
  useEffect(() => {
    if (isVisible && data.length > 0) {
      const currentTime = data[data.length - 1]?.time || 0;
      const timeChanged = Math.abs(currentTime - lastUpdateTime.current) > 0.05; // Actualizar cada 0.05 segundos para actualización más frecuente
      
      if (timeChanged || timeWindow !== lastTimeWindow.current) {
        setKey(prev => prev + 1);
        lastUpdateTime.current = currentTime;
        lastTimeWindow.current = timeWindow;
      }
    }
  }, [data, timeWindow, isVisible]);

  // Resize observer para forzar actualización cuando cambia el tamaño
  useEffect(() => {
    if (!containerRef.current || !isVisible) return;

    const resizeObserver = new ResizeObserver(() => {
      // Forzar re-renderizado cuando cambia el tamaño del contenedor
      setKey(prev => prev + 1);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isVisible]);

  return (
    <Card className="h-full flex flex-col notion-panel">
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="text-sm font-semibold text-[hsl(var(--notion-text))] tracking-wide uppercase flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              isRunning ? 'status-active pulse-subtle' : 'status-error'
            }`}></div>
            <span className="text-[hsl(var(--notion-text))]">Gráficas de control</span>
          </div>
          {data.length > 0 && (
            <div className="text-xs text-[hsl(var(--notion-text-secondary))] font-normal ml-auto notion-badge">
              {data.length > 1 ? `${(data[data.length - 1].time - data[0].time).toFixed(1)}s` : '0.0s'}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-4 sm:p-6 pt-0">
        {isVisible && (
          <div ref={containerRef} className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <div className="h-full min-h-[300px] xl:min-h-0">
              <ChartPVSP key={`pvsp-${key}`} data={data} embedded timeWindow={timeWindow} />
            </div>
            <div className="h-full min-h-[300px] xl:min-h-0">
              <ChartOutput key={`output-${key}`} data={data} embedded timeWindow={timeWindow} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
