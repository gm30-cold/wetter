import { useMemo } from 'react'

interface Props {
  weatherCode?: number
  isNight: boolean
}

export function WeatherEffects({ weatherCode, isNight }: Props) {
  const kind = classify(weatherCode, isNight)
  switch (kind) {
    case 'sun':
      return <Sun withWisps={false} />
    case 'sunWisps':
      return <Sun withWisps={true} />
    case 'stars':
      return <Starfield />
    case 'rain':
      return <Rain intensity="medium" />
    case 'heavyRain':
      return <Rain intensity="heavy" />
    case 'snow':
      return <Snow />
    case 'fog':
      return <Fog />
    case 'storm':
      return <Storm />
    case 'clouds':
      return <Clouds />
    default:
      return null
  }
}

type EffectKind =
  | 'sun'
  | 'sunWisps'
  | 'stars'
  | 'clouds'
  | 'rain'
  | 'heavyRain'
  | 'snow'
  | 'fog'
  | 'storm'
  | 'none'

function classify(code: number | undefined, isNight: boolean): EffectKind {
  if (code == null) return isNight ? 'stars' : 'sun'
  if (code === 0) return isNight ? 'stars' : 'sun'
  if (code === 1) return isNight ? 'stars' : 'sunWisps'
  if (code === 2) return isNight ? 'stars' : 'sunWisps'
  if (code === 3) return 'clouds'
  if (code >= 45 && code <= 48) return 'fog'
  if (code >= 51 && code <= 57) return 'rain'
  if (code >= 61 && code <= 65) return code === 65 ? 'heavyRain' : 'rain'
  if (code >= 66 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return code === 82 ? 'heavyRain' : 'rain'
  if (code >= 85 && code <= 86) return 'snow'
  if (code >= 95 && code <= 99) return 'storm'
  return 'none'
}

function Sun({ withWisps }: { withWisps: boolean }) {
  const wisps = useMemo(() => makeWisps(withWisps ? 4 : 2), [withWisps])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes wf-sun-breathe {
          0%, 100% { opacity: 0.92; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.04); }
        }
        @keyframes wf-wisp {
          0%   { transform: translate3d(-30vw, 0, 0); }
          100% { transform: translate3d(130vw, 0, 0); }
        }
      `}</style>
      <div
        className="absolute"
        style={{
          right: '18%',
          top: '6%',
          width: '90vh',
          height: '90vh',
          background:
            'radial-gradient(closest-side, rgba(254,243,199,0.45) 0%, rgba(251,191,36,0.22) 18%, rgba(244,114,182,0.10) 38%, transparent 62%)',
          filter: 'blur(8px)',
          animation: 'wf-sun-breathe 12s ease-in-out infinite',
          willChange: 'opacity, transform',
        }}
      />
      <div
        className="absolute left-0 right-0 top-0 h-1/2"
        style={{
          background:
            'radial-gradient(120% 80% at 75% 0%, rgba(254,215,170,0.22) 0%, rgba(254,215,170,0.06) 35%, transparent 65%)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, rgba(254,215,170,0.10) 70%, rgba(251,146,60,0.18) 100%)',
          mixBlendMode: 'overlay',
        }}
      />
      {wisps.map((w, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: `${w.top}%`,
            left: '0',
            width: `${w.width}px`,
            height: `${w.height}px`,
            background:
              'radial-gradient(ellipse, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.10) 55%, transparent 80%)',
            filter: 'blur(26px)',
            opacity: w.opacity,
            animation: `wf-wisp ${w.duration}s linear ${w.delay}s infinite`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

function makeWisps(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    top: 8 + (hash(i + 1) * 50) % 50,
    width: 280 + (hash(i + 5) * 240) % 240,
    height: 60 + (hash(i + 11) * 40) % 40,
    opacity: 0.55 + (hash(i + 17) * 0.45) % 0.45,
    duration: 90 + (hash(i + 23) * 80) % 80,
    delay: -((hash(i + 29) * 100) % 100),
  }))
}

function Starfield() {
  const stars = useMemo(() => makeStars(140), [])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes wf-twinkle {
          0%, 100% { opacity: var(--max); }
          50%      { opacity: var(--min); }
        }
      `}</style>
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.r * 2}px`,
            height: `${s.r * 2}px`,
            boxShadow: `0 0 ${s.r * 4}px rgba(255,255,255,0.6)`,
            animation: `wf-twinkle ${3 + (i % 5)}s ease-in-out infinite`,
            animationDelay: `${(i % 11) * 0.3}s`,
            ['--min' as never]: s.o * 0.25,
            ['--max' as never]: s.o,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

function makeStars(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: (hash(i + 1) * 100) % 100,
    y: (hash(i + 11) * 90) % 90,
    r: 0.5 + (hash(i + 21) * 1.8) % 1.6,
    o: 0.5 + (hash(i + 31) * 0.55) % 0.55,
  }))
}

function hash(n: number) {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

function Rain({ intensity }: { intensity: 'medium' | 'heavy' }) {
  const count = intensity === 'heavy' ? 140 : 90
  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (hash(i + 1) * 100) % 100,
        delay: -((hash(i + 5) * 1.6) % 1.6),
        duration: 0.7 + (hash(i + 11) * 0.6) % 0.6,
        length: 16 + (hash(i + 17) * 28) % 28,
        opacity: 0.45 + (hash(i + 23) * 0.45) % 0.45,
      })),
    [count]
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes wf-rain {
          0%   { transform: translate3d(0, -15vh, 0); }
          100% { transform: translate3d(-20px, 115vh, 0); }
        }
      `}</style>
      {drops.map((d, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{
            left: `${d.left}%`,
            width: '1.5px',
            height: `${d.length}px`,
            background: `linear-gradient(180deg, rgba(186,230,253,0) 0%, rgba(224,242,254,${d.opacity}) 100%)`,
            animation: `wf-rain ${d.duration}s linear ${d.delay}s infinite`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

function Snow() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        left: (hash(i + 1) * 100) % 100,
        delay: -((hash(i + 5) * 8) % 8),
        duration: 6 + (hash(i + 11) * 10) % 10,
        size: 2 + (hash(i + 17) * 4.5) % 4.5,
        opacity: 0.55 + (hash(i + 23) * 0.45) % 0.45,
        drift: ((hash(i + 29) * 80) % 80) - 40,
      })),
    []
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes wf-snow {
          0%   { transform: translate3d(0, -15vh, 0) rotate(0deg); }
          100% { transform: translate3d(var(--drift), 115vh, 0) rotate(360deg); }
        }
      `}</style>
      {flakes.map((f, i) => (
        <div
          key={i}
          className="absolute top-0 rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: f.opacity,
            boxShadow: '0 0 4px rgba(255,255,255,0.55)',
            animation: `wf-snow ${f.duration}s linear ${f.delay}s infinite`,
            ['--drift' as never]: `${f.drift}px`,
            willChange: 'transform',
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

function Fog() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes wf-fog {
          0%, 100% { transform: translateX(-8%); }
          50%      { transform: translateX(8%); }
        }
      `}</style>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute left-0 right-0 h-56"
          style={{
            top: `${10 + i * 22}%`,
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%)',
            filter: 'blur(36px)',
            animation: `wf-fog ${12 + i * 5}s ease-in-out infinite`,
            animationDelay: `${i * 2}s`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

function Storm() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <Rain intensity="heavy" />
      <style>{`
        @keyframes wf-lightning {
          0%, 88%, 92%, 100% { opacity: 0; }
          89%, 91%           { opacity: 0.85; }
        }
      `}</style>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.95) 0%, rgba(165,180,252,0.30) 25%, transparent 50%)',
          mixBlendMode: 'screen',
          animation: 'wf-lightning 7s infinite',
          willChange: 'opacity',
        }}
      />
    </div>
  )
}

function Clouds() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes wf-cloud {
          0%   { transform: translate3d(-20vw, 0, 0); }
          100% { transform: translate3d(120vw, 0, 0); }
        }
      `}</style>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: `${4 + i * 14}%`,
            left: '0',
            width: `${320 + i * 90}px`,
            height: `${100 + i * 25}px`,
            background:
              'radial-gradient(ellipse, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.14) 55%, transparent 82%)',
            filter: 'blur(26px)',
            animation: `wf-cloud ${80 + i * 28}s linear ${-i * 22}s infinite`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}
