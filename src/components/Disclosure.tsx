import { useState, type ReactNode } from 'react'
import { IconChevronDown } from './icons'

/**
 * Aufklappbarer Erklärtext.
 *
 * Die fachlichen Begründungen sollen in der App bleiben — sie sind der Grund,
 * warum der Plan aussieht, wie er aussieht. Dauerhaft im Sichtfeld machen sie
 * aber jede Seite zur Textwand. Deshalb standardmäßig zu: Wer wissen will, warum
 * eine Übung drinsteht, tippt einmal; wer trainieren will, scrollt daran vorbei.
 */
export function Disclosure({
  label = 'Warum?',
  children,
  defaultOpen = false,
}: {
  label?: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="disclosure">
      <button
        className="disclosure-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconChevronDown size={14} />
        {label}
      </button>
      {open && <div className="disclosure-body">{children}</div>}
    </div>
  )
}
