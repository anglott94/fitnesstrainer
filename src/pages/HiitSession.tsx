import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteStrengthSession, finishStrengthSession, patchSet } from '../db/repo'
import { getExercise } from '../domain/exercises'
import type { StrengthSession, WorkoutTemplate } from '../domain/types'
import { useSettings } from '../hooks/useAppData'
import { useWriteGuard } from '../components/ErrorToast'
import { playRestOver, playSetDone, playTick, unlockAudio, vibrate } from '../lib/feedback'
import { FinishForm } from './StrengthSessionPage'

/** Countdown vor der ersten Übung, damit man nach dem Tippen in Position kommt. */
const PREP_SEC = 5

type Phase = 'prep' | 'work' | 'rest'
type Status = 'ready' | 'running' | 'paused' | 'finishing'

const RADIUS = 92
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Geführter Zirkel nach Zeit: Belastung, Pause, nächste Übung — ohne dass man
 * zwischendurch aufs Handy tippen muss. Die Zeiten laufen gegen die Uhr
 * (Endzeitpunkt statt heruntergezählter Sekunden), damit ein kurz gesperrter
 * Bildschirm den Ablauf nicht verschiebt.
 */
export default function HiitSession({
  session,
  template,
}: {
  session: StrengthSession
  template: WorkoutTemplate
}) {
  const navigate = useNavigate()
  const settings = useSettings()
  const guard = useWriteGuard()
  const interval = template.interval!

  // Die Sätze liegen bereits Runde für Runde in der richtigen Reihenfolge vor.
  const steps = session.sets
  const rounds = useMemo(() => Math.max(1, ...steps.map((s) => s.setIndex + 1)), [steps])
  const firstOpen = Math.max(0, steps.findIndex((s) => !s.done))

  const [status, setStatus] = useState<Status>('ready')
  const [stepIndex, setStepIndex] = useState(firstOpen)
  const [phase, setPhase] = useState<Phase>('prep')
  const [endAt, setEndAt] = useState(0)
  const [pausedLeftMs, setPausedLeftMs] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [rpe, setRpe] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const lastTick = useRef<number | null>(null)
  /** Stand vor dem Abschlussdialog, damit „Zurück" an derselben Stelle weitermacht. */
  const beforeFinish = useRef<Status>('ready')

  const current = steps[stepIndex]
  const next = steps[stepIndex + 1]
  const isRoundEnd = !next || next.setIndex !== current?.setIndex
  const phaseTotal =
    phase === 'prep'
      ? PREP_SEC
      : phase === 'work'
        ? interval.workSec
        : isRoundEnd
          ? interval.roundRestSec
          : interval.restSec

  const leftMs = status === 'paused' ? pausedLeftMs : Math.max(0, endAt - now)
  const remaining = status === 'ready' ? phaseTotal : Math.ceil(leftMs / 1000)

  function startPhase(p: Phase, seconds: number) {
    setPhase(p)
    setEndAt(Date.now() + seconds * 1000)
    setNow(Date.now())
    lastTick.current = null
  }

  /** Belastung vorbei (oder übersprungen): Pause oder Ende. */
  async function finishWork(completed: boolean) {
    const step = steps[stepIndex]
    if (completed && step) {
      await guard(() =>
        patchSet(session.id!, step.exerciseKey, step.setIndex, {
          done: true,
          actual: interval.workSec,
        }),
      )
      playSetDone(settings.soundEnabled)
    }
    if (stepIndex >= steps.length - 1) {
      beforeFinish.current = 'paused'
      setPausedLeftMs(0)
      setStatus('finishing')
      return
    }
    vibrate(settings.vibrationEnabled, 120)
    const roundEnd = steps[stepIndex + 1].setIndex !== step?.setIndex
    startPhase('rest', roundEnd ? interval.roundRestSec : interval.restSec)
  }

  function nextExercise() {
    setStepIndex((i) => i + 1)
    playRestOver(settings.soundEnabled)
    vibrate(settings.vibrationEnabled, [80, 60, 80])
    startPhase('work', interval.workSec)
  }

  // Taktgeber: prüft viermal pro Sekunde, ob die aktuelle Phase abgelaufen ist.
  useEffect(() => {
    if (status !== 'running') return
    const handle = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(handle)
  }, [status])

  useEffect(() => {
    if (status !== 'running') return
    if (remaining > 0) {
      // Die letzten drei Sekunden einer Phase leise antickern.
      if (remaining <= 3 && lastTick.current !== remaining) {
        lastTick.current = remaining
        playTick(settings.soundEnabled)
      }
      return
    }
    if (phase === 'prep') {
      playRestOver(settings.soundEnabled)
      startPhase('work', interval.workSec)
    } else if (phase === 'work') {
      void finishWork(true)
    } else {
      nextExercise()
    }
    // Nur auf den Ablauf der Zeit reagieren, nicht auf jede neue Funktionsreferenz.
  }, [remaining, status, phase])

  function start() {
    unlockAudio()
    setStatus('running')
    startPhase('prep', PREP_SEC)
  }

  function togglePause() {
    if (status === 'running') {
      setPausedLeftMs(Math.max(0, endAt - Date.now()))
      setStatus('paused')
    } else if (status === 'paused') {
      setEndAt(Date.now() + pausedLeftMs)
      setNow(Date.now())
      setStatus('running')
    }
  }

  function skip() {
    if (status === 'paused') setStatus('running')
    if (phase === 'prep') startPhase('work', interval.workSec)
    else if (phase === 'work') void finishWork(false)
    else nextExercise()
  }

  function openFinish() {
    beforeFinish.current = status
    // Die laufende Phase einfrieren, damit nach „Zurück" an derselben Stelle weitergeht.
    if (status === 'running') setPausedLeftMs(Math.max(0, endAt - Date.now()))
    setStatus('finishing')
  }

  async function handleFinish() {
    const ok = await guard(() =>
      finishStrengthSession(session.id!, { rpe, notes: notes.trim() || undefined }).then(() => {}),
    )
    if (ok) navigate('/')
  }

  async function handleDiscard() {
    if (!window.confirm('Diese Einheit verwerfen? Der Fortschritt geht verloren.')) return
    if (!(await guard(() => deleteStrengthSession(session.id!)))) return
    navigate('/')
  }

  const doneCount = steps.filter((s) => s.done).length

  if (status === 'finishing') {
    return (
      <FinishForm
        doneCount={doneCount}
        totalCount={steps.length}
        elapsed={Math.round((Date.now() - session.startedAt) / 1000)}
        rpe={rpe}
        notes={notes}
        onRpe={setRpe}
        onNotes={setNotes}
        onBack={() => setStatus(beforeFinish.current === 'ready' ? 'ready' : 'paused')}
        onConfirm={() => void handleFinish()}
      />
    )
  }

  const ex = current ? getExercise(current.exerciseKey) : undefined
  const nextEx = next ? getExercise(next.exerciseKey) : undefined
  const tone = phase === 'work' ? 'var(--accent)' : phase === 'rest' ? 'var(--run)' : 'var(--warn)'
  const progress = phaseTotal > 0 ? Math.min(1, remaining / phaseTotal) : 0

  const headline =
    status === 'ready'
      ? 'Bereit?'
      : phase === 'prep'
        ? 'Gleich geht’s los'
        : phase === 'work'
          ? ex?.name
          : isRoundEnd
            ? 'Rundenpause'
            : 'Pause'

  // In der Pause zeigt die Ansicht schon die kommende Übung, damit man sich in
  // Position bringen kann.
  const preview = phase === 'rest' ? nextEx : status === 'ready' || phase === 'prep' ? ex : undefined
  const round = (phase === 'rest' && next ? next.setIndex : (current?.setIndex ?? 0)) + 1

  return (
    <>
      <div className="session-head">
        <div className="row-between">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1.05rem' }}>{template.name}</h2>
            <div className="tiny dim">
              Runde {Math.min(round, rounds)}/{rounds} · {doneCount}/{steps.length} Intervalle
              {session.short ? ' · Kurzform' : ''}
            </div>
          </div>
          <button className="btn btn-sm btn-primary" onClick={openFinish}>
            Beenden
          </button>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${(doneCount / Math.max(1, steps.length)) * 100}%` }} />
        </div>
      </div>

      <div className="page" style={{ paddingBottom: 32 }}>
        {status === 'ready' && (
          <div className="card card-tight" style={{ marginBottom: 16 }}>
            <strong className="small">Aufwärmen (ca. 3 Minuten)</strong>
            <ul className="small muted" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {template.warmup.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p className="tiny dim" style={{ margin: '10px 0 0' }}>
              {interval.workSec} Sekunden Belastung, {interval.restSec} Sekunden Pause, nach jeder
              Runde {interval.roundRestSec} Sekunden. Der Timer führt dich durch — du musst
              zwischendurch nichts antippen.
            </p>
          </div>
        )}

        <div className="hiit-stage" role="timer" aria-live="off">
          <div className="hiit-ring">
            <svg width={210} height={210} viewBox="0 0 210 210">
              <circle cx="105" cy="105" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={10} />
              <circle
                cx="105"
                cy="105"
                r={RADIUS}
                fill="none"
                stroke={tone}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.25s linear, stroke 0.2s ease' }}
              />
            </svg>
            <div className="hiit-ring-label" style={{ color: tone }}>
              {remaining}
            </div>
          </div>

          <div className="hiit-phase" style={{ color: tone }}>
            {status === 'paused' ? 'Angehalten' : phase === 'work' ? 'Los!' : phase === 'rest' ? 'Durchatmen' : ''}
          </div>
          <h1 className="hiit-title">{headline}</h1>
          {preview && (
            <p className="small muted" style={{ margin: '6px 0 0' }}>
              {phase === 'rest' ? 'Als Nächstes: ' : 'Erste Übung: '}
              <strong style={{ color: 'var(--text)' }}>{preview.name}</strong>
            </p>
          )}
        </div>

        <span className="sr-only" role="status" aria-live="assertive">
          {status === 'running' ? `${headline}` : ''}
        </span>

        {status === 'ready' ? (
          <button className="btn btn-primary btn-block btn-lg" onClick={start}>
            {firstOpen > 0 ? 'Weitermachen' : 'Zirkel starten'}
          </button>
        ) : (
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={togglePause}>
              {status === 'paused' ? 'Weiter' : 'Stopp'}
            </button>
            <button className="btn btn-ghost btn-lg" style={{ flex: 1 }} onClick={skip}>
              Überspringen
            </button>
          </div>
        )}

        {(phase === 'work' || status === 'ready' || phase === 'prep' || phase === 'rest') &&
          (phase === 'rest' ? nextEx : ex) && (
            <div className="card card-tight" style={{ marginTop: 16 }}>
              <strong className="small">{(phase === 'rest' ? nextEx : ex)!.name}</strong>
              <ul className="small muted" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {(phase === 'rest' ? nextEx : ex)!.cues.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="tiny dim" style={{ margin: '8px 0 0' }}>
                Zu hart? {(phase === 'rest' ? nextEx : ex)!.easier}
              </p>
            </div>
          )}

        <h2 className="section-title">Ablauf pro Runde</h2>
        <div className="list">
          {template.blocks
            .map((b) => b.exerciseKey)
            .filter((key) => steps.some((s) => s.exerciseKey === key))
            .concat(
              // Ersatzübungen (falls eine abgewählt war) stehen nicht in der Vorlage.
              [...new Set(steps.map((s) => s.exerciseKey))].filter(
                (key) => !template.blocks.some((b) => b.exerciseKey === key),
              ),
            )
            .map((key) => {
              const done = steps.filter((s) => s.exerciseKey === key && s.done).length
              const total = steps.filter((s) => s.exerciseKey === key).length
              const active = current?.exerciseKey === key && phase === 'work' && status !== 'ready'
              return (
                <div key={key} className="list-row" data-active={active}>
                  <span className="list-title" style={active ? { color: 'var(--accent)' } : undefined}>
                    {getExercise(key).name}
                  </span>
                  <span className="tiny dim nowrap">
                    {done}/{total}
                  </span>
                </div>
              )
            })}
        </div>

        <div className="card card-tight" style={{ marginTop: 16 }}>
          <strong className="small">Danach</strong>
          <ul className="small muted" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
            {template.cooldown.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => void handleDiscard()}>
          Einheit verwerfen
        </button>
      </div>
    </>
  )
}
