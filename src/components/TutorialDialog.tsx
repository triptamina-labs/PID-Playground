import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Thermometer, Zap, TrendingUp, Target, Sparkles, Settings, BarChart3 } from 'lucide-react';

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tutorialSlides = [
  {
    id: 1,
    title: "Bienvenido a PID Playground",
    icon: <Sparkles className="w-6 h-6 text-[hsl(var(--notion-blue))]" />,
    content: (
      <div className="space-y-6">
        <p className="text-[hsl(var(--notion-text))] leading-relaxed">
          Un simulador interactivo de control PID diseñado para aprender y experimentar con sistemas de control térmico en tiempo real.
        </p>
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[hsl(var(--notion-text))] uppercase tracking-wide">Características</h4>
          <div className="grid gap-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-1 h-1 rounded-full bg-[hsl(var(--notion-blue))] mt-2 flex-shrink-0"></div>
              <span className="text-[hsl(var(--notion-text-secondary))] leading-relaxed">Simulación en tiempo real con visualización de gráficas</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-1 h-1 rounded-full bg-[hsl(var(--notion-blue))] mt-2 flex-shrink-0"></div>
              <span className="text-[hsl(var(--notion-text-secondary))] leading-relaxed">Dos modos: Horno (calentamiento) y Chiller (enfriamiento)</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-1 h-1 rounded-full bg-[hsl(var(--notion-blue))] mt-2 flex-shrink-0"></div>
              <span className="text-[hsl(var(--notion-text-secondary))] leading-relaxed">Ajuste interactivo de parámetros PID y de planta</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-1 h-1 rounded-full bg-[hsl(var(--notion-blue))] mt-2 flex-shrink-0"></div>
              <span className="text-[hsl(var(--notion-text-secondary))] leading-relaxed">Métricas de rendimiento calculadas automáticamente</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: "Modelo de Planta FOPDT",
    icon: <Thermometer className="w-6 h-6 text-[hsl(var(--notion-blue))]" />,
    content: (
      <div className="space-y-6">
        <p className="text-[hsl(var(--notion-text))] leading-relaxed">
          El sistema utiliza un modelo <span className="font-medium">FOPDT</span> (First Order Plus Dead Time) que representa el comportamiento de procesos térmicos reales.
        </p>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[hsl(var(--notion-text))] uppercase tracking-wide">Ecuación</h4>
          <div className="notion-card p-4 font-mono text-sm text-center text-[hsl(var(--notion-text))]">
            G(s) = K · e<sup>-Ls</sup> / (τs + 1)
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[hsl(var(--notion-text))] uppercase tracking-wide">Parámetros</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-4 pb-3 border-b border-[hsl(var(--notion-border))]">
              <span className="text-xl font-medium text-[hsl(var(--notion-blue))] font-mono w-8">K</span>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-[hsl(var(--notion-text))] text-sm">Ganancia Estática</p>
                <p className="text-xs text-[hsl(var(--notion-text-secondary))] leading-relaxed">
                  Determina cuánto cambia la temperatura por unidad de potencia aplicada. Mayor K = mayor sensibilidad.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 pb-3 border-b border-[hsl(var(--notion-border))]">
              <span className="text-xl font-medium text-[hsl(var(--notion-blue))] font-mono w-8">τ</span>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-[hsl(var(--notion-text))] text-sm">Constante de Tiempo</p>
                <p className="text-xs text-[hsl(var(--notion-text-secondary))] leading-relaxed">
                  Define la velocidad de respuesta del sistema. Mayor τ = respuesta más lenta.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xl font-medium text-[hsl(var(--notion-blue))] font-mono w-8">L</span>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-[hsl(var(--notion-text))] text-sm">Tiempo Muerto</p>
                <p className="text-xs text-[hsl(var(--notion-text-secondary))] leading-relaxed">
                  Retardo entre aplicar control y ver efecto. Mayor L = mayor dificultad de control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: "Control PID",
    icon: <Settings className="w-6 h-6 text-[hsl(var(--notion-blue))]" />,
    content: (
      <div className="space-y-6">
        <p className="text-[hsl(var(--notion-text))] leading-relaxed">
          Un controlador <span className="font-medium">PID</span> combina tres acciones de control para mantener la temperatura en el setpoint deseado.
        </p>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[hsl(var(--notion-text))] uppercase tracking-wide">Ecuación</h4>
          <div className="notion-card p-4 font-mono text-sm text-center text-[hsl(var(--notion-text))]">
            u(t) = K<sub>p</sub>·e(t) + K<sub>i</sub>·∫e(t)dt + K<sub>d</sub>·de(t)/dt
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[hsl(var(--notion-text))] uppercase tracking-wide">Parámetros</h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-4 pb-3 border-b border-[hsl(var(--notion-border))]">
              <span className="text-xl font-bold text-red-400 font-mono w-8">P</span>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-[hsl(var(--notion-text))] text-sm">Proporcional (K<sub>p</sub>)</p>
                <p className="text-xs text-[hsl(var(--notion-text-secondary))] leading-relaxed">
                  Responde al error actual. Mayor K<sub>p</sub> = respuesta más rápida, pero puede causar oscilaciones.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-3 border-b border-[hsl(var(--notion-border))]">
              <span className="text-xl font-bold text-blue-400 font-mono w-8">I</span>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-[hsl(var(--notion-text))] text-sm">Integral (K<sub>i</sub>)</p>
                <p className="text-xs text-[hsl(var(--notion-text-secondary))] leading-relaxed">
                  Elimina el error acumulado. Mayor K<sub>i</sub> = elimina offset, pero puede causar sobrepaso.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-xl font-bold text-green-400 font-mono w-8">D</span>
              <div className="flex-1 space-y-1">
                <p className="font-medium text-[hsl(var(--notion-text))] text-sm">Derivativo (K<sub>d</sub>)</p>
                <p className="text-xs text-[hsl(var(--notion-text-secondary))] leading-relaxed">
                  Anticipa cambios futuros. Mayor K<sub>d</sub> = reduce sobrepaso, pero sensible a ruido.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 4,
    title: "Métricas de Rendimiento",
    icon: <BarChart3 className="w-6 h-6 text-[hsl(var(--notion-blue))]" />,
    content: (
      <div className="space-y-6">
        <p className="text-[hsl(var(--notion-text))] leading-relaxed">
          El simulador calcula automáticamente métricas clave para evaluar el desempeño del controlador.
        </p>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[hsl(var(--notion-text))] uppercase tracking-wide">Métricas</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-4 pb-3 border-b border-[hsl(var(--notion-border))]">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-[hsl(var(--notion-text))] text-sm">Overshoot</p>
                <p className="text-xs text-[hsl(var(--notion-text-secondary))] leading-relaxed">
                  Cuánto sobrepasa el sistema el setpoint. Valores bajos (&lt;5%) indican buen control sin oscilaciones excesivas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 pb-3 border-b border-[hsl(var(--notion-border))]">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-[hsl(var(--notion-text))] text-sm">Tiempo de Pico</p>
                <p className="text-xs text-[hsl(var(--notion-text-secondary))] leading-relaxed">
                  Tiempo que tarda en alcanzar el máximo valor después de un cambio de setpoint.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-[hsl(var(--notion-text))] text-sm">Tiempo de Establecimiento</p>
                <p className="text-xs text-[hsl(var(--notion-text-secondary))] leading-relaxed">
                  Tiempo para que el sistema se estabilice dentro de ±2% del setpoint. Valores bajos = respuesta rápida.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="notion-card p-4 border-l-2 border-l-[hsl(var(--notion-blue))]">
          <h4 className="text-sm font-medium text-[hsl(var(--notion-text))] uppercase tracking-wide mb-3">Consejos</h4>
          <div className="space-y-2.5 text-xs text-[hsl(var(--notion-text-secondary))]">
            <div className="flex items-start gap-3">
              <div className="w-1 h-1 rounded-full bg-[hsl(var(--notion-blue))] mt-1.5 flex-shrink-0"></div>
              <span className="leading-relaxed">Comienza con K<sub>p</sub> bajo y auméntalo gradualmente</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-1 rounded-full bg-[hsl(var(--notion-blue))] mt-1.5 flex-shrink-0"></div>
              <span className="leading-relaxed">Agrega K<sub>i</sub> para eliminar error en estado estacionario</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-1 rounded-full bg-[hsl(var(--notion-blue))] mt-1.5 flex-shrink-0"></div>
              <span className="leading-relaxed">Usa K<sub>d</sub> para reducir oscilaciones y sobrepaso</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1 h-1 rounded-full bg-[hsl(var(--notion-blue))] mt-1.5 flex-shrink-0"></div>
              <span className="leading-relaxed">Observa las gráficas en tiempo real para ajustar</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export const TutorialDialog: React.FC<TutorialDialogProps> = ({ open, onOpenChange }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Resetear al primer slide cuando el dialog se cierre
  useEffect(() => {
    if (!open) {
      setCurrentSlide(0);
    }
  }, [open]);

  const handleNext = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const currentContent = tutorialSlides[currentSlide];
  const progress = ((currentSlide + 1) / tutorialSlides.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark max-w-2xl max-h-[90vh] overflow-hidden notion-panel p-0 border-[hsl(var(--notion-border))]">
        {/* Header fijo */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[hsl(var(--notion-border))] bg-[hsl(var(--notion-surface))]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[hsl(var(--notion-accent))] border border-[hsl(var(--notion-border))]">
              {currentContent.icon}
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-[hsl(var(--notion-text))]">
                {currentContent.title}
              </DialogTitle>
              <p className="text-xs text-[hsl(var(--notion-text-secondary))] mt-0.5 font-mono">
                {currentSlide + 1}/{tutorialSlides.length}
              </p>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="mt-4 w-full h-1 bg-[hsl(var(--notion-accent))] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[hsl(var(--notion-blue))] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </DialogHeader>

        {/* Contenido scrolleable */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-240px)] mobile-scroll-area bg-[hsl(var(--notion-bg))]">
          <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300">
            {currentContent.content}
          </div>
        </div>

        {/* Footer con navegación */}
        <div className="px-6 py-4 border-t border-[hsl(var(--notion-border))] flex items-center justify-between bg-[hsl(var(--notion-surface))]">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className="notion-button gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          {/* Indicadores de puntos */}
          <div className="flex items-center gap-1.5">
            {tutorialSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'w-6 bg-[hsl(var(--notion-blue))]' 
                    : 'w-1.5 bg-[hsl(var(--notion-border))] hover:bg-[hsl(var(--notion-text-secondary))]'
                }`}
                aria-label={`Ir al paso ${index + 1}`}
              />
            ))}
          </div>

          {currentSlide < tutorialSlides.length - 1 ? (
            <Button
              onClick={handleNext}
              className="notion-button-primary gap-1"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleClose}
              className="notion-button-primary gap-1"
            >
              ¡Comenzar!
              <Zap className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

