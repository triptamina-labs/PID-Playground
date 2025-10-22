# Teoría del Controlador PID

## Descripción General

El controlador PID (Proportional-Integral-Derivative) implementado en el simulador incluye características avanzadas para uso industrial y educativo: derivada filtrada sobre la medida, anti-windup por back-calculation, y sintonía automática de parámetros.

## Formulación Matemática

### Ecuación Básica del PID

La salida del controlador PID está dada por:

```
u(t) = K_p·e(t) + K_i·∫e(τ)dτ + K_d·(de/dt)
```

Donde:
- *u*(*t*) = Salida de control [0-1]
- *e*(*t*) = Error = *SP*(*t*) - *PV*(*t*) [°C]
- *K_p* = Ganancia proporcional [adimensional]
- *K_i* = Ganancia integral [s⁻¹]
- *K_d* = Tiempo derivativo [s]

### Formulación Discreta

En forma discreta con timestep *T_s*:

```
u[k] = K_p·e[k] + K_i·T_s·Σe[i] + K_d·(e[k] - e[k-1])/T_s
```

## Diagrama de Bloques

```mermaid
graph TD
    A[SP] --> B[+]
    C[PV] --> D[-]
    D --> B
    B --> E[Error e]
    
    E --> F[Kp]
    E --> G[Ki·∫]
    E --> H[Kd·d/dt]
    
    F --> I[P_term]
    G --> J[I_term]
    H --> K[D_term]
    
    I --> L[+]
    J --> L
    K --> L
    
    L --> M[u_raw]
    M --> N[Saturation]
    N --> O[u]
    
    O --> P[Anti-windup]
    P --> G
    
    style A fill:#e8f5e8
    style C fill:#ffebee
    style O fill:#e3f2fd
```

## Implementación Avanzada

### 1. Derivada Filtrada sobre la Medida

#### Motivación

La derivada calculada sobre el error causa kick derivativo en cambios de setpoint:

```mermaid
graph LR
    A[SP cambia] --> B[Error salta]
    B --> C[Derivada spike]
    C --> D[Salida inestable]
    
    style A fill:#ffebee
    style D fill:#ffebee
```

#### Solución: Derivada sobre PV

```
D_term[k] = -K_d·(PV[k] - PV[k-1])/T_s
```

Ventajas:
- Elimina kick derivativo
- Reduce ruido de medición
- Comportamiento realista

#### Filtro de Primer Orden

Para reducir ruido adicional:

```
τ_f = K_d/N
α = τ_f/(τ_f + T_s)
D_filt[k] = α·D_filt[k-1] + (1-α)·(-K_d)·(PV[k] - PV[k-1])/T_s
```

Donde *N* = factor de filtro (default: 10)

### 2. Anti-windup por Back-calculation

#### Problema del Windup

```mermaid
graph TD
    A[Error persistente] --> B[Integrador crece]
    B --> C[Salida saturada]
    C --> D[Integrador sigue creciendo]
    D --> E[Overshoot excesivo]
    
    style C fill:#ffebee
    style E fill:#ffebee
```

#### Solución: Back-calculation

```
u_raw[k] = P_term[k] + I_term[k] + D_term[k]
u[k] = saturate(u_raw[k], 0, 1)
tracking_error = u[k] - u_raw[k]
I_term[k+1] = I_term[k] + K_i·T_s·e[k] + (T_s/T_t)·tracking_error
```

Donde *T_t* = tiempo de tracking [s]

## Análisis de Respuesta

### Respuesta al Escalón

```mermaid
graph TD
    A[Escalón SP] --> B[Error inicial]
    B --> C[Respuesta P]
    C --> D[Respuesta I]
    D --> E[Respuesta D]
    E --> F[Respuesta total]
    
    G[Características] --> H[Overshoot]
    G --> I[Settling time]
    G --> J[Steady-state error]
    
    style A fill:#e8f5e8
    style F fill:#e8f5e8
```

### Efecto de Cada Término

#### Término Proporcional (K_p)

```mermaid
graph LR
    A[Kp bajo] --> B[Respuesta lenta]
    A --> C[Error SS alto]
    
    D[Kp alto] --> E[Respuesta rápida]
    D --> F[Overshoot]
    D --> G[Oscilaciones]
    
    style B fill:#fff3e0
    style F fill:#ffebee
```

#### Término Integral (K_i)

```mermaid
graph LR
    A[Ki bajo] --> B[Eliminación SS lenta]
    A --> C[Estabilidad]
    
    D[Ki alto] --> E[Eliminación SS rápida]
    D --> F[Overshoot]
    D --> G[Oscilaciones]
    
    style B fill:#fff3e0
    style F fill:#ffebee
```

#### Término Derivativo (K_d)

```mermaid
graph LR
    A[Kd bajo] --> B[Poca anticipación]
    A --> C[Overshoot alto]
    
    D[Kd alto] --> E[Anticipación]
    D --> F[Reducción overshoot]
    D --> G[Amplificación ruido]
    
    style B fill:#fff3e0
    style G fill:#ffebee
```

## Sintonía Automática

### Cálculo de Tiempo de Tracking

Heurística utilizada: Tt = Ti/4 donde Ti = Kp/Ki

Si Ki ≤ 0, entonces Tt = 1.0 (valor por defecto)

Valor mínimo: Tt = 0.1s

### Presets Típicos

| Preset | K_p | K_i [s⁻¹] | K_d [s] | N | Aplicación |
|--------|-----|-----------|---------|---|------------|
| Conservador | 1.0 | 0.1 | 0.0 | 10 | Procesos lentos |
| Balanceado | 2.0 | 0.2 | 5.0 | 10 | Uso general |
| Agresivo | 5.0 | 0.5 | 10.0 | 10 | Procesos rápidos |

### Reglas de Sintonía

#### Método de Ziegler-Nichols

1. **Determinar K_u**: Aumentar K_p hasta oscilaciones sostenidas
2. **Determinar T_u**: Período de oscilaciones
3. **Calcular parámetros**:
   - K_p = 0.6·K_u
   - K_i = 1.2·K_p/T_u
   - K_d = 0.075·K_p·T_u

#### Método de Cohen-Coon

Para sistemas FOPDT con L/τ < 1:

```
Kp = (1/K)·(τ/L)·(1 + L/(3τ))
Ki = (1/K)·(τ/L)·(1 + L/(3τ))·(1 + L/(6τ))
Kd = (1/K)·(τ/L)·(1 + L/(3τ))·L/6
```

## Casos Límite

### K_p → 0 (Control Puro I-D)

```
u(t) ≈ K_i·∫e(τ)dτ + K_d·(de/dt)
```

Comportamiento: Respuesta muy lenta, posible error de estado estacionario

### K_i → 0 (Control PD)

```
u(t) = K_p·e(t) + K_d·(de/dt)
```

Comportamiento: Respuesta rápida, error de estado estacionario permanente

### K_d → 0 (Control PI)

```
u(t) = K_p·e(t) + K_i·∫e(τ)dτ
```

Comportamiento: Sin anticipación, posible overshoot elevado

## Análisis de Estabilidad

### Criterios de Estabilidad

1. **Estabilidad de Lyapunov**: Para sistemas lineales
2. **Criterio de Routh-Hurwitz**: Para polinomios característicos
3. **Análisis de Nyquist**: Para sistemas con retardo

### Región de Estabilidad

```mermaid
graph TD
    A[Parámetros PID] --> B{Validación}
    B -->|Válidos| C[Estable]
    B -->|Inválidos| D[Inestable]
    
    E[Factores] --> F[Kp muy alto]
    E --> G[Ki muy alto]
    E --> H[Kd muy alto]
    E --> I[Timestep muy grande]
    
    style C fill:#e8f5e8
    style D fill:#ffebee
```

### Condiciones de Estabilidad Numérica

- N·T_s ≤ 1 (para estabilidad del filtro derivativo)
- K_d/T_s < 1000 (para evitar amplificación excesiva de ruido)
- Todos los parámetros deben ser no negativos

## Referencias

1. **Åström, K.J. & Hägglund, T.** "Advanced PID Control" - Capítulos 3 y 6
2. **Visioli, A.** "Practical PID Control" - Derivada filtrada y anti-windup
3. **ISA Standard 51.1-1979** "Process Instrumentation Terminology"

---

**Implementación**: `src/lib/simulation/pid-controller.ts`  
**Validación**: `tests/pid.antiwindup.test.ts`, `tests/pid.derivative.noise.test.ts`
