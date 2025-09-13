import React, { createContext, useContext, useMemo, useState } from 'react'

type Toast = { id: string; message: string; type: 'success'|'error'|'info' }
type Ctx = { addToast: (message: string, type?: Toast['type']) => void }

const Ctx = createContext<Ctx>({ addToast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }){
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = (message: string, type: Toast['type']='info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }
  const value = useMemo(() => ({ addToast }), [])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToasts(){ return useContext(Ctx) }

