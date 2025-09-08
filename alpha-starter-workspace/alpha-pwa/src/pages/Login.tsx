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
      const res = await api<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(res.access_token)
      nav('/dashboard')
    } catch (e:any) {
      setErr(e.message || 'Login failed')
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block', width:'100%', marginBottom:8}} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block', width:'100%', marginBottom:8}} />
        <button type="submit">Login</button>
      </form>
      {err && <div style={{color:'red', marginTop:8}}>{err}</div>}
      <div style={{marginTop:12}}>
        No account? <Link to="/register">Register</Link>
      </div>
    </div>
  )
}
