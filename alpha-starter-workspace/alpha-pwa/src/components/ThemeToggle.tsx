import React, { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

export default function ThemeToggle(){
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') root.setAttribute('data-theme', 'light')
    else root.removeAttribute('data-theme')
    localStorage.setItem('theme', theme)
  }, [theme])

  const isLight = theme === 'light'
  return (
    <button
      className="icon-btn"
      aria-label="Toggle theme"
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
    >
      <span aria-hidden="true">{isLight ? '🌙' : '☀️'}</span>
    </button>
  )
}
