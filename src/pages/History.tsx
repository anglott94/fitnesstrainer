import { useMemo, useState } from 'react'
import { useDoneStrengthSessions, useRunSessions } from '../hooks/useAppData'
import { deleteRun, deleteStrengthSession } from '../db/repo'
import { getExercise } from '../domain/exercises'
import { getWorkout } from '../domain/workouts'
import { sessionVolume } from '../domain/progression'
import type { RunSession, SetLog, StrengthSession } from '../domain/types'
import { levelFor } from '../domain/assistance'
import { formatDateLong, formatDuration, formatPace, formatRelative, weekKey } from '../lib/date'
import { IconRun, IconStrength, IconTrash } from '../components/icons'
import { useWriteGuard } from '../components/ErrorToast'

type Entry =
  | { kind: 'strength'; date: string; sortKey: number; session: StrengthSession }
  | { kind: 'run'; date: string; sortKey: number; run: RunSession }

export default function History() {
  const strength = useDoneStrengthSessions()
  const runs = useRunSessions()
  const [filter, setFilter] = useState<'all' | 'strength' | 'run'>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const guard = useWriteGuard()

  const entries = useMemo<Entry[]>(() => {
    const all: Entry[] = [
      ...strength.map((s) => ({
        kind: 'strength' as const,
        date: s.date,
        sortKey: s.finishedAt ?? s.startedAt,
        session: s,
      })),
      ...runs.map((r) => ({ kind: 'run' as const, date: r.date, sortKey: r.createdAt, run: r })),
    ]
    return all
      .filter((e) => filter === 'all' || e.kind === filter)
      .sort((a, b) => b.sortKey - a.sortKey)
  }, [strength, runs, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const entry of entries) {
      const key = weekKey(entry.date)
      const list = map.get(key) ?? []
      list.push(entry)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [entries])

  return (
    <div className="page">
      <h1 className="page-title">Verlauf</h1>
      <p className="page-subtitle">
        {entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'} aufgezeichnet.
      </p>

      <div className="chip-row" style={{ marginBottom: 18 }}>
        <button className="chip" data-active={filter === 'all'} onClick={() => setFilter('all')}>
          Alles
        </button>
        <button className="chip" data-active={filter === 'strength'} onClick={() => setFilter('strength')}>
          Kraft
        </button>
        <button className="chip" data-active={filter === 'run'} onClick={() => setFilter('run')}>
          Laufen
        </button>
      </div>

      {entries.length === 0 && (
        <div className="card">
          <p className="small muted" style={{ margin: 0 }}>
            Noch nichts aufgezeichnet. Sobald du die erste Einheit abschließt, steht sie hier.
          </p>
        </div>
      )}

      {grouped.map(([week, list]) => (
        <div key={week}>
          <h2 className="section-title">Woche ab {formatDateLong(week).split(',')[1]?.trim()}</h2>
          <div className="stack">
            {list.map((entry) => {
              const id = entryId(entry)
              return (
                <div key={id} className="card card-tight">
                  {/* Nur <span> im <button>: Blockelemente sind dort nicht erlaubt
                      und werden von Screenreadern uneinheitlich behandelt. */}
                  <button
                    className="row-between"
                    style={{ width: '100%', textAlign: 'left' }}
                    onClick={() => setOpenId((o) => (o === id ? null : id))}
                    aria-expanded={openId === id}
                    aria-controls={`entry-${id}`}
                  >
                    <span className="row" style={{ minWidth: 0 }}>
                      {entry.kind === 'strength' && <IconStrength size={18} className="muted" />}
                      {entry.kind === 'run' && <IconRun size={18} className="muted" />}
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontWeight: 600, display: 'block' }}>
                          {entryTitle(entry)}
                        </span>
                        <span className="tiny dim" style={{ display: 'block' }}>
                          {formatRelative(entry.date)}
                          {entrySubtitle(entry)}
                        </span>
                      </span>
                    </span>
                    <span className="dim">{openId === id ? '−' : '›'}</span>
                  </button>

                  {openId === id && (
                    <div
                      id={`entry-${id}`}
                      style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}
                    >
                      {entry.kind === 'strength' && <StrengthDetail session={entry.session} />}
                      {entry.kind === 'run' && <RunDetailRow run={entry.run} />}
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ marginTop: 14 }}
                        onClick={() => {
                          if (!window.confirm('Diesen Eintrag löschen?')) return
                          void guard(() => {
                            if (entry.kind === 'strength')
                              return deleteStrengthSession(entry.session.id!)
                            return deleteRun(entry.run.id!)
                          })
                          setOpenId(null)
                        }}
                      >
                        <IconTrash size={15} /> Löschen
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function entryId(entry: Entry): string {
  if (entry.kind === 'strength') return `s${entry.session.id}`
  return `r${entry.run.id}`
}

function entryTitle(entry: Entry): string {
  if (entry.kind === 'strength') return entry.session.name
  return entry.run.name
}

function entrySubtitle(entry: Entry): string {
  if (entry.kind === 'strength') {
    // Beim Zirkel nach Zeit gibt es keine Wiederholungen, nur absolvierte Intervalle.
    if (getWorkout(entry.session.templateKey).interval) {
      return ` · ${entry.session.sets.filter((s) => s.done).length} Intervalle`
    }
    return ` · ${sessionVolume(entry.session)} Wdh`
  }
  return entry.run.distanceKm ? ` · ${entry.run.distanceKm} km` : ''
}

function StrengthDetail({ session }: { session: StrengthSession }) {
  const byExercise = new Map<string, SetLog[]>()
  for (const set of session.sets) {
    if (set.actual === null || !set.done) continue
    const list = byExercise.get(set.exerciseKey) ?? []
    list.push(set)
    byExercise.set(set.exerciseKey, list)
  }
  const duration = session.finishedAt ? Math.round((session.finishedAt - session.startedAt) / 1000) : 0

  return (
    <>
      <div className="tiny dim" style={{ marginBottom: 10 }}>
        {formatDuration(duration)} · {session.sets.filter((s) => s.done).length} Sätze
        {session.rpe ? ` · Anstrengung ${session.rpe}/10` : ''}
        {session.short ? ' · Kurzform' : ''}
        {session.deload ? ' · Entlastungswoche' : ''}
      </div>
      {[...byExercise.entries()].map(([key, sets]) => {
        const ex = getExercise(key)
        const levels = [...new Set(sets.map((s) => s.assist).filter(Boolean))]
          .map((a) => levelFor(ex.assistLadder, a))
          .filter(Boolean)
        return (
          <div key={key} className="row-between small" style={{ padding: '3px 0' }}>
            <span className="muted">
              {ex.name}
              {levels.length > 0 && (
                <span className="tiny" style={{ marginLeft: 6 }}>
                  {levels.map((l) => (
                    <span key={l!.key} style={{ color: l!.color }}>
                      {l!.short}{' '}
                    </span>
                  ))}
                </span>
              )}
            </span>
            <span className="nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {sets.map((s) => s.actual).join(' · ')}
              {ex.unit === 'seconds' ? 's' : ''}
            </span>
          </div>
        )
      })}
      {byExercise.size === 0 && <p className="small dim" style={{ margin: 0 }}>Keine Sätze abgehakt.</p>}
      {session.notes && (
        <p className="small muted" style={{ marginTop: 10, marginBottom: 0 }}>
          „{session.notes}"
        </p>
      )}
    </>
  )
}


function RunDetailRow({ run }: { run: RunSession }) {
  return (
    <>
      <div className="stat-grid">
        {run.distanceKm != null && (
          <div className="stat">
            <div className="stat-value">{run.distanceKm}</div>
            <div className="stat-label">Kilometer</div>
          </div>
        )}
        {run.durationSec != null && (
          <div className="stat">
            <div className="stat-value">{formatDuration(run.durationSec)}</div>
            <div className="stat-label">Dauer</div>
          </div>
        )}
        {run.distanceKm != null && run.durationSec != null && (
          <div className="stat">
            <div className="stat-value" style={{ fontSize: '1.1rem' }}>
              {formatPace(run.distanceKm, run.durationSec)}
            </div>
            <div className="stat-label">Schnitt</div>
          </div>
        )}
        {run.avgHr != null && (
          <div className="stat">
            <div className="stat-value">{run.avgHr}</div>
            <div className="stat-label">⌀ Puls</div>
          </div>
        )}
      </div>
      {run.rpe && (
        <p className="tiny dim" style={{ marginTop: 10, marginBottom: 0 }}>
          Anstrengung {run.rpe}/10
        </p>
      )}
      {run.notes && (
        <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>
          „{run.notes}"
        </p>
      )}
    </>
  )
}
