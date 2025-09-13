import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useToasts } from '../components/Toasts'
import ChipsInput from '../components/ChipsInput'

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
  blood_type?: string
  activity_level?: string
  smoking_status?: string
  alcohol_use?: string
  medications?: string[]
  surgeries?: string[]
  family_history?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  preferred_units?: string
}

export default function Profile() {
  const { token } = useAuth()
  const { addToast } = useToasts()
  const [prof, setProf] = useState<Profile | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('')
  const [weightLb, setWeightLb] = useState('')

  async function fetchProf() {
    try {
      const res = await api<Profile>('/profiles/me', { headers: { Authorization: `Bearer ${token}` }})
      setProf(res)
      if (res.preferred_units === 'imperial'){
        if (res.height_cm){
          const totalIn = Number(res.height_cm) / 2.54
          const ft = Math.floor(totalIn / 12)
          const inch = Math.round(totalIn - ft * 12)
          setHeightFt(String(ft))
          setHeightIn(String(inch))
        }
        if (res.weight_kg){ setWeightLb(String(Math.round(Number(res.weight_kg) * 2.20462))) }
      } else {
        setHeightFt(''); setHeightIn(''); setWeightLb('')
      }
    } catch (e:any) {
      setErr(e.message)
    }
  }

  useEffect(() => { fetchProf() }, [])

  async function save(){
    try {
      setSaving(true)
      if(!prof) return
      let toSend: Profile = { ...prof }
      if (prof.preferred_units === 'imperial'){
        const ft = parseInt(heightFt || '0', 10)
        const inch = parseInt(heightIn || '0', 10)
        const totalIn = ft * 12 + inch
        toSend.height_cm = isNaN(totalIn) ? prof.height_cm : Math.round(totalIn * 2.54)
        const lb = parseFloat(weightLb || '0')
        toSend.weight_kg = isNaN(lb) ? prof.weight_kg : Math.round(lb / 2.20462 * 10) / 10
      }
      const res = await api<Profile>('/profiles/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(toSend),
      })
      setProf(res)
      addToast('Profile saved', 'success')
    } catch (e:any) { setErr(e.message) }
    finally { setSaving(false) }
  }

  if(err) return <div className="card" style={{color:'#ff6b6b'}}>{err}</div>
  if(!prof) return <div className="card">Loading…</div>

  return (
    <div className="card" style={{ maxWidth: 900 }}>
      <h2>My Health Profile</h2>
      <div className="grid cols-2" style={{ gap: 12 }}>
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
          <label>Blood Type 
            <select className="select" value={prof.blood_type ?? ''} onChange={e=>setProf({...prof, blood_type: e.target.value})}>
              <option value="">--</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <option key={bt} value={bt}>{bt}</option>)}
            </select>
          </label>
          <label>Preferred Units
            <select className="select" value={prof.preferred_units ?? ''} onChange={e=>setProf({...prof, preferred_units: e.target.value})}>
              <option value="">--</option>
              <option value="metric">metric</option>
              <option value="imperial">imperial</option>
            </select>
          </label>
          <label>Sleep Pref <input className="input" value={prof.sleep_pref ?? ''} onChange={e=>setProf({...prof, sleep_pref: e.target.value})} /></label>
        </div>
        <div className="stack gap-2">
          {prof.preferred_units === 'imperial' ? (
            <>
              <label>Height (ft/in)
                <div className="toolbar">
                  <input className="input" style={{ width: 80 }} placeholder="ft" value={heightFt} onChange={e=>setHeightFt(e.target.value)} />
                  <input className="input" style={{ width: 80 }} placeholder="in" value={heightIn} onChange={e=>setHeightIn(e.target.value)} />
                </div>
              </label>
              <label>Weight (lb) <input className="input" type="number" value={weightLb} onChange={e=>setWeightLb(e.target.value)} /></label>
            </>
          ) : (
            <>
              <label>Height (cm) <input className="input" type="number" value={prof.height_cm ?? ''} onChange={e=>setProf({...prof, height_cm: Number(e.target.value)})} /></label>
              <label>Weight (kg) <input className="input" type="number" value={prof.weight_kg ?? ''} onChange={e=>setProf({...prof, weight_kg: Number(e.target.value)})} /></label>
            </>
          )}
          <label>Activity Level
            <select className="select" value={prof.activity_level ?? ''} onChange={e=>setProf({...prof, activity_level: e.target.value})}>
              <option value="">--</option>
              <option value="sedentary">sedentary</option>
              <option value="light">light</option>
              <option value="moderate">moderate</option>
              <option value="active">active</option>
            </select>
          </label>
          <label>Smoking Status
            <select className="select" value={prof.smoking_status ?? ''} onChange={e=>setProf({...prof, smoking_status: e.target.value})}>
              <option value="">--</option>
              <option value="never">never</option>
              <option value="former">former</option>
              <option value="current">current</option>
            </select>
          </label>
          <label>Alcohol Use
            <select className="select" value={prof.alcohol_use ?? ''} onChange={e=>setProf({...prof, alcohol_use: e.target.value})}>
              <option value="">--</option>
              <option value="none">none</option>
              <option value="light">light</option>
              <option value="moderate">moderate</option>
              <option value="heavy">heavy</option>
            </select>
          </label>
        </div>
      </div>
      <div className="grid cols-2" style={{ gap: 12, marginTop: 12 }}>
        <div className="stack gap-2">
          <label>Allergies
            <ChipsInput value={prof.allergies || []} onChange={arr=>setProf({ ...prof, allergies: arr })} placeholder="Type and press Enter" />
          </label>
          <label>Conditions
            <ChipsInput value={prof.conditions || []} onChange={arr=>setProf({ ...prof, conditions: arr })} placeholder="Type and press Enter" />
          </label>
          <label>Medications
            <ChipsInput value={prof.medications || []} onChange={arr=>setProf({ ...prof, medications: arr })} placeholder="Type and press Enter" />
          </label>
          <label>Surgeries
            <ChipsInput value={prof.surgeries || []} onChange={arr=>setProf({ ...prof, surgeries: arr })} placeholder="Type and press Enter" />
          </label>
        </div>
        <div className="stack gap-2">
          <label>Family History
            <textarea className="textarea" value={prof.family_history ?? ''} onChange={e=>setProf({...prof, family_history: e.target.value})} />
          </label>
          <label>Emergency Contact Name
            <input className="input" value={prof.emergency_contact_name ?? ''} onChange={e=>setProf({...prof, emergency_contact_name: e.target.value})} />
          </label>
          <label>Emergency Contact Phone
            <input className="input" value={prof.emergency_contact_phone ?? ''} onChange={e=>setProf({...prof, emergency_contact_phone: e.target.value})} />
          </label>
        </div>
      </div>
      <div className="toolbar" style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving && <span className="spinner" style={{ marginRight: 8 }} />}
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
