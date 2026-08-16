import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Hinweis auf eine neue Version.
 *
 * Ohne das bleibt eine installierte PWA leicht auf einem alten Stand hängen: Der
 * Service Worker liefert die zwischengespeicherten Dateien aus, holt die neue
 * Fassung erst im Hintergrund und übernimmt sie frühestens beim übernächsten
 * Start. Wer die App zwischendurch nicht wirklich beendet, sieht Änderungen
 * nie — und hält einen behobenen Fehler für weiterhin vorhanden.
 *
 * Deshalb: sichtbarer Hinweis statt stiller Aktualisierung. Automatisch neu zu
 * laden verbietet sich, das würde eine laufende Trainingseinheit abwürgen.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // Beim Start und danach stündlich nachsehen. Ohne eigene Prüfung fragt der
      // Browser je nach Situation tagelang nicht nach.
      void registration.update()
      setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="update-bar" role="status">
      <span className="small">Neue Version verfügbar</span>
      <button className="btn btn-primary btn-sm" onClick={() => void updateServiceWorker(true)}>
        Jetzt laden
      </button>
    </div>
  )
}
