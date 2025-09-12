import { Link } from 'react-router-dom'
import { showLocalTestNotification } from '../api/notifications'
import { ensurePushSubscription, registerPushOnServer } from '../api/reminders'
import { useAuth } from '../auth/AuthContext'

export default function Dashboard(){
  const { token } = useAuth()
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Dashboard</h2>
      <p>Welcome to ALPHA. Use the links below to navigate.</p>
      <ul>
        <li><Link to="/profile">My Health Profile</Link></li>
        <li><Link to="/vitals">Record Vitals</Link></li>
        <li><Link to="/symptoms">Report Symptoms</Link></li>
        <li><Link to="/symptoms/analyze">Symptom Analysis</Link></li>
        <li><Link to="/meds/decoder">Medication Decoder</Link></li>
        <li><Link to="/goals">Goals</Link></li>
        <li><Link to="/reports">Reports</Link></li>
        <li><Link to="/cycles">Cycle Tracking</Link></li>
        <li><Link to="/consent">Consent</Link></li>
      </ul>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => {
          showLocalTestNotification().catch(err => alert(String(err?.message || err)))
        }}>Test Notification</button>
        <button style={{ marginLeft: 8 }} onClick={async () => {
          try{
            const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
            const sub = await ensurePushSubscription(vapid)
            if(!token) throw new Error('Login required')
            await registerPushOnServer(token, sub)
            alert('Push subscription stored')
          } catch(e:any){
            alert(String(e?.message || e))
          }
        }}>Register Push Reminders</button>
      </div>
    </div>
  )
}

