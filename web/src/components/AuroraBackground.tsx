import { useMemo } from 'react'
import { FusedHour } from '../types/forecast'
import { WeatherEffects } from './WeatherEffects'

interface Props {
  now?: FusedHour
}

export function AuroraBackground({ now }: Props) {
  const palette = useMemo(() => paletteFor(now), [now])
  const isNight = useMemo(() => {
    const h = new Date().getHours()
    return h < 6 || h >= 21
  }, [now])

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: palette.base }}
    >
      <div
        className="absolute -top-1/3 -left-1/4 h-[80vh] w-[80vh] rounded-full opacity-70 blur-3xl animate-shimmer"
        style={{ background: palette.blobA }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 h-[90vh] w-[90vh] rounded-full opacity-60 blur-3xl animate-shimmer"
        style={{ background: palette.blobB, animationDelay: '-4s' }}
      />
      <div
        className="absolute top-1/3 left-1/2 h-[50vh] w-[50vh] -translate-x-1/2 rounded-full opacity-40 blur-3xl animate-shimmer"
        style={{ background: palette.blobC, animationDelay: '-2s' }}
      />
      <WeatherEffects weatherCode={now?.weatherCodeMode} isNight={isNight} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.18) 1.2px, transparent 1.2px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 300%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%222%22/></filter><rect width=%22300%22 height=%22300%22 filter=%22url(%23n)%22 opacity=%220.85%22/></svg>")',
        }}
      />
    </div>
  )
}

interface Palette {
  base: string
  blobA: string
  blobB: string
  blobC: string
}

function paletteFor(now?: FusedHour): Palette {
  const hour = new Date().getHours()
  const temp = now?.temperature?.mean ?? 12
  const cloud = now?.cloudCover?.mean ?? 50
  const code = now?.weatherCodeMode
  const isNight = hour < 6 || hour >= 21

  if (code != null && code >= 95 && code <= 99) {
    return {
      base: 'linear-gradient(180deg, #050811 0%, #0d1124 60%, #1e1b4b 100%)',
      blobA: 'radial-gradient(circle, rgba(99,102,241,0.40) 0%, transparent 60%)',
      blobB: 'radial-gradient(circle, rgba(217,70,239,0.35) 0%, transparent 60%)',
      blobC: 'radial-gradient(circle, rgba(56,189,248,0.30) 0%, transparent 60%)',
    }
  }

  if (code != null && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))) {
    return {
      base: 'linear-gradient(180deg, #0a1530 0%, #1e3a5f 60%, #334e7a 100%)',
      blobA: 'radial-gradient(circle, rgba(56,189,248,0.45) 0%, transparent 60%)',
      blobB: 'radial-gradient(circle, rgba(99,102,241,0.40) 0%, transparent 60%)',
      blobC: 'radial-gradient(circle, rgba(125,211,252,0.30) 0%, transparent 60%)',
    }
  }

  if (code != null && ((code >= 71 && code <= 77) || (code >= 85 && code <= 86))) {
    return {
      base: 'linear-gradient(180deg, #0e1a2e 0%, #1e3a5f 60%, #475569 100%)',
      blobA: 'radial-gradient(circle, rgba(186,230,253,0.50) 0%, transparent 60%)',
      blobB: 'radial-gradient(circle, rgba(165,243,252,0.40) 0%, transparent 60%)',
      blobC: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 60%)',
    }
  }

  if (code != null && code >= 45 && code <= 48) {
    return {
      base: 'linear-gradient(180deg, #2a2f3a 0%, #4a5163 60%, #5e6678 100%)',
      blobA: 'radial-gradient(circle, rgba(203,213,225,0.55) 0%, transparent 60%)',
      blobB: 'radial-gradient(circle, rgba(148,163,184,0.45) 0%, transparent 60%)',
      blobC: 'radial-gradient(circle, rgba(226,232,240,0.30) 0%, transparent 60%)',
    }
  }

  if (isNight) {
    return {
      base: 'linear-gradient(180deg, #06080f 0%, #0c1024 50%, #0f1530 100%)',
      blobA: 'radial-gradient(circle, rgba(99,102,241,0.55) 0%, transparent 60%)',
      blobB: 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, transparent 60%)',
      blobC: 'radial-gradient(circle, rgba(168,85,247,0.30) 0%, transparent 60%)',
    }
  }

  if (cloud > 75) {
    return {
      base: 'linear-gradient(180deg, #1f2937 0%, #334155 60%, #475569 100%)',
      blobA: 'radial-gradient(circle, rgba(148,163,184,0.55) 0%, transparent 60%)',
      blobB: 'radial-gradient(circle, rgba(100,116,139,0.45) 0%, transparent 60%)',
      blobC: 'radial-gradient(circle, rgba(203,213,225,0.35) 0%, transparent 60%)',
    }
  }

  if (temp < 0) {
    return {
      base: 'linear-gradient(180deg, #0c1a2e 0%, #173052 60%, #1e3a5f 100%)',
      blobA: 'radial-gradient(circle, rgba(125,211,252,0.55) 0%, transparent 60%)',
      blobB: 'radial-gradient(circle, rgba(165,180,252,0.45) 0%, transparent 60%)',
      blobC: 'radial-gradient(circle, rgba(255,255,255,0.20) 0%, transparent 60%)',
    }
  }

  if (temp >= 25) {
    return {
      base: 'linear-gradient(180deg, #1a103d 0%, #4c1d95 50%, #db2777 100%)',
      blobA: 'radial-gradient(circle, rgba(251,191,36,0.55) 0%, transparent 60%)',
      blobB: 'radial-gradient(circle, rgba(244,114,182,0.50) 0%, transparent 60%)',
      blobC: 'radial-gradient(circle, rgba(253,164,175,0.40) 0%, transparent 60%)',
    }
  }

  if (code === 0 || code === 1) {
    return {
      base: 'linear-gradient(180deg, #0e2a5c 0%, #2563eb 50%, #60a5fa 100%)',
      blobA: 'radial-gradient(circle, rgba(254,243,199,0.55) 0%, transparent 60%)',
      blobB: 'radial-gradient(circle, rgba(56,189,248,0.45) 0%, transparent 60%)',
      blobC: 'radial-gradient(circle, rgba(186,230,253,0.40) 0%, transparent 60%)',
    }
  }

  return {
    base: 'linear-gradient(180deg, #0b1220 0%, #1e3a8a 50%, #3b82f6 100%)',
    blobA: 'radial-gradient(circle, rgba(56,189,248,0.55) 0%, transparent 60%)',
    blobB: 'radial-gradient(circle, rgba(129,140,248,0.45) 0%, transparent 60%)',
    blobC: 'radial-gradient(circle, rgba(125,211,252,0.40) 0%, transparent 60%)',
  }
}
