# Arquitectura del PID Playground

## Visión General

El PID Playground es una aplicación web que simula en tiempo real la respuesta térmica de un horno o chiller usando un controlador PID ajustable. La arquitectura está diseñada para proporcionar simulación de alta precisión manteniendo la UI fluida y responsiva.

## Arquitectura de Alto Nivel

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        UI[Interfaz de Usuario]
        Components[Componentes React]
        Context[SimulationProvider]
    end
    
    subgraph "Worker Thread"
        WM[WorkerManager]
        SW[Simulation Worker]
        Engine[Simulation Engine]
    end
    
    subgraph "Core Libraries"
        PID[PID Controller]
        Plant[FOPDT Plant Model]
        Metrics[Metrics Calculator]
    end
    
    UI --> Components
    Components --> Context
    Context --> WM
    WM --> SW
    SW --> Engine
    Engine --> PID
    Engine --> Plant
    Engine --> Metrics
    
    style UI fill:#e1f5fe
    style SW fill:#f3e5f5
    style Engine fill:#e8f5e8
```

## Patrón Arquitectónico

La aplicación utiliza el **patrón Actor Model** implementado a través de Web Workers para separar la simulación computacionalmente intensiva del hilo principal de la UI.

### Principios de Diseño

1. **Separación de Responsabilidades**: UI, lógica de negocio y simulación están completamente separadas
2. **Comunicación Asíncrona**: Mensajes tipados entre UI y Worker
3. **Estado Inmutable**: El estado se maneja de forma inmutable para evitar efectos secundarios
4. **Tipado Estricto**: TypeScript en toda la aplicación para garantizar seguridad de tipos

## Componentes Principales

### 1. SimulationProvider (Context)

```mermaid
graph LR
    subgraph "SimulationProvider"
        State[Estado Global]
        Actions[Acciones]
        Callbacks[Callbacks]
    end
    
    subgraph "Hooks Especializados"
        useSim[useSimulation]
        useData[useSimulationData]
        useControls[useSimulationControls]
        usePerf[useSimulationPerformance]
    end
    
    State --> useSim
    Actions --> useSim
    Callbacks --> useSim
    useSim --> useData
    useSim --> useControls
    useSim --> usePerf
```

**Responsabilidades:**
- Gestionar el estado global de la simulación
- Proporcionar API limpia para componentes
- Manejar comunicación con WorkerManager
- Gestionar ciclo de vida del Worker

### 2. WorkerManager

```mermaid
graph TB
    subgraph "WorkerManager"
        Comm[Comunicación]
        Buffer[Buffer de Datos]
        Queue[Cola de Mensajes]
        Status[Estado del Worker]
    end
    
    subgraph "Worker"
        Engine[Simulation Engine]
        Handler[Message Handler]
        State[State Manager]
        Monitor[Performance Monitor]
    end
    
    Comm --> Engine
    Buffer --> Engine
    Queue --> Handler
    Status --> Monitor
    
    style WorkerManager fill:#fff3e0
    style Worker fill:#f1f8e9
```

**Responsabilidades:**
- Gestionar comunicación bidireccional con Worker
- Mantener buffer circular de datos
- Procesar cola de mensajes
- Monitorear estado y performance del Worker

### 3. Simulation Worker

```mermaid
graph TB
    subgraph "Simulation Worker"
        Timer[Timer de Simulación]
        Cycle[Ciclo de Simulación]
        Events[Eventos]
    end
    
    subgraph "Core Engine"
        PID[PID Controller]
        Plant[FOPDT Plant]
        Noise[Noise Generator]
        Metrics[Metrics Calculator]
    end
    
    Timer --> Cycle
    Cycle --> PID
    Cycle --> Plant
    Cycle --> Noise
    Cycle --> Metrics
    Cycle --> Events
    
    style Simulation Worker fill:#e3f2fd
    style Core Engine fill:#f3e5f5
```

**Responsabilidades:**
- Ejecutar simulación en tiempo real (10 Hz)
- Procesar comandos de la UI
- Calcular respuesta del sistema
- Enviar eventos de datos y métricas

## Flujo de Datos

### Flujo Principal de Simulación

```mermaid
sequenceDiagram
    participant UI as Interfaz de Usuario
    participant SP as SimulationProvider
    participant WM as WorkerManager
    participant SW as Simulation Worker
    participant PID as PID Controller
    participant Plant as FOPDT Plant
    
    UI->>SP: setSetpoint(60°C)
    SP->>WM: setSetpoint(60°C)
    WM->>SW: SET_SP command
    SW->>SW: Update SP = 60°C
    
    loop Cada 100ms (10 Hz)
        SW->>PID: compute(SP, PV)
        PID->>SW: u, P_term, I_term, D_term
        SW->>Plant: step(u)
        Plant->>SW: new PV
        SW->>SW: Add noise if enabled
        SW->>WM: TICK event
        WM->>SP: onTick callback
        SP->>UI: Update charts & metrics
    end
```

### Flujo de Configuración

```mermaid
sequenceDiagram
    participant User as Usuario
    participant UI as Controles UI
    participant SP as SimulationProvider
    participant WM as WorkerManager
    participant SW as Simulation Worker
    
    User->>UI: Ajustar Kp = 2.0
    UI->>SP: setPID({kp: 2.0})
    SP->>WM: SET_PID command
    WM->>SW: SET_PID command
    SW->>SW: Update PID parameters
    SW->>WM: STATE event (updated)
    WM->>SP: onState callback
    SP->>UI: Update status
```

## Estructura de Mensajes

### Contrato de Comunicación

```mermaid
graph LR
    subgraph "Comandos UI → Worker"
        INIT[INIT]
        START[START]
        PAUSE[PAUSE]
        RESET[RESET]
        SET_PID[SET_PID]
        SET_PLANT[SET_PLANT]
        SET_SP[SET_SP]
        SET_NOISE[SET_NOISE]
    end
    
    subgraph "Eventos Worker → UI"
        TICK[TICK]
        STATE[STATE]
        READY[READY]
        ERROR[ERROR]
        METRICS[METRICS]
    end
    
    INIT --> TICK
    START --> TICK
    PAUSE --> STATE
    RESET --> STATE
    SET_PID --> TICK
    SET_PLANT --> TICK
    SET_SP --> TICK
    SET_NOISE --> TICK
```

### Estructura de Mensajes

Los mensajes siguen una estructura base que incluye identificador único (UUID), tipo de mensaje, timestamp y payload específico. Se distinguen en comandos (UI → Worker) y eventos (Worker → UI).

## Gestión de Estado

### Estado Global de Simulación

```mermaid
graph TB
    subgraph "SimulationState"
        Connection[Estado de Conexión]
        Data[Datos Actuales]
        Performance[Métricas de Performance]
        Config[Configuración]
        Metrics[Métricas de Control]
    end
    
    subgraph "Estado del Worker"
        WorkerState[Estado del Worker]
        Uptime[Tiempo de Ejecución]
        Samples[Muestras Procesadas]
    end
    
    Connection --> WorkerState
    Data --> Samples
    Performance --> Uptime
    Config --> WorkerState
    Metrics --> Data
```

### Buffer de Datos

```mermaid
graph LR
    subgraph "Buffer Circular"
        D1[Data Point 1]
        D2[Data Point 2]
        D3[Data Point 3]
        D4[Data Point 4]
        D5[Data Point 5]
    end
    
    D1 --> D2 --> D3 --> D4 --> D5
    D5 -.-> D1
    
    style D1 fill:#e8f5e8
    style D5 fill:#fff3e0
```

**Características del Buffer:**
- Tamaño configurable (default: 10,000 puntos)
- Implementación FIFO eficiente
- Mantiene últimos N puntos según ventana de tiempo
- Datos tipados con timestamp, SP, PV, u, etc.

## Performance y Optimización

### Estrategias de Optimización

```mermaid
graph TB
    subgraph "Optimizaciones"
        Worker[Web Worker]
        Buffer[Buffer Circular]
        Debounce[Debounce UI]
        Memo[React.memo]
        Batch[Batch Updates]
    end
    
    subgraph "Métricas"
        CycleTime[Tiempo de Ciclo]
        CPUUsage[Uso de CPU]
        Memory[Uso de Memoria]
        FPS[FPS de UI]
    end
    
    Worker --> CycleTime
    Buffer --> Memory
    Debounce --> CPUUsage
    Memo --> FPS
    Batch --> FPS
```

### Monitoreo de Performance

- **Tiempo de Ciclo**: Objetivo < 80ms (10 Hz)
- **Uso de CPU**: Estimación basada en tiempo de ciclo
- **Memoria**: Buffer circular evita crecimiento indefinido
- **FPS de UI**: Objetivo 60 FPS constante

## Configuración y Presets

### Estructura de Configuración

```mermaid
graph TB
    subgraph "APP_CONFIG"
        Dev[DEV_CONFIG]
        Sim[SIMULATION_CONFIG]
        PID[PID_CONFIG]
        Plant[PLANT_CONFIG]
        UI[UI_CONFIG]
        Presets[PRESETS]
    end
    
    subgraph "Presets"
        PIDPresets[PID Presets]
        PlantPresets[Plant Presets]
    end
    
    Dev --> Sim
    Sim --> PID
    PID --> Plant
    Plant --> UI
    Presets --> PIDPresets
    Presets --> PlantPresets
```

### Presets Disponibles

**PID Presets:**
- Conservador: Respuesta lenta pero estable (Kp=1.0, Ki=0.1, Kd=0.0)
- Balanceado: Respuesta equilibrada (Kp=2.0, Ki=0.2, Kd=5.0)
- Agresivo: Respuesta rápida pero puede oscilar (Kp=5.0, Ki=0.5, Kd=10.0)

**Plant Presets:**
- Horno Industrial: Sistema de gran inercia térmica (τ=360s, L=25s, K=175°C)
- Horno Compacto: Sistema de laboratorio compacto (τ=45s, L=3s, K=75°C)
- Chiller Industrial: Sistema de enfriamiento industrial (τ=90s, L=10s, K=-65°C)

## Seguridad y Robustez

### Manejo de Errores

```mermaid
graph TB
    subgraph "Niveles de Error"
        Warning[Warning]
        Error[Error]
        Critical[Critical]
    end
    
    subgraph "Manejo"
        Recovery[Recovery]
        Fallback[Fallback]
        Restart[Restart]
    end
    
    Warning --> Recovery
    Error --> Fallback
    Critical --> Restart
```

### Estrategias de Recuperación

1. **Warnings**: Log y notificación al usuario
2. **Errors**: Fallback a valores por defecto
3. **Critical**: Reinicio del Worker y reconexión

### Validación de Datos

- Validación de rangos para todos los parámetros
- Sanitización de entrada de usuario
- Verificación de tipos en tiempo de compilación
- Validación de estado del Worker

## Escalabilidad y Mantenibilidad

### Arquitectura Modular

```mermaid
graph TB
    subgraph "Módulos"
        Core[Core Simulation]
        UI[User Interface]
        Worker[Worker System]
        Utils[Utilities]
    end
    
    subgraph "Interfaces"
        Types[Type Definitions]
        Config[Configuration]
        Events[Event System]
    end
    
    Core --> Types
    UI --> Events
    Worker --> Config
    Utils --> Types
```

### Extensiones Futuras

- **Múltiples Plantas**: Soporte para sistemas más complejos
- **Algoritmos Avanzados**: MPC, Fuzzy Logic, etc.
- **Análisis Offline**: Procesamiento de datos históricos
- **Integración IoT**: Conexión con dispositivos reales

## Conclusión

La arquitectura del PID Playground está diseñada para ser:

- **Escalable**: Fácil de extender con nuevas funcionalidades
- **Mantenible**: Código bien estructurado y documentado
- **Performance**: Optimizada para simulación en tiempo real
- **Robusta**: Manejo robusto de errores y recuperación
- **Tipada**: Seguridad de tipos en toda la aplicación

Esta arquitectura proporciona una base sólida para el desarrollo futuro y mantenimiento del PID Playground.

---

