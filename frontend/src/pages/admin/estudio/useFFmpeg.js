// Hook para gestionar el ciclo de vida de FFmpeg.wasm.
// Carga lazy (~25 MB la primera vez, cacheado después) y expone
// operaciones de video: trim, texto, audio, export.

import { useRef, useState, useCallback } from 'react'

export default function useFFmpeg() {
  const ffmpegRef = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (ffmpegRef.current) { setLoaded(true); return }
    setLoading(true)
    setError(null)
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')
      const ffmpeg = new FFmpeg()
      ffmpeg.on('progress', ({ progress: p }) => setProgress(Math.round(p * 100)))
      ffmpeg.on('log', ({ message }) => {
        if (import.meta.env.DEV) console.log('[ffmpeg]', message)
      })
      // Cargar core desde CDN (evita problemas CORS con archivos locales)
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      ffmpegRef.current = ffmpeg
      setLoaded(true)
    } catch (err) {
      setError(err.message || 'No se pudo cargar FFmpeg')
    } finally {
      setLoading(false)
    }
  }, [])

  const writeFile = useCallback(async (name, data) => {
    const { fetchFile } = await import('@ffmpeg/util')
    const buf = data instanceof Blob ? await fetchFile(data) : data
    await ffmpegRef.current.writeFile(name, buf)
  }, [])

  const readFile = useCallback(async (name) => {
    return await ffmpegRef.current.readFile(name)
  }, [])

  // Recortar video entre startSec y endSec
  const trim = useCallback(async (inputBlob, startSec, endSec) => {
    const ff = ffmpegRef.current
    if (!ff) throw new Error('FFmpeg no cargado')
    setProgress(0)
    await writeFile('input.mp4', inputBlob)
    await ff.exec([
      '-i', 'input.mp4',
      '-ss', String(startSec),
      '-to', String(endSec),
      '-c', 'copy',
      '-y', 'output.mp4'
    ])
    const data = await readFile('output.mp4')
    return new Blob([data.buffer], { type: 'video/mp4' })
  }, [writeFile, readFile])

  // Agregar texto sobre el video
  const addText = useCallback(async (inputBlob, text, position = 'center', fontSize = 48, color = 'white') => {
    const ff = ffmpegRef.current
    if (!ff) throw new Error('FFmpeg no cargado')
    setProgress(0)
    await writeFile('input.mp4', inputBlob)
    const yPos = { top: '50', center: '(h-text_h)/2', bottom: 'h-th-50' }[position] || '(h-text_h)/2'
    await ff.exec([
      '-i', 'input.mp4',
      '-vf', `drawtext=text='${text.replace(/'/g, "\\'")}':fontsize=${fontSize}:fontcolor=${color}:x=(w-text_w)/2:y=${yPos}:borderw=2:bordercolor=black`,
      '-c:a', 'copy',
      '-y', 'output.mp4'
    ])
    const data = await readFile('output.mp4')
    return new Blob([data.buffer], { type: 'video/mp4' })
  }, [writeFile, readFile])

  // Mezclar audio con video
  const addAudio = useCallback(async (videoBlob, audioBlob, volume = 0.5) => {
    const ff = ffmpegRef.current
    if (!ff) throw new Error('FFmpeg no cargado')
    setProgress(0)
    await writeFile('input.mp4', videoBlob)
    await writeFile('audio.mp3', audioBlob)
    await ff.exec([
      '-i', 'input.mp4',
      '-i', 'audio.mp3',
      '-filter_complex', `[1:a]volume=${volume}[a1];[0:a][a1]amix=inputs=2:duration=first[aout]`,
      '-map', '0:v', '-map', '[aout]',
      '-c:v', 'copy',
      '-shortest',
      '-y', 'output.mp4'
    ])
    const data = await readFile('output.mp4')
    return new Blob([data.buffer], { type: 'video/mp4' })
  }, [writeFile, readFile])

  return { loaded, loading, progress, error, load, trim, addText, addAudio }
}
