import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Footer(){
  const year = new Date().getFullYear()
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <div className="footer-col">
          <div className="brand" style={{ alignItems:'center' }}>
            <div className="brand-badge" /> <strong>ALPHA</strong>
          </div>
          <small>
            ALPHA is an informational, non‑diagnostic companion. It does not provide medical advice.
            For concerns, consult a qualified professional.
          </small>
        </div>
        <div className="footer-col">
          <strong>Quick links</strong>
          <nav className="footer-links">
            <NavLink to="/reports">Reports</NavLink>
            <NavLink to="/reminders">Reminders</NavLink>
            <NavLink to="/consent">Consent</NavLink>
            <NavLink to="/account">Manage Account</NavLink>
          </nav>
        </div>
        <div className="footer-col">
          <strong>Legal & info</strong>
          <nav className="footer-links">
            <a href="#" aria-disabled>Privacy Policy</a>
            <a href="#" aria-disabled>Terms of Service</a>
            <a href="mailto:support@example.com">Contact support</a>
          </nav>
          <small>© {year} ALPHA · v0.1.0</small>
        </div>
      </div>
    </footer>
  )
}

