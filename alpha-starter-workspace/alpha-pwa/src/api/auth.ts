import { api } from './client'
import { API_BASE } from './config'

export async function logout(refreshToken: string){
  // Use fetch directly to avoid recursion in api() if it 401s
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
  if (!res.ok && res.status !== 204) {
    try { throw new Error(await res.text()) } catch { throw new Error('Logout failed') }
  }
}

