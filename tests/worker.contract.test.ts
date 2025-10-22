import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { WorkerManager } from '../src/lib/simulation/worker-manager'

// FakeWorker que simula el contrato del Simulation Worker
class FakeWorker implements Worker {
  onmessage: ((this: Worker, ev: MessageEvent) => void) | null = null
  onerror: ((this: Worker, ev: ErrorEvent) => void) | null = null
  private listeners = new Map<string, Array<(ev: MessageEvent | ErrorEvent) => void>>()
  private interval: ReturnType<typeof setInterval> | null = null
  private state: 'initializing' | 'ready' | 'running' | 'paused' | 'error' = 'initializing'
  private t = 0
  private Ts = 0.1
  private SP = 25
  private PV = 25
  private tickCount = 0

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    if (!this.listeners.has(type)) this.listeners.set(type, [])
    const arr = this.listeners.get(type)!
    arr.push(listener as (ev: MessageEvent | ErrorEvent) => void)
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const arr = this.listeners.get(type)
    if (!arr) return
    const idx = arr.indexOf(listener as (ev: MessageEvent | ErrorEvent) => void)
    if (idx >= 0) arr.splice(idx, 1)
  }

  dispatch(type: string, data: unknown) {
    const ev = { data } as MessageEvent
    const arr = this.listeners.get(type) || []
    arr.forEach((fn) => fn(ev))
    if (type === 'message' && this.onmessage) this.onmessage.call(this, ev)
  }

  postMessage(message?: unknown) {
    const cmd = message as { type: string; payload: Record<string, unknown>; id: string; timestamp: number }
    switch (cmd.type) {
      case 'INIT': {
        const p = cmd.payload as { timestep?: number; bufferSize?: number; debugMode?: boolean } || { timestep: 0.1, bufferSize: 10000, debugMode: false }
        this.Ts = p.timestep ?? 0.1
        this.state = 'ready'
        this.dispatch('message', {
          id: `${Date.now()}-ready`,
          type: 'READY',
          timestamp: performance.now(),
          payload: {
            version: 'fake-1.0',
            capabilities: ['FOPDT', 'PID', 'Noise', 'Metrics'],
            limits: { max_timestep: 1, min_timestep: 0.01, max_buffer_size: 100000 }
          }
        })
        break
      }
      case 'START': {
        if (this.state !== 'ready' && this.state !== 'paused') break
        this.state = 'running'
        this.dispatchState()
        const intervalMs = this.Ts * 1000
        this.interval = setInterval(() => {
          this.tickCount++
          this.t += this.Ts
          // dinámica simple hacia SP
          const error = this.SP - this.PV
          this.PV += 0.1 * error
          const payload = {
            t: this.t,
            SP: this.SP,
            PV: this.PV,
            u: Math.max(0, Math.min(1, error / 100)),
            PV_clean: this.PV,
            error,
            P_term: error,
            I_term: 0,
            D_term: 0,
            plant_state: this.PV - 25,
            u_raw: error / 100,
            saturated: false,
            bounds: { t_min: Math.max(0, this.t - 60), t_max: this.t, PV_min: this.PV - 5, PV_max: this.PV + 5 }
          }
          this.dispatch('message', { id: `${Date.now()}-tick`, type: 'TICK', timestamp: performance.now(), payload })
          if (this.tickCount % 5 === 0) {
            this.dispatch('message', {
              id: `${Date.now()}-metrics`,
              type: 'METRICS',
              timestamp: performance.now(),
              payload: {
                overshoot: Math.max(0, (this.PV - this.SP) / Math.max(1, Math.abs(this.SP)) * 100),
                t_peak: this.t / 2,
                settling_time: this.t > 1 ? this.t - 0.5 : 0,
                is_calculating: this.t < 1,
                sp_previous: this.SP,
                pv_max: this.PV,
                pv_min: this.PV - 1,
                t_start: 0,
                t_current: this.t,
                samples_count: this.tickCount
              }
            })
          }
        }, intervalMs)
        break
      }
      case 'PAUSE': {
        if (this.state !== 'running') break
        if (this.interval) { clearInterval(this.interval); this.interval = null }
        this.state = 'paused'
        this.dispatchState()
        break
      }
      case 'RESET': {
        if (this.interval) { clearInterval(this.interval); this.interval = null }
        this.t = 0
        this.PV = 25
        const preserve = !!(cmd.payload as { preserveParams?: boolean })?.preserveParams
        if (!preserve) this.SP = 25
        this.state = 'ready'
        this.dispatchState()
        break
      }
      case 'SET_SP': {
        this.SP = (cmd.payload as { value?: number })?.value ?? this.SP
        break
      }
      case 'SET_PID': {
        // ignorado en fake
        break
      }
      case 'SET_PLANT': {
        // ignorado en fake
        break
      }
      case 'SET_NOISE': {
        // ignorado en fake
        break
      }
    }
  }

  private dispatchState() {
    const uptime = this.t
    const avg_cycle_time = this.Ts * 1000
    const max_cycle_time = avg_cycle_time
    const cpu_usage_estimate = 10
    this.dispatch('message', {
      id: `${Date.now()}-state`,
      type: 'STATE',
      timestamp: performance.now(),
      payload: {
        state: this.state,
        uptime,
        samples_processed: this.tickCount,
        performance: { avg_cycle_time, max_cycle_time, cpu_usage_estimate }
      }
    })
  }

  terminate() {
    if (this.interval) { clearInterval(this.interval); this.interval = null }
  }
}

function createFakeWorker(): Worker {
  return new FakeWorker()
}

// Helpers
function waitFor<T>(predicate: () => T | undefined | boolean, timeoutMs = 5000, intervalMs = 20): Promise<T> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      try {
        const result = predicate()
        if (result) {
          clearInterval(timer)
          resolve(result as T)
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(timer)
          reject(new Error('Timeout esperando condición'))
        }
      } catch (e) {
        clearInterval(timer)
        reject(e)
      }
    }, intervalMs)
  })
}

describe('Worker Contract - INIT/START/PAUSE/RESET y SET_*', () => {
  let manager: WorkerManager
  const received = {
    ready: false,
    ticks: 0,
    stateRunning: false,
    statePaused: false,
    metricsAny: false,
    lastTick: null as unknown
  }

  beforeAll(async () => {
    manager = new WorkerManager({ timestep: 0.05, bufferSize: 2000, debugMode: false, createWorker: createFakeWorker })
    manager.setCallbacks({
      onReady: () => { received.ready = true },
      onTick: (p) => { received.ticks++; received.lastTick = p },
      onState: (s) => {
        if (s.state === 'running') received.stateRunning = true
        if (s.state === 'paused') received.statePaused = true
      },
      onMetrics: () => { received.metricsAny = true }
    })
    await manager.initialize()
    await waitFor(() => received.ready, 5000)
  })

  afterAll(() => {
    manager.destroy()
  })

  it('START produce STATE running y TICKs', async () => {
    await manager.start()
    await waitFor(() => received.stateRunning, 3000)
    await waitFor(() => received.ticks > 2, 4000)
    expect(received.stateRunning).toBe(true)
    expect(received.ticks).toBeGreaterThan(2)
  })

  it('SET_SP y SET_PID no generan error y reflejan en TICK', async () => {
    await manager.setSetpoint(60)
    await manager.setPID({ kp: 2, ki: 0.5, kd: 0.1, N: 10, Tt: 1, enabled: true })
    // esperar al menos un tick nuevo y que SP refleje 60
    const ok = await waitFor(() => received.lastTick && received.lastTick.SP === 60, 3000).then(() => true).catch(() => false)
    expect(ok).toBe(true)
  })

  it('SET_PLANT actualiza parámetros sin romper el ciclo', async () => {
    await manager.setPlant({ K: 3, tau: 15, L: 0, T_amb: 25, mode: 'horno' })
    const tickCountBefore = received.ticks
    await new Promise(r => setTimeout(r, 200))
    expect(received.ticks).toBeGreaterThan(tickCountBefore)
  })

  it('Emite METRICS en algún punto durante la simulación', async () => {
    const ok = await waitFor(() => received.metricsAny, 5000).then(() => true).catch(() => false)
    expect(ok).toBe(true)
  })

  it('PAUSE cambia estado y detiene incremento de ticks', async () => {
    const ticksBefore = received.ticks
    await manager.pause()
    await waitFor(() => received.statePaused, 3000)
    const ticksAfterPauseWindow = received.ticks
    await new Promise(r => setTimeout(r, 250))
    expect(received.ticks).toBe(ticksAfterPauseWindow)
    expect(received.statePaused).toBe(true)
    expect(ticksAfterPauseWindow).toBeGreaterThanOrEqual(ticksBefore)
  })

  it('RESET con preserveParams=true limpia buffer y mantiene SP', async () => {
    const lastSp = received.lastTick?.SP ?? 25
    await manager.reset(true)
    // tras reset, esperamos STATE ready y luego START nuevamente para confirmar continuidad
    await new Promise(r => setTimeout(r, 100))
    await manager.start()
    await waitFor(() => received.stateRunning, 3000)
    await waitFor(() => received.ticks > 0, 3000)
    // SP debería mantenerse
    const ok = await waitFor(() => received.lastTick && received.lastTick.SP === lastSp, 3000).then(() => true).catch(() => false)
    expect(ok).toBe(true)
  })
})


