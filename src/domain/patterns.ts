/**
 * Bewegungsmuster statt Muskelgruppen.
 *
 * Das Ordnungsprinzip stammt aus der Trainingslehre und ist dort seit Langem
 * etabliert (NSCA und verwandte Lehrbücher): Ein Ganzkörperplan gilt als
 * vollständig, wenn er waagerechtes und senkrechtes Drücken, waagerechtes und
 * senkrechtes Ziehen, eine knie- und eine hüftdominante Beinübung sowie Rumpfarbeit
 * in den drei Stabilisationsrichtungen enthält. Das ist ein Ordnungsrahmen aus der
 * Praxis, keine Studienaussage — aber ein sinnvoller, weil er systematisch verhindert,
 * dass ganze Bereiche durchs Raster fallen.
 *
 * Ergänzt um drei Muster, die für jemanden mit hoher Lauf- und Sprintbelastung
 * gesondert begründet sind: Wade/Achillessehne, Adduktoren und Hüftabduktoren.
 *
 * ── Zum Thema Druck-/Zug-Verhältnis ────────────────────────────────────────
 *
 * Die verbreitete Aussage „zu viele Liegestütze machen einen Rundrücken" ist so
 * nicht belegt. Übersichtsarbeiten finden zwischen Haltung und Schulter- oder
 * Nackenbeschwerden nur schwache und inkonsistente Zusammenhänge (u. a. Barrett
 * et al., Manual Therapy 2016). Wer das anders behauptet, geht über die Datenlage
 * hinaus.
 *
 * Gut begründet ist dagegen etwas anderes: Die Muskeln, die das Schulterblatt nach
 * hinten und unten ziehen, werden beim Drücken kaum gefordert und beim Ziehen stark.
 * Wer nur drückt, trainiert eine Seite des Gelenks und die andere nicht. Mindestens
 * ebenso viele Zug- wie Drucksätze zu planen, ist deshalb etablierte Trainingspraxis
 * — als Programmierungsgrundsatz, nicht als Studienergebnis.
 */

export type Requirement = 'pflicht' | 'empfohlen' | 'optional'

export interface MovementPattern {
  key: string
  name: string
  /** Welche Muskulatur das Muster abdeckt. */
  covers: string
  /** Warum es im Plan steht. */
  why: string
  requirement: Requirement
  /** Zählt in die Druck-/Zug-Bilanz ein. */
  balance?: 'push' | 'pull'
}

export const PATTERNS: MovementPattern[] = [
  {
    key: 'plyo',
    name: 'Sprungkraft',
    covers: 'Streckschlinge aus Gesäß, Oberschenkel und Wade, plus Ansteuerung',
    why: 'Der Antritt aus dem Stand. Kein anderes Muster im Plan trainiert die Schnelligkeit der Kraftentwicklung — Ausdauertraining deckt das nicht mit ab.',
    requirement: 'empfohlen',
  },
  {
    key: 'push_horizontal',
    name: 'Drücken waagerecht',
    covers: 'Brust, vordere Schulter, Trizeps',
    why: 'Die Grunddruckbewegung. Fordert nebenbei den Rumpf, weil der Körper die Linie halten muss.',
    requirement: 'pflicht',
    balance: 'push',
  },
  {
    key: 'push_vertical',
    name: 'Drücken über Kopf',
    covers: 'Seitliche und vordere Schulter, Trizeps, oberer Rücken als Stabilisator',
    why: 'Belastet die Schulter in der Position, die beim waagerechten Drücken fehlt. Für ein rundum belastbares Schultergelenk sinnvoll, aber verzichtbar, wenn die Zeit knapp ist.',
    requirement: 'optional',
    balance: 'push',
  },
  {
    key: 'pull_vertical',
    name: 'Ziehen senkrecht',
    covers: 'Latissimus, unterer Trapez, Bizeps, Griffkraft',
    why: 'Der Gegenspieler zum Drücken über Kopf. Stärkster Reiz für den breiten Rückenmuskel.',
    requirement: 'pflicht',
    balance: 'pull',
  },
  {
    key: 'pull_horizontal',
    name: 'Ziehen waagerecht',
    covers: 'Mittlerer Trapez, Rautenmuskeln, hintere Schulter',
    why: 'Der direkte Gegenspieler zum waagerechten Drücken. Trifft genau die Muskeln, die das Schulterblatt zurückziehen und beim Liegestütz kaum etwas zu tun haben. Wenn du nur ein Zugmuster machst, dann dieses.',
    requirement: 'pflicht',
    balance: 'pull',
  },
  {
    key: 'knee',
    name: 'Beine knie-dominant',
    covers: 'Oberschenkelvorderseite, Gesäß',
    why: 'Kraft für Antritt und Abstoppen. Einbeinig ausgeführt deckt es zusätzlich Seitenunterschiede auf, die sonst unbemerkt zu Überlastung führen.',
    requirement: 'pflicht',
  },
  {
    key: 'hinge',
    name: 'Beine hüft-dominant',
    covers: 'Beinrückseite, Gesäß, Rückenstrecker',
    why: 'Die Beinrückseite ist beim Sprinten die am stärksten belastete und die am häufigsten verletzte Struktur. Nordic Curls als wirksamste bekannte Vorsorge gehören in dieses Muster.',
    requirement: 'pflicht',
  },
  {
    key: 'calf',
    name: 'Wade und Achillessehne',
    covers: 'Zwillingswadenmuskel und Schollenmuskel',
    why: 'Beim Sprint und Abstoppen wirken Kräfte weit über Körpergewicht auf die Achillessehne. Eine belastbare Wade ist die beste verfügbare Vorsorge gegen Achillesbeschwerden.',
    requirement: 'empfohlen',
  },
  {
    key: 'adduction',
    name: 'Adduktoren und Leiste',
    covers: 'Innenseite des Oberschenkels',
    why: 'Bei Schiedsrichtern eine der häufigsten Problemzonen, weil viel seitlich und rückwärts gelaufen wird. Harøy et al. (BJSM 2019) fanden mit einem Adduktorenprogramm rund 41 Prozent weniger Leistenprobleme.',
    requirement: 'empfohlen',
  },
  {
    key: 'abduction',
    name: 'Hüftabduktoren',
    covers: 'Mittlerer Gesäßmuskel',
    why: 'Hält beim einbeinigen Stand das Becken waagerecht. Die Verbindung zu Laufbeschwerden ist in Studien nicht eindeutig belegt — der Aufwand ist aber klein und die Übung kostet zwei Minuten.',
    requirement: 'optional',
  },
  {
    key: 'core_antiextension',
    name: 'Rumpf gegen Überstreckung',
    covers: 'Gerade Bauchmuskulatur, tiefe Bauchmuskeln',
    why: 'Hält die Lendenwirbelsäule stabil, während Arme und Beine unabhängig arbeiten — genau das passiert beim Laufen. Rückenschonender als Sit-ups.',
    requirement: 'empfohlen',
  },
  {
    key: 'core_antilateral',
    name: 'Rumpf gegen seitliches Kippen',
    covers: 'Seitliche Bauchmuskulatur, quadratischer Lendenmuskel',
    why: 'Verhindert das Absacken der Hüfte in der Standbeinphase, das langfristig Knie- und ITB-Beschwerden begünstigt.',
    requirement: 'empfohlen',
  },
  {
    key: 'core_antirotation',
    name: 'Rumpf gegen Rotation',
    covers: 'Schräge Bauchmuskulatur, tiefe Rückenstrecker',
    why: 'Die dritte Stabilisationsrichtung. Nice-to-have — die beiden anderen Rumpfmuster decken das Wesentliche ab.',
    requirement: 'optional',
  },
]

export const PATTERN_BY_KEY: Record<string, MovementPattern> = Object.fromEntries(
  PATTERNS.map((p) => [p.key, p]),
)

export function getPattern(key: string): MovementPattern {
  const p = PATTERN_BY_KEY[key]
  if (!p) throw new Error(`Unbekanntes Bewegungsmuster: ${key}`)
  return p
}

export const REQUIREMENT_LABEL: Record<Requirement, string> = {
  pflicht: 'Pflicht',
  empfohlen: 'Empfohlen',
  optional: 'Optional',
}
