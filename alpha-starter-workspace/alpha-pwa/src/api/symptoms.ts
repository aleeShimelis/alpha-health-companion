import { api } from './client'

export type SymptomIn = {
  description: string
  severity?: 'mild' | 'moderate' | 'severe' | null
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


export type SymptomAnalysisOut = {
  advice: string[]
  risk_flags: string[]
  causes: string[]
  implications: string[]
  disclaimer: string
}

export async function analyzeSymptom(token: string, body: SymptomIn) {
  return api<SymptomAnalysisOut>('/symptoms/analyze', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}


