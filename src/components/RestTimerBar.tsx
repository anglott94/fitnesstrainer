import { useEffect, useRef, useState } from 'react'
import type { RestTimer } from '../hooks/useRestTimer'
import { formatDuration } from '../lib/date'

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Was ein Screenreader von der Pause mitbekommen soll: den Anfang und das Ende.
 *
 * Der Countdown selbst bleibt stumm (`aria-live="off"` am Timer) — jede Sekunde
 * vorgelesen zu bekommen wäre unbrauchbar. Ohne diese zwei Ansagen wäre das
 * Pausenende aber nur ein Ton, den man mit stummem Handy nie mitbekommt.
 *
 * Das Ende wird am Übergang aktiv -> inaktiv erkannt. Wer selbst auf „Fertig"
 * tippt, hat die Pause abgekürzt und braucht keine Ansage — deshalb zählt nur,
 * ob der Countdown tatsächlich abgelaufen war.
 */
function useRestAnnouncement(timer: RestTimer): string {
  const [message, setMessage] = useState('')
  const wasActive = useRef(false)
  const lastRemaining = useRef(0)

  const { active, total, remaining } = timer

  useEffect(() => {
    if (active) {
      if (!wasActive.current) setMessage(`Satzpause, ${total} Sekunden.`)
      lastRemaining.current = remaining
    } else if (wasActive.current) {
      setMessage(lastRemaining.current <= 1 ? 'Pause zu Ende.' : '')
    }
    wasActive.current = active
  }, [active, total, remaining])

  return message
}

/**
 * Der Pausentimer legt sich über den unteren Bildschirmrand, statt den
 * Trainingsbildschirm zu ersetzen — so bleibt sichtbar, welcher Satz als
 * nächstes dran ist, während die Pause läuft.
 */
export function RestTimerBar({ timer }: { timer: RestTimer }) {
  // Muss außerhalb des Overlays stehen: Läuft die Pause ab, verschwindet das
  // Overlay — und mit ihm die Ansage, bevor sie gelesen werden konnte.
  const announcement = useRestAnnouncement(timer)

  const progress = timer.total > 0 ? Math.min(1, timer.remaining / timer.total) : 0
  const isFinal = timer.remaining <= 3 && !timer.paused
  const color = isFinal ? 'var(--warn)' : 'var(--accent)'

  return (
    <>
      <span className="sr-only" role="status" aria-live="assertive">
        {announcement}
      </span>

      {timer.active && (
        <div className="rest-overlay" role="timer" aria-live="off">
          <div className="rest-inner">
            <div className="rest-ring">
              <svg width={104} height={104} viewBox="0 0 104 104">
                <circle
                  cx="52"
                  cy="52"
                  r={RADIUS}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={7}
                />
                <circle
                  cx="52"
                  cy="52"
                  r={RADIUS}
                  fill="none"
                  stroke={color}
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.2s ease' }}
                />
              </svg>
              <div className="rest-ring-label" style={{ color }}>
                {formatDuration(timer.remaining)}
              </div>
            </div>

            <div className="rest-controls">
              <div className="row-between">
                <strong>{timer.paused ? 'Pause angehalten' : 'Satzpause'}</strong>
                {timer.label && <span className="tiny dim nowrap">{timer.label}</span>}
              </div>
              <div className="tiny muted" style={{ marginTop: 2 }}>
                {timer.paused
                  ? 'Läuft weiter, sobald du fortsetzt.'
                  : 'Kurz durchatmen — der nächste Satz kommt gleich.'}
              </div>

              <div className="rest-buttons">
                <button className="btn btn-ghost" onClick={() => timer.addSeconds(-15)}>
                  −15s
                </button>
                <button className="btn btn-ghost" onClick={() => timer.addSeconds(15)}>
                  +15s
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => (timer.paused ? timer.resume() : timer.pause())}
                >
                  {timer.paused ? 'Weiter' : 'Stopp'}
                </button>
                <button className="btn btn-primary" onClick={timer.stop}>
                  Fertig
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
