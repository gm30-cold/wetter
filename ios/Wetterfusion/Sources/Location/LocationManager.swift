import Foundation
import CoreLocation
import Combine

@MainActor
final class LocationManager: NSObject, ObservableObject {
    @Published var currentCoordinate: Coordinate?
    @Published var placeName: String?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var lastError: String?

    private let manager = CLLocationManager()
    private let geocoder = CLGeocoder()

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        authorizationStatus = manager.authorizationStatus
    }

    func requestPermissionAndLocate() {
        switch authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            manager.requestLocation()
        case .denied, .restricted:
            lastError = "Standortzugriff verweigert. Bitte in den Einstellungen erlauben."
        @unknown default:
            break
        }
    }
}

extension LocationManager: CLLocationManagerDelegate {
    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            self.authorizationStatus = manager.authorizationStatus
            if manager.authorizationStatus == .authorizedWhenInUse || manager.authorizationStatus == .authorizedAlways {
                manager.requestLocation()
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        let coord = Coordinate(latitude: loc.coordinate.latitude, longitude: loc.coordinate.longitude)
        Task { @MainActor in
            self.currentCoordinate = coord
            if let place = try? await geocoder.reverseGeocodeLocation(loc).first {
                self.placeName = [place.locality, place.administrativeArea].compactMap { $0 }.joined(separator: ", ")
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            self.lastError = error.localizedDescription
        }
    }
}
