function SaleRibbon({ className = '', size = 'md' }) {
  const sizes = {
    md: {
      box: 'w-[82px] h-[30px] pl-2 pr-3 sm:w-[96px] sm:h-[34px] sm:pl-2.5 sm:pr-4',
      text: 'text-[11px] sm:text-[13px]',
      fold: '-bottom-[4px] w-2.5 h-[4px]',
      clip: 'calc(100% - 11px)',
      sparkles: [
        'top-0 right-1 text-[12px]',
        '-top-1.5 right-8 text-[10px]',
        'bottom-0 right-4 text-[9px]'
      ]
    },
    lg: {
      box: 'w-[110px] h-[38px] pl-3 pr-4 sm:w-[130px] sm:h-[44px] sm:pl-4 sm:pr-5',
      text: 'text-[13px] sm:text-[16px]',
      fold: '-bottom-[5px] w-3 h-[5px]',
      clip: 'calc(100% - 14px)',
      sparkles: [
        'top-0 right-1 text-[14px]',
        '-top-2 right-10 text-[12px]',
        'bottom-0 right-5 text-[11px]'
      ]
    }
  }
  const s = sizes[size] || sizes.md

  return (
    <div
      className={`pointer-events-none absolute top-0 left-0 z-10 select-none ${className}`}
      aria-label="Producto en oferta"
    >
      <div className="relative">
        <div
          className={`relative inline-flex items-center justify-center
                     ${s.box}
                     text-white font-display font-bold ${s.text} tracking-wider uppercase
                     bg-gradient-to-r from-accent-dark via-accent to-[#E63946]
                     shadow-[0_6px_14px_-4px_rgba(160,32,32,0.65),inset_0_-2px_0_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)]
                     ribbon-tail`}
          style={{
            clipPath: `polygon(0 0, 100% 0, ${s.clip} 50%, 100% 100%, 0 100%)`
          }}
        >
          <span aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-transparent
                           pointer-events-none"
                style={{ clipPath: `polygon(0 0, 100% 0, ${s.clip} 50%, 100% 100%, 0 100%)` }} />
          <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Oferta</span>
        </div>

        <span aria-hidden="true"
              className={`absolute ${s.fold} left-0 bg-[#5a0d0d]`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />

        <span aria-hidden="true"
              className={`absolute ${s.sparkles[0]} text-gold animate-sparkle-1
                         drop-shadow-[0_0_3px_rgba(255,216,0,0.9)]`}>✦</span>
        <span aria-hidden="true"
              className={`absolute ${s.sparkles[1]} text-amber-200 animate-sparkle-2
                         drop-shadow-[0_0_3px_rgba(252,211,77,0.8)]`}>✦</span>
        <span aria-hidden="true"
              className={`absolute ${s.sparkles[2]} text-gold animate-sparkle-3
                         drop-shadow-[0_0_3px_rgba(255,216,0,0.8)]`}>✦</span>
      </div>
    </div>
  )
}

export default SaleRibbon
