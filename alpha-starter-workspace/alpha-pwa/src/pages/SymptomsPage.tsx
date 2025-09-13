import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { createSymptom, listSymptoms, SymptomIn, SymptomOut } from '../api/symptoms'

export default function Symptoms() {
  const { token } = useAuth()
  const [items, setItems] = useState<SymptomOut[]>([])
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'' | 'mild' | 'moderate' | 'severe'>('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function refresh() {
    if (!token) return
    try {
      const data = await listSymptoms(token)
      setItems(data)
    } catch (e: any) {
      setError(e.message)
    }
  }

  useEffect(() => { refresh() }, [token])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setError(null)
    try {
      setSaving(true)
      const payload: SymptomIn = {
        description: description.trim(),
        severity: severity === '' ? null : severity,
      }
      await createSymptom(token, payload)
      setDescription('')
      setSeverity('')
      // onset_at is not persisted on backend currently
      refresh()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>Symptoms</h2>
        {error && <div className="badge danger">{error}</div>}
        <form onSubmit={onSubmit} className="stack gap-3">
          <textarea className="textarea" placeholder="Describe your symptom" value={description} onChange={e=>setDescription(e.target.value)} required />
          <select className="select" value={severity} onChange={e => setSeverity(e.target.value as any)}>
            <option value="">Severity (optional)</option>
            <option value="mild">mild</option>
            <option value="moderate">moderate</option>
            <option value="severe">severe</option>
          </select>
          {/* onset_at input omitted until backend supports it */}
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving && <span className="spinner" style={{ marginRight: 8 }} />}
            {saving ? 'Adding...' : 'Add Symptom'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Recent</h3>
        <table className="table">
          <thead><tr><th>When</th><th>Description</th><th>Severity</th></tr></thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id}>
                <td>{new Date(it.created_at).toLocaleString()}</td>
                <td>{it.description}</td>
                <td>{it.severity ?? 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


