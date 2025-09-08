import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'

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
  const [prof, setProf] = useState<Profile | null>(null)
  const [err, setErr] = useState<string | null>(null)

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
      if(!prof) return
      const res = await api<Profile>('/profiles/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(prof),
      })
      setProf(res)
      alert('Saved')
    } catch (e:any) { setErr(e.message) }
  }

  if(err) return <div style={{color:'red'}}>{err}</div>
  if(!prof) return <div>Loading…</div>

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>My Health Profile</h2>
      <label>Age <input type="number" value={prof.age ?? ''} onChange={e=>setProf({...prof, age: Number(e.target.value)})} /></label><br/>
      <label>Sex 
        <select value={prof.sex ?? ''} onChange={e=>setProf({...prof, sex: e.target.value})}>
          <option value="">--</option>
          <option value="male">male</option>
          <option value="female">female</option>
          <option value="other">other</option>
        </select>
      </label><br/>
      <label>Height (cm) <input type="number" value={prof.height_cm ?? ''} onChange={e=>setProf({...prof, height_cm: Number(e.target.value)})} /></label><br/>
      <label>Weight (kg) <input type="number" value={prof.weight_kg ?? ''} onChange={e=>setProf({...prof, weight_kg: Number(e.target.value)})} /></label><br/>
      <label>Sleep Pref <input value={prof.sleep_pref ?? ''} onChange={e=>setProf({...prof, sleep_pref: e.target.value})} /></label><br/>
      <button onClick={save}>Save</button>
    </div>
  )
}
