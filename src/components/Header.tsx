
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, FileText, Thermometer, Gauge, Settings, Zap, BookOpen } from "lucide-react";
import { HelpDialog } from "./HelpDialog";
import { TutorialDialog } from "./TutorialDialog";
import { useState, useEffect } from "react";
import CardNav from "./ui/CardNav/CardNav";
import { SimulatorState } from "@/lib/types";
import { presets } from "@/lib/presets";

interface HeaderProps {
  state?: SimulatorState;
  onStateChange?: (updates: Partial<SimulatorState>) => void;
  onExpansionChange?: (expanded: boolean) => void;
  onExportClick?: () => void;
  canExport?: boolean;
}

export const Header = ({ state, onStateChange, onExpansionChange, onExportClick, canExport = false }: HeaderProps) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [autoTune, setAutoTune] = useState(false);

  const handleHelpClick = () => {
    setTutorialOpen(true);
  };

  const handleDocsClick = () => {
    console.log("Abrir documentación");
  };

  // Función de AutoTune usando método SIMC
  const calculateSIMC = (K: number, tau: number, L: number, lambda: number = 2) => {
    // lambda es el factor de agresividad (1=agresivo, 2=balanceado, 3=conservador)
    const theta_c = lambda * L;
    
    const Kp = (1/K) * (tau / (L + theta_c));
    const Ti = Math.min(tau, 4 * (L + theta_c));
    const Ki = Kp / Ti;
    const Td = tau / 2;
    const Kd = Kp * Td;
    
    return { Kp, Ki, Kd };
  };

  // Aplicar AutoTune cuando esté activado y cambien los parámetros de planta
  useEffect(() => {
    if (autoTune && state?.plant && onStateChange) {
      const { k, tau, l } = state.plant;
      // Solo calcular si tenemos valores válidos
      if (k !== 0 && tau > 0 && l >= 0) {
        const { Kp, Ki, Kd } = calculateSIMC(Math.abs(k), tau, l);
        onStateChange({
          pid: {
            kp: Math.round(Kp * 100) / 100,
            ki: Math.round(Ki * 1000) / 1000,
            kd: Math.round(Kd * 10) / 10
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTune, state?.plant?.k, state?.plant?.tau, state?.plant?.l]);

  // Detectar qué preset está activo comparando valores actuales
  const detectActivePreset = (): string => {
    if (!state?.plant) return "custom";
    
    const currentPlant = state.plant;
    
    for (const preset of presets) {
      // Comparar con tolerancia para evitar problemas de precisión de punto flotante
      const tolerance = 0.001;
      const matches = 
        Math.abs(currentPlant.k - preset.values.k) < tolerance &&
        Math.abs(currentPlant.tau - preset.values.tau) < tolerance &&
        Math.abs(currentPlant.l - preset.values.l) < tolerance &&
        Math.abs(currentPlant.t_amb - preset.values.t_amb) < tolerance;
      
      if (matches) {
        return preset.key;
      }
    }
    
    return "custom";
  };

  const activePreset = detectActivePreset();

  // Configurar las cards para el CardNav con TODAS las configuraciones del PID Playground
  const cardNavItems = [
    {
      label: "Modo de Operación y Análisis",
      bgColor: "#0f172a", // slate-900
      textColor: "#f1f5f9", // slate-100
      controls: [
        {
          label: "Setpoint",
          value: state?.setpoint || 25,
          min: -50,
          max: 200,
          step: 1,
          unit: "°C",
          onChange: (value: number) => onStateChange?.({ setpoint: Math.round(value * 10) / 10 })
        }
      ],
      selects: [
        {
          label: "Ventana de Tiempo",
          value: String(state?.timeWindow || 60),
          options: [
            { value: "60", label: "1 minuto" },
            { value: "300", label: "5 minutos" },
            { value: "1800", label: "30 minutos" }
          ],
          onChange: (value: string) => onStateChange?.({ timeWindow: parseInt(value) as 60 | 300 | 1800 })
        }
      ]
    },
    {
      label: "Control PID",
      bgColor: "#1e293b", // slate-800
      textColor: "#f8fafc", // slate-50
      switches: [
        {
          label: "AutoTune SIMC",
          checked: autoTune,
          onChange: (checked: boolean) => setAutoTune(checked)
        }
      ],
      controls: [
        {
          label: "Kp (Proporcional)",
          value: state?.pid?.kp || 2.0,
          min: 0,
          max: 10,
          step: 0.01,
          unit: "",
          onChange: (value: number) => onStateChange?.({ pid: { ...state?.pid, kp: value } }),
          disabled: autoTune
        },
        {
          label: "Ki (Integral)",
          value: state?.pid?.ki || 0.1,
          min: 0,
          max: 1,
          step: 0.001,
          unit: " s⁻¹",
          onChange: (value: number) => onStateChange?.({ pid: { ...state?.pid, ki: value } }),
          disabled: autoTune
        },
        {
          label: "Kd (Derivativo)",
          value: state?.pid?.kd || 10,
          min: 0,
          max: 200,
          step: 1,
          unit: " s",
          onChange: (value: number) => onStateChange?.({ pid: { ...state?.pid, kd: value } }),
          disabled: autoTune
        }
      ]
    },
    {
      label: "Parámetros de Planta",
      bgColor: "#374151", // gray-700
      textColor: "#f9fafb", // gray-50
      selects: [
        {
          label: "Presets de Planta",
          value: activePreset,
          options: [
            // Solo mostrar "Personalizado" si los valores actuales no coinciden con ningún preset
            ...(activePreset === "custom" ? [{ value: "custom", label: "Personalizado" }] : []),
            ...presets.map(preset => ({
              value: preset.key,
              label: preset.name
            }))
          ],
          onChange: (value: string) => {
            if (value !== "custom") {
              const preset = presets.find(p => p.key === value);
              if (preset) {
                // Determinar modo según el signo de K del preset
                const mode = preset.values.k >= 0 ? 'horno' : 'chiller';
                onStateChange?.({
                  plant: {
                    k: preset.values.k,
                    tau: preset.values.tau,
                    l: preset.values.l,
                    t_amb: preset.values.t_amb
                  },
                  mode: mode
                });
              }
            }
          }
        }
      ],
      controls: [
        {
          label: "K (Ganancia Estática)",
          value: state?.plant?.k || 75.0,
          min: -100,
          max: 200,
          step: 1,
          unit: " °C",
          onChange: (value: number) => {
            // Determinar modo automáticamente según el signo de K
            const mode = value >= 0 ? 'horno' : 'chiller';
            onStateChange?.({ 
              plant: { ...state?.plant, k: value },
              mode: mode
            });
          }
        },
        {
          label: "τ (Constante de Tiempo)",
          value: state?.plant?.tau || 45,
          min: 1,
          max: 600,
          step: 1,
          unit: " s",
          onChange: (value: number) => onStateChange?.({ plant: { ...state?.plant, tau: value } })
        },
        {
          label: "L (Tiempo Muerto)",
          value: state?.plant?.l || 3,
          min: 0,
          max: 60,
          step: 0.5,
          unit: " s",
          onChange: (value: number) => onStateChange?.({ plant: { ...state?.plant, l: value } })
        },
        {
          label: "T_amb (Temperatura Ambiente)",
          value: state?.plant?.t_amb || 25,
          min: -20,
          max: 50,
          step: 1,
          unit: " °C",
          onChange: (value: number) => onStateChange?.({ plant: { ...state?.plant, t_amb: value } })
        }
      ]
    },
    {
      label: "Perturbaciones y Efectos",
      bgColor: "#475569", // slate-600
      textColor: "#f1f5f9", // slate-100
      // Intercalar switches y controles: switch ruido, slider ruido, switch SSR, slider SSR
      switches: [
        {
          label: "Ruido en Medición",
          checked: state?.noise?.enabled || false,
          onChange: (checked: boolean) => onStateChange?.({ noise: { ...state?.noise, enabled: checked } })
        }
      ],
      controls: [
        // Slider de Intensidad de Ruido (solo si está habilitado)
        ...(state?.noise?.enabled ? [{
          label: "Intensidad de Ruido",
          value: state?.noise?.intensity || 0.2,
          min: 0,
          max: 2,
          step: 0.1,
          unit: "",
          onChange: (value: number) => onStateChange?.({ noise: { ...state?.noise, intensity: value } })
        }] : [])
      ],
      switches2: [
        {
          label: "Control SSR",
          checked: state?.ssr?.enabled || false,
          onChange: (checked: boolean) => onStateChange?.({ ssr: { ...state?.ssr, enabled: checked } })
        }
      ],
      controls2: [
        // Slider de Periodo SSR (solo si está habilitado)
        ...(state?.ssr?.enabled ? [{
          label: "Periodo SSR",
          value: state?.ssr?.period || 2,
          min: 0.5,
          max: 10,
          step: 0.5,
          unit: " s",
          onChange: (value: number) => onStateChange?.({ ssr: { ...state?.ssr, period: value } })
        }] : [])
      ]
    }
  ];

  return (
    <div className="w-full">
      {/* CardNav que se ajusta al contenido */}
      <CardNav
        logoText="PID Playground"
        items={cardNavItems}
        className="w-full"
        ease="power3.out"
        baseColor="rgba(15, 23, 42, 0.98)"
        menuColor="#f8fafc"
        buttonBgColor="#3b82f6"
        buttonTextColor="#ffffff"
        onHelpClick={handleHelpClick}
        onDocsClick={handleDocsClick}
        onExportClick={onExportClick}
        canExport={canExport}
        simulatorState={state}
        onStateChange={onStateChange}
        onExpansionChange={onExpansionChange}
      />
      
      {/* TutorialDialog para el botón "Cómo usar" */}
      <TutorialDialog open={tutorialOpen} onOpenChange={setTutorialOpen} />
      
      {/* HelpDialog para el botón de ayuda */}
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};
