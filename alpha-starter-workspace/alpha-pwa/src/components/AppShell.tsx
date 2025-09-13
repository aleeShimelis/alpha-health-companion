import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { logout as apiLogout } from '../api/auth'

export default function AppShell({ children }: { children: React.ReactNode }){
  const { token, setToken } = useAuth()
  const nav = useNavigate()
  const [openMenu, setOpenMenu] = useState(false)
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
          <div className="brand">
            <div className="brand-badge" /> ALPHA
          </div>
          <nav className="nav" style={{ width: '100%', justifyContent:'space-between' }}>
            <div className="nav" style={{ gap: 12 }}>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/vitals">Vitals</NavLink>
              <NavLink to="/symptoms">Symptoms</NavLink>
              <NavLink to="/goals">Goals</NavLink>
              <NavLink to="/reports">Reports</NavLink>
              <NavLink to="/reminders">Reminders</NavLink>
              <NavLink to="/cycles">Cycles</NavLink>
            </div>
            <div className="nav" style={{ gap: 8, position: 'relative' }}>
              <NavLink to="/profile" className="btn btn-secondary">Profile</NavLink>
              <button className="btn" onClick={() => setOpenMenu(v=>!v)} aria-haspopup>
                Account ▾
              </button>
              {openMenu && (
                <div className="dropdown" onMouseLeave={() => setOpenMenu(false)}>
                  <NavLink to="/account" onClick={() => setOpenMenu(false)}>Manage Account</NavLink>
                  <NavLink to="/consent" onClick={() => setOpenMenu(false)}>Consent</NavLink>
                  <NavLink to="/reminders" onClick={() => setOpenMenu(false)}>Notifications</NavLink>
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
    </div>
  )
}
