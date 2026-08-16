import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, LineChart } from '../components/Chart'
import { EXERCISES, getExercise } from '../domain/exercises'
import { formatHrRange, formatPaceRange, formatPaceSec } from '../domain/zones'
import {
  useBodyLogs,
  useDoneStrengthSessions,
  useExerciseStates,
  useMatches,
  useRunSessions,
  useSettings,
  useZones,
} from '../hooks/useAppData'
import { defaultLevel, levelFor } from '../domain/assistance'
import {
  assistLevelsUsed,
  bestSetSeries,
  personalBest,
  runDistanceSeries,
  sessionsPerWeekSeries,
  strengthVolumeSeries,
  totalDistance,
  totalRepsSeries,
  weekStreak,
} from '../lib/stats'
import { formatDateShort, todayISO } from '../lib/date'
import { upsertBodyLog } from '../db/repo'
import { hasOwnPerformanceData } from '../db/db'
import { Disclosure } from '../components/Disclosure'
import { useWriteGuard } from '../components/ErrorToast'
import { weeklySeries } from '../lib/stats'

export default function Progress() {
  const settings = useSettings()
  const zones = useZones(settings)
  const strength = useDoneStrengthSessions()
  const runs = useRunSessions()
  const states = useExerciseStates()
  const bodyLogs = useBodyLogs()

  const [exerciseKey, setExerciseKey] = useState('pullup')
  const [metric, setMetric] = useState<'best' | 'total'>('best')

  const ex = getExercise(exerciseKey)
  const series = metric === 'best' ? bestSetSeries(strength, exerciseKey) : totalRepsSeries(strength, exerciseKey)
  const state = states.find((s) => s.key === exerciseKey)
  const currentTarget = state?.target ?? ex.startTarget
  const best = personalBest(strength, exerciseKey)
  const usedLevels = assistLevelsUsed(strength, exerciseKey)
  const currentLevel = levelFor(ex.assistLadder, state?.assist ?? defaultLevel(ex.assistLadder))

  const streak = weekStreak(strength, runs)
  const runsWithDistance = runs.filter((r) => r.distanceKm)
  const weightSeries = weeklySeries(
    bodyLogs.filter((b) => b.weightKg),
    (b) => b.date,
    (b) => b.weightKg ?? 0,
    8,
  )

  return (
    <div className="page">
      <h1 className="page-title">Fortschritt</h1>
      <p className="page-subtitle">Alles, was du bisher eingetragen hast.</p>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-value">{strength.length + runs.length}</div>
          <div className="stat-label">Einheiten gesamt</div>
        </div>
        <div className="stat">
          <div className="stat-value">{streak}</div>
          <div className="stat-label">Wochen in Folge</div>
        </div>
        <div className="stat">
          <div className="stat-value">{personalBest(strength, 'pullup') || '–'}</div>
          <div className="stat-label">Klimmzüge Bestwert</div>
        </div>
        <div className="stat">
          <div className="stat-value">{personalBest(strength, 'pushup') || '–'}</div>
          <div className="stat-label">Liegestütze Bestwert</div>
        </div>
        <div className="stat">
          <div className="stat-value">{totalDistance(runs) || '–'}</div>
          <div className="stat-label">Kilometer gelaufen</div>
        </div>
        <div className="stat">
          <div className="stat-value">{strength.length}</div>
          <div className="stat-label">Krafteinheiten</div>
        </div>
      </div>

      <h2 className="section-title">Einzelne Übung</h2>
      <div className="card">
        <div className="field" style={{ marginBottom: 12 }}>
          <select
            className="select"
            value={exerciseKey}
            onChange={(e) => setExerciseKey(e.target.value)}
            aria-label="Übung wählen"
          >
            {EXERCISES.map((e) => (
              <option key={e.key} value={e.key}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div className="chip-row" style={{ marginBottom: 14 }}>
          <button className="chip" data-active={metric === 'best'} onClick={() => setMetric('best')}>
            Bester Satz
          </button>
          <button className="chip" data-active={metric === 'total'} onClick={() => setMetric('total')}>
            Summe pro Einheit
          </button>
        </div>

        <LineChart
          data={series}
          unit={ex.unit === 'seconds' ? 's' : ''}
          emptyHint={`Noch keine abgehakten Sätze für ${ex.name}.`}
        />

        {usedLevels.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div className="row" style={{ gap: 14, flexWrap: 'wrap' }}>
              {usedLevels.map((level) => (
                <span key={level.key} className="row tiny" style={{ gap: 5 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: level.color,
                      display: 'inline-block',
                    }}
                  />
                  <span className="dim">{level.short}</span>
                </span>
              ))}
            </div>
            <p className="tiny dim" style={{ margin: '6px 0 0' }}>
              Punktfarbe = Unterstützungsstufe. Ein Abfall direkt nach einem Farbwechsel ist
              Fortschritt, kein Rückschritt.
            </p>
          </div>
        )}

        <div className="row-between small" style={{ marginTop: 12 }}>
          <span className="muted">
            Aktuelle Vorgabe: <strong>{currentTarget}{ex.unit === 'seconds' ? 's' : ''}</strong>
            {ex.unilateral ? ' je Seite' : ''}
            {currentLevel ? ` mit ${currentLevel.short}` : ''}
          </span>
          <span className="muted">
            Bestwert: <strong>{best || '–'}</strong>
          </span>
        </div>
      </div>

      <h2 className="section-title">Kraftvolumen pro Woche</h2>
      <div className="card">
        <BarChart
          data={strengthVolumeSeries(strength)}
          unit=" Wdh"
          emptyHint="Noch keine abgeschlossene Krafteinheit."
        />
        <p className="tiny dim" style={{ margin: '10px 0 0' }}>
          Einbeinige Übungen zählen beide Seiten, Halteübungen fließen nicht ein.
        </p>
      </div>

      <h2 className="section-title">Laufkilometer pro Woche</h2>
      <div className="card">
        <BarChart
          data={runDistanceSeries(runs)}
          color="var(--run)"
          unit=" km"
          emptyHint="Noch keinen Lauf mit Distanz eingetragen."
        />
      </div>

      <h2 className="section-title">Einheiten pro Woche</h2>
      <div className="card">
        <BarChart
          data={sessionsPerWeekSeries(strength, runs)}
          color="var(--warn)"
          unit=""
          emptyHint="Noch nichts eingetragen."
        />
        <p className="tiny dim" style={{ margin: '10px 0 0' }}>
          Kraft und Laufen zusammen. Regelmäßigkeit schlägt einzelne harte Wochen — diese Kurve
          sagt am meisten aus.
        </p>
      </div>

      {runsWithDistance.length > 0 && (
        <>
          <h2 className="section-title">Letzte Läufe</h2>
          <div className="stack">
            {[...runsWithDistance]
              .reverse()
              .slice(0, 5)
              .map((r) => (
                <div key={r.id} className="card card-tight">
                  <div className="row-between">
                    <span className="small">{r.name}</span>
                    <span className="tiny dim nowrap">{formatDateShort(r.date)}</span>
                  </div>
                  <div className="tiny muted" style={{ marginTop: 2 }}>
                    {r.distanceKm} km
                    {r.avgHr ? ` · ⌀ ${r.avgHr} bpm` : ''}
                    {r.rpe ? ` · Anstrengung ${r.rpe}/10` : ''}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      <MatchSection />

      <h2 className="section-title">Deine Zonen</h2>

      {!hasOwnPerformanceData(settings) && (
        <div className="card card-warn" style={{ marginBottom: 12 }}>
          <p className="small" style={{ margin: 0 }}>
            <strong>Achtung: Platzhalterwerte.</strong> Die Zonen stimmen erst, wenn du unter
            „Mehr → Leistungsdaten" deine eigene HFmax und dein letztes Testergebnis einträgst.
          </p>
        </div>
      )}

      <div className="list">
        {zones.list.map((zone) => (
          <div key={zone.key} className="list-row" style={{ display: 'block' }}>
            <div className="row-between">
              <strong className="small">{zone.name}</strong>
              {zone.hr && (
                <span className="small nowrap num" style={{ color: 'var(--run)' }}>
                  {formatHrRange(zone.hr)}
                </span>
              )}
            </div>
            <div className="row-between list-sub" style={{ marginTop: 3 }}>
              <span>{zone.garmin}</span>
              {zone.pace && <span className="nowrap num">{formatPaceRange(zone.pace)}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="card card-tight" style={{ marginTop: 12 }}>
        <p className="tiny dim" style={{ margin: 0 }}>
          Aus HFmax {zones.hrMax} und deinem Test über {settings.testDistanceKm} km in{' '}
          {formatPaceSec(zones.testPaceSec)} min/km. Der Ruhepuls ({zones.hrRest}) verschiebt keine
          Grenze, er geht nur in die Karvonen-Angabe ein.
        </p>

        <Disclosure label="Warum das nicht zu den Zonen deiner Uhr passt">
          <p>
            Die Uhr teilt die HFmax in fünf gleich breite Bänder — „Zone 2" heißt dort schlicht
            60–70 % HFmax. Dieser Plan richtet sich nach dem physiologischen Modell, dessen Grenzen
            die beiden Laktatschwellen sind. Deshalb steht bei jeder Zone die Garmin-Nummer dabei.
          </p>
          <p>
            Im Zweifel gilt der Sprechtest, nicht die Zahl: Beim lockeren Lauf müssen ganze Sätze
            gehen. Wenn nicht, ist es zu schnell — unabhängig davon, was die Uhr anzeigt.
          </p>
        </Disclosure>

        <Disclosure label="Wofür jede Zone gut ist">
          {zones.list.map((zone) => (
            <p key={zone.key}>
              <strong style={{ color: 'var(--text)' }}>{zone.name}</strong>
              {zone.hr ? ` (${zone.hr.percentLabel})` : ''}: {zone.purpose}
            </p>
          ))}
        </Disclosure>
      </div>

      <h2 className="section-title">Körpergewicht</h2>
      <div className="card">
        <LineChart
          data={weightSeries.filter((p) => p.value > 0)}
          color="var(--text-muted)"
          unit=" kg"
          emptyHint="Optional — trag unten ein Gewicht ein, wenn du es mitverfolgen willst."
        />
        <WeightInput />
      </div>
    </div>
  )
}

/**
 * Die beiden Fokuspunkte aus den Beobachterbögen als Verlauf. Die Spieldistanz steht
 * bewusst daneben: Sie ist der objektive Gegenpol zur Selbsteinschätzung — wer sich
 * bei der Positionierung besser einschätzt, sollte im Spiel auch mehr laufen.
 */
function MatchSection() {
  const matches = useMatches()
  const [metric, setMetric] = useState<'positioning' | 'discipline' | 'distance'>('positioning')

  if (matches.length === 0) {
    return (
      <>
        <h2 className="section-title">Spielleitung</h2>
        <div className="card">
          <p className="small muted" style={{ marginTop: 0 }}>
            Noch kein Spiel nachbereitet. Nach dem nächsten Spiel Positionierung und
            Disziplinkontrolle bewerten — ab drei bis vier Einträgen wird ein Verlauf sichtbar.
          </p>
          <Link to="/spiel/neu" className="btn btn-ghost btn-block btn-sm">
            Spiel nachbereiten
          </Link>
        </div>
      </>
    )
  }

  const series = matches
    .map((m) => ({
      label: formatDateShort(m.date),
      value:
        metric === 'positioning'
          ? m.positioning
          : metric === 'discipline'
            ? m.discipline
            : (m.distanceKm ?? 0),
    }))
    .filter((p) => metric !== 'distance' || p.value > 0)

  const avg = (pick: (m: (typeof matches)[number]) => number) =>
    Math.round((matches.reduce((sum, m) => sum + pick(m), 0) / matches.length) * 10) / 10

  const withDistance = matches.filter((m) => m.distanceKm)

  return (
    <>
      <h2 className="section-title">Spielleitung</h2>

      <div className="stat-grid" style={{ marginBottom: 12 }}>
        <div className="stat">
          <div className="stat-value">{matches.length}</div>
          <div className="stat-label">Spiele</div>
        </div>
        <div className="stat">
          <div className="stat-value">{avg((m) => m.positioning)}</div>
          <div className="stat-label">⌀ Positionierung</div>
        </div>
        <div className="stat">
          <div className="stat-value">{avg((m) => m.discipline)}</div>
          <div className="stat-label">⌀ Disziplin</div>
        </div>
        {withDistance.length > 0 && (
          <div className="stat">
            <div className="stat-value">
              {Math.round(
                (withDistance.reduce((s, m) => s + (m.distanceKm ?? 0), 0) / withDistance.length) *
                  10,
              ) / 10}
            </div>
            <div className="stat-label">⌀ km im Spiel</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="chip-row" style={{ marginBottom: 14 }}>
          <button
            className="chip"
            data-active={metric === 'positioning'}
            onClick={() => setMetric('positioning')}
          >
            Positionierung
          </button>
          <button
            className="chip"
            data-active={metric === 'discipline'}
            onClick={() => setMetric('discipline')}
          >
            Disziplin
          </button>
          <button
            className="chip"
            data-active={metric === 'distance'}
            onClick={() => setMetric('distance')}
          >
            Distanz
          </button>
        </div>
        <LineChart
          data={series}
          color={metric === 'distance' ? 'var(--run)' : 'var(--warn)'}
          unit={metric === 'distance' ? ' km' : '/5'}
          emptyHint="Für diese Auswahl liegen noch keine Werte vor."
        />
      </div>
    </>
  )
}

/** Grenzen, außerhalb derer ein Tippfehler wahrscheinlicher ist als der Wert. */
const WEIGHT_MIN_KG = 30
const WEIGHT_MAX_KG = 250

function WeightInput() {
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)
  const guard = useWriteGuard()

  const weight = Number(value.replace(',', '.'))
  const valid = Number.isFinite(weight) && weight >= WEIGHT_MIN_KG && weight <= WEIGHT_MAX_KG

  async function save() {
    if (!valid) return
    if (!(await guard(() => upsertBodyLog({ date: todayISO(), weightKg: weight })))) return
    setValue('')
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div className="row" style={{ marginTop: 14, gap: 8 }}>
        <input
          className="input"
          type="number"
          inputMode="decimal"
          step="0.1"
          min={WEIGHT_MIN_KG}
          max={WEIGHT_MAX_KG}
          placeholder="Gewicht heute in kg"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Gewicht heute in Kilogramm"
        />
        <button className="btn btn-ghost nowrap" onClick={() => void save()} disabled={!valid}>
          {saved ? 'Gespeichert' : 'Eintragen'}
        </button>
      </div>
      {value !== '' && !valid && (
        <p className="tiny dim" style={{ margin: '6px 0 0' }}>
          Erwartet werden {WEIGHT_MIN_KG} bis {WEIGHT_MAX_KG} kg.
        </p>
      )}
    </>
  )
}
