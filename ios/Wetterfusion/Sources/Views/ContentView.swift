import SwiftUI

struct ContentView: View {
    @EnvironmentObject var locationManager: LocationManager
    @EnvironmentObject var forecastStore: ForecastStore

    var body: some View {
        NavigationStack {
            Group {
                if let coord = locationManager.currentCoordinate {
                    ForecastView(coordinate: coord, placeName: locationManager.placeName)
                } else {
                    LocationGate()
                }
            }
            .navigationTitle("Wetterfusion")
        }
        .task {
            locationManager.requestPermissionAndLocate()
        }
    }
}

struct LocationGate: View {
    @EnvironmentObject var locationManager: LocationManager

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "location.circle")
                .font(.system(size: 64))
                .foregroundStyle(.tint)
            Text("Standort benötigt")
                .font(.title2).bold()
            Text("Wetterfusion braucht deinen Standort, um die genauesten Modelle zu fusionieren.")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            if let err = locationManager.lastError {
                Text(err)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }
            Button("Standort erlauben") {
                locationManager.requestPermissionAndLocate()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

#Preview {
    ContentView()
        .environmentObject(LocationManager())
        .environmentObject(ForecastStore())
}
