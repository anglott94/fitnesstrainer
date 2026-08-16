import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RUNS, getRun } from '../domain/runs'
import { logRun } from '../db/repo'
import { formatPace, todayISO } from '../lib/date'
import { useWriteGuard } from '../components/ErrorToast'

export default function RunLog() {
  const { key } = useParams<{ key: string }>()
  const navigate = useNavigate()

  const [date, setDate] = useState(todayISO())
  const [distance, setDistance] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [hr, setHr] = useState('')
  const [rpe, setRpe] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const guard = useWriteGuard()

  const run = key && RUNS.some((r) => r.key === key) ? getRun(key) : null
  if (!run) {
    return (
      <div className="page">
        <h1 className="page-title">Nicht gefunden</h1>
        <Link to="/" className="btn btn-primary btn-block">
          Zur Startseite
        </Link>
      </div>
    )
  }

  const distanceKm = parseNumber(distance)
  const durationSec = toSeconds(minutes, seconds)
  const pace = distanceKm && durationSec ? formatPace(distanceKm, durationSec) : null

  // Ohne Distanz oder Dauer ist der Eintrag leer, würde die Woche aber trotzdem
  // als erledigt zählen. Puls und Notiz allein reichen dafür nicht.
  const canSave = distanceKm !== undefined || durationSec !== undefined

  async function save() {
    if (!run || !canSave) return
    setSaving(true)
    const ok = await guard(() =>
      logRun({
        planKey: run.key,
        date,
        distanceKm,
        durationSec,
        avgHr: parseNumber(hr),
        rpe,
        notes: notes.trim() || undefined,
      }),
    )
    // Nur weg von hier, wenn es wirklich gespeichert ist — sonst wären die
    // Eingaben mit dem Seitenwechsel verloren.
    if (!ok) {
      setSaving(false)
      return
    }
    navigate('/')
  }

  return (
    <div className="page">
      <Link to={`/lauf/${run.key}`} className="back-link">
        ← {run.name}
      </Link>
      <h1 className="page-title">Lauf eintragen</h1>
      <p className="page-subtitle">
        Nur das, was auf der Uhr steht — alles andere ist optional.
      </p>

      <div className="stack">
        <div className="field">
          <label className="field-label" htmlFor="date">
            Datum
          </label>
          <input
            id="date"
            className="input"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="dist">
            Distanz in Kilometern
          </label>
          <input
            id="dist"
            className="input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="8,4"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>

        <div className="field">
          <span className="field-label">Dauer</span>
          <div className="grid-2">
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Minuten"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              aria-label="Minuten"
            />
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min="0"
              max="59"
              placeholder="Sekunden"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              aria-label="Sekunden"
            />
          </div>
          {pace && (
            <span className="tiny" style={{ color: 'var(--run)' }}>
              Schnitt {pace}
            </span>
          )}
        </div>

        <div className="field">
          <label className="field-label" htmlFor="hr">
            Durchschnittliche Herzfrequenz (optional)
          </label>
          <input
            id="hr"
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="152"
            value={hr}
            onChange={(e) => setHr(e.target.value)}
          />
        </div>

        <div className="field">
          <span className="field-label">Wie anstrengend war es? (1 = locker, 10 = alles gegeben)</span>
          <div className="chip-row">
            {[3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <button key={v} className="chip" data-active={rpe === v} onClick={() => setRpe(v)}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="notes">
            Notiz (optional)
          </label>
          <textarea
            id="notes"
            className="textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Warm, Beine schwer, letzte Intervalle deutlich langsamer …"
          />
        </div>
      </div>

      <button
        className="btn btn-run btn-block btn-lg"
        style={{ marginTop: 20 }}
        onClick={() => void save()}
        disabled={saving || !canSave}
      >
        Speichern
      </button>
      {!canSave && (
        <p className="tiny dim" style={{ margin: '10px 2px 0', textAlign: 'center' }}>
          Trag mindestens die Distanz oder die Dauer ein.
        </p>
      )}
    </div>
  )
}

function parseNumber(raw: string): number | undefined {
  if (!raw.trim()) return undefined
  const value = Number(raw.replace(',', '.'))
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

function toSeconds(min: string, sec: string): number | undefined {
  const m = parseNumber(min) ?? 0
  // Das Sekundenfeld meint Sekunden, nicht „noch mehr Minuten". `max="59"` im
  // Markup hält nur die Pfeiltasten auf; getippt wird trotzdem alles.
  const s = Math.min(59, parseNumber(sec) ?? 0)
  const total = Math.round(m * 60 + s)
  return total > 0 ? total : undefined
}
