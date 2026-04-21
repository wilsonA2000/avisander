import { Star } from 'lucide-react'

export default function Stars({ value = 0, size = 16, className = '', interactive = false, onChange }) {
  const full = Math.round(Number(value) || 0)
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} role={interactive ? 'radiogroup' : 'img'} aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= full
        if (interactive) {
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange?.(i)}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`${i} estrella${i > 1 ? 's' : ''}`}
              aria-pressed={active}
            >
              <Star
                size={size}
                className={active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
              />
            </button>
          )
        }
        return (
          <Star
            key={i}
            size={size}
            className={active ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        )
      })}
    </div>
  )
}
