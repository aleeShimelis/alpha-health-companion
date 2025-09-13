import { Link, useNavigate } from 'react-router-dom'
import { showLocalTestNotification } from '../api/notifications'
import { ensurePushSubscription, registerPushOnServer, listReminders, type ReminderOut } from '../api/reminders'
import { useAuth } from '../auth/AuthContext'
import { logout as apiLogout } from '../api/auth'
import { useEffect, useState } from 'react'
import { useToasts } from '../components/Toasts'

export default function Dashboard(){
  const nav = useNavigate()
  const { token, setToken } = useAuth()
  const { addToast } = useToasts()
  const [reminders, setReminders] = useState<ReminderOut[]>([])
  useEffect(() => { (async () => { try{ if(token){ const r = await listReminders(token); setReminders(r.slice(0,5)) } } catch{} })() }, [token])
  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div className="brand-badge" />
            <div>
              <h2 style={{ margin: 0 }}>Welcome to ALPHA</h2>
              <small>Your intelligent health companion for tracking, insights, and gentle guidance.</small>
            </div>
          </div>
          <div className="toolbar" style={{ gap: 8 }}>
            <Link className="btn btn-primary" to="/vitals">Quick Add Vitals</Link>
            <Link className="btn btn-secondary" to="/symptoms">Report Symptom</Link>
          </div>
        </div>
      </div>

      <div className="grid auto-fit" style={{ marginBottom: 16 }}>
        <FeatureCard icon="🧍" title="Profile" desc="Manage your health profile, preferences, allergies and more." to="/profile" />
        <FeatureCard icon="🩺" title="Vitals" desc="Log blood pressure, heart rate, temperature, glucose, and weight." to="/vitals" />
        <FeatureCard icon="📝" title="Symptoms" desc="Capture symptoms with optional severity for better context." to="/symptoms" />
        <FeatureCard icon="💊" title="Medication Decoder" desc="Understand medications in plain language (non‑diagnostic)." to="/meds/decoder" />
        <FeatureCard icon="🎯" title="Goals" desc="Set, update, and track progress toward healthy habits." to="/goals" />
        <FeatureCard icon="📊" title="Reports" desc="Weekly/monthly summaries with helpful flags and counts." to="/reports" />
        <FeatureCard icon="🗓️" title="Cycles" desc="Log cycle starts and see simple next‑cycle predictions." to="/cycles" />
        <FeatureCard icon="🔔" title="Reminders" desc="Schedule reminders and receive push notifications." to="/reminders" />
        <FeatureCard icon="✅" title="Consent" desc="Review and update your privacy and marketing consents." to="/consent" />
      </div>

      <div className="grid auto-fit">
        <div className="card">
          <h3>Notifications</h3>
          <p>Test a local notification and register for push reminders.</p>
          <div className="toolbar">
            <button className="btn btn-secondary" onClick={() => {
          showLocalTestNotification().catch(err => alert(String(err?.message || err)))
        }}>Test Notification</button>
        <button className="btn" onClick={async () => {
          try{
            const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
            const sub = await ensurePushSubscription(vapid)
            if(!token) throw new Error('Login required')
            await registerPushOnServer(token, sub)
            addToast('Push subscription stored', 'success')
          } catch(e:any){
            alert(String(e?.message || e))
          }
        }}>Register Push Reminders</button>
        <button className="btn btn-secondary" onClick={async () => {
          try {
            const rt = localStorage.getItem('refresh_token')
            if (rt) { await apiLogout(rt) }
          } catch {}
          try { localStorage.removeItem('token'); localStorage.removeItem('refresh_token') } catch {}
          setToken(null)
          nav('/login')
        }}>Logout</button>
          </div>
        </div>
        <div className="card">
          <h3>Reminders (next 5)</h3>
          {reminders.length===0 && <small>No reminders yet.</small>}
          {reminders.length>0 && (
            <ul>
              {reminders.map(r => (
                <li key={r.id}>{new Date(r.scheduled_at).toLocaleString()} — {r.message} {r.sent_at ? <span className="badge ok" style={{ marginLeft: 6 }}>sent</span> : <span className="badge" style={{ marginLeft: 6 }}>pending</span>}</li>
              ))}
            </ul>
          )}
          <div className="toolbar" style={{ marginTop: 8 }}>
            <Link className="btn" to="/reminders">Manage</Link>
            <button className="btn btn-primary" onClick={async () => {
              if (!token) return
              try {
                const base = (import.meta as any).env.VITE_API_BASE || 'http://127.0.0.1:8001'
                const period = 'week'
                const res = await fetch(`${base}/reports/export?period=${period}`, { headers: { Authorization: `Bearer ${token}` } })
                if (!res.ok) throw new Error(await res.text())
                const blob = await res.blob(); const url = URL.createObjectURL(blob)
                const a = document.createElement('a'); a.href = url; a.download = `alpha-summary-${period}.md`; a.click(); URL.revokeObjectURL(url)
                addToast('Weekly report downloaded', 'success')
              } catch(e:any){ addToast(String(e?.message||'Failed to download'), 'error') }
            }}>Download Weekly Report</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc, to }: { icon: string; title: string; desc: string; to: string }){
  return (
    <div className="card" style={{ display:'grid', gap: 8 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background:'#121926', display:'grid', placeItems:'center', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
        </div>
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      <small>{desc}</small>
      <div>
        <Link className="btn btn-primary" to={to}>Open</Link>
      </div>
    </div>
  )
}

