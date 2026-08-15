import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { updateSettings } from '../db/db'
import { useSettings } from '../hooks/useAppData'
import { checkBalance, isLastOfRequiredPattern, scheduledExerciseKeys } from '../domain/balance'
import { REQUIREMENT_LABEL } from '../domain/patterns'
import type { Exercise } from '../domain/types'

/**
 * Übungsauswahl, gruppiert nach Bewegungsmustern.
 *
 * Die Gruppierung ist der eigentliche Zweck der Seite: Man sieht auf einen Blick,
 * welche Alternativen es zu einer Übung gibt, die man nicht mag — und dass sich der
 * Plan nur dann verschlechtert, wenn ein ganzes Muster wegfällt, nicht wenn eine
 * einzelne Übung getauscht wird.
 *
 * Die letzte Übung eines Pflichtmusters lässt sich nicht abwählen. Lieber eine
 * gesperrte Schaltfläche als ein Plan, der stillschweigend eine Körperregion auslässt.
 */
export default function ExercisePicker() {
  const settings = useSettings()
  const disabled = settings.disabledExercises

  const report = useMemo(() => checkBalance(disabled), [disabled])
  const scheduled = useMemo(() => scheduledExerciseKeys(disabled), [disabled])

  async function toggle(key: string, isOff: boolean) {
    const next = isOff ? disabled.filter((k) => k !== key) : [...disabled, key]
    await updateSettings({ disabledExercises: next })
  }

  async function resetAll() {
    await updateSettings({ disabledExercises: [] })
  }

  const activeCount = report.patterns.reduce((n, p) => n + p.active.length, 0)
  const totalCount = report.patterns.reduce((n, p) => n + p.all.length, 0)

  return (
    <div className="page">
      <Link to="/uebungen" className="back-link">
        ← Übungen
      </Link>
      <h1 className="page-title">Übungen auswählen</h1>
      <p className="page-subtitle">
        {activeCount} von {totalCount} Übungen aktiv. Wählst du eine ab, rückt automatisch eine
        andere aus demselben Bewegungsmuster nach.
      </p>

      <div className={`card ${report.ok ? 'card-accent' : 'card-warn'}`}>
        <div className="row-between" style={{ marginBottom: 10 }}>
          <strong className="small">{report.ok ? 'Training ist vollständig' : 'Lücke im Plan'}</strong>
          <span className={`badge ${report.ok ? 'badge-accent' : 'badge-warn'}`}>
            {report.totalSets} Sätze / Woche
          </span>
        </div>

        <div className="row-between small" style={{ marginBottom: 4 }}>
          <span className="muted">Drücken</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{report.pushSets} Sätze</span>
        </div>
        <div className="row-between small">
          <span className="muted">Ziehen</span>
          <span
            style={{
              fontVariantNumeric: 'tabular-nums',
              color: report.pullSets >= report.pushSets ? 'var(--accent)' : 'var(--warn)',
            }}
          >
            {report.pullSets} Sätze
          </span>
        </div>
        <p className="tiny dim" style={{ margin: '8px 0 0' }}>
          Beide Workouts sind so aufgebaut, dass mindestens so viele Zug- wie Drucksätze
          zusammenkommen — abwählen einzelner Übungen kann dieses Verhältnis nicht kippen, weil
          immer eine Übung desselben Musters nachrückt. Der Grund: Die Muskeln, die das
          Schulterblatt zurück und nach unten ziehen, arbeiten beim Drücken kaum mit.
        </p>
        <p className="tiny dim" style={{ margin: '6px 0 0' }}>
          Zur Einordnung: Das ist ein Grundsatz aus der Trainingslehre. Die verbreitete Behauptung,
          Drücken allein verursache einen Rundrücken, ist dagegen nicht belegt — Übersichtsarbeiten
          finden zwischen Haltung und Beschwerden nur schwache Zusammenhänge.
        </p>
      </div>

      {report.problems.length > 0 && (
        <div className="stack" style={{ marginTop: 12 }}>
          {report.problems.map((p, i) => (
            <div key={i} className={`card card-tight ${p.severity === 'fehler' ? 'card-warn' : ''}`}>
              <div className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                <span
                  className="badge"
                  style={
                    p.severity === 'fehler'
                      ? { color: 'var(--danger)', borderColor: 'rgba(248,113,113,.4)' }
                      : undefined
                  }
                >
                  {p.severity === 'fehler' ? 'Fehlt' : 'Hinweis'}
                </span>
                <span className="small muted" style={{ flex: 1 }}>
                  {p.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {report.patterns.map((status) => (
        <div key={status.pattern.key}>
          <h2 className="section-title">{status.pattern.name}</h2>

          <div className="card card-tight" style={{ marginBottom: 8 }}>
            <div className="row-between" style={{ marginBottom: 6 }}>
              <span className="tiny dim">{status.pattern.covers}</span>
              <span
                className={`badge ${
                  status.pattern.requirement === 'pflicht'
                    ? 'badge-accent'
                    : status.pattern.requirement === 'empfohlen'
                      ? ''
                      : 'badge'
                }`}
              >
                {REQUIREMENT_LABEL[status.pattern.requirement]}
              </span>
            </div>
            <p className="tiny muted" style={{ margin: 0 }}>
              {status.pattern.why}
            </p>
            <p className="tiny dim" style={{ margin: '6px 0 0' }}>
              {status.weeklySets > 0
                ? `${status.weeklySets} Sätze pro Woche im Plan`
                : 'Kommt aktuell in keinem Workout vor'}
            </p>
          </div>

          <div className="stack" style={{ gap: 8 }}>
            {status.all.map((ex) => (
              <ExerciseRow
                key={ex.key}
                exercise={ex}
                off={disabled.includes(ex.key)}
                inPlan={scheduled.has(ex.key)}
                locked={isLastOfRequiredPattern(ex.key, disabled)}
                onToggle={() => void toggle(ex.key, disabled.includes(ex.key))}
              />
            ))}
          </div>
        </div>
      ))}

      <button className="btn btn-ghost btn-block" style={{ marginTop: 26 }} onClick={() => void resetAll()}>
        Alle Übungen wieder aktivieren
      </button>
    </div>
  )
}

function ExerciseRow({
  exercise,
  off,
  inPlan,
  locked,
  onToggle,
}: {
  exercise: Exercise
  off: boolean
  inPlan: boolean
  locked: boolean
  onToggle: () => void
}) {
  return (
    <div className="card card-tight" style={off ? { opacity: 0.55 } : undefined}>
      <div className="row-between" style={{ gap: 12 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 620 }}>{exercise.name}</span>
            {inPlan && !off && <span className="badge badge-accent">im Plan</span>}
          </div>
          <Link to={`/uebungen/${exercise.key}`} className="tiny" style={{ display: 'inline-block', marginTop: 2 }}>
            Ausführung ansehen →
          </Link>
          {locked && !off && (
            <div className="tiny dim" style={{ marginTop: 4 }}>
              Letzte Übung dieses Pflichtmusters — nicht abwählbar
            </div>
          )}
        </div>
        <button
          className="switch"
          data-on={!off}
          role="switch"
          aria-checked={!off}
          aria-label={`${exercise.name} ${off ? 'aktivieren' : 'abwählen'}`}
          disabled={locked && !off}
          style={locked && !off ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          onClick={onToggle}
        />
      </div>
    </div>
  )
}
