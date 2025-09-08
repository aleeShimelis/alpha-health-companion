import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { createSymptom, listSymptoms, SymptomIn, SymptomOut } from '../api/symptoms'

export default function Symptoms() {
  const { token } = useAuth()
  const [items, setItems] = useState<SymptomOut[]>([])
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<'' | 'mild' | 'moderate' | 'severe'>('')
  const [onsetAt, setOnsetAt] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

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
      const payload: SymptomIn = {
        description: description.trim(),
        severity: severity === '' ? null : severity,
        onset_at: onsetAt ? new Date(onsetAt).toISOString() : null,
      }
      await createSymptom(token, payload)
      setDescription('')
      setSeverity('')
      setOnsetAt('')
      refresh()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Symptoms</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
        <textarea placeholder="Describe your symptom"
          value={description} onChange={e => setDescription(e.target.value)} required />
        <select value={severity} onChange={e => setSeverity(e.target.value as any)}>
          <option value="">Severity (optional)</option>
          <option value="mild">mild</option>
          <option value="moderate">moderate</option>
          <option value="severe">severe</option>
        </select>
        <input type="datetime-local" value={onsetAt} onChange={e => setOnsetAt(e.target.value)} />
        <button type="submit">Add Symptom</button>
      </form>

      <h3 style={{ marginTop: 24 }}>Recent</h3>
      <ul>
        {items.map(it => (
          <li key={it.id}>
            <div><strong>{new Date(it.created_at).toLocaleString()}</strong></div>
            <div>{it.description}</div>
            <div>Severity: {it.severity ?? 'N/A'} {it.onset_at ? `(onset ${new Date(it.onset_at).toLocaleString()})` : ''}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}


