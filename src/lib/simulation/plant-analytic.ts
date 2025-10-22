/**
 * Soluciones analíticas de referencia para FOPDT con L=0 (sin tiempo muerto)
 * y para escalón unitario en u. Se usa para validación numérica (<0.5% error).
 */

export interface AnalyticFOPDTParams {
  K: number      // Ganancia efectiva [°C por unidad u]
  tau: number    // Constante de tiempo [s]
  T_amb: number  // Temperatura ambiente [°C]
  mode: 'horno' | 'chiller'
}

/**
 * Respuesta analítica para escalón en u de amplitud U (0..1) y L=0.
 * T(t) = T_amb + K*U*(1 - e^{-t/τ})
 */
export function fopdtStepNoDeadTime(t: number, U: number, params: AnalyticFOPDTParams): number {
  if (params.tau <= 0) throw new Error(`tau debe ser > 0`)
  if (!Number.isFinite(t) || t < 0) throw new Error(`t inválido: ${t}`)
  const gain = params.mode === 'chiller' ? -Math.abs(params.K) : Math.abs(params.K)
  const response = params.T_amb + gain * U * (1 - Math.exp(-t / params.tau))
  if (!Number.isFinite(response)) throw new Error('Resultado no finito')
  return response
}

/**
 * Genera una señal escalón U(t) en [0,1]. Por defecto U=1.
 */
export function stepInput(t: number, amplitude = 1): number {
  if (!Number.isFinite(amplitude)) throw new Error('Amplitud inválida')
  return Math.max(0, Math.min(1, amplitude))
}

/**
 * Calcula el RMSE entre dos series numéricas del mismo largo.
 */
export function rmse(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('RMSE: longitudes distintas')
  const n = a.length
  if (n === 0) return 0
  let acc = 0
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i]
    acc += d * d
  }
  return Math.sqrt(acc / n)
}


