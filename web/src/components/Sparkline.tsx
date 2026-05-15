interface Props {
  values: number[]
  times?: number[]
  gradient?: [string, string]
  fill?: boolean
  yMin?: number
  yMax?: number
  current?: number
  unit?: string
  yDigits?: number
}

const VB_W = 320
const VB_H = 100
const PAD_LEFT_VB = 38
const PAD_RIGHT_VB = 8
const PAD_TOP_VB = 6
const PAD_BOTTOM_VB = 6

export function Sparkline({
  values,
  times,
  gradient = ['#7dd3fc', '#a855f7'],
  fill = true,
  yMin,
  yMax,
  current,
  unit = '',
  yDigits = 1,
}: Props) {
  if (values.length < 2) return null
  const clean = values.map((v) => (Number.isFinite(v) ? v : 0))
  const min = yMin ?? Math.min(...clean)
  const max = yMax ?? Math.max(...clean)
  const span = Math.max(max - min, 0.001)

  const chartLeft = PAD_LEFT_VB
  const chartRight = VB_W - PAD_RIGHT_VB
  const chartTop = PAD_TOP_VB
  const chartBottom = VB_H - PAD_BOTTOM_VB
  const chartW = chartRight - chartLeft
  const chartH = chartBottom - chartTop

  const xVB = (i: number) => chartLeft + (i / (clean.length - 1)) * chartW
  const yVB = (v: number) => chartTop + (1 - (v - min) / span) * chartH
  const xPct = (i: number) => (xVB(i) / VB_W) * 100
  const yPct = (v: number) => (yVB(v) / VB_H) * 100

  const path = clean
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xVB(i).toFixed(2)} ${yVB(v).toFixed(2)}`)
    .join(' ')
  const area = `${path} L ${xVB(clean.length - 1).toFixed(2)} ${chartBottom} L ${chartLeft.toFixed(2)} ${chartBottom} Z`

  const id = `sg-${gradient[0].replace('#', '')}-${gradient[1].replace('#', '')}`
  const curIdx = current != null ? Math.min(clean.length - 1, Math.max(0, current)) : -1

  const tickIndices = pickTickIndices(clean.length)
  const dayBreakIndices = times ? findDayBreaks(times) : []

  const chartTopPct = (PAD_TOP_VB / VB_H) * 100
  const chartBottomPct = ((VB_H - PAD_BOTTOM_VB) / VB_H) * 100

  return (
    <div className="relative w-full" style={{ paddingBottom: '4px' }}>
      <div className="relative h-[96px]">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradient[1]} stopOpacity="0.32" />
              <stop offset="100%" stopColor={gradient[1]} stopOpacity="0" />
            </linearGradient>
          </defs>

          <line
            x1={chartLeft}
            x2={chartRight}
            y1={chartTop}
            y2={chartTop}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={chartLeft}
            x2={chartRight}
            y1={chartBottom}
            y2={chartBottom}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />

          {dayBreakIndices.map((i) => (
            <line
              key={`db-${i}`}
              x1={xVB(i)}
              x2={xVB(i)}
              y1={chartTop}
              y2={chartBottom}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {fill && <path d={area} fill={`url(#${id}-fill)`} />}
          <path
            d={path}
            stroke={`url(#${id})`}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {curIdx >= 0 && (
            <line
              x1={xVB(curIdx)}
              x2={xVB(curIdx)}
              y1={chartTop}
              y2={chartBottom}
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        <div className="pointer-events-none absolute inset-0 select-none">
          <div
            className="absolute text-[10px] font-medium leading-none text-white/60"
            style={{ left: 0, top: `calc(${chartTopPct}% - 4px)` }}
          >
            {max.toFixed(yDigits)}
            {unit}
          </div>
          <div
            className="absolute text-[10px] font-medium leading-none text-white/60"
            style={{ left: 0, top: `calc(${chartBottomPct}% - 4px)` }}
          >
            {min.toFixed(yDigits)}
            {unit}
          </div>

          {curIdx >= 0 && (
            <div
              className="absolute rounded-full bg-white shadow-lg shadow-black/40"
              style={{
                left: `calc(${xPct(curIdx)}% - 4px)`,
                top: `calc(${yPct(clean[curIdx])}% - 4px)`,
                width: '8px',
                height: '8px',
                boxShadow: `0 0 0 4px ${gradient[1]}33`,
              }}
            />
          )}

          {dayBreakIndices.map((i) => {
            const t = times?.[i]
            if (!t) return null
            const wd = new Date(t).toLocaleDateString('de-DE', { weekday: 'short' })
            return (
              <div
                key={`db-l-${i}`}
                className="absolute whitespace-nowrap text-[9px] font-medium uppercase tracking-wider text-white/50"
                style={{
                  left: `calc(${xPct(i)}% + 4px)`,
                  top: '0px',
                }}
              >
                {wd}
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative mt-1.5 h-[14px] w-full">
        {tickIndices.map((i, j) => {
          const label = computeTickLabel(i, j, tickIndices, times)
          return (
            <span
              key={`tl-${i}`}
              className="num absolute whitespace-nowrap text-[10px] leading-none text-white/55"
              style={{
                left: `${xPct(i)}%`,
                transform:
                  j === 0
                    ? 'translateX(0)'
                    : j === tickIndices.length - 1
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
              }}
            >
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function computeTickLabel(
  i: number,
  j: number,
  _ticks: number[],
  times?: number[]
): string {
  if (j === 0) return 'jetzt'
  if (!times || !times[i]) return `+${i}h`
  const d = new Date(times[i])
  return `${d.getHours().toString().padStart(2, '0')}h`
}

function pickTickIndices(n: number): number[] {
  if (n <= 6) return [0, n - 1]
  if (n <= 14) return [0, Math.floor(n / 2), n - 1]
  return [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1]
}

function findDayBreaks(times: number[]): number[] {
  const breaks: number[] = []
  for (let i = 1; i < times.length; i++) {
    if (new Date(times[i]).getDate() !== new Date(times[i - 1]).getDate()) {
      breaks.push(i)
    }
  }
  return breaks
}

