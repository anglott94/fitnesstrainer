import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { updateSettings } from '../db/db'
import { useSettings } from '../hooks/useAppData'
import { checkBalance, isLastOfRequiredPattern, scheduledExerciseKeys } from '../domain/balance'
import { REQUIREMENT_LABEL } from '../domain/patterns'
import { Disclosure } from '../components/Disclosure'
import type { Exercise } from '../domain/types'

/**
 * Übungsauswahl, gruppiert nach Bewegungsmustern.
 *
 * Die Gruppierung ist der eigentliche Zweck der Seite: Man sieht auf einen Blick,
 * welche Alternativen es zu einer Übung gibt — und dass sich der Plan nur dann
 * verschlechtert, wenn ein ganzes Muster wegfällt, nicht wenn eine einzelne
 * Übung getauscht wird.
 *
 * Darstellung bewusst als Liste mit Trennlinien statt als Kartenstapel: Bei 30
 * Übungen in 13 Gruppen wären das über 40 gerahmte Kacheln, und ein Rahmen um
 * jede Zeile strukturiert nichts mehr, er lärmt nur.
 */
export default function ExercisePicker() {
  const settings = useSettings()
  const disabled = settings.disabledExercises

  const preferences = settings.exercisePreferences

  const report = useMemo(() => checkBalance(disabled, preferences), [disabled, preferences])
  const scheduled = useMemo(
    () => scheduledExerciseKeys(disabled, preferences),
    [disabled, preferences],
  )

  async function toggle(key: string, isOff: boolean) {
    const next = isOff ? disabled.filter((k) => k !== key) : [...disabled, key]
    await updateSettings({ disabledExercises: next })
  }

  /** Diese Übung ab jetzt für ihr Muster im Plan verwenden. */
  async function choose(pattern: string, key: string) {
    await updateSettings({
      exercisePreferences: { ...preferences, [pattern]: key },
      // Eine Übung, die man ausdrücklich in den Plan holt, kann nicht abgewählt bleiben.
      disabledExercises: disabled.filter((k) => k !== key),
    })
  }

  const activeCount = report.patterns.reduce((n, p) => n + p.active.length, 0)
  const totalCount = report.patterns.reduce((n, p) => n + p.all.length, 0)
  const pullOk = report.pullSets >= report.pushSets

  return (
    <div className="page">
      <Link to="/uebungen" className="back-link">
        ← Übungen
      </Link>
      <h1 className="page-title">Übungen auswählen</h1>
      <p className="page-subtitle">
        {activeCount} von {totalCount} aktiv. Wählst du eine ab, rückt eine andere aus demselben
        Muster nach.
      </p>

      {/* Bilanz zuerst: Das ist die Antwort auf „ist mein Training noch vollständig". */}
      <div className={`card ${report.ok ? 'card-accent' : 'card-warn'}`}>
        <div className="row-between">
          <strong>{report.ok ? 'Training ist vollständig' : 'Lücke im Plan'}</strong>
          <span className={`badge ${report.ok ? 'badge-accent' : 'badge-warn'}`}>
            {report.totalSets} Sätze/Woche
          </span>
        </div>

        <div className="row" style={{ gap: 22, marginTop: 14 }}>
          <div>
            <div className="stat-value" style={{ fontSize: '1.45rem' }}>
              {report.pushSets}
            </div>
            <div className="stat-label">Drücken</div>
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '1.1rem', paddingTop: 6 }}>:</div>
          <div>
            <div
              className="stat-value"
              style={{ fontSize: '1.45rem', color: pullOk ? 'var(--accent)' : 'var(--warn)' }}
            >
              {report.pullSets}
            </div>
            <div className="stat-label">Ziehen</div>
          </div>
        </div>

        <Disclosure label="Warum das Verhältnis zählt">
          <p>
            Beide Workouts sind so gebaut, dass mindestens so viele Zug- wie Drucksätze
            zusammenkommen. Abwählen kann das nicht kippen, weil immer eine Übung desselben
            Musters nachrückt.
          </p>
          <p>
            Der Grund: Die Muskeln, die das Schulterblatt zurück und nach unten ziehen, arbeiten
            beim Drücken kaum mit. Das ist ein Grundsatz aus der Trainingslehre. Die verbreitete
            Behauptung, Drücken allein verursache einen Rundrücken, ist dagegen nicht belegt —
            Übersichtsarbeiten finden zwischen Haltung und Beschwerden nur schwache Zusammenhänge.
          </p>
        </Disclosure>
      </div>

      {report.problems.length > 0 && (
        <div className="stack" style={{ marginTop: 12 }}>
          {report.problems.map((p, i) => (
            <div key={i} className={`card card-tight ${p.severity === 'fehler' ? 'card-warn' : ''}`}>
              <div className="row" style={{ alignItems: 'flex-start', gap: 9 }}>
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
                <span className="tiny muted" style={{ flex: 1 }}>
                  {p.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {report.patterns.map((status) => (
        <div key={status.pattern.key}>
          <div className="group-head" data-tone={status.pattern.requirement}>
            <span className="group-name">{status.pattern.name}</span>
            <span className="group-meta">
              {REQUIREMENT_LABEL[status.pattern.requirement]}
              {status.weeklySets > 0 ? ` · ${status.weeklySets} Sätze` : ''}
            </span>
          </div>

          {/* Ohne diese Zeile war nicht erkennbar, dass sich die Übung im Plan
              überhaupt wechseln lässt — der Auswahlpunkt allein ist zu leise. */}
          <p className="tiny dim" style={{ margin: '0 0 9px 13px' }}>
            {status.pattern.covers}
          </p>
          {status.all.length > 1 && (
            <p className="tiny" style={{ margin: '0 0 9px 13px', color: 'var(--accent)' }}>
              Im Plan: {status.active.find((e) => scheduled.has(e.key))?.name ?? '—'} · zum
              Tauschen den Punkt der gewünschten Übung antippen
            </p>
          )}

          <div className="list">
            {status.all.map((ex) => (
              <ExerciseRow
                key={ex.key}
                exercise={ex}
                off={disabled.includes(ex.key)}
                inPlan={scheduled.has(ex.key)}
                locked={isLastOfRequiredPattern(ex.key, disabled)}
                onChoose={() => void choose(status.pattern.key, ex.key)}
                onToggle={() => void toggle(ex.key, disabled.includes(ex.key))}
              />
            ))}
          </div>

          <div style={{ paddingLeft: 13 }}>
            <Disclosure label="Wofür dieses Muster">
              <p>{status.pattern.why}</p>
            </Disclosure>
          </div>
        </div>
      ))}

      <button
        className="btn btn-ghost btn-block"
        style={{ marginTop: 30 }}
        onClick={() => void updateSettings({ disabledExercises: [] })}
      >
        Alle Übungen wieder aktivieren
      </button>
    </div>
  )
}

/**
 * Eine Zeile mit drei getrennten Zielen, weil es drei verschiedene Absichten gibt:
 * links den Punkt antippen heißt „diese Übung in den Plan", der Name führt zur
 * Ausführung, der Schalter rechts nimmt die Übung ganz aus dem Angebot.
 */
function ExerciseRow({
  exercise,
  off,
  inPlan,
  locked,
  onChoose,
  onToggle,
}: {
  exercise: Exercise
  off: boolean
  inPlan: boolean
  locked: boolean
  onChoose: () => void
  onToggle: () => void
}) {
  return (
    <div className="list-row" data-off={off}>
      <button
        className="pick"
        data-on={inPlan && !off}
        aria-label={inPlan ? `${exercise.name} ist im Plan` : `${exercise.name} in den Plan nehmen`}
        aria-pressed={inPlan && !off}
        onClick={onChoose}
      />

      <div style={{ minWidth: 0, flex: 1 }}>
        <Link to={`/uebungen/${exercise.key}`} className="list-title" style={{ color: 'inherit' }}>
          {exercise.name}
        </Link>
        <div className="list-sub">
          {off
            ? 'Abgewählt'
            : inPlan
              ? locked
                ? 'Im Plan · letzte Übung dieses Pflichtmusters'
                : 'Im Plan'
              : 'Ersatz — antippen, um zu tauschen'}
        </div>
      </div>

      <button
        className="switch"
        data-on={!off}
        role="switch"
        aria-checked={!off}
        aria-label={`${exercise.name} ${off ? 'aktivieren' : 'abwählen'}`}
        disabled={locked && !off}
        style={locked && !off ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
        onClick={onToggle}
      />
    </div>
  )
}
