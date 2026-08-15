import { useEffect, useRef } from 'react'

/**
 * Hält das Display während einer laufenden Einheit an.
 *
 * Ohne das geht der Bildschirm mitten im Satz aus und die Pausenzeit läuft
 * unbemerkt weiter. Die Wake Lock API gibt es nicht in jedem Browser (iOS erst
 * ab Safari 16.4) — fehlt sie, passiert einfach nichts.
 */
export function useWakeLock(enabled: boolean): void {
  const sentinel = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let cancelled = false

    const request = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          void lock.release()
          return
        }
        sentinel.current = lock
      } catch {
        // Wird z. B. abgelehnt, wenn der Tab nicht im Vordergrund ist — unkritisch.
      }
    }

    // Nach dem Zurückschalten in den Vordergrund ist die Sperre weg und muss neu.
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && sentinel.current === null) void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void sentinel.current?.release()
      sentinel.current = null
    }
  }, [enabled])
}
