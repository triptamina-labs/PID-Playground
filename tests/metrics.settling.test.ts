import { describe, it, expect } from 'vitest'
import { MetricsCalculator } from '../src/lib/simulation/metrics-calculator'

describe('Metrics - Tiempo de establecimiento', () => {
  it('detecta settling time con umbral y ventana', () => {
    const metrics = new MetricsCalculator({ settling_threshold: 2, settling_window: 1, max_calculation_time: 30 })
    let t = 0
    const Ts = 0.1
    let sp = 0
    let pv = 0
    // estado base sin cálculo
    metrics.processSample(t, sp, pv)
    // cambio de SP 0 -> 100 para disparar cálculo
    sp = 100
    metrics.processSample(t, sp, pv)
    // simular acercamiento exponencial hacia SP
    for (let k = 1; k <= 400; k++) {
      t = k * Ts
      pv = sp - (sp) * Math.exp(-t / 2) // tau=2s aproximado
      metrics.processSample(t, sp, pv)
    }
    const s = metrics.getMetrics()
    expect(s.settling_time).toBeGreaterThan(0)
    expect(s.is_calculating).toBe(false)
  })
})


