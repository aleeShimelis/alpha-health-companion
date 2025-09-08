import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'

type VitalsSummary = { total: number; bp: Record<string, number>; hr: Record<string, number>; temp: Record<string, number>; glucose: Record<string, number> }
type SymptomSummary = { total: number; by_severity: Record<string, number> }
type ReportOut = { period: 'week'|'month'; vitals_summary: VitalsSummary; symptom_summary: SymptomSummary; markdown: string }

export default function ReportsPage(){
  const { token } = useAuth()
  const [period, setPeriod] = useState<'week'|'month'>('week')
  const [data, setData] = useState<ReportOut | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load(p: 'week'|'month'){
    if (!token) return
    setLoading(true); setError(null)
    try {
      const res = await api<ReportOut>(`/reports/summary?period=${p}`, { headers: { Authorization: `Bearer ${token}` } })
      setData(res)
    } catch(e:any){ setError(String(e?.message || 'Failed to load')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load(period) }, [token, period])

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Reports</h2>
      <div style={{ marginBottom: 12 }}>
        <select value={period} onChange={e => setPeriod(e.target.value as 'week'|'month')}>
          <option value="week">week</option>
          <option value="month">month</option>
        </select>
        <button onClick={() => load(period)} disabled={loading} style={{ marginLeft: 8 }}>{loading ? 'Loading…' : 'Refresh'}</button>
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {data && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Vitals total</div>
              <div style={{ fontSize: 20 }}>{data.vitals_summary.total}</div>
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Symptoms total</div>
              <div style={{ fontSize: 20 }}>{data.symptom_summary.total}</div>
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>BP crisis</div>
              <div style={{ fontSize: 20 }}>{data.vitals_summary.bp['hypertensive-crisis'] || 0}</div>
            </div>
            <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Fever-high</div>
              <div style={{ fontSize: 20 }}>{data.vitals_summary.temp['fever-high'] || 0}</div>
            </div>
          </div>

          <h3>Summary</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 12, borderRadius: 6, border: '1px solid #eee' }}>{data.markdown}</pre>
        </div>
      )}
    </div>
  )
}


