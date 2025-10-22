/**
 * Modelo de planta FOPDT (First Order Plus Dead Time) con discretización exacta
 * 
 * Implementa la discretización matemáticamente exacta para garantizar estabilidad
 * incondicional y precisión numérica alta vs las soluciones analíticas.
 * 
 * Ecuación continua: τ·(dT/dt) + T = K·u(t-L) + T_amb
 * Donde: T = temperatura [°C], u = entrada control [0-1], L = tiempo muerto [s]
 * 
 */

export interface PlantParameters {
  K: number      // Ganancia efectiva [°C/s por unidad u]
  tau: number    // Constante de tiempo [s]
  L: number      // Tiempo muerto [s]
  T_amb: number  // Temperatura ambiente [°C]
  mode: 'horno' | 'chiller'  // Modo de operación
}

export interface PlantState {
  x: number                    // Estado interno: x = T - T_amb
  dead_time_buffer: number[]   // Buffer circular para tiempo muerto
  buffer_index: number         // Índice actual en el buffer
}

export class FOPDTPlant {
  private params: PlantParameters
  private state: PlantState
  private timestep: number
  private phi: number          // Factor de discretización exacta: e^(-Ts/τ)
  private gamma: number        // Factor de ganancia: K * (1 - e^(-Ts/τ))
  private dead_time_samples: number  // Número de muestras para tiempo muerto

  constructor(params: PlantParameters, timestep: number) {
    this.params = { ...params }
    this.timestep = timestep
    this.updateDiscretization()
    
    // Inicializar estado
    this.state = {
      x: 0,  // Temperatura inicial = T_amb
      dead_time_buffer: new Array(this.dead_time_samples).fill(0),
      buffer_index: 0
    }
  }

  /**
   * Actualiza los parámetros de discretización cuando cambian τ o Ts
   */
  private updateDiscretization(): void {
    if (this.params.tau <= 0) {
      throw new Error(`Constante de tiempo τ debe ser > 0, recibido: ${this.params.tau}`)
    }
    
    if (this.timestep <= 0) {
      throw new Error(`Timestep debe ser > 0, recibido: ${this.timestep}`)
    }

    // Discretización exacta para sistema de primer orden
    this.phi = Math.exp(-this.timestep / this.params.tau)
    
    // Factor de ganancia considerando el modo (horno vs chiller)
    const effective_K = this.params.mode === 'chiller' ? -Math.abs(this.params.K) : Math.abs(this.params.K)
    this.gamma = effective_K * (1 - this.phi)
    
    // Calcular número de muestras para tiempo muerto
    this.dead_time_samples = Math.round(this.params.L / this.timestep)
    
    // Redimensionar buffer si es necesario
    if (this.state && this.state.dead_time_buffer.length !== this.dead_time_samples) {
      const newBuffer = new Array(this.dead_time_samples).fill(0)
      // Preservar datos existentes si es posible
      const copyLength = Math.min(this.state.dead_time_buffer.length, this.dead_time_samples)
      for (let i = 0; i < copyLength; i++) {
        newBuffer[i] = this.state.dead_time_buffer[i] || 0
      }
      this.state.dead_time_buffer = newBuffer
      this.state.buffer_index = 0
    }
  }

  /**
   * Actualiza los parámetros de la planta
   */
  updateParameters(newParams: Partial<PlantParameters>): void {
    const oldTau = this.params.tau
    this.params = { ...this.params, ...newParams }
    
    // Solo recalcular discretización si cambió τ
    if (this.params.tau !== oldTau) {
      this.updateDiscretization()
    }
  }

  /**
   * Actualiza el timestep de simulación
   */
  updateTimestep(newTimestep: number): void {
    if (newTimestep !== this.timestep) {
      this.timestep = newTimestep
      this.updateDiscretization()
    }
  }

  /**
   * Ejecuta un paso de simulación con discretización exacta
   * 
   * @param u_current - Entrada de control actual [0-1]
   * @returns Temperatura actual [°C]
   */
  step(u_current: number): number {
    // Validar entrada
    if (!Number.isFinite(u_current)) {
      throw new Error(`Entrada de control inválida: ${u_current}`)
    }

    // Saturar entrada a rango válido
    u_current = Math.max(0, Math.min(1, u_current))

    // Obtener entrada con tiempo muerto (si L > 0)
    let u_delayed = u_current
    if (this.dead_time_samples > 0) {
      // Obtener valor con retardo del buffer circular
      u_delayed = this.state.dead_time_buffer[this.state.buffer_index]
      
      // Almacenar nuevo valor en el buffer
      this.state.dead_time_buffer[this.state.buffer_index] = u_current
      
      // Avanzar índice circular
      this.state.buffer_index = (this.state.buffer_index + 1) % this.dead_time_samples
    }

    // Ecuación de diferencias exacta: x[k+1] = φ·x[k] + γ·u[k-L]
    // Donde x = T - T_amb
    this.state.x = this.phi * this.state.x + this.gamma * u_delayed

    // Verificar estabilidad numérica
    if (!Number.isFinite(this.state.x)) {
      throw new Error(`Inestabilidad numérica detectada: x = ${this.state.x}`)
    }

    // Retornar temperatura absoluta
    return this.state.x + this.params.T_amb
  }

  /**
   * Obtiene la temperatura actual sin avanzar la simulación
   */
  getCurrentTemperature(): number {
    return this.state.x + this.params.T_amb
  }

  /**
   * Obtiene el estado interno de la planta (para debugging)
   */
  getState(): Readonly<PlantState> {
    return {
      x: this.state.x,
      dead_time_buffer: [...this.state.dead_time_buffer],
      buffer_index: this.state.buffer_index
    }
  }

  /**
   * Obtiene los parámetros actuales de la planta
   */
  getParameters(): Readonly<PlantParameters> {
    return { ...this.params }
  }

  /**
   * Obtiene información de discretización (para validación)
   */
  getDiscretizationInfo() {
    return {
      phi: this.phi,
      gamma: this.gamma,
      dead_time_samples: this.dead_time_samples,
      timestep: this.timestep,
      effective_gain: this.params.mode === 'chiller' ? -Math.abs(this.params.K) : Math.abs(this.params.K)
    }
  }

  /**
   * Resetea el estado de la planta a condiciones iniciales
   */
  reset(): void {
    this.state.x = 0  // T = T_amb
    this.state.dead_time_buffer.fill(0)
    this.state.buffer_index = 0
  }

  /**
   * Valida que los parámetros sean físicamente razonables
   */
  static validateParameters(params: PlantParameters): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (params.tau <= 0) {
      errors.push(`Constante de tiempo τ debe ser > 0 (recibido: ${params.tau})`)
    }

    if (params.tau > 3600) {
      errors.push(`Constante de tiempo τ muy alta: ${params.tau}s (máximo recomendado: 1 hora)`)
    }

    if (params.L < 0) {
      errors.push(`Tiempo muerto L debe ser ≥ 0 (recibido: ${params.L})`)
    }

    if (params.L > 10 * params.tau) {
      errors.push(`Tiempo muerto L muy alto vs τ: L=${params.L}s, τ=${params.tau}s (recomendado L < 10·τ)`)
    }

    if (Math.abs(params.K) === 0) {
      errors.push(`Ganancia K no puede ser 0`)
    }

    if (Math.abs(params.K) > 100) {
      errors.push(`Ganancia K muy alta: ${params.K} (máximo recomendado: ±100)`)
    }

    if (!Number.isFinite(params.T_amb)) {
      errors.push(`Temperatura ambiente T_amb inválida: ${params.T_amb}`)
    }

    if (Math.abs(params.T_amb) > 1000) {
      errors.push(`Temperatura ambiente T_amb fuera de rango: ${params.T_amb}°C`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

import { PRESETS } from '../../config/app.config'

/**
 * Presets de plantas típicas para testing y demostración
 */
export const PLANT_PRESETS = {
  horno_industrial: PRESETS.plant.horno_industrial,
  horno_compacto: PRESETS.plant.horno_compacto,
  chiller_industrial: PRESETS.plant.chiller_industrial
} as const
