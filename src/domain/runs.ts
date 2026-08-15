import type { RunTemplate } from './types'
import { formatHrRange, formatPaceRange, formatPaceSec, zoneByKey, type Zones } from './zones'

/**
 * Laufeinheiten mit Ziel „Spielfitness Landesliga", zugeschnitten auf 1–2 Läufe
 * pro Woche.
 *
 * Anforderungsprofil eines Schiedsrichters im Spiel: rund 9–12 km Gesamtstrecke,
 * davon der größte Teil locker, unterbrochen von 40–60 hochintensiven Antritten,
 * dazu Rückwärts- und Seitwärtslaufen (Castagna, Abt & D'Ottavio, Sports Medicine
 * 2007). Entscheidend ist nicht Dauerleistung am Stück, sondern die Fähigkeit,
 * Antritte zu wiederholen und sich dazwischen schnell zu erholen.
 *
 * Bei knappem Zeitbudget stehen zwei Kombi-Einheiten im Zentrum, die den
 * neuromuskulären Reiz (Sprint, Sprünge) und den aeroben Reiz (Intervalle) in einer
 * Einheit bündeln. Reihenfolge immer erst schnell, dann lang: Sprints und Sprünge
 * brauchen ein ausgeruhtes Nervensystem, die Intervalle funktionieren auch mit
 * Vorermüdung noch.
 *
 * ── Kurzformen ─────────────────────────────────────────────────────────────
 * Jede Einheit hat eine 20–30-Minuten-Variante. Gekürzt wird dabei immer der
 * **Umfang**, nie die Intensität: Ein halbierter, aber gleich harter Reiz wirkt
 * deutlich mehr als ein gleich langer, aber verwässerter. Einzige Ausnahme ist das
 * Aufwärmen vor Sprints — das bleibt, sonst steigt das Zerrungsrisiko.
 */

const drills = () => [
  '2 × 20 m Rückwärtslaufen, locker',
  '2 × 20 m Seitwärts-Kreuzschritt je Richtung',
  '3 × 20 m Steigerungslauf, der letzte fast voll',
]

const easyPace = (z: Zones) => {
  const g = zoneByKey(z, 'grundlage')
  return `${formatPaceRange(g.pace!)} bei ${formatHrRange(g.hr!)}`
}

export const RUNS: RunTemplate[] = [
  // -------------------------------------------------------------------------
  {
    key: 'kombi_4x4',
    name: 'Kombi: Sprints + 4 × 4 Minuten',
    type: 'kombi',
    why: 'Deckt beide Anforderungen ab, die im Spiel zählen: den Antritt aus dem Stand und die Fähigkeit, ihn 60 Mal zu wiederholen. Der Sprintblock kommt bewusst zuerst, solange das Nervensystem frisch ist.',
    evidence:
      'Das 4×4-Protokoll bei 90–95 % HFmax steigerte in der Untersuchung von Helgerud et al. (Med Sci Sports Exerc, 2007) die maximale Sauerstoffaufnahme deutlich stärker als gleich langes Training im moderaten Bereich. Der Sprintblock davor zielt auf die neuromuskuläre Seite, die reines Intervalltraining nicht mit abdeckt.',
    shortNote:
      'Statt 4 × 4 Minuten kommen 10 × 30 Sekunden bei höherem Tempo. Dieses Format sammelt in kurzer Zeit erstaunlich viel Zeit nahe der maximalen Sauerstoffaufnahme (Billat et al., Eur J Appl Physiol 2000) — die zeiteffizienteste Art, den Reiz trotzdem zu setzen.',
    full: {
      approxMinutes: 62,
      mainZone: 'intervall',
      warmup: (z) => [`12 Minuten locker einlaufen — ${easyPace(z)}`, ...drills()],
      main: (z) => {
        const int = zoneByKey(z, 'intervall')
        const gr = zoneByKey(z, 'grundlage')
        return [
          'Block 1 — Sprint und Sprungkraft, im ausgeruhten Zustand:',
          '6 × 40 m Sprint aus dem Stand, voll durchziehen — kein Tempoziel, hier gilt maximal',
          'Zwischen den Sprints 90 Sekunden Pause — zurückgehen, nicht traben',
          '3 × 5 Strecksprünge aus der Halbkniebeuge, maximal hoch, 60 Sekunden Pause',
          '',
          '3 Minuten locker traben als Übergang',
          '',
          'Block 2 — 4 × 4 Minuten Intervall:',
          `Laufteil bei ${formatHrRange(int.hr!)}, Richttempo ${formatPaceRange(int.pace!)}`,
          `Dazwischen 3 Minuten locker traben bei ${formatHrRange(gr.hr!)}`,
          'Beim ersten Intervall braucht die Herzfrequenz 60–90 Sekunden, um in den Bereich zu kommen — nicht überpacen',
        ]
      },
      cooldown: (z) => [
        `10 Minuten locker austraben — ${easyPace(z)}`,
        'Waden, Hüftbeuger und Hamstrings locker dehnen',
      ],
      garmin: (z) => {
        const int = zoneByKey(z, 'intervall')
        const gr = zoneByKey(z, 'grundlage')
        return [
          'Aufwärmen: 12:00 Zeit',
          'Intervall: 40 m Sprint / 1:30 Erholung — Wiederholen: 6 ×',
          '(Strecksprünge ohne Uhr, danach manuell weiter)',
          'Erholung: 3:00 Zeit',
          `Intervall: 4:00 Laufen, HF-Ziel ${int.hr!.low}–${int.hr!.high} / 3:00 Erholung, HF unter ${gr.hr!.high}`,
          'Wiederholen: 4 ×',
          'Auslaufen: 10:00 Zeit',
        ]
      },
      effort: () =>
        'Sprints wirklich maximal — wird ein Sprint deutlich langsamer, Block abbrechen. Die 4-Minuten-Intervalle so einteilen, dass das vierte genauso schnell ist wie das erste.',
    },
    short: {
      approxMinutes: 28,
      mainZone: 'kurzintervall',
      warmup: (z) => [
        `8 Minuten locker einlaufen — ${easyPace(z)}`,
        '3 × 20 m Steigerungslauf, der letzte fast voll',
      ],
      main: (z) => {
        const kurz = zoneByKey(z, 'kurzintervall')
        return [
          '4 × 40 m Sprint aus dem Stand, 90 Sekunden Pause dazwischen',
          '',
          '2 Minuten locker traben als Übergang',
          '',
          `10 × 30 Sekunden zügig (${formatPaceRange(kurz.pace!)})`,
          'Dazwischen jeweils 30 Sekunden locker traben — nicht stehen bleiben',
          'Der Puls kommt erst ab der dritten Wiederholung oben an, das ist normal',
        ]
      },
      cooldown: (z) => [`5 Minuten locker austraben — ${easyPace(z)}`],
      garmin: () => [
        'Aufwärmen: 8:00 Zeit',
        'Intervall: 40 m Sprint / 1:30 Erholung — Wiederholen: 4 ×',
        'Erholung: 2:00 Zeit',
        'Intervall: 0:30 Laufen / 0:30 Erholung — Wiederholen: 10 ×',
        'Auslaufen: 5:00 Zeit',
      ],
      effort: () =>
        'Die 30 Sekunden deutlich schneller angehen als ein 4-Minuten-Intervall — es sind nur 30 Sekunden. Wenn die letzten drei Wiederholungen einbrechen, war der Start zu schnell.',
    },
  },

  // -------------------------------------------------------------------------
  {
    key: 'kombi_rsa',
    name: 'Kombi: Wiederholte Sprints + 5 × 3 Minuten',
    type: 'kombi',
    why: 'Die Sprintvariante mit kürzeren Pausen: Hier geht es um die Erholung zwischen den Antritten, nicht um den einzelnen Spitzenwert. Genau die Situation, in der in der Schlussphase die Distanz zum Geschehen wächst.',
    evidence:
      'Wiederholte Sprints mit unvollständiger Pause trainieren gezielt die Wiederherstellung zwischen Belastungen (Buchheit & Laursen, Sports Medicine 2013). Der anschließende Intervallblock hält den aeroben Reiz aufrecht, ohne die Einheit zu verlängern.',
    shortNote:
      'Der Intervallblock entfällt komplett, der Sprintteil bleibt vollständig. Beim Sprinttraining ist das Aufwärmen der Teil, an dem man am wenigsten sparen darf — deshalb bleiben davon 10 Minuten stehen.',
    full: {
      approxMinutes: 58,
      mainZone: 'kurzintervall',
      warmup: (z) => [
        `12 Minuten locker einlaufen — ${easyPace(z)}`,
        ...drills(),
        '2 × 40 m bei etwa 80 Prozent',
      ],
      main: (z) => {
        const kurz = zoneByKey(z, 'kurzintervall')
        const gr = zoneByKey(z, 'grundlage')
        return [
          'Block 1 — wiederholte Sprints:',
          '3 Sätze à 6 Sprints über 30 m',
          'Zwischen den Sprints nur 20 Sekunden Pause',
          'Zwischen den Sätzen 3 Minuten locker traben',
          '',
          'Block 2 — 5 × 3 Minuten:',
          `Laufteil ${formatPaceRange(kurz.pace!)}, das ist schneller als beim 4×4`,
          `Dazwischen 2 Minuten locker traben bei ${formatHrRange(gr.hr!)}`,
        ]
      },
      cooldown: (z) => [`10 Minuten locker austraben — ${easyPace(z)}`],
      garmin: () => [
        'Aufwärmen: 12:00 Zeit',
        'Intervall: 30 m Sprint / 0:20 Erholung — Wiederholen: 6 ×',
        'Erholung: 3:00 Zeit — dieser Block insgesamt 3 ×',
        'Intervall: 3:00 Laufen / 2:00 Erholung — Wiederholen: 5 ×',
        'Auslaufen: 10:00 Zeit',
      ],
      effort: () =>
        'Im Sprintblock wird der sechste Sprint deutlich schwerer als der erste — das ist beabsichtigt. Sinkt das Tempo um mehr als etwa 10 Prozent, Satz beenden.',
    },
    short: {
      approxMinutes: 26,
      mainZone: 'maximal',
      warmup: (z) => [
        `10 Minuten locker einlaufen — ${easyPace(z)}`,
        ...drills(),
        '2 × 30 m bei etwa 80 Prozent',
      ],
      main: () => [
        '2 Sätze à 6 Sprints über 30 m',
        'Zwischen den Sprints nur 20 Sekunden Pause',
        'Zwischen den Sätzen 3 Minuten locker traben',
      ],
      cooldown: (z) => [`5 Minuten locker austraben — ${easyPace(z)}`],
      garmin: () => [
        'Aufwärmen: 10:00 Zeit',
        'Intervall: 30 m Sprint / 0:20 Erholung — Wiederholen: 6 ×',
        'Erholung: 3:00 Zeit — dieser Block insgesamt 2 ×',
        'Auslaufen: 5:00 Zeit',
      ],
      effort: () =>
        'Zwölf maximale Sprints in 26 Minuten sind ein voller Reiz — das ist keine Sparversion, nur eine kürzere.',
    },
  },

  // -------------------------------------------------------------------------
  {
    key: 'intervall_75_25',
    name: 'Schiri-Intervalle 75/25',
    type: 'intervall',
    why: 'Bildet den Spielrhythmus fast eins zu eins ab: zügiger Lauf, kurze Gehpause, sofort wieder los. Zahlt direkt auf deinen Fokuspunkt Positionierung ein — nah am Geschehen zu bleiben scheitert selten am Spitzentempo, sondern daran, dass der nächste Antritt zu spät kommt.',
    evidence:
      'Entspricht dem Belastungswechsel des offiziellen Schiedsrichter-Intervalltests und damit dem Anforderungsprofil im Spiel.',
    shortNote: 'Zwei statt drei Sätze, acht statt zehn Wiederholungen. Rhythmus und Tempo bleiben.',
    full: {
      approxMinutes: 50,
      mainZone: 'schwelle',
      warmup: (z) => [`10 Minuten locker einlaufen — ${easyPace(z)}`, ...drills()],
      main: (z) => {
        const s = zoneByKey(z, 'schwelle')
        return [
          '3 Sätze à 10 Wiederholungen',
          `Eine Wiederholung = 75 m zügig (${formatPaceRange(s.pace!)}), dann 25 m gehen`,
          'Auf dem Sportplatz: Längsseite laufen, kurze Seite gehen',
          'Zwischen den Sätzen 3 Minuten locker gehen oder traben',
          `Die Herzfrequenz pendelt sich bei etwa ${formatHrRange(s.hr!)} ein und soll zwischen den Sätzen deutlich absinken`,
        ]
      },
      cooldown: (z) => [`8 Minuten locker austraben — ${easyPace(z)}`, 'Waden und Hüftbeuger dehnen'],
      garmin: () => [
        'Aufwärmen: 10:00 Zeit',
        'Intervall: 75 m Laufen / 25 m Gehen — Wiederholen: 10 ×',
        'Erholung: 3:00 Zeit — dieser Block insgesamt 3 ×',
        'Auslaufen: 8:00 Zeit',
        'Ohne Distanzmessung ersatzweise: 18 s zügig / 22 s gehen',
      ],
      effort: () => 'Zügig, aber kontrolliert. Alle 30 Wiederholungen sollen gleich schnell sein.',
    },
    short: {
      approxMinutes: 26,
      mainZone: 'schwelle',
      warmup: (z) => [
        `8 Minuten locker einlaufen — ${easyPace(z)}`,
        '2 × 20 m Rückwärtslaufen, locker',
        '2 × 20 m Steigerungslauf',
      ],
      main: (z) => {
        const s = zoneByKey(z, 'schwelle')
        return [
          '2 Sätze à 8 Wiederholungen',
          `Eine Wiederholung = 75 m zügig (${formatPaceRange(s.pace!)}), dann 25 m gehen`,
          'Zwischen den Sätzen 3 Minuten locker gehen oder traben',
        ]
      },
      cooldown: (z) => [`5 Minuten locker austraben — ${easyPace(z)}`],
      garmin: () => [
        'Aufwärmen: 8:00 Zeit',
        'Intervall: 75 m Laufen / 25 m Gehen — Wiederholen: 8 ×',
        'Erholung: 3:00 Zeit — dieser Block insgesamt 2 ×',
        'Auslaufen: 5:00 Zeit',
      ],
      effort: () => 'Weniger Wiederholungen heißt nicht schneller — das Tempo bleibt dasselbe.',
    },
  },

  // -------------------------------------------------------------------------
  {
    key: 'tempolauf',
    name: 'Schwellenlauf 2 × 12 Minuten',
    type: 'tempo',
    why: 'Hebt das Tempo an, das du über 90 Minuten locker durchhältst. Weniger spektakulär als Intervalle, aber der direkteste Hebel dafür, in der Schlussphase noch dran zu sein.',
    shortNote:
      'Ein Block à 12 Minuten statt zwei. Der Schwellenreiz braucht eine gewisse Mindestdauer am Stück — deshalb wird hier lieber die Anzahl halbiert als die Länge.',
    full: {
      approxMinutes: 50,
      mainZone: 'schwelle',
      warmup: (z) => [`12 Minuten locker einlaufen — ${easyPace(z)}`, '3 × 20 m Steigerungslauf'],
      main: (z) => {
        const s = zoneByKey(z, 'schwelle')
        return [
          `2 × 12 Minuten bei ${formatPaceRange(s.pace!)}`,
          `Herzfrequenz ${formatHrRange(s.hr!)} — sie steigt im Verlauf leicht an, das ist normal`,
          'Dazwischen 3 Minuten locker traben',
          'Das Tempo soll sich „angenehm hart" anfühlen: fordernd, aber nicht am Limit',
        ]
      },
      cooldown: (z) => [`10 Minuten locker austraben — ${easyPace(z)}`],
      garmin: (z) => {
        const s = zoneByKey(z, 'schwelle')
        return [
          'Aufwärmen: 12:00 Zeit',
          `Intervall: 12:00 Laufen, Tempo ${formatPaceSec(s.pace!.fastSec)}–${formatPaceSec(s.pace!.slowSec)} / 3:00 Erholung`,
          'Wiederholen: 2 ×',
          'Auslaufen: 10:00 Zeit',
        ]
      },
      effort: () =>
        'Wenn du nach dem ersten Block das Gefühl hast, den zweiten nicht im selben Tempo zu schaffen, war er zu schnell.',
    },
    short: {
      approxMinutes: 27,
      mainZone: 'schwelle',
      warmup: (z) => [`9 Minuten locker einlaufen — ${easyPace(z)}`, '3 × 20 m Steigerungslauf'],
      main: (z) => {
        const s = zoneByKey(z, 'schwelle')
        return [
          `1 × 13 Minuten bei ${formatPaceRange(s.pace!)}`,
          `Herzfrequenz ${formatHrRange(s.hr!)}`,
          'Am Stück, ohne Unterbrechung — darauf kommt es bei dieser Einheit an',
        ]
      },
      cooldown: (z) => [`5 Minuten locker austraben — ${easyPace(z)}`],
      garmin: (z) => {
        const s = zoneByKey(z, 'schwelle')
        return [
          'Aufwärmen: 9:00 Zeit',
          `Intervall: 13:00 Laufen, Tempo ${formatPaceSec(s.pace!.fastSec)}–${formatPaceSec(s.pace!.slowSec)}`,
          'Auslaufen: 5:00 Zeit',
        ]
      },
      effort: () => 'Angenehm hart, gleichmäßig. Die letzten drei Minuten sollen noch machbar sein.',
    },
  },

  // -------------------------------------------------------------------------
  {
    key: 'dauerlauf',
    name: 'Ruhiger Dauerlauf',
    type: 'dauerlauf',
    why: 'Baut die aerobe Grundlage, aus der sich alles andere speist — je besser sie ist, desto schneller erholst du dich zwischen den Antritten. Muss sich langsam anfühlen, sonst verfehlt sie ihren Zweck.',
    shortNote:
      'Einfach kürzer, gleiches Tempo. Die Versuchung, einen kurzen Lauf schneller zu machen, ist hier der eigentliche Fehler — dann landest du in der Grauzone und hast von beidem nichts.',
    full: {
      approxMinutes: 50,
      mainZone: 'grundlage',
      warmup: () => ['Die ersten 5 Minuten bewusst sehr langsam'],
      main: (z) => {
        const g = zoneByKey(z, 'grundlage')
        return [
          `45 bis 60 Minuten durchgehend bei ${formatPaceRange(g.pace!)}`,
          `Herzfrequenz ${formatHrRange(g.hr!)} — Obergrenze wirklich einhalten`,
          'Unterhaltungstempo: du könntest ganze Sätze sprechen',
          'Dieses Tempo fühlt sich zu langsam an. Genau so soll es sein.',
        ]
      },
      cooldown: () => ['5 Minuten gehen', 'Waden und Oberschenkel locker dehnen'],
      garmin: (z) => {
        const g = zoneByKey(z, 'grundlage')
        return [
          'Einfache Laufaktivität ohne Intervalle',
          `Herzfrequenz-Alarm als Obergrenze auf ${g.hr!.high} bpm setzen`,
        ]
      },
      effort: () =>
        'Wenn du am Ende nicht das Gefühl hast, noch weiterlaufen zu können, war es zu schnell.',
    },
    short: {
      approxMinutes: 28,
      mainZone: 'grundlage',
      warmup: () => ['Die ersten 4 Minuten bewusst sehr langsam'],
      main: (z) => {
        const g = zoneByKey(z, 'grundlage')
        return [
          `25 bis 28 Minuten durchgehend bei ${formatPaceRange(g.pace!)}`,
          `Herzfrequenz ${formatHrRange(g.hr!)} — nicht schneller, nur weil es kürzer ist`,
        ]
      },
      cooldown: () => ['3 Minuten gehen'],
      garmin: (z) => {
        const g = zoneByKey(z, 'grundlage')
        return [
          'Einfache Laufaktivität ohne Intervalle',
          `Herzfrequenz-Alarm als Obergrenze auf ${g.hr!.high} bpm setzen`,
        ]
      },
      effort: () => 'Gleiches Tempo wie beim langen Dauerlauf. Nur kürzer.',
    },
  },

  // -------------------------------------------------------------------------
  {
    key: 'fahrtspiel',
    name: 'Fahrtspiel mit Tempowechsel',
    type: 'fahrtspiel',
    why: 'Trainiert das ständige Umschalten zwischen Tempi — im Spiel passiert nie etwas gleichmäßig. Weniger hart als die Kombi-Einheiten und damit gut geeignet, wenn die Woche stressig war oder ein Spiel ansteht.',
    shortNote: 'Sechs statt zehn schnelle Minuten, kürzere Erholung dazwischen.',
    full: {
      approxMinutes: 45,
      mainZone: 'schwelle',
      warmup: (z) => [`10 Minuten locker einlaufen — ${easyPace(z)}`],
      main: (z) => {
        const s = zoneByKey(z, 'schwelle')
        const g = zoneByKey(z, 'grundlage')
        return [
          `10 × 1 Minute zügig (${formatPaceRange(s.pace!)})`,
          `Dazwischen jeweils 2 Minuten locker weiterlaufen bei ${formatHrRange(g.hr!)} — laufen, nicht gehen`,
          'Lässt sich frei im Gelände laufen: Anstiege gerne als schnelles Stück nutzen',
        ]
      },
      cooldown: (z) => [`8 Minuten locker austraben — ${easyPace(z)}`],
      garmin: () => [
        'Aufwärmen: 10:00 Zeit',
        'Intervall: 1:00 Laufen / 2:00 Erholung (laufend) — Wiederholen: 10 ×',
        'Auslaufen: 8:00 Zeit',
      ],
      effort: () => 'Die schnelle Minute fordernd, aber die Erholung dazwischen wirklich locker traben.',
    },
    short: {
      approxMinutes: 25,
      mainZone: 'schwelle',
      warmup: (z) => [`7 Minuten locker einlaufen — ${easyPace(z)}`],
      main: (z) => {
        const s = zoneByKey(z, 'schwelle')
        return [
          `6 × 1 Minute zügig (${formatPaceRange(s.pace!)})`,
          'Dazwischen jeweils 1,5 Minuten locker weiterlaufen — laufen, nicht gehen',
        ]
      },
      cooldown: (z) => [`4 Minuten locker austraben — ${easyPace(z)}`],
      garmin: () => [
        'Aufwärmen: 7:00 Zeit',
        'Intervall: 1:00 Laufen / 1:30 Erholung (laufend) — Wiederholen: 6 ×',
        'Auslaufen: 4:00 Zeit',
      ],
      effort: () => 'Kürzere Pausen machen das Ganze härter als es aussieht — gleichmäßig einteilen.',
    },
  },

  // -------------------------------------------------------------------------
  {
    key: 'regeneration',
    name: 'Lockerer Regenerationslauf',
    type: 'regeneration',
    why: 'Entlastungswoche: Der Körper wird nicht im Training stärker, sondern in der Erholung danach. Diese Einheit hält den Rhythmus, ohne neue Ermüdung aufzubauen.',
    shortNote: 'Zwanzig statt dreißig Minuten. Bei einer Regenerationseinheit ist kürzer nie falsch.',
    full: {
      approxMinutes: 30,
      mainZone: 'regeneration',
      warmup: () => ['Direkt langsam starten'],
      main: (z) => {
        const r = zoneByKey(z, 'regeneration')
        return [
          `25 bis 30 Minuten sehr locker (${formatPaceRange(r.pace!)})`,
          `Herzfrequenz unter ${r.hr!.high} bpm halten`,
          'Kein Tempo, keine Anstiege forcieren',
        ]
      },
      cooldown: () => ['5 Minuten gehen'],
      garmin: (z) => {
        const r = zoneByKey(z, 'regeneration')
        return [`Einfache Laufaktivität, Herzfrequenz-Alarm auf ${r.hr!.high} bpm`]
      },
      effort: () => 'Bewusst langsamer, als es sich richtig anfühlt.',
    },
    short: {
      approxMinutes: 20,
      mainZone: 'regeneration',
      warmup: () => ['Direkt langsam starten'],
      main: (z) => {
        const r = zoneByKey(z, 'regeneration')
        return [
          `20 Minuten sehr locker (${formatPaceRange(r.pace!)})`,
          `Herzfrequenz unter ${r.hr!.high} bpm halten`,
        ]
      },
      cooldown: () => ['3 Minuten gehen'],
      garmin: (z) => {
        const r = zoneByKey(z, 'regeneration')
        return [`Einfache Laufaktivität, Herzfrequenz-Alarm auf ${r.hr!.high} bpm`]
      },
      effort: () => 'Bewusst langsamer, als es sich richtig anfühlt.',
    },
  },
]

export const RUN_BY_KEY: Record<string, RunTemplate> = Object.fromEntries(
  RUNS.map((r) => [r.key, r]),
)

export function getRun(key: string): RunTemplate {
  const r = RUN_BY_KEY[key]
  if (!r) throw new Error(`Unbekannte Laufeinheit: ${key}`)
  return r
}

export const RUN_TYPE_LABEL: Record<RunTemplate['type'], string> = {
  kombi: 'Kombi-Einheit',
  intervall: 'Intervall',
  tempo: 'Schwelle',
  fahrtspiel: 'Fahrtspiel',
  dauerlauf: 'Dauerlauf',
  regeneration: 'Regeneration',
}
