import React, { createContext, useContext, useEffect, useState } from 'react'

type AuthCtx = { token: string | null; setToken: (t: string | null) => void }
const Ctx = createContext<AuthCtx>({ token: null, setToken: () => {} })

let externalSetter: ((t: string | null) => void) | null = null
export function setTokenFromOutside(t: string | null){ if (externalSetter) externalSetter(t) }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  useEffect(() => { token ? localStorage.setItem('token', token) : localStorage.removeItem('token') }, [token])
  useEffect(() => { externalSetter = setToken; return () => { externalSetter = null } }, [])
  return <Ctx.Provider value={{ token, setToken }}>{children}</Ctx.Provider>
}

export function useAuth(){ return useContext(Ctx) }
