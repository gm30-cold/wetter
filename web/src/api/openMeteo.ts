import {
  HourlyPoint,
  ModelForecast,
  WEATHER_MODELS,
  WeatherModelId,
  Coordinate,
} from '../types/forecast'

const BASE = 'https://api.open-meteo.com/v1/forecast'

const HOURLY_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'precipitation',
  'precipitation_probability',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'cloud_cover',
  'weather_code',
  'relative_humidity_2m',
  'dew_point_2m',
  'surface_pressure',
  'visibility',
  'uv_index',
  'soil_moisture_0_to_7cm',
  'soil_temperature_0_to_7cm',
  'et0_fao_evapotranspiration',
  'snowfall',
] as const

interface OMResponse {
  hourly?: {
    time: number[]
    temperature_2m?: (number | null)[]
    apparent_temperature?: (number | null)[]
    precipitation?: (number | null)[]
    precipitation_probability?: (number | null)[]
    wind_speed_10m?: (number | null)[]
    wind_gusts_10m?: (number | null)[]
    wind_direction_10m?: (number | null)[]
    cloud_cover?: (number | null)[]
    weather_code?: (number | null)[]
    relative_humidity_2m?: (number | null)[]
    dew_point_2m?: (number | null)[]
    surface_pressure?: (number | null)[]
    visibility?: (number | null)[]
    uv_index?: (number | null)[]
    soil_moisture_0_to_7cm?: (number | null)[]
    soil_temperature_0_to_7cm?: (number | null)[]
    et0_fao_evapotranspiration?: (number | null)[]
    snowfall?: (number | null)[]
  }
}

function pick<T>(arr: (T | null | undefined)[] | undefined, i: number): T | undefined {
  if (!arr || i >= arr.length) return undefined
  const v = arr[i]
  return v == null ? undefined : v
}

async function fetchOne(
  model: WeatherModelId,
  coord: Coordinate,
  days: number,
  signal?: AbortSignal
): Promise<ModelForecast | null> {
  const params = new URLSearchParams({
    latitude: String(coord.latitude),
    longitude: String(coord.longitude),
    models: model,
    hourly: HOURLY_FIELDS.join(','),
    forecast_days: String(days),
    timezone: 'auto',
    timeformat: 'unixtime',
  })
  try {
    const res = await fetch(`${BASE}?${params}`, { signal })
    if (!res.ok) return null
    const data = (await res.json()) as OMResponse
    if (!data.hourly?.time) return null
    const hourly: HourlyPoint[] = data.hourly.time.map((ts, i) => ({
      time: ts * 1000,
      temperature: pick(data.hourly!.temperature_2m, i),
      apparentTemperature: pick(data.hourly!.apparent_temperature, i),
      precipitation: pick(data.hourly!.precipitation, i),
      precipitationProbability: pick(data.hourly!.precipitation_probability, i),
      windSpeed: pick(data.hourly!.wind_speed_10m, i),
      windGust: pick(data.hourly!.wind_gusts_10m, i),
      windDirection: pick(data.hourly!.wind_direction_10m, i),
      cloudCover: pick(data.hourly!.cloud_cover, i),
      weatherCode: pick(data.hourly!.weather_code, i),
      humidity: pick(data.hourly!.relative_humidity_2m, i),
      dewPoint: pick(data.hourly!.dew_point_2m, i),
      pressure: pick(data.hourly!.surface_pressure, i),
      visibility: pick(data.hourly!.visibility, i),
      uvIndex: pick(data.hourly!.uv_index, i),
      soilMoisture0_7: pick(data.hourly!.soil_moisture_0_to_7cm, i),
      soilTemperature0_7: pick(data.hourly!.soil_temperature_0_to_7cm, i),
      evapotranspiration: pick(data.hourly!.et0_fao_evapotranspiration, i),
      snowfall: pick(data.hourly!.snowfall, i),
    }))
    return { model, hourly }
  } catch {
    return null
  }
}

export async function fetchAllModels(
  coord: Coordinate,
  days = 10,
  signal?: AbortSignal
): Promise<ModelForecast[]> {
  const results = await Promise.all(
    WEATHER_MODELS.map((m) => fetchOne(m, coord, days, signal))
  )
  return results.filter((r): r is ModelForecast => r !== null && r.hourly.length > 0)
}

export interface GeoPlace {
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  if (!query.trim()) return []
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=8&language=de&format=json`
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results ?? []).map((r: GeoPlace) => ({
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      country: r.country,
      admin1: r.admin1,
    }))
  } catch {
    return []
  }
}

export async function reverseGeocode(
  coord: Coordinate,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${coord.latitude}&longitude=${coord.longitude}&language=de&format=json`
    const res = await fetch(url, { signal })
    if (!res.ok) return null
    const data = await res.json()
    const r = data?.results?.[0]
    if (!r) return null
    return [r.name, r.admin1].filter(Boolean).join(', ')
  } catch {
    return null
  }
}
