# Auditoría de seguridad y plan defensivo — Avisander

**Fecha**: 2026-04-21
**Motivo**: Un usuario en redes afirmó que la web tenía "IP expuesta" y que "una inyección SQL bastaría" para comprometerla. Se revisó el código completo y se preparó un plan defensivo.

---

## 1. Veredicto del audit

### SQL Injection — NO EXISTE

Se revisaron todos los endpoints públicos y administrativos (`backend/routes/*`, `backend/lib/*`, `backend/db/*`). Resultado:

| Ubicación | Qué interpola | Por qué es seguro |
|---|---|---|
| `routes/products.js:149-150` | `whereClause`, `baseFrom`, `orderBy` | Las piezas son strings hardcoded internos. Los valores del usuario van como `?`. `orderBy` es un map con whitelist cerrado. |
| `routes/media.js:137,167` | `${field}` en `UPDATE products SET ${field}` | `field` está validado con `z.enum(['image_url','video_url','gallery'])` en `schemas/media.js`. Imposible inyectar. |
| `routes/customers.js:28` | `whereClause` | Strings hardcoded + valores por `?`. |
| `routes/media.js:51,85` | `whereClause`, `LIKE` | Valores siempre por `?`. |
| `db/database.js:223-225` | `${table}`, `${ddl}` en ALTER/PRAGMA | Código de migración interno, nunca recibe input de usuario. |
| `scripts/reset-test-data.js` | `${ph}` | Son placeholders `?,?,?` generados, no datos. |

**Clave**: todas las queries con input del usuario usan `db.prepare(...).run(valor)` con `?` parametrizado. `better-sqlite3` escapa automáticamente. Todos los endpoints mutantes tienen validación `zod`.

### Lo que el atacante mostró en realidad

La captura con `whatweb` solo lee headers HTTP públicos (equivalente a abrir DevTools del navegador). No es un escaneo de vulnerabilidades. Las IPs `104.21.33.13` y `172.67.x.x` son **IPs anycast compartidas de Cloudflare**, no la IP real del servidor de Fly.io. La IP de origen sigue oculta.

Lo único real que se filtra: el header `Via: 1.1 fly.io` y `fly-request-id`, que revelan que el backend corre en Fly.io. No es una vulnerabilidad, es información de hosting. Se resuelve con una Transform Rule en Cloudflare (ver paso 1 abajo).

---

## 2. Topología verificada

```
Usuario  →  Cloudflare (WAF + DDoS + CDN + SSL)  →  Fly.io (Dallas)  →  Express + SQLite (/data)
```

**Cloudflare está delante**, que es lo correcto. El DNS en Cloudflare apunta al CDN (modo "proxied", nube naranja). La IP real de Fly no es pública.

### Cómo verificar tú mismo

```bash
dig distribuidoraavisander.com +short
# Debe devolver solo IPs de Cloudflare (104.x / 172.x)

curl -sI https://distribuidoraavisander.com | grep -i server
# Debe decir: server: cloudflare
```

---

## 3. Plan defensivo (hacking ético / blue team)

### A. Monitoreo continuo

**Cloudflare Dashboard (2 min/día)**
- `Security → Events`: ataques bloqueados por WAF/bots/rate limit.
- `Security → WAF → Managed Rules`: "Cloudflare Managed Ruleset" debe estar **ON**.
- Activar **Bot Fight Mode** (Free plan, gratis).
- Configurar alertas en `Notifications` para:
  - "DDoS attack detected"
  - "Origin error rate"

**Logs de Fly (cuando haya sospecha)**
```bash
fly logs --no-tail | grep -iE "401|403|429|500|sqlite.*error"
```
- `401/403` en ráfaga = fuerza bruta.
- `429` = rate limit activo (señal buena).
- `500` con error SQLite = bug o ataque raro.

### B. Auditoría manual mensual

Comandos que puedes correr contra tu propia web (legal, es tuya):

```bash
# 1. Headers de seguridad
curl -sI https://distribuidoraavisander.com | grep -iE "strict-transport|content-security|x-frame|x-content-type"

# 2. Certificado SSL (vigencia > 30 días)
echo | openssl s_client -servername distribuidoraavisander.com -connect distribuidoraavisander.com:443 2>/dev/null | openssl x509 -noout -dates

# 3. Puertos abiertos (solo deberían verse 80 y 443)
nmap -Pn -p 80,443,22,3000,8080 distribuidoraavisander.com

# 4. Nikto — escáner de vulnerabilidades web (instalar con apt install nikto)
nikto -h https://distribuidoraavisander.com -maxtime 300s

# 5. Dependencias con CVE conocidos
cd ~/avisander/avisander/backend && npm audit --production
cd ~/avisander/avisander/frontend && npm audit --production

# 6. Test SSL externo (gratis, navegador)
# https://www.ssllabs.com/ssltest/analyze.html?d=distribuidoraavisander.com → debe dar A/A+

# 7. Test headers externo (gratis, navegador)
# https://securityheaders.com/?q=distribuidoraavisander.com → debe dar A/A+
```

### C. Hardening extra pendiente (checklist priorizado)

- [x] **Paso 1 — Ocultar `X-Powered-By` y `Server` en Express** (aplicado en `backend/app.js`)
- [ ] **Paso 1b — Transform Rule en Cloudflare para ocultar `Via` y `fly-request-id`** (ver abajo)
- [ ] **Paso 2 — Activar "Authenticated Origin Pulls"** en Cloudflare
  (SSL/TLS → Origin Server → Authenticated Origin Pulls → ON)
  Evita que alguien que descubra la IP de Fly pueda pegarle saltándose Cloudflare.
- [ ] **Paso 3 — Script `audit.sh`** con los comandos del bloque B para correr una vez al mes.
- [ ] **Paso 4 — 2FA (TOTP) para el admin**. Hoy solo password: si roban la clave entran.
- [ ] **Paso 5 — Lockout después de N intentos fallidos**. Actualmente hay rate limit por IP (10 intentos/15min en `authLimiter`), pero no bloqueo por cuenta tras múltiples fallos.
- [ ] **Paso 6 — Backup automático SQLite a storage externo** (R2 de Cloudflare, 10GB gratis).
- [ ] **Paso 7 — Reglas WAF custom en Cloudflare** (Free permite 3):
  - Regla: si `URI Path` contiene `.env`, `.git`, `wp-admin`, `phpmyadmin` → **Block**.
  - Regla opcional geográfica: países de alto riesgo → Managed Challenge.

### D. Respuesta a incidente

Si notas algo raro (login ajeno, productos borrados, spam en reviews):

**1. Contener (5 min)**
```bash
# Cloudflare → Security → Settings → Security Level: "I'm Under Attack!"

# Invalidar todas las sesiones activas:
fly ssh console
sqlite3 /data/database.sqlite "DELETE FROM refresh_tokens;"
```

**2. Rotar secretos (10 min)**
```bash
fly secrets set JWT_SECRET="$(openssl rand -hex 64)"
fly secrets set JWT_REFRESH_SECRET="$(openssl rand -hex 64)"
```
Invalida todas las sesiones instantáneamente.

**3. Backup forense de la BD (antes de limpiar)**
```bash
fly ssh sftp shell -a distribuidoraavisander
# dentro: get /data/database.sqlite (guarda con fecha: database-incidente-YYYY-MM-DD.sqlite)
```

**4. Revisar logs**
```bash
fly logs --no-tail > /tmp/fly-logs-$(date +%F).txt
# Buscar IPs sospechosas, endpoints atacados, usuarios comprometidos.
```

**5. Restaurar desde backup limpio** (si hubo modificación de datos)
- Subir BD limpia a `/data/database.sqlite` vía `fly ssh sftp`.

**6. Cambiar password admin en `/admin/perfil`.**

---

## 4. Cambios aplicados hoy (2026-04-21)

### Paso 1 — Express: ocultar `X-Powered-By` y `Server`

Aplicado en `backend/app.js` justo después de `createApp`:
- `app.disable('x-powered-by')` — desactiva el header automático de Express.
- Middleware que hace `res.removeHeader('X-Powered-By'); res.removeHeader('Server')` por si algún módulo los reintroduce.

**Qué sigue faltando**: los headers `Via: 1.1 fly.io` y `fly-request-id` los agrega el **proxy de Fly después de Express**, así que no se pueden eliminar desde el código. Se deben quitar con una Transform Rule en Cloudflare:

### Paso 1b — Cloudflare Transform Rule (pendiente, hazlo tú)

1. Entra a Cloudflare Dashboard → selecciona `distribuidoraavisander.com`.
2. Menú lateral: **Rules → Transform Rules → Modify Response Header**.
3. Click **Create rule**.
4. Configuración:
   - **Rule name**: `Hide backend fingerprint`
   - **When incoming responses match**: `All incoming responses`
   - **Then...**:
     - Remove header: `via`
     - Remove header: `fly-request-id`
     - Remove header: `server`
     - Remove header: `x-powered-by`
5. Save and Deploy.

Resultado: al ejecutar `whatweb` o `curl -I` desde fuera ya no se verá `fly.io` ni `cloudflare` como server.

---

## 5. Verificación después del deploy

```bash
# Después de "fly deploy" y aplicar la Transform Rule:
curl -sI https://distribuidoraavisander.com | grep -iE "via|fly-request|x-powered|server"
# Idealmente: sin salida (todos removidos)
```

---

## 6. Referencias rápidas

- **Deploy**: `git push origin main && fly deploy`
- **Logs**: `fly logs --no-tail`
- **SSH a la máquina**: `fly ssh console`
- **Backup manual de BD**: `fly ssh sftp shell -a distribuidoraavisander` → `get /data/database.sqlite`
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Fly Dashboard**: https://fly.io/apps/distribuidoraavisander
