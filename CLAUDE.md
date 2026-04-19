# Avisander — Contexto del proyecto

## Negocio
Carnicería Avisander, Bucaramanga (Colombia). Tienda online con catálogo, pedidos, pagos y fidelización.

## Stack
- **Backend:** Node.js + Express + better-sqlite3 · Puerto 3000
- **Frontend:** React (Vite) · Puerto 5173
- **Pagos:** Bold (botón de pagos colombiano)
- **IA:** Replicate API (imágenes FLUX, video Luma)

## Estructura
```
avisander/
├── backend/         # Express API REST
│   ├── routes/      # auth, products, orders, payments, categories, customers...
│   ├── lib/         # helpers, DB, middleware
│   └── server.js    # entrypoint
└── frontend/
    └── src/
        ├── pages/       # Home, Products, Cart, MyAccount, admin/*
        ├── components/  # ProductCarousel, MegaMenu, Footer...
        └── context/     # auth, cart
```

## Comandos frecuentes
```bash
# Backend
cd backend && node server.js

# Frontend
cd frontend && npm run dev

# Ambos (desde raíz)
bash init.sh
```

## Integración Bold + ngrok (desarrollo)
Cada reinicio de ngrok genera nueva URL pública. Actualizar en:
1. `.env` del backend → `APP_URL` / webhook URL
2. Dashboard Bold → URL de confirmación
3. Frontend si hay referencias hardcodeadas

## Exposición por ngrok — política
**Nunca** compartir `vite dev` a internet (sirve `/src/*.jsx` legible + node_modules).
Para compartir el link con clientes o probar flujos de pago reales, usar siempre:
```bash
cd frontend && npm run preview:ngrok    # build + preview :4173
ngrok http 4173                          # apuntar ngrok a 4173, no a 5173
```
Esto sirve el bundle minificado desde `dist/`. Código fuente no queda expuesto.

## Directorios a NO tocar
- `backend/node_modules/`
- `frontend/node_modules/`
- `backend/media/` y `backend/uploads/` (archivos subidos)
- `backend/backups/`

## Base de datos
SQLite · archivo: `backend/database.sqlite` · NO modificar directamente salvo que se pida explícitamente.

## Convenciones
- Sin comentarios que expliquen *qué* hace el código, solo el *por qué* si no es obvio
- No crear archivos de documentación extra
- El admin está en `/admin/*` — autenticado con JWT, rol `admin`
