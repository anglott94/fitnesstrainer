import type { RestTimer } from '../hooks/useRestTimer'
import { formatDuration } from '../lib/date'

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Der Pausentimer legt sich über den unteren Bildschirmrand, statt den
 * Trainingsbildschirm zu ersetzen — so bleibt sichtbar, welcher Satz als
 * nächstes dran ist, während die Pause läuft.
 */
export function RestTimerBar({ timer }: { timer: RestTimer }) {
  if (!timer.active) return null

  const progress = timer.total > 0 ? Math.min(1, timer.remaining / timer.total) : 0
  const isFinal = timer.remaining <= 3 && !timer.paused
  const color = isFinal ? 'var(--warn)' : 'var(--accent)'

  return (
    <div className="rest-overlay" role="timer" aria-live="off">
      <div className="rest-inner">
        <div className="rest-ring">
          <svg width={104} height={104} viewBox="0 0 104 104">
            <circle cx="52" cy="52" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={7} />
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
  )
}
