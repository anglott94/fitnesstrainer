export interface ChartPoint {
  label: string
  value: number
  /** Überschreibt die Punktfarbe — etwa für die Unterstützungsstufe bei Klimmzügen. */
  color?: string
}

const W = 320
const H = 150
const PAD_L = 32
const PAD_R = 10
const PAD_T = 14
const PAD_B = 24

const TICK_STEPS = 3

interface Scale {
  min: number
  max: number
  step: number
  y: (v: number) => number
}

/** Rundet auf 1, 2, 5 oder 10 mal Zehnerpotenz — die Werte, die als Achse lesbar sind. */
function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 1
  const exponent = Math.floor(Math.log10(rawStep))
  const magnitude = Math.pow(10, exponent)
  const fraction = rawStep / magnitude
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return nice * magnitude
}

/**
 * Skala mit runden Achsenwerten. Krumme Beschriftungen wie „141,9" sind auf
 * einem Handydisplay unlesbar — deshalb wird der Bereich auf glatte Schritte
 * aufgerundet, auch wenn dadurch oben etwas Luft entsteht.
 */
function makeScale(values: number[]): Scale {
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)

  let lo = Math.min(0, rawMin)
  let hi = rawMax

  // Alle Werte gleich: künstlicher Bereich, sonst würde durch null geteilt.
  if (hi === lo) hi = lo + 1

  const step = niceStep((hi - lo) / TICK_STEPS)
  const min = Math.floor(lo / step) * step
  const max = Math.ceil(hi / step) * step
  const span = max - min || 1

  return {
    min,
    max,
    step,
    y: (v: number) => H - PAD_B - ((v - min) / span) * (H - PAD_T - PAD_B),
  }
}

function gridLines(scale: Scale) {
  const lines: { value: number; y: number }[] = []
  // Rundungsreste beim Aufaddieren abfangen (0.1 + 0.2 …).
  const count = Math.round((scale.max - scale.min) / scale.step)
  for (let i = 0; i <= count; i++) {
    const value = scale.min + scale.step * i
    lines.push({ value, y: scale.y(value) })
  }
  return lines
}

function formatTick(v: number): string {
  const rounded = Math.abs(v) < 1e-9 ? 0 : v
  if (Math.abs(rounded) >= 1000) return `${Math.round(rounded / 100) / 10}k`
  if (Number.isInteger(rounded)) return String(rounded)
  return String(Math.round(rounded * 100) / 100)
}

function xLabelIndices(count: number): number[] {
  if (count <= 1) return [0]
  if (count <= 4) return Array.from({ length: count }, (_, i) => i)
  return [0, Math.floor((count - 1) / 2), count - 1]
}

interface ChartProps {
  data: ChartPoint[]
  color?: string
  /** Einheit für die Wertebeschriftung des letzten Punktes. */
  unit?: string
  emptyHint?: string
}

export function LineChart({ data, color = 'var(--accent)', unit = '', emptyHint }: ChartProps) {
  if (data.length === 0) {
    return <div className="chart-empty">{emptyHint ?? 'Noch keine Daten.'}</div>
  }

  const scale = makeScale(data.map((d) => d.value))
  const innerW = W - PAD_L - PAD_R
  const x = (i: number) => (data.length === 1 ? PAD_L + innerW / 2 : PAD_L + (i / (data.length - 1)) * innerW)

  const points = data.map((d, i) => `${x(i)},${scale.y(d.value)}`).join(' ')
  const areaPath = `M ${x(0)},${H - PAD_B} L ${points.split(' ').join(' L ')} L ${x(data.length - 1)},${H - PAD_B} Z`
  const last = data[data.length - 1]
  const labelIdx = xLabelIndices(data.length)

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Verlauf, zuletzt ${last.value}${unit}`}>
      {gridLines(scale).map((g, i) => (
        <g key={i}>
          <line x1={PAD_L} y1={g.y} x2={W - PAD_R} y2={g.y} stroke="var(--border)" strokeWidth={1} />
          <text x={PAD_L - 6} y={g.y + 3.5} textAnchor="end" fontSize={9} fill="var(--text-dim)">
            {formatTick(g.value)}
          </text>
        </g>
      ))}

      {data.length > 1 && <path d={areaPath} fill={color} opacity={0.1} />}

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {data.map((d, i) => {
        // Ein eigener Punktfarbwert schlägt die Serienfarbe und wird immer gefüllt
        // gezeichnet — sonst wäre die Stufe bei kleinen Punkten kaum zu erkennen.
        const dotColor = d.color ?? color
        const filled = d.color !== undefined || i === data.length - 1
        return (
          <circle
            key={i}
            cx={x(i)}
            cy={scale.y(d.value)}
            r={d.color !== undefined ? 4 : i === data.length - 1 ? 4 : 2.6}
            fill={filled ? dotColor : 'var(--bg)'}
            stroke={dotColor}
            strokeWidth={2}
          />
        )
      })}

      {labelIdx.map((i) => (
        <text
          key={i}
          x={x(i)}
          y={H - 7}
          textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
          fontSize={9}
          fill="var(--text-dim)"
        >
          {data[i].label}
        </text>
      ))}
    </svg>
  )
}

export function BarChart({ data, color = 'var(--accent)', unit = '', emptyHint }: ChartProps) {
  if (data.length === 0) {
    return <div className="chart-empty">{emptyHint ?? 'Noch keine Daten.'}</div>
  }

  const scale = makeScale(data.map((d) => d.value))
  const innerW = W - PAD_L - PAD_R
  const slot = innerW / data.length
  const barW = Math.min(26, slot * 0.66)
  const labelIdx = xLabelIndices(data.length)
  const zeroY = scale.y(Math.max(0, scale.min))

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Balkendiagramm in ${unit || 'Einheiten'}`}>
      {gridLines(scale).map((g, i) => (
        <g key={i}>
          <line x1={PAD_L} y1={g.y} x2={W - PAD_R} y2={g.y} stroke="var(--border)" strokeWidth={1} />
          <text x={PAD_L - 6} y={g.y + 3.5} textAnchor="end" fontSize={9} fill="var(--text-dim)">
            {formatTick(g.value)}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const cx = PAD_L + slot * i + slot / 2
        const top = scale.y(d.value)
        const height = Math.max(d.value > 0 ? 2 : 0, zeroY - top)
        return (
          <rect
            key={i}
            x={cx - barW / 2}
            y={top}
            width={barW}
            height={height}
            rx={3}
            fill={color}
            opacity={i === data.length - 1 ? 1 : 0.62}
          />
        )
      })}

      {labelIdx.map((i) => (
        <text
          key={i}
          x={PAD_L + slot * i + slot / 2}
          y={H - 7}
          textAnchor="middle"
          fontSize={9}
          fill="var(--text-dim)"
        >
          {data[i].label}
        </text>
      ))}
    </svg>
  )
}
