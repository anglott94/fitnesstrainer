import type { TemplateBlock, WorkoutTemplate } from './types'
import { exercisesForPattern, getExercise } from './exercises'

/**
 * Ein festes Ganzkörper-Workout, das jedes Mal gleich abläuft.
 *
 * ── Warum immer dasselbe ──────────────────────────────────────────────────
 *
 * Bei ein bis zwei Einheiten pro Woche bringt ein Wechsel zwischen verschiedenen
 * Workouts vor allem eines: Jede Übung kommt nur alle ein bis zwei Wochen dran, und
 * fällt eine Einheit aus, sind es drei. Für Fortschritt zählt aber, dieselbe Übung
 * regelmäßig zu wiederholen. Ein einziges vollständiges Workout ist deshalb bei so
 * wenig Einheiten die robustere Wahl — jede Einheit trainiert alles.
 *
 * Physiologisch spricht nichts dagegen: Sobald das Wochenvolumen gleich bleibt, macht
 * es für Kraft und Muskelaufbau keinen belegbaren Unterschied, wie es sich auf die
 * Einheiten verteilt (Schoenfeld et al., J Sports Sci 2019).
 *
 * ── Reihenfolge ────────────────────────────────────────────────────────────
 *
 * 1. Sprünge — brauchen ein ausgeruhtes Nervensystem, kosten kaum Kraft.
 * 2. Zugbewegung — die limitierende Übung, deshalb vor dem Drücken.
 * 3. Druck und waagerechtes Ziehen als Gegenspieler direkt dahinter.
 * 4. Beine knie- und hüftdominant, dann Wade, Adduktoren und Rumpf.
 *
 * Das Rudern steht im Plan, obwohl schon Klimmzüge drin sind: Der Klimmzug ist der
 * Gegenspieler zum Überkopfdrücken, nicht zum Liegestütz. Die Muskeln, die die
 * Schulterblätter zusammenziehen, arbeiten beim waagerechten Ziehen deutlich stärker.
 *
 * ── Kurzform (rund 25 Minuten) ─────────────────────────────────────────────
 *
 * `shortSets: 0` heißt: Diese Übung entfällt, wenn die Zeit knapp ist. Es bleiben
 * die vier Grundbewegungen Zug, Druck, Knie und Hüfte mit vollen drei Sätzen.
 * Gespart wird über die Zahl der Übungen und kürzere Pausen (`shortRestSec`), nicht
 * über die Sätze — so bekommen die wichtigsten Übungen denselben Reiz wie sonst.
 */
export const MAIN_WORKOUT_KEY = 'GK'

export const WORKOUTS: WorkoutTemplate[] = [
  {
    key: MAIN_WORKOUT_KEY,
    name: 'Ganzkörper',
    focus: 'Sprung, Zug, Druck, Knie, Hüfte, Wade, Adduktoren, Rumpf',
    approxMinutes: 52,
    shortApproxMinutes: 25,
    warmup: [
      '20× Armkreisen vorwärts und rückwärts',
      '10× Schulterblätter im Hängen nach unten ziehen und wieder lösen',
      '15 Kniebeugen ohne Gewicht, langsam und tief',
      '10 Hüftbrücken beidbeinig',
      '30 Sekunden auf der Stelle laufen mit Kniehub',
    ],
    blocks: [
      {
        exerciseKey: 'cmj',
        sets: 3,
        shortSets: 0,
        restSec: 60,
        note: 'Jeder Sprung maximal — lieber weniger als unsauber. Diesen Block überspringen, wenn du heute schon eine Kombi-Einheit mit Sprints gelaufen bist.',
      },
      {
        exerciseKey: 'pullup',
        sets: 3,
        shortSets: 3,
        restSec: 120,
        shortRestSec: 75,
        note: 'Steht bewusst vor den Liegestützen: die limitierende Übung gehört an die frischeste Stelle.',
      },
      { exerciseKey: 'pushup', sets: 3, shortSets: 3, restSec: 90, shortRestSec: 60 },
      {
        exerciseKey: 'band_row',
        sets: 2,
        shortSets: 0,
        restSec: 75,
        note: 'Der direkte Gegenspieler zum Liegestütz: zieht die Schulterblätter wieder zusammen, was der Klimmzug nur wenig tut. Mit dem orangen Band starten. Wird es zu leicht, Band kürzer greifen oder stärkeres Band.',
      },
      {
        exerciseKey: 'split_squat',
        sets: 3,
        shortSets: 3,
        restSec: 90,
        shortRestSec: 60,
        note: 'Vorgabe gilt je Bein',
      },
      {
        exerciseKey: 'nordic_curl',
        sets: 3,
        shortSets: 3,
        restSec: 90,
        shortRestSec: 60,
        note: 'Absenken betont langsam — das ist die eigentliche Übung. Schützt die Beinrückseite beim Sprinten. In den ersten zwei Wochen nur halbe Bewegung: erzeugt stärkeren Muskelkater als alles andere im Plan.',
      },
      {
        exerciseKey: 'calf_raise',
        sets: 2,
        shortSets: 0,
        restSec: 45,
        note: 'Vorgabe gilt je Bein — betont langsam ablassen',
      },
      {
        exerciseKey: 'copenhagen',
        sets: 2,
        shortSets: 0,
        restSec: 45,
        note: 'Sekunden je Seite. Vorsorge für die Leiste bei vielen Richtungswechseln.',
        altPatterns: ['abduction'],
      },
      {
        exerciseKey: 'side_plank',
        sets: 2,
        shortSets: 0,
        restSec: 30,
        note: 'Sekunden je Seite',
        altPatterns: ['core_antirotation'],
      },
      {
        exerciseKey: 'dead_bug',
        sets: 2,
        shortSets: 0,
        restSec: 30,
        note: 'Wiederholungen je Seite gezählt',
        altPatterns: ['core_antirotation'],
      },
    ],
    cooldown: [
      '30 Sekunden Wadendehnung je Seite an der Wand',
      '30 Sekunden Hüftbeuger-Dehnung je Seite im Ausfallschritt',
      '30 Sekunden Hamstring-Dehnung je Seite',
      '30 Sekunden Brustdehnung im Türrahmen',
    ],
  },
]

/**
 * Optionales HIIT als Zirkel: Jede Übung 40 Sekunden, 20 Sekunden Pause, danach
 * die nächste. Nach jeder Runde eine Minute Pause.
 *
 * Ersetzt keine Krafteinheit im eigentlichen Sinn — mit Burpees und Sprüngen
 * wird keine Muskulatur so gefordert, dass sie stärker wird. Es ist eine kurze,
 * harte Konditionseinheit für Tage, an denen Abwechslung wichtiger ist als
 * Fortschritt. Deshalb gibt es hier auch keine automatische Steigerung: Mehr
 * geht, indem man innerhalb der 40 Sekunden mehr Wiederholungen schafft.
 */
export const HIIT_KEY = 'HIIT'

export const HIIT_WORKOUT: WorkoutTemplate = {
  key: HIIT_KEY,
  name: 'HIIT-Zirkel',
  focus: 'Burpees, Sprünge, Bergsteiger — hohe Herzfrequenz, Ganzkörper',
  approxMinutes: 25,
  shortApproxMinutes: 15,
  interval: { workSec: 40, restSec: 20, roundRestSec: 60 },
  warmup: [
    '1 Minute lockeres Hampelmann-Hüpfen',
    '10 Kniebeugen ohne Gewicht',
    '10 Liegestütze auf den Knien oder an der Wand',
    '20 Sekunden Skippings auf der Stelle, locker',
  ],
  blocks: [
    { exerciseKey: 'burpee', sets: 4, shortSets: 2, restSec: 20 },
    { exerciseKey: 'jump_squat', sets: 4, shortSets: 2, restSec: 20 },
    { exerciseKey: 'mountain_climber', sets: 4, shortSets: 2, restSec: 20 },
    { exerciseKey: 'skater_jump', sets: 4, shortSets: 2, restSec: 20 },
    { exerciseKey: 'high_knees', sets: 4, shortSets: 2, restSec: 20 },
  ],
  cooldown: [
    '2 Minuten gehen, bis der Atem ruhig ist',
    '30 Sekunden Hüftbeuger-Dehnung je Seite im Ausfallschritt',
    '30 Sekunden Wadendehnung je Seite an der Wand',
  ],
}

/**
 * Frühere A/B-Workouts. Werden nicht mehr eingeplant, bleiben aber hier, damit
 * ältere Einheiten im Verlauf weiter ihren Plan finden.
 */
const LEGACY_WORKOUTS: WorkoutTemplate[] = [
  {
    key: 'A',
    name: 'Workout A — Klimmzüge & Liegestütze',
    focus: 'Sprung, Zug senkrecht und waagerecht, Druck, Knie, Hamstrings, Wade, Rumpf',
    approxMinutes: 42,
    shortApproxMinutes: 30,
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
      {
        exerciseKey: 'row_inverted',
        sets: 2,
        shortSets: 2,
        restSec: 90,
        note: 'Der direkte Gegenspieler zum Liegestütz: Er zieht die Schulterblätter wieder zusammen, was der Klimmzug nur wenig tut. Bleibt auch in der Kurzform drin — solange gedrückt wird, wird auch waagerecht gezogen.',
      },
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
  'Kurzform: Zug, Druck, Knie und Hüfte mit vollen drei Sätzen und kürzeren Pausen — die vier ' +
  'Grundbewegungen, also das, was die Einheit vollständig macht. Sprünge, Rudern, Wade, ' +
  'Adduktoren und Rumpf entfallen. Das Aufwärmen wird nicht gekürzt.'

export const WORKOUT_BY_KEY: Record<string, WorkoutTemplate> = Object.fromEntries(
  [...WORKOUTS, HIIT_WORKOUT, ...LEGACY_WORKOUTS].map((w) => [w.key, w]),
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
 * Setzt Wunschübungen und abgewählte Übungen in konkrete Blöcke um.
 *
 * Zwei verschiedene Absichten werden hier zusammengeführt:
 *  - **Austauschen** („ich mache lieber Untergriff"): eine Wunschübung je Muster.
 *  - **Abwählen** („diese Übung nie"): die Übung fällt komplett raus.
 *
 * Erst wenn ein ganzes Muster leer ist, entfällt der Block — darauf weist die
 * Übungsauswahl vorher hin.
 */
export function resolveBlocks(
  template: WorkoutTemplate,
  disabled: readonly string[],
  isShort = false,
  preferences: Record<string, string> = {},
): ResolvedBlock[] {
  const off = new Set(disabled)
  const used = new Set<string>()
  const result: ResolvedBlock[] = []

  for (const block of activeBlocks(template, isShort)) {
    const planned = block.exerciseKey
    const ownPattern = getExercise(planned).pattern

    /*
     * Rangfolge:
     *   1. Wunschübung für dieses Muster, falls gesetzt
     *   2. die in der Vorlage vorgesehene Übung
     *   3. irgendeine andere aktive Übung desselben Musters
     *   4. eine Übung aus einem zugelassenen Ersatzmuster
     * Schon belegte Übungen fallen raus, damit dieselbe nicht zweimal in einer
     * Einheit landet.
     */
    const candidates: string[] = [
      ...(preferences[ownPattern] ? [preferences[ownPattern]] : []),
      planned,
      ...exercisesForPattern(ownPattern).map((e) => e.key),
      ...(block.altPatterns ?? []).flatMap((p) => exercisesForPattern(p).map((e) => e.key)),
    ]

    const pick = candidates.find((key) => !off.has(key) && !used.has(key))
    if (!pick) continue // alles abgewählt oder schon belegt

    used.add(pick)
    if (pick === planned) {
      result.push(block)
    } else {
      // Der Hinweistext gehört zur ursprünglichen Übung und passt sonst nicht mehr.
      result.push({ ...block, exerciseKey: pick, note: undefined, substitutedFor: planned })
    }
  }

  return result
}
