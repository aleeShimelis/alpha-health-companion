import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { analyzeSymptom, type SymptomIn, type SymptomAnalysisOut } from '../api/symptoms'

export default function SymptomAnalysisPage(){
  const { token } = useAuth()
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<''|'mild'|'moderate'|'severe'>('')
  const [data, setData] = useState<SymptomAnalysisOut | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent){
    e.preventDefault(); if(!token) return
    setError(null); setData(null); setLoading(true)
    try{
      const body: SymptomIn = { description: description.trim(), severity: severity===''? null : severity }
      const res = await analyzeSymptom(token, body)
      setData(res)
    } catch(e:any){ setError(String(e?.message||'Failed to analyze')) }
    finally { setLoading(false) }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>Symptom Analysis (Non‑diagnostic)</h2>
        <form onSubmit={onSubmit} className="stack gap-3">
          <textarea className="textarea" required placeholder="Describe your symptom" value={description} onChange={e=>setDescription(e.target.value)} />
          <select className="select" value={severity} onChange={e=>setSeverity(e.target.value as any)}>
            <option value="">Severity (optional)</option>
            <option value="mild">mild</option>
            <option value="moderate">moderate</option>
            <option value="severe">severe</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Analyzing.' : 'Analyze'}</button>
          {error && <div className="badge danger">{error}</div>}
        </form>
      </div>

      {data && (
        <div className="grid auto-fit" style={{ marginTop: 16 }}>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Advice</h3>
            <ul>
              {data.advice.map((a,i)=>(<li key={i}>{a}</li>))}
            </ul>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Flags</h3>
            <div>{data.risk_flags.join(', ') || 'none'}</div>
          </div>
          <div className="card" style={{ borderColor:'#f99' }}>
            <strong>Disclaimer</strong>
            <p style={{ margin: 0 }}>{data.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  )
}
