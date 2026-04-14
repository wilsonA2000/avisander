import { ChevronLeft, ChevronRight } from 'lucide-react'

// Lista compacta: prev, 1, ..., current-1, current, current+1, ..., total, next
function buildPages(current, total) {
  const pages = new Set([1, total, current, current - 1, current + 1])
  const out = []
  let prev = 0
  for (const n of Array.from(pages).sort((a, b) => a - b)) {
    if (n < 1 || n > total) continue
    if (n - prev > 1) out.push('…')
    out.push(n)
    prev = n
  }
  return out
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = buildPages(page, totalPages)
  const btn = 'min-w-[36px] h-9 px-2 rounded-lg text-sm border transition-colors flex items-center justify-center'
  return (
    <nav className="flex items-center justify-center gap-1 flex-wrap" aria-label="Paginación">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${btn} border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Anterior"
      >
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${btn} ${
              p === page
                ? 'bg-primary text-white border-primary'
                : 'border-gray-200 hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={`${btn} border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}

export default Pagination
