/**
 * Dauerhaftigkeit des lokalen Speichers.
 *
 * IndexedDB übersteht das Schließen des Browsers problemlos — die Daten liegen auf
 * der Platte, nicht im Arbeitsspeicher. Standardmäßig gilt sie aber als „best effort":
 * Browser dürfen sie löschen, wenn der Speicherplatz knapp wird.
 *
 * Die Storage API kennt dafür einen dauerhaften Modus. Wird er gewährt, ist die
 * Datenbank von der automatischen Bereinigung ausgenommen und verschwindet nur noch,
 * wenn die Browserdaten ausdrücklich gelöscht werden.
 *
 * Chrome und Edge entscheiden ohne Nachfrage anhand von Heuristiken — als App zum
 * Startbildschirm hinzugefügt oder als Lesezeichen gesetzt, wird in der Regel gewährt.
 * Firefox fragt nach. Safari kennt die Anfrage nicht und löscht Website-Daten, die
 * sieben Tage lang nicht benutzt wurden — dort hilft nur, die App wirklich auf den
 * Home-Bildschirm zu legen. In allen Fällen bleibt der Export die letzte Sicherheit.
 */

export interface StorageStatus {
  supported: boolean
  persisted: boolean
  /** Belegter Speicher in Bytes, sofern ermittelbar. */
  usage?: number
  quota?: number
}

export async function getStorageStatus(): Promise<StorageStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage) {
    return { supported: false, persisted: false }
  }
  const supported = typeof navigator.storage.persist === 'function'
  let persisted = false
  try {
    persisted = (await navigator.storage.persisted?.()) ?? false
  } catch {
    persisted = false
  }

  let usage: number | undefined
  let quota: number | undefined
  try {
    const estimate = await navigator.storage.estimate?.()
    usage = estimate?.usage
    quota = estimate?.quota
  } catch {
    // Manche Browser liefern hier nichts — unkritisch, dann bleibt die Anzeige leer.
  }

  return { supported, persisted, usage, quota }
}

/** Fordert dauerhaften Speicher an. Gibt zurück, ob er danach aktiv ist. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.storage?.persist !== 'function') {
    return false
  }
  try {
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) return '–'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`
}
