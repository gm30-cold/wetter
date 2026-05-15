export const WEATHER_MODELS = [
  'icon_d2',
  'icon_eu',
  'icon_global',
  'ecmwf_ifs025',
  'ecmwf_aifs025',
  'gfs_seamless',
  'meteofrance_arome_france_hd',
  'meteofrance_arpege_europe',
  'jma_msm',
  'gem_seamless',
] as const

export type WeatherModelId = (typeof WEATHER_MODELS)[number]

export const MODEL_DISPLAY_NAMES: Record<WeatherModelId, string> = {
  icon_d2: 'ICON-D2 · DWD',
  icon_eu: 'ICON-EU · DWD',
  icon_global: 'ICON · DWD',
  ecmwf_ifs025: 'ECMWF IFS',
  ecmwf_aifs025: 'ECMWF AIFS',
  gfs_seamless: 'GFS · NOAA',
  meteofrance_arome_france_hd: 'AROME · MeteoFrance',
  meteofrance_arpege_europe: 'ARPEGE · MeteoFrance',
  jma_msm: 'JMA MSM',
  gem_seamless: 'GEM · Canada',
}

export interface HourlyPoint {
  time: number
  temperature?: number
  precipitation?: number
  precipitationProbability?: number
  windSpeed?: number
  windGust?: number
  windDirection?: number
  cloudCover?: number
  weatherCode?: number
  humidity?: number
  apparentTemperature?: number
  dewPoint?: number
  pressure?: number
  visibility?: number
  uvIndex?: number
  soilMoisture0_7?: number
  soilTemperature0_7?: number
  evapotranspiration?: number
  snowfall?: number
}

export interface ModelForecast {
  model: WeatherModelId
  hourly: HourlyPoint[]
}

export type DisagreementLevel = 'low' | 'medium' | 'high'

export interface FusedScalar {
  mean: number
  stdDev: number
  lower: number
  upper: number
  disagreement: DisagreementLevel
  perModel: Array<{ model: WeatherModelId; value: number }>
}

export interface FusedPrecip {
  meanMM: number
  probability: number
  lowMM: number
  highMM: number
  modelsExpectingRain: number
  totalModels: number
  perModel: Array<{ model: WeatherModelId; value: number }>
}

export interface FusedHour {
  time: number
  temperature?: FusedScalar
  apparentTemperature?: FusedScalar
  precipitation?: FusedPrecip
  windSpeed?: FusedScalar
  windGust?: FusedScalar
  windDirection?: FusedScalar
  cloudCover?: FusedScalar
  weatherCodeMode?: number
  humidity?: FusedScalar
  dewPoint?: FusedScalar
  pressure?: FusedScalar
  visibility?: FusedScalar
  uvIndex?: FusedScalar
  soilMoisture?: FusedScalar
  soilTemperature?: FusedScalar
  evapotranspiration?: FusedScalar
  snowfall?: FusedScalar
  contributingModels: WeatherModelId[]
}

export interface Coordinate {
  latitude: number
  longitude: number
}
