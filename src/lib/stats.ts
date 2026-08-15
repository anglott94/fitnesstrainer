import type { ChartPoint } from '../components/Chart'
import { getExercise } from '../domain/exercises'
import { ladderFor, levelColor, type AssistLevel } from '../domain/assistance'
import { sessionVolume } from '../domain/progression'
import type { RunSession, StrengthSession } from '../domain/types'
import { addDays, currentWeekKey, formatDateShort, parseISODate, startOfWeek, toISODate, weekKey } from './date'

/** Die letzten n Wochen als Wochenschlüssel, älteste zuerst. */
export function lastWeekKeys(n: number): string[] {
  const thisMonday = parseISODate(currentWeekKey())
  return Array.from({ length: n }, (_, i) => toISODate(addDays(thisMonday, -7 * (n - 1 - i))))
}

/** Summiert Werte pro Kalenderwoche und füllt Wochen ohne Training mit 0. */
export function weeklySeries<T>(
  items: T[],
  getDate: (item: T) => string,
  getValue: (item: T) => number,
  weeks = 10,
): ChartPoint[] {
  const buckets = new Map<string, number>()
  for (const item of items) {
    const key = weekKey(getDate(item))
    buckets.set(key, (buckets.get(key) ?? 0) + getValue(item))
  }
  return lastWeekKeys(weeks).map((key) => ({
    label: formatDateShort(key),
    value: Math.round((buckets.get(key) ?? 0) * 10) / 10,
  }))
}

/**
 * Bester Satz einer Übung je Einheit, chronologisch.
 *
 * Bei Übungen mit Unterstützungsstufe bekommt jeder Punkt die Farbe der Stufe. Ohne
 * das wäre die Kurve irreführend: Ein Wechsel auf ein schwächeres Band lässt die
 * Wiederholungen fallen, obwohl die Leistung gestiegen ist.
 */
export function bestSetSeries(sessions: StrengthSession[], exerciseKey: string): ChartPoint[] {
  const ladder = getExercise(exerciseKey).assistLadder
  const points: ChartPoint[] = []
  for (const session of sessions) {
    const done = session.sets.filter(
      (s) => s.exerciseKey === exerciseKey && s.actual !== null && s.done,
    )
    if (done.length === 0) continue
    const best = done.reduce((a, b) => ((b.actual ?? 0) > (a.actual ?? 0) ? b : a))
    points.push({
      label: formatDateShort(session.date),
      value: best.actual as number,
      color: ladder ? levelColor(ladder, best.assist) : undefined,
    })
  }
  return points
}

/** Welche Unterstützungsstufen kommen im Verlauf dieser Übung überhaupt vor? */
export function assistLevelsUsed(
  sessions: StrengthSession[],
  exerciseKey: string,
): AssistLevel[] {
  const ladder = getExercise(exerciseKey).assistLadder
  const all = ladderFor(ladder)
  if (!all) return []
  const used = new Set<string>()
  for (const session of sessions) {
    for (const set of session.sets) {
      if (set.exerciseKey === exerciseKey && set.done && set.assist) used.add(set.assist)
    }
  }
  return all.filter((l) => used.has(l.key))
}

/** Gesamtwiederholungen einer Übung je Einheit, chronologisch. */
export function totalRepsSeries(sessions: StrengthSession[], exerciseKey: string): ChartPoint[] {
  const ex = getExercise(exerciseKey)
  const factor = ex.unilateral ? 2 : 1
  const points: ChartPoint[] = []
  for (const session of sessions) {
    const values = session.sets
      .filter((s) => s.exerciseKey === exerciseKey && s.actual !== null && s.done)
      .map((s) => s.actual as number)
    if (values.length === 0) continue
    points.push({
      label: formatDateShort(session.date),
      value: values.reduce((a, b) => a + b, 0) * factor,
    })
  }
  return points
}

export function strengthVolumeSeries(sessions: StrengthSession[], weeks = 10): ChartPoint[] {
  return weeklySeries(sessions, (s) => s.date, sessionVolume, weeks)
}

export function runDistanceSeries(runs: RunSession[], weeks = 10): ChartPoint[] {
  return weeklySeries(runs, (r) => r.date, (r) => r.distanceKm ?? 0, weeks)
}

export function sessionsPerWeekSeries(
  strength: StrengthSession[],
  runs: RunSession[],
  weeks = 10,
): ChartPoint[] {
  const all = [
    ...strength.map((s) => ({ date: s.date })),
    ...runs.map((r) => ({ date: r.date })),
  ]
  return weeklySeries(all, (x) => x.date, () => 1, weeks)
}

/**
 * Anzahl zusammenhängender Wochen mit mindestens einer Einheit, rückwärts gezählt.
 * Die laufende Woche bricht die Serie nicht ab, solange sie noch offen ist.
 */
export function weekStreak(strength: StrengthSession[], runs: RunSession[]): number {
  const active = new Set<string>()
  for (const s of strength) active.add(weekKey(s.date))
  for (const r of runs) active.add(weekKey(r.date))
  if (active.size === 0) return 0

  const thisWeek = currentWeekKey()
  let cursor = parseISODate(thisWeek)
  let streak = 0

  // Läuft die aktuelle Woche noch ohne Training, zählt sie nicht gegen dich.
  if (!active.has(thisWeek)) cursor = addDays(cursor, -7)

  while (active.has(toISODate(startOfWeek(cursor)))) {
    streak++
    cursor = addDays(cursor, -7)
  }
  return streak
}

export function personalBest(sessions: StrengthSession[], exerciseKey: string): number {
  let best = 0
  for (const session of sessions) {
    for (const set of session.sets) {
      if (set.exerciseKey === exerciseKey && set.actual !== null) {
        best = Math.max(best, set.actual)
      }
    }
  }
  return best
}

export function totalDistance(runs: RunSession[]): number {
  return Math.round(runs.reduce((sum, r) => sum + (r.distanceKm ?? 0), 0) * 10) / 10
}
