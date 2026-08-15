import type { Exercise } from './types'
import { EXERCISES, exercisesForPattern, getExercise } from './exercises'
import { PATTERNS, type MovementPattern } from './patterns'
import { resolveBlocks, WORKOUTS } from './workouts'

/**
 * Prüft, ob die gewählte Übungsauswahl noch ein vollständiges Training ergibt.
 *
 * Zwei Fragen werden beantwortet:
 *
 *  1. **Ist jedes Bewegungsmuster abgedeckt?** Pflichtmuster ohne aktive Übung sind
 *     ein Fehler, empfohlene ein Hinweis. Damit fällt kein ganzer Körperbereich
 *     unbemerkt aus dem Plan.
 *  2. **Stimmt das Verhältnis von Zug zu Druck?** Gezählt werden die tatsächlichen
 *     Wochensätze beider Workouts, nicht die Übungen — vier Sätze Liegestütze wiegen
 *     schwerer als zwei Sätze Rudern.
 *
 * Zur Einordnung: Mindestens so viele Zug- wie Drucksätze zu planen, ist etablierte
 * Trainingspraxis und begründet sich damit, dass die schulterblattführenden Muskeln
 * beim Drücken kaum arbeiten. Es ist ein Programmierungsgrundsatz, kein
 * Studienergebnis — die verbreitete Behauptung, Drücken allein verursache einen
 * Rundrücken, geht über die Datenlage hinaus.
 */

export interface PatternStatus {
  pattern: MovementPattern
  all: Exercise[]
  active: Exercise[]
  covered: boolean
  /** Sätze pro Woche über beide Workouts hinweg, mit der aktuellen Auswahl. */
  weeklySets: number
}

export interface BalanceProblem {
  severity: 'fehler' | 'hinweis'
  text: string
}

export interface BalanceReport {
  patterns: PatternStatus[]
  pushSets: number
  pullSets: number
  totalSets: number
  problems: BalanceProblem[]
  /** Keine Fehler — der Plan ist vollständig. */
  ok: boolean
}

/** Wochensätze je Bewegungsmuster über beide Workouts, nach Auflösung der Auswahl. */
function weeklySetsByPattern(disabled: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const workout of WORKOUTS) {
    for (const block of resolveBlocks(workout, disabled, false)) {
      const pattern = getExercise(block.exerciseKey).pattern
      counts.set(pattern, (counts.get(pattern) ?? 0) + block.sets)
    }
  }
  return counts
}

export function checkBalance(disabled: readonly string[]): BalanceReport {
  const off = new Set(disabled)
  const setsByPattern = weeklySetsByPattern(disabled)

  const patterns: PatternStatus[] = PATTERNS.map((pattern) => {
    const all = exercisesForPattern(pattern.key)
    const active = all.filter((e) => !off.has(e.key))
    return {
      pattern,
      all,
      active,
      covered: active.length > 0,
      weeklySets: setsByPattern.get(pattern.key) ?? 0,
    }
  })

  let pushSets = 0
  let pullSets = 0
  let totalSets = 0
  for (const status of patterns) {
    totalSets += status.weeklySets
    if (status.pattern.balance === 'push') pushSets += status.weeklySets
    if (status.pattern.balance === 'pull') pullSets += status.weeklySets
  }

  const problems: BalanceProblem[] = []

  for (const status of patterns) {
    if (status.covered) continue
    if (status.pattern.requirement === 'pflicht') {
      problems.push({
        severity: 'fehler',
        text: `„${status.pattern.name}" ist komplett abgewählt. ${status.pattern.covers} wird damit gar nicht mehr trainiert. Bitte mindestens eine Übung wieder aktivieren.`,
      })
    } else if (status.pattern.requirement === 'empfohlen') {
      problems.push({
        severity: 'hinweis',
        text: `„${status.pattern.name}" ist abgewählt. ${status.pattern.why}`,
      })
    }
  }

  // Ein Muster kann abgedeckt sein und trotzdem in keinem Workout vorkommen —
  // etwa wenn die einzige aktive Übung des Musters in keinem Plan steht.
  for (const status of patterns) {
    if (!status.covered || status.weeklySets > 0) continue
    if (status.pattern.requirement === 'pflicht') {
      problems.push({
        severity: 'fehler',
        text: `„${status.pattern.name}" kommt in keinem Workout vor, obwohl Übungen aktiv sind. Das sollte nicht passieren — bitte die Auswahl zurücksetzen.`,
      })
    }
  }

  if (pushSets > 0 && pullSets < pushSets) {
    problems.push({
      severity: 'hinweis',
      text: `Aktuell ${pushSets} Druck- gegen ${pullSets} Zugsätze pro Woche. Mindestens so viele Zug- wie Drucksätze sind sinnvoll: Die Muskeln, die das Schulterblatt zurückziehen, arbeiten beim Drücken kaum mit. Eine Zugübung mehr aktivieren oder eine Druckübung abwählen.`,
    })
  }

  return {
    patterns,
    pushSets,
    pullSets,
    totalSets,
    problems,
    ok: !problems.some((p) => p.severity === 'fehler'),
  }
}

/**
 * Darf diese Übung abgewählt werden, ohne ein Pflichtmuster zu leeren?
 * Wird in der Auswahl genutzt, um den letzten Schalter eines Pflichtmusters zu sperren.
 */
export function isLastOfRequiredPattern(key: string, disabled: readonly string[]): boolean {
  const ex = getExercise(key)
  const pattern = PATTERNS.find((p) => p.key === ex.pattern)
  if (!pattern || pattern.requirement !== 'pflicht') return false
  const off = new Set(disabled)
  const stillActive = exercisesForPattern(ex.pattern).filter((e) => e.key !== key && !off.has(e.key))
  return stillActive.length === 0
}

/** Alle Übungen, die aktuell in mindestens einem Workout vorkommen. */
export function scheduledExerciseKeys(disabled: readonly string[]): Set<string> {
  const keys = new Set<string>()
  for (const workout of WORKOUTS) {
    for (const block of resolveBlocks(workout, disabled, false)) keys.add(block.exerciseKey)
  }
  return keys
}

export const TOTAL_EXERCISE_COUNT = EXERCISES.length
