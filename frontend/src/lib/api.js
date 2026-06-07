// Single API client. The frontend never talks to the DB directly — it calls the
// FastAPI backend over /api/*. In production nginx proxies /api to the backend
// container; in dev Vite proxies /api to http://localhost:8000 (see vite.config.js).

const BASE = '/api'
const TOKEN_KEY = 'auth_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  // URLSearchParams -> form-encoded (fetch sets the Content-Type itself); else JSON
  const isForm = body instanceof URLSearchParams
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (auth && token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = data?.detail ?? `Request failed (${res.status})`
    throw new Error(Array.isArray(message) ? message[0]?.msg ?? 'Error' : message)
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
