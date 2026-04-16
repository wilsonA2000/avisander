function LowStockBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 pl-1.5 pr-2.5 py-0.5 rounded-full
                  bg-gradient-to-r from-amber-500 to-amber-600
                  text-white text-[10px] font-display italic font-semibold
                  shadow-[0_2px_6px_-1px_rgba(217,119,6,0.5)]
                  ring-1 ring-amber-400/40 backdrop-blur-sm
                  ${className}`}
      aria-label="Quedan pocas unidades"
    >
      <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      Quedan pocas
    </span>
  )
}

export default LowStockBadge
