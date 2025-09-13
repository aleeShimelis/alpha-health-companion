import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { logout as apiLogout } from '../api/auth'

export default function AppShell({ children }: { children: React.ReactNode }){
  const { token, setToken } = useAuth()
  const nav = useNavigate()
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
          <nav className="nav">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/vitals">Vitals</NavLink>
            <NavLink to="/symptoms">Symptoms</NavLink>
            <NavLink to="/goals">Goals</NavLink>
            <NavLink to="/reports">Reports</NavLink>
            <NavLink to="/reminders">Reminders</NavLink>
            <NavLink to="/cycles">Cycles</NavLink>
            <NavLink to="/consent">Consent</NavLink>
            <button className="btn btn-secondary" onClick={onLogout} style={{ marginLeft: 8 }}>Logout</button>
          </nav>
        </div>
      </header>
      <main className="container">
        {children}
      </main>
    </div>
  )
}
