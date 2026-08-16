import { Link, useParams } from 'react-router-dom'
import { EXERCISE_BY_KEY, exercisesForPattern, getExercise } from '../domain/exercises'
import { getPattern } from '../domain/patterns'
import { defaultLevel, ladderFor } from '../domain/assistance'
import { setExerciseTarget } from '../db/repo'
import { IconMinus, IconPlus } from '../components/icons'
import { WORKOUTS } from '../domain/workouts'
import { useDoneStrengthSessions, useExerciseStates } from '../hooks/useAppData'
import { LineChart } from '../components/Chart'
import { bestSetSeries, personalBest } from '../lib/stats'

export default function ExerciseDetail() {
  const { key } = useParams<{ key: string }>()
  const states = useExerciseStates()
  const sessions = useDoneStrengthSessions()

  if (!key || !EXERCISE_BY_KEY[key]) {
    return (
      <div className="page">
        <h1 className="page-title">Nicht gefunden</h1>
        <Link to="/uebungen" className="btn btn-primary btn-block">
          Zur Übersicht
        </Link>
      </div>
    )
  }

  const ex = getExercise(key)
  const pattern = getPattern(ex.pattern)
  const alternatives = exercisesForPattern(ex.pattern).filter((e) => e.key !== ex.key)
  const state = states.find((s) => s.key === key)
  const target = state?.target ?? ex.startTarget
  const ladder = ladderFor(ex.assistLadder)
  const currentAssist = state?.assist ?? defaultLevel(ex.assistLadder)
  // Sekundenübungen in 5er-Schritten — bei einem Seitstütz ist eine Sekunde nichts.
  const step = ex.unit === 'seconds' ? 5 : 1
  const best = personalBest(sessions, key)
  const series = bestSetSeries(sessions, key)
  const unit = ex.unit === 'seconds' ? 's' : ''
  const blocks = WORKOUTS.flatMap((w) =>
    w.blocks.filter((b) => b.exerciseKey === key).map((b) => ({ workout: w.name, ...b })),
  )

  return (
    <div className="page">
      <Link to="/uebungen" className="back-link">
        ← Übungen
      </Link>

      <div className="page-header">
        <h1 className="page-title">{ex.name}</h1>
        <span className="badge">{pattern.name}</span>
      </div>
      <p className="page-subtitle">
        Aktuelle Vorgabe {target}
        {unit || ' Wiederholungen'}
        {ex.unilateral ? ' je Seite' : ''}
        {best > 0 ? ` · Bestwert ${best}${unit}` : ''}
      </p>

      <div className="card card-accent">
        <strong className="small">Wofür sie gut ist</strong>
        <p className="small muted" style={{ margin: '6px 0 0' }}>
          {ex.why}
        </p>
        <div className="divider" />
        <strong className="tiny dim">Bewegungsmuster: {pattern.name}</strong>
        <p className="tiny muted" style={{ margin: '4px 0 0' }}>
          {pattern.covers}. {pattern.why}
        </p>
      </div>

      {alternatives.length > 0 && (
        <>
          <h2 className="section-title">Gleichwertige Alternativen</h2>
          <p className="tiny dim" style={{ margin: '-4px 2px 10px' }}>
            Diese Übungen decken dasselbe Muster ab. Wählst du diese hier ab, rückt eine davon nach.
          </p>
          <div className="stack">
            {alternatives.map((alt) => (
              <Link key={alt.key} to={`/uebungen/${alt.key}`} className="card card-tight card-button">
                <div className="row-between">
                  <span className="small">{alt.name}</span>
                  <span className="dim">›</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Vorgabe anpassen</h2>
      <div className="card">
        <p className="tiny dim" style={{ marginTop: 0 }}>
          Normalerweise passt die App die Vorgabe nach jeder Einheit selbst an. Von Hand nachstellen
          lohnt sich, wenn sie keinen Anhaltspunkt hat: nach einem Wechsel auf diese Übung, nach
          einer längeren Pause, oder wenn der Startwert offensichtlich daneben liegt.
        </p>

        <div className="row-between" style={{ marginTop: 14 }}>
          <span className="field-label">
            Wiederholungen{ex.unit === 'seconds' ? ' (Sekunden)' : ''}
            {ex.unilateral ? ' je Seite' : ''}
          </span>
          <div className="rep-stepper">
            <button
              className="step-btn"
              aria-label="weniger"
              onClick={() => void setExerciseTarget(ex.key, { target: target - step })}
            >
              <IconMinus size={18} />
            </button>
            <span className="rep-value">
              {target}
              {ex.unit === 'seconds' ? 's' : ''}
            </span>
            <button
              className="step-btn"
              aria-label="mehr"
              onClick={() => void setExerciseTarget(ex.key, { target: target + step })}
            >
              <IconPlus size={18} />
            </button>
          </div>
        </div>

        {ladder && (
          <>
            <div className="divider" />
            <span className="field-label" style={{ display: 'block', marginBottom: 8 }}>
              Unterstützungsstufe
            </span>
            <div className="chip-row">
              {ladder.map((level) => (
                <button
                  key={level.key}
                  className="chip"
                  data-active={currentAssist === level.key}
                  style={
                    currentAssist === level.key
                      ? { borderColor: level.color, color: level.color, background: 'transparent' }
                      : undefined
                  }
                  onClick={() => void setExerciseTarget(ex.key, { assist: level.key })}
                >
                  {level.short}
                </button>
              ))}
            </div>
          </>
        )}

        {ex.maxTarget !== undefined && target >= ex.maxTarget && (
          <p className="tiny" style={{ margin: '12px 0 0', color: 'var(--warn)' }}>
            Obergrenze erreicht. Weiter geht es über die schwerere Variante: {ex.harder}
          </p>
        )}
      </div>

      {ladder && (
        <>
          <h2 className="section-title">Unterstützung</h2>
          <div className="card">
            <p className="small muted" style={{ marginTop: 0 }}>
              Die Wiederholungszahl allein sagt hier nichts — acht mit orangem Band und acht ohne
              sind verschiedene Leistungen. Deshalb hängt an jedem Satz die Stufe, und der Verlauf
              färbt die Punkte danach ein.
            </p>
            {ladder.map((level) => (
              <div
                key={level.key}
                className="row-between"
                style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}
              >
                <span className="row small" style={{ gap: 8 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: level.color,
                      display: 'inline-block',
                    }}
                  />
                  <span style={currentAssist === level.key ? { fontWeight: 700 } : undefined}>
                    {level.name}
                  </span>
                </span>
                <span className="tiny dim nowrap">
                  {currentAssist === level.key ? 'aktuell' : level.hint}
                </span>
              </div>
            ))}
            <p className="tiny dim" style={{ margin: '10px 0 0' }}>
              Ab {ex.assistStepUpAt} sauberen Wiederholungen auf allen Sätzen wechselt die App auf
              die nächste Stufe und setzt die Vorgabe auf {ex.assistResetTarget} zurück.
            </p>
            <p className="tiny muted" style={{ margin: '8px 0 0' }}>
              Ein Band zieht umso stärker, je weiter es gedehnt ist: unten im Hang maximale
              Unterstützung, oben an der Stange fast keine. Der obere Teil bleibt also nahezu
              unassistiert — dort wirst du zuerst scheitern, das ist normal. Wer gezielt daran
              arbeiten will, hängt am Ende zwei langsam abgelassene Klimmzüge ohne Band an.
            </p>
          </div>
        </>
      )}

      <h2 className="section-title">Ausgangsposition</h2>
      <div className="card">
        <p className="small" style={{ margin: 0 }}>
          {ex.setup}
        </p>
      </div>

      <h2 className="section-title">Worauf es ankommt</h2>
      <div className="card">
        <ul className="list-plain small" style={{ margin: 0 }}>
          {ex.cues.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      <h2 className="section-title">Anpassen</h2>
      <div className="stack">
        <div className="card card-tight">
          <strong className="small">Wenn es zu schwer ist</strong>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {ex.easier}
          </p>
        </div>
        <div className="card card-tight">
          <strong className="small">Wenn es zu leicht wird</strong>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {ex.harder}
          </p>
        </div>
      </div>

      {blocks.length > 0 && (
        <>
          <h2 className="section-title">Im Plan</h2>
          <div className="stack">
            {blocks.map((b) => (
              <div key={b.workout} className="card card-tight">
                <div className="row-between">
                  <span className="small">{b.workout}</span>
                  <span className="tiny dim nowrap">
                    {b.sets} Sätze · {b.restSec}s Pause
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Verlauf</h2>
      <div className="card">
        <LineChart data={series} unit={unit} emptyHint="Noch keine Sätze abgehakt." />
      </div>
    </div>
  )
}
