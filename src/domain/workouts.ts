import type { TemplateBlock, WorkoutTemplate } from './types'
import { exercisesForPattern, getExercise } from './exercises'

/**
 * Zwei Ganzkörper-Workouts im Wechsel (A, B, A, B ...).
 *
 * ── Warum kein Split ───────────────────────────────────────────────────────
 *
 * Jede Einheit enthält einen Druck, einen Zug, eine knie- und eine hüftdominante
 * Beinübung. Physiologisch wäre ein Split gleichwertig: Sobald das Wochenvolumen
 * gleich bleibt, macht es für Kraft und Muskelaufbau keinen belegbaren Unterschied,
 * ob eine Übung einmal mit vier Sätzen oder zweimal mit zwei Sätzen trainiert wird
 * (Schoenfeld et al., J Sports Sci 2019).
 *
 * Der Grund ist ein organisatorischer: Bei ein bis zwei Einheiten pro Woche fällt
 * regelmäßig eine aus. Mit einem Split hieße das, in dieser Woche gar nicht gezogen
 * oder gar nicht gedrückt zu haben — bei zwei geplanten Einheiten mit 50 Prozent
 * Wahrscheinlichkeit. Vollständige Einheiten machen den Plan gegen Ausfälle robust.
 *
 * Gegen das Zusammenlegen spricht auch nichts: Druck und Zug sind Gegenspieler und
 * ermüden sich gegenseitig kaum. Wer Zeit sparen will, kann Klimmzüge und
 * Liegestütze im Wechsel mit kürzerer Pause ausführen.
 *
 * ── Reihenfolge ────────────────────────────────────────────────────────────
 *
 * 1. Sprünge — brauchen ein ausgeruhtes Nervensystem, kosten kaum Kraft.
 * 2. Zugbewegung — die limitierende Übung, deshalb vor dem Drücken.
 * 3. Druckbewegung, dann Beine, dann Vorsorge und Rumpf.
 *
 * ── Kurzform ───────────────────────────────────────────────────────────────
 *
 * `shortSets: 0` heißt: Diese Übung entfällt, wenn die Zeit knapp ist. Erhalten
 * bleiben die vier Grundmuster plus der Sprung — Vorsorge- und Rumpfarbeit fällt
 * zuerst weg, weil sie sich am ehesten nebenbei nachholen lässt.
 */
export const WORKOUTS: WorkoutTemplate[] = [
  {
    key: 'A',
    name: 'Workout A — Klimmzüge & Liegestütze',
    focus: 'Sprung, Zug senkrecht, Druck waagerecht, Knie, Hamstrings, Wade, Rumpf',
    approxMinutes: 38,
    shortApproxMinutes: 25,
    warmup: [
      '20× Armkreisen vorwärts und rückwärts',
      '10× Schulterblätter im Hängen nach unten ziehen und wieder lösen',
      '15 Kniebeugen ohne Gewicht, langsam und tief',
      '30 Sekunden auf der Stelle laufen mit Kniehub',
    ],
    blocks: [
      {
        exerciseKey: 'cmj',
        sets: 3,
        shortSets: 2,
        restSec: 75,
        note: 'Jeder Sprung maximal — lieber weniger als unsauber. Diesen Block überspringen, wenn du heute schon eine Kombi-Einheit mit Sprints gelaufen bist.',
      },
      {
        exerciseKey: 'pullup',
        sets: 4,
        shortSets: 3,
        restSec: 120,
        note: 'Steht bewusst vor den Liegestützen: die limitierende Übung gehört an die frischeste Stelle.',
      },
      { exerciseKey: 'pushup', sets: 4, shortSets: 3, restSec: 90 },
      { exerciseKey: 'split_squat', sets: 3, shortSets: 2, restSec: 90, note: 'Vorgabe gilt je Bein' },
      {
        exerciseKey: 'nordic_curl',
        sets: 3,
        shortSets: 2,
        restSec: 90,
        note: 'Absenken betont langsam — das ist die eigentliche Übung. In den ersten zwei Wochen bewusst nur halbe Bewegung: Diese Übung erzeugt stärkeren Muskelkater als alles andere im Plan.',
      },
      {
        exerciseKey: 'calf_raise',
        sets: 3,
        shortSets: 0,
        restSec: 60,
        note: 'Vorgabe gilt je Bein — betont langsam ablassen',
      },
      {
        exerciseKey: 'dead_bug',
        sets: 3,
        shortSets: 0,
        restSec: 45,
        note: 'Wiederholungen je Seite gezählt',
        altPatterns: ['core_antirotation'],
      },
    ],
    cooldown: [
      '30 Sekunden Wadendehnung je Seite an der Wand',
      '30 Sekunden Hüftbeuger-Dehnung je Seite im Ausfallschritt',
      '30 Sekunden Brustdehnung im Türrahmen',
    ],
  },
  {
    key: 'B',
    name: 'Workout B — Rudern & Überkopfdrücken',
    focus: 'Sprung, Zug waagerecht, Druck über Kopf, Knie, Beinrückseite, Leiste, Rumpf',
    approxMinutes: 34,
    shortApproxMinutes: 24,
    warmup: [
      '20× Armkreisen vorwärts und rückwärts',
      '10 Hüftbrücken beidbeinig',
      '10 Good Mornings ohne Gewicht',
      '30 Sekunden Anfersen auf der Stelle',
    ],
    blocks: [
      {
        exerciseKey: 'lateral_hop',
        sets: 3,
        shortSets: 2,
        restSec: 75,
        note: 'Vorgabe gilt je Bein. Erst wenn die Landung sicher steht, schneller springen. Überspringen, wenn heute schon eine Kombi-Einheit mit Sprints gelaufen wurde.',
      },
      {
        exerciseKey: 'row_inverted',
        sets: 3,
        shortSets: 2,
        restSec: 90,
        note: 'Der direkte Gegenspieler zum Liegestütz — steht deshalb vor dem Drücken.',
      },
      { exerciseKey: 'pike_pushup', sets: 3, shortSets: 2, restSec: 75 },
      { exerciseKey: 'lunge_walk', sets: 3, shortSets: 2, restSec: 90, note: 'Vorgabe gilt je Bein' },
      {
        exerciseKey: 'sl_rdl',
        sets: 3,
        shortSets: 2,
        restSec: 45,
        note: 'Vorgabe gilt je Bein, langsam und kontrolliert',
      },
      {
        exerciseKey: 'copenhagen',
        sets: 3,
        shortSets: 0,
        restSec: 45,
        note: 'Sekunden je Seite',
        altPatterns: ['abduction'],
      },
      {
        exerciseKey: 'side_plank',
        sets: 3,
        shortSets: 0,
        restSec: 45,
        note: 'Sekunden je Seite',
        altPatterns: ['core_antirotation', 'abduction'],
      },
    ],
    cooldown: [
      '30 Sekunden Hamstring-Dehnung je Seite',
      '30 Sekunden Gesäßdehnung je Seite im Sitzen',
      '30 Sekunden Lat-Dehnung je Seite im Hängen oder an der Türzarge',
    ],
  },
]

/**
 * Was in der Kurzform wegfällt — wird im Trainingsbildschirm angezeigt, damit klar
 * ist, dass es eine bewusste Auswahl ist und nicht einfach abgebrochen wurde.
 */
export const SHORT_NOTE =
  'Kurzform: Sprung, Zug, Druck und beide Beinmuster bleiben — also alles, was die Einheit ' +
  'vollständig macht. Vorsorge- und Rumpfarbeit entfällt; die lässt sich am ehesten nebenbei ' +
  'nachholen. Das Aufwärmen wird nicht gekürzt — vor Sprüngen ist das der Teil, an dem man nicht spart.'

export const WORKOUT_BY_KEY: Record<string, WorkoutTemplate> = Object.fromEntries(
  WORKOUTS.map((w) => [w.key, w]),
)

export function getWorkout(key: string): WorkoutTemplate {
  const w = WORKOUT_BY_KEY[key]
  if (!w) throw new Error(`Unbekanntes Workout: ${key}`)
  return w
}

/** Blöcke der gewählten Variante, mit der jeweils gültigen Satzzahl. */
export function activeBlocks(template: WorkoutTemplate, isShort: boolean) {
  return template.blocks
    .map((block) => ({ ...block, sets: isShort ? block.shortSets : block.sets }))
    .filter((block) => block.sets > 0)
}

export interface ResolvedBlock extends TemplateBlock {
  /** Ist eine andere Übung eingesprungen, weil die vorgesehene abgewählt ist? */
  substitutedFor?: string
}

/**
 * Setzt die abgewählten Übungen in konkrete Blöcke um.
 *
 * Ist die vorgesehene Übung abgewählt, rückt die erste noch aktive Übung desselben
 * Bewegungsmusters nach — der Plan behält also seine Struktur, auch wenn einzelne
 * Übungen nicht gefallen. Erst wenn ein ganzes Muster abgewählt ist, entfällt der
 * Block; darauf weist die Übungsauswahl vorher hin.
 */
export function resolveBlocks(
  template: WorkoutTemplate,
  disabled: readonly string[],
  isShort = false,
): ResolvedBlock[] {
  const off = new Set(disabled)
  const used = new Set<string>()
  const result: ResolvedBlock[] = []

  for (const block of activeBlocks(template, isShort)) {
    const planned = block.exerciseKey
    if (!off.has(planned) && !used.has(planned)) {
      used.add(planned)
      result.push(block)
      continue
    }

    // Erst im eigenen Muster suchen, dann in den zugelassenen Ersatzmustern.
    const candidates = [getExercise(planned).pattern, ...(block.altPatterns ?? [])]
    let standIn: { key: string } | undefined
    for (const pattern of candidates) {
      standIn = exercisesForPattern(pattern).find((e) => !off.has(e.key) && !used.has(e.key))
      if (standIn) break
    }
    if (!standIn) continue // alles abgewählt oder schon belegt

    used.add(standIn.key)
    // Der Hinweistext gehört zur ursprünglichen Übung und passt sonst nicht mehr.
    result.push({ ...block, exerciseKey: standIn.key, note: undefined, substitutedFor: planned })
  }

  return result
}
