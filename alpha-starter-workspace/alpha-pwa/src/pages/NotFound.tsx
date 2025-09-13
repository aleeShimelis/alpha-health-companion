import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound(){
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 520 }}>
        <h2>Page not found</h2>
        <p>The page you are looking for does not exist.</p>
        <Link className="btn btn-primary" to="/dashboard">Go to Dashboard</Link>
      </div>
    </div>
  )
}

