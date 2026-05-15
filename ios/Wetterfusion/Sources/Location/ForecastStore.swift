import Foundation
import Combine

@MainActor
final class ForecastStore: ObservableObject {
    @Published var rawForecasts: [ModelForecast] = []
    @Published var fused: [FusedHourlyPoint] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var lastUpdated: Date?

    private let client = OpenMeteoClient.shared
    private var currentWeights = ModelWeights.warmStartEurope

    func refresh(for coordinate: Coordinate) async {
        isLoading = true
        error = nil
        let results = await client.fetchAllAvailableModels(at: coordinate, hours: 168)
        rawForecasts = results
        if results.isEmpty {
            error = "Keine Vorhersagedaten verfügbar. Verbindung prüfen?"
        } else {
            fused = FusionEngine.fuse(forecasts: results, weights: currentWeights)
            lastUpdated = Date()
        }
        isLoading = false
    }

    var contributingModelCount: Int {
        rawForecasts.count
    }
}
