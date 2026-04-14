// Cliente HTTP centralizado: inyecta el access token, maneja refresh
// automático en 401 (una vez por request) y lanza Error con el mensaje del backend.

const ACCESS_KEY = 'token'
const REFRESH_KEY = 'refreshToken'

const baseUrl = import.meta.env.VITE_API_URL || '' // en dev: proxy Vite

function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens({ token, refreshToken }) {
  if (token) localStorage.setItem(ACCESS_KEY, token)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

let refreshing = null

async function tryRefresh() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  if (refreshing) return refreshing
  refreshing = (async () => {
    try {
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })
      if (!res.ok) {
        clearTokens()
        return false
      }
      const data = await res.json()
      setTokens(data)
      return true
    } catch {
      clearTokens()
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

async function parseOrThrow(res) {
  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await res.json().catch(() => ({})) : await res.text()
  if (!res.ok) {
    const err = new Error(body?.error || `Error ${res.status}`)
    err.status = res.status
    err.details = body?.details
    throw err
  }
  return body
}

export async function apiFetch(path, { method = 'GET', body, headers = {}, skipAuth = false } = {}) {
  const doFetch = async () => {
    const h = { ...headers }
    if (body !== undefined) h['Content-Type'] = 'application/json'
    if (!skipAuth) {
      const token = getAccessToken()
      if (token) h['Authorization'] = `Bearer ${token}`
    }
    return fetch(`${baseUrl}${path}`, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
  }

  let res = await doFetch()

  if (res.status === 401 && !skipAuth && getRefreshToken()) {
    const ok = await tryRefresh()
    if (ok) res = await doFetch()
  }

  return parseOrThrow(res)
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: 'PUT', body }),
  delete: (path, opts) => apiFetch(path, { ...opts, method: 'DELETE' })
}
