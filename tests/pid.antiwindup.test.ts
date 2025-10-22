import { describe, it, expect } from 'vitest'
import { PIDController } from '../src/lib/simulation/pid-controller'

describe('PID - Anti-windup back-calculation', () => {
  it('anti-windup reduce el error de saturación (u_raw → u_saturated)', () => {
    const Ts = 0.1
    const pid = new PIDController({ kp: 2, ki: 1, kd: 0, N: 10, Tt: 0.5, enabled: true }, Ts)
    pid.setOutputLimits(0, 1)

    const PV = 0
    const SP = 100 // muy alto para forzar saturación
    let firstError = Number.POSITIVE_INFINITY
    let lastError = Number.POSITIVE_INFINITY
    for (let k = 0; k < 300; k++) { // 30 s
      const out = pid.compute(SP, PV)
      const saturationError = Math.abs(out.u - out.u_raw)
      if (k === 0) firstError = saturationError
      lastError = saturationError
      // siempre saturado al inicio
      expect(out.u).toBe(1)
    }
    // el error de saturación debe reducirse gracias al back-calculation
    expect(lastError).toBeLessThan(firstError)
  })
})


