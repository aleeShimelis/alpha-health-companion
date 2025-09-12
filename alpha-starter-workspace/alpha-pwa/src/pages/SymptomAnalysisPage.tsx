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
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Symptom Analysis (Non‑diagnostic)</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <textarea required placeholder="Describe your symptom" value={description} onChange={e=>setDescription(e.target.value)} />
        <select value={severity} onChange={e=>setSeverity(e.target.value as any)}>
          <option value="">Severity (optional)</option>
          <option value="mild">mild</option>
          <option value="moderate">moderate</option>
          <option value="severe">severe</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? 'Analyzing.' : 'Analyze'}</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

      {data && (
        <div style={{ marginTop: 20 }}>
          <h3>Advice</h3>
          <ul>
            {data.advice.map((a,i)=>(<li key={i}>{a}</li>))}
          </ul>
          <div><strong>Flags:</strong> {data.risk_flags.join(', ') || 'none'}</div>
          <div style={{ marginTop: 12, padding: 12, border: '1px solid #f99', background: '#fff7f7', borderRadius: 6 }}>
            <strong>Disclaimer</strong>
            <p style={{ margin: 0 }}>{data.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  )
}

