import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { api } from '../api/client'
import Modal from '../components/Modal'
import { useToasts } from '../components/Toasts'

type GoalIn = { category: 'fitness'|'sleep'|'nutrition'|'meds'; target_value: string; cadence: string }
type GoalOut = GoalIn & { id: string; user_id: string; created_at: string }
type GoalProgressIn = { value: string; note?: string | null }
type GoalProgressOut = GoalProgressIn & { id: string; goal_id: string; user_id: string; created_at: string }

export default function GoalsPage(){
  const { token } = useAuth()
  const { addToast } = useToasts()
  const [category, setCategory] = useState<GoalIn['category']>('fitness')
  const [target, setTarget] = useState('')
  const [cadence, setCadence] = useState('')
  const [items, setItems] = useState<GoalOut[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [progressMap, setProgressMap] = useState<Record<string, GoalProgressOut[]>>({})
  const [progressInputs, setProgressInputs] = useState<Record<string, GoalProgressIn>>({})
  const [editGoal, setEditGoal] = useState<GoalOut | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deleteGoal, setDeleteGoal] = useState<GoalOut | null>(null)

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
      addToast('Goal added', 'success')
    } catch(e:any){ setError(String(e?.message || 'Failed to save')); addToast('Failed to add goal', 'error') }
    finally { setLoading(false) }
  }

  async function toggleProgress(goal: GoalOut){
    const next = { ...expanded, [goal.id]: !expanded[goal.id] }
    setExpanded(next)
    if (!next[goal.id]) return
    if (progressMap[goal.id]) return
    try{
      const rows = await api<GoalProgressOut[]>(`/goals/${goal.id}/progress`, { headers: { Authorization: `Bearer ${token}` } })
      setProgressMap({ ...progressMap, [goal.id]: rows })
    } catch{}
  }

  async function addProgress(goal: GoalOut){
    if (!token) return
    const p = progressInputs[goal.id]
    if (!p?.value) { addToast('Enter progress value', 'error'); return }
    try{
      const created = await api<GoalProgressOut>(`/goals/${goal.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(p)
      })
      setProgressInputs({ ...progressInputs, [goal.id]: { value: '', note: '' } })
      const current = progressMap[goal.id] || []
      setProgressMap({ ...progressMap, [goal.id]: [created, ...current] })
      if (!expanded[goal.id]) setExpanded({ ...expanded, [goal.id]: true })
      addToast('Progress logged', 'success')
    } catch(e:any) { addToast('Failed to log progress', 'error') }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>Goals</h2>
        <form onSubmit={onSubmit} className="stack gap-3">
          <select className="select" value={category} onChange={e=>setCategory(e.target.value as GoalIn['category'])}>
            <option value="fitness">fitness</option>
            <option value="sleep">sleep</option>
            <option value="nutrition">nutrition</option>
            <option value="meds">meds</option>
          </select>
          <input className="input" placeholder="Target (e.g., 8k steps/day)" value={target} onChange={e=>setTarget(e.target.value)} required />
          <input className="input" placeholder="Cadence (e.g., daily)" value={cadence} onChange={e=>setCadence(e.target.value)} required />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading && <span className="spinner" style={{ marginRight: 8 }} />}
            {loading ? 'Saving...' : 'Add Goal'}
          </button>
          {error && <div className="badge danger">{error}</div>}
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>My Goals</h3>
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Category</th>
              <th>Target</th>
              <th>Cadence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(g => (
              <React.Fragment key={g.id}>
                <tr>
                  <td>{new Date(g.created_at).toLocaleString()}</td>
                  <td>{g.category}</td>
                  <td>{g.target_value}</td>
                  <td>{g.cadence}</td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => { setEditGoal(g); setEditValue(g.target_value) }}>Edit</button>
                    <button className="btn btn-danger" style={{ marginLeft: 6 }} onClick={() => setDeleteGoal(g)}>Delete</button>
                    <button className="btn" style={{ marginLeft: 6 }} onClick={() => toggleProgress(g)}>{expanded[g.id] ? 'Hide' : 'View'} Progress</button>
                  </td>
                </tr>
                {expanded[g.id] && (
                  <tr>
                    <td colSpan={5}>
                      <div className="stack gap-2">
                        <div className="toolbar" style={{ flexWrap:'wrap' }}>
                          <input className="input" placeholder="Progress value" value={progressInputs[g.id]?.value || ''} onChange={e=>setProgressInputs({ ...progressInputs, [g.id]: { ...(progressInputs[g.id]||{}), value: e.target.value } })} />
                          <input className="input" placeholder="Note (optional)" value={progressInputs[g.id]?.note || ''} onChange={e=>setProgressInputs({ ...progressInputs, [g.id]: { ...(progressInputs[g.id]||{}), note: e.target.value } })} />
                          <button className="btn btn-primary" onClick={() => addProgress(g)}>Add</button>
                        </div>
                        {(progressMap[g.id]||[]).length===0 && <small>No progress yet.</small>}
                        {(progressMap[g.id]||[]).map((p) => (
                          <div key={p.id} className="toolbar" style={{ justifyContent:'space-between' }}>
                            <div><strong>{p.value}</strong> <small>{p.note || ''}</small></div>
                            <small>{new Date(p.created_at).toLocaleString()}</small>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!editGoal} title="Edit goal" onClose={() => setEditGoal(null)} onConfirm={async () => {
        if (!token || !editGoal) return
        try{
          const updated = await api<GoalOut>(`/goals/${editGoal.id}`, {
            method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ target_value: editValue })
          })
          setItems(items.map(it => it.id===editGoal.id ? updated : it))
          addToast('Goal updated', 'success')
        } catch(e:any){ addToast('Failed to update goal', 'error') }
        finally { setEditGoal(null) }
      }} confirmText="Save">
        <input className="input" placeholder="Target" value={editValue} onChange={e=>setEditValue(e.target.value)} />
      </Modal>

      <Modal open={!!deleteGoal} title="Delete goal" onClose={() => setDeleteGoal(null)} onConfirm={async () => {
        if (!token || !deleteGoal) return
        try{
          await api(`/goals/${deleteGoal.id}`, { method:'DELETE', headers: { Authorization: `Bearer ${token}` } })
          setItems(items.filter(it => it.id!==deleteGoal.id))
          addToast('Goal deleted', 'success')
        } catch(e:any){ addToast('Failed to delete goal', 'error') }
        finally { setDeleteGoal(null) }
      }} confirmText="Delete">
        Are you sure you want to delete "{deleteGoal?.target_value}"?
      </Modal>
    </div>
  )
}
