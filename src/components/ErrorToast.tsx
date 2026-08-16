import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Toast } from './Toast'

/**
 * Ein Ort für Fehler, die der Nutzer merken muss.
 *
 * Schreibvorgänge in die IndexedDB können fehlschlagen — voller Gerätespeicher, ein
 * privates Fenster, entzogene Berechtigung. Ohne Rückmeldung sieht der Satz abgehakt
 * aus, ist aber nicht gespeichert: genau der Fall, in dem stilles Scheitern am
 * teuersten ist. Deshalb landet jeder Fehlschlag sichtbar unten am Bildschirm.
 */
const ErrorToastContext = createContext<(error: unknown) => void>(() => {})

export function ErrorToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const report = useCallback((error: unknown) => {
    console.error(error)
    const detail = error instanceof Error ? error.message : String(error)
    setMessage(`Nicht gespeichert: ${detail}`)
  }, [])

  return (
    <ErrorToastContext.Provider value={report}>
      {children}
      <Toast message={message} onDismiss={() => setMessage(null)} duration={6000} />
    </ErrorToastContext.Provider>
  )
}

/**
 * Liefert `guard`: legt sich um einen Schreibvorgang und meldet Fehlschläge.
 * Der Rückgabewert sagt, ob es geklappt hat, damit der Aufrufer nichts weiterführt,
 * was auf dem Schreiben aufbaut.
 */
export function useWriteGuard() {
  const report = useContext(ErrorToastContext)
  return useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      try {
        await action()
        return true
      } catch (error) {
        report(error)
        return false
      }
    },
    [report],
  )
}
