import React, { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listConsents, upsertConsent, type Consent } from '../api/consent'

export default function ConsentPage(){
  const { token } = useAuth()
  const [items, setItems] = useState<Consent[]>([])
  const [privacy, setPrivacy] = useState(true)
  const [marketing, setMarketing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function load(){
    if(!token) return
    setErr(null)
    try{
      const res = await listConsents(token)
      setItems(res)
      if(res.length){
        setPrivacy(!!res[0].privacy_accepted)
        setMarketing(!!res[0].marketing_opt_in)
      }
    } catch(e:any){ setErr(String(e?.message||'Failed to load')) }
  }
  useEffect(() => { load() }, [token])

  async function save(){
    if(!token) return
    setErr(null); setMsg(null)
    try{
      const updated = await upsertConsent(token, { privacy_accepted: privacy, marketing_opt_in: marketing })
      setItems([updated, ...items])
      setMsg('Saved')
    } catch(e:any){ setErr(String(e?.message||'Failed to save')) }
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Consent</h2>
      <p>Manage your consent preferences. Changes are recorded with history.</p>
      <label><input type="checkbox" checked={privacy} onChange={e=>setPrivacy(e.target.checked)} /> Accept privacy policy</label><br/>
      <label><input type="checkbox" checked={marketing} onChange={e=>setMarketing(e.target.checked)} /> Marketing opt-in</label><br/>
      <button onClick={save}>Save</button>
      {msg && <span style={{ color:'green', marginLeft: 8 }}>{msg}</span>}
      {err && <div style={{ color:'red', marginTop: 8 }}>{err}</div>}

      <h3 style={{ marginTop: 24 }}>History</h3>
      <table border={1} cellPadding={6} style={{ borderCollapse:'collapse', width:'100%' }}>
        <thead><tr><th>When</th><th>Privacy</th><th>Marketing</th></tr></thead>
        <tbody>
          {items.map(c => (
            <tr key={c.id}>
              <td>{new Date(c.created_at).toLocaleString()}</td>
              <td>{c.privacy_accepted ? 'accepted' : 'not accepted'}</td>
              <td>{c.marketing_opt_in ? 'opt-in' : 'opt-out'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

