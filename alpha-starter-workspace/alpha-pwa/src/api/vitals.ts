import { api } from './client'

export type VitalIn = {
  systolic?: number
  diastolic?: number
  heart_rate?: number
  temperature_c?: number
  glucose_mgdl?: number
  weight_kg?: number
}

export type VitalOut = VitalIn & {
  id: string
  user_id: string
  created_at: string
  bp_flag?: string | null
  hr_flag?: string | null
  temp_flag?: string | null
  glucose_flag?: string | null
}

export async function createVital(token: string, body: VitalIn) {
  return api<VitalOut>('/vitals', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

export async function listVitals(token: string) {
  return api<VitalOut[]>('/vitals', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function updateVital(token: string, id: string, body: VitalIn) {
  return api<VitalOut>(`/vitals/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

export async function deleteVital(token: string, id: string) {
  return api<null>(`/vitals/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}
