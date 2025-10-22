# 📋 Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-01

### Added
- **Controlador PID industrial completo**
  - Control PID posicional con anti-windup
  - Derivada filtrada sobre PV (no error)
  - Back-calculation para prevenir saturación integral
  - Parámetros ajustables en tiempo real (Kp, Ki, Kd, N, Tt)
  - Presets predefinidos (Conservador, Balanceado, Agresivo)

- **Modelo FOPDT avanzado**
  - Discretización exacta matemáticamente
  - Tiempo muerto variable con buffer circular
  - Modos Horno/Chiller configurables
  - Temperatura ambiente ajustable
  - Simulación en tiempo real a 10 Hz

- **Interfaz web responsive**
  - Gráficas en tiempo real con Recharts
  - Métricas automáticas (Overshoot, Settling Time, Peak Time)
  - Ventanas de tiempo configurables (30s, 1min, 5min)
  - Exportación CSV con metadatos
  - Tema industrial con modo oscuro

- **Sistema de Web Workers**
  - Simulación paralela en background
  - Buffer circular eficiente
  - Manejo robusto de errores
  - Performance optimizada (< 50% CPU, < 100MB RAM)

- **Documentación completa**
  - Guías de usuario detalladas
  - Documentación técnica completa
  - Tutoriales interactivos
  - Especificaciones matemáticas

- **Sistema de testing**
  - Tests unitarios con Vitest
  - Tests de integración
  - Cobertura de código > 90%
  - Validación automática

### Technical Details
- **Frontend**: React 18 + TypeScript
- **Build**: Vite 5.4.19
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts 2.15.4
- **Testing**: Vitest 3.2.4
- **Linting**: ESLint + TypeScript



---

## 🔗 Enlaces de Descarga

- **[v1.0.0](https://github.com/triptamina-labs/PID-Playground/releases/tag/v1.0.0)** - Versión estable actual
- **[Latest](https://github.com/triptamina-labs/PID-Playground/releases/latest)** - Última versión


## 🏷️ Convenciones de Versionado

### Semantic Versioning (SemVer)

- **MAJOR.MINOR.PATCH**
  - **MAJOR**: Cambios incompatibles con versiones anteriores
  - **MINOR**: Nuevas funcionalidades compatibles hacia atrás
  - **PATCH**: Correcciones de bugs compatibles hacia atrás

### Ejemplos

- `1.0.0` - Primera versión estable
- `1.1.0` - Nueva funcionalidad (API REST)
- `1.1.1` - Corrección de bug (fix en gráficas)
- `2.0.0` - Cambio mayor (nueva arquitectura)

## 🔄 Proceso de Release

### 1. Preparación
```bash
# Actualizar versiones
npm version patch|minor|major

# Actualizar CHANGELOG.md
# Crear tag
git tag v1.0.0
git push origin v1.0.0
```

### 2. Build y Test
```bash
# Tests completos
pnpm test

# Build de producción
pnpm build

# Verificar build
pnpm preview
```

### 3. Release
- Crear release en GitHub
- Subir assets (build, source)
- Notificar a la comunidad

## 📝 Notas de Release

### v1.0.0 - Primera Versión Estable

Esta es la primera versión estable del PID Playground. Incluye todas las funcionalidades core necesarias para simular sistemas de control PID industriales.

**Características destacadas:**
- Controlador PID industrial completo con anti-windup
- Modelo FOPDT con discretización exacta
- Interfaz web responsive y moderna
- Simulación en tiempo real a 10 Hz
- Documentación técnica completa

**Breaking Changes:**
- Ninguna (primera versión estable)

**Migración:**
- No aplica (primera versión)

---

*Para más detalles sobre cada versión, consulta los [releases en GitHub](https://github.com/triptamina-labs/PID-Playground/releases).*
