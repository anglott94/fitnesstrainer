import { useEffect, useRef, useState } from 'react'
import {
  formatBytes,
  getStorageStatus,
  requestPersistentStorage,
  type StorageStatus,
} from '../lib/storage'
import { importBackup, markBackupDone, updateSettings, wipeAllData } from '../db/db'
import { db } from '../db/db'
import { downloadBackup } from '../lib/backupFile'
import {
  useBackupStatus,
  useDoneStrengthSessions,
  useMatches,
  useRunSessions,
  useSettings,
  useZones,
} from '../hooks/useAppData'
import { Toast } from '../components/Toast'
import { EXERCISES } from '../domain/exercises'
import { formatPaceRange, formatPaceSec, zoneByKey } from '../domain/zones'
import { formatRelative, todayISO } from '../lib/date'

export default function SettingsPage() {
  const settings = useSettings()
  const strength = useDoneStrengthSessions()
  const runs = useRunSessions()
  const matches = useMatches()
  const fileInput = useRef<HTMLInputElement>(null)
  const [toast, setToast] = useState<string | null>(null)
  const { newSinceBackup } = useBackupStatus(settings)

  const totalSessions = strength.length + runs.length

  async function handleExport() {
    try {
      const count = await downloadBackup()
      await markBackupDone(count)
      setToast('Sicherung heruntergeladen')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Sicherung fehlgeschlagen')
    }
  }

  async function handleImport(file: File) {
    if (
      !window.confirm(
        'Beim Einspielen wird der aktuelle Bestand vollständig ersetzt.\n\n' +
          'Vorher wird automatisch eine Sicherung des jetzigen Standes heruntergeladen. Fortfahren?',
      )
    ) {
      return
    }
    try {
      // Erst sichern, dann ersetzen. Wer die falsche Datei erwischt, hat damit
      // noch einen Weg zurück.
      await downloadBackup('vor-import')
      const text = await file.text()
      const result = await importBackup(JSON.parse(text))
      const skipped = result.skipped > 0 ? `, ${result.skipped} unlesbar übersprungen` : ''
      setToast(
        `Eingespielt: ${result.strengthSessions} Krafteinheiten, ${result.runSessions} Läufe, ${result.matches} Spiele${skipped}`,
      )
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Datei konnte nicht gelesen werden')
    }
  }

  async function handleReset() {
    if (!window.confirm('Wirklich alle Daten löschen? Das lässt sich nicht rückgängig machen.')) return
    if (
      !window.confirm(
        'Sicher? Vorher wird automatisch eine Sicherung heruntergeladen — nur darüber kommst du danach noch an die Daten.',
      )
    ) {
      return
    }
    try {
      await downloadBackup('vor-loeschen')
      await wipeAllData()
      setToast('Alle Daten gelöscht')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Löschen fehlgeschlagen')
    }
  }

  async function resetProgression() {
    if (!window.confirm('Alle Übungsvorgaben auf den Startwert zurücksetzen?')) return
    try {
      await db.exerciseStates.clear()
      setToast('Vorgaben zurückgesetzt')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Zurücksetzen fehlgeschlagen')
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Einstellungen</h1>
      <p className="page-subtitle">
        {totalSessions} Einheiten und {matches.length}{' '}
        {matches.length === 1 ? 'Spiel' : 'Spiele'} gespeichert.
      </p>

      {/* Steht bewusst ganz oben: Wenn etwas nicht funktioniert, ist die erste
          Frage, welcher Stand ueberhaupt laeuft. Ganz unten sucht das niemand. */}
      <h2 className="section-title" style={{ marginTop: 0 }}>
        Version
      </h2>
      <VersionCard />

      <h2 className="section-title">Während des Trainings</h2>
      <div className="card">
        <Toggle
          label="Ton"
          hint="Signal am Ende der Satzpause und beim Abhaken."
          value={settings.soundEnabled}
          onChange={(v) => void updateSettings({ soundEnabled: v })}
        />
        <Toggle
          label="Vibration"
          hint="Zusätzlich spürbar, wenn das Handy in der Tasche liegt."
          value={settings.vibrationEnabled}
          onChange={(v) => void updateSettings({ vibrationEnabled: v })}
        />
        <Toggle
          label="Display anlassen"
          hint="Verhindert, dass der Bildschirm mitten im Satz ausgeht."
          value={settings.keepScreenAwake}
          onChange={(v) => void updateSettings({ keepScreenAwake: v })}
        />
      </div>

      <PerformanceSection />

      <h2 className="section-title">Wochenpensum</h2>
      <div className="card">
        <div className="field" style={{ marginBottom: 14 }}>
          <label className="field-label" htmlFor="strengthPerWeek">
            Krafteinheiten pro Woche
          </label>
          <select
            id="strengthPerWeek"
            className="select"
            value={settings.strengthPerWeek}
            onChange={(e) => void updateSettings({ strengthPerWeek: Number(e.target.value) })}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="runsPerWeek">
            Läufe pro Woche
          </label>
          <select
            id="runsPerWeek"
            className="select"
            value={settings.runsPerWeek}
            onChange={(e) => void updateSettings({ runsPerWeek: Number(e.target.value) })}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
          </select>
        </div>
        <p className="tiny dim" style={{ marginBottom: 0, marginTop: 12 }}>
          Das ist die Vorgabe, nicht die Pflicht. Der Plan läuft in 4-Wochen-Blöcken; jede vierte
          Woche ist eine Entlastungswoche mit reduzierten Vorgaben.
        </p>
      </div>

      <h2 className="section-title">Deine Daten</h2>
      <StorageCard />

      <div className="card card-warn" style={{ marginTop: 12 }}>
        <p className="small" style={{ margin: 0 }}>
          Alle Daten liegen ausschließlich in diesem Browser — kein Server, kein Konto, keine Kosten.
          Normales Schließen des Browsers ist unkritisch. Weg sind sie, wenn du die Browserdaten
          löschst oder das Gerät wechselst. Lade deshalb hin und wieder eine Sicherung herunter.
        </p>
      </div>

      <div className="stack" style={{ marginTop: 12 }}>
        <button className="btn btn-block" onClick={() => void handleExport()}>
          Sicherung herunterladen
        </button>
        <p className="tiny dim" style={{ margin: '-4px 0 4px', textAlign: 'center' }}>
          {settings.lastBackupAt
            ? `Zuletzt gesichert ${formatRelative(settings.lastBackupAt)} · seitdem ${newSinceBackup} neue ${newSinceBackup === 1 ? 'Eintrag' : 'Einträge'}`
            : 'Noch nie gesichert.'}
        </p>
        <button className="btn btn-ghost btn-block" onClick={() => fileInput.current?.click()}>
          Sicherung einspielen
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleImport(file)
            e.target.value = ''
          }}
        />
      </div>

      <h2 className="section-title">Zurücksetzen</h2>
      <div className="stack">
        <button className="btn btn-ghost btn-block" onClick={() => void resetProgression()}>
          Übungsvorgaben zurücksetzen
        </button>
        <p className="tiny dim" style={{ margin: '-4px 0 8px' }}>
          Setzt alle {EXERCISES.length} Übungen wieder auf den Startwert. Sinnvoll nach einer langen
          Pause. Verlauf und Statistik bleiben erhalten.
        </p>
        <button className="btn btn-danger btn-block" onClick={() => void handleReset()}>
          Alle Daten löschen
        </button>
      </div>

      <h2 className="section-title">Über die App</h2>
      <div className="card">
        <p className="small muted" style={{ marginTop: 0 }}>
          Schiri-Trainer läuft vollständig offline. Zum Installieren auf dem Handy: im Browser das
          Teilen- bzw. Menü-Symbol antippen und „Zum Startbildschirm hinzufügen" wählen.
        </p>
        <p className="tiny dim" style={{ margin: 0 }}>
          Trainingsstart: {settings.startDate}. Die App ist kein Ersatz für ärztlichen Rat — bei
          Schmerzen, die über normalen Muskelkater hinausgehen, bitte pausieren und abklären lassen.
        </p>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

/**
 * Zeigt an, welcher Stand tatsächlich läuft, und erlaubt eine erzwungene
 * Aktualisierung.
 *
 * Eine installierte PWA liefert zwischengespeicherte Dateien aus. Ohne sichtbares
 * Datum lässt sich nicht unterscheiden, ob ein Fehler noch besteht oder ob nur
 * eine alte Fassung läuft — beim Melden von Fehlern ist das der entscheidende
 * Unterschied.
 */
function VersionCard() {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const built = new Date(__BUILD_TIME__)
  const stamp = `${String(built.getDate()).padStart(2, '0')}.${String(built.getMonth() + 1).padStart(2, '0')}.${built.getFullYear()}, ${String(built.getHours()).padStart(2, '0')}:${String(built.getMinutes()).padStart(2, '0')}`

  async function forceUpdate() {
    setBusy(true)
    setStatus('Suche …')
    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      await registration?.update()
      // Zwischenspeicher leeren, sonst liefert der alte Service Worker beim
      // Neuladen erneut die alten Dateien aus.
      if (typeof caches !== 'undefined') {
        const names = await caches.keys()
        await Promise.all(names.map((n) => caches.delete(n)))
      }
      setStatus('Wird neu geladen …')
      window.location.reload()
    } catch {
      setStatus('Hat nicht geklappt — App bitte schließen und neu öffnen.')
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <div className="row-between">
        <div>
          <strong className="small">Installierter Stand</strong>
          <div className="tiny dim num">{stamp}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => void forceUpdate()} disabled={busy}>
          {status ?? 'Nach Update suchen'}
        </button>
      </div>
      <p className="tiny dim" style={{ margin: '10px 0 0' }}>
        Meldest du einen Fehler, nenn dieses Datum mit. Weicht es vom aktuellen Stand ab, läuft
        hier noch eine ältere Fassung aus dem Zwischenspeicher — dann hilft dieser Knopf.
      </p>
    </div>
  )
}

/**
 * Zeigt, ob der Browser die Datenbank als dauerhaft führt. Ohne diesen Status wäre
 * „local-first" ein Versprechen, das man nicht überprüfen kann.
 */
function StorageCard() {
  const [status, setStatus] = useState<StorageStatus | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getStorageStatus().then(setStatus)
  }, [])

  async function request() {
    setBusy(true)
    await requestPersistentStorage()
    setStatus(await getStorageStatus())
    setBusy(false)
  }

  if (!status) return null

  if (!status.supported) {
    return (
      <div className="card card-tight">
        <strong className="small">Speicherstatus</strong>
        <p className="tiny muted" style={{ margin: '4px 0 0' }}>
          Dieser Browser kennt die Abfrage nicht. Die Daten überstehen normales Schließen trotzdem,
          können aber bei Speicherknappheit entfernt werden. Regelmäßig sichern.
        </p>
      </div>
    )
  }

  return (
    <div className={`card ${status.persisted ? 'card-accent' : ''}`}>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <strong className="small">Speicher</strong>
        <span className={`badge ${status.persisted ? 'badge-accent' : 'badge-warn'}`}>
          {status.persisted ? 'dauerhaft' : 'nicht dauerhaft'}
        </span>
      </div>

      <p className="tiny muted" style={{ margin: 0 }}>
        {status.persisted
          ? 'Der Browser hat die Datenbank als dauerhaft markiert. Sie wird nicht mehr automatisch entfernt, wenn der Speicher knapp wird — nur noch beim ausdrücklichen Löschen der Browserdaten.'
          : 'Der Browser darf die Daten löschen, wenn der Speicherplatz knapp wird. Anfordern hilft — Chrome und Edge gewähren es meist, sobald die Seite als App installiert oder als Lesezeichen gesetzt ist.'}
      </p>

      {status.usage !== undefined && (
        <p className="tiny dim" style={{ margin: '6px 0 0' }}>
          Belegt: {formatBytes(status.usage)}
          {status.quota ? ` von ${formatBytes(status.quota)} verfügbar` : ''}
        </p>
      )}

      {!status.persisted && (
        <button
          className="btn btn-ghost btn-block btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => void request()}
          disabled={busy}
        >
          Dauerhaften Speicher anfordern
        </button>
      )}
    </div>
  )
}

/**
 * Leistungsdaten. Alles, was in den Laufeinheiten an Puls- und Tempovorgaben steht,
 * leitet sich aus diesen fünf Zahlen ab — nach einem neuen Test also nur hier ändern.
 */
function PerformanceSection() {
  const settings = useSettings()
  const zones = useZones(settings)

  const [hrMax, setHrMax] = useState(String(settings.hrMax))
  const [hrRest, setHrRest] = useState(String(settings.hrRest))
  const [testKm, setTestKm] = useState(String(settings.testDistanceKm))
  const [testMin, setTestMin] = useState(() =>
    String(Math.floor((settings.testPaceSecPerKm * settings.testDistanceKm) / 60)),
  )
  const [testSec, setTestSec] = useState(() =>
    String(Math.round((settings.testPaceSecPerKm * settings.testDistanceKm) % 60)),
  )
  const [testDate, setTestDate] = useState(settings.testDate)
  const [saved, setSaved] = useState(false)

  /**
   * Felder nachziehen, sobald die gespeicherten Werte eintreffen.
   *
   * useState wertet seinen Startwert nur beim ersten Rendern aus. Zu dem Zeitpunkt
   * hat die Datenbankabfrage noch nicht geantwortet, useSettings liefert also die
   * Platzhalter — und die blieben ohne diesen Effekt für immer im Formular stehen,
   * obwohl die Datenbank längst die richtigen Werte enthielt. Beim Tippen ändern
   * sich die Abhängigkeiten nicht, laufende Eingaben werden also nicht überschrieben.
   */
  useEffect(() => {
    const totalSeconds = settings.testPaceSecPerKm * settings.testDistanceKm
    setHrMax(String(settings.hrMax))
    setHrRest(String(settings.hrRest))
    setTestKm(String(settings.testDistanceKm))
    setTestMin(String(Math.floor(totalSeconds / 60)))
    setTestSec(String(Math.round(totalSeconds % 60)))
    setTestDate(settings.testDate)
  }, [
    settings.hrMax,
    settings.hrRest,
    settings.testDistanceKm,
    settings.testPaceSecPerKm,
    settings.testDate,
  ])

  const km = Number(testKm.replace(',', '.'))
  const totalSec = (Number(testMin) || 0) * 60 + (Number(testSec) || 0)
  const paceSec = km > 0 && totalSec > 0 ? Math.round(totalSec / km) : 0

  // Aus diesen Werten leiten sich sämtliche Puls- und Tempovorgaben ab. Eine HFmax
  // von 900 wäre bisher durchgegangen und hätte jede Zone still verschoben.
  const hrMaxNum = Number(hrMax)
  const hrRestNum = Number(hrRest)
  const hrMaxPlausible = hrMaxNum >= 120 && hrMaxNum <= 230
  const hrRestPlausible = hrRestNum >= 30 && hrRestNum <= 100
  const valid = hrMaxPlausible && hrRestPlausible && hrMaxNum > hrRestNum && paceSec > 0

  async function save() {
    if (!valid) return
    await updateSettings({
      hrMax: hrMaxNum,
      hrRest: hrRestNum,
      testDistanceKm: km,
      testPaceSecPerKm: paceSec,
      testDate: testDate || todayISO(),
    })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  return (
    <>
      <h2 className="section-title">Leistungsdaten</h2>
      <div className="card">
        <div className="grid-2">
          <div className="field">
            <label className="field-label" htmlFor="hrmax">
              HFmax (bpm)
            </label>
            <input
              id="hrmax"
              className="input"
              type="number"
              inputMode="numeric"
              value={hrMax}
              onChange={(e) => setHrMax(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="hrrest">
              Ruhepuls (bpm)
            </label>
            <input
              id="hrrest"
              className="input"
              type="number"
              inputMode="numeric"
              value={hrRest}
              onChange={(e) => setHrRest(e.target.value)}
            />
          </div>
        </div>

        <div className="divider" />

        <span className="field-label" style={{ display: 'block', marginBottom: 8 }}>
          Letzter All-out-Test
        </span>
        <div className="grid-3">
          <div className="field">
            <label className="field-label" htmlFor="testkm">
              km
            </label>
            <input
              id="testkm"
              className="input"
              type="number"
              inputMode="decimal"
              step="0.1"
              value={testKm}
              onChange={(e) => setTestKm(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="testmin">
              Minuten
            </label>
            <input
              id="testmin"
              className="input"
              type="number"
              inputMode="numeric"
              value={testMin}
              onChange={(e) => setTestMin(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="testsec">
              Sekunden
            </label>
            <input
              id="testsec"
              className="input"
              type="number"
              inputMode="numeric"
              value={testSec}
              onChange={(e) => setTestSec(e.target.value)}
            />
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label className="field-label" htmlFor="testdate">
            Datum des Tests (optional)
          </label>
          <input
            id="testdate"
            className="input"
            type="date"
            max={todayISO()}
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
          />
        </div>

        {paceSec > 0 && (
          <p className="tiny" style={{ margin: '12px 0 0', color: 'var(--run)' }}>
            Ergibt {formatPaceSec(paceSec)} min/km · Schwelle{' '}
            {formatPaceRange(zoneByKey(zones, 'schwelle').pace!)} · Intervall{' '}
            {formatPaceRange(zoneByKey(zones, 'intervall').pace!)}
          </p>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 14 }}
          onClick={() => void save()}
          disabled={!valid}
        >
          {saved ? 'Gespeichert' : 'Leistungsdaten übernehmen'}
        </button>

        {!valid && (
          <p className="tiny dim" style={{ margin: '8px 0 0', textAlign: 'center' }}>
            {!hrMaxPlausible
              ? 'HFmax wird zwischen 120 und 230 erwartet.'
              : !hrRestPlausible
                ? 'Ruhepuls wird zwischen 30 und 100 erwartet.'
                : hrMaxNum <= hrRestNum
                  ? 'HFmax muss über dem Ruhepuls liegen.'
                  : 'Trag noch Distanz und Zeit deines Tests ein.'}
          </p>
        )}

        <div className="divider" />

        <strong className="tiny dim">Wie genau müssen die Werte sein?</strong>
        <p className="tiny muted" style={{ margin: '6px 0 0' }}>
          <strong>HFmax</strong> ist der kritische Wert — an ihr hängt jede Zonengrenze. Stammt sie
          aus einer Faustformel wie 220 minus Alter, kann sie um 10 und mehr Schläge danebenliegen.
          Verlässlicher: der höchste Puls, den die Uhr in deinem letzten All-out-Test aufgezeichnet
          hat, plus 2–3 Schläge (die letzten Sekunden liegen selten wirklich am Anschlag).
        </p>
        <p className="tiny muted" style={{ margin: '8px 0 0' }}>
          <strong>Ruhepuls</strong> ist unkritisch: Er verschiebt keine Zonengrenze, sondern nur die
          zusätzlich angezeigte Karvonen-Angabe. Wenn du ihn genauer willst — Garmin Connect führt
          einen 7-Tage-Ruhepuls, das ist der beste verfügbare Wert.
        </p>
        <p className="tiny dim" style={{ marginBottom: 0, marginTop: 12 }}>
          Den Test alle 8–12 Wochen wiederholen, sonst trainierst du irgendwann nach Zahlen von
          gestern. Die Zonenübersicht unter „Fortschritt" aktualisiert sich nach dem Speichern.
        </p>
      </div>
    </>
  )
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="switch-row">
      <div style={{ minWidth: 0 }}>
        <div className="small" style={{ fontWeight: 600 }}>
          {label}
        </div>
        <div className="tiny dim">{hint}</div>
      </div>
      <button
        className="switch"
        data-on={value}
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
      />
    </div>
  )
}
