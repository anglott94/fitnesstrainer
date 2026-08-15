import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logMatch } from '../db/repo'
import { todayISO } from '../lib/date'

/**
 * Nachbereitung eines geleiteten Spiels — bewusst auf die zwei Fokuspunkte aus den
 * Beobachterbögen beschränkt und mit Ankertexten je Stufe.
 *
 * Eine nackte 1–5-Skala ohne Anker driftet über eine Saison: Was im August eine 4
 * war, ist im November eine 3, ohne dass sich die Leistung geändert hätte. Mit
 * beschriebenen Stufen bleibt die Reihe über Monate vergleichbar.
 */

interface Anchor {
  value: number
  label: string
}

const POSITIONING: Anchor[] = [
  { value: 1, label: 'Oft zu weit weg, Szenen aus der Distanz beurteilt' },
  { value: 2, label: 'Diagonale mehrfach verlassen, Sicht häufiger verstellt' },
  { value: 3, label: 'Meist gute Position, bei Umschaltmomenten hinterher' },
  { value: 4, label: 'Nah am Geschehen, nur einzelne Szenen aus schlechtem Winkel' },
  { value: 5, label: 'Durchgehend nah dran, freie Sicht auf alle Zweikämpfe' },
]

const DISCIPLINE: Anchor[] = [
  { value: 1, label: 'Spiel drohte zu kippen, Eingriffe kamen zu spät' },
  { value: 2, label: 'Mehrere Situationen zu lange laufen lassen' },
  { value: 3, label: 'Im Griff, aber Linie nicht durchgehend gleich' },
  { value: 4, label: 'Früh angesprochen, Linie weitgehend konsequent' },
  { value: 5, label: 'Klare Linie von Beginn an, Karten konsequent und akzeptiert' },
]

export default function MatchLog() {
  const navigate = useNavigate()
  const [date, setDate] = useState(todayISO())
  const [competition, setCompetition] = useState('Landesliga')
  const [positioning, setPositioning] = useState<number | null>(null)
  const [discipline, setDiscipline] = useState<number | null>(null)
  const [distance, setDistance] = useState('')
  const [avgHr, setAvgHr] = useState('')
  const [maxHr, setMaxHr] = useState('')
  const [keyScene, setKeyScene] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave = positioning !== null && discipline !== null

  async function save() {
    if (!canSave) return
    setSaving(true)
    await logMatch({
      date,
      competition: competition.trim() || 'Spiel',
      positioning: positioning!,
      discipline: discipline!,
      distanceKm: parseNumber(distance),
      avgHr: parseNumber(avgHr),
      maxHr: parseNumber(maxHr),
      keyScene: keyScene.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    navigate('/verlauf')
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Heute
      </Link>
      <h1 className="page-title">Spiel nachbereiten</h1>
      <p className="page-subtitle">
        Deine zwei Fokuspunkte aus den Beobachterbögen. Am besten direkt nach dem Spiel — nach
        drei Tagen erinnerst du nur noch die Aufreger.
      </p>

      <div className="stack">
        <div className="grid-2">
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
            <label className="field-label" htmlFor="competition">
              Wettbewerb
            </label>
            <input
              id="competition"
              className="input"
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
            />
          </div>
        </div>
      </div>

      <h2 className="section-title">Positionierung</h2>
      <RatingGroup anchors={POSITIONING} value={positioning} onChange={setPositioning} />

      <h2 className="section-title">Disziplinkontrolle</h2>
      <RatingGroup anchors={DISCIPLINE} value={discipline} onChange={setDiscipline} />

      <h2 className="section-title">Von der Uhr</h2>
      <div className="grid-3">
        <div className="field">
          <label className="field-label" htmlFor="dist">
            km
          </label>
          <input
            id="dist"
            className="input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="10,2"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="avg">
            ⌀ Puls
          </label>
          <input
            id="avg"
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="148"
            value={avgHr}
            onChange={(e) => setAvgHr(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="max">
            Max
          </label>
          <input
            id="max"
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="182"
            value={maxHr}
            onChange={(e) => setMaxHr(e.target.value)}
          />
        </div>
      </div>
      <p className="tiny dim" style={{ marginTop: 8 }}>
        Die Laufdistanz im Spiel ist der ehrlichste Gradmesser für Positionierung: Wer nah am
        Geschehen bleibt, läuft mehr — nicht weniger.
      </p>

      <h2 className="section-title">Schwierigste Szene</h2>
      <div className="field">
        <textarea
          className="textarea"
          value={keyScene}
          onChange={(e) => setKeyScene(e.target.value)}
          placeholder="63. Minute, Zweikampf an der Seitenlinie — stand ungünstig, Sicht durch Spieler verstellt …"
        />
        <span className="tiny dim">
          Eine konkrete Szene bringt mehr als eine allgemeine Bewertung. Genau daraus entsteht der
          nächste Fokuspunkt.
        </span>
      </div>

      <h2 className="section-title">Sonstiges</h2>
      <div className="field">
        <textarea
          className="textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Karten, Wetter, Platzverhältnisse, Rückmeldung des Beobachters …"
        />
      </div>

      <button
        className="btn btn-primary btn-block btn-lg"
        style={{ marginTop: 20 }}
        onClick={() => void save()}
        disabled={!canSave || saving}
      >
        {canSave ? 'Spiel speichern' : 'Bitte beide Fokuspunkte bewerten'}
      </button>
    </div>
  )
}

function RatingGroup({
  anchors,
  value,
  onChange,
}: {
  anchors: Anchor[]
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <div className="list">
      {anchors.map((a) => {
        const selected = value === a.value
        return (
          <button
            key={a.value}
            className="list-row"
            style={selected ? { background: 'var(--match-dim)' } : undefined}
            onClick={() => onChange(a.value)}
          >
            <span
              className="exercise-index"
              style={{
                marginTop: 0,
                flexShrink: 0,
                background: selected ? 'var(--match)' : 'var(--surface)',
                color: selected ? '#1a1033' : 'var(--text-muted)',
              }}
            >
              {a.value}
            </span>
            <span
              className="small"
              style={{ flex: 1, color: selected ? 'var(--text)' : 'var(--text-muted)' }}
            >
              {a.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function parseNumber(raw: string): number | undefined {
  if (!raw.trim()) return undefined
  const value = Number(raw.replace(',', '.'))
  return Number.isFinite(value) && value >= 0 ? value : undefined
}
