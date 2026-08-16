import Dexie, { type Table } from 'dexie'
import type {
  BodyLog,
  ExerciseState,
  Match,
  RunSession,
  Settings,
  StrengthSession,
} from '../domain/types'
import { todayISO } from '../lib/date'

/**
 * Local-First: Alle Daten liegen in der IndexedDB des Geräts. Kein Server, kein
 * Account, keine laufenden Kosten — und die App funktioniert vollständig offline.
 * Der Preis dafür: Die Daten hängen an diesem Browser. Deshalb gibt es in den
 * Einstellungen einen Export, und die App erinnert nach 20 Einheiten daran.
 */
export class TrainerDB extends Dexie {
  settings!: Table<Settings, number>
  strengthSessions!: Table<StrengthSession, number>
  runSessions!: Table<RunSession, number>
  exerciseStates!: Table<ExerciseState, string>
  bodyLogs!: Table<BodyLog, number>
  matches!: Table<Match, number>

  constructor() {
    super('schiri-trainer')
    this.version(1).stores({
      settings: 'id',
      strengthSessions: '++id, date, templateKey, status',
      runSessions: '++id, date, planKey, type',
      exerciseStates: 'key',
      bodyLogs: '++id, date',
    })

    // Version 2: Spielprotokoll dazu, plus die Leistungsdaten in den Einstellungen.
    this.version(2)
      .stores({
        matches: '++id, date',
      })
      .upgrade(async (tx) => {
        const settings = await tx.table('settings').get(1)
        if (settings) {
          await tx.table('settings').put({ ...PERFORMANCE_DEFAULTS, ...settings, id: 1 })
        }
      })

    // Version 3: Übungsauswahl. Bestehende Installationen starten mit allen aktiv.
    this.version(3).upgrade(async (tx) => {
      const settings = await tx.table('settings').get(1)
      if (settings && !Array.isArray(settings.disabledExercises)) {
        await tx.table('settings').put({ ...settings, disabledExercises: [], id: 1 })
      }
    })

    // Version 4: Wunschübung je Bewegungsmuster.
    this.version(4).upgrade(async (tx) => {
      const settings = await tx.table('settings').get(1)
      if (settings && typeof settings.exercisePreferences !== 'object') {
        await tx.table('settings').put({ ...settings, exercisePreferences: {}, id: 1 })
      }
    })
  }
}

/**
 * Platzhalter-Leistungsdaten, damit die App vom ersten Start an rechnen kann.
 *
 * Das sind bewusst **generische Werte**, nicht die von irgendjemandem. Alle Puls- und
 * Tempovorgaben leiten sich daraus ab, also müssen sie ersetzt werden, bevor der Plan
 * etwas taugt. Solange `testDate` leer ist, gilt die Konfiguration als offen, und die
 * App weist an mehreren Stellen darauf hin.
 */
export const PERFORMANCE_DEFAULTS = {
  hrMax: 185,
  hrRest: 60,
  testPaceSecPerKm: 330, // 5:30 min/km
  testDistanceKm: 5,
  testDate: '',
}

/** Hat der Nutzer eigene Leistungsdaten hinterlegt, oder laufen noch die Platzhalter? */
export function hasOwnPerformanceData(settings: Settings): boolean {
  return settings.testDate !== ''
}

export const db = new TrainerDB()

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  name: '',
  startDate: todayISO(),
  runsPerWeek: 2,
  strengthPerWeek: 2,
  soundEnabled: true,
  vibrationEnabled: true,
  keepScreenAwake: true,
  disabledExercises: [],
  exercisePreferences: {},
  ...PERFORMANCE_DEFAULTS,
}

/** Legt beim ersten Start die Einstellungen an. Idempotent. */
export async function ensureSettings(): Promise<Settings> {
  const existing = await db.settings.get(1)
  if (existing) return existing
  const fresh = { ...DEFAULT_SETTINGS, startDate: todayISO() }
  await db.settings.put(fresh)
  return fresh
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const current = await ensureSettings()
  await db.settings.put({ ...current, ...patch, id: 1 })
}

// ---------------------------------------------------------------------------
// Sicherung
// ---------------------------------------------------------------------------

export interface BackupFile {
  format: 'schiri-trainer-backup'
  version: 1
  exportedAt: string
  settings: Settings | undefined
  strengthSessions: StrengthSession[]
  runSessions: RunSession[]
  exerciseStates: ExerciseState[]
  bodyLogs: BodyLog[]
  matches: Match[]
}

export async function exportBackup(): Promise<BackupFile> {
  const [settings, strengthSessions, runSessions, exerciseStates, bodyLogs, matches] =
    await Promise.all([
      db.settings.get(1),
      db.strengthSessions.toArray(),
      db.runSessions.toArray(),
      db.exerciseStates.toArray(),
      db.bodyLogs.toArray(),
      db.matches.toArray(),
    ])
  return {
    format: 'schiri-trainer-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    strengthSessions,
    runSessions,
    exerciseStates,
    bodyLogs,
    matches,
  }
}

export interface ImportResult {
  strengthSessions: number
  runSessions: number
  bodyLogs: number
  matches: number
}

/**
 * Spielt eine Sicherung ein und ersetzt dabei den kompletten Bestand.
 * Bewusst kein Zusammenführen: Beim Zusammenführen wären Duplikate praktisch
 * unvermeidbar, weil die IDs aus zwei Geräten kollidieren.
 */
export async function importBackup(raw: unknown): Promise<ImportResult> {
  const data = raw as Partial<BackupFile>
  if (!data || data.format !== 'schiri-trainer-backup') {
    throw new Error('Das ist keine gültige Sicherungsdatei des Schiri-Trainers.')
  }

  const strengthSessions = data.strengthSessions ?? []
  const runSessions = data.runSessions ?? []
  const bodyLogs = data.bodyLogs ?? []
  const matches = data.matches ?? []

  const tables = [
    db.settings,
    db.strengthSessions,
    db.runSessions,
    db.exerciseStates,
    db.bodyLogs,
    db.matches,
  ]

  await db.transaction('rw', tables, async () => {
    await Promise.all([
      db.strengthSessions.clear(),
      db.runSessions.clear(),
      db.exerciseStates.clear(),
      db.bodyLogs.clear(),
      db.matches.clear(),
    ])
    // Ältere Sicherungen kennen die Leistungsdaten noch nicht — Standardwerte
    // auffüllen, sonst stünden nach dem Einspielen überall Nullen in den Zonen.
    if (data.settings) {
      await db.settings.put({ ...DEFAULT_SETTINGS, ...data.settings, id: 1 })
    }
    if (strengthSessions.length) await db.strengthSessions.bulkPut(strengthSessions)
    if (runSessions.length) await db.runSessions.bulkPut(runSessions)
    if (data.exerciseStates?.length) await db.exerciseStates.bulkPut(data.exerciseStates)
    if (bodyLogs.length) await db.bodyLogs.bulkPut(bodyLogs)
    if (matches.length) await db.matches.bulkPut(matches)
  })

  return {
    strengthSessions: strengthSessions.length,
    runSessions: runSessions.length,
    bodyLogs: bodyLogs.length,
    matches: matches.length,
  }
}

export async function wipeAllData(): Promise<void> {
  const tables = [
    db.settings,
    db.strengthSessions,
    db.runSessions,
    db.exerciseStates,
    db.bodyLogs,
    db.matches,
  ]
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((t) => t.clear()))
  })
  await ensureSettings()
}
