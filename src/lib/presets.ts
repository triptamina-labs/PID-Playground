
import { Preset } from './types';
import { PRESETS } from '../config/app.config';

// Convertir presets de configuración centralizada al formato esperado
export const presets: Preset[] = [
  {
    key: 'horno-industrial',
    name: PRESETS.plant.horno_industrial.name,
    values: {
      k: PRESETS.plant.horno_industrial.K,
      tau: PRESETS.plant.horno_industrial.tau,
      l: PRESETS.plant.horno_industrial.L,
      t_amb: PRESETS.plant.horno_industrial.T_amb
    }
  },
  {
    key: 'horno-compacto',
    name: PRESETS.plant.horno_compacto.name,
    values: {
      k: PRESETS.plant.horno_compacto.K,
      tau: PRESETS.plant.horno_compacto.tau,
      l: PRESETS.plant.horno_compacto.L,
      t_amb: PRESETS.plant.horno_compacto.T_amb
    }
  },
  {
    key: 'chiller-industrial',
    name: PRESETS.plant.chiller_industrial.name,
    values: {
      k: PRESETS.plant.chiller_industrial.K,
      tau: PRESETS.plant.chiller_industrial.tau,
      l: PRESETS.plant.chiller_industrial.L,
      t_amb: PRESETS.plant.chiller_industrial.T_amb
    }
  }
];
