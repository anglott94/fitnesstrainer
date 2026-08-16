import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BACKUP_REMINDER_AFTER, countBackupRelevantEntries, db, DEFAULT_SETTINGS } from '../db/db'
import { buildWeekPlan, type WeekPlan } from '../domain/plan'
import type { Match, RunSession, Settings, StrengthSession } from '../domain/types'
import { buildZones, type Zones } from '../domain/zones'
import { currentWeekKey, weekKey } from '../lib/date'

export function useSettings(): Settings {
  const stored = useLiveQuery(() => db.settings.get(1), [], undefined)
  // Mit den Standardwerten auffüllen: Ein Datenbestand, der vor einem neuen Feld
  // angelegt wurde, hätte dort sonst undefined stehen.
  return useMemo(() => ({ ...DEFAULT_SETTINGS, ...stored, id: 1 }), [stored])
}

export function useExerciseStates() {
  return useLiveQuery(() => db.exerciseStates.toArray(), [], [])
}

export function useActiveSession(): StrengthSession | undefined | null {
  // undefined = wird geladen, null = es läuft keine Einheit
  return useLiveQuery(
    async () => (await db.strengthSessions.where('status').equals('active').first()) ?? null,
    [],
    undefined,
  )
}

export function useDoneStrengthSessions(): StrengthSession[] {
  return useLiveQuery(
    async () => {
      const all = await db.strengthSessions.where('status').equals('done').toArray()
      return all.sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0))
    },
    [],
    [],
  )
}

export function useRunSessions(): RunSession[] {
  return useLiveQuery(
    async () => {
      const all = await db.runSessions.toArray()
      return all.sort((a, b) => a.createdAt - b.createdAt)
    },
    [],
    [],
  )
}

export function useMatches(): Match[] {
  return useLiveQuery(
    async () => {
      const all = await db.matches.toArray()
      return all.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    },
    [],
    [],
  )
}

export function useZones(settings: Settings): Zones {
  return useMemo(() => buildZones(settings), [settings])
}

export function useBodyLogs() {
  return useLiveQuery(
    async () => {
      const all = await db.bodyLogs.toArray()
      return all.sort((a, b) => a.date.localeCompare(b.date))
    },
    [],
    [],
  )
}

export interface BackupStatus {
  /** Wie viele Einträge es insgesamt gibt. */
  entryCount: number
  /** Wie viele davon seit der letzten Sicherung dazugekommen sind. */
  newSinceBackup: number
  /** Ist die Schwelle überschritten, ab der erinnert wird? */
  overdue: boolean
  lastBackupAt?: string
}

/**
 * Stand der Sicherung. Die Daten liegen nur in diesem Browser — deshalb zählt die
 * App mit, wie viel seit dem letzten Export dazugekommen ist, statt darauf zu hoffen,
 * dass jemand von selbst daran denkt.
 */
export function useBackupStatus(settings: Settings): BackupStatus {
  const strength = useDoneStrengthSessions()
  const runs = useRunSessions()
  const matches = useMatches()
  const bodyLogs = useBodyLogs()

  const entryCount = countBackupRelevantEntries({
    strengthSessions: strength.length,
    runSessions: runs.length,
    matches: matches.length,
    bodyLogs: bodyLogs.length,
  })
  const newSinceBackup = Math.max(0, entryCount - (settings.lastBackupEntryCount ?? 0))

  return {
    entryCount,
    newSinceBackup,
    // Ein frischer Bestand ohne Sicherung soll nicht ab dem ersten Eintrag mahnen.
    overdue: newSinceBackup >= BACKUP_REMINDER_AFTER,
    lastBackupAt: settings.lastBackupAt,
  }
}

export interface WeekStatus {
  plan: WeekPlan
  strengthDone: StrengthSession[]
  runsDone: RunSession[]
  /** Welche Workouts der Woche stehen noch aus (Reihenfolge beibehalten). */
  strengthOpen: string[]
  runsOpen: string[]
}

export function useWeekStatus(settings: Settings): WeekStatus {
  const doneStrength = useDoneStrengthSessions()
  const runs = useRunSessions()

  const thisWeek = currentWeekKey()
  const strengthDone = doneStrength.filter((s) => weekKey(s.date) === thisWeek)
  const runsDone = runs.filter((r) => weekKey(r.date) === thisWeek)

  const plan = buildWeekPlan({
    startDate: settings.startDate,
    runsPerWeek: settings.runsPerWeek,
    strengthPerWeek: settings.strengthPerWeek,
    completedStrengthCount: doneStrength.length,
  })

  // Bereits erledigte Einheiten aus der Wochenliste streichen. Bei Kraft nach
  // Workout-Schlüssel, bei Läufen nach Plan-Schlüssel — wer zweimal dieselbe
  // Einheit macht, bekommt entsprechend nur einen Haken.
  const strengthOpen = removeDone(plan.workoutKeys, strengthDone.map((s) => s.templateKey))
  const runsOpen = removeDone(plan.runKeys, runsDone.map((r) => r.planKey))

  return { plan, strengthDone, runsDone, strengthOpen, runsOpen }
}

function removeDone(planned: string[], done: string[]): string[] {
  const remaining = [...planned]
  for (const key of done) {
    const idx = remaining.indexOf(key)
    if (idx >= 0) remaining.splice(idx, 1)
    else if (remaining.length > 0) remaining.pop() // Abweichung vom Plan zählt trotzdem
  }
  return remaining
}
