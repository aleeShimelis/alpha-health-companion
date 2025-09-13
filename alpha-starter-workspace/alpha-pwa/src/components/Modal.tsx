import React from 'react'

type Props = {
  open: boolean
  title?: string
  children?: React.ReactNode
  onClose: () => void
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
}

export default function Modal({ open, title, children, onClose, onConfirm, confirmText='Confirm', cancelText='Cancel' }: Props){
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {title && <h3 style={{ marginTop: 0 }}>{title}</h3>}
        <div style={{ marginTop: 8 }}>{children}</div>
        <div className="toolbar" style={{ marginTop: 16, justifyContent:'flex-end' }}>
          <button className="btn" onClick={onClose}>{cancelText}</button>
          {onConfirm && <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>}
        </div>
      </div>
    </div>
  )
}

