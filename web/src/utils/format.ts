export function formatHour(ts: number): string {
  return new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export function formatHourShort(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours()}`
}

export function formatWeekday(ts: number): string {
  return new Date(ts).toLocaleDateString('de-DE', { weekday: 'short' })
}

export function formatDayLong(ts: number): string {
  return new Date(ts).toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export interface WeatherCodeInfo {
  label: string
  icon: string
}

export function weatherCodeInfo(code?: number): WeatherCodeInfo {
  if (code == null) return { label: '—', icon: '☁️' }
  if (code === 0) return { label: 'Klar', icon: '☀️' }
  if (code <= 2) return { label: 'Heiter', icon: '🌤️' }
  if (code === 3) return { label: 'Bewölkt', icon: '☁️' }
  if (code <= 49) return { label: 'Nebel', icon: '🌫️' }
  if (code <= 59) return { label: 'Nieselregen', icon: '🌦️' }
  if (code <= 69) return { label: 'Regen', icon: '🌧️' }
  if (code <= 79) return { label: 'Schnee', icon: '❄️' }
  if (code <= 84) return { label: 'Schauer', icon: '🌦️' }
  if (code <= 99) return { label: 'Gewitter', icon: '⛈️' }
  return { label: '—', icon: '☁️' }
}

export function disagreementColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low':
      return 'text-emerald-300 bg-emerald-400/15 border-emerald-300/30'
    case 'medium':
      return 'text-amber-300 bg-amber-400/15 border-amber-300/30'
    case 'high':
      return 'text-rose-300 bg-rose-400/15 border-rose-300/30'
  }
}

export function disagreementLabel(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low':
      return 'Modelle einig'
    case 'medium':
      return 'leichte Unsicherheit'
    case 'high':
      return 'Modelle uneinig'
  }
}
