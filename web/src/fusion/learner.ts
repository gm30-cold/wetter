import { Coordinate, WEATHER_MODELS, WeatherModelId } from '../types/forecast'
import { ModelWeights, WARMSTART_WEIGHTS } from './engine'

interface ModelStats {
  errorEMA: number
  samples: number
}

interface LocationHistory {
  models: Partial<Record<WeatherModelId, ModelStats>>
  lastUpdate: number
}

interface Store {
  [locationKey: string]: LocationHistory
}

const STORAGE_KEY = 'wf:learner'
const EMA_ALPHA = 0.3
const UPDATE_INTERVAL_HOURS = 12
const HISTORICAL_FORECAST_API = 'https://historical-forecast-api.open-meteo.com/v1/forecast'
const ARCHIVE_API = 'https://archive-api.open-meteo.com/v1/archive'

function locationKey(coord: Coordinate): string {
  return `${coord.latitude.toFixed(2)}_${coord.longitude.toFixed(2)}`
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

function saveStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota / private mode
  }
}

export function weightsFor(coord: Coordinate): ModelWeights {
  const store = loadStore()
  const history = store[locationKey(coord)]
  if (!history) return WARMSTART_WEIGHTS
  const weights: ModelWeights = { ...WARMSTART_WEIGHTS }
  let touched = 0
  for (const model of WEATHER_MODELS) {
    const stats = history.models[model]
    if (!stats || stats.samples < 1) continue
    const baseline = WARMSTART_WEIGHTS[model] ?? 0.05
    const inverseError = 1 / (stats.errorEMA + 0.5)
    weights[model] = baseline * 0.4 + inverseError * 0.6
    touched++
  }
  if (touched === 0) return WARMSTART_WEIGHTS
  const sum = Object.values(weights).reduce((a, b) => a + b, 0)
  if (sum <= 0) return WARMSTART_WEIGHTS
  for (const k in weights) weights[k] /= sum
  return weights
}

function yesterdayDateString(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 2)
  return d.toISOString().slice(0, 10)
}

async function fetchActuals(coord: Coordinate): Promise<Map<number, number>> {
  const day = yesterdayDateString()
  const params = new URLSearchParams({
    latitude: String(coord.latitude),
    longitude: String(coord.longitude),
    start_date: day,
    end_date: day,
    hourly: 'temperature_2m',
    timezone: 'UTC',
    timeformat: 'unixtime',
  })
  const res = await fetch(`${ARCHIVE_API}?${params}`)
  if (!res.ok) return new Map()
  const data = await res.json()
  const times: number[] = data?.hourly?.time ?? []
  const temps: (number | null)[] = data?.hourly?.temperature_2m ?? []
  const out = new Map<number, number>()
  for (let i = 0; i < times.length; i++) {
    const v = temps[i]
    if (typeof v === 'number') out.set(times[i], v)
  }
  return out
}

async function fetchModelPrediction(
  coord: Coordinate,
  model: WeatherModelId
): Promise<Map<number, number>> {
  const day = yesterdayDateString()
  const params = new URLSearchParams({
    latitude: String(coord.latitude),
    longitude: String(coord.longitude),
    start_date: day,
    end_date: day,
    hourly: 'temperature_2m',
    models: model,
    timezone: 'UTC',
    timeformat: 'unixtime',
  })
  try {
    const res = await fetch(`${HISTORICAL_FORECAST_API}?${params}`)
    if (!res.ok) return new Map()
    const data = await res.json()
    const times: number[] = data?.hourly?.time ?? []
    const temps: (number | null)[] = data?.hourly?.temperature_2m ?? []
    const out = new Map<number, number>()
    for (let i = 0; i < times.length; i++) {
      const v = temps[i]
      if (typeof v === 'number') out.set(times[i], v)
    }
    return out
  } catch {
    return new Map()
  }
}

export interface LearnResult {
  weights: ModelWeights
  updatedModels: Array<{ model: WeatherModelId; mae: number; samples: number }>
}

export async function updateWeightsAsync(
  coord: Coordinate
): Promise<LearnResult | null> {
  const store = loadStore()
  const key = locationKey(coord)
  const history: LocationHistory = store[key] ?? { models: {}, lastUpdate: 0 }

  const ageMs = Date.now() - history.lastUpdate
  if (ageMs < UPDATE_INTERVAL_HOURS * 3600 * 1000) {
    return { weights: weightsFor(coord), updatedModels: [] }
  }

  const actuals = await fetchActuals(coord)
  if (actuals.size === 0) return null

  const updated: LearnResult['updatedModels'] = []
  for (const model of WEATHER_MODELS) {
    const preds = await fetchModelPrediction(coord, model)
    if (preds.size === 0) continue
    let errSum = 0
    let n = 0
    for (const [ts, predTemp] of preds) {
      const actual = actuals.get(ts)
      if (actual == null) continue
      errSum += Math.abs(predTemp - actual)
      n++
    }
    if (n === 0) continue
    const mae = errSum / n
    const prev = history.models[model]
    const newEMA = prev
      ? prev.errorEMA * (1 - EMA_ALPHA) + mae * EMA_ALPHA
      : mae
    history.models[model] = {
      errorEMA: newEMA,
      samples: (prev?.samples ?? 0) + n,
    }
    updated.push({ model, mae, samples: n })
  }

  history.lastUpdate = Date.now()
  store[key] = history
  saveStore(store)

  return { weights: weightsFor(coord), updatedModels: updated }
}
