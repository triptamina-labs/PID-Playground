
export type Mode = 'horno' | 'chiller';
export type TimeWindow = 60 | 300 | 1800;

export interface PIDGains {
  kp: number;
  ki: number;
  kd: number;
}

export interface PlantParams {
  k: number;
  tau: number;
  l: number;
  t_amb: number;
}

export interface NoiseConfig {
  enabled: boolean;
  intensity: number;
}

export interface SSRConfig {
  enabled: boolean;
  period: number;
}

export interface Preset {
  key: string;
  name: string;
  values: {
    k: number;
    tau: number;
    l: number;
    t_amb: number;
  };
}

export interface SimulatorState {
  mode: Mode;
  setpoint: number;
  pid: PIDGains;
  plant: PlantParams;
  noise: NoiseConfig;
  ssr: SSRConfig;
  timeWindow: TimeWindow;
}

export interface MetricData {
  overshoot: number | null;
  settlingTime: number | null;
}

export interface ChartDataPoint {
  time: number;
  pv: number;
  sp: number;
  output: number;
}
