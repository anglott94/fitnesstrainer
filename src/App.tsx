import { Route, Routes, useLocation } from 'react-router-dom'
import { ErrorToastProvider } from './components/ErrorToast'
import { Nav } from './components/Nav'
import { UpdatePrompt } from './components/UpdatePrompt'
import { useRouteAnnounce } from './hooks/useRouteAnnounce'
import Today from './pages/Today'
import StrengthSessionPage from './pages/StrengthSessionPage'
import RunDetail from './pages/RunDetail'
import RunLog from './pages/RunLog'
import MatchLog from './pages/MatchLog'
import Progress from './pages/Progress'
import Exercises from './pages/Exercises'
import ExercisePicker from './pages/ExercisePicker'
import ExerciseDetail from './pages/ExerciseDetail'
import History from './pages/History'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const location = useLocation()
  // Während einer laufenden Krafteinheit ist unten der Pausentimer — die
  // Navigation würde dort nur im Weg sein und zu Fehlgriffen führen.
  const hideNav = location.pathname.startsWith('/kraft/')
  useRouteAnnounce()

  return (
    <ErrorToastProvider>
      <div className="app" style={hideNav ? { paddingBottom: 0 } : undefined}>
        {/* tabIndex={-1}: nicht in der Tab-Reihenfolge, aber vom Router-Wechsel
            fokussierbar, damit Screenreader den Seitenwechsel mitbekommen. */}
        <main id="main" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/kraft/:id" element={<StrengthSessionPage />} />
            <Route path="/lauf/:key" element={<RunDetail />} />
            <Route path="/lauf/:key/eintragen" element={<RunLog />} />
            <Route path="/spiel/neu" element={<MatchLog />} />
            <Route path="/fortschritt" element={<Progress />} />
            <Route path="/uebungen" element={<Exercises />} />
            {/* Vor der :key-Route, sonst würde „auswahl" als Übungsschlüssel gelesen. */}
            <Route path="/uebungen/auswahl" element={<ExercisePicker />} />
            <Route path="/uebungen/:key" element={<ExerciseDetail />} />
            <Route path="/verlauf" element={<History />} />
            <Route path="/einstellungen" element={<SettingsPage />} />
            <Route path="*" element={<Today />} />
          </Routes>
        </main>
        {!hideNav && <Nav />}
      <UpdatePrompt />
      </div>
    </ErrorToastProvider>
  )
}
