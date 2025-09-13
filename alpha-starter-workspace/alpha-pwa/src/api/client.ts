import { API_BASE } from './config'
import { setTokenFromOutside } from '../auth/AuthContext'

async function tryRefresh(): Promise<string | null> {
  const rt = localStorage.getItem('refresh_token')
  if (!rt) return null
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const at = data?.access_token as string | undefined
    if (!at) return null
    localStorage.setItem('token', at)
    setTokenFromOutside(at)
    return at
  } catch {
    return null
  }
}

function logoutAndRedirect(){
  try { localStorage.removeItem('token'); localStorage.removeItem('refresh_token') } catch {}
  setTokenFromOutside(null)
  try { if (location.pathname !== '/login') location.href = '/login' } catch {}
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const doFetch = (opts: RequestInit) => fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...opts,
  })
  let res = await doFetch(options)
  if (!res.ok) {
    if (res.status === 401) {
      // Attempt refresh once
      const refreshed = await tryRefresh()
      if (refreshed) {
        const newHeaders = new Headers(options.headers || {})
        newHeaders.set('Authorization', `Bearer ${refreshed}`)
        res = await doFetch({ ...options, headers: newHeaders })
      }
      if (!res.ok) {
        // logout
        logoutAndRedirect()
      }
    }
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || res.statusText)
    }
  }
  if (res.status === 204) {
    // No Content
    return null as unknown as T
  }
  return res.json() as Promise<T>
}
