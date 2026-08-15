import type { Zones } from './zones'

// ---------------------------------------------------------------------------
// Übungs-Bibliothek (statischer Inhalt, liegt NICHT in der Datenbank)
// ---------------------------------------------------------------------------

export type Unit = 'reps' | 'seconds'

export interface Exercise {
  key: string
  name: string
  /** Bewegungsmuster — siehe patterns.ts. Bestimmt, welche Übungen einander ersetzen können. */
  pattern: string
  /** Wird die Übung pro Seite gezählt? Dann meint eine Satz-Eingabe „je Seite". */
  unilateral: boolean
  unit: Unit
  /** Wofür die Übung gesundheitlich gut ist — der eigentliche Grund, sie zu machen. */
  why: string
  /** Aufbau und Ausgangsposition. */
  setup: string
  /** Kurze Ausführungshinweise während des Satzes. */
  cues: string[]
  /** Leichtere Variante, wenn die Vorgabe nicht zu schaffen ist. */
  easier: string
  /** Schwerere Variante, wenn es zu leicht wird. */
  harder: string
  /**
   * Übung wird mit abgestufter Unterstützung trainiert (Schlüssel in LADDERS,
   * aktuell nur 'band'). Dann hängt an jedem Satz die verwendete Stufe.
   */
  assistLadder?: string
  /** Wiederholungszahl, ab der auf die nächst schwerere Stufe gewechselt wird. */
  assistStepUpAt?: number
  /** Vorgabe nach einem Stufenwechsel — die Wiederholungen fallen dabei bewusst. */
  assistResetTarget?: number

  /** Startvorgabe beim allerersten Training. */
  startTarget: number
  /** Um wie viel die Vorgabe pro erfolgreichem Training steigt. */
  increment: number
  /**
   * Obergrenze für die automatische Steigerung. Bei Sprüngen ist mehr nicht besser:
   * Jenseits weniger, wirklich maximaler Wiederholungen wird aus Explosivtraining
   * Ausdauertraining. Ist die Grenze erreicht, verweist die App auf die schwerere
   * Variante statt weiter hochzuzählen.
   */
  maxTarget?: number
}

// ---------------------------------------------------------------------------
// Kraft-Trainingspläne
// ---------------------------------------------------------------------------

export interface TemplateBlock {
  exerciseKey: string
  sets: number
  /** Sätze in der Kurzform. 0 bedeutet: Übung entfällt, wenn die Zeit knapp ist. */
  shortSets: number
  restSec: number
  note?: string
  /**
   * Bewegungsmuster, die für diesen Block ebenfalls in Frage kommen, wenn das
   * eigene komplett abgewählt ist. Damit bleibt der Platz im Plan besetzt, statt
   * ersatzlos zu entfallen — und die optionalen Muster sind überhaupt erreichbar.
   */
  altPatterns?: string[]
}

export interface WorkoutTemplate {
  key: string
  name: string
  focus: string
  approxMinutes: number
  shortApproxMinutes: number
  warmup: string[]
  blocks: TemplateBlock[]
  cooldown: string[]
}

// ---------------------------------------------------------------------------
// Laufeinheiten
// ---------------------------------------------------------------------------

export type RunType = 'kombi' | 'intervall' | 'tempo' | 'fahrtspiel' | 'dauerlauf' | 'regeneration'

/**
 * Die Inhalte sind Funktionen der persönlichen Zonen, keine festen Texte: So steht
 * in jeder Einheit direkt der eigene Zielpuls und das eigene Zieltempo, statt
 * „zügig" — und wenn sich nach dem nächsten Test die Leistungsdaten ändern, ziehen
 * alle Vorgaben automatisch nach.
 */
/** Konkrete Durchführung einer Laufeinheit — es gibt sie in voller Länge und als Kurzform. */
export interface RunVariant {
  approxMinutes: number
  /** Zone des Hauptteils — steuert die Anzeige der Puls- und Tempovorgabe. */
  mainZone: string | null
  warmup: (zones: Zones) => string[]
  main: (zones: Zones) => string[]
  cooldown: (zones: Zones) => string[]
  /** Kompakte Fassung zum Eintippen in die Garmin-Uhr. */
  garmin: (zones: Zones) => string[]
  /** Ziel-Anstrengung als Ergänzung zu Puls und Tempo. */
  effort: (zones: Zones) => string
}

export interface RunTemplate {
  key: string
  name: string
  type: RunType
  /** Wofür diese Einheit im Schiri-Kontext gut ist. */
  why: string
  /** Sportwissenschaftlicher Hintergrund, wo es einen belastbaren gibt. */
  evidence?: string
  full: RunVariant
  /**
   * Kurzform für Tage mit wenig Zeit. Behält den Trainingszweck bei, kürzt Umfang
   * statt Intensität — ein halb so langes, aber gleich intensives Intervalltraining
   * wirkt weit mehr als ein gleich langer, aber lascher Lauf.
   */
  short: RunVariant
  /** Kurze Begründung, was in der Kurzform wegfällt und warum das vertretbar ist. */
  shortNote: string
}

// ---------------------------------------------------------------------------
// Gespeicherte Daten (IndexedDB)
// ---------------------------------------------------------------------------

export interface SetLog {
  exerciseKey: string
  setIndex: number
  /** Vorgabe für diesen Satz (Wiederholungen oder Sekunden). */
  target: number
  /** Tatsächlich geschafft. null = noch nicht eingetragen. */
  actual: number | null
  done: boolean
  /** Verwendete Unterstützungsstufe, z. B. 'band_orange'. Nur bei Übungen mit Ladder. */
  assist?: string
}

export interface StrengthSession {
  id?: number
  /** ISO-Datum yyyy-mm-dd in lokaler Zeit. */
  date: string
  templateKey: string
  name: string
  status: 'active' | 'done'
  /** Entlastungswoche? Dann wird die Progression nicht hochgezählt. */
  deload: boolean
  /** Kurzform mit reduziertem Umfang. Ältere Einträge kennen das Feld noch nicht. */
  short?: boolean
  startedAt: number
  finishedAt?: number
  sets: SetLog[]
  rpe?: number
  notes?: string
}

export interface RunSession {
  id?: number
  date: string
  planKey: string
  name: string
  type: RunType
  distanceKm?: number
  durationSec?: number
  avgHr?: number
  rpe?: number
  notes?: string
  createdAt: number
}

/** Aktuelle Leistungsvorgabe pro Übung — wächst mit dir mit. */
export interface ExerciseState {
  key: string
  target: number
  bestSet: number
  updatedAt: number
  /** Aktuelle Unterstützungsstufe. Der Bestwert gilt immer bezogen auf diese Stufe. */
  assist?: string
  /** Bestwert auf der aktuellen Stufe — wird beim Stufenwechsel zurückgesetzt. */
  bestSetOnAssist?: number
}

export interface BodyLog {
  id?: number
  date: string
  weightKg?: number
  restingHr?: number
  note?: string
}

/** Selbsteinschätzung nach einem geleiteten Spiel. */
export interface Match {
  id?: number
  date: string
  competition: string
  /** Fokuspunkt 1 aus den Beobachterbögen, 1–5. */
  positioning: number
  /** Fokuspunkt 2 aus den Beobachterbögen, 1–5. */
  discipline: number
  distanceKm?: number
  avgHr?: number
  maxHr?: number
  /** Kurznotiz zur schwierigsten Szene — der Teil, aus dem man tatsächlich lernt. */
  keyScene?: string
  notes?: string
  createdAt: number
}

export interface Settings {
  id: number
  name: string
  /** Erster Trainingstag — Basis für die Wochen- und Blockzählung. */
  startDate: string
  runsPerWeek: number
  strengthPerWeek: number
  soundEnabled: boolean
  vibrationEnabled: boolean
  keepScreenAwake: boolean

  // --- Leistungsdaten, Grundlage aller Puls- und Tempovorgaben ---
  /**
   * Abgewählte Übungen. Ist eine Übung eines Workouts abgewählt, rückt automatisch
   * eine andere aus demselben Bewegungsmuster nach — so bleibt der Plan vollständig.
   */
  disabledExercises: string[]

  hrMax: number
  hrRest: number
  /** Tempo des letzten All-out-Tests in Sekunden pro Kilometer. */
  testPaceSecPerKm: number
  /** Distanz des letzten Tests in Kilometern — nur zur Einordnung. */
  testDistanceKm: number
  testDate: string
}
