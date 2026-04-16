function SaleRibbon({ className = '' }) {
  return (
    <div
      className={`pointer-events-none absolute top-0 left-0 z-10 select-none ${className}`}
      aria-label="Producto en oferta"
    >
      <div className="relative">
        <div
          className="relative inline-flex items-center justify-center
                     w-[56px] h-[22px] pl-1.5 pr-2.5 sm:w-[72px] sm:h-[26px] sm:pl-2 sm:pr-3
                     text-white font-display font-bold text-[9px] sm:text-[11px] tracking-wider uppercase
                     bg-gradient-to-r from-accent-dark via-accent to-[#E63946]
                     shadow-[0_6px_14px_-4px_rgba(160,32,32,0.65),inset_0_-2px_0_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.3)]
                     ribbon-tail"
          style={{
            clipPath: 'polygon(0 0, 100% 0, calc(100% - 9px) 50%, 100% 100%, 0 100%)'
          }}
        >
          <span aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-transparent
                           pointer-events-none"
                style={{ clipPath: 'polygon(0 0, 100% 0, calc(100% - 9px) 50%, 100% 100%, 0 100%)' }} />
          <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">Oferta</span>
        </div>

        <span aria-hidden="true"
              className="absolute -bottom-[3px] left-0 w-2 h-[3px] bg-[#5a0d0d]"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />

        <span aria-hidden="true"
              className="absolute top-0 right-1 text-gold text-[10px] animate-sparkle-1
                         drop-shadow-[0_0_2px_rgba(255,216,0,0.8)]">✦</span>
        <span aria-hidden="true"
              className="absolute -top-1 right-6 text-amber-200 text-[8px] animate-sparkle-2
                         drop-shadow-[0_0_2px_rgba(252,211,77,0.7)]">✦</span>
        <span aria-hidden="true"
              className="absolute bottom-0 right-3 text-gold text-[7px] animate-sparkle-3
                         drop-shadow-[0_0_2px_rgba(255,216,0,0.7)]">✦</span>
      </div>
    </div>
  )
}

export default SaleRibbon
