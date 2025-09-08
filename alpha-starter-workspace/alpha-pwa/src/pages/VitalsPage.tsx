import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { createVital, listVitals, type VitalIn, type VitalOut } from '../api/vitals'

export default function Vitals(){
  const { token } = useAuth()
  const [form, setForm] = useState<VitalIn>({})
  const [rows, setRows] = useState<VitalOut[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function load(){
    try {
      const data = await listVitals(token!)
      setRows(data)
    } catch(e:any){ setErr(e.message) }
  }
  useEffect(() => { load() }, [])

  async function save(e: React.FormEvent){
    e.preventDefault(); setErr(null); setOk(null)
    try {
      const sent: VitalIn = {}
      for (const k of ['systolic','diastolic','heart_rate','temperature_c','glucose_mgdl','weight_kg'] as const) {
        const v = (form as any)[k]
        if (v !== undefined && v !== null && v !== '') (sent as any)[k] = Number(v)
      }
      const res = await createVital(token!, sent)
      setOk('Saved'); setForm({})
      setRows([res, ...rows])
    } catch(e:any){ setErr(e.message) }
  }

  function input(name: keyof VitalIn, placeholder: string, step='1'){
    return (
      <input
        placeholder={placeholder}
        value={(form as any)[name] ?? ''}
        onChange={e=>setForm({ ...form, [name]: e.target.value })}
        style={{ width: 120, marginRight: 8, marginBottom: 8 }}
        type="number" step={step}
      />
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Record Vitals</h2>
      <form onSubmit={save} style={{ marginBottom: 12 }}>
        {input('systolic','Systolic (mmHg)')}
        {input('diastolic','Diastolic (mmHg)')}
        {input('heart_rate','Heart rate (bpm)')}
        {input('temperature_c','Temp (°C)','0.1')}
        {input('glucose_mgdl','Glucose (mg/dL)')}
        {input('weight_kg','Weight (kg)','0.1')}
        <button type="submit">Save</button>
      </form>
      {ok && <div style={{ color:'green' }}>{ok}</div>}
      {err && <div style={{ color:'red' }}>{err}</div>}

      <h3>History</h3>
      <table border={1} cellPadding={6} style={{ borderCollapse:'collapse', width:'100%' }}>
        <thead>
          <tr>
            <th>When</th>
            <th>BP</th>
            <th>HR</th>
            <th>Temp</th>
            <th>Glucose</th>
            <th>Weight</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>{r.systolic ?? '-'} / {r.diastolic ?? '-'}</td>
              <td>{r.heart_rate ?? '-'}</td>
              <td>{r.temperature_c ?? '-'}</td>
              <td>{r.glucose_mgdl ?? '-'}</td>
              <td>{r.weight_kg ?? '-'}</td>
              <td>
                {[r.bp_flag, r.hr_flag, r.temp_flag, r.glucose_flag].filter(Boolean).join(', ') || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
