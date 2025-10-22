# Documentación de Usuario - PID Playground

Esta documentación proporciona las guías necesarias para utilizar el simulador de control PID y comprender sus funcionalidades.

## Primeros Pasos

- **Nuevo en control PID**: Comienza con la [Guía de Inicio Rápido](./getting-started.md)
- **Conocimientos previos**: Consulta los [Tutoriales](./tutorials/) para técnicas avanzadas
- **Preguntas específicas**: Revisa el [FAQ](./faq.md)

## Contenido Disponible

### Guías y Tutoriales

- [Guía de Inicio Rápido](./getting-started.md)
- [Tutorial 1: Conceptos Básicos de PID](./tutorials/01-basic-pid.md)
- [Tutorial 2: Ajuste de Ganancias](./tutorials/02-tuning.md)
- [FAQ](./faq.md)

### Contenido en Desarrollo

Los siguientes recursos están en desarrollo:
- Tutorial 3: Análisis de Respuesta
- Tutorial 4: Casos Avanzados
- Ejemplos prácticos de aplicaciones industriales

## Características del Simulador

### Funcionalidades Principales

- Simulación en tiempo real a 10Hz
- Modelo FOPDT con discretización exacta
- Controlador PID con derivada filtrada y anti-windup
- Gráficas en tiempo real de PV vs SP y salida del PID
- Métricas automáticas de overshoot y tiempo de establecimiento

### Modos de Operación

- **Modo Horno**: Control de calentamiento (K positivo)
- **Modo Chiller**: Control de enfriamiento (K negativo)
- **Presets predefinidos**: Horno Industrial, Horno Compacto, Chiller Industrial
- **Configuración manual**: Ajuste personalizado de todos los parámetros

### Características Avanzadas

- Ruido simulado para condiciones realistas
- Disturbios de carga configurables
- Control SSR por ventana temporal
- Exportación de datos para análisis posterior
- Persistencia local de configuraciones

## Métricas y Análisis

### Métricas en Tiempo Real

- Overshoot: Porcentaje de exceso sobre el setpoint
- Tiempo de Establecimiento: Tiempo para alcanzar el régimen permanente
- Error Estacionario: Diferencia permanente con el setpoint

### Gráficas

- PV vs SP: Respuesta del sistema
- Salida PID: Señal de control
- Ventanas temporales configurables: 30s, 60s, 300s

## Ruta de Aprendizaje Sugerida

1. [Guía de Inicio Rápido](./getting-started.md) - Configuración inicial y primera simulación
2. [Tutorial 1: Conceptos Básicos](./tutorials/01-basic-pid.md) - Fundamentos del control PID
3. [Tutorial 2: Ajuste de Ganancias](./tutorials/02-tuning.md) - Técnicas de tuning
4. Experimentación con presets y configuraciones personalizadas
5. [FAQ](./faq.md) - Resolución de problemas específicos

## Casos de Uso

### Aplicaciones Industriales

- Control de temperatura en hornos y reactores
- Control de nivel en tanques
- Control de velocidad en motores
- Control de presión en sistemas neumáticos

### Aplicaciones Educativas

- Aprendizaje de conceptos de control PID
- Experimentación con diferentes configuraciones
- Validación de teoría mediante simulación
- Desarrollo de habilidades de tuning

## Soporte

Para preguntas comunes, consulta el [FAQ](./faq.md). Para problemas técnicos o sugerencias, utiliza el sistema de issues del repositorio.
