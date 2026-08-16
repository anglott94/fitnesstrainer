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
 * Einstellungen einen Export, und die App erinnert daran, sobald seit der letzten
 * Sicherung `BACKUP_REMINDER_AFTER` neue Einträge dazugekommen sind.
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

/** Nach so vielen neuen Einträgen seit der letzten Sicherung wird erinnert. */
export const BACKUP_REMINDER_AFTER = 20

/**
 * Alles, was bei einem Verlust wirklich weh täte. Übungsvorgaben zählen nicht mit —
 * die leiten sich aus den Einheiten ab und wachsen nicht unabhängig.
 */
export function countBackupRelevantEntries(counts: {
  strengthSessions: number
  runSessions: number
  matches: number
  bodyLogs: number
}): number {
  return counts.strengthSessions + counts.runSessions + counts.matches + counts.bodyLogs
}

/** Merkt sich, dass gerade gesichert wurde. */
export async function markBackupDone(entryCount: number): Promise<void> {
  await updateSettings({ lastBackupAt: todayISO(), lastBackupEntryCount: entryCount })
}

export interface ImportResult {
  strengthSessions: number
  runSessions: number
  bodyLogs: number
  matches: number
  /** Datensätze, die die Prüfung nicht bestanden haben und übersprungen wurden. */
  skipped: number
}

/**
 * Prüft die Datensätze einer Sicherung, bevor sie den Bestand ersetzen.
 *
 * `format` allein reicht nicht: Eine abgeschnittene oder von Hand bearbeitete Datei
 * trägt die richtige Kennung und trotzdem Müll. Was die Prüfung nicht besteht, wird
 * übersprungen statt eingespielt — lieber ein unvollständiger Import als ein Bestand,
 * an dem die App später beim Rechnen abstürzt.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function pickValid<T>(raw: unknown, isValid: (row: Record<string, unknown>) => boolean): {
  rows: T[]
  skipped: number
} {
  if (!Array.isArray(raw)) return { rows: [], skipped: 0 }
  const rows: T[] = []
  let skipped = 0
  for (const row of raw) {
    if (isRecord(row) && isValid(row)) rows.push(row as T)
    else skipped++
  }
  return { rows, skipped }
}

const hasDate = (row: Record<string, unknown>) =>
  typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date)

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
  if (data.version !== 1) {
    throw new Error(
      `Diese Sicherung hat Version ${String(data.version)}, diese App kann Version 1 lesen.`,
    )
  }

  const strength = pickValid<StrengthSession>(
    data.strengthSessions,
    (r) => hasDate(r) && Array.isArray(r.sets) && typeof r.templateKey === 'string',
  )
  const runs = pickValid<RunSession>(
    data.runSessions,
    (r) => hasDate(r) && typeof r.planKey === 'string',
  )
  const body = pickValid<BodyLog>(data.bodyLogs, hasDate)
  const match = pickValid<Match>(data.matches, hasDate)
  const states = pickValid<ExerciseState>(
    data.exerciseStates,
    (r) => typeof r.key === 'string' && typeof r.target === 'number',
  )

  const skipped =
    strength.skipped + runs.skipped + body.skipped + match.skipped + states.skipped

  // Eine Datei, in der nichts Brauchbares steht, darf den Bestand nicht leeren.
  const total =
    strength.rows.length + runs.rows.length + body.rows.length + match.rows.length
  if (total === 0 && skipped > 0) {
    throw new Error('Die Sicherungsdatei enthält keine lesbaren Einträge. Nichts geändert.')
  }

  const strengthSessions = strength.rows
  const runSessions = runs.rows
  const bodyLogs = body.rows
  const matches = match.rows

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
    if (states.rows.length) await db.exerciseStates.bulkPut(states.rows)
    if (bodyLogs.length) await db.bodyLogs.bulkPut(bodyLogs)
    if (matches.length) await db.matches.bulkPut(matches)
  })

  return {
    strengthSessions: strengthSessions.length,
    runSessions: runSessions.length,
    bodyLogs: bodyLogs.length,
    matches: matches.length,
    skipped,
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
