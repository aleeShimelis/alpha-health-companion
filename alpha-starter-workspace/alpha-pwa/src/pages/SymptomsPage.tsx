import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { createSymptom, listSymptoms, updateSymptom, deleteSymptom, SymptomIn, SymptomOut, analyzeSymptom, type SymptomAnalysisOut } from '../api/symptoms'
import Modal from '../components/Modal'

export default function Symptoms() {
  const { token } = useAuth()
  const [items, setItems] = useState<SymptomOut[]>([])
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'' | 'mild' | 'moderate' | 'severe'>('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analysisFor, setAnalysisFor] = useState<SymptomOut | null>(null)
  const [analysis, setAnalysis] = useState<SymptomAnalysisOut | null>(null)
  const [edit, setEdit] = useState<SymptomOut | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editSev, setEditSev] = useState<''|'mild'|'moderate'|'severe'>('')
  const [toDelete, setToDelete] = useState<SymptomOut | null>(null)

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
          <thead><tr><th>When</th><th>Description</th><th>Severity</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id}>
                <td>{new Date(it.created_at).toLocaleString()}</td>
                <td>{it.description}</td>
                <td>{it.severity ?? 'N/A'}</td>
                <td>
                  <button
                    className="btn btn-secondary"
                    disabled={analyzingId === it.id}
                    onClick={async () => {
                      if (!token) return
                      setAnalysis(null)
                      setAnalysisFor(it)
                      setAnalyzingId(it.id)
                      try {
                        const res = await analyzeSymptom(token, { description: it.description, severity: (it.severity as any) ?? null })
                        setAnalysis(res)
                      } catch (e) {
                        setAnalysis({ advice: [], risk_flags: [], disclaimer: 'Failed to analyze' })
                      } finally {
                        setAnalyzingId(null)
                      }
                    }}
                  >
                    {analyzingId === it.id && <span className="spinner" style={{ marginRight: 8 }} />}
                    {analyzingId === it.id ? 'Analyzing...' : 'Analyze'}
                  </button>
                  <button className="btn" style={{ marginLeft: 6 }} onClick={() => { setEdit(it); setEditDesc(it.description); setEditSev((it.severity as any) || '') }}>Edit</button>
                  <button className="btn btn-danger" style={{ marginLeft: 6 }} onClick={() => setToDelete(it)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!analysisFor} title="Symptom analysis (non‑diagnostic)" onClose={() => { setAnalysisFor(null); setAnalysis(null) }}>
        {!analysis && (
          <div><span className="spinner" /> <span style={{ marginLeft: 8 }}>Analyzing…</span></div>
        )}
        {analysis && (
          <div className="stack gap-2">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Advice</h3>
              {analysis.advice.length === 0 ? <small>No advice available.</small> : (
                <ul>{analysis.advice.map((a, i) => (<li key={i}>{a}</li>))}</ul>
              )}
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Flags</h3>
              <div>{analysis.risk_flags.join(', ') || 'none'}</div>
            </div>
            <div className="card" style={{ borderColor:'#f99' }}>
              <strong>Disclaimer</strong>
              <p style={{ margin: 0 }}>{analysis.disclaimer}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!edit} title="Edit symptom" onClose={() => setEdit(null)} onConfirm={async () => {
        if (!token || !edit) return
        try{
          const updated = await updateSymptom(token, edit.id, { description: editDesc.trim(), severity: editSev || null } as any)
          setItems(items.map(i => i.id===edit.id ? updated : i))
        } finally { setEdit(null) }
      }} confirmText="Save">
        <div className="stack gap-2">
          <textarea className="textarea" value={editDesc} onChange={e=>setEditDesc(e.target.value)} />
          <select className="select" value={editSev} onChange={e=>setEditSev(e.target.value as any)}>
            <option value="">Severity (optional)</option>
            <option value="mild">mild</option>
            <option value="moderate">moderate</option>
            <option value="severe">severe</option>
          </select>
        </div>
      </Modal>

      <Modal open={!!toDelete} title="Delete symptom" onClose={() => setToDelete(null)} onConfirm={async () => {
        if (!token || !toDelete) return
        try{ await deleteSymptom(token, toDelete.id); setItems(items.filter(i => i.id!==toDelete.id)) } finally { setToDelete(null) }
      }} confirmText="Delete">
        Are you sure you want to delete this symptom from {toDelete ? new Date(toDelete.created_at).toLocaleString() : ''}?
      </Modal>
    </div>
  )
}


