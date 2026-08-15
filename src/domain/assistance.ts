/**
 * Unterstützungsstufen für Klimmzüge mit Band.
 *
 * ── Warum das mitprotokolliert werden muss ─────────────────────────────────
 *
 * Acht Wiederholungen mit orangem Band und acht ohne Band sind völlig verschiedene
 * Leistungen. Ohne die Stufe daneben ist die Wiederholungszahl als Verlaufsgröße
 * wertlos — und ein Bandwechsel sähe im Diagramm wie ein Rückschritt aus, obwohl er
 * das Gegenteil ist. Deshalb hängt an jedem Satz die verwendete Stufe, und der
 * Verlauf färbt die Punkte danach ein.
 *
 * ── Wie die Progression läuft ──────────────────────────────────────────────
 *
 * Innerhalb einer Bandstufe steigen die Wiederholungen wie bei jeder anderen Übung.
 * Ist die Obergrenze der Stufe erreicht, wechselt die App auf das nächst schwächere
 * Band und setzt die Vorgabe zurück — die Wiederholungszahl fällt dann, die Leistung
 * steigt. Das entspricht dem üblichen Vorgehen in der Trainingspraxis; belastbare
 * Studien zu genau diesem Stufenschema gibt es nicht, wohl aber dazu, dass der
 * entscheidende Reiz die Nähe zum Muskelversagen ist (Schoenfeld et al., J Strength
 * Cond Res 2017) — und die stellt eine passende Bandstärke überhaupt erst her.
 *
 * ── Was man über Bänder wissen sollte ──────────────────────────────────────
 *
 * Ein Band zieht umso stärker, je weiter es gedehnt ist. Beim Klimmzug heißt das:
 * unten im Hang maximale Unterstützung, oben an der Stange fast keine. Der obere
 * Teil der Bewegung bleibt also nahezu unassistiert — dort wirst du zuerst scheitern,
 * und das ist normal. Wer gezielt daran arbeiten will, ergänzt langsam abgelassene
 * Klimmzüge ohne Band: Die belasten den gesamten Weg mit vollem Körpergewicht.
 */

export interface AssistLevel {
  key: string
  /** Kurzform für Chips und Diagramm-Legende. */
  short: string
  name: string
  /** Je höher, desto weniger Unterstützung — also desto schwerer. */
  rank: number
  color: string
  hint: string
}

export const BAND_LADDER: AssistLevel[] = [
  {
    key: 'band_orange',
    short: 'Orange',
    name: 'Oranges Band',
    rank: 0,
    color: '#fb923c',
    hint: 'Meiste Unterstützung',
  },
  {
    key: 'band_gelb',
    short: 'Gelb',
    name: 'Gelbes Band',
    rank: 1,
    color: '#facc15',
    hint: 'Mittlere Unterstützung',
  },
  {
    key: 'band_gruen',
    short: 'Grün',
    name: 'Grünes Band',
    rank: 2,
    color: '#4ade80',
    hint: 'Wenig Unterstützung',
  },
  {
    key: 'none',
    short: 'Ohne',
    name: 'Ohne Band',
    rank: 3,
    color: '#93a3c2',
    hint: 'Volles Körpergewicht',
  },
]

export const LADDERS: Record<string, AssistLevel[]> = {
  band: BAND_LADDER,
}

export function ladderFor(ladderKey: string | undefined): AssistLevel[] | undefined {
  return ladderKey ? LADDERS[ladderKey] : undefined
}

export function levelFor(ladderKey: string | undefined, levelKey: string | undefined): AssistLevel | undefined {
  const ladder = ladderFor(ladderKey)
  if (!ladder) return undefined
  return ladder.find((l) => l.key === levelKey)
}

/** Die nächst schwerere Stufe, oder undefined, wenn schon ganz oben. */
export function nextHarderLevel(
  ladderKey: string | undefined,
  levelKey: string | undefined,
): AssistLevel | undefined {
  const ladder = ladderFor(ladderKey)
  const current = levelFor(ladderKey, levelKey)
  if (!ladder || !current) return undefined
  return ladder.find((l) => l.rank === current.rank + 1)
}

/** Startstufe, wenn noch nichts protokolliert wurde: die mit der meisten Unterstützung. */
export function defaultLevel(ladderKey: string | undefined): string | undefined {
  const ladder = ladderFor(ladderKey)
  return ladder?.[0]?.key
}

/** Farbe für einen Datenpunkt im Verlauf. */
export function levelColor(ladderKey: string | undefined, levelKey: string | undefined): string | undefined {
  return levelFor(ladderKey, levelKey)?.color
}
