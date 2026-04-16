// Iconos isométricos 3D para signos de confianza y "bondades".
// Inline SVG con gradientes, sombras y perspectiva — sin librerías externas.
// Cada ícono está diseñado para verse premium a 40-56 px.

const icons = {
  // Hoja verde con gota de agua — "Fresco hoy"
  fresh: (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="leaf3d" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7A4" />
          <stop offset="55%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="leafVein" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#166534" stopOpacity=".55" />
          <stop offset="100%" stopColor="#166534" stopOpacity=".15" />
        </linearGradient>
        <radialGradient id="drop3d" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="60%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </radialGradient>
      </defs>
      {/* sombra base */}
      <ellipse cx="32" cy="55" rx="18" ry="3" fill="#000" opacity=".15" />
      {/* hoja con perspectiva */}
      <path d="M14 42 C14 22, 28 10, 50 10 C50 32, 38 48, 18 48 C15 48, 14 46, 14 42 Z" fill="url(#leaf3d)" />
      <path d="M14 42 C14 22, 28 10, 50 10 C50 32, 38 48, 18 48 C15 48, 14 46, 14 42 Z" fill="url(#leafVein)" opacity=".35" />
      <path d="M19 44 C26 36, 35 26, 48 14" stroke="#064E3B" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".5" />
      <path d="M24 42 L28 36 M30 40 L34 32 M36 36 L40 28" stroke="#064E3B" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity=".4" />
      {/* brillo superior */}
      <path d="M30 14 C22 18, 17 28, 17 36" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity=".35" />
      {/* gota de agua */}
      <path d="M44 28 C44 24, 47 20, 49 20 C51 20, 54 24, 54 28 C54 31, 52 33, 49 33 C46 33, 44 31, 44 28 Z" fill="url(#drop3d)" />
      <ellipse cx="47" cy="25" rx="1.5" ry="1" fill="#fff" opacity=".9" />
    </svg>
  ),

  // Copo de nieve 3D con base cilíndrica — "Cadena de frío"
  cold: (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="ice3d" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="50%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#0369A1" />
        </radialGradient>
        <linearGradient id="iceBase" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#075985" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="58" rx="17" ry="2.8" fill="#000" opacity=".15" />
      {/* base isométrica (elipse + lados) */}
      <ellipse cx="32" cy="52" rx="17" ry="5" fill="url(#iceBase)" />
      <path d="M15 52 L15 47 C15 49.8, 22.6 52, 32 52 C41.4 52, 49 49.8, 49 47 L49 52 Z" fill="#0C4A6E" opacity=".55" />
      <ellipse cx="32" cy="47" rx="17" ry="5" fill="url(#iceBase)" />
      {/* copo de nieve */}
      <g transform="translate(32 28)">
        <g stroke="url(#ice3d)" strokeWidth="3.2" strokeLinecap="round" fill="none">
          <line x1="0" y1="-16" x2="0" y2="16" />
          <line x1="-14" y1="-8" x2="14" y2="8" />
          <line x1="-14" y1="8" x2="14" y2="-8" />
        </g>
        <g stroke="#0369A1" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".9">
          <path d="M0 -16 L-3 -13 M0 -16 L3 -13" />
          <path d="M0 16 L-3 13 M0 16 L3 13" />
          <path d="M-14 -8 L-11 -10 M-14 -8 L-13 -4" />
          <path d="M14 8 L11 10 M14 8 L13 4" />
          <path d="M-14 8 L-13 4 M-14 8 L-11 10" />
          <path d="M14 -8 L13 -4 M14 -8 L11 -10" />
        </g>
        <circle r="2.5" fill="#fff" opacity=".9" />
      </g>
    </svg>
  ),

  // Camioncito 3D isométrico — "Envío en Bucaramanga"
  truck: (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="truckBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="55%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id="truckCab" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFEDD5" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="wheel3d" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="56" rx="22" ry="3" fill="#000" opacity=".18" />
      {/* caja posterior */}
      <path d="M10 24 L36 18 L36 42 L10 48 Z" fill="url(#truckBody)" />
      <path d="M36 18 L50 22 L50 46 L36 42 Z" fill="#C2410C" />
      <path d="M10 24 L36 18 L50 22 L24 28 Z" fill="#FDBA74" opacity=".7" />
      {/* cabina */}
      <path d="M36 24 L50 28 L50 42 L36 38 Z" fill="url(#truckCab)" opacity=".3" />
      <rect x="14" y="32" width="18" height="2" fill="#7C2D12" opacity=".5" />
      {/* ventana */}
      <path d="M38 22 L46 24 L46 30 L38 28 Z" fill="#60A5FA" opacity=".85" />
      <path d="M38 22 L41 22.5 L41 28.5 L38 28 Z" fill="#DBEAFE" opacity=".9" />
      {/* ruedas */}
      <ellipse cx="18" cy="50" rx="5.2" ry="5.2" fill="url(#wheel3d)" />
      <ellipse cx="18" cy="50" rx="2.2" ry="2.2" fill="#94A3B8" />
      <ellipse cx="42" cy="50" rx="5.2" ry="5.2" fill="url(#wheel3d)" />
      <ellipse cx="42" cy="50" rx="2.2" ry="2.2" fill="#94A3B8" />
      {/* brillos */}
      <path d="M12 26 L34 20" stroke="#fff" strokeWidth="1.2" opacity=".4" />
    </svg>
  ),

  // Burbuja de chat con check — "Cambios por WhatsApp"
  chat: (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <defs>
        <linearGradient id="chat3d" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#86EFAC" />
          <stop offset="55%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="56" rx="18" ry="2.8" fill="#000" opacity=".15" />
      {/* burbuja */}
      <path d="M12 16 C12 12, 15 9, 19 9 L45 9 C49 9, 52 12, 52 16 L52 36 C52 40, 49 43, 45 43 L28 43 L18 50 L20 43 L19 43 C15 43, 12 40, 12 36 Z" fill="url(#chat3d)" />
      {/* sombra interior */}
      <path d="M12 36 C12 40, 15 43, 19 43 L45 43 C49 43, 52 40, 52 36 L52 32 C52 36, 49 39, 45 39 L19 39 C15 39, 12 36, 12 32 Z" fill="#166534" opacity=".35" />
      {/* check */}
      <path d="M22 26 L29 33 L42 18" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* brillo superior */}
      <path d="M18 14 C16 14, 14 16, 14 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".55" />
    </svg>
  ),

  // Medalla/estrella con cinta — "Bondades y beneficios"
  medal: (
    <svg viewBox="0 0 64 64" className="w-full h-full" aria-hidden="true">
      <defs>
        <radialGradient id="medal3d" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
        <linearGradient id="ribbon3d" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#9A3412" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="58" rx="15" ry="2.5" fill="#000" opacity=".2" />
      {/* cintas */}
      <path d="M20 6 L20 30 L28 24 L28 6 Z" fill="url(#ribbon3d)" />
      <path d="M36 6 L36 24 L44 30 L44 6 Z" fill="url(#ribbon3d)" />
      <path d="M28 6 L28 22 L32 22 L36 22 L36 6 Z" fill="#EA580C" />
      {/* medalla circular */}
      <circle cx="32" cy="40" r="15" fill="url(#medal3d)" />
      <circle cx="32" cy="40" r="15" fill="none" stroke="#78350F" strokeWidth="1" opacity=".5" />
      <circle cx="32" cy="40" r="11" fill="none" stroke="#FBBF24" strokeWidth="0.8" opacity=".6" />
      {/* estrella central */}
      <path d="M32 32 L34 38 L40 38.5 L35 42.5 L37 48 L32 44.5 L27 48 L29 42.5 L24 38.5 L30 38 Z" fill="#FEF3C7" stroke="#92400E" strokeWidth="0.6" strokeLinejoin="round" />
      {/* brillo */}
      <ellipse cx="27" cy="35" rx="4" ry="2.2" fill="#fff" opacity=".55" transform="rotate(-30 27 35)" />
    </svg>
  )
}

function TrustIcon3D({ name, className = 'w-8 h-8' }) {
  const icon = icons[name]
  if (!icon) return null
  return <span className={`inline-block ${className}`} aria-hidden="true">{icon}</span>
}

export default TrustIcon3D
