// Tab Editor de Video — trim, texto, audio. Todo client-side via FFmpeg.wasm.

import { useState, useRef, useCallback } from 'react'
import {
  Film, Upload, Scissors, Type, Music, Download, Loader2,
  AlertTriangle, Save, X
} from 'lucide-react'
import { api } from '../../../lib/apiClient'
import { useToast } from '../../../context/ToastContext'
import useFFmpeg from './useFFmpeg'
import VideoTimeline from './VideoTimeline'

function TabEditorVideo() {
  const toast = useToast()
  const ffmpeg = useFFmpeg()
  const videoRef = useRef(null)

  const [videoFile, setVideoFile] = useState(null)    // File original
  const [videoUrl, setVideoUrl] = useState(null)      // ObjectURL para preview
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)

  // Operaciones pendientes
  const [textOverlay, setTextOverlay] = useState('')
  const [textPosition, setTextPosition] = useState('center')
  const [textSize, setTextSize] = useState(48)
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [audioFile, setAudioFile] = useState(null)
  const [audioVolume, setAudioVolume] = useState(0.5)

  const [processing, setProcessing] = useState(false)
  const [resultUrl, setResultUrl] = useState(null)
  const [saving, setSaving] = useState(false)

  // Cargar video
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    const url = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoUrl(url)
    setResultUrl(null)
    setTrimStart(0)
    setTrimEnd(0)
  }

  const onVideoLoaded = () => {
    const v = videoRef.current
    if (v && v.duration && isFinite(v.duration)) {
      setDuration(v.duration)
      setTrimEnd(v.duration)
    }
  }

  // Exportar video con todas las operaciones
  const handleExport = useCallback(async () => {
    if (!videoFile) return
    setProcessing(true)
    try {
      if (!ffmpeg.loaded) await ffmpeg.load()

      let currentBlob = videoFile

      // 1. Trim (si no es el rango completo)
      if (trimStart > 0.1 || trimEnd < duration - 0.1) {
        toast.info('Recortando video...')
        currentBlob = await ffmpeg.trim(currentBlob, trimStart, trimEnd)
      }

      // 2. Texto
      if (textOverlay.trim()) {
        toast.info('Agregando texto...')
        currentBlob = await ffmpeg.addText(currentBlob, textOverlay, textPosition, textSize, textColor)
      }

      // 3. Audio
      if (audioFile) {
        toast.info('Mezclando audio...')
        currentBlob = await ffmpeg.addAudio(currentBlob, audioFile, audioVolume)
      }

      if (resultUrl) URL.revokeObjectURL(resultUrl)
      const url = URL.createObjectURL(currentBlob)
      setResultUrl(url)
      toast.success('Video exportado con éxito')
    } catch (err) {
      toast.error(err.message || 'Error al procesar el video')
    } finally {
      setProcessing(false)
    }
  }, [videoFile, trimStart, trimEnd, duration, textOverlay, textPosition, textSize, textColor, audioFile, audioVolume, ffmpeg, resultUrl, toast])

  // Guardar al backend
  const handleSave = async () => {
    if (!resultUrl) return
    setSaving(true)
    try {
      const resp = await fetch(resultUrl)
      const blob = await resp.blob()
      const formData = new FormData()
      formData.append('image', blob, `video-${Date.now()}.mp4`)
      await api.post('/api/ai/save-edited', formData)
      toast.success('Video guardado en biblioteca')
    } catch (e) {
      toast.error(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Cargar video desde biblioteca
  const [libraryVideos, setLibraryVideos] = useState([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)

  const loadLibraryVideos = async () => {
    setLoadingLibrary(true)
    try {
      const data = await api.get('/api/media?type=video&per_page=60&page=1')
      setLibraryVideos(data.items || [])
    } catch { setLibraryVideos([]) }
    finally { setLoadingLibrary(false) }
  }

  const selectLibraryVideo = async (url) => {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    // Fetch el video como blob para poder pasarlo a FFmpeg
    const resp = await fetch(url)
    const blob = await resp.blob()
    const file = new File([blob], url.split('/').pop() || 'video.mp4', { type: 'video/mp4' })
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(blob))
    setResultUrl(null)
    setTrimStart(0)
    setTrimEnd(0)
    setShowLibrary(false)
  }

  // Sin video cargado: pantalla de bienvenida
  if (!videoUrl) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <Film size={20} className="text-primary" /> Editor de Video
              </h2>
              <p className="text-sm text-gray-500">Recorta, agrega texto y mezcla audio. Todo en tu navegador.</p>
            </div>
            <label className="btn-primary inline-flex items-center gap-2 cursor-pointer text-sm">
              <Upload size={14} />
              Subir video
              <input type="file" accept="video/mp4,video/webm,video/mov" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Browser de videos */}
          {!showLibrary ? (
            <button
              onClick={() => { setShowLibrary(true); loadLibraryVideos() }}
              className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Film size={20} />
              </div>
              <div>
                <p className="font-medium text-sm text-charcoal">Biblioteca de videos</p>
                <p className="text-xs text-gray-500">104 videos disponibles en tu biblioteca</p>
              </div>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowLibrary(false)} className="text-xs text-gray-500 hover:text-primary">← Volver</button>
                <span className="text-sm font-semibold text-charcoal">Videos de la biblioteca</span>
              </div>
              {loadingLibrary ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> Cargando...
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[350px] overflow-y-auto">
                  {libraryVideos.map((v, i) => (
                    <button
                      key={v.url + i}
                      onClick={() => selectLibraryVideo(v.url)}
                      className="group relative rounded-lg overflow-hidden border border-gray-200 hover:border-primary transition bg-charcoal/80 aspect-video flex items-center justify-center"
                    >
                      <Film size={20} className="text-white/50 group-hover:text-white transition" />
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <p className="text-[8px] text-white truncate">{v.original_name || v.url.split('/').pop()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-2xl mx-auto text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <p>
              La primera vez tarda ~10s en descargar el motor de video (~25 MB). Después queda en caché y carga instantáneo.
              Usa un computador para editar video (en celular es lento).
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Editando: <strong>{videoFile?.name}</strong>
        </p>
        <button
          onClick={() => { setVideoUrl(null); setVideoFile(null); setResultUrl(null) }}
          className="text-sm text-gray-500 hover:text-primary inline-flex items-center gap-1"
        >
          <X size={14} /> Cerrar
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        {/* Preview + Timeline */}
        <div className="space-y-4">
          <div className="bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              src={resultUrl || videoUrl}
              controls
              onLoadedMetadata={onVideoLoaded}
              className="w-full max-h-[450px] object-contain"
            />
          </div>

          <VideoTimeline
            videoRef={videoRef}
            duration={duration}
            trimStart={trimStart}
            trimEnd={trimEnd}
            onTrimChange={(s, e) => { setTrimStart(s); setTrimEnd(e) }}
          />
        </div>

        {/* Panel de operaciones */}
        <div className="space-y-4">
          {/* Trim */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h4 className="font-semibold text-charcoal flex items-center gap-2 mb-3">
              <Scissors size={16} /> Recortar
            </h4>
            <p className="text-xs text-gray-500">
              Arrastra los handles en la línea de tiempo para seleccionar el fragmento que quieres conservar.
            </p>
          </div>

          {/* Texto */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h4 className="font-semibold text-charcoal flex items-center gap-2">
              <Type size={16} /> Texto
            </h4>
            <input
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              placeholder="Texto sobre el video..."
              className="input text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <select className="input text-xs" value={textPosition} onChange={(e) => setTextPosition(e.target.value)}>
                <option value="top">Arriba</option>
                <option value="center">Centro</option>
                <option value="bottom">Abajo</option>
              </select>
              <input
                type="number"
                min={12}
                max={120}
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="input text-xs"
                title="Tamaño"
              />
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-9 w-full rounded-lg cursor-pointer"
                title="Color"
              />
            </div>
          </div>

          {/* Audio */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <h4 className="font-semibold text-charcoal flex items-center gap-2">
              <Music size={16} /> Audio
            </h4>
            <label className="text-xs text-gray-500 block">
              {audioFile ? `♪ ${audioFile.name}` : 'Agrega una pista de audio'}
            </label>
            <div className="flex gap-2">
              <label className="text-xs px-3 py-1.5 bg-cream hover:bg-gray-200 rounded-lg cursor-pointer transition inline-flex items-center gap-1">
                <Music size={12} /> Subir audio
                <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
              {audioFile && (
                <button onClick={() => setAudioFile(null)} className="text-xs text-gray-400 hover:text-red-500">Quitar</button>
              )}
            </div>
            {audioFile && (
              <div>
                <label className="text-[10px] text-gray-500">Volumen: {Math.round(audioVolume * 100)}%</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Exportar */}
          <button
            onClick={handleExport}
            disabled={processing}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Procesando… {ffmpeg.progress}%
              </>
            ) : (
              <>
                <Film size={16} /> Exportar video
              </>
            )}
          </button>

          {/* FFmpeg loading */}
          {ffmpeg.loading && (
            <div className="text-xs text-gray-500 text-center">
              <Loader2 size={14} className="animate-spin inline mr-1" />
              Descargando motor de video…
            </div>
          )}

          {/* Resultado */}
          {resultUrl && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
              <p className="text-sm text-green-800 font-medium">Video exportado</p>
              <div className="flex gap-2">
                <a href={resultUrl} download={`avisander-${Date.now()}.mp4`} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                  <Download size={12} /> Descargar
                </a>
                <button onClick={handleSave} disabled={saving} className="text-xs bg-white text-charcoal border border-gray-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                  <Save size={12} /> {saving ? 'Guardando...' : 'Guardar en biblioteca'}
                </button>
              </div>
            </div>
          )}

          {ffmpeg.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
              Error: {ffmpeg.error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TabEditorVideo
