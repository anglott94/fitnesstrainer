import { useCallback, useEffect, useRef, useState } from 'react'
import { playRestOver, playTick, unlockAudio, vibrate } from '../lib/feedback'

export interface RestTimer {
  active: boolean
  paused: boolean
  /** Verbleibende Sekunden, aufgerundet. */
  remaining: number
  /** Ursprüngliche Pausenlänge in Sekunden. */
  total: number
  label: string
  start: (seconds: number, label?: string) => void
  addSeconds: (seconds: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
}

interface Options {
  soundEnabled: boolean
  vibrationEnabled: boolean
  onFinished?: () => void
}

/**
 * Countdown auf Basis eines Zeitstempels statt eines heruntergezählten Zählers.
 *
 * Wichtig auf dem Handy: Browser drosseln Timer im Hintergrund oder halten sie
 * bei gesperrtem Display ganz an. Ein hochgezählter Zähler ginge dabei falsch.
 * Ein gespeicherter Zielzeitpunkt zeigt nach dem Aufwachen sofort wieder den
 * richtigen Wert an.
 */
export function useRestTimer(opts: Options): RestTimer {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [pausedRemainingMs, setPausedRemainingMs] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [label, setLabel] = useState('')
  const [remaining, setRemaining] = useState(0)

  const lastTickSecond = useRef<number | null>(null)
  const finishedRef = useRef(false)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const clear = useCallback(() => {
    setEndsAt(null)
    setPausedRemainingMs(null)
    setRemaining(0)
    setTotal(0)
    setLabel('')
    lastTickSecond.current = null
  }, [])

  const start = useCallback((seconds: number, nextLabel = '') => {
    unlockAudio()
    finishedRef.current = false
    lastTickSecond.current = null
    setTotal(seconds)
    setLabel(nextLabel)
    setPausedRemainingMs(null)
    setRemaining(seconds)
    setEndsAt(Date.now() + seconds * 1000)
  }, [])

  const addSeconds = useCallback(
    (seconds: number) => {
      setTotal((t) => Math.max(0, t + seconds))
      if (pausedRemainingMs !== null) {
        setPausedRemainingMs((ms) => Math.max(0, (ms ?? 0) + seconds * 1000))
        setRemaining((r) => Math.max(0, r + seconds))
        return
      }
      setEndsAt((end) => (end === null ? null : Math.max(Date.now(), end + seconds * 1000)))
      finishedRef.current = false
    },
    [pausedRemainingMs],
  )

  const pause = useCallback(() => {
    setEndsAt((end) => {
      if (end === null) return null
      setPausedRemainingMs(Math.max(0, end - Date.now()))
      return null
    })
  }, [])

  const resume = useCallback(() => {
    setPausedRemainingMs((ms) => {
      if (ms === null) return null
      setEndsAt(Date.now() + ms)
      return null
    })
  }, [])

  // Anzeige aktualisieren und Signale auslösen.
  useEffect(() => {
    if (endsAt === null) return
    let frame = 0

    const tick = () => {
      const msLeft = endsAt - Date.now()
      const secLeft = Math.max(0, Math.ceil(msLeft / 1000))
      setRemaining(secLeft)

      const { soundEnabled, vibrationEnabled, onFinished } = optsRef.current

      if (secLeft > 0 && secLeft <= 3 && lastTickSecond.current !== secLeft) {
        lastTickSecond.current = secLeft
        playTick(soundEnabled)
      }

      if (msLeft <= 0 && !finishedRef.current) {
        finishedRef.current = true
        playRestOver(soundEnabled)
        vibrate(vibrationEnabled, [220, 90, 220, 90, 380])
        onFinished?.()
        setEndsAt(null)
        return
      }
      frame = window.setTimeout(tick, 200)
    }

    tick()
    return () => window.clearTimeout(frame)
  }, [endsAt])

  // Nach dem Zurückkehren aus dem Hintergrund sofort neu berechnen.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || endsAt === null) return
      setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [endsAt])

  return {
    active: endsAt !== null || pausedRemainingMs !== null,
    paused: pausedRemainingMs !== null,
    remaining: pausedRemainingMs !== null ? Math.ceil(pausedRemainingMs / 1000) : remaining,
    total,
    label,
    start,
    addSeconds,
    pause,
    resume,
    stop: clear,
  }
}
