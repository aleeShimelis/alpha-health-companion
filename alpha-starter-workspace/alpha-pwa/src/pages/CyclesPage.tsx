import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { addCycle, listCycles, predictCycle, type CycleOut } from '../api/cycles'

export default function CyclesPage(){
  const { token } = useAuth()
  const [startDate, setStartDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<CycleOut[]>([])
  const [pred, setPred] = useState<null | { avg: number; next: string; fwStart: string; fwEnd: string }>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load(){
    if (!token) return
    setError(null)
    try {
      const rows = await listCycles(token)
      setItems(rows)
      const p = await predictCycle(token)
      setPred({ avg: p.average_cycle_days, next: p.predicted_next_start, fwStart: p.fertile_window_start, fwEnd: p.fertile_window_end })
    } catch(e:any){ setError(String(e?.message||'Failed to load')) }
  }
  useEffect(() => { load() }, [token])

  async function save(e: React.FormEvent){
    e.preventDefault(); if(!token) return
    setLoading(true); setError(null)
    try {
      const created = await addCycle(token, { start_date: startDate, notes: notes || undefined })
      setItems([created, ...items])
      setStartDate(''); setNotes('')
      const p = await predictCycle(token)
      setPred({ avg: p.average_cycle_days, next: p.predicted_next_start, fwStart: p.fertile_window_start, fwEnd: p.fertile_window_end })
    } catch(e:any){ setError(String(e?.message||'Failed to save')) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Cycle Tracking</h2>
      <form onSubmit={save} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} required />
        <input placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? 'Saving.' : 'Add Cycle Start'}</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

      {pred && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
          <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Avg Cycle (days)</div>
            <div style={{ fontSize: 20 }}>{pred.avg}</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Predicted Next Start</div>
            <div style={{ fontSize: 20 }}>{new Date(pred.next).toLocaleDateString()}</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Fertile Window</div>
            <div style={{ fontSize: 20 }}>{new Date(pred.fwStart).toLocaleDateString()} – {new Date(pred.fwEnd).toLocaleDateString()}</div>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>Recent Entries</h3>
      <table border={1} cellPadding={6} style={{ borderCollapse:'collapse', width:'100%' }}>
        <thead><tr><th>Start Date</th><th>Notes</th></tr></thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.start_date).toLocaleDateString()}</td>
              <td>{r.notes || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

