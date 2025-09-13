import React, { useState, KeyboardEvent } from 'react'

type Props = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

export default function ChipsInput({ value, onChange, placeholder }: Props){
  const [input, setInput] = useState('')

  function addChip(text: string){
    const t = text.trim()
    if (!t) return
    if (value.includes(t)) return
    onChange([...value, t])
    setInput('')
  }
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>){
    if (e.key === 'Enter' || e.key === ','){
      e.preventDefault()
      addChip(input)
    } else if (e.key === 'Backspace' && input === '' && value.length){
      onChange(value.slice(0, -1))
    }
  }
  return (
    <div className="chips">
      {value.map((v, i) => (
        <span key={i} className="chip">
          {v}
          <button className="chip-x" onClick={() => onChange(value.filter((_, idx) => idx !== i))} aria-label={`Remove ${v}`}>×</button>
        </span>
      ))}
      <input
        className="input"
        value={input}
        onChange={e=>setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        style={{ minWidth: 140, flex: 1 }}
      />
    </div>
  )
}

