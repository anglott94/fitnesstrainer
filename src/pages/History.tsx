import { useMemo, useState } from 'react'
import { useDoneStrengthSessions, useMatches, useRunSessions } from '../hooks/useAppData'
import { deleteMatch, deleteRun, deleteStrengthSession } from '../db/repo'
import { getExercise } from '../domain/exercises'
import { sessionVolume } from '../domain/progression'
import type { Match, RunSession, SetLog, StrengthSession } from '../domain/types'
import { levelFor } from '../domain/assistance'
import { formatDateLong, formatDuration, formatPace, formatRelative, weekKey } from '../lib/date'
import { IconRun, IconStrength, IconTrash, IconWhistle } from '../components/icons'

type Entry =
  | { kind: 'strength'; date: string; sortKey: number; session: StrengthSession }
  | { kind: 'run'; date: string; sortKey: number; run: RunSession }
  | { kind: 'match'; date: string; sortKey: number; match: Match }

export default function History() {
  const strength = useDoneStrengthSessions()
  const runs = useRunSessions()
  const matches = useMatches()
  const [filter, setFilter] = useState<'all' | 'strength' | 'run' | 'match'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const entries = useMemo<Entry[]>(() => {
    const all: Entry[] = [
      ...strength.map((s) => ({
        kind: 'strength' as const,
        date: s.date,
        sortKey: s.finishedAt ?? s.startedAt,
        session: s,
      })),
      ...runs.map((r) => ({ kind: 'run' as const, date: r.date, sortKey: r.createdAt, run: r })),
      ...matches.map((m) => ({
        kind: 'match' as const,
        date: m.date,
        sortKey: m.createdAt,
        match: m,
      })),
    ]
    return all
      .filter((e) => filter === 'all' || e.kind === filter)
      .sort((a, b) => b.sortKey - a.sortKey)
  }, [strength, runs, matches, filter])

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
        <button className="chip" data-active={filter === 'match'} onClick={() => setFilter('match')}>
          Spiele
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
                  <button
                    className="row-between"
                    style={{ width: '100%', textAlign: 'left' }}
                    onClick={() => setOpenId((o) => (o === id ? null : id))}
                  >
                    <div className="row" style={{ minWidth: 0 }}>
                      {entry.kind === 'strength' && <IconStrength size={18} className="muted" />}
                      {entry.kind === 'run' && <IconRun size={18} className="muted" />}
                      {entry.kind === 'match' && <IconWhistle size={18} className="muted" />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{entryTitle(entry)}</div>
                        <div className="tiny dim">
                          {formatRelative(entry.date)}
                          {entrySubtitle(entry)}
                        </div>
                      </div>
                    </div>
                    <span className="dim">{openId === id ? '−' : '›'}</span>
                  </button>

                  {openId === id && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      {entry.kind === 'strength' && <StrengthDetail session={entry.session} />}
                      {entry.kind === 'run' && <RunDetailRow run={entry.run} />}
                      {entry.kind === 'match' && <MatchDetailRow match={entry.match} />}
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ marginTop: 14 }}
                        onClick={() => {
                          if (!window.confirm('Diesen Eintrag löschen?')) return
                          if (entry.kind === 'strength') void deleteStrengthSession(entry.session.id!)
                          else if (entry.kind === 'run') void deleteRun(entry.run.id!)
                          else void deleteMatch(entry.match.id!)
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
  if (entry.kind === 'run') return `r${entry.run.id}`
  return `m${entry.match.id}`
}

function entryTitle(entry: Entry): string {
  if (entry.kind === 'strength') return entry.session.name
  if (entry.kind === 'run') return entry.run.name
  return entry.match.competition
}

function entrySubtitle(entry: Entry): string {
  if (entry.kind === 'strength') return ` · ${sessionVolume(entry.session)} Wdh`
  if (entry.kind === 'run') return entry.run.distanceKm ? ` · ${entry.run.distanceKm} km` : ''
  return ` · Position ${entry.match.positioning}/5 · Disziplin ${entry.match.discipline}/5`
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

function MatchDetailRow({ match }: { match: Match }) {
  return (
    <>
      <div className="stat-grid" style={{ marginBottom: 10 }}>
        <div className="stat">
          <div className="stat-value">{match.positioning}/5</div>
          <div className="stat-label">Positionierung</div>
        </div>
        <div className="stat">
          <div className="stat-value">{match.discipline}/5</div>
          <div className="stat-label">Disziplinkontrolle</div>
        </div>
        {match.distanceKm != null && (
          <div className="stat">
            <div className="stat-value">{match.distanceKm}</div>
            <div className="stat-label">Kilometer</div>
          </div>
        )}
        {match.avgHr != null && (
          <div className="stat">
            <div className="stat-value">{match.avgHr}</div>
            <div className="stat-label">⌀ Puls</div>
          </div>
        )}
        {match.maxHr != null && (
          <div className="stat">
            <div className="stat-value">{match.maxHr}</div>
            <div className="stat-label">Max Puls</div>
          </div>
        )}
      </div>
      {match.keyScene && (
        <>
          <strong className="tiny dim">Schwierigste Szene</strong>
          <p className="small muted" style={{ margin: '2px 0 8px' }}>
            {match.keyScene}
          </p>
        </>
      )}
      {match.notes && (
        <p className="small muted" style={{ margin: 0 }}>
          „{match.notes}"
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
