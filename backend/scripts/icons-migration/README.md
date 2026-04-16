# Scripts de migración — Iconografía 3D clay

Scripts puntuales que se usaron durante la migración de emojis Fluent (PNG 3D)
y animaciones Lottie de LottieFiles. Se dejan como referencia; no se ejecutan
en producción ni en el flujo normal.

## Qué hay aquí

- `download-icons-3d.cjs` — descarga PNG 3D de Microsoft Fluent Emoji
  (repo GitHub) y los guarda en `backend/media/iconos/3d/<slug>.png`.
  Usa `node-fetch` o nativo. Idempotente: no re-descarga si existe.
- `download-lotties.cjs` — baja animaciones Lottie desde LottieFiles API
  y las guarda en `backend/media/lotties/<slug>.json`.
- `download-lotties-retry.cjs` — reintenta descargar los Lottie que
  fallaron en el primer intento (timeout / 404).
- `smoke-test.cjs` — Playwright: abre home, detalle y carrito, cuenta
  errores de consola. Se usa para verificar rápidamente tras cambios
  visuales.

## Cómo correrlos

```
cd backend
node scripts/icons-migration/download-icons-3d.cjs
node scripts/icons-migration/download-lotties.cjs
node scripts/icons-migration/smoke-test.cjs
```

> Los screenshots del smoke quedan en `/tmp/e2e-screenshots/`.
