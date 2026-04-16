# Lottie Animations — Avisander

Carpeta para los archivos `.lottie` o `.json` de animaciones Lottie de la
plataforma. El componente `<LottieIcon>` los carga con lazy-load vía
`@lottiefiles/dotlottie-react`.

## Formato recomendado

**`.lottie`** (dotLottie) — comprime los JSON de Lottie 80–90% menos. Un Lottie
JSON de 400KB queda en 40–60KB como `.lottie`.

Si solo encuentras `.json`, funciona igual, pero recomiendo convertir con:
- Herramienta online: https://lottiefiles.com/tools/json-to-dotlottie
- CLI: `npm i -g @lottiefiles/dotlottie-js` → `dotlottie export`

## Cómo agregar una animación

1. Descarga el `.lottie` o `.json` de **LottieFiles.com** (licencia Simple,
   uso comercial sin atribución obligatoria).
2. Renombra al slug exacto según `LOTTIE_MAP` en `frontend/src/lib/iconMap.js`.
3. Guarda en esta carpeta (`backend/media/lotties/<slug>.lottie`).
4. Vite sirve `/media/lotties/...` vía proxy — no reiniciar nada.
5. Recarga el navegador (`Ctrl+Shift+R`).

## Lista de slugs esperados

- `loading.lottie` — spinner premium (reemplaza lucide Loader2)
- `success.lottie` — checkmark animado para toast success y confirmaciones
- `error.lottie` — X animada para toast error
- `empty-cart.lottie` — ilustración dulce de carrito vacío
- `delivery-truck.lottie` — camión moviéndose (tracking de pedido)
- `fire-cooking.lottie` — llama animada (hero, badges asar/parrilla)
- `whatsapp.lottie` — burbuja WhatsApp con pulse
- `scale-weight.lottie` — báscula animándose (productos por peso)
- `fridge.lottie` — refrigerador (cadena de frío)
- `steam.lottie` — vapor ondulante
- `hero-meat.lottie` — hero de la home, opcional
- `onboarding.lottie` — bienvenida en popup inicial, opcional

## Fuente principal

**https://lottiefiles.com** — colección gratis con **Lottie Simple License**:
- Uso comercial OK.
- Atribución no obligatoria.
- No redistribuir el JSON crudo como asset.

Búsquedas recomendadas:
- "loading spinner premium orange"
- "checkmark success"
- "empty cart illustration"
- "delivery truck animation"
- "fire flame cooking"
- "whatsapp icon animation"

## Complementos de pago (opcional)

- **Lordicon PRO** — $96/año — 8,900+ iconos animados, atribución no requerida.
- **Iconscout** — plan individual ~$180/año — Lotties premium con paleta cálida coherente.

## Notas técnicas

- Peso máximo recomendado por Lottie: **100KB** (para LCP sano).
- El componente `<LottieIcon>` hace lazy-load del player (ahorra ~50KB del initial bundle).
- Preload solo el Lottie del hero (si aplica) con `<link rel="preload">`.
- Usa `loop={false}` en animaciones de feedback (success/error) para que no distraigan.
