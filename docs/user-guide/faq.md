# ❓ Preguntas Frecuentes (FAQ)

> **Navegación rápida**: Encuentra respuestas a las preguntas más comunes sobre PID Playground

---

## 📋 Índice

- [**Conceptos Básicos**](#conceptos-básicos)
- [**Configuración y Uso**](#configuración-y-uso)
- [**Problemas Técnicos**](#problemas-técnicos)
- [**Optimización y Tuning**](#optimización-y-tuning)
- [**Características Avanzadas**](#características-avanzadas)
- [**Solución de Problemas**](#solución-de-problemas)

---

## 🎯 Conceptos Básicos

### ¿Qué es un controlador PID?

**R**: Un controlador PID (Proporcional-Integral-Derivativo) es un algoritmo de control que ajusta automáticamente una variable de salida basándose en el error entre el valor deseado (setpoint) y el valor actual (PV).

**Componentes**:
- **P (Proporcional)**: Respuesta inmediata al error
- **I (Integral)**: Elimina error estacionario
- **D (Derivativo)**: Reduce oscilaciones

### ¿Cuándo debo usar control P, PI o PID?

**R**: La elección depende del tipo de sistema:

| Tipo de Control | Cuándo Usar | Ejemplos |
|----------------|-------------|----------|
| **P** | Sistemas rápidos, error estacionario aceptable | Control de velocidad, posición |
| **PI** | Sistemas con error estacionario inaceptable | Control de nivel, temperatura |
| **PID** | Sistemas lentos con oscilaciones | Hornos, procesos químicos |

### ¿Qué significa FOPDT?

**R**: **FOPDT** = First Order Plus Dead Time (Primer Orden más Tiempo Muerto). Es un modelo matemático que describe sistemas con:
- **Primer orden**: Respuesta exponencial
- **Tiempo muerto**: Retardo antes de la respuesta

**Fórmula**: `G(s) = K/(τs+1) × e^(-Ls)`

### ¿Por qué es importante el tiempo muerto?

**R**: El tiempo muerto (L) es crucial porque:
- **Causa inestabilidad** si no se considera
- **Limita la velocidad** de respuesta del sistema
- **Requiere ajustes especiales** en el controlador PID

---

## ⚙️ Configuración y Uso

### ¿Cómo inicio mi primera simulación?

**R**: Sigue estos pasos:

1. **Selecciona el modo**: Horno o Chiller
2. **Establece el setpoint**: Temperatura objetivo
3. **Usa un preset**: "Horno Compacto" para empezar
4. **Haz clic en "Iniciar"**
5. **Observa las gráficas** y métricas

### ¿Qué significan las unidades de las ganancias?

**R**: Las unidades dependen del tipo de ganancia:

| Ganancia | Unidad | Descripción |
|----------|--------|-------------|
| **Kp** | Adimensional | Ganancia proporcional |
| **Ki** | s⁻¹ | Ganancia integral (por segundo) |
| **Kd** | s | Tiempo derivativo (segundos) |

### ¿Cómo cambio entre modo Horno y Chiller?

**R**: 
1. **Localiza el selector de modo** en el panel izquierdo
2. **Haz clic** en "Horno" o "Chiller"
3. **El sistema se reiniciará** automáticamente
4. **Los parámetros se ajustarán** según el modo

**Diferencias**:
- **Horno**: Calienta (K positivo)
- **Chiller**: Enfría (K negativo)

### ¿Qué son los presets y cuándo usarlos?

**R**: Los presets son configuraciones predefinidas optimizadas para diferentes tipos de sistemas:

| Preset | Características | Uso Recomendado |
|--------|----------------|-----------------|
| **Horno Industrial** | τ=360s, L=25s, K=175°C | Sistemas grandes e inercia alta |
| **Horno Compacto** | τ=45s, L=3s, K=75°C | Experimentación general y laboratorio |
| **Chiller Industrial** | τ=90s, L=10s, K=-65°C | Control de enfriamiento industrial |

---

## 🔧 Problemas Técnicos

### La simulación no responde, ¿qué hago?

**R**: Verifica estos puntos:

1. **Estado de la simulación**:
   - ✅ ¿Está en modo "Iniciado"?
   - ✅ ¿El botón muestra "Pausar"?

2. **Configuración básica**:
   - ✅ ¿El setpoint es diferente a la temperatura inicial?
   - ✅ ¿Las ganancias no son todas cero?

3. **Parámetros de la planta**:
   - ✅ ¿K > 0 (horno) o K < 0 (chiller)?
   - ✅ ¿τ > 0 y L ≥ 0?

### ¿Por qué las gráficas no se actualizan?

**R**: Posibles causas y soluciones:

1. **Problema de rendimiento**:
   - Reducir la ventana temporal (30s en lugar de 300s)
   - Cerrar otras pestañas del navegador

2. **Problema de datos**:
   - Hacer clic en "Reset" para limpiar
   - Verificar que la simulación esté activa

3. **Problema del navegador**:
   - Recargar la página (F5)
   - Usar un navegador diferente

### ¿Cómo exporto los datos de la simulación?

**R**: La exportación CSV está en desarrollo. Por ahora puedes:

1. **Usar las herramientas del navegador**:
   - F12 → Console → Copiar datos
   - Screenshot de las gráficas

2. **Anotar métricas importantes**:
   - Overshoot (%)
   - Tiempo de establecimiento (s)
   - Configuración final

### ¿El simulador funciona en móviles?

**R**: Sí, pero con limitaciones:

**✅ Funciona**:
- Navegadores modernos (Chrome, Safari)
- Controles básicos
- Visualización de gráficas

**⚠️ Limitaciones**:
- Interfaz optimizada para desktop
- Rendimiento reducido
- Algunas funciones avanzadas limitadas

---

## 🎯 Optimización y Tuning

### ¿Cómo sé si mis ganancias están bien ajustadas?

**R**: Busca estos indicadores de buen tuning:

**✅ Señales positivas**:
- Respuesta rápida sin overshoot excesivo
- Sin error estacionario
- Estabilidad ante disturbios

**❌ Señales negativas**:
- Oscilaciones persistentes
- Respuesta muy lenta
- Error estacionario

### ¿Qué hacer si tengo oscilaciones excesivas?

**R**: Sigue este orden de ajustes:

1. **Reducir Kp** en 10-20%
2. **Aumentar Kd** en 10-20%
3. **Reducir Ki** si persisten
4. **Verificar parámetros** de la planta

### ¿Cómo optimizo el tiempo de establecimiento?

**R**: Para reducir el tiempo de establecimiento:

1. **Aumentar Kp** (cuidado con overshoot)
2. **Aumentar Ki** (elimina error estacionario)
3. **Reducir Kd** (si es muy alto)
4. **Verificar** que no cause inestabilidad

### ¿Cuál es la diferencia entre overshoot y error estacionario?

**R**: Son métricas diferentes:

| Métrica | Descripción | Causa |
|---------|-------------|-------|
| **Overshoot** | Exceso temporal sobre el setpoint | Kp muy alto |
| **Error Estacionario** | Diferencia permanente con el setpoint | Ki muy bajo |

---

## 🚀 Características Avanzadas

### ¿Qué es el SSR por ventana?

**R**: **SSR** = Solid State Relay (Relé de Estado Sólido) por ventana. Es una técnica de control que:

- **Modula la potencia** en ciclos on/off
- **Controla el duty cycle** (tiempo encendido vs apagado)
- **Reduce el desgaste** de los actuadores
- **Mejora la eficiencia** energética

### ¿Cómo funciona el ruido en la simulación?

**R**: El ruido simula condiciones reales:

1. **Tipo**: Ruido gaussiano (normal)
2. **Intensidad**: Controlada por el slider
3. **Efecto**: Añade variabilidad a la medición
4. **Propósito**: Probar robustez del controlador

### ¿Qué son los disturbios y cómo usarlos?

**R**: Los disturbios simulan cambios externos:

1. **Paso de carga**: Cambio súbito en la entrada
2. **Propósito**: Probar rechazo de disturbios
3. **Uso**: Activar durante la simulación
4. **Análisis**: Observar recuperación del sistema

### ¿Cómo interpreto las métricas de rendimiento?

**R**: Las métricas principales son:

| Métrica | Significado | Valor Óptimo |
|---------|-------------|--------------|
| **Overshoot** | Exceso sobre setpoint | < 5% |
| **Tiempo de Establecimiento** | Tiempo para estabilizar | Mínimo posible |
| **Error Estacionario** | Error permanente | 0% |

---

## 🚨 Solución de Problemas

### La simulación se congela, ¿qué hago?

**R**: Pasos de solución:

1. **Inmediato**:
   - Hacer clic en "Pausar"
   - Esperar 5 segundos
   - Hacer clic en "Iniciar"

2. **Si persiste**:
   - Hacer clic en "Reset"
   - Reducir parámetros extremos
   - Recargar la página

3. **Como último recurso**:
   - Cerrar y abrir el navegador
   - Verificar conexión a internet

### ¿Por qué no puedo cambiar algunos parámetros?

**R**: Algunos parámetros tienen límites por seguridad:

| Parámetro | Límite | Razón |
|-----------|--------|-------|
| **Setpoint** | 0-200°C | Rango realista |
| **Kp** | 0-10 | Evitar inestabilidad |
| **Ki** | 0-1 s⁻¹ | Evitar oscilaciones |
| **Kd** | 0-200 s | Evitar ruido excesivo |

### ¿Cómo restauro la configuración por defecto?

**R**: Opciones para restaurar:

1. **Reset rápido**:
   - Hacer clic en "Reset"
   - Usar preset "Horno Compacto"

2. **Reset completo**:
   - Recargar la página (F5)
   - Los valores volverán al estado inicial

3. **Reset manual**:
   - Establecer todos los valores manualmente
   - Usar los valores por defecto del preset

### ¿El simulador guarda mis configuraciones?

**R**: Actualmente el simulador:

**✅ Guarda**:
- Última configuración en la sesión
- Estado de la simulación

**❌ No guarda**:
- Configuraciones entre sesiones
- Historial de simulaciones
- Datos exportados

*Nota: La persistencia completa está en desarrollo.*

---

## 📞 Contacto y Soporte

### ¿Dónde puedo reportar un error?

**R**: Para reportar errores:

1. **GitHub Issues**: Crear un issue en el repositorio
2. **Email**: Contactar al equipo de desarrollo
3. **Documentación**: Incluir detalles del problema

**Información útil**:
- Navegador y versión
- Pasos para reproducir
- Captura de pantalla del error

### ¿Cómo puedo contribuir al proyecto?

**R**: Formas de contribuir:

1. **Reportar bugs** y sugerir mejoras
2. **Probar** nuevas funcionalidades
3. **Documentar** casos de uso
4. **Desarrollar** nuevas características

### ¿Hay recursos adicionales de aprendizaje?

**R**: Recursos recomendados:

1. **Tutoriales**: Completar todos los tutoriales del simulador
2. **Libros**: "Control Systems Engineering" de Norman Nise
3. **Cursos online**: Control PID en Coursera/edX
4. **Práctica**: Experimentar con diferentes configuraciones

---

## 🔄 Actualizaciones y Novedades

### ¿Con qué frecuencia se actualiza el simulador?

**R**: El simulador se actualiza regularmente:

- **Correcciones de bugs**: Semanal
- **Nuevas funcionalidades**: Mensual
- **Mejoras mayores**: Trimestral

### ¿Cómo me entero de las nuevas funcionalidades?

**R**: Para estar al día:

1. **GitHub**: Seguir el repositorio
2. **Release notes**: Revisar las notas de versión
3. **Documentación**: Consultar la guía de usuario
4. **Comunidad**: Participar en discusiones

---

## 📚 Recursos Adicionales

### Enlaces Útiles

- [Guía de Inicio Rápido](./getting-started.md)
- [Tutorial 1: Conceptos Básicos](./tutorials/01-basic-pid.md)
- [Tutorial 2: Ajuste de Ganancias](./tutorials/02-tuning.md)
- [Documentación de Usuario](./README.md)

### ¿No encuentras tu pregunta?

Si tu pregunta no está aquí:

1. **Busca** en la documentación completa
2. **Consulta** los tutoriales
3. **Contacta** al equipo de desarrollo
4. **Crea un issue** en GitHub

---
