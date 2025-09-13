import React, { useEffect, useState } from 'react'

export default function RefreshBanner(){
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    function onRefreshed(){
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(t)
    }
    const handler = () => { onRefreshed() }
    window.addEventListener('alpha:token-refreshed', handler as any)
    return () => window.removeEventListener('alpha:token-refreshed', handler as any)
  }, [])
  if (!visible) return null
  return (
    <div style={{ position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', background: '#e8f5e9', border: '1px solid #c8e6c9', color: '#2e7d32', padding: '6px 10px', borderRadius: 6, zIndex: 9999 }}>
      Session refreshed
    </div>
  )
}

