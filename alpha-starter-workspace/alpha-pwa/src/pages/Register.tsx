import { useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
  const nav = useNavigate()
  const { setToken } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [privacy, setPrivacy] = useState(true)
  const [marketing, setMarketing] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    try {
      const res = await api<{ access_token: string; refresh_token?: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, consent_privacy: privacy, consent_marketing: marketing }),
      })
      setToken(res.access_token)
      if (res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token)
      setOk(true)
      nav('/dashboard')
    } catch (e:any) {
      setErr(e.message || 'Register failed')
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h2>Create your account</h2>
        <form onSubmit={onSubmit} className="stack gap-3">
          <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <label><input type="checkbox" checked={privacy} onChange={e=>setPrivacy(e.target.checked)} /> Accept privacy policy</label>
          <label><input type="checkbox" checked={marketing} onChange={e=>setMarketing(e.target.checked)} /> Marketing opt-in</label>
          <button type="submit" className="btn btn-primary">Create account</button>
        </form>
        {ok && <div style={{color:'#28c76f', marginTop:8}}>Account created!</div>}
        {err && <div style={{color:'#ff6b6b', marginTop:8}}>{err}</div>}
        <div style={{marginTop:12}}>
          Have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  )
}

