import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listReminders, scheduleReminder, deleteReminder, sendNow, type ReminderOut } from '../api/reminders'
import { useToasts } from '../components/Toasts'
import Modal from '../components/Modal'

export default function RemindersPage(){
  const { token } = useAuth()
  const { addToast } = useToasts()
  const [message, setMessage] = useState('Take your medication')
  const [when, setWhen] = useState('')
  const [items, setItems] = useState<ReminderOut[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [toDelete, setToDelete] = useState<ReminderOut | null>(null)
  const [recurrence, setRecurrence] = useState<''|'daily'|'weekly'>('')

  async function load(){
    if(!token) return
    setError(null)
    try{ setItems(await listReminders(token)) } catch(e:any){ setError(String(e?.message||'Failed to load')) }
  }
  useEffect(() => { load() }, [token])

  async function create(e: React.FormEvent){
    e.preventDefault(); if(!token) return
    setLoading(true)
    try{
      const iso = when ? new Date(when).toISOString() : new Date().toISOString()
      const r = await scheduleReminder(token, { message: message.trim(), scheduled_at: iso, recurrence: recurrence || (null as any) })
      setItems([r, ...items])
      setMessage(''); setWhen(''); setRecurrence('')
      addToast('Reminder scheduled', 'success')
    } catch(e:any){ setError(String(e?.message||'Failed to schedule')) }
    finally { setLoading(false) }
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Reminders</h2>
        <form onSubmit={create} className="toolbar" style={{ flexWrap:'wrap' }}>
          <input className="input" placeholder="Message" value={message} onChange={e=>setMessage(e.target.value)} />
          <input className="input" type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)} />
          <select className="select" value={recurrence} onChange={e=>setRecurrence(e.target.value as any)}>
            <option value="">one-time</option>
            <option value="daily">daily</option>
            <option value="weekly">weekly</option>
          </select>
          <button className="btn btn-primary" disabled={loading}>
            {loading && <span className="spinner" style={{ marginRight: 8 }} />}
            {loading? 'Scheduling...' : 'Schedule'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={async () => {
            if (!token) return
            setSending(true)
            try{ const res = await sendNow(token); addToast(`Sent: ${res.sent}, Failed: ${res.failed}`, 'info') } catch(e:any){ addToast(String(e?.message||'Failed to send'), 'error') } finally { setSending(false) }
          }} disabled={sending}>
            {sending && <span className="spinner" style={{ marginRight: 8 }} />}
            {sending ? 'Sending...' : 'Send Now'}
          </button>
        </form>
        {error && <div className="badge danger" style={{ marginTop: 8 }}>{error}</div>}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Scheduled</h3>
        <table className="table">
          <thead><tr><th>When</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.scheduled_at).toLocaleString()}</td>
                <td>{r.message}</td>
                <td>{r.sent_at ? 'sent' : 'pending'}</td>
                <td>
                  <button className="btn btn-danger" onClick={() => setToDelete(r)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!toDelete} title="Delete reminder" onClose={() => setToDelete(null)} onConfirm={async () => {
        if (!token || !toDelete) return
        try{ await deleteReminder(token, toDelete.id); setItems(items.filter(i=>i.id!==toDelete.id)); addToast('Reminder deleted', 'success') } catch(e:any){ addToast(String(e?.message||'Failed'), 'error') } finally { setToDelete(null) }
      }} confirmText="Delete">
        Are you sure you want to delete the reminder "{toDelete?.message}" scheduled for {toDelete ? new Date(toDelete.scheduled_at).toLocaleString() : ''}?
      </Modal>
    </div>
  )
}
