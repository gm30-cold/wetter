import {
  FusedHour,
  FusedPrecip,
  FusedScalar,
  HourlyPoint,
  ModelForecast,
  WeatherModelId,
} from '../types/forecast'

export interface ModelWeights {
  [modelId: string]: number
}

export const WARMSTART_WEIGHTS: ModelWeights = {
  icon_d2: 0.1316,
  icon_eu: 0.1515,
  icon_global: 0.1158,
  ecmwf_ifs025: 0.1721,
  ecmwf_aifs025: 0.02,
  gfs_seamless: 0.0979,
  meteofrance_arome_france_hd: 0.0893,
  meteofrance_arpege_europe: 0.1336,
  jma_msm: 0.02,
  gem_seamless: 0.1081,
}

function normalize(w: ModelWeights): ModelWeights {
  const sum = Object.values(w).reduce((a, b) => a + b, 0)
  if (sum <= 0) return w
  const out: ModelWeights = {}
  for (const k in w) out[k] = w[k] / sum
  return out
}

function disagreementOf(mean: number, std: number): 'low' | 'medium' | 'high' {
  const ref = Math.max(Math.abs(mean), 1)
  const coeff = std / ref
  if (coeff < 0.05) return 'low'
  if (coeff < 0.15) return 'medium'
  return 'high'
}

function fuseScalar(
  values: Array<{ model: WeatherModelId; value: number }>,
  weights: ModelWeights
): FusedScalar | undefined {
  if (values.length === 0) return undefined
  let wSum = 0
  let weighted = 0
  for (const { model, value } of values) {
    const w = weights[model] ?? 0
    weighted += w * value
    wSum += w
  }
  let mean: number
  if (wSum > 0) mean = weighted / wSum
  else mean = values.reduce((a, b) => a + b.value, 0) / values.length

  let varSum = 0
  let varW = 0
  for (const { model, value } of values) {
    const w = weights[model] ?? 1
    varSum += w * (value - mean) ** 2
    varW += w
  }
  const variance = varW > 0 ? varSum / varW : 0
  const std = Math.sqrt(variance)

  return {
    mean,
    stdDev: std,
    lower: mean - std,
    upper: mean + std,
    disagreement: disagreementOf(mean, std),
    perModel: values,
  }
}

function fusePrecip(
  values: Array<{ model: WeatherModelId; value: number }>,
  weights: ModelWeights
): FusedPrecip | undefined {
  if (values.length === 0) return undefined
  const threshold = 0.1
  const modelsWithRain = values.filter((v) => v.value >= threshold).length
  const probability = modelsWithRain / values.length

  let wSum = 0
  let weighted = 0
  for (const { model, value } of values) {
    const w = weights[model] ?? 0
    weighted += w * value
    wSum += w
  }
  const mean =
    wSum > 0
      ? weighted / wSum
      : values.reduce((a, b) => a + b.value, 0) / values.length

  const sortedVals = [...values.map((v) => v.value)].sort((a, b) => a - b)
  const low = sortedVals[0]
  const high = sortedVals[sortedVals.length - 1]

  return {
    meanMM: mean,
    probability,
    lowMM: low,
    highMM: high,
    modelsExpectingRain: modelsWithRain,
    totalModels: values.length,
    perModel: values,
  }
}

function mode(vals: number[]): number | undefined {
  if (vals.length === 0) return undefined
  const counts = new Map<number, number>()
  for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1)
  let best = vals[0]
  let bestCount = -1
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v
      bestCount = c
    }
  }
  return best
}

export function fuse(
  forecasts: ModelForecast[],
  weights: ModelWeights = WARMSTART_WEIGHTS
): FusedHour[] {
  if (forecasts.length === 0) return []
  const w = normalize(weights)
  const byHour = new Map<number, Array<{ model: WeatherModelId; point: HourlyPoint }>>()

  for (const fc of forecasts) {
    for (const h of fc.hourly) {
      const arr = byHour.get(h.time) ?? []
      arr.push({ model: fc.model, point: h })
      byHour.set(h.time, arr)
    }
  }

  const times = [...byHour.keys()].sort((a, b) => a - b)
  return times.map((t) => {
    const entries = byHour.get(t)!
    const get = <K extends keyof HourlyPoint>(key: K) =>
      entries
        .map((e) => ({ model: e.model, value: e.point[key] as number | undefined }))
        .filter((e): e is { model: WeatherModelId; value: number } => typeof e.value === 'number')

    return {
      time: t,
      temperature: fuseScalar(get('temperature'), w),
      apparentTemperature: fuseScalar(get('apparentTemperature'), w),
      windSpeed: fuseScalar(get('windSpeed'), w),
      windGust: fuseScalar(get('windGust'), w),
      windDirection: fuseScalar(get('windDirection'), w),
      cloudCover: fuseScalar(get('cloudCover'), w),
      humidity: fuseScalar(get('humidity'), w),
      dewPoint: fuseScalar(get('dewPoint'), w),
      pressure: fuseScalar(get('pressure'), w),
      visibility: fuseScalar(get('visibility'), w),
      uvIndex: fuseScalar(get('uvIndex'), w),
      soilMoisture: fuseScalar(get('soilMoisture0_7'), w),
      soilTemperature: fuseScalar(get('soilTemperature0_7'), w),
      evapotranspiration: fuseScalar(get('evapotranspiration'), w),
      snowfall: fuseScalar(get('snowfall'), w),
      weatherCodeMode: mode(get('weatherCode').map((c) => c.value)),
      precipitation: fusePrecip(get('precipitation'), w),
      contributingModels: entries.map((e) => e.model),
    } as FusedHour
  })
}
