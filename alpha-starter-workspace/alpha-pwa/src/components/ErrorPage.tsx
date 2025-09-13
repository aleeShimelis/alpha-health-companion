import React from 'react'
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'

export default function ErrorPage(){
  const err = useRouteError() as any
  let title = 'Something went wrong'
  let detail = ''
  if (isRouteErrorResponse(err)) {
    title = `Error ${err.status}`
    detail = err.statusText || ''
  } else if (err instanceof Error) {
    detail = err.message
  }
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 640 }}>
        <h2>{title}</h2>
        {detail && <div className="badge danger" style={{ marginBottom: 8 }}>{detail}</div>}
        <Link className="btn btn-primary" to="/dashboard">Back to Dashboard</Link>
      </div>
    </div>
  )
}

