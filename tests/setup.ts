// Vitest setup para entorno jsdom
// Mock básico de Web Worker para permitir pruebas del WorkerManager

class MockWorker {
  onmessage: ((this: Worker, ev: MessageEvent) => void) | null = null
  onerror: ((this: Worker, ev: ErrorEvent) => void) | null = null

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    // no-op para compatibilidad
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    // no-op
  }

  postMessage(_message?: unknown, _transfer?: Transferable[]) {
    // En tests de contrato probaremos el worker real con new URL(...) vía Vite.
    // Este mock previene fallos cuando alguna parte del código crea Worker sin URL bundle-safe.
  }

  terminate() {
    // no-op
  }
}

// Solo definir si no existe (por si el entorno la provee)
if (typeof (globalThis as Record<string, unknown>).Worker === 'undefined') {
  ;(globalThis as Record<string, unknown>).Worker = MockWorker as unknown as typeof Worker
}

// Polyfills menores
if (typeof (globalThis as Record<string, unknown>).performance === 'undefined') {
  ;(globalThis as Record<string, unknown>).performance = { now: () => Date.now() }
}


