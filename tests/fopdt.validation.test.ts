import { describe, it, expect } from 'vitest'
import { FOPDTPlant } from '../src/lib/simulation/plant-model'
import { fopdtStepNoDeadTime, rmse } from '../src/lib/simulation/plant-analytic'

describe('FOPDT - Validación numérica vs analítico (L=0)', () => {
  it('RMSE < 0.5% del rango para escalón unitario', () => {
    const Ts = 0.1 // 100 ms
    const simDuration = 60 // 60 s
    const steps = Math.round(simDuration / Ts)

    const params = { K: 5, tau: 20, L: 0, T_amb: 25, mode: 'horno' as const }
    const plant = new FOPDTPlant(params, Ts)

    const sim: number[] = []
    const ana: number[] = []
    for (let k = 0; k <= steps; k++) {
      const t = k * Ts
      const u = 1
      const y = plant.step(u)
      sim.push(y)
      const yAna = fopdtStepNoDeadTime(t, u, { K: params.K, tau: params.tau, T_amb: params.T_amb, mode: params.mode })
      ana.push(yAna)
    }

    const error = rmse(sim, ana)
    const range = Math.abs(params.K) // paso 0→1, rango esperado ~K
    const percent = (error / range) * 100

    expect(percent).toBeLessThan(0.5)
  })
})


