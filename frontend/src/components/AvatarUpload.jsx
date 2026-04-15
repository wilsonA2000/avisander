import { useRef, useState } from 'react'
import { Camera, Loader2, User } from 'lucide-react'
import { useToast } from '../context/ToastContext'

function initials(name) {
  return String(name || '?')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// Sube la imagen a /api/upload/avatar y llama onUploaded(url) para que el caller
// haga PUT /api/auth/me con la nueva URL. Muestra preview optimista.
function AvatarUpload({ value, name, onUploaded, size = 96 }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const inputRef = useRef(null)
  const toast = useToast()

  const displayUrl = preview || value
  const sizePx = `${size}px`

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen excede 5 MB')
      return
    }

    // Preview instantáneo (revoca al terminar)
    const objUrl = URL.createObjectURL(file)
    setPreview(objUrl)

    setUploading(true)
    try {
      const token = localStorage.getItem('token')
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir')
      await onUploaded(data.url)
      toast.success('Foto actualizada')
    } catch (err) {
      toast.error(err.message || 'No se pudo subir la imagen')
      setPreview(null)
    } finally {
      setUploading(false)
      URL.revokeObjectURL(objUrl)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="relative inline-block">
      <div
        className="rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg"
        style={{ width: sizePx, height: sizePx }}
      >
        {displayUrl ? (
          <img src={displayUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" />
        ) : name ? (
          <span className="text-2xl font-bold text-gray-500">{initials(name)}</span>
        ) : (
          <User size={size / 2.5} className="text-gray-400" />
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-2 shadow-md hover:bg-primary-dark disabled:opacity-50 transition-colors"
        aria-label="Cambiar foto de perfil"
      >
        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

export default AvatarUpload
