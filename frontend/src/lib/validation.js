// Helpers de validación reusables. No lanzan: devuelven boolean o string de error.

export function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

// Colombia: celular 10 dígitos (3xx...) o fijo 7 dígitos.
export function validatePhoneColombia(value) {
  const d = normalizePhoneDigits(value)
  return d.length === 10 || d.length === 7
}

export function validateNIT(value) {
  const d = normalizePhoneDigits(value)
  return d.length >= 5 && d.length <= 11
}

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
export function validateEmail(value) {
  return EMAIL_RE.test(String(value || '').trim())
}

export function validateCoordinates(lat, lng) {
  const la = Number(lat)
  const ln = Number(lng)
  return (
    Number.isFinite(la) && la >= -90 && la <= 90 &&
    Number.isFinite(ln) && ln >= -180 && ln <= 180
  )
}
