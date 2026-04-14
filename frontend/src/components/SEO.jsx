// Componente SEO reutilizable que pinta title, meta description, OG tags, Twitter card,
// canonical y opcionalmente JSON-LD estructurado. Usa react-helmet-async.

import { Helmet } from 'react-helmet-async'

const DEFAULT_TITLE = 'Avisander — Carnicería Premium en Bucaramanga'
const DEFAULT_DESCRIPTION =
  'Carnicería premium en Bucaramanga: res, cerdo, pollo y especialidades con cadena de frío garantizada. Entregas a domicilio y atención por WhatsApp.'
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://avisander.com'

function SEO({ title, description, image, url, type = 'website', jsonLd }) {
  const fullTitle = title ? `${title} · Avisander` : DEFAULT_TITLE
  const desc = description || DEFAULT_DESCRIPTION
  const canonical = url || (typeof window !== 'undefined' ? window.location.href : SITE_URL)
  const ogImage = image || `${SITE_URL}/media/iconos/categorias/res.png`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="es_CO" />
      <meta property="og:site_name" content="Avisander" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}

export default SEO
