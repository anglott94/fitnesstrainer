/** Lokales ISO-Datum (yyyy-mm-dd) - bewusst nicht toISOString(), das rechnet in UTC um. */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Montag der Woche, in der das Datum liegt - dient als eindeutiger Wochenschluessel. */
export function startOfWeek(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dow = (copy.getDay() + 6) % 7 // Montag = 0
  copy.setDate(copy.getDate() - dow)
  return copy
}

export function weekKey(iso: string): string {
  return toISODate(startOfWeek(parseISODate(iso)))
}

export function currentWeekKey(): string {
  return toISODate(startOfWeek(new Date()))
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function daysBetween(fromISO: string, toISOStr: string): number {
  const a = startOfDayMs(parseISODate(fromISO))
  const b = startOfDayMs(parseISODate(toISOStr))
  return Math.round((b - a) / 86_400_000)
}

function startOfDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function formatDateLong(iso: string): string {
  const d = parseISODate(iso)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateShort(iso: string): string {
  const d = parseISODate(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`
}

/** "heute", "gestern", "vor 3 Tagen", sonst das Datum. */
export function formatRelative(iso: string): string {
  const diff = daysBetween(iso, todayISO())
  if (diff === 0) return 'heute'
  if (diff === 1) return 'gestern'
  if (diff === 2) return 'vorgestern'
  if (diff > 0 && diff < 7) return `vor ${diff} Tagen`
  if (diff < 0) return formatDateShort(iso)
  return formatDateShort(iso)
}

/** Sekunden als m:ss bzw. h:mm:ss. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** Pace in min/km aus Distanz und Dauer. */
export function formatPace(distanceKm: number, durationSec: number): string {
  if (!distanceKm || !durationSec) return '-'
  const secPerKm = durationSec / distanceKm
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  const mm = s === 60 ? m + 1 : m
  const ss = s === 60 ? 0 : s
  return `${mm}:${String(ss).padStart(2, '0')} /km`
}
