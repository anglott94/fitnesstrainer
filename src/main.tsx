import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ensureSettings } from './db/db'
import { requestPersistentStorage } from './lib/storage'
import './styles.css'

// Beim Start einmal dauerhaften Speicher anfordern. Chrome und Edge entscheiden das
// ohne Nachfrage anhand von Heuristiken; wird es gewährt, ist die Datenbank von der
// automatischen Bereinigung bei Speicherknappheit ausgenommen.
void requestPersistentStorage()

// Einstellungen anlegen, bevor gerendert wird — dann muss keine Seite einen
// Zustand „Einstellungen fehlen noch" behandeln.
void ensureSettings().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  )
})
