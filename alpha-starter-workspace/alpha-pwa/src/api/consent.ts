import { api } from './client'

export type Consent = {
  id: string
  user_id: string
  created_at: string
  privacy_accepted: boolean
  marketing_opt_in: boolean
}

export type ConsentIn = {
  privacy_accepted: boolean
  marketing_opt_in?: boolean
}

export async function listConsents(token: string) {
  return api<Consent[]>('/consent', { headers: { Authorization: `Bearer ${token}` } })
}

export async function upsertConsent(token: string, body: ConsentIn) {
  return api<Consent>('/consent', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

