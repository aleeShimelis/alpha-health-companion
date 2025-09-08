import { api } from './client'

export type SymptomIn = {
  description: string
  severity?: number | null
  onset_at?: string | null
}

export type SymptomOut = SymptomIn & {
  id: string
  user_id: string
  created_at: string
}

export async function createSymptom(token: string, body: SymptomIn) {
  return api<SymptomOut>('/symptoms', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

export async function listSymptoms(token: string) {
  return api<SymptomOut[]>('/symptoms', {
    headers: { Authorization: `Bearer ${token}` },
  })
}


