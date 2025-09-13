import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'
import { useToasts } from '../components/Toasts'

type VitalsSummary = { total: number; bp: Record<string, number>; hr: Record<string, number>; temp: Record<string, number>; glucose: Record<string, number> }
type SymptomSummary = { total: number; by_severity: Record<string, number> }
type ReportOut = { period: 'week'|'month'; vitals_summary: VitalsSummary; symptom_summary: SymptomSummary; markdown: string }

export default function ReportsPage(){
  const { token } = useAuth()
  const { addToast } = useToasts()
  const [period, setPeriod] = useState<'week'|'month'>('week')
  const [data, setData] = useState<ReportOut | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

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

  async function download(){
    if (!token) return
    const base = (import.meta as any).env.VITE_API_BASE || 'http://127.0.0.1:8001'
    setDownloading(true)
    try{
      const res = await fetch(`${base}/reports/export?period=${period}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(await res.text())
      const blob = await res.blob(); const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `alpha-summary-${period}.md`; a.click(); URL.revokeObjectURL(url)
      addToast('Report downloaded', 'success')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Reports</h2>
        <div className="toolbar">
          <select className="select" value={period} onChange={e => setPeriod(e.target.value as 'week'|'month')}>
            <option value="week">week</option>
            <option value="month">month</option>
          </select>
          <button className="btn btn-secondary" onClick={() => load(period)} disabled={loading}>
            {loading && <span className="spinner" style={{ marginRight: 8 }} />}
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={() => download()} disabled={downloading}>
            {downloading && <span className="spinner" style={{ marginRight: 8 }} />}
            {downloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
        {error && <div className="badge danger" style={{ marginTop: 8 }}>{error}</div>}
      </div>

      {data && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="grid auto-fit">
            <div className="card"><div>Vitals total</div><div style={{ fontSize: 20 }}>{data.vitals_summary.total}</div></div>
            <div className="card"><div>Symptoms total</div><div style={{ fontSize: 20 }}>{data.symptom_summary.total}</div></div>
            <div className="card"><div>BP crisis</div><div style={{ fontSize: 20 }}>{data.vitals_summary.bp['hypertensive-crisis'] || 0}</div></div>
            <div className="card"><div>Fever-high</div><div style={{ fontSize: 20 }}>{data.vitals_summary.temp['fever-high'] || 0}</div></div>
          </div>
          <h3>Summary</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{data.markdown}</pre>
        </div>
      )}
    </div>
  )
}
