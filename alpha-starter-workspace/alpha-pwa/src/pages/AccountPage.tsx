import React, { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useToasts } from '../components/Toasts'

export default function AccountPage(){
  const { token, setToken } = useAuth()
  const { addToast } = useToasts()
  const [deleting, setDeleting] = useState(false)
  const [password, setPassword] = useState('')
  const base = (import.meta as any).env.VITE_API_BASE || 'http://127.0.0.1:8001'

  async function exportData(){
    try{
      const res = await fetch(`${base}/account/export`, { headers: { Authorization: `Bearer ${token}` } })
      if(!res.ok) throw new Error(await res.text())
      const blob = await res.blob(); const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'alpha-account-export.json'; a.click(); URL.revokeObjectURL(url)
      addToast('Account data exported', 'success')
    } catch(e:any){ addToast(String(e?.message||'Failed to export'), 'error') }
  }

  async function deleteAccount(){
    if(!password) { addToast('Enter your password', 'error'); return }
    setDeleting(true)
    try{
      const res = await fetch(`${base}/account/delete`, {
        method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ password })
      })
      if(res.status !== 204) throw new Error(await res.text())
      addToast('Account deleted', 'success')
      // Clear tokens
      try{ localStorage.removeItem('token'); localStorage.removeItem('refresh_token') } catch{}
      setToken(null)
      location.href = '/login'
    } catch(e:any){ addToast(String(e?.message||'Failed to delete'), 'error') }
    finally{ setDeleting(false) }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 720 }}>
        <h2>Manage Account</h2>
        <p>Your health data belongs to you. You can export a copy, or delete your account entirely. Inspired by best-in-class experiences like Ada Health, we keep the tone simple and supportive.</p>
        <div className="grid cols-2">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Export my data</h3>
            <p>Download a JSON export of your profile, vitals, symptoms, and goals for your records.</p>
            <button className="btn btn-primary" onClick={exportData}>Export</button>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Delete my account</h3>
            <p>This action is permanent. Enter your password to confirm.</p>
            <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button className="btn btn-danger" onClick={deleteAccount} disabled={deleting}>
              {deleting && <span className="spinner" style={{ marginRight: 8 }} />}
              {deleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

