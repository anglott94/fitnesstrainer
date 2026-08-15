import type { Exercise, ExerciseState, SetLog, StrengthSession, WorkoutTemplate } from './types'
import { getExercise } from './exercises'
import { resolveBlocks } from './workouts'
import { adjustSets, adjustTarget } from './plan'
import { defaultLevel, levelFor, nextHarderLevel } from './assistance'

/**
 * Progression: Die Vorgabe passt sich automatisch an die letzte Leistung an.
 *
 *  - Alle Sätze auf oder über der Vorgabe geschafft  -> Vorgabe steigt
 *  - Mehrheit der Sätze deutlich darunter            -> Vorgabe sinkt wieder
 *  - Dazwischen                                      -> Vorgabe bleibt
 *
 * Das entspricht dem, was ein Trainer täte: gehalten wird, was sauber ging;
 * nachgelegt wird erst, wenn wirklich alle Sätze standen. Nach einer Pause oder
 * einer schlechten Phase fängt die App dich automatisch wieder ab, statt an einer
 * Vorgabe festzuhalten, die nicht mehr passt.
 */

/** Ab wie viel Prozent unter der Vorgabe ein Satz als deutlich verfehlt gilt. */
const SHORTFALL_RATIO = 0.8

export function targetFor(exerciseKey: string, states: ExerciseState[] | undefined): number {
  const ex = getExercise(exerciseKey)
  const state = states?.find((s) => s.key === exerciseKey)
  return state?.target ?? ex.startTarget
}

/** Erzeugt die Satzliste für eine neue Krafteinheit. */
export function buildSets(
  template: WorkoutTemplate,
  states: ExerciseState[] | undefined,
  isDeload: boolean,
  isShort = false,
  disabled: readonly string[] = [],
): SetLog[] {
  const sets: SetLog[] = []
  for (const block of resolveBlocks(template, disabled, isShort)) {
    const base = targetFor(block.exerciseKey, states)
    const target = adjustTarget(base, isDeload, getExercise(block.exerciseKey).unit)
    const count = adjustSets(block.sets, isDeload)
    const ex = getExercise(block.exerciseKey)
    const assist = ex.assistLadder
      ? (states?.find((s) => s.key === block.exerciseKey)?.assist ?? defaultLevel(ex.assistLadder))
      : undefined
    for (let i = 0; i < count; i++) {
      sets.push({
        exerciseKey: block.exerciseKey,
        setIndex: i,
        target,
        actual: null,
        done: false,
        assist,
      })
    }
  }
  return sets
}

export interface ProgressionChange {
  exerciseKey: string
  exerciseName: string
  from: number
  to: number
  direction: 'up' | 'down' | 'hold' | 'cap' | 'assist'
  unit: Exercise['unit']
  reason: string
  /** Bei Übungen mit Unterstützungsstufe: alte und neue Stufe. */
  fromAssist?: string
  toAssist?: string
  ladder?: string
}

/**
 * Wertet eine abgeschlossene Einheit aus und liefert die neuen Vorgaben.
 * Schreibt selbst nichts — das übernimmt der Aufrufer in einer Transaktion.
 */
export function evaluateSession(
  session: StrengthSession,
  states: ExerciseState[],
): { nextStates: ExerciseState[]; changes: ProgressionChange[] } {
  const now = Date.now()
  const byKey = new Map(states.map((s) => [s.key, s]))
  const changes: ProgressionChange[] = []
  const nextStates: ExerciseState[] = []

  const exerciseKeys = [...new Set(session.sets.map((s) => s.exerciseKey))]

  for (const key of exerciseKeys) {
    const ex = getExercise(key)
    const logged = session.sets.filter((s) => s.exerciseKey === key && s.actual !== null)
    const prev = byKey.get(key)
    const currentTarget = prev?.target ?? ex.startTarget
    const bestSoFar = prev?.bestSet ?? 0
    const bestThisSession = logged.reduce((max, s) => Math.max(max, s.actual ?? 0), 0)
    const newBest = Math.max(bestSoFar, bestThisSession)

    // Unterstützungsstufe: Nur wenn alle Sätze auf derselben Stufe liefen, ist eine
    // Aussage über Fortschritt möglich. Bei gemischten Stufen bleibt alles stehen.
    const currentAssist = prev?.assist ?? defaultLevel(ex.assistLadder)
    const usedAssists = new Set(logged.map((s) => s.assist ?? currentAssist))
    const sessionAssist = usedAssists.size === 1 ? [...usedAssists][0] : undefined
    const bestOnAssist =
      sessionAssist && sessionAssist === currentAssist
        ? Math.max(prev?.bestSetOnAssist ?? 0, bestThisSession)
        : (prev?.bestSetOnAssist ?? 0)

    const carry = {
      assist: currentAssist,
      bestSetOnAssist: bestOnAssist,
    }

    // Keine Eingaben: Bestwert ggf. sichern, Vorgabe unverändert lassen.
    if (logged.length === 0) {
      nextStates.push({ key, target: currentTarget, bestSet: newBest, updatedAt: now, ...carry })
      continue
    }

    let nextTarget = currentTarget
    let nextAssist = currentAssist
    let direction: ProgressionChange['direction'] = 'hold'
    let reason = 'Vorgabe bleibt — noch nicht alle Sätze voll geschafft.'

    if (session.deload) {
      reason = 'Entlastungswoche — Vorgabe bewusst unverändert.'
    } else {
      const allHit = logged.every((s) => (s.actual ?? 0) >= s.target)
      const shortfalls = logged.filter((s) => (s.actual ?? 0) < s.target * SHORTFALL_RATIO).length
      const harder = nextHarderLevel(ex.assistLadder, currentAssist)
      const readyForNextBand =
        allHit &&
        ex.assistLadder !== undefined &&
        ex.assistStepUpAt !== undefined &&
        currentTarget >= ex.assistStepUpAt &&
        harder !== undefined

      if (allHit && ex.assistLadder && sessionAssist !== currentAssist) {
        reason =
          'Die Sätze liefen auf unterschiedlichen Unterstützungsstufen — daraus lässt sich kein Fortschritt ablesen. Vorgabe bleibt.'
      } else if (readyForNextBand) {
        nextAssist = harder!.key
        nextTarget = ex.assistResetTarget ?? ex.startTarget
        direction = 'assist'
        reason =
          `${currentTarget} saubere Wiederholungen auf Stufe ${levelFor(ex.assistLadder, currentAssist)?.short ?? '–'} sind genug. ` +
          `Ab jetzt Stufe ${harder!.short} — die Wiederholungen fallen dabei auf ${nextTarget} zurück, und genau das ist der Fortschritt.`
      } else if (allHit && ex.maxTarget !== undefined && currentTarget >= ex.maxTarget) {
        // Bei Sprüngen bringt eine höhere Wiederholungszahl nichts mehr — ab hier
        // geht die Steigerung über die schwerere Variante, nicht über die Menge.
        reason = `Obergrenze erreicht (${ex.maxTarget}${unitSuffix(ex)}). Steigere jetzt über die schwerere Variante: ${ex.harder}`
        changes.push({
          exerciseKey: key,
          exerciseName: ex.name,
          from: currentTarget,
          to: currentTarget,
          direction: 'cap',
          unit: ex.unit,
          reason,
        })
      } else if (allHit) {
        nextTarget = ex.maxTarget !== undefined
          ? Math.min(ex.maxTarget, currentTarget + ex.increment)
          : currentTarget + ex.increment
        direction = 'up'
        reason = `Alle Sätze geschafft — nächstes Mal ${nextTarget}${unitSuffix(ex)}.`
      } else if (shortfalls > logged.length / 2) {
        nextTarget = Math.max(1, currentTarget - ex.increment)
        direction = 'down'
        reason = `Mehrheit der Sätze deutlich unter der Vorgabe — zurück auf ${nextTarget}${unitSuffix(ex)}, damit die Ausführung sauber bleibt.`
      }
    }

    if (direction !== 'hold') {
      changes.push({
        exerciseKey: key,
        exerciseName: ex.name,
        from: currentTarget,
        to: nextTarget,
        direction,
        unit: ex.unit,
        reason,
        fromAssist: currentAssist,
        toAssist: nextAssist,
        ladder: ex.assistLadder,
      })
    }

    nextStates.push({
      key,
      target: nextTarget,
      bestSet: newBest,
      updatedAt: now,
      assist: nextAssist,
      // Nach einem Stufenwechsel beginnt der stufenbezogene Bestwert von vorn.
      bestSetOnAssist: nextAssist === currentAssist ? bestOnAssist : 0,
    })
  }

  return { nextStates, changes }
}

function unitSuffix(ex: Exercise): string {
  return ex.unit === 'seconds' ? ' Sekunden' : ' Wiederholungen'
}

/** Gesamtvolumen einer Einheit: Summe aller Wiederholungen (Sekunden zählen nicht mit). */
export function sessionVolume(session: StrengthSession): number {
  return session.sets.reduce((sum, s) => {
    const ex = getExercise(s.exerciseKey)
    if (ex.unit !== 'reps') return sum
    const reps = s.actual ?? 0
    return sum + (ex.unilateral ? reps * 2 : reps)
  }, 0)
}

export function sessionCompletion(session: StrengthSession): number {
  if (session.sets.length === 0) return 0
  return session.sets.filter((s) => s.done).length / session.sets.length
}
