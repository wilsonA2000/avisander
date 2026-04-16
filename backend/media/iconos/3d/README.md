# Iconos 3D Clay — Avisander

Carpeta para los PNG 3D estilo clay/plasticine de la plataforma. El componente
`<Icon3D>` los levanta automáticamente, y si un archivo falta cae en silencio
a su ícono lucide equivalente (ver `frontend/src/lib/iconMap.js`).

## Cómo agregar un icono

1. Descarga un PNG transparente de **512×512** o superior del icono deseado.
2. Renombra al slug exacto (en kebab-case) según `ICON_MAP` en `iconMap.js`.
3. Guarda en esta carpeta (`backend/media/iconos/3d/<slug>.png`).
4. Vite sirve `/media/iconos/3d/...` vía proxy al backend — no hay que reiniciar.
5. Recarga el navegador con `Ctrl+Shift+R` para ver el cambio.

## Lista de slugs esperados

### Categorías (10)
res, cerdo, pollo, huevos, lacteos, carnes-frias, embutidos, congelado,
fruver, varios

### Usos culinarios (11)
asar, parrilla, freir, sofreir, hornear, estofar, guisar, sudar, ahumar,
cocinar, microondas

### Trust signals (5)
fresh, cold-chain, delivery, whatsapp-chat, quality-medal

### UI acciones (25)
shopping-cart, user, search, heart, menu, close, check, alert, error, info,
clock, calendar, map-pin, phone, mail, help, shield, star, arrow-right,
arrow-up, play, zoom-in, eye, plus, minus

## Fuentes recomendadas (libres, uso comercial)

- **3dicons.co** — github.com/realvjy/3dicons — CC0, sin atribución.
- **Figma Community** — buscar "3D Clay Icons Free".
- **Iconscout Free Tier** — iconscout.com/3d-illustrations (filtrar "free" + paleta cálida).
- **Icons8 Plasticine** — icons8.com/icons/set/cooking--style-plasticine (atribución o plan).
- **Flaticon 3D** — flaticon.com (atribución free, plan quita atribución).

## Paleta recomendada

Coherente con el brand naranja de Avisander (`#F58220`):
- Tonos cálidos: ámbar, naranja, rosa salmón, dorado.
- Evitar: azules fríos, violetas saturados, grises planos.
- Excepción: `cold-chain`, `congelado`, `sudar` usan azul frío para comunicar la temperatura.

## Licencias

Cada icono debe venir de una fuente con licencia comercial limpia. Documenta
las fuentes en `LICENSES.md` de esta misma carpeta (se crea al empezar la
migración real).
