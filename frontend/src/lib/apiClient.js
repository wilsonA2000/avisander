// Cliente HTTP centralizado: envía cookies httpOnly automáticamente (credentials:'include'),
// maneja refresh en 401 (una vez por request) y lanza Error con el mensaje del backend.
// El access_token y refresh_token viven en cookies, no en localStorage.

const baseUrl = import.meta.env.VITE_API_URL || '' // en dev: proxy Vite

let refreshing = null

async function tryRefresh() {
  if (refreshing) return refreshing
  refreshing = (async () => {
    try {
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      return res.ok
    } catch {
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
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
    if (body !== undefined && !isFormData) h['Content-Type'] = 'application/json'
    return fetch(`${baseUrl}${path}`, {
      method,
      headers: h,
      credentials: 'include',
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined
    })
  }

  let res = await doFetch()

  if (res.status === 401 && !skipAuth) {
    const ok = await tryRefresh()
    if (ok) res = await doFetch()
  }

  return parseOrThrow(res)
}

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => apiFetch(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => apiFetch(path, { ...opts, method: 'DELETE' })
}

// Helper para uploads multipart/form-data. Envía cookies httpOnly con credentials:include.
export async function apiFetchFormData(path, formData, { method = 'POST' } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    credentials: 'include',
    body: formData
  })
  if (res.status === 401) {
    const ok = await tryRefresh()
    if (ok) {
      const retry = await fetch(`${baseUrl}${path}`, { method, credentials: 'include', body: formData })
      return parseOrThrow(retry)
    }
  }
  return parseOrThrow(res)
}
