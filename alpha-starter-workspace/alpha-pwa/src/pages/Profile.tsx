import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useToasts } from '../components/Toasts'

type Profile = {
  id: string
  user_id: string
  age?: number
  sex?: string
  height_cm?: number
  weight_kg?: number
  allergies?: string[]
  conditions?: string[]
  sleep_pref?: string
}

export default function Profile() {
  const { token } = useAuth()
  const { addToast } = useToasts()
  const [prof, setProf] = useState<Profile | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function fetchProf() {
    try {
      const res = await api<Profile>('/profiles/me', { headers: { Authorization: `Bearer ${token}` }})
      setProf(res)
    } catch (e:any) {
      setErr(e.message)
    }
  }

  useEffect(() => { fetchProf() }, [])

  async function save(){
    try {
      setSaving(true)
      if(!prof) return
      const res = await api<Profile>('/profiles/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(prof),
      })
      setProf(res)
      addToast('Profile saved', 'success')
    } catch (e:any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  if(err) return <div className="card" style={{color:'#ff6b6b'}}>{err}</div>
  if(!prof) return <div className="card">Loading…</div>

  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <h2>My Health Profile</h2>
      <div className="stack gap-2">
        <label>Age <input className="input" type="number" value={prof.age ?? ''} onChange={e=>setProf({...prof, age: Number(e.target.value)})} /></label>
        <label>Sex 
          <select className="select" value={prof.sex ?? ''} onChange={e=>setProf({...prof, sex: e.target.value})}>
            <option value="">--</option>
            <option value="male">male</option>
            <option value="female">female</option>
            <option value="other">other</option>
          </select>
        </label>
        <label>Height (cm) <input className="input" type="number" value={prof.height_cm ?? ''} onChange={e=>setProf({...prof, height_cm: Number(e.target.value)})} /></label>
        <label>Weight (kg) <input className="input" type="number" value={prof.weight_kg ?? ''} onChange={e=>setProf({...prof, weight_kg: Number(e.target.value)})} /></label>
        <label>Sleep Pref <input className="input" value={prof.sleep_pref ?? ''} onChange={e=>setProf({...prof, sleep_pref: e.target.value})} /></label>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving && <span className="spinner" style={{ marginRight: 8 }} />}
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
