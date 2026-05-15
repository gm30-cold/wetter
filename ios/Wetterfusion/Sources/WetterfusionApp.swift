import SwiftUI

@main
struct WetterfusionApp: App {
    @StateObject private var locationManager = LocationManager()
    @StateObject private var forecastStore = ForecastStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(locationManager)
                .environmentObject(forecastStore)
        }
    }
}
