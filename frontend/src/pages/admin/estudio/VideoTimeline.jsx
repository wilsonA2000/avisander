// Timeline visual para trimear video. Dos handles arrastrables (inicio/fin),
// playhead, y controles play/pause.

import { useRef, useState, useCallback, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function VideoTimeline({ videoRef, duration, trimStart, trimEnd, onTrimChange }) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(null) // 'start' | 'end' | null
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)

  // Sync playhead con video
  useEffect(() => {
    const v = videoRef?.current
    if (!v) return
    const onTime = () => setCurrentTime(v.currentTime)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
    }
  }, [videoRef])

  const getPositionFromEvent = useCallback((e) => {
    const track = trackRef.current
    if (!track || !duration) return 0
    const rect = track.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return pct * duration
  }, [duration])

  const onPointerDown = useCallback((handle, e) => {
    e.preventDefault()
    setDragging(handle)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const t = getPositionFromEvent(e)
      if (dragging === 'start') {
        onTrimChange(Math.min(t, trimEnd - 0.5), trimEnd)
      } else {
        onTrimChange(trimStart, Math.max(t, trimStart + 0.5))
      }
    }
    const onUp = () => setDragging(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging, trimStart, trimEnd, getPositionFromEvent, onTrimChange])

  const togglePlay = () => {
    const v = videoRef?.current
    if (!v) return
    if (v.paused) { v.currentTime = trimStart; v.play() } else { v.pause() }
  }

  if (!duration) return null

  const startPct = (trimStart / duration) * 100
  const endPct = (trimEnd / duration) * 100
  const headPct = (currentTime / duration) * 100

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition">
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <span className="text-sm font-mono text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <span className="text-xs text-gray-400 ml-auto">
          Selección: {formatTime(trimStart)} — {formatTime(trimEnd)} ({formatTime(trimEnd - trimStart)})
        </span>
      </div>

      {/* Track */}
      <div ref={trackRef} className="relative h-10 bg-gray-200 rounded-lg cursor-pointer select-none">
        {/* Region seleccionada */}
        <div
          className="absolute top-0 bottom-0 bg-primary/20 border-y-2 border-primary"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        {/* Handle inicio */}
        <div
          className="absolute top-0 bottom-0 w-3 bg-primary rounded-l cursor-ew-resize z-10 hover:bg-primary-dark transition flex items-center justify-center"
          style={{ left: `${startPct}%`, transform: 'translateX(-100%)' }}
          onMouseDown={(e) => onPointerDown('start', e)}
          onTouchStart={(e) => onPointerDown('start', e)}
        >
          <div className="w-0.5 h-4 bg-white rounded" />
        </div>

        {/* Handle fin */}
        <div
          className="absolute top-0 bottom-0 w-3 bg-primary rounded-r cursor-ew-resize z-10 hover:bg-primary-dark transition flex items-center justify-center"
          style={{ left: `${endPct}%` }}
          onMouseDown={(e) => onPointerDown('end', e)}
          onTouchStart={(e) => onPointerDown('end', e)}
        >
          <div className="w-0.5 h-4 bg-white rounded" />
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
          style={{ left: `${headPct}%` }}
        >
          <div className="w-2 h-2 bg-red-500 rounded-full -translate-x-[3px] -top-1 absolute" />
        </div>
      </div>
    </div>
  )
}

export default VideoTimeline
