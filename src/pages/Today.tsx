import { Fragment, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  useActiveSession,
  useSettings,
  useWeekStatus,
  useExerciseStates,
  useZones,
} from '../hooks/useAppData'
import { formatHrRange, formatPaceRange, zoneByKey, type Zones } from '../domain/zones'
import { getWorkout, resolveBlocks } from '../domain/workouts'
import { getRun } from '../domain/runs'
import { startStrengthSession } from '../db/repo'
import { hasOwnPerformanceData } from '../db/db'
import { adjustSets, adjustTarget, DELOAD_EXPLANATION } from '../domain/plan'
import { targetFor } from '../domain/progression'
import { getExercise } from '../domain/exercises'
import { formatDateLong, todayISO } from '../lib/date'
import { IconRun, IconStrength, IconFlame } from '../components/icons'
import { unlockAudio } from '../lib/feedback'

export default function Today() {
  const navigate = useNavigate()
  const settings = useSettings()
  const zones = useZones(settings)
  const active = useActiveSession()
  const states = useExerciseStates()
  const { plan, strengthDone, runsDone, strengthOpen, runsOpen } = useWeekStatus(settings)

  const nextWorkoutKey = strengthOpen[0]
  const nextRunKey = runsOpen[0]
  const weekComplete = strengthOpen.length === 0 && runsOpen.length === 0

  async function beginStrength(key: string, isShort = false) {
    unlockAudio() // Audio-Freigabe an diese Nutzeraktion koppeln
    const id = await startStrengthSession(key, plan.isDeload, isShort)
    navigate(`/kraft/${id}`)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Heute</h1>
          <p className="page-subtitle">{formatDateLong(todayISO())}</p>
        </div>
        <span className={`badge ${plan.isDeload ? 'badge-warn' : ''}`}>
          Block {plan.blockNumber} · Woche {plan.blockWeek}/4
        </span>
      </div>

      {active && (
        <Link to={`/kraft/${active.id}`} className="card card-accent card-button" style={{ marginBottom: 12 }}>
          <div className="row-between">
            <div>
              <div className="badge badge-accent" style={{ marginBottom: 8 }}>
                Läuft gerade
              </div>
              <h3>{active.name}</h3>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {active.sets.filter((s) => s.done).length} von {active.sets.length} Sätzen erledigt
              </p>
            </div>
            <span className="btn btn-primary btn-sm">Weiter</span>
          </div>
        </Link>
      )}

      {/* Ohne eigene Leistungsdaten rechnet die App mit Platzhaltern — dann sind
          sämtliche Puls- und Tempovorgaben Fantasiewerte. Das muss auffallen. */}
      {!hasOwnPerformanceData(settings) && (
        <Link to="/einstellungen" className="card card-warn card-button" style={{ marginBottom: 12 }}>
          <div className="row-between">
            <div style={{ minWidth: 0 }}>
              <strong className="small">Leistungsdaten fehlen noch</strong>
              <p className="tiny muted" style={{ margin: '4px 0 0' }}>
                Puls- und Tempovorgaben laufen gerade auf Platzhaltern. Trag unter „Mehr" deine
                HFmax, den Ruhepuls und dein letztes Testergebnis ein — dauert eine Minute und
                macht aus dem Plan erst deinen.
              </p>
            </div>
            <span className="dim">›</span>
          </div>
        </Link>
      )}

      {plan.isDeload && (
        <div className="card card-warn" style={{ marginBottom: 12 }}>
          <div className="row" style={{ gap: 8, marginBottom: 6 }}>
            <IconFlame size={18} />
            <strong>Entlastungswoche</strong>
          </div>
          <p className="small muted" style={{ margin: 0 }}>
            {DELOAD_EXPLANATION}
          </p>
        </div>
      )}

      <div className="card" style={{ marginBottom: 4 }}>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <strong>Diese Woche</strong>
          <span className="tiny dim">Trainingswoche {plan.weekNumber}</span>
        </div>

        <WeekRow
          label="Krafttraining"
          done={strengthDone.length}
          total={plan.workoutKeys.length}
          variant="strength"
        />
        <div style={{ height: 10 }} />
        <WeekRow label="Laufen" done={runsDone.length} total={plan.runKeys.length} variant="run" />

        {weekComplete && (
          <p className="small" style={{ margin: '14px 0 0', color: 'var(--accent)' }}>
            Woche komplett. Alles darüber hinaus ist Zugabe — hör auf deinen Körper.
          </p>
        )}
      </div>

      {/* Interferenzeffekt: Ausdauer- und Krafttraining behindern sich, je näher sie
          zeitlich beieinanderliegen (Wilson et al., J Strength Cond Res 2012). Bei zwei
          plus zwei Einheiten pro Woche ist das beherrschbar — aber nur, wenn man es weiß. */}
      {nextWorkoutKey && nextRunKey && (
        <p className="tiny dim" style={{ margin: '10px 2px 0' }}>
          Kraft und Lauf möglichst auf verschiedene Tage legen. Geht es nur an einem: mindestens
          6 Stunden Abstand, und der Lauf zuerst — er ist für dich das Wichtigere.
        </p>
      )}

      {!active && nextWorkoutKey && (
        <>
          <h2 className="section-title">Als Nächstes: Kraft</h2>
          <StrengthPreview
            workoutKey={nextWorkoutKey}
            isDeload={plan.isDeload}
            states={states}
            disabled={settings.disabledExercises}
            preferences={settings.exercisePreferences}
            onStart={(isShort) => void beginStrength(nextWorkoutKey, isShort)}
          />
        </>
      )}

      {nextRunKey && (
        <>
          <h2 className="section-title">Als Nächstes: Laufen</h2>
          <RunPreview
            runKey={nextRunKey}
            isPriority={nextRunKey === plan.runKeys[0] && plan.runKeys.length > 1}
            zones={zones}
          />
        </>
      )}

      {(strengthOpen.length > 1 || runsOpen.length > 1) && (
        <>
          <h2 className="section-title">Später in der Woche</h2>
          <div className="stack">
            {strengthOpen.slice(1).map((key) => (
              <button
                key={`s-${key}`}
                className="card card-tight card-button"
                onClick={() => void beginStrength(key)}
              >
                <div className="row-between">
                  <span className="row">
                    <IconStrength size={18} className="muted" />
                    <span>{getWorkout(key).name}</span>
                  </span>
                  <span className="list-chevron">›</span>
                </div>
              </button>
            ))}
            {runsOpen.slice(1).map((key) => (
              <Link key={`r-${key}`} to={`/lauf/${key}`} className="card card-tight card-button">
                <div className="row-between">
                  <span className="row">
                    <IconRun size={18} className="muted" />
                    <span>{getRun(key).name}</span>
                  </span>
                  <span className="list-chevron">›</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Wochenpensum erfüllt heißt nicht gesperrt — wer mehr will, kommt hier dran. */}
      {(strengthOpen.length === 0 || runsOpen.length === 0) && !active && (
        <>
          <h2 className="section-title">Trotzdem Lust?</h2>
          <div className="stack">
            {strengthOpen.length === 0 && (
              <button
                className="card card-tight card-button"
                onClick={() => void beginStrength(plan.workoutKeys[0])}
              >
                <div className="row-between">
                  <span className="row">
                    <IconStrength size={18} className="muted" />
                    <span>Extra-Krafteinheit</span>
                  </span>
                  <span className="list-chevron">›</span>
                </div>
              </button>
            )}
            {runsOpen.length === 0 && (
              <Link to="/lauf/dauerlauf" className="card card-tight card-button">
                <div className="row-between">
                  <span className="row">
                    <IconRun size={18} className="muted" />
                    <span>Extra-Lauf: Ruhiger Dauerlauf</span>
                  </span>
                  <span className="list-chevron">›</span>
                </div>
              </Link>
            )}
          </div>
          {weekComplete && (
            <p className="tiny dim" style={{ marginTop: 10 }}>
              Pflicht ist das nicht — zwei harte Einheiten mehr bringen weniger als eine gute Nacht
              Schlaf vor dem nächsten Spiel.
            </p>
          )}
        </>
      )}

      <h2 className="section-title">Spielleitung</h2>
      <Link to="/spiel/neu" className="card card-tight card-match card-button">
        <div className="row-between">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 620 }}>Spiel nachbereiten</div>
            <div className="tiny dim">Positionierung und Disziplinkontrolle bewerten</div>
          </div>
          <span className="list-chevron">›</span>
        </div>
      </Link>
    </div>
  )
}

function WeekRow({
  label,
  done,
  total,
  variant,
}: {
  label: string
  done: number
  total: number
  variant: 'strength' | 'run'
}) {
  const dotClass = variant === 'strength' ? 'dot-done-strength' : 'dot-done-run'
  return (
    <div className="row-between">
      <span className="small">{label}</span>
      <div className="row" style={{ gap: 10 }}>
        <div className="week-dots">
          {Array.from({ length: Math.max(total, done) }, (_, i) => (
            <span key={i} className={`dot ${i < done ? dotClass : ''}`} />
          ))}
        </div>
        <span className="tiny dim nowrap">
          {done}/{total}
        </span>
      </div>
    </div>
  )
}

function StrengthPreview({
  workoutKey,
  isDeload,
  states,
  disabled,
  preferences,
  onStart,
}: {
  workoutKey: string
  isDeload: boolean
  states: ReturnType<typeof useExerciseStates>
  disabled: string[]
  preferences: Record<string, string>
  onStart: (isShort: boolean) => void
}) {
  const [short, setShort] = useState(false)
  const workout = getWorkout(workoutKey)
  const blocks = resolveBlocks(workout, disabled, short, preferences)
  const totalSets = blocks.reduce((n, b) => n + adjustSets(b.sets, isDeload), 0)
  const minutes = short ? workout.shortApproxMinutes : workout.approxMinutes
  const dropped = workout.blocks.length - blocks.length

  return (
    <div className="card card-accent">
      <span className="hero-label">Krafttraining</span>
      <h3 className="hero-title">{workout.name.replace(/^Workout [AB] — /, '')}</h3>

      <div className="hero-meta">
        <span>
          <strong>{minutes}</strong> <span className="dim">Min</span>
        </span>
        <span>
          <strong>{blocks.length}</strong> <span className="dim">Übungen</span>
        </span>
        <span>
          <strong>{totalSets}</strong> <span className="dim">Sätze</span>
        </span>
      </div>

      <div className="chip-row" style={{ marginTop: 14 }}>
        <button className="chip" data-active={!short} onClick={() => setShort(false)}>
          Voll · {workout.approxMinutes} Min
        </button>
        <button className="chip" data-active={short} onClick={() => setShort(true)}>
          Kurz · {workout.shortApproxMinutes} Min
        </button>
      </div>

      <div className="preview-grid">
        {blocks.map((block) => {
          const ex = getExercise(block.exerciseKey)
          const target = adjustTarget(targetFor(block.exerciseKey, states), isDeload, ex.unit)
          const sets = adjustSets(block.sets, isDeload)
          return (
            <Fragment key={block.exerciseKey}>
              <span className="name">{ex.name}</span>
              <span className="val">
                {sets} × {target}
                {ex.unit === 'seconds' ? 's' : ''}
              </span>
            </Fragment>
          )
        })}
      </div>

      {short && dropped > 0 && (
        <p className="tiny dim" style={{ margin: '-6px 0 14px' }}>
          {dropped} Übungen entfallen in der Kurzform.
        </p>
      )}

      <button className="btn btn-primary btn-block btn-lg" onClick={() => onStart(short)}>
        {short ? 'Kurzform starten' : 'Training starten'}
      </button>
    </div>
  )
}

function RunPreview({
  runKey,
  isPriority,
  zones,
}: {
  runKey: string
  isPriority: boolean
  zones: Zones
}) {
  const run = getRun(runKey)
  const target = run.full.mainZone
    ? zoneByKey(zones, run.full.mainZone)
    : { hr: undefined, pace: undefined }

  return (
    <Link to={`/lauf/${runKey}`} className="card card-run card-button">
      <span className="hero-label" data-tone="run">
        Laufeinheit
      </span>
      <h3 className="hero-title">{run.name}</h3>

      <div className="hero-meta">
        <span>
          <strong>{run.full.approxMinutes}</strong> <span className="dim">Min</span>
          <span className="dim"> · kurz {run.short.approxMinutes}</span>
        </span>
        {target.hr && (
          <span className="num" style={{ color: 'var(--run)' }}>
            {formatHrRange(target.hr)}
          </span>
        )}
        {target.pace && <span className="num muted">{formatPaceRange(target.pace)}</span>}
      </div>

      {isPriority && (
        <p className="tiny" style={{ margin: '12px 0 0', color: 'var(--run)' }}>
          Wenn diese Woche nur ein Lauf klappt, dann dieser.
        </p>
      )}

      <span className="btn btn-run btn-block" style={{ marginTop: 16 }}>
        Einheit ansehen
      </span>
    </Link>
  )
}
