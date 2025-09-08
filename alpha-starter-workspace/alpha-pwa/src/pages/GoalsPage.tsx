import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'

type GoalIn = { category: 'fitness'|'sleep'|'nutrition'|'meds'; target_value: string; cadence: string }
type GoalOut = GoalIn & { id: string; user_id: string; created_at: string }

export default function GoalsPage(){
  const { token } = useAuth()
  const [category, setCategory] = useState<GoalIn['category']>('fitness')
  const [target, setTarget] = useState('')
  const [cadence, setCadence] = useState('')
  const [items, setItems] = useState<GoalOut[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load(){
    if (!token) return
    setError(null)
    try {
      const res = await api<GoalOut[]>('/goals', { headers: { Authorization: `Bearer ${token}` } })
      setItems(res)
    } catch(e: any){ setError(String(e?.message || 'Failed to load goals')) }
  }

  useEffect(() => { load() }, [token])

  async function onSubmit(e: React.FormEvent){
    e.preventDefault(); if(!token) return
    setError(null); setLoading(true)
    try {
      const body: GoalIn = { category, target_value: target.trim(), cadence: cadence.trim() }
      const created = await api<GoalOut>('/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      })
      setItems([created, ...items])
      setTarget(''); setCadence('')
    } catch(e:any){ setError(String(e?.message || 'Failed to save')) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Goals</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
        <select value={category} onChange={e=>setCategory(e.target.value as GoalIn['category'])}>
          <option value="fitness">fitness</option>
          <option value="sleep">sleep</option>
          <option value="nutrition">nutrition</option>
          <option value="meds">meds</option>
        </select>
        <input placeholder="Target (e.g., 8k steps/day)" value={target} onChange={e=>setTarget(e.target.value)} required />
        <input placeholder="Cadence (e.g., daily)" value={cadence} onChange={e=>setCadence(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Add Goal'}</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

      <h3 style={{ marginTop: 24 }}>My Goals</h3>
      <table border={1} cellPadding={6} style={{ borderCollapse:'collapse', width:'100%' }}>
        <thead>
          <tr>
            <th>When</th>
            <th>Category</th>
            <th>Target</th>
            <th>Cadence</th>
          </tr>
        </thead>
        <tbody>
          {items.map(g => (
            <tr key={g.id}>
              <td>{new Date(g.created_at).toLocaleString()}</td>
              <td>{g.category}</td>
              <td>{g.target_value}</td>
              <td>{g.cadence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


