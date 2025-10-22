# Tutorial 2: Ajuste de Ganancias PID

> **Tiempo estimado**: 20 minutos  
> **Nivel**: Intermedio  
> **Prerequisitos**: [Tutorial 1: Conceptos Básicos de PID](./01-basic-pid.md)

---

## Objetivos del Tutorial

Al finalizar este tutorial, dominarás:

- ✅ **Métodos sistemáticos** de tuning PID
- ✅ **Técnicas de Ziegler-Nichols** y variaciones
- ✅ **Optimización de parámetros** para diferentes sistemas
- ✅ **Diagnóstico y corrección** de problemas de control

---

## ¿Por qué es Importante el Tuning?

### El Problema del Tuning

Un controlador PID mal ajustado puede causar:

```mermaid
graph TD
    A[Controlador Mal Ajustado] --> B[Oscilaciones Excesivas]
    A --> C[Respuesta Muy Lenta]
    A --> D[Error Estacionario]
    A --> E[Inestabilidad]
    
    B --> F[Desgaste del Sistema]
    C --> G[Pérdida de Productividad]
    D --> H[Calidad Deficiente]
    E --> I[Daños al Equipo]
    
    style B fill:#ffcdd2
    style C fill:#ffcdd2
    style D fill:#ffcdd2
    style E fill:#ffcdd2
    style F fill:#ffcdd2
    style G fill:#ffcdd2
    style H fill:#ffcdd2
    style I fill:#ffcdd2
```

### Beneficios del Tuning Correcto

```mermaid
graph TD
    A[Controlador Bien Ajustado] --> B[Respuesta Rápida]
    A --> C[Sin Overshoot]
    A --> D[Sin Error Estacionario]
    A --> E[Estabilidad]
    
    B --> F[Mayor Productividad]
    C --> G[Menor Desgaste]
    D --> H[Mejor Calidad]
    E --> I[Operación Confiable]
    
    style B fill:#c8e6c9
    style C fill:#c8e6c9
    style D fill:#c8e6c9
    style E fill:#c8e6c9
    style F fill:#c8e6c9
    style G fill:#c8e6c9
    style H fill:#c8e6c9
    style I fill:#c8e6c9
```

---

## Métodos de Tuning

### 1. Método de Ziegler-Nichols (Clásico)

El método más conocido y ampliamente utilizado para sistemas de primer orden con tiempo muerto.

#### Fase 1: Identificación del Sistema

```mermaid
graph LR
    A[Paso Escalón] --> B[Medir Respuesta]
    B --> C[Identificar L y τ]
    C --> D[Calcular K]
    D --> E[Parámetros del Sistema]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
```

#### Fase 2: Determinación de Ganancias Críticas

```mermaid
graph TD
    A[Establecer Ki=0, Kd=0] --> B[Aumentar Kp gradualmente]
    B --> C{¿Oscilaciones sostenidas?}
    C -->|No| B
    C -->|Sí| D[Registrar Kp_crítico]
    D --> E[Medir período de oscilación T_crítico]
    E --> F[Calcular parámetros PID]
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
```

#### Fórmulas de Ziegler-Nichols

| Control | Kp | Ti | Td |
|---------|----|----|----|
| **P** | 0.5 × Kp_cr | - | - |
| **PI** | 0.45 × Kp_cr | 0.83 × T_cr | - |
| **PID** | 0.6 × Kp_cr | 0.5 × T_cr | 0.125 × T_cr |

### 2. Método de Cohen-Coon

Variación del método Z-N que considera la relación L/τ.

```mermaid
graph LR
    A[Identificar L, τ, K] --> B[Calcular L/τ]
    B --> C[Seleccionar Fórmulas]
    C --> D[Calcular Parámetros]
    D --> E[Fine-tune]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
```

#### Fórmulas de Cohen-Coon

**Para Control PI**:
```
Kp = (τ/KL) × [0.9 + L/(12τ)]
Ti = L × [30 + 3(L/τ)] / [9 + 20(L/τ)]
```

**Para Control PID**:
```
Kp = (τ/KL) × [1.35 + L/(4τ)]
Ti = L × [32 + 6(L/τ)] / [13 + 8(L/τ)]
Td = L × 4 / [11 + 2(L/τ)]
```

### 3. Método de Respuesta al Escalón

Método más simple que no requiere oscilaciones críticas.

```mermaid
graph TD
    A[Aplicar Escalón] --> B[Medir Respuesta]
    B --> C[Identificar Punto de Inflexión]
    C --> D[Medir Tiempo Muerto L]
    D --> E[Calcular Constante de Tiempo τ]
    E --> F[Aplicar Fórmulas]
    F --> G[Fine-tune]
    
    style A fill:#e1f5fe
    style G fill:#c8e6c9
```

---

## Técnicas de Tuning Práctico

### Técnica 1: Tuning Secuencial

```mermaid
graph TD
    A[Iniciar con P] --> B[Ki=0, Kd=0]
    B --> C[Aumentar Kp hasta oscilaciones]
    C --> D[Reducir Kp en 50%]
    D --> E[Añadir Ki]
    E --> F[Aumentar Ki hasta eliminar error]
    F --> G[Añadir Kd]
    G --> H[Aumentar Kd para reducir oscilaciones]
    H --> I[Fine-tune final]
    
    style A fill:#e1f5fe
    style I fill:#c8e6c9
```

### Técnica 2: Tuning por Ensayo y Error

```mermaid
graph TD
    A[Configuración Inicial] --> B[Probar Configuración]
    B --> C{¿Respuesta Adecuada?}
    C -->|Sí| D[Configuración Final]
    C -->|No| E[Identificar Problema]
    E --> F[Ajustar Parámetros]
    F --> B
    
    style A fill:#e1f5fe
    style D fill:#c8e6c9
    style E fill:#fff3e0
```

### Técnica 3: Tuning por Reglas Heurísticas

```mermaid
graph TD
    A[Identificar Tipo de Sistema] --> B{Sistema Rápido?}
    B -->|Sí| C[Usar P o PI]
    B -->|No| D{Sistema Lento?}
    D -->|Sí| E[Usar PID]
    D -->|No| F[Usar PI]
    
    C --> G[Aplicar Reglas Específicas]
    E --> G
    F --> G
    
    style A fill:#e1f5fe
    style G fill:#c8e6c9
```

---

## Criterios de Optimización

### 1. Criterios de Rendimiento

```mermaid
graph LR
    A[Criterios de Rendimiento] --> B[Tiempo de Subida]
    A --> C[Tiempo de Establecimiento]
    A --> D[Overshoot]
    A --> E[Error Estacionario]
    A --> F[IAE/ISE]
    
    style A fill:#e1f5fe
    style B fill:#e8f5e8
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#ffcdd2
    style F fill:#e3f2fd
```

### 2. Compromisos en el Tuning

```mermaid
graph TD
    A[Compromisos del Tuning] --> B[Velocidad vs Estabilidad]
    A --> C[Precisión vs Robustez]
    A --> D[Respuesta vs Ruido]
    A --> E[Simplicidad vs Performance]
    
    B --> F[Kp alto = rápido pero inestable]
    C --> G[Ki alto = preciso pero sensible]
    D --> H[Kd alto = estable pero ruidoso]
    E --> I[PID completo = mejor pero complejo]
    
    style A fill:#e1f5fe
    style F fill:#fff3e0
    style G fill:#fff3e0
    style H fill:#fff3e0
    style I fill:#fff3e0
```

---

## Tuning para Diferentes Tipos de Sistemas

### 1. Sistemas de Primer Orden (FOPDT)

```mermaid
graph LR
    A[Sistema FOPDT] --> B[G(s) = K/(τs+1) × e^(-Ls)]
    B --> C[Identificar K, τ, L]
    C --> D[Aplicar Ziegler-Nichols]
    D --> E[Fine-tune]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
```

**Reglas de Tuning**:
- **Kp**: 0.5-2.0 × (τ/KL)
- **Ki**: 0.1-0.5 × Kp/τ
- **Kd**: 0.1-0.5 × Kp × τ

### 2. Sistemas de Segundo Orden

```mermaid
graph LR
    A[Sistema 2do Orden] --> B[G(s) = K/(s² + 2ζωs + ω²)]
    B --> C[Identificar ζ, ω]
    C --> D[ζ < 0.7: PID]
    D --> E[ζ > 0.7: PI]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
```

### 3. Sistemas Integradores

```mermaid
graph LR
    A[Sistema Integrador] --> B[G(s) = K/s]
    B --> C[Usar Control PI]
    C --> D[Kp = 0.5-1.0]
    D --> E[Ki = 0.1-0.3]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
```

---

## Técnicas de Fine-tuning

### 1. Ajuste de Overshoot

```mermaid
graph TD
    A[Overshoot Alto] --> B{Reducir Kp?}
    B -->|Sí| C[Reducir Kp 10-20%]
    B -->|No| D{Aumentar Kd?}
    D -->|Sí| E[Aumentar Kd 10-20%]
    D -->|No| F[Reducir Ki]
    
    C --> G[Probar]
    E --> G
    F --> G
    G --> H{¿Mejoró?}
    H -->|Sí| I[Continuar]
    H -->|No| A
    
    style A fill:#ffcdd2
    style I fill:#c8e6c9
```

### 2. Ajuste de Tiempo de Establecimiento

```mermaid
graph TD
    A[Tiempo de Establecimiento Alto] --> B{Aumentar Kp?}
    B -->|Sí| C[Aumentar Kp 10-20%]
    B -->|No| D{Aumentar Ki?}
    D -->|Sí| E[Aumentar Ki 10-20%]
    D -->|No| F[Reducir Kd]
    
    C --> G[Probar]
    E --> G
    F --> G
    G --> H{¿Mejoró?}
    H -->|Sí| I[Continuar]
    H -->|No| A
    
    style A fill:#ffcdd2
    style I fill:#c8e6c9
```

### 3. Ajuste de Error Estacionario

```mermaid
graph TD
    A[Error Estacionario] --> B{Aumentar Ki?}
    B -->|Sí| C[Aumentar Ki 10-20%]
    B -->|No| D{Aumentar Kp?}
    D -->|Sí| E[Aumentar Kp 10-20%]
    D -->|No| F[Verificar Setpoint]
    
    C --> G[Probar]
    E --> G
    F --> G
    G --> H{¿Mejoró?}
    H -->|Sí| I[Continuar]
    H -->|No| A
    
    style A fill:#ffcdd2
    style I fill:#c8e6c9
```

---

## Diagnóstico de Problemas

### 1. Oscilaciones Persistentes

```mermaid
graph TD
    A[Oscilaciones Persistentes] --> B{Kp muy alto?}
    B -->|Sí| C[Reducir Kp]
    B -->|No| D{Ki muy alto?}
    D -->|Sí| E[Reducir Ki]
    D -->|No| F{Kd muy bajo?}
    F -->|Sí| G[Aumentar Kd]
    F -->|No| H[Verificar Sistema]
    
    style C fill:#c8e6c9
    style E fill:#c8e6c9
    style G fill:#c8e6c9
    style H fill:#ffcdd2
```

### 2. Respuesta Muy Lenta

```mermaid
graph TD
    A[Respuesta Muy Lenta] --> B{Kp muy bajo?}
    B -->|Sí| C[Aumentar Kp]
    B -->|No| D{Ki muy bajo?}
    D -->|Sí| E[Aumentar Ki]
    D -->|No| F{Kd muy alto?}
    F -->|Sí| G[Reducir Kd]
    F -->|No| H[Verificar Sistema]
    
    style C fill:#c8e6c9
    style E fill:#c8e6c9
    style G fill:#c8e6c9
    style H fill:#ffcdd2
```

### 3. Inestabilidad

```mermaid
graph TD
    A[Inestabilidad] --> B[Reducir Kp 50%]
    B --> C[Establecer Ki=0]
    C --> D[Establecer Kd=0]
    D --> E[Probar Sistema]
    E --> F{¿Estable?}
    F -->|Sí| G[Añadir Ki gradualmente]
    F -->|No| H[Reducir Kp más]
    
    style A fill:#ffcdd2
    style G fill:#c8e6c9
    style H fill:#ffcdd2
```

---

## Checklist de Tuning

### Antes del Tuning

- [ ] **Identificar el tipo de sistema**
- [ ] **Medir parámetros del sistema** (K, τ, L)
- [ ] **Establecer objetivos de rendimiento**
- [ ] **Preparar herramientas de medición**

### Durante el Tuning

- [ ] **Empezar con control P**
- [ ] **Añadir control I gradualmente**
- [ ] **Añadir control D si es necesario**
- [ ] **Documentar cada cambio**

### Después del Tuning

- [ ] **Verificar estabilidad**
- [ ] **Probar con diferentes setpoints**
- [ ] **Validar con disturbios**
- [ ] **Documentar configuración final**

---

## Casos de Estudio

### Caso 1: Horno Industrial

**Características**:
- τ = 180s (sistema lento)
- L = 5s (tiempo muerto)
- K = 0.015 (ganancia baja)

**Tuning Recomendado**:
- Kp = 2.0
- Ki = 0.1 s⁻¹
- Kd = 10 s

### Caso 2: Sistema de Enfriamiento

**Características**:
- τ = 60s (sistema medio)
- L = 2s (tiempo muerto bajo)
- K = -0.04 (ganancia negativa)

**Tuning Recomendado**:
- Kp = 1.5
- Ki = 0.15 s⁻¹
- Kd = 5 s

### Caso 3: Control de Velocidad

**Características**:
- τ = 0.1s (sistema rápido)
- L = 0s (sin tiempo muerto)
- K = 1.0 (ganancia unitaria)

**Tuning Recomendado**:
- Kp = 0.5
- Ki = 2.0 s⁻¹
- Kd = 0.05 s

---

## Resumen

### Métodos Principales

1. **Ziegler-Nichols**: Para sistemas FOPDT
2. **Cohen-Coon**: Variación mejorada de Z-N
3. **Respuesta al Escalón**: Método simple y directo

### Técnicas de Tuning

1. **Secuencial**: P → PI → PID
2. **Ensayo y Error**: Iterativo y práctico
3. **Heurístico**: Basado en reglas y experiencia

### Criterios de Optimización

- **Velocidad**: Tiempo de subida y establecimiento
- **Precisión**: Overshoot y error estacionario
- **Estabilidad**: Robustez y rechazo de disturbios

---

## Próximos Pasos

Ahora que dominas las técnicas de tuning, puedes:

1. **Practicar** con diferentes sistemas en el simulador
2. **Experimentar** con los métodos aprendidos
3. **Aplicar** técnicas avanzadas de optimización
4. **Explorar** control adaptativo y robusto

### Recursos Adicionales

- [Tutorial 3: Análisis de Respuesta](./03-response-analysis.md)
- [Tutorial 4: Casos Avanzados](./04-advanced-cases.md)
- [Ejemplos Prácticos](../examples/)
- [FAQ](../faq.md)

---

Has completado el tutorial de tuning PID. Ahora tienes las herramientas necesarias para ajustar controladores PID de manera sistemática y efectiva.

---

