import { exportBackup } from '../db/db'
import { todayISO } from './date'

/**
 * Lädt den aktuellen Bestand als JSON-Datei herunter und meldet, wie viele Einträge
 * drin waren.
 *
 * Wird an zwei Stellen gebraucht: für den Export von Hand und als automatische
 * Sicherung direkt vor Import und Löschen. Beides ersetzt den kompletten Bestand,
 * und die App kennt kein Rückgängig — ohne diese Datei wäre der Weg zurück versperrt.
 */
export async function downloadBackup(suffix = ''): Promise<number> {
  const backup = await exportBackup()
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `schiri-trainer-${suffix ? `${suffix}-` : ''}${todayISO()}.json`
  a.click()
  URL.revokeObjectURL(url)

  return (
    backup.strengthSessions.length +
    backup.runSessions.length +
    backup.matches.length +
    backup.bodyLogs.length
  )
}
