import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'

type MedIn = {
  name: string
  user_context?: { age?: number; sex?: string; allergies?: string }
}

type MedOut = {
  purpose: string
  common_side_effects: string[]
  interactions: string[]
  usage: string
  disclaimer: string
}

export default function MedicationDecoderPage() {
  const { token } = useAuth()
  const [name, setName] = useState('')
  const [age, setAge] = useState<string>('')
  const [sex, setSex] = useState<string>('')
  const [allergies, setAllergies] = useState('')
  const [data, setData] = useState<MedOut | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setData(null)
    setLoading(true)
    try {
      const body: MedIn = { name: name.trim() }
      const ctx: Record<string, any> = {}
      if (age) ctx.age = Number(age)
      if (sex) ctx.sex = sex
      if (allergies) ctx.allergies = allergies
      if (Object.keys(ctx).length) body.user_context = ctx
      const res = await api<MedOut>('/meds/decoder', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: JSON.stringify(body),
      })
      setData(res)
    } catch (e: any) {
      const msg = String(e?.message || 'Request failed')
      if (msg.toLowerCase().includes('llm not configured')) setError('LLM not configured')
      else setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>Medication Decoder</h2>
        <form onSubmit={onSubmit} className="stack gap-3">
          <input className="input" placeholder="Medication name (e.g., ibuprofen)" value={name} onChange={e=>setName(e.target.value)} required />
          <div className="toolbar" style={{ flexWrap:'wrap' }}>
            <input className="input" type="number" min={0} placeholder="Age (optional)" value={age} onChange={e=>setAge(e.target.value)} />
            <select className="select" value={sex} onChange={e=>setSex(e.target.value)}>
              <option value="">Sex (optional)</option>
              <option value="female">female</option>
              <option value="male">male</option>
              <option value="other">other</option>
            </select>
          </div>
          <input className="input" placeholder="Allergies (optional)" value={allergies} onChange={e=>setAllergies(e.target.value)} />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading && <span className="spinner" style={{ marginRight: 8 }} />}
            {loading ? 'Decoding...' : 'Decode'}
          </button>
          {error && <div className="badge danger">{error}</div>}
        </form>
      </div>

      {data && (
        <div className="grid auto-fit" style={{ marginTop: 16 }}>
          <div className="card"><h3 style={{ marginTop:0 }}>Purpose</h3><p>{data.purpose}</p></div>
          <div className="card"><h3 style={{ marginTop:0 }}>Common Side Effects</h3><ul>{data.common_side_effects.map((s,i)=>(<li key={i}>{s}</li>))}</ul></div>
          <div className="card"><h3 style={{ marginTop:0 }}>Interactions</h3><ul>{data.interactions.map((s,i)=>(<li key={i}>{s}</li>))}</ul></div>
          <div className="card"><h3 style={{ marginTop:0 }}>Usage</h3><p>{data.usage}</p></div>
          <div className="card" style={{ borderColor:'#f99' }}>
            <strong>Disclaimer</strong>
            <p style={{ margin: 0 }}>{data.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  )
}
