import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES: { match: (path: string) => boolean; title: string }[] = [
  { match: (p) => p === '/', title: 'Heute' },
  { match: (p) => p.startsWith('/kraft/'), title: 'Krafteinheit' },
  { match: (p) => p.endsWith('/eintragen'), title: 'Lauf eintragen' },
  { match: (p) => p.startsWith('/lauf/'), title: 'Laufeinheit' },
  { match: (p) => p.startsWith('/spiel/'), title: 'Spiel nachbereiten' },
  { match: (p) => p === '/fortschritt', title: 'Fortschritt' },
  { match: (p) => p === '/uebungen/auswahl', title: 'Übungsauswahl' },
  { match: (p) => p.startsWith('/uebungen'), title: 'Übungen' },
  { match: (p) => p === '/verlauf', title: 'Verlauf' },
  { match: (p) => p === '/einstellungen', title: 'Einstellungen' },
]

/**
 * Hält den Fenstertitel zur Route passend und schickt den Fokus beim Seitenwechsel
 * zurück an den Anfang.
 *
 * In einer Single-Page-App merkt weder ein Screenreader noch die Tastaturbedienung
 * von selbst, dass sich die Seite gewechselt hat: Der Titel bliebe stehen und der
 * Fokus klebte am gerade angetippten Element der alten Seite.
 */
export function useRouteAnnounce(): void {
  const { pathname } = useLocation()

  useEffect(() => {
    const entry = TITLES.find((t) => t.match(pathname))
    document.title = entry ? `${entry.title} · Schiri-Trainer` : 'Schiri-Trainer'

    // Kein scrollTo: Der Router setzt die Position ohnehin, und mitten in einer
    // Einheit soll die Ansicht nicht springen.
    const main = document.getElementById('main')
    main?.focus({ preventScroll: true })
  }, [pathname])
}
