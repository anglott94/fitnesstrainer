/**
 * Ton und Vibration für den Pausentimer.
 *
 * Der AudioContext wird bewusst erst beim ersten Tippen erzeugt und danach
 * wiederverwendet: Browser blockieren Audio, das ohne Nutzerinteraktion startet.
 * Deshalb ruft der Timer beim Start einmal unlock() auf.
 */

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Einmal bei einer Nutzeraktion aufrufen, damit später Töne erlaubt sind. */
export function unlockAudio(): void {
  getContext()
}

function tone(frequency: number, durationMs: number, delayMs: number, volume = 0.25): void {
  const audio = getContext()
  if (!audio) return
  const startAt = audio.currentTime + delayMs / 1000
  const endAt = startAt + durationMs / 1000

  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency

  // Sanft ein- und ausblenden, sonst knackt es hörbar.
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01)
  gain.gain.setValueAtTime(volume, endAt - 0.03)
  gain.gain.linearRampToValueAtTime(0, endAt)

  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(startAt)
  osc.stop(endAt + 0.02)
}

/** Kurzer, leiser Tick für den Countdown der letzten Sekunden. */
export function playTick(enabled: boolean): void {
  if (!enabled) return
  tone(880, 70, 0, 0.14)
}

/** Dreiklang, wenn die Pause vorbei ist. */
export function playRestOver(enabled: boolean): void {
  if (!enabled) return
  tone(660, 140, 0, 0.28)
  tone(880, 140, 170, 0.28)
  tone(1175, 260, 340, 0.3)
}

/** Bestätigung beim Abhaken eines Satzes. */
export function playSetDone(enabled: boolean): void {
  if (!enabled) return
  tone(760, 90, 0, 0.18)
}

export function vibrate(enabled: boolean, pattern: number | number[]): void {
  if (!enabled) return
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // Manche Browser melden hier trotz vorhandener API einen Fehler — ignorieren.
  }
}
