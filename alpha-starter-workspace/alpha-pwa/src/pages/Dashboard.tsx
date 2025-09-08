import { Link } from 'react-router-dom'
import { showLocalTestNotification } from '../api/notifications'

export default function Dashboard(){
  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Dashboard</h2>
      <p>Welcome to ALPHA. Use the links below to navigate.</p>
      <ul>
        <li><Link to="/profile">My Health Profile</Link></li>
        <li><Link to="/vitals">Record Vitals</Link></li>
        <li><Link to="/symptoms">Report Symptoms</Link></li>
        <li><Link to="/meds/decoder">Medication Decoder</Link></li>
        <li><Link to="/goals">Goals</Link></li>
        <li><Link to="/reports">Reports</Link></li>
      </ul>
      <div style={{ marginTop: 16 }}>
        <button onClick={() => {
          showLocalTestNotification().catch(err => alert(String(err?.message || err)))
        }}>Test Notification</button>
      </div>
    </div>
  )
}

