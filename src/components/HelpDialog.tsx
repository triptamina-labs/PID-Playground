
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpDialog = ({ open, onOpenChange }: HelpDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cómo usar PID Playground (UI)</DialogTitle>
          <DialogDescription className="space-y-4 text-sm">
            <div>
              PID Playground es un simulador completo de control PID en tiempo real 
              que permite ajustar todos los parámetros del controlador y la planta.
            </div>
            <div>
              <strong>Funcionalidades principales:</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Simulación PID en tiempo real con modelo FOPDT</li>
              <li>Ajuste de parámetros Kp, Ki, Kd en tiempo real</li>
              <li>Configuración de planta (K, τ, L, T_amb)</li>
              <li>Modos Horno (0-200°C) y Chiller (-50 a 50°C)</li>
              <li>Perturbaciones: ruido de medición y control SSR</li>
              <li>Exportación de gráficas como imágenes</li>
              <li>Métricas de rendimiento automáticas</li>
            </ul>
            <div>
              <strong>Uso:</strong> Ajusta los parámetros con los sliders y observa 
              la respuesta del sistema en las gráficas en tiempo real.
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="font-semibold mb-2">Atajos de teclado:</div>
              <ul className="space-y-1 text-sm font-mono">
                <li><strong>S</strong> - Iniciar/Pausar simulación</li>
                <li><strong>R</strong> - Reset del sistema</li>
                <li><strong>↑/↓</strong> - Ajustar setpoint ±1°C</li>
                <li><strong>Shift + ↑/↓</strong> - Ajustar setpoint ±10°C</li>
                <li><strong>←/→</strong> - Cambiar ventana de tiempo</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
