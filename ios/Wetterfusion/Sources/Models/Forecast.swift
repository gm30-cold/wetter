import Foundation

enum WeatherModel: String, CaseIterable, Codable, Identifiable {
    case iconD2 = "icon_d2"
    case iconEu = "icon_eu"
    case iconGlobal = "icon_global"
    case ecmwfIfs = "ecmwf_ifs025"
    case ecmwfAifs = "ecmwf_aifs025"
    case gfs = "gfs_seamless"
    case meteoFranceArome = "meteofrance_arome_france_hd"
    case meteoFranceArpege = "meteofrance_arpege_europe"
    case jmaMsm = "jma_msm"
    case gem = "gem_seamless"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .iconD2: return "ICON-D2 (DWD)"
        case .iconEu: return "ICON-EU (DWD)"
        case .iconGlobal: return "ICON-Global (DWD)"
        case .ecmwfIfs: return "ECMWF IFS"
        case .ecmwfAifs: return "ECMWF AIFS"
        case .gfs: return "GFS (NOAA)"
        case .meteoFranceArome: return "AROME (MeteoFrance)"
        case .meteoFranceArpege: return "ARPEGE (MeteoFrance)"
        case .jmaMsm: return "JMA MSM"
        case .gem: return "GEM (Canada)"
        }
    }
}

struct HourlyForecast: Identifiable, Codable {
    let id = UUID()
    let time: Date
    let temperature: Double?
    let precipitation: Double?
    let precipitationProbability: Double?
    let windSpeed: Double?
    let windGust: Double?
    let cloudCover: Double?
    let weatherCode: Int?

    enum CodingKeys: String, CodingKey {
        case time, temperature, precipitation, precipitationProbability, windSpeed, windGust, cloudCover, weatherCode
    }
}

struct ModelForecast: Identifiable {
    let id = UUID()
    let model: WeatherModel
    let hourly: [HourlyForecast]
}

struct FusedHourlyPoint: Identifiable {
    let id = UUID()
    let time: Date

    let temperature: FusedValue?
    let precipitation: FusedPrecip?
    let windSpeed: FusedValue?

    let contributingModels: [WeatherModel]
}

struct FusedValue {
    let mean: Double
    let stdDev: Double
    let lower: Double
    let upper: Double

    var disagreement: Disagreement {
        let coeff = abs(mean) > 0.1 ? stdDev / abs(mean) : stdDev
        if coeff < 0.05 { return .low }
        if coeff < 0.15 { return .medium }
        return .high
    }
}

struct FusedPrecip {
    let meanMM: Double
    let probability: Double
    let lowMM: Double
    let highMM: Double
    let modelsExpectingRain: Int
    let totalModels: Int
}

enum Disagreement {
    case low, medium, high

    var label: String {
        switch self {
        case .low: return "Modelle einig"
        case .medium: return "leichte Unsicherheit"
        case .high: return "Modelle uneinig"
        }
    }
}
