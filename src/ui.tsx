import { createContext, useContext, useEffect, useId, useRef } from 'react'
import type { ButtonHTMLAttributes, Dispatch, ReactNode } from 'react'
import { ArrowRight, X } from 'lucide-react'
import type { Action, Session } from './domain/session'

export const GameContext = createContext<{
  state: Session
  dispatch: Dispatch<Action>
  notify: (message: string) => void
} | null>(null)
export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('Konteks game belum tersedia.')
  return context
}
export function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  )
}
export function Pill({ children, tone = '' }: { children: ReactNode; tone?: string }) {
  return <span className={`pill ${tone}`}>{children}</span>
}
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}
export function ScreenTitle({
  eyebrow,
  title,
  children,
  right,
}: {
  eyebrow: string
  title: string
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="screen-title screen-enter">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 tabIndex={-1}>{title}</h1>
        <p>{children}</p>
      </div>
      {right}
    </div>
  )
}
export function Field({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea
        aria-describedby={`${id}-help`}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={12000}
        disabled={disabled}
      />
      <p id={`${id}-help`} className="question-help">
        Jawab singkat dengan kata-katamu sendiri.
      </p>
    </div>
  )
}
export function NextButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button onClick={onClick} disabled={disabled}>
      {children}
      <ArrowRight size={17} />
    </Button>
  )
}
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null),
    id = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'Tab') {
        const items = [
          ...(ref.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input,textarea,select,a[href],[tabindex="0"]',
          ) ?? []),
        ]
        const first = items[0],
          last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = oldOverflow
      previous?.focus()
    }
  }, [])
  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className={`dialog ${wide ? 'wide' : ''}`}
      >
        <div className="dialog-heading">
          <h2 id={id}>{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Tutup panel">
            <X size={22} />
          </Button>
        </div>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  )
}
