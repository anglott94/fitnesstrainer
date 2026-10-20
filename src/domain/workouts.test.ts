import { describe, expect, it } from 'vitest'
import { buildSets, evaluateSession } from './progression'
import { buildWeekPlan } from './plan'
import { getWorkout, HIIT_WORKOUT, MAIN_WORKOUT_KEY, resolveBlocks } from './workouts'
import { getExercise } from './exercises'
import type { StrengthSession } from './types'

describe('Ganzkörper-Workout', () => {
  it('plant jede Krafteinheit der Woche als dasselbe Workout', () => {
    const plan = buildWeekPlan({ startDate: '2026-01-05', runsPerWeek: 2, strengthPerWeek: 2 })
    expect(plan.workoutKeys).toEqual([MAIN_WORKOUT_KEY, MAIN_WORKOUT_KEY])
  })

  it('behält in der Kurzform die vier Grundbewegungen und lässt den Rest weg', () => {
    const blocks = resolveBlocks(getWorkout(MAIN_WORKOUT_KEY), [], true)
    const patterns = blocks.map((b) => getExercise(b.exerciseKey).pattern)
    expect(patterns).toEqual(['pull_vertical', 'push_horizontal', 'knee', 'hinge'])
    expect(blocks.every((b) => b.sets === 2)).toBe(true)
  })

  it('findet ältere A/B-Einheiten weiterhin, damit der Verlauf lesbar bleibt', () => {
    expect(getWorkout('A').name).toMatch(/Workout A/)
    expect(getWorkout('B').name).toMatch(/Workout B/)
  })
})

describe('HIIT-Zirkel', () => {
  it('legt die Intervalle Runde für Runde an, nicht Übung für Übung', () => {
    const sets = buildSets(HIIT_WORKOUT, [], false)
    const perRound = HIIT_WORKOUT.blocks.length
    expect(sets).toHaveLength(perRound * 4)
    // Erste Runde: jede Übung einmal, alle mit Rundenindex 0.
    expect(sets.slice(0, perRound).map((s) => s.exerciseKey)).toEqual(
      HIIT_WORKOUT.blocks.map((b) => b.exerciseKey),
    )
    expect(sets.slice(0, perRound).every((s) => s.setIndex === 0)).toBe(true)
    expect(sets[perRound].setIndex).toBe(1)
    expect(sets.every((s) => s.target === HIIT_WORKOUT.interval!.workSec)).toBe(true)
  })

  it('steigert keine Vorgaben', () => {
    const session: StrengthSession = {
      id: 1,
      date: '2026-10-20',
      templateKey: HIIT_WORKOUT.key,
      name: HIIT_WORKOUT.name,
      status: 'done',
      deload: false,
      startedAt: 0,
      sets: buildSets(HIIT_WORKOUT, [], false).map((s) => ({ ...s, done: true, actual: 40 })),
    }
    expect(evaluateSession(session, [])).toEqual({ nextStates: [], changes: [] })
  })
})
