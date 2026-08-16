import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import {
  addExtraSet,
  deleteStrengthSession,
  finishStrengthSession,
  patchSet,
  removeLastSet,
  setAssistLevel,
} from '../db/repo'
import { ladderFor, levelFor } from '../domain/assistance'
import { getWorkout, SHORT_NOTE } from '../domain/workouts'
import { getExercise } from '../domain/exercises'
import type { ProgressionChange } from '../domain/progression'
import { sessionVolume } from '../domain/progression'
import type { SetLog, StrengthSession } from '../domain/types'
import { useSettings } from '../hooks/useAppData'
import { useRestTimer } from '../hooks/useRestTimer'
import { useWakeLock } from '../hooks/useWakeLock'
import { RestTimerBar } from '../components/RestTimerBar'
import { IconCheck, IconChevronDown, IconMinus, IconPlus } from '../components/icons'
import { formatDuration } from '../lib/date'
import { playSetDone, unlockAudio, vibrate } from '../lib/feedback'

interface Group {
  exerciseKey: string
  sets: SetLog[]
  restSec: number
  note?: string
}

export default function StrengthSessionPage() {
  const { id } = useParams<{ id: string }>()
  const sessionId = Number(id)
  const navigate = useNavigate()
  const settings = useSettings()

  const session = useLiveQuery(
    () => (Number.isFinite(sessionId) ? db.strengthSessions.get(sessionId) : undefined),
    [sessionId],
  )

  const [expanded, setExpanded] = useState<string | null>(null)
  const [phase, setPhase] = useState<'training' | 'finishing' | 'summary'>('training')
  const [changes, setChanges] = useState<ProgressionChange[]>([])
  const [rpe, setRpe] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [warmupDone, setWarmupDone] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useWakeLock(settings.keepScreenAwake && phase === 'training')

  // Die Trainingsdauer im Kopf soll auch dann weiterlaufen, wenn gerade nichts
  // angetippt wird und kein Pausentimer die Ansicht ohnehin neu zeichnet.
  useEffect(() => {
    if (phase !== 'training') return
    const handle = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(handle)
  }, [phase])

  const restTimer = useRestTimer({
    soundEnabled: settings.soundEnabled,
    vibrationEnabled: settings.vibrationEnabled,
  })

  /**
   * Die Gruppen ergeben sich aus den gespeicherten Sätzen, nicht aus der Vorlage:
   * Wenn eine Übung abgewählt war, steht in der Einheit eine Ersatzübung, die in der
   * Vorlage gar nicht vorkommt. Pausenzeit und Hinweis werden dann über das
   * Bewegungsmuster aus dem passenden Vorlagenblock übernommen.
   */
  const groups: Group[] = useMemo(() => {
    if (!session) return []
    const template = getWorkout(session.templateKey)

    const order: string[] = []
    for (const set of session.sets) {
      if (!order.includes(set.exerciseKey)) order.push(set.exerciseKey)
    }

    return order.map((key) => {
      const exact = template.blocks.find((b) => b.exerciseKey === key)
      const byPattern = template.blocks.find(
        (b) => getExercise(b.exerciseKey).pattern === getExercise(key).pattern,
      )
      const source = exact ?? byPattern
      return {
        exerciseKey: key,
        restSec: source?.restSec ?? 90,
        note: exact?.note,
        sets: session.sets
          .filter((s) => s.exerciseKey === key)
          .sort((a, b) => a.setIndex - b.setIndex),
      }
    })
  }, [session])

  // Immer die erste Übung offen halten, die noch offene Sätze hat. Nach dem
  // letzten Satz einer Übung springt die Ansicht automatisch weiter.
  useEffect(() => {
    if (groups.length === 0) return
    const firstOpen = groups.find((g) => g.sets.some((s) => !s.done))
    setExpanded((current) => {
      if (current && groups.some((g) => g.exerciseKey === current)) {
        const group = groups.find((g) => g.exerciseKey === current)!
        if (group.sets.some((s) => !s.done)) return current
      }
      return firstOpen?.exerciseKey ?? null
    })
  }, [groups])

  if (!Number.isFinite(sessionId)) return <NotFound />
  if (session === undefined) return <div className="page muted">Lädt …</div>
  if (session === null || !session) return <NotFound />

  const template = getWorkout(session.templateKey)
  const doneCount = session.sets.filter((s) => s.done).length
  const totalCount = session.sets.length
  const progress = totalCount === 0 ? 0 : doneCount / totalCount
  const elapsed = Math.round((now - session.startedAt) / 1000)

  async function toggleSet(group: Group, set: SetLog) {
    if (!session) return
    if (set.done) {
      await patchSet(session.id!, set.exerciseKey, set.setIndex, { done: false })
      return
    }
    unlockAudio()
    const value = set.actual ?? set.target
    await patchSet(session.id!, set.exerciseKey, set.setIndex, { done: true, actual: value })
    playSetDone(settings.soundEnabled)
    vibrate(settings.vibrationEnabled, 35)

    // Nach dem letzten Satz der letzten Übung keine Pause mehr starten.
    const isLastSetOfExercise = group.sets[group.sets.length - 1].setIndex === set.setIndex
    const isLastExercise = groups[groups.length - 1]?.exerciseKey === group.exerciseKey
    if (isLastSetOfExercise && isLastExercise) return

    const ex = getExercise(set.exerciseKey)
    restTimer.start(group.restSec, `nach ${ex.name}`)
  }

  async function changeReps(set: SetLog, delta: number) {
    if (!session) return
    const ex = getExercise(set.exerciseKey)
    const step = ex.unit === 'seconds' ? 5 : 1
    const current = set.actual ?? set.target
    const next = Math.max(0, current + delta * step)
    await patchSet(session.id!, set.exerciseKey, set.setIndex, { actual: next })
  }

  async function handleFinish() {
    if (!session) return
    const result = await finishStrengthSession(session.id!, { rpe, notes: notes.trim() || undefined })
    setChanges(result)
    restTimer.stop()
    setPhase('summary')
  }

  async function handleDiscard() {
    if (!session) return
    if (!window.confirm('Diese Einheit verwerfen? Die eingetragenen Sätze gehen verloren.')) return
    await deleteStrengthSession(session.id!)
    navigate('/')
  }

  if (phase === 'summary') {
    return <Summary session={session} changes={changes} onClose={() => navigate('/')} />
  }

  if (phase === 'finishing') {
    return (
      <FinishForm
        doneCount={doneCount}
        totalCount={totalCount}
        elapsed={elapsed}
        rpe={rpe}
        notes={notes}
        onRpe={setRpe}
        onNotes={setNotes}
        onBack={() => setPhase('training')}
        onConfirm={() => void handleFinish()}
      />
    )
  }

  return (
    <>
      <div className="session-head">
        <div className="row-between">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1.05rem' }}>{template.name}</h2>
            <div className="tiny dim">
              {doneCount}/{totalCount} Sätze · {formatDuration(elapsed)}
              {session.short ? ' · Kurzform' : ''}
              {session.deload ? ' · Entlastungswoche' : ''}
            </div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={() => setPhase('finishing')}>
            Beenden
          </button>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="page" style={{ paddingBottom: restTimer.active ? 200 : 32 }}>
        {session.short && (
          <div className="card card-tight card-warn" style={{ marginBottom: 12 }}>
            <p className="tiny" style={{ margin: 0 }}>
              {SHORT_NOTE}
            </p>
          </div>
        )}

        <button
          className="card card-tight card-button"
          onClick={() => setWarmupDone((v) => !v)}
          style={{ marginBottom: 12 }}
          aria-expanded={!warmupDone}
        >
          <div className="row-between">
            <strong className="small">Aufwärmen · 4 Minuten</strong>
            <span className={`badge ${warmupDone ? 'badge-accent' : ''}`}>
              {warmupDone ? 'erledigt' : 'antippen'}
            </span>
          </div>
          {!warmupDone && (
            <ul className="list-plain small muted" style={{ marginTop: 10, marginBottom: 0 }}>
              {template.warmup.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </button>

        <div className="stack">
          {groups.map((group, index) => (
            <ExerciseCard
              key={group.exerciseKey}
              group={group}
              index={index}
              expanded={expanded === group.exerciseKey}
              onToggleExpand={() =>
                setExpanded((e) => (e === group.exerciseKey ? null : group.exerciseKey))
              }
              onToggleSet={(set) => void toggleSet(group, set)}
              onChangeReps={(set, delta) => void changeReps(set, delta)}
              onAddSet={() => void addExtraSet(sessionId, group.exerciseKey)}
              onRemoveSet={() => void removeLastSet(sessionId, group.exerciseKey)}
              onSetAssist={(level) => void setAssistLevel(sessionId, group.exerciseKey, level)}
              onStartHold={(seconds) => {
                unlockAudio()
                restTimer.start(seconds, 'Halten')
              }}
            />
          ))}
        </div>

        <h2 className="section-title">Ausklang</h2>
        <div className="card">
          <ul className="list-plain small muted" style={{ margin: 0 }}>
            {template.cooldown.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <button
          className="btn btn-primary btn-block btn-lg"
          style={{ marginTop: 20 }}
          onClick={() => setPhase('finishing')}
        >
          Einheit beenden
        </button>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => void handleDiscard()}>
          Einheit verwerfen
        </button>
      </div>

      <RestTimerBar timer={restTimer} />
    </>
  )
}

// ---------------------------------------------------------------------------

function ExerciseCard({
  group,
  index,
  expanded,
  onToggleExpand,
  onToggleSet,
  onChangeReps,
  onAddSet,
  onRemoveSet,
  onStartHold,
  onSetAssist,
}: {
  group: Group
  index: number
  expanded: boolean
  onToggleExpand: () => void
  onToggleSet: (set: SetLog) => void
  onChangeReps: (set: SetLog, delta: number) => void
  onAddSet: () => void
  onRemoveSet: () => void
  onStartHold: (seconds: number) => void
  onSetAssist: (level: string) => void
}) {
  const ex = getExercise(group.exerciseKey)
  const [showHelp, setShowHelp] = useState(false)
  const complete = group.sets.every((s) => s.done)
  const doneSets = group.sets.filter((s) => s.done).length
  const isSeconds = ex.unit === 'seconds'

  const ladder = ladderFor(ex.assistLadder)
  // Die Stufe des ersten noch offenen Satzes ist die, die gerade gilt.
  const currentAssist = (group.sets.find((s) => !s.done) ?? group.sets[0])?.assist
  const currentLevel = levelFor(ex.assistLadder, currentAssist)

  return (
    <div className="exercise-card" data-current={expanded} data-complete={complete}>
      <button className="exercise-head" onClick={onToggleExpand} aria-expanded={expanded}>
        <span className="exercise-index" data-complete={complete}>
          {complete ? <IconCheck size={14} /> : index + 1}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 620 }}>{ex.name}</span>
          <span className="tiny dim">
            {doneSets}/{group.sets.length} Sätze · Ziel {group.sets[0]?.target}
            {isSeconds ? 's' : ' Wdh'}
            {ex.unilateral ? ' je Seite' : ''}
          </span>
          {currentLevel && (
            <span
              className="badge"
              style={{
                marginTop: 4,
                color: currentLevel.color,
                borderColor: currentLevel.color,
                background: 'transparent',
              }}
            >
              {currentLevel.name}
            </span>
          )}
        </span>
        <IconChevronDown
          size={18}
          className="dim"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
        />
      </button>

      {expanded && (
        <div className="exercise-body">
          {group.note && (
            <p className="tiny" style={{ margin: '0 0 10px', color: 'var(--warn)' }}>
              {group.note}
            </p>
          )}

          {ladder && (
            <div style={{ marginBottom: 14 }}>
              <span className="field-label" style={{ display: 'block', marginBottom: 6 }}>
                Unterstützung
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
                    onClick={() => onSetAssist(level.key)}
                  >
                    {level.short}
                  </button>
                ))}
              </div>
              <p className="tiny dim" style={{ margin: '6px 0 0' }}>
                {currentLevel?.hint}. Gilt für alle noch offenen Sätze — bereits abgehakte behalten
                ihre Stufe.
              </p>
            </div>
          )}

          {group.sets.map((set, i) => {
            const value = set.actual ?? set.target
            return (
              <div className="set-row" key={`${set.exerciseKey}-${set.setIndex}`}>
                <span className="set-label">
                  #{i + 1}
                  {ladder && (
                    // Kleiner Farbpunkt: Nach einem Bandwechsel mitten in der Einheit
                    // ist sonst nicht mehr erkennbar, welcher Satz auf welcher Stufe lief.
                    <span
                      aria-hidden
                      style={{
                        display: 'block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        marginTop: 3,
                        background: levelFor(ex.assistLadder, set.assist)?.color ?? 'var(--border)',
                      }}
                    />
                  )}
                </span>
                <div className="rep-stepper">
                  <button
                    className="step-btn"
                    onClick={() => onChangeReps(set, -1)}
                    aria-label="weniger"
                  >
                    <IconMinus size={18} />
                  </button>
                  <span
                    className="rep-value"
                    data-below={value < set.target}
                    data-above={value > set.target}
                  >
                    {value}
                    {isSeconds ? 's' : ''}
                  </span>
                  <button className="step-btn" onClick={() => onChangeReps(set, 1)} aria-label="mehr">
                    <IconPlus size={18} />
                  </button>
                </div>
                <button
                  className="check-btn"
                  data-done={set.done}
                  onClick={() => onToggleSet(set)}
                  aria-label={set.done ? 'Satz zurücknehmen' : 'Satz abhaken'}
                >
                  <IconCheck size={20} />
                </button>
              </div>
            )
          })}

          {isSeconds && (
            <button
              className="btn btn-ghost btn-block btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => onStartHold(group.sets[0]?.target ?? 20)}
            >
              Haltezeit mitstoppen ({group.sets[0]?.target ?? 20}s)
            </button>
          )}

          <div className="row" style={{ marginTop: 12, gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={onAddSet}>
              + Satz
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onRemoveSet}>
              − Satz
            </button>
            <span className="spacer" />
            <button className="btn btn-ghost btn-sm" onClick={() => setShowHelp((v) => !v)}>
              {showHelp ? 'Hinweise aus' : 'Wie geht das?'}
            </button>
          </div>

          {showHelp && (
            <div style={{ marginTop: 14 }}>
              <p className="small muted" style={{ marginTop: 0 }}>
                {ex.setup}
              </p>
              <ul className="list-plain small" style={{ marginBottom: 12 }}>
                {ex.cues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="tiny muted" style={{ margin: '0 0 4px' }}>
                <strong>Zu schwer:</strong> {ex.easier}
              </p>
              <p className="tiny muted" style={{ margin: 0 }}>
                <strong>Zu leicht:</strong> {ex.harder}
              </p>
              {/* Steht am Ende von Fließtext und ist deshalb bewusst unterstrichen. */}
              <Link
                to={`/uebungen/${ex.key}`}
                className="small link"
                style={{ display: 'inline-block', marginTop: 10 }}
              >
                Ausführliche Beschreibung →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function FinishForm({
  doneCount,
  totalCount,
  elapsed,
  rpe,
  notes,
  onRpe,
  onNotes,
  onBack,
  onConfirm,
}: {
  doneCount: number
  totalCount: number
  elapsed: number
  rpe: number | undefined
  notes: string
  onRpe: (v: number) => void
  onNotes: (v: string) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const incomplete = doneCount < totalCount
  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        ← Zurück zum Training
      </button>
      <h1 className="page-title">Einheit abschließen</h1>
      <p className="page-subtitle">
        {doneCount} von {totalCount} Sätzen · {formatDuration(elapsed)}
      </p>

      {incomplete && (
        <div className="card card-warn" style={{ marginBottom: 16 }}>
          <p className="small" style={{ margin: 0 }}>
            Es sind noch {totalCount - doneCount} Sätze offen. Das ist in Ordnung — nicht abgehakte
            Sätze fließen einfach nicht in die Auswertung ein.
          </p>
        </div>
      )}

      <div className="field" style={{ marginBottom: 18 }}>
        <span className="field-label">Wie anstrengend war es? (1 = locker, 10 = alles gegeben)</span>
        <div className="chip-row">
          {[4, 5, 6, 7, 8, 9, 10].map((v) => (
            <button key={v} className="chip" data-active={rpe === v} onClick={() => onRpe(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="field" style={{ marginBottom: 22 }}>
        <span className="field-label">Notiz (optional)</span>
        <textarea
          className="textarea"
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="Linke Schulter hat gezwickt, Klimmzüge gingen gut …"
        />
      </div>

      <button className="btn btn-primary btn-block btn-lg" onClick={onConfirm}>
        Speichern und auswerten
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------

function Summary({
  session,
  changes,
  onClose,
}: {
  session: StrengthSession
  changes: ProgressionChange[]
  onClose: () => void
}) {
  const done = session.sets.filter((s) => s.done).length
  const duration = session.finishedAt ? Math.round((session.finishedAt - session.startedAt) / 1000) : 0
  const ups = changes.filter((c) => c.direction === 'up')
  const downs = changes.filter((c) => c.direction === 'down')
  const caps = changes.filter((c) => c.direction === 'cap')
  const assists = changes.filter((c) => c.direction === 'assist')

  return (
    <div className="page">
      <h1 className="page-title">Geschafft</h1>
      <p className="page-subtitle">{session.name}</p>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat">
          <div className="stat-value">{done}</div>
          <div className="stat-label">Sätze</div>
        </div>
        <div className="stat">
          <div className="stat-value">{sessionVolume(session)}</div>
          <div className="stat-label">Wiederholungen</div>
        </div>
        <div className="stat">
          <div className="stat-value">{formatDuration(duration)}</div>
          <div className="stat-label">Dauer</div>
        </div>
      </div>

      {session.deload && (
        <div className="card card-warn" style={{ marginBottom: 16 }}>
          <p className="small" style={{ margin: 0 }}>
            Entlastungswoche — die Vorgaben bleiben bewusst stehen. Ab nächster Woche geht es wieder
            aufwärts.
          </p>
        </div>
      )}

      {assists.length > 0 && (
        <>
          <h2 className="section-title">Stufe geschafft</h2>
          <div className="stack">
            {assists.map((c) => {
              const from = levelFor(c.ladder, c.fromAssist)
              const to = levelFor(c.ladder, c.toAssist)
              return (
                <div key={c.exerciseKey} className="card card-accent">
                  <div className="row-between" style={{ marginBottom: 6 }}>
                    <strong className="small">{c.exerciseName}</strong>
                    <span className="row tiny nowrap" style={{ gap: 6 }}>
                      <span style={{ color: from?.color }}>{from?.short}</span>
                      <span className="dim">→</span>
                      <span style={{ color: to?.color, fontWeight: 700 }}>{to?.short}</span>
                    </span>
                  </div>
                  <p className="tiny muted" style={{ margin: 0 }}>
                    {c.reason}
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}

      {ups.length > 0 && (
        <>
          <h2 className="section-title">Nächstes Mal mehr</h2>
          <div className="stack">
            {ups.map((c) => (
              <div key={c.exerciseKey} className="card card-tight card-accent">
                <div className="row-between">
                  <strong className="small">{c.exerciseName}</strong>
                  <span className="badge badge-accent">
                    {c.from} → {c.to}
                    {c.unit === 'seconds' ? 's' : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {caps.length > 0 && (
        <>
          <h2 className="section-title">Jetzt über die Variante steigern</h2>
          <div className="stack">
            {caps.map((c) => (
              <div key={c.exerciseKey} className="card card-tight card-warn">
                <div className="row-between" style={{ marginBottom: 4 }}>
                  <strong className="small">{c.exerciseName}</strong>
                  <span className="badge badge-warn">
                    {c.to}
                    {c.unit === 'seconds' ? 's' : ''} ist genug
                  </span>
                </div>
                <p className="tiny muted" style={{ margin: 0 }}>
                  {c.reason}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {downs.length > 0 && (
        <>
          <h2 className="section-title">Angepasst nach unten</h2>
          <div className="stack">
            {downs.map((c) => (
              <div key={c.exerciseKey} className="card card-tight">
                <div className="row-between" style={{ marginBottom: 4 }}>
                  <strong className="small">{c.exerciseName}</strong>
                  <span className="badge badge-warn">
                    {c.from} → {c.to}
                    {c.unit === 'seconds' ? 's' : ''}
                  </span>
                </div>
                <p className="tiny muted" style={{ margin: 0 }}>
                  {c.reason}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {changes.length === 0 && !session.deload && (
        <div className="card">
          <p className="small muted" style={{ margin: 0 }}>
            Vorgaben bleiben unverändert. Sie steigen erst, wenn alle Sätze einer Übung voll
            durchgezogen wurden — so bleibt die Ausführung sauber.
          </p>
        </div>
      )}

      <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 24 }} onClick={onClose}>
        Fertig
      </button>
    </div>
  )
}

function NotFound() {
  return (
    <div className="page">
      <h1 className="page-title">Nicht gefunden</h1>
      <p className="page-subtitle">Diese Einheit gibt es nicht mehr.</p>
      <Link to="/" className="btn btn-primary btn-block">
        Zur Startseite
      </Link>
    </div>
  )
}
