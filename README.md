# Tramix

Seguimiento de ingresos, proyección y avisos antes de cada plazo para cambiar de tramo de autónomo.

- **Web y demo interactiva:** React + Vite + TypeScript (`src/`). La demo está en `#demo`.
- **Motor de cálculo:** `src/engine/` (puro y con tests). Las tablas de tramos viven en `src/engine/tramos.ts`, versionadas por año.
- **Lista de espera y emails:** `api/` (funciones serverless) + `emails/` (plantillas con la marca), con Resend.
- **Apps móviles:** PWA incluida; iOS/Android con Capacitor (ver [MOBILE.md](MOBILE.md)).
- **Puesta en marcha:** [DEPLOY.md](DEPLOY.md). **Marca:** [BRAND.md](BRAND.md).

```
npm install
npm run dev
npm test
```

> Tabla de tramos 2026 verificada con la Orden PJC/297/2026 (BOE). Los cálculos son orientativos y hay que actualizar la tabla cada año.
