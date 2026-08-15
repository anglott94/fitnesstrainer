import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { exercisesForPattern } from '../domain/exercises'
import { PATTERNS, REQUIREMENT_LABEL } from '../domain/patterns'
import { scheduledExerciseKeys } from '../domain/balance'
import { useExerciseStates, useSettings } from '../hooks/useAppData'
import { Disclosure } from '../components/Disclosure'

export default function Exercises() {
  const states = useExerciseStates()
  const settings = useSettings()
  const disabled = settings.disabledExercises
  const scheduled = useMemo(() => scheduledExerciseKeys(disabled), [disabled])

  return (
    <div className="page">
      <h1 className="page-title">Übungen</h1>
      <p className="page-subtitle">
        Nach Bewegungsmustern geordnet. Innerhalb eines Musters können sich die Übungen gegenseitig
        ersetzen.
      </p>

      <Link to="/uebungen/auswahl" className="card card-accent card-button">
        <div className="row-between">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 620 }}>Übungen auswählen</div>
            <div className="tiny dim">
              {disabled.length === 0
                ? 'Alle Übungen aktiv'
                : `${disabled.length} abgewählt — Ersatz rückt automatisch nach`}
            </div>
          </div>
          <span className="dim">›</span>
        </div>
      </Link>

      <div className="card card-tight" style={{ marginTop: 12 }}>
        <strong className="small">Warum nach Bewegungsmustern</strong>
        <Disclosure label="Erklärung" >
          <p>
            Ein Ganzkörperplan gilt als vollständig, wenn er waagerechtes und senkrechtes Drücken,
            waagerechtes und senkrechtes Ziehen, eine knie- und eine hüftdominante Beinübung sowie
            Rumpfarbeit in den drei Stabilisationsrichtungen enthält. Diese Ordnung stammt aus der
            Trainingslehre und verhindert systematisch, dass ganze Bereiche durchs Raster fallen —
            etwa der Rücken als Gegenspieler zum vielen Drücken.
          </p>
          <p>
            Dazu kommen drei Muster, die bei hoher Lauf- und Sprintbelastung gesondert begründet
            sind: Wade und Achillessehne, Adduktoren und Hüftabduktoren.
          </p>
        </Disclosure>
      </div>

      {PATTERNS.map((pattern) => {
        const items = exercisesForPattern(pattern.key)
        if (items.length === 0) return null
        return (
          <div key={pattern.key}>
            <div className="group-head" data-tone={pattern.requirement}>
              <span className="group-name">{pattern.name}</span>
              <span className="group-meta">
                {REQUIREMENT_LABEL[pattern.requirement]}
                {pattern.balance ? ` · ${pattern.balance === 'push' ? 'Drücken' : 'Ziehen'}` : ''}
              </span>
            </div>
            <p className="tiny dim" style={{ margin: '0 0 9px 13px' }}>
              {pattern.covers}
            </p>
            <div className="list">
              {items.map((ex) => {
                const off = disabled.includes(ex.key)
                const target = states.find((s) => s.key === ex.key)?.target ?? ex.startTarget
                return (
                  <Link key={ex.key} to={`/uebungen/${ex.key}`} className="list-row" data-off={off}>
                    <div style={{ minWidth: 0 }}>
                      <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                        <span className="list-title">{ex.name}</span>
                        {off && <span className="badge">abgewählt</span>}
                        {!off && scheduled.has(ex.key) && (
                          <span className="badge badge-accent">im Plan</span>
                        )}
                      </div>
                      <div className="list-sub">
                        {target}
                        {ex.unit === 'seconds' ? 's' : ' Wdh'}
                        {ex.unilateral ? ' je Seite' : ''}
                      </div>
                    </div>
                    <span className="list-chevron">›</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
