import { api } from './client'

export type CycleIn = { start_date: string; notes?: string | null }
export type CycleOut = CycleIn & { id: string; user_id: string }

export type CyclePredictOut = {
  average_cycle_days: number
  predicted_next_start: string
  fertile_window_start: string
  fertile_window_end: string
}

export async function addCycle(token: string, body: CycleIn) {
  return api<CycleOut>('/cycles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
}

export async function listCycles(token: string) {
  return api<CycleOut[]>('/cycles', { headers: { Authorization: `Bearer ${token}` } })
}

export async function predictCycle(token: string, lookback = 6) {
  return api<CyclePredictOut>(`/cycles/predict?lookback=${lookback}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

