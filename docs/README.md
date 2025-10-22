# Documentación - PID Playground

Esta carpeta contiene toda la documentación del proyecto, organizada en tres categorías principales según el tipo de usuario y nivel de profundidad técnica.

## Estructura de la Documentación

### Documentación de Usuario

**Ubicación**: [`user-guide/`](./user-guide/)

Documentación orientada al uso del simulador y comprensión de conceptos de control PID.

- [Índice de Guías de Usuario](./user-guide/README.md) - Punto de entrada para usuarios
- [Guía de Inicio Rápido](./user-guide/getting-started.md) - Primera configuración y uso básico
- [Tutorial 1: Conceptos Básicos de PID](./user-guide/tutorials/01-basic-pid.md) - Fundamentos del control PID
- [Tutorial 2: Ajuste de Ganancias](./user-guide/tutorials/02-tuning.md) - Técnicas de tuning
- [FAQ](./user-guide/faq.md) - Preguntas frecuentes y solución de problemas

### Documentación Técnica

**Ubicación**: [`technical/`](./technical/)

Documentación para desarrolladores y contribuidores del proyecto.

- [Arquitectura](./technical/architecture.md) - Diseño del sistema y flujo de datos
- [Guía de Desarrollo](./technical/development.md) - Configuración, convenciones y procesos
- [Referencia de API](./technical/api-reference.md) - Interfaces, tipos y métodos públicos

### Documentación Matemática

**Ubicación**: [`mathematical/`](./mathematical/)

Fundamentos teóricos y formulación matemática de los algoritmos.

- [Teoría del Controlador PID](./mathematical/theory/pid.md) - Formulación matemática del PID
- [Modelo FOPDT](./mathematical/theory/fopdt.md) - First Order Plus Dead Time
- [Análisis de Estabilidad](./mathematical/theory/stability.md) - Criterios de estabilidad
- [Referencias](./mathematical/references.md) - Bibliografía y recursos

## Guía Rápida por Perfil

### Usuario Final

Si quieres aprender a usar el simulador:

1. [Guía de Inicio Rápido](./user-guide/getting-started.md)
2. [Tutorial 1: Conceptos Básicos](./user-guide/tutorials/01-basic-pid.md)
3. [FAQ](./user-guide/faq.md)

### Desarrollador

Si quieres contribuir al proyecto:

1. [Arquitectura](./technical/architecture.md) - Entender el diseño del sistema
2. [Guía de Desarrollo](./technical/development.md) - Configurar entorno y convenciones
3. [Referencia de API](./technical/api-reference.md) - Consultar interfaces y métodos

### Investigador/Académico

Si quieres comprender los fundamentos teóricos:

1. [Teoría del PID](./mathematical/theory/pid.md)
2. [Modelo FOPDT](./mathematical/theory/fopdt.md)
3. [Análisis de Estabilidad](./mathematical/theory/stability.md)
4. [Referencias](./mathematical/references.md)

## Convenciones de Documentación

- **Mermaid**: Los diagramas utilizan sintaxis Mermaid para visualización
- **Código**: Los ejemplos de código están en bloques formateados
- **Referencias cruzadas**: Enlaces internos para navegación entre documentos
- **Versiones**: Cada documento indica su última actualización y versión

## Contribuir a la Documentación

Para contribuir mejoras a la documentación:

1. Mantener el tono profesional y directo
2. Incluir ejemplos prácticos cuando sea relevante
3. Actualizar referencias cruzadas si se modifican enlaces
4. Verificar que el formato Markdown sea correcto
5. Actualizar la fecha de última modificación

Para más detalles sobre contribuciones, consulta [CONTRIBUTING.md](../CONTRIBUTING.md).

## Estado de la Documentación

### Completado

- Guía de usuario básica e intermedia
- Documentación técnica completa
- Fundamentos matemáticos

### En Desarrollo

- Tutoriales avanzados de usuario
- Ejemplos prácticos de aplicaciones industriales
- Casos de estudio detallados

