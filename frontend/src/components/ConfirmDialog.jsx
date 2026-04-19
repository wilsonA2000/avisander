import { AlertTriangle, X } from 'lucide-react'

// Modal genérico de confirmación para acciones críticas del admin.
// Uso:
//   <ConfirmDialog
//     open={!!pending}
//     title="Confirmar cambio"
//     message="Mensaje plano opcional"
//     changes={[{ label: 'Precio', from: '$1.000', to: '$1.500' }]}
//     danger                     // opcional: tono rojo para destructivos
//     confirmLabel="Guardar"     // default 'Confirmar'
//     onConfirm={...}
//     onCancel={() => setPending(null)}
//   />
function ConfirmDialog({
  open,
  title = 'Confirmar',
  message,
  changes,
  danger = false,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  onConfirm,
  onCancel
}) {
  if (!open) return null

  const accent = danger ? 'border-rose-500' : 'border-primary'
  const btn = danger
    ? 'bg-rose-600 hover:bg-rose-700'
    : 'bg-primary hover:bg-primary/90'

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl w-full max-w-md overflow-hidden border-t-4 ${accent}`}>
        <div className="flex items-start justify-between p-4 border-b">
          <div className="flex items-start gap-2">
            {danger && <AlertTriangle className="text-rose-500 mt-0.5" size={18} />}
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {message && <p className="text-sm text-gray-700 whitespace-pre-line">{message}</p>}
          {Array.isArray(changes) && changes.length > 0 && (
            <ul className="divide-y border rounded-lg text-sm">
              {changes.map((c, i) => (
                <li key={i} className="px-3 py-2 flex items-center justify-between gap-3">
                  <span className="text-gray-600">{c.label}</span>
                  <span className="font-medium text-gray-800 text-right">
                    <span className="text-gray-400 line-through mr-2">{c.from}</span>
                    <span>→ {c.to}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2 rounded-lg text-white text-sm font-medium ${btn} disabled:opacity-60`}
          >
            {loading ? 'Guardando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
