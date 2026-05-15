import Foundation

enum OpenMeteoError: Error {
    case badURL
    case decodingFailed(String)
    case http(Int)
    case modelUnavailable(WeatherModel)
}

struct Coordinate: Codable, Hashable {
    let latitude: Double
    let longitude: Double
}

actor OpenMeteoClient {
    static let shared = OpenMeteoClient()

    private let baseURL = URL(string: "https://api.open-meteo.com/v1/forecast")!
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func fetchForecast(model: WeatherModel, at coord: Coordinate, hours: Int = 168) async throws -> ModelForecast {
        var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
        components.queryItems = [
            URLQueryItem(name: "latitude", value: String(coord.latitude)),
            URLQueryItem(name: "longitude", value: String(coord.longitude)),
            URLQueryItem(name: "models", value: model.rawValue),
            URLQueryItem(name: "hourly", value: [
                "temperature_2m",
                "precipitation",
                "precipitation_probability",
                "wind_speed_10m",
                "wind_gusts_10m",
                "cloud_cover",
                "weather_code"
            ].joined(separator: ",")),
            URLQueryItem(name: "forecast_days", value: String(Int(ceil(Double(hours) / 24.0)))),
            URLQueryItem(name: "timezone", value: "auto"),
            URLQueryItem(name: "timeformat", value: "unixtime")
        ]
        guard let url = components.url else { throw OpenMeteoError.badURL }

        let (data, response) = try await session.data(from: url)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw OpenMeteoError.http(http.statusCode)
        }

        do {
            let raw = try JSONDecoder().decode(OpenMeteoResponse.self, from: data)
            let hourly = raw.hourly.toHourlyForecasts()
            return ModelForecast(model: model, hourly: hourly)
        } catch {
            throw OpenMeteoError.decodingFailed(String(describing: error))
        }
    }

    func fetchAllAvailableModels(at coord: Coordinate, hours: Int = 168) async -> [ModelForecast] {
        await withTaskGroup(of: ModelForecast?.self) { group in
            for model in WeatherModel.allCases {
                group.addTask { [weak self] in
                    guard let self else { return nil }
                    do {
                        return try await self.fetchForecast(model: model, at: coord, hours: hours)
                    } catch {
                        return nil
                    }
                }
            }
            var results: [ModelForecast] = []
            for await maybe in group {
                if let m = maybe { results.append(m) }
            }
            return results
        }
    }
}

private struct OpenMeteoResponse: Decodable {
    let hourly: HourlyBlock

    struct HourlyBlock: Decodable {
        let time: [Int]
        let temperature_2m: [Double?]?
        let precipitation: [Double?]?
        let precipitation_probability: [Double?]?
        let wind_speed_10m: [Double?]?
        let wind_gusts_10m: [Double?]?
        let cloud_cover: [Double?]?
        let weather_code: [Int?]?

        func toHourlyForecasts() -> [HourlyForecast] {
            time.enumerated().map { idx, ts in
                HourlyForecast(
                    time: Date(timeIntervalSince1970: TimeInterval(ts)),
                    temperature: temperature_2m?[safe: idx] ?? nil,
                    precipitation: precipitation?[safe: idx] ?? nil,
                    precipitationProbability: precipitation_probability?[safe: idx] ?? nil,
                    windSpeed: wind_speed_10m?[safe: idx] ?? nil,
                    windGust: wind_gusts_10m?[safe: idx] ?? nil,
                    cloudCover: cloud_cover?[safe: idx] ?? nil,
                    weatherCode: weather_code?[safe: idx] ?? nil
                )
            }
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
