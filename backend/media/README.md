# Carpeta de medios — Avisander

Esta carpeta es la fuente única de los archivos multimedia que consume el frontend.
El backend la expone estáticamente bajo `/media/...` (ver `backend/app.js`).

## Estructura

```
backend/media/
├── productos/      Fotos adicionales de producto (galería extendida)
├── videos/         Videos de productos, preparación, recetas
├── recetas/        Imágenes hero y pasos de recetas
├── avatares/       (Opcional) avatares de usuario / proveedor
└── publicidad/
    ├── banners/    Hero y sliders del home
    └── promos/     Piezas para ofertas temporales
```

## Convenciones de nombres

- Minúsculas, con guiones, sin tildes ni espacios.
- Formato preferido: `webp` para imágenes, `mp4` para videos.
- Productos: `{id}-{slug}-{idx}.{ext}` — ej `4-pechuga-sin-marinar-01.webp`
- Banners home: `banner-{slug}-{YYYYMMDD}.{ext}` — ej `banner-promo-pollo-20260415.webp`
- Promos: `promo-{slug}.{ext}` — ej `promo-cyber-carne.webp`
- Recetas hero: `receta-{slug}.webp`

## Tamaños recomendados

| Uso | Dimensiones | Notas |
|---|---|---|
| Card de producto | 800 × 800 px | Cuadrado, fondo neutro |
| Hero banner | 1920 × 800 px | Dejar 40% derecho libre para texto |
| Promo intermedio | 1200 × 400 px | Foco a la izquierda |
| Receta hero | 1600 × 900 px | 16:9 |
| Video de producto | 1280 × 720 px | ≤ 30 MB, máximo 60 s |

## Git

Esta carpeta está **excluida** de git (ver `.gitignore`). Sólo se commitean:
- Este `README.md`.
- `.gitkeep` en cada subcarpeta para preservar estructura.

Los archivos reales se despliegan por otro canal (scp, rsync, bucket externo en el futuro).

## Pipeline Canva

Cuando el administrador pida generar publicidad, el asistente puede usar el MCP de Canva
(`mcp__claude_ai_Canva__generate-design`, `export-design`, etc.) y depositar el
resultado en la subcarpeta correspondiente, respetando la convención de nombres.
