import { describe, it, expect } from 'vitest'
import { PIDController } from '../src/lib/simulation/pid-controller'

function gaussianNoise(sigma: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0 * sigma
}

describe('PID - Derivada filtrada estable con ruido', () => {
  it('D_term permanece acotado con ruido moderado', () => {
    const Ts = 0.1
    const pid = new PIDController({ kp: 0, ki: 0, kd: 5, N: 10, Tt: 1, enabled: true }, Ts)
    pid.setOutputLimits(0, 1)

    const SP = 0
    let PV = 0
    let maxAbsD = 0
    for (let k = 0; k < 1000; k++) {
      // señal base suave + ruido
      const t = k * Ts
      const base = Math.sin(0.5 * t)
      PV = base + gaussianNoise(0.2)
      const out = pid.compute(SP, PV)
      maxAbsD = Math.max(maxAbsD, Math.abs(out.D_term))
    }
    // derivada filtrada debe permanecer razonablemente acotada con ruido moderado
    expect(maxAbsD).toBeLessThan(30)
  })
})


