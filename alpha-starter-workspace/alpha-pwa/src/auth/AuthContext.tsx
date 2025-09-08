import React, { createContext, useContext, useEffect, useState } from 'react'

type AuthCtx = { token: string | null; setToken: (t: string | null) => void }
const Ctx = createContext<AuthCtx>({ token: null, setToken: () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  useEffect(() => { token ? localStorage.setItem('token', token) : localStorage.removeItem('token') }, [token])
  return <Ctx.Provider value={{ token, setToken }}>{children}</Ctx.Provider>
}

export function useAuth(){ return useContext(Ctx) }
