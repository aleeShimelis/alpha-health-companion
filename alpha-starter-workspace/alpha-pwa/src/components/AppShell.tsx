import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { logout as apiLogout } from '../api/auth'
import { API_BASE } from '../api/config'
import Footer from './Footer'
import ThemeToggle from './ThemeToggle'

export default function AppShell({ children }: { children: React.ReactNode }){
  const { token, setToken } = useAuth()
  const nav = useNavigate()
  const [openMenu, setOpenMenu] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    let alive = true
    async function load(){
      try{
        if(!token) return
        const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        if(!res.ok) return
        const j = await res.json()
        if(alive) setUserEmail(j?.email || '')
      } catch {}
    }
    load()
    return () => { alive = false }
  }, [token])
  async function onLogout(){
    try{ const rt = localStorage.getItem('refresh_token'); if(rt) await apiLogout(rt) } catch{}
    try{ localStorage.removeItem('token'); localStorage.removeItem('refresh_token') } catch{}
    setToken(null)
    nav('/login')
  }
  return (
    <div>
      <header className="app-header">
        <div className="app-header-inner">
          <NavLink to="/dashboard" className="brand" style={{ textDecoration: 'none' }}>
            <div className="brand-badge" /> <strong>ALPHA</strong>
          </NavLink>
          <nav className="nav" style={{ width: '100%', justifyContent:'space-between' }}>
            <div />
            <div className="nav" style={{ gap: 8, position: 'relative' }}>
              <ThemeToggle />
              {userEmail && <span className="badge">{userEmail}</span>}
              <button
                className="icon-btn"
                onClick={() => setOpenMenu(v=>!v)}
                aria-haspopup="menu"
                aria-label="Account menu"
                aria-expanded={openMenu}
                title="Account"
              >
                <span aria-hidden="true">👤</span>
              </button>
              {openMenu && (
                <div className="dropdown" onMouseLeave={() => setOpenMenu(false)}>
                  <NavLink to="/account" onClick={() => setOpenMenu(false)}>Manage Account</NavLink>
                  <NavLink to="/consent" onClick={() => setOpenMenu(false)}>Consent</NavLink>
                  <a href="#" onClick={(e)=>{ e.preventDefault(); setOpenMenu(false); onLogout() }}>Logout</a>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="container">
        {children}
      </main>
      <Footer />
    </div>
  )
}
