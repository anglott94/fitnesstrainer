import { db } from './db'
import type { Match, RunSession, SetLog, StrengthSession } from '../domain/types'
import { getWorkout } from '../domain/workouts'
import { getExercise } from '../domain/exercises'
import { defaultLevel } from '../domain/assistance'
import { getRun } from '../domain/runs'
import { buildSets, evaluateSession, type ProgressionChange } from '../domain/progression'
import { todayISO } from '../lib/date'

// ---------------------------------------------------------------------------
// Krafttraining
// ---------------------------------------------------------------------------

export async function getActiveStrengthSession(): Promise<StrengthSession | undefined> {
  return db.strengthSessions.where('status').equals('active').first()
}

/**
 * Startet eine Einheit. Läuft bereits eine, wird diese zurückgegeben statt eine
 * zweite anzulegen — sonst entstünden beim doppelten Tippen zwei halbe Sessions.
 */
export async function startStrengthSession(
  templateKey: string,
  isDeload: boolean,
  isShort = false,
): Promise<number> {
  const running = await getActiveStrengthSession()
  if (running?.id) return running.id

  const template = getWorkout(templateKey)
  const [states, settings] = await Promise.all([
    db.exerciseStates.toArray(),
    db.settings.get(1),
  ])
  const session: StrengthSession = {
    date: todayISO(),
    templateKey,
    name: template.name,
    status: 'active',
    deload: isDeload,
    short: isShort,
    startedAt: Date.now(),
    sets: buildSets(
      template,
      states,
      isDeload,
      isShort,
      settings?.disabledExercises ?? [],
      settings?.exercisePreferences ?? {},
    ),
  }
  return (await db.strengthSessions.add(session)) as number
}

export async function patchSet(
  sessionId: number,
  exerciseKey: string,
  setIndex: number,
  patch: Partial<Pick<SetLog, 'actual' | 'done'>>,
): Promise<void> {
  await db.transaction('rw', db.strengthSessions, async () => {
    const session = await db.strengthSessions.get(sessionId)
    if (!session) return
    const sets = session.sets.map((s) =>
      s.exerciseKey === exerciseKey && s.setIndex === setIndex ? { ...s, ...patch } : s,
    )
    await db.strengthSessions.update(sessionId, { sets })
  })
}

/**
 * Setzt die Unterstützungsstufe für eine Übung. Bereits abgehakte Sätze behalten ihre
 * Stufe — sonst würde ein Bandwechsel mitten in der Einheit die Historie verfälschen.
 */
export async function setAssistLevel(
  sessionId: number,
  exerciseKey: string,
  assist: string,
): Promise<void> {
  await db.transaction('rw', db.strengthSessions, async () => {
    const session = await db.strengthSessions.get(sessionId)
    if (!session) return
    const sets = session.sets.map((s) =>
      s.exerciseKey === exerciseKey && !s.done ? { ...s, assist } : s,
    )
    await db.strengthSessions.update(sessionId, { sets })
  })
}

/** Hängt einen zusätzlichen Satz an eine Übung an, falls noch Luft nach oben ist. */
export async function addExtraSet(sessionId: number, exerciseKey: string): Promise<void> {
  await db.transaction('rw', db.strengthSessions, async () => {
    const session = await db.strengthSessions.get(sessionId)
    if (!session) return
    const forExercise = session.sets.filter((s) => s.exerciseKey === exerciseKey)
    if (forExercise.length === 0) return
    const last = forExercise[forExercise.length - 1]
    const extra: SetLog = {
      exerciseKey,
      setIndex: last.setIndex + 1,
      target: last.target,
      actual: null,
      done: false,
      assist: last.assist,
    }
    // Direkt hinter den letzten Satz derselben Übung einfügen.
    const insertAt = session.sets.lastIndexOf(last) + 1
    const sets = [...session.sets.slice(0, insertAt), extra, ...session.sets.slice(insertAt)]
    await db.strengthSessions.update(sessionId, { sets })
  })
}

export async function removeLastSet(sessionId: number, exerciseKey: string): Promise<void> {
  await db.transaction('rw', db.strengthSessions, async () => {
    const session = await db.strengthSessions.get(sessionId)
    if (!session) return
    const forExercise = session.sets.filter((s) => s.exerciseKey === exerciseKey)
    if (forExercise.length <= 1) return
    const last = forExercise[forExercise.length - 1]
    const idx = session.sets.lastIndexOf(last)
    const sets = [...session.sets.slice(0, idx), ...session.sets.slice(idx + 1)]
    await db.strengthSessions.update(sessionId, { sets })
  })
}

export async function finishStrengthSession(
  sessionId: number,
  meta: { rpe?: number; notes?: string },
): Promise<ProgressionChange[]> {
  return db.transaction('rw', [db.strengthSessions, db.exerciseStates], async () => {
    const session = await db.strengthSessions.get(sessionId)
    if (!session) return []

    const finished: StrengthSession = {
      ...session,
      status: 'done',
      finishedAt: Date.now(),
      rpe: meta.rpe,
      notes: meta.notes,
    }

    const states = await db.exerciseStates.toArray()
    const { nextStates, changes } = evaluateSession(finished, states)

    await db.strengthSessions.put(finished)
    await db.exerciseStates.bulkPut(nextStates)
    return changes
  })
}

export async function deleteStrengthSession(sessionId: number): Promise<void> {
  await db.strengthSessions.delete(sessionId)
}

export async function countCompletedStrengthSessions(): Promise<number> {
  return db.strengthSessions.where('status').equals('done').count()
}

// ---------------------------------------------------------------------------
// Laufen
// ---------------------------------------------------------------------------

export async function logRun(input: {
  planKey: string
  date: string
  distanceKm?: number
  durationSec?: number
  avgHr?: number
  rpe?: number
  notes?: string
}): Promise<number> {
  const template = getRun(input.planKey)
  const session: RunSession = {
    date: input.date,
    planKey: input.planKey,
    name: template.name,
    type: template.type,
    distanceKm: input.distanceKm,
    durationSec: input.durationSec,
    avgHr: input.avgHr,
    rpe: input.rpe,
    notes: input.notes,
    createdAt: Date.now(),
  }
  return (await db.runSessions.add(session)) as number
}

export async function updateRun(id: number, patch: Partial<RunSession>): Promise<void> {
  await db.runSessions.update(id, patch)
}

export async function deleteRun(id: number): Promise<void> {
  await db.runSessions.delete(id)
}

// ---------------------------------------------------------------------------
// Übungsvorgaben von Hand setzen
// ---------------------------------------------------------------------------

/**
 * Setzt Vorgabe und Unterstützungsstufe einer Übung direkt.
 *
 * Nötig immer dann, wenn die Automatik keinen Anhaltspunkt hat: beim Wechsel auf
 * eine andere Übung desselben Musters, nach einer längeren Pause oder wenn der
 * Startwert einfach nicht passt. Ohne das müsste man sich über mehrere Einheiten
 * mit je einer Wiederholung an den richtigen Wert herantasten.
 */
export async function setExerciseTarget(
  key: string,
  patch: { target?: number; assist?: string },
): Promise<void> {
  const ex = getExercise(key)
  const existing = await db.exerciseStates.get(key)
  const target = patch.target ?? existing?.target ?? ex.startTarget
  const assist = patch.assist ?? existing?.assist ?? defaultLevel(ex.assistLadder)

  await db.exerciseStates.put({
    key,
    target: Math.max(1, ex.maxTarget !== undefined ? Math.min(ex.maxTarget, target) : target),
    bestSet: existing?.bestSet ?? 0,
    // Bei einem Stufenwechsel von Hand gilt der bisherige Stufen-Bestwert nicht mehr.
    bestSetOnAssist: assist === existing?.assist ? (existing?.bestSetOnAssist ?? 0) : 0,
    assist,
    updatedAt: Date.now(),
  })
}

// ---------------------------------------------------------------------------
// Spiele
// ---------------------------------------------------------------------------

export async function logMatch(input: Omit<Match, 'id' | 'createdAt'>): Promise<number> {
  return (await db.matches.add({ ...input, createdAt: Date.now() })) as number
}

export async function deleteMatch(id: number): Promise<void> {
  await db.matches.delete(id)
}

// ---------------------------------------------------------------------------
// Körperdaten
// ---------------------------------------------------------------------------

export async function upsertBodyLog(entry: {
  date: string
  weightKg?: number
  restingHr?: number
  note?: string
}): Promise<void> {
  const existing = await db.bodyLogs.where('date').equals(entry.date).first()
  if (existing?.id) {
    await db.bodyLogs.update(existing.id, entry)
  } else {
    await db.bodyLogs.add(entry)
  }
}

export async function deleteBodyLog(id: number): Promise<void> {
  await db.bodyLogs.delete(id)
}
