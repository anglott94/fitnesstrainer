import type { Settings } from './types'

/**
 * Herzfrequenz- und Tempozonen aus den persönlichen Leistungsdaten.
 *
 * ── Warum die Grenzen so liegen ────────────────────────────────────────────
 *
 * Es kursieren zwei Zonenmodelle mit denselben Namen, und sie meinen Verschiedenes:
 *
 *  1. **Prozentbänder** (Garmin-Standard, 5 Zonen à 10 % der HFmax). Rein rechnerische
 *     Scheiben ohne physiologischen Bezug. „Zone 2" heißt hier 60–70 % HFmax.
 *  2. **Physiologisches 3-Zonen-Modell** (Sportwissenschaft, u. a. Seiler & Kjerland,
 *     Scand J Med Sci Sports 2006). Die Grenzen sind die beiden Laktatschwellen LT1
 *     und LT2 — und genau darauf bezieht sich das, was populär „Zone-2-Training"
 *     genannt wird: alles unterhalb LT1.
 *
 * Diese App richtet sich nach dem zweiten Modell, zeigt aber zu jeder Zone die
 * Garmin-Nummer dazu — sonst widersprechen sich Uhr und App am Handgelenk.
 *
 * LT1 liegt bei Freizeitsportlern typischerweise bei 70–80 % HFmax (bei Eliteathleten
 * höher). Die Obergrenze der Grundlagenzone ist deshalb auf 78 % gesetzt — bewusst
 * konservativ, weil ein zu harter „lockerer" Lauf der häufigste Trainingsfehler
 * überhaupt ist. Entscheidend bleibt der Sprechtest, nicht die Zahl.
 *
 * ── Ruhepuls ──────────────────────────────────────────────────────────────
 *
 * Alle Zonengrenzen hängen ausschließlich an der HFmax. Der Ruhepuls geht nur in die
 * zusätzlich angezeigte Karvonen-Angabe ein. Ein unsicherer Ruhepuls verschiebt also
 * keine einzige Trainingsvorgabe — die HFmax dagegen verschiebt alles.
 */

export interface ZoneHeartRate {
  low: number
  high: number
  /** „70–78 % HFmax · entspricht 58–69 % der Herzfrequenzreserve" */
  percentLabel: string
}

export interface ZonePace {
  fastSec: number
  slowSec: number
}

export interface TrainingZone {
  key: string
  name: string
  /** Entsprechung im 5-Zonen-Modell der Uhr. */
  garmin: string
  hr?: ZoneHeartRate
  pace?: ZonePace
  purpose: string
}

export interface Zones {
  hrMax: number
  hrRest: number
  reserve: number
  /** Referenztempo aus dem letzten Test in Sekunden pro Kilometer. */
  testPaceSec: number
  list: TrainingZone[]
}

const ofMax = (hrMax: number, percent: number) => Math.round(hrMax * percent)

/** Karvonen: Ruhepuls + Anteil der Herzfrequenzreserve. */
export const ofReserve = (hrMax: number, hrRest: number, percent: number) =>
  Math.round(hrRest + (hrMax - hrRest) * percent)

/** Umgekehrt: Welchem Anteil der Herzfrequenzreserve entspricht dieser Puls? */
const reservePercent = (bpm: number, hrMax: number, hrRest: number) =>
  Math.round(((bpm - hrRest) / (hrMax - hrRest)) * 100)

/**
 * Tempofaktoren, bezogen auf das Testtempo.
 *
 * Ein 6-km-Test all-out dauert rund 30 Minuten und liegt damit praktisch auf der
 * anaeroben Schwelle — ein brauchbarer Anker. Die Faktoren sind gegen die
 * VDOT-Tabellen nach Daniels kalibriert (6 km in 30:00 entspricht etwa VDOT 39):
 * Schwelle 5:09 gegen Daniels 5:11, Intervall 4:45 gegen 4:46, locker 6:15–6:45
 * gegen 6:11–6:49 pro Kilometer.
 */
const PACE_FACTORS: Record<string, [number, number]> = {
  regeneration: [1.35, 1.5],
  grundlage: [1.25, 1.35],
  grauzone: [1.08, 1.2],
  schwelle: [1.01, 1.05],
  intervall: [0.93, 0.97],
  kurzintervall: [0.88, 0.93],
}

interface ZoneSpec {
  key: string
  name: string
  garmin: string
  /** Anteil der HFmax, unten und oben. Fehlt er, gibt es keine sinnvolle Pulsvorgabe. */
  hrPercent?: [number, number]
  hasPace: boolean
  purpose: string
}

const SPECS: ZoneSpec[] = [
  {
    key: 'regeneration',
    name: 'Regeneration',
    garmin: 'Garmin Zone 2',
    hrPercent: [0.6, 0.7],
    hasPace: true,
    purpose: 'Durchblutung fördern, ohne neue Ermüdung aufzubauen. Sicher unter LT1.',
  },
  {
    key: 'grundlage',
    name: 'Grundlage (GA1)',
    garmin: 'Garmin Zone 3, unterer Teil',
    hrPercent: [0.7, 0.78],
    hasPace: true,
    purpose:
      'Der eigentliche „Zone-2"-Bereich im physiologischen Sinn: unterhalb der ersten Laktatschwelle. Sprechtest entscheidet — ganze Sätze müssen gehen.',
  },
  {
    key: 'grauzone',
    name: 'Grauzone (GA2)',
    garmin: 'Garmin Zone 3 oben bis Zone 4 unten',
    hrPercent: [0.78, 0.85],
    hasPace: true,
    purpose:
      'Wird im Plan bewusst kaum genutzt: zu hart, um sich davon gut zu erholen, zu leicht für einen echten Reiz. Hier landen die meisten Läufer versehentlich.',
  },
  {
    key: 'schwelle',
    name: 'Schwelle',
    garmin: 'Garmin Zone 4',
    hrPercent: [0.85, 0.9],
    hasPace: true,
    purpose: 'An der zweiten Laktatschwelle. Hebt das Tempo an, das du über 90 Minuten durchhältst.',
  },
  {
    key: 'intervall',
    name: 'Intervall (4 × 4 Minuten)',
    garmin: 'Garmin Zone 5, unterer Teil',
    hrPercent: [0.9, 0.95],
    hasPace: true,
    purpose: 'Der stärkste Reiz für die maximale Sauerstoffaufnahme.',
  },
  {
    key: 'kurzintervall',
    name: 'Kurzintervall (bis 3 Minuten)',
    garmin: 'Garmin Zone 5',
    hrPercent: [0.92, 0.97],
    hasPace: true,
    purpose:
      'Bei kurzen Intervallen hinkt die Herzfrequenz 60–90 Sekunden hinterher — hier steuerst du über das Tempo, der Puls ist nur Kontrolle.',
  },
  {
    key: 'maximal',
    name: 'Sprint (maximal)',
    garmin: 'jenseits der Zonen',
    hasPace: false,
    purpose:
      'Sprints unter 10 Sekunden lassen sich weder über Puls noch über Pace steuern. Vorgabe: alles geben.',
  },
]

export function buildZones(settings: Settings): Zones {
  // Rückfallwerte nur für den Fall unvollständiger Daten — die eigentlichen
  // Standardwerte stehen in PERFORMANCE_DEFAULTS.
  const hrMax = settings.hrMax || 185
  const hrRest = settings.hrRest || 60
  const testPaceSec = settings.testPaceSecPerKm || 330

  const list: TrainingZone[] = SPECS.map((spec) => {
    let hr: ZoneHeartRate | undefined
    if (spec.hrPercent) {
      const [lowPct, highPct] = spec.hrPercent
      const low = ofMax(hrMax, lowPct)
      const high = ofMax(hrMax, highPct)
      hr = {
        low,
        high,
        percentLabel:
          `${Math.round(lowPct * 100)}–${Math.round(highPct * 100)} % HFmax · entspricht ` +
          `${reservePercent(low, hrMax, hrRest)}–${reservePercent(high, hrMax, hrRest)} % der Herzfrequenzreserve`,
      }
    }

    const factors = spec.hasPace ? PACE_FACTORS[spec.key] : undefined
    const pace = factors
      ? { fastSec: Math.round(testPaceSec * factors[0]), slowSec: Math.round(testPaceSec * factors[1]) }
      : undefined

    return { key: spec.key, name: spec.name, garmin: spec.garmin, hr, pace, purpose: spec.purpose }
  })

  return { hrMax, hrRest, reserve: hrMax - hrRest, testPaceSec, list }
}

export function zoneByKey(zones: Zones, key: string): TrainingZone {
  const zone = zones.list.find((z) => z.key === key)
  if (!zone) throw new Error(`Unbekannte Zone: ${key}`)
  return zone
}

/** Sekunden pro Kilometer als „5:06". */
export function formatPaceSec(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  const mm = s === 60 ? m + 1 : m
  const ss = s === 60 ? 0 : s
  return `${mm}:${String(ss).padStart(2, '0')}`
}

export function formatPaceRange(pace: ZonePace): string {
  return `${formatPaceSec(pace.fastSec)}–${formatPaceSec(pace.slowSec)} min/km`
}

export function formatHrRange(hr: ZoneHeartRate): string {
  return `${hr.low}–${hr.high} bpm`
}
