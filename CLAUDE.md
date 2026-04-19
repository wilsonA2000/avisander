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

## Exposición por ngrok — política (solo para demos locales)
**Nunca** compartir `vite dev` a internet (sirve `/src/*.jsx` legible + node_modules).
Para compartir el link con clientes o probar flujos de pago reales, usar siempre:
```bash
cd frontend && npm run preview:ngrok    # build + preview :4173
ngrok http 4173                          # apuntar ngrok a 4173, no a 5173
```
Esto sirve el bundle minificado desde `dist/`. Código fuente no queda expuesto.

> **Nota**: desde 2026-04-19 el proyecto está en producción real (ver sección abajo).
> El flujo ngrok ya no se usa en el día a día.

---

## 🚀 Producción — Avisander LIVE

### Infraestructura

| Componente | Servicio | Costo |
|---|---|---|
| Dominio `distribuidoraavisander.com` | Namecheap | $6.79 año 1, ~$30 año 2+ |
| DNS + CDN + DDoS + SSL | Cloudflare Free | $0 |
| Hosting backend + frontend | Fly.io (app `distribuidoraavisander`) | ~$2/mes |
| Storage persistente | Volumen Fly `vol_40ok1m9wjqnpnlm4` de 1 GB en `/data` | $0.15/mes (incluido en Hobby) |
| Región | `dfw` (Dallas, Texas) — menor latencia desde Colombia | — |
| SSL | Let's Encrypt automático (via Fly) + Cloudflare Full strict | $0 |

### Costos reales

| Concepto | Pago único | Mensual | Anual |
|---|---|---|---|
| Dominio `.com` primer año (Namecheap con cupón) | **$6.79 USD** | — | — |
| Dominio renovación años siguientes | — | — | ~$30 USD |
| Fly.io VM shared-cpu-1x @ 512 MB RAM | — | ~$1.94 USD | ~$23 USD |
| Fly.io volumen 1 GB | — | $0.15 USD | $1.80 USD |
| Cloudflare (DNS+CDN+DDoS+SSL) | — | $0 | $0 |
| **TOTAL estimado** | **$6.79 USD** | **~$2.10 USD (~$8.500 COP)** | **~$25 USD (~$100.000 COP)** |

**Año 1 completo**: $6.79 (dominio) + $25 (hosting) = **~$32 USD** (~$130.000 COP)
**Año 2+**: $30 (dominio) + $25 (hosting) = **~$55 USD** (~$225.000 COP)

Extras sólo si crecen:
- Ampliar volumen si pasa de 1 GB: $0.15/GB/mes extra
- Subir RAM a 1 GB: ~$5/mes extra
- Bandwidth > 100 GB/mes: $0.02/GB (muy difícil sobrepasar)

### Arquitectura

```
Cliente → Cloudflare (DDoS, CDN, SSL) → Fly.io Dallas
                                          └─ Express (backend) + Vite dist (frontend)
                                          └─ /data volume: SQLite + uploads + media dinámica
```

- Frontend se sirve desde el mismo Express (`/` → `frontend/dist/`), no es servicio separado.
- `/api/*` → backend Express
- `/media/*` → primero busca en `backend/media/` (repo: iconos, lotties, QRs), fallback a `/data/media/` (volumen: fotos productos, videos)
- `/uploads/*` → `/data/uploads/` (volumen)
- SQLite en `/data/database.sqlite` — sobrevive redeploys, backup manual recomendado

### Variables de entorno en Fly (secrets/env)

**Env (visibles, en `fly.toml [env]`)**:
- `NODE_ENV=production`
- `PORT=3000`
- `APP_URL=https://distribuidoraavisander.com`
- `FRONTEND_URL=https://distribuidoraavisander.com,https://www.distribuidoraavisander.com`
- `DB_PATH=/data/database.sqlite`
- `UPLOADS_PATH=/data/uploads`
- `MEDIA_PATH=/data/media`
- `COOKIES_SECURE=1`

**Secrets (cifrados, set con `fly secrets set`)**:
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `BOLD_IDENTITY_KEY`, `BOLD_SECRET_KEY`, `BOLD_WEBHOOK_SECRET`
- `ADMIN_NOTIFICATION_EMAIL`
- (opcional) `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

### Comandos de mantenimiento más usados

```bash
# Estado general
fly status
fly logs --no-tail              # últimos logs (no sigue streaming)
fly logs                        # live stream

# Deploy
git push origin main && fly deploy

# SSH a la máquina
fly ssh console
fly ssh console -C "ls -la /data/"   # comando one-off

# Reiniciar
fly machine list                 # ver ID
fly machine restart <id>

# Volumen
fly volumes list
fly ssh console -C "df -h /data"        # cuánto espacio queda
fly volumes extend <vol_id> --size 3    # ampliar a 3 GB (si se llena)

# Secrets
fly secrets list                 # NO muestra valores, solo nombres
fly secrets set KEY=value
fly secrets unset KEY

# Backup manual de la BD (ejecutar periódicamente)
fly ssh sftp shell -a distribuidoraavisander
# dentro: get /data/database.sqlite
```

### Cómo re-desplegar después de cambios

```bash
# 1. commit
git add . && git commit -m "..."

# 2. push (GitHub es solo registro, no dispara deploy automático)
git push origin main

# 3. deploy real
fly deploy    # tarda 3-5 min
```

### Configuración externa que depende del dominio

- **Bold Panel** (https://comercios.bold.co):
  - Redirect URL: `https://distribuidoraavisander.com/carrito`
  - Webhook URL: `https://distribuidoraavisander.com/api/payments/bold/webhook`
  - Secret webhook: debe coincidir con `BOLD_WEBHOOK_SECRET` en Fly
- **Google Cloud Console** — API Key Maps con HTTP referrers:
  - `https://distribuidoraavisander.com/*`
  - `https://www.distribuidoraavisander.com/*`

### Hardening aplicado (seguridad)

- JWT en cookies httpOnly Secure SameSite=Lax (no localStorage)
- Helmet con CSP restrictivo en prod
- Rate limits globales + específicos (analytics 60/min, ai 20/hora, orders/public 30/min, payments/reconcile 10/min)
- Schemas zod en todos los endpoints mutantes principales
- Webhook Bold verificado con HMAC-SHA256 + `crypto.timingSafeEqual`
- Logger pino con redact de Authorization, cookies, passwords, tokens
- Uploads con validación de MIME real (file-type magic bytes), límite 5MB, path traversal check
- Loyalty rollback idempotente al cancelar/abandonar orden

### Admin inicial

- Email: `admin@avisander.com`
- Password inicial tras deploy: **cambiada por la cajera en primer login** (ver `must_change_password` en BD)
- Reset via SSH si se pierde (ver sección "Reset admin password" abajo)

### Reset password admin (si se pierde acceso)

```bash
# 1. Generar hash bcrypt local
node -e "const b=require('bcryptjs'); console.log(b.hashSync('NuevaPass2026!', 12))"

# 2. Crear script temporal con ese hash, subir y correr
# (ver /home/wilsonadmin/.claude/plans/... para el flujo detallado)
```

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
