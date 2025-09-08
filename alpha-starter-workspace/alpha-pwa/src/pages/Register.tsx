import { useState } from 'react'
import { api } from '../api/client'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
  const nav = useNavigate()
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
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email, password, consent_privacy: privacy, consent_marketing: marketing
        }),
      })
      setOk(true)
      setTimeout(() => nav('/login'), 1000)
    } catch (e:any) {
      setErr(e.message || 'Register failed')
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h2>Register</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{display:'block', width:'100%', marginBottom:8}} />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{display:'block', width:'100%', marginBottom:8}} />
        <label><input type="checkbox" checked={privacy} onChange={e=>setPrivacy(e.target.checked)} /> Accept privacy policy</label><br/>
        <label><input type="checkbox" checked={marketing} onChange={e=>setMarketing(e.target.checked)} /> Marketing opt-in</label><br/>
        <button type="submit">Create account</button>
      </form>
      {ok && <div style={{color:'green', marginTop:8}}>Account created! Redirecting…</div>}
      {err && <div style={{color:'red', marginTop:8}}>{err}</div>}
      <div style={{marginTop:12}}>
        Have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  )
}
