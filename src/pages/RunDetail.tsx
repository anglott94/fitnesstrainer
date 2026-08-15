import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRun, RUN_BY_KEY, RUN_TYPE_LABEL } from '../domain/runs'
import { formatHrRange, formatPaceRange, zoneByKey } from '../domain/zones'
import { useSettings, useZones } from '../hooks/useAppData'
import { Toast } from '../components/Toast'
import { Disclosure } from '../components/Disclosure'

export default function RunDetail() {
  const { key } = useParams<{ key: string }>()
  const settings = useSettings()
  const zones = useZones(settings)
  const [toast, setToast] = useState<string | null>(null)
  const [short, setShort] = useState(false)

  const run = key && RUN_BY_KEY[key] ? getRun(key) : null
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

  const variant = short ? run.short : run.full
  const garmin = variant.garmin(zones)
  const target = variant.mainZone
    ? zoneByKey(zones, variant.mainZone)
    : { hr: undefined, pace: undefined }

  async function copyGarmin() {
    if (!run) return
    const title = short ? `${run.name} (Kurzform)` : run.name
    try {
      await navigator.clipboard.writeText(`${title}\n\n${garmin.join('\n')}`)
      setToast('Vorgabe kopiert')
    } catch {
      setToast('Kopieren hat nicht geklappt — bitte abtippen')
    }
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Heute
      </Link>

      <div className="page-header">
        <h1 className="page-title">{run.name}</h1>
        <span className="badge badge-run">{RUN_TYPE_LABEL[run.type]}</span>
      </div>
      <p className="page-subtitle">etwa {variant.approxMinutes} Minuten insgesamt</p>

      <div className="chip-row" style={{ marginBottom: 14 }}>
        <button className="chip" data-active={!short} onClick={() => setShort(false)}>
          Volle Einheit · {run.full.approxMinutes} Min
        </button>
        <button className="chip" data-active={short} onClick={() => setShort(true)}>
          Kurzform · {run.short.approxMinutes} Min
        </button>
      </div>

      {short && (
        <div className="card card-tight card-warn" style={{ marginBottom: 12 }}>
          <strong className="small">Was sich ändert</strong>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {run.shortNote}
          </p>
        </div>
      )}

      {(target.hr || target.pace) && (
        <div className="card card-run" style={{ marginBottom: 12 }}>
          <div className="grid-2">
            {target.hr && (
              <div>
                <div className="stat-label">Zielpuls Hauptteil</div>
                <div className="stat-value" style={{ color: 'var(--run)' }}>
                  {formatHrRange(target.hr)}
                </div>
                <div className="tiny dim">{target.hr.percentLabel}</div>
              </div>
            )}
            {target.pace && (
              <div>
                <div className="stat-label">Zieltempo</div>
                <div className="stat-value" style={{ color: 'var(--run)', fontSize: '1.25rem' }}>
                  {formatPaceRange(target.pace)}
                </div>
                <div className="tiny dim">abgeleitet aus deinem letzten Test</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card">
        <strong className="small">Wofür diese Einheit gut ist</strong>
        <p className="small muted" style={{ margin: '6px 0 0' }}>
          {run.why}
        </p>
        {run.evidence && (
          <Disclosure label="Sportwissenschaftlicher Hintergrund">
            <p>{run.evidence}</p>
          </Disclosure>
        )}
      </div>

      <h2 className="section-title">Für die Garmin</h2>
      <div className="card">
        <ul className="list-plain small" style={{ margin: 0 }}>
          {garmin.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        <button
          className="btn btn-ghost btn-block btn-sm"
          style={{ marginTop: 14 }}
          onClick={() => void copyGarmin()}
        >
          Vorgabe in die Zwischenablage kopieren
        </button>
      </div>

      <h2 className="section-title">Ablauf</h2>
      <div className="card">
        <Phase title="Aufwärmen" items={variant.warmup(zones)} />
        <Phase title="Hauptteil" items={variant.main(zones)} accent />
        <Phase title="Ausklang" items={variant.cooldown(zones)} />
      </div>

      <div className="card card-tight" style={{ marginTop: 12 }}>
        <strong className="small">Worauf achten</strong>
        <p className="small muted" style={{ margin: '4px 0 0' }}>
          {variant.effort(zones)}
        </p>
      </div>

      <Link
        to={`/lauf/${run.key}/eintragen`}
        className="btn btn-run btn-block btn-lg"
        style={{ marginTop: 22 }}
      >
        Lauf eintragen
      </Link>
      <p className="tiny dim center" style={{ marginTop: 10 }}>
        Die Uhr misst — hier trägst du nach dem Lauf nur die Eckdaten ein, damit der Verlauf stimmt.
      </p>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

/**
 * Ein Abschnitt des Ablaufs. Alle drei liegen in einer gemeinsamen Karte und werden
 * nur durch eine Farbkante getrennt — drei einzelne Karten untereinander erzeugen
 * mehr Rahmen als Struktur.
 */
function Phase({ title, items, accent }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${accent ? 'var(--run)' : 'var(--border-strong)'}`,
        paddingLeft: 12,
        marginBottom: 18,
      }}
    >
      <strong className="small" style={accent ? { color: 'var(--run)' } : undefined}>
        {title}
      </strong>
      <ul className="list-plain small muted" style={{ margin: '6px 0 0' }}>
        {items.map((item, i) =>
          // Leerzeilen trennen die Blöcke einer Kombi-Einheit optisch.
          item === '' ? (
            <li key={`gap-${i}`} style={{ listStyle: 'none', height: 8 }} />
          ) : (
            <li key={item}>{item}</li>
          ),
        )}
      </ul>
    </div>
  )
}
