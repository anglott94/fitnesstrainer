import { describe, expect, it } from 'vitest'
import { evaluateSession, sessionVolume } from './progression'
import type { ExerciseState, SetLog, StrengthSession } from './types'

/**
 * Die Progression ist die einzige Stelle, an der die App eigenständig Entscheidungen
 * über das Training trifft — und Fehler hier fallen erst Wochen später auf, weil sich
 * eine falsche Vorgabe leise fortschreibt. Deshalb sind genau diese fünf Zweige
 * abgedeckt: hoch, runter, halten, Obergrenze, Bandwechsel.
 */

function set(partial: Partial<SetLog> & Pick<SetLog, 'exerciseKey' | 'setIndex'>): SetLog {
  return {
    target: 10,
    actual: null,
    done: false,
    ...partial,
  }
}

function session(sets: SetLog[], deload = false): StrengthSession {
  return {
    id: 1,
    date: '2026-08-16',
    templateKey: 'A',
    name: 'Testeinheit',
    status: 'done',
    deload,
    startedAt: 0,
    sets,
  }
}

function state(key: string, target: number, assist?: string): ExerciseState {
  return { key, target, bestSet: 0, updatedAt: 0, assist }
}

describe('evaluateSession', () => {
  it('zählt nur abgehakte Sätze — ein eingestellter, aber nicht abgehakter Satz erhöht nichts', () => {
    // Genau der Fall aus der Praxis: An den Steppern gedreht, dann die Übung
    // abgebrochen. `actual` steht in der Datenbank, `done` nicht.
    const s = session([
      set({ exerciseKey: 'pushup', setIndex: 0, target: 12, actual: 12, done: false }),
      set({ exerciseKey: 'pushup', setIndex: 1, target: 12, actual: 12, done: false }),
    ])

    const { nextStates, changes } = evaluateSession(s, [state('pushup', 12)])

    expect(nextStates[0].target).toBe(12)
    expect(changes).toHaveLength(0)
  })

  it('setzt keinen Bestwert aus einem nicht abgehakten Satz', () => {
    const s = session([
      set({ exerciseKey: 'pushup', setIndex: 0, target: 12, actual: 30, done: false }),
    ])

    const { nextStates } = evaluateSession(s, [state('pushup', 12)])

    expect(nextStates[0].bestSet).toBe(0)
  })

  it('erhöht die Vorgabe, wenn alle Sätze abgehakt und erreicht sind', () => {
    const s = session([
      set({ exerciseKey: 'pushup', setIndex: 0, target: 12, actual: 12, done: true }),
      set({ exerciseKey: 'pushup', setIndex: 1, target: 12, actual: 13, done: true }),
    ])

    const { nextStates, changes } = evaluateSession(s, [state('pushup', 12)])

    // increment ist 2 bei Liegestützen
    expect(nextStates[0].target).toBe(14)
    expect(changes[0].direction).toBe('up')
    expect(nextStates[0].bestSet).toBe(13)
  })

  it('senkt die Vorgabe, wenn die Mehrheit der Sätze deutlich darunter liegt', () => {
    const s = session([
      set({ exerciseKey: 'pushup', setIndex: 0, target: 12, actual: 5, done: true }),
      set({ exerciseKey: 'pushup', setIndex: 1, target: 12, actual: 6, done: true }),
      set({ exerciseKey: 'pushup', setIndex: 2, target: 12, actual: 12, done: true }),
    ])

    const { nextStates, changes } = evaluateSession(s, [state('pushup', 12)])

    expect(nextStates[0].target).toBe(10)
    expect(changes[0].direction).toBe('down')
  })

  it('hält die Vorgabe, wenn knapp verfehlt wurde', () => {
    // 11 von 12 ist über der 80-Prozent-Schwelle: kein Rückschritt, aber auch
    // kein Aufstieg, weil nicht alle Sätze standen.
    const s = session([
      set({ exerciseKey: 'pushup', setIndex: 0, target: 12, actual: 11, done: true }),
      set({ exerciseKey: 'pushup', setIndex: 1, target: 12, actual: 12, done: true }),
    ])

    const { nextStates, changes } = evaluateSession(s, [state('pushup', 12)])

    expect(nextStates[0].target).toBe(12)
    expect(changes).toHaveLength(0)
  })

  it('steigert an der Obergrenze nicht weiter, sondern verweist auf die schwerere Variante', () => {
    const s = session([
      set({ exerciseKey: 'pushup', setIndex: 0, target: 25, actual: 25, done: true }),
      set({ exerciseKey: 'pushup', setIndex: 1, target: 25, actual: 26, done: true }),
    ])

    const { nextStates, changes } = evaluateSession(s, [state('pushup', 25)])

    expect(nextStates[0].target).toBe(25)
    expect(changes[0].direction).toBe('cap')
  })

  it('wechselt auf das nächste Band, wenn die Stufe ausgereizt ist', () => {
    const s = session([
      set({
        exerciseKey: 'pullup',
        setIndex: 0,
        target: 10,
        actual: 10,
        done: true,
        assist: 'band_orange',
      }),
      set({
        exerciseKey: 'pullup',
        setIndex: 1,
        target: 10,
        actual: 10,
        done: true,
        assist: 'band_orange',
      }),
    ])

    const { nextStates, changes } = evaluateSession(s, [state('pullup', 10, 'band_orange')])

    expect(nextStates[0].assist).toBe('band_gelb')
    // Die Wiederholungen fallen zurück — genau das ist der Fortschritt.
    expect(nextStates[0].target).toBe(5)
    expect(changes[0].direction).toBe('assist')
  })

  it('leitet aus gemischten Bandstufen keinen Fortschritt ab', () => {
    const s = session([
      set({
        exerciseKey: 'pullup',
        setIndex: 0,
        target: 10,
        actual: 10,
        done: true,
        assist: 'band_orange',
      }),
      set({
        exerciseKey: 'pullup',
        setIndex: 1,
        target: 10,
        actual: 10,
        done: true,
        assist: 'band_gelb',
      }),
    ])

    const { nextStates, changes } = evaluateSession(s, [state('pullup', 10, 'band_orange')])

    expect(nextStates[0].target).toBe(10)
    expect(nextStates[0].assist).toBe('band_orange')
    expect(changes).toHaveLength(0)
  })

  it('lässt die Vorgabe in der Entlastungswoche unverändert', () => {
    const s = session(
      [
        set({ exerciseKey: 'pushup', setIndex: 0, target: 9, actual: 9, done: true }),
        set({ exerciseKey: 'pushup', setIndex: 1, target: 9, actual: 9, done: true }),
      ],
      true,
    )

    const { nextStates, changes } = evaluateSession(s, [state('pushup', 12)])

    expect(nextStates[0].target).toBe(12)
    expect(changes).toHaveLength(0)
  })
})

describe('sessionVolume', () => {
  it('zählt nur abgehakte Sätze', () => {
    const s = session([
      set({ exerciseKey: 'pushup', setIndex: 0, target: 12, actual: 12, done: true }),
      set({ exerciseKey: 'pushup', setIndex: 1, target: 12, actual: 12, done: false }),
    ])

    expect(sessionVolume(s)).toBe(12)
  })

  it('zählt einseitige Übungen doppelt', () => {
    const s = session([
      set({ exerciseKey: 'lateral_hop', setIndex: 0, target: 6, actual: 6, done: true }),
    ])

    expect(sessionVolume(s)).toBe(12)
  })
})
