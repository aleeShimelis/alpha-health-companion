import { Link } from 'react-router-dom'
import { showLocalTestNotification } from '../api/notifications'
import { ensurePushSubscription, registerPushOnServer, listReminders, type ReminderOut } from '../api/reminders'
import { useAuth } from '../auth/AuthContext'
import { useEffect, useState } from 'react'
import { useToasts } from '../components/Toasts'

export default function Dashboard(){
  const { token } = useAuth()
  const { addToast } = useToasts()
  const [reminders, setReminders] = useState<ReminderOut[]>([])
  useEffect(() => { (async () => { try{ if(token){ const r = await listReminders(token); setReminders(r.slice(0,5)) } } catch{} })() }, [token])
  return (
    <div>
      <section className="hero" style={{ marginBottom: 16 }}>
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="hero-badge-row">
              <div className="brand-badge" />
              <span className="badge">Welcome back</span>
            </div>
            <h1 className="hero-title">Welcome to ALPHA</h1>
            <p className="hero-subtitle">Your intelligent health companion for tracking, insights, and gentle guidance.</p>
            <div className="actions">
              <Link
                className="btn btn-primary cta"
                to="/vitals"
                onClick={(e) => {
                  try{
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                    burstConfetti(Math.round(r.left + r.width/2), Math.round(r.top + r.height/2))
                  } catch {}
                }}
              >
                Quick Add Vitals
              </Link>
              <Link className="btn btn-secondary cta" to="/symptoms">Report Symptom</Link>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-chip">🩺</div>
            <div className="hero-chip">📊</div>
            <div className="hero-chip">📝</div>
            <div className="hero-chip">🔔</div>
          </div>
        </div>
      </section>

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
          </div>
        </div>
        <div className="card">
          <h3>Reports</h3>
          <div className="toolbar" style={{ marginTop: 8 }}>
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

// Lightweight confetti burst without deps; attaches elements to body and cleans up.
function burstConfetti(x: number, y: number, count = 18){
  const colors = [0, 25, 45, 200, 215, 260, 140]
  for(let i=0;i<count;i++){
    const el = document.createElement('span')
    el.className = 'confetti'
    const dx = Math.round((Math.random() * 2 - 1) * 140)
    const dy = Math.round(-60 - Math.random() * 160)
    const rot = Math.round((Math.random() * 2 - 1) * 360)
    const hue = colors[Math.floor(Math.random()*colors.length)] + Math.round((Math.random()*20)-10)
    const dur = 700 + Math.round(Math.random() * 500)
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    el.style.color = `hsl(${hue}, 95%, 60%)`
    el.style.setProperty('--dx', `${dx}px`)
    el.style.setProperty('--dy', `${dy}px`)
    el.style.setProperty('--rot', `${rot}deg`)
    el.style.setProperty('--dur', `${dur}ms`)
    document.body.appendChild(el)
    window.setTimeout(() => { el.remove() }, dur + 60)
  }
}

