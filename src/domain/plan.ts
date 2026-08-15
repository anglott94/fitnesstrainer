import { daysBetween, currentWeekKey, todayISO } from '../lib/date'
import { WORKOUTS } from './workouts'
import type { Unit } from './types'

/**
 * Der Plan läuft in 4-Wochen-Blöcken: drei Wochen Aufbau, eine Entlastungswoche.
 *
 * Bewusst kein fester Wochentag-Kalender. Bei 1–2 Einheiten pro Woche und einem
 * Terminkalender voller Spielansetzungen wäre „Dienstag ist Lauftag" nur eine
 * Quelle für schlechtes Gewissen. Stattdessen gilt: pro Woche stehen N Einheiten
 * an, du machst sie, wann es passt — die App zählt mit.
 */

export const BLOCK_LENGTH_WEEKS = 4
/** Nullbasiert: Woche 4 des Blocks ist die Entlastungswoche. */
export const DELOAD_WEEK_INDEX = 3

/**
 * Laufrotation je Blockwoche. Position 0 ist die Priorität, wenn nur ein Lauf klappt.
 *
 * In den Aufbauwochen steht immer eine Einheit mit hochintensivem Anteil vorne. Bei
 * ein bis zwei Läufen pro Woche ist das die einzige Verteilung, die funktioniert:
 * Der ruhige Dauerlauf ist die Ergänzung, nicht die Basis — für eine echte
 * Grundlagenbasis fehlt schlicht der Umfang, den man dafür bräuchte.
 */
const RUN_ROTATION: string[][] = [
  ['kombi_4x4', 'dauerlauf'],
  ['intervall_75_25', 'tempolauf'],
  ['kombi_rsa', 'dauerlauf'],
  ['fahrtspiel', 'regeneration'], // Entlastungswoche
]

export interface WeekPlan {
  /** Montag dieser Woche als yyyy-mm-dd. */
  weekKey: string
  /** Fortlaufende Trainingswoche seit Start, 1-basiert. */
  weekNumber: number
  /** Woche innerhalb des 4-Wochen-Blocks, 1-basiert. */
  blockWeek: number
  blockNumber: number
  isDeload: boolean
  /** Laufeinheiten dieser Woche, wichtigste zuerst. */
  runKeys: string[]
  /** Kraft-Workouts dieser Woche, in der Reihenfolge, in der sie drankommen. */
  workoutKeys: string[]
}

export function buildWeekPlan(opts: {
  startDate: string
  runsPerWeek: number
  strengthPerWeek: number
  /** Anzahl bisher abgeschlossener Krafteinheiten — steuert den A/B-Wechsel. */
  completedStrengthCount: number
}): WeekPlan {
  const elapsedDays = Math.max(0, daysBetween(opts.startDate, todayISO()))
  const weekIndex = Math.floor(elapsedDays / 7)
  const blockWeekIndex = weekIndex % BLOCK_LENGTH_WEEKS
  const isDeload = blockWeekIndex === DELOAD_WEEK_INDEX

  const rotation = RUN_ROTATION[blockWeekIndex]
  const runKeys = rotation.slice(0, Math.max(1, Math.min(opts.runsPerWeek, rotation.length)))

  const workoutKeys: string[] = []
  for (let i = 0; i < Math.max(1, opts.strengthPerWeek); i++) {
    const idx = (opts.completedStrengthCount + i) % WORKOUTS.length
    workoutKeys.push(WORKOUTS[idx].key)
  }

  return {
    weekKey: currentWeekKey(),
    weekNumber: weekIndex + 1,
    blockWeek: blockWeekIndex + 1,
    blockNumber: Math.floor(weekIndex / BLOCK_LENGTH_WEEKS) + 1,
    isDeload,
    runKeys,
    workoutKeys,
  }
}

/** In der Entlastungswoche einen Satz weniger, mindestens aber zwei. */
export function adjustSets(sets: number, isDeload: boolean): number {
  return isDeload ? Math.max(2, sets - 1) : sets
}

/**
 * In der Entlastungswoche rund 25 Prozent weniger Wiederholungen bzw. Sekunden.
 * Haltezeiten werden auf 5 Sekunden gerundet — „26 Sekunden halten" liest sich
 * wie ein Rechenfehler, auch wenn es rechnerisch stimmt.
 */
export function adjustTarget(target: number, isDeload: boolean, unit: Unit = 'reps'): number {
  if (!isDeload) return target
  const reduced = target * 0.75
  if (unit === 'seconds') return Math.max(5, Math.round(reduced / 5) * 5)
  return Math.max(1, Math.round(reduced))
}

export const DELOAD_EXPLANATION =
  'Entlastungswoche: weniger Sätze und reduzierte Vorgaben. Stärker wirst du nicht im Training, ' +
  'sondern in der Erholung danach — diese Woche holt die Anpassung der letzten drei ab. ' +
  'Die Vorgaben steigen diese Woche bewusst nicht.'
