# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir al PID Playground!

## 🔧 Configuración

```bash
# 1. Fork y clona el repositorio
git clone https://github.com/YOUR_USERNAME/PID-Playground.git
cd PID-Playground

# 2. Instala dependencias
pnpm install

# 3. Verifica que todo funcione
pnpm test
pnpm build
```

## 📝 Estándares

- **TypeScript**: Tipado estricto, evita `any`
- **React**: Componentes funcionales con hooks
- **Commits**: Usa [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat: nueva funcionalidad`
  - `fix: corrección de bug`
  - `docs: cambios en documentación`
  - `test: agregar o modificar tests`

## 🧪 Testing

```bash
# Ejecutar tests
pnpm test

# Tests con coverage
pnpm test:coverage
```

## 🚀 Pull Requests

1. Crea un branch: `git checkout -b feature/mi-funcionalidad`
2. Haz tus cambios y commits
3. Asegúrate que los tests pasen: `pnpm test && pnpm build`
4. Push y crea el Pull Request

## 🐛 Reportar Problemas

Usa [GitHub Issues](https://github.com/triptamina-labs/PID-Playground/issues) con:
- Descripción clara del problema
- Pasos para reproducir
- Información del sistema (OS, browser, versión)

---

**¡Gracias por contribuir! 🎛️**
