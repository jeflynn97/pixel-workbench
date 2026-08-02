import React, { useEffect, useState } from 'react'

export function Card({ children, className = '', ...rest }) {
  return (
    <div
      className={`pixel-corners bg-white border-2 border-ink shadow-pixel p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

const VARIANTS = {
  primary: 'bg-pink border-ink text-ink hover:bg-pink-dark',
  secondary: 'bg-cream-light border-ink text-ink hover:bg-stone2',
  mint: 'bg-mint border-ink text-ink hover:bg-mint-dark',
  butter: 'bg-butter border-ink text-ink hover:brightness-95',
  danger: 'bg-cream-light border-ink text-pink-dark hover:bg-pink-light',
  ghost: 'bg-transparent border-transparent shadow-none text-stone2-darker',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  size = 'md',
  ...rest
}) {
  const sizeCls = size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
  const shadowCls = variant === 'ghost' ? '' : 'shadow-pixel-sm pixel-press'
  return (
    <button
      type="button"
      className={`pixel-corners-sm border-2 font-display transition-colors active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed ${VARIANTS[variant]} ${sizeCls} ${shadowCls} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconButton({ icon: Icon, className = '', variant = 'secondary', ...rest }) {
  return (
    <Button variant={variant} className={`!p-2 ${className}`} {...rest}>
      <Icon size={18} strokeWidth={2.2} />
    </Button>
  )
}

export function Input({ label, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-xs text-stone2-darker mb-1 font-display">{label}</span>}
      <input
        className={`w-full pixel-corners-sm border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:bg-cream-light ${className}`}
        {...rest}
      />
    </label>
  )
}

export function Textarea({ label, className = '', ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-xs text-stone2-darker mb-1 font-display">{label}</span>}
      <textarea
        className={`w-full pixel-corners-sm border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:bg-cream-light ${className}`}
        {...rest}
      />
    </label>
  )
}

export function Select({ label, className = '', children, ...rest }) {
  return (
    <label className="block">
      {label && <span className="block text-xs text-stone2-darker mb-1 font-display">{label}</span>}
      <select
        className={`w-full pixel-corners-sm border-2 border-ink bg-white px-3 py-2 text-sm outline-none focus:bg-cream-light ${className}`}
        {...rest}
      >
        {children}
      </select>
    </label>
  )
}

export function Tag({ children, active = false, onClick, color = 'pink' }) {
  const colorCls =
    color === 'mint'
      ? active
        ? 'bg-mint'
        : 'bg-white'
      : color === 'butter'
      ? active
        ? 'bg-butter'
        : 'bg-white'
      : active
      ? 'bg-pink'
      : 'bg-white'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pixel-corners-sm border-2 border-ink px-3 py-1 text-xs font-display whitespace-nowrap ${colorCls} ${
        onClick ? 'active:translate-x-[1px] active:translate-y-[1px]' : ''
      }`}
    >
      {children}
    </button>
  )
}

export function SectionTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-lg text-ink">{children}</h2>
      {right}
    </div>
  )
}

export function EmptyState({ emoji = '🍙', text = '还没有数据，点击上方添加吧' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-stone2-darker">
      <div className="text-4xl mb-2">{emoji}</div>
      <p className="text-sm font-display">{text}</p>
    </div>
  )
}

export function SegmentedTabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`pixel-corners-sm border-2 border-ink px-3 py-1.5 text-sm font-display whitespace-nowrap shrink-0 ${
            value === t.value ? 'bg-pink shadow-pixel-sm' : 'bg-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-cream-light border-2 border-ink pixel-corners shadow-pixel-lg p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg">{title}</h3>
          <button onClick={onClose} className="text-stone2-darker text-xl leading-none px-2">
            ×
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-4 flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title = '确认删除？', desc, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>取消</Button>
          <Button variant="danger" onClick={onConfirm}>确认删除</Button>
        </>
      }
    >
      {desc && <p className="text-sm text-stone2-darker">{desc}</p>}
    </Modal>
  )
}

export function FAB({ onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 sm:bottom-8 z-40 flex items-center gap-2 bg-pink border-2 border-ink pixel-corners px-4 py-3 shadow-pixel-lg active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-display"
    >
      <Icon size={20} strokeWidth={2.4} />
      {label && <span>{label}</span>}
    </button>
  )
}

export function useToast() {
  const [msg, setMsg] = useState(null)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 2200)
    return () => clearTimeout(t)
  }, [msg])
  const Toast = msg ? (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-ink text-cream-light pixel-corners-sm px-4 py-2 text-sm font-display shadow-pixel-lg">
      {msg}
    </div>
  ) : null
  return { showToast: setMsg, Toast }
}
