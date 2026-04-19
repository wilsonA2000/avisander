import { useState, useEffect, useRef, memo } from 'react'
import Lottie from 'lottie-react'

const ANIMALS = [
  '/animations/chicken-walk.json',
  '/animations/cow-walk.json',
  '/animations/pig-walk.json'
]

const IDLE_DELAY = 5000
const PET_SIZE = 640

function IdleCursorPet() {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [animalIdx, setAnimalIdx] = useState(0)
  const [animData, setAnimData] = useState(null)
  const timerRef = useRef(null)
  const posRef = useRef({ x: 0, y: 0 })
  const idxRef = useRef(0)

  // Desactivar en dispositivos sin puntero fino (móviles, tablets). El pet
  // sigue al cursor; sin mouse real estorba la UI táctil.
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    setIsTouchDevice(mq.matches)
    const handler = (e) => setIsTouchDevice(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Respetar prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Precargar el JSON del animal actual
  useEffect(() => {
    let cancelled = false
    fetch(ANIMALS[animalIdx])
      .then(r => r.json())
      .then(data => { if (!cancelled) setAnimData(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [animalIdx])

  useEffect(() => {
    if (reducedMotion || isTouchDevice) return

    const resetTimer = () => {
      setVisible(false)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setPos({ ...posRef.current })
        setVisible(true)
      }, IDLE_DELAY)
    }

    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (visible) {
        // Cursor se movió: ocultar y avanzar al siguiente animal
        setVisible(false)
        idxRef.current = (idxRef.current + 1) % ANIMALS.length
        setAnimalIdx(idxRef.current)
      }
      resetTimer()
    }

    const onLeave = () => {
      clearTimeout(timerRef.current)
      setVisible(false)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      clearTimeout(timerRef.current)
    }
  }, [reducedMotion, isTouchDevice, visible])

  if (reducedMotion || isTouchDevice || !animData) return null

  return (
    <div
      aria-hidden="true"
      className="fixed pointer-events-none z-[9998]"
      style={{
        left: pos.x - PET_SIZE / 2,
        top: pos.y - PET_SIZE / 2,
        width: PET_SIZE,
        height: PET_SIZE,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.3)',
        transition: visible
          ? 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          : 'opacity 0.2s ease-in, transform 0.2s ease-in'
      }}
    >
      {visible && (
        <Lottie
          animationData={animData}
          loop
          autoplay
          style={{ width: PET_SIZE, height: PET_SIZE }}
        />
      )}
    </div>
  )
}

export default memo(IdleCursorPet)
