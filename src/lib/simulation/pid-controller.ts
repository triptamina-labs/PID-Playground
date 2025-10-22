/**
 * Controlador PID con derivada filtrada y anti-windup por back-calculation
 * 
 * Implementa PID posicional con las siguientes características:
 * - Derivada calculada sobre la medida (PV), no sobre el error
 * - Filtro de primer orden en la derivada con factor N configurable
 * - Anti-windup por back-calculation cuando la salida se satura
 * - Ganancias en unidades estándar: Kp [adimensional], Ki [s⁻¹], Kd [s]
 * 
 */

export interface PIDParameters {
  kp: number     // Ganancia proporcional [adimensional]
  ki: number     // Ganancia integral [s⁻¹]
  kd: number     // Tiempo derivativo [s]
  N: number      // Factor de filtro derivada (default: 10)
  Tt: number     // Tiempo de tracking anti-windup [s]
  enabled: boolean // Habilitar/deshabilitar PID
}

export interface PIDState {
  integral: number           // Acumulador integral
  derivative_filtered: number // Estado del filtro derivativo
  pv_prev: number           // PV anterior para cálculo de derivada
  error_prev: number        // Error anterior (para validación)
  first_cycle: boolean      // Bandera de primer ciclo
}

export interface PIDOutput {
  u: number          // Salida total [0-1]
  u_raw: number      // Salida antes de saturar
  P_term: number     // Término proporcional
  I_term: number     // Término integral
  D_term: number     // Término derivativo
  saturated: boolean // True si la salida está saturada
}

export class PIDController {
  private params: PIDParameters
  private state: PIDState
  private timestep: number
  private output_min: number = 0   // Límite inferior de salida
  private output_max: number = 1   // Límite superior de salida

  constructor(params: PIDParameters, timestep: number) {
    this.params = { ...params }
    this.timestep = timestep
    this.validateParameters()
    
    // Inicializar estado
    this.reset()
  }

  /**
   * Valida que los parámetros sean válidos
   */
  private validateParameters(): void {
    if (this.params.kp < 0) {
      throw new Error(`Kp debe ser ≥ 0, recibido: ${this.params.kp}`)
    }

    if (this.params.ki < 0) {
      throw new Error(`Ki debe ser ≥ 0, recibido: ${this.params.ki}`)
    }

    if (this.params.kd < 0) {
      throw new Error(`Kd debe ser ≥ 0, recibido: ${this.params.kd}`)
    }

    if (this.params.N <= 0) {
      throw new Error(`Factor N debe ser > 0, recibido: ${this.params.N}`)
    }

    if (this.params.Tt <= 0) {
      throw new Error(`Tiempo Tt debe ser > 0, recibido: ${this.params.Tt}`)
    }

    if (this.timestep <= 0) {
      throw new Error(`Timestep debe ser > 0, recibido: ${this.timestep}`)
    }

    // Validaciones de estabilidad
    if (this.params.N * this.timestep > 1) {
      console.warn(`Factor N muy alto para Ts=${this.timestep}: puede causar inestabilidad numérica`)
    }
  }

  /**
   * Ejecuta un ciclo de control PID
   * 
   * @param SP - Setpoint [°C]
   * @param PV - Process Variable [°C] 
   * @returns Salida de control y componentes
   */
  compute(SP: number, PV: number): PIDOutput {
    // Validar entradas
    if (!Number.isFinite(SP) || !Number.isFinite(PV)) {
      throw new Error(`Entradas inválidas: SP=${SP}, PV=${PV}`)
    }

    // Si PID está deshabilitado, retornar salida cero
    if (!this.params.enabled) {
      return {
        u: 0,
        u_raw: 0,
        P_term: 0,
        I_term: 0,
        D_term: 0,
        saturated: false
      }
    }

    const error = SP - PV

    // ========================================================================
    // TÉRMINO PROPORCIONAL
    // ========================================================================
    const P_term = this.params.kp * error

    // ========================================================================
    // TÉRMINO INTEGRAL (con anti-windup)
    // ========================================================================
    let I_term = 0
    if (this.params.ki > 0) {
      // Integración trapezoidal: más precisa que rectangular
      const integral_increment = this.params.ki * (error + this.state.error_prev) * this.timestep / 2
      this.state.integral += integral_increment
      I_term = this.state.integral
    }

    // ========================================================================
    // TÉRMINO DERIVATIVO (filtrado, sobre PV)
    // ========================================================================
    let D_term = 0
    if (this.params.kd > 0 && !this.state.first_cycle) {
      // Derivada sobre PV (no sobre error) para evitar kick derivativo
      const pv_derivative = (PV - this.state.pv_prev) / this.timestep
      
      // Filtro de primer orden: D_filt[k] = α·D_filt[k-1] + (1-α)·Kd·dPV/dt
      const alpha = this.params.N * this.timestep / (this.params.N * this.timestep + 1)
      this.state.derivative_filtered = alpha * this.state.derivative_filtered + 
                                     (1 - alpha) * this.params.kd * (-pv_derivative)
      
      D_term = this.state.derivative_filtered
    }

    // ========================================================================
    // SALIDA TOTAL Y SATURACIÓN
    // ========================================================================
    const u_raw = P_term + I_term + D_term
    const u_saturated = Math.max(this.output_min, Math.min(this.output_max, u_raw))
    const saturated = (u_raw !== u_saturated)

    // ========================================================================
    // ANTI-WINDUP POR BACK-CALCULATION
    // ========================================================================
    if (saturated && this.params.ki > 0) {
      // Calcular error de saturación
      const saturation_error = u_saturated - u_raw
      
      // Aplicar back-calculation al integrador
      const tracking_gain = 1 / this.params.Tt
      this.state.integral += tracking_gain * saturation_error * this.timestep
    }

    // ========================================================================
    // ACTUALIZAR ESTADO PARA PRÓXIMO CICLO
    // ========================================================================
    this.state.pv_prev = PV
    this.state.error_prev = error
    this.state.first_cycle = false

    // Verificar estabilidad numérica
    if (!Number.isFinite(this.state.integral) || !Number.isFinite(this.state.derivative_filtered)) {
      throw new Error(`Inestabilidad numérica en PID: I=${this.state.integral}, D=${this.state.derivative_filtered}`)
    }

    return {
      u: u_saturated,
      u_raw,
      P_term,
      I_term,
      D_term,
      saturated
    }
  }

  /**
   * Actualiza los parámetros del PID
   */
  updateParameters(newParams: Partial<PIDParameters>): void {
    this.params = { ...this.params, ...newParams }
    this.validateParameters()
  }

  /**
   * Actualiza el timestep de simulación
   */
  updateTimestep(newTimestep: number): void {
    if (newTimestep !== this.timestep) {
      this.timestep = newTimestep
      this.validateParameters()
    }
  }

  /**
   * Establece los límites de saturación de salida
   */
  setOutputLimits(min: number, max: number): void {
    if (min >= max) {
      throw new Error(`Límites inválidos: min=${min} debe ser < max=${max}`)
    }
    this.output_min = min
    this.output_max = max
  }

  /**
   * Resetea el estado interno del PID
   */
  reset(): void {
    this.state = {
      integral: 0,
      derivative_filtered: 0,
      pv_prev: 0,
      error_prev: 0,
      first_cycle: true
    }
  }

  /**
   * Obtiene el estado interno actual (para debugging)
   */
  getState(): Readonly<PIDState> {
    return { ...this.state }
  }

  /**
   * Obtiene los parámetros actuales
   */
  getParameters(): Readonly<PIDParameters> {
    return { ...this.params }
  }

  /**
   * Calcula el tiempo de tracking automático basado en parámetros
   */
  static calculateAutoTt(kp: number, ki: number): number {
    if (ki <= 0) return 1.0  // Valor por defecto si no hay integral
    
    // Heurística: Tt = Ti/4 donde Ti = Kp/Ki
    const Ti = kp / ki
    return Math.max(0.1, Ti / 4)  // Mínimo 0.1s
  }

  /**
   * Valida que los parámetros sean físicamente razonables
   */
  static validateParameters(params: PIDParameters, timestep: number): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Validaciones críticas
    if (params.kp < 0) errors.push(`Kp debe ser ≥ 0`)
    if (params.ki < 0) errors.push(`Ki debe ser ≥ 0`)
    if (params.kd < 0) errors.push(`Kd debe ser ≥ 0`)
    if (params.N <= 0) errors.push(`Factor N debe ser > 0`)
    if (params.Tt <= 0) errors.push(`Tiempo Tt debe ser > 0`)

    // Validaciones de rango
    if (params.kp > 100) warnings.push(`Kp muy alto: ${params.kp} (típico: 0.1-10)`)
    if (params.ki > 10) warnings.push(`Ki muy alto: ${params.ki} s⁻¹ (típico: 0.01-1)`)
    if (params.kd > 100) warnings.push(`Kd muy alto: ${params.kd} s (típico: 0-20)`)

    // Validaciones de estabilidad numérica
    if (params.N * timestep > 1) {
      warnings.push(`Factor N demasiado alto para Ts=${timestep}: N·Ts = ${params.N * timestep} > 1`)
    }

    if (params.kd > 0 && params.kd / timestep > 1000) {
      warnings.push(`Derivada muy sensible: Kd/Ts = ${params.kd / timestep} (recomendado < 1000)`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}

import { PRESETS } from '../../config/app.config'

/**
 * Presets de PID típicos para diferentes aplicaciones
 */
export const PID_PRESETS = {
  conservador: PRESETS.pid.conservador,
  balanceado: PRESETS.pid.balanceado,
  agresivo: PRESETS.pid.agresivo
} as const
