import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, DEFAULT_SETTINGS } from '../db/db'
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
