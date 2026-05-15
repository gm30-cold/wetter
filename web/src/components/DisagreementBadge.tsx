import { DisagreementLevel } from '../types/forecast'
import { disagreementColor, disagreementLabel } from '../utils/format'

interface Props {
  level: DisagreementLevel
  size?: 'sm' | 'md'
}

export function DisagreementBadge({ level, size = 'sm' }: Props) {
  const cls = disagreementColor(level)
  const dot =
    level === 'low'
      ? 'bg-emerald-400'
      : level === 'medium'
        ? 'bg-amber-400'
        : 'bg-rose-400'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${cls} ${
        size === 'md' ? 'text-xs' : 'text-[10px]'
      } font-medium tracking-wide`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />
      {disagreementLabel(level)}
    </span>
  )
}
