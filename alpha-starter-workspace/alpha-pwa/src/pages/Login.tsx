import { useState } from 'react'
import { api } from '../api/client'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const nav = useNavigate()
  const { setToken } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      const res = await api<{ access_token: string; refresh_token?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(res.access_token)
      if (res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token)
      nav('/dashboard')
    } catch (e:any) {
      setErr(e.message || 'Login failed')
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h2>Welcome back</h2>
        <form onSubmit={onSubmit} className="stack gap-3">
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
        {err && <div style={{color:'#ff6b6b', marginTop:8}}>{err}</div>}
        <div style={{marginTop:12}}>
          No account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  )
}
