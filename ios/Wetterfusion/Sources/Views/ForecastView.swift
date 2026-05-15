import SwiftUI

struct ForecastView: View {
    let coordinate: Coordinate
    let placeName: String?

    @EnvironmentObject var forecastStore: ForecastStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                if forecastStore.isLoading && forecastStore.fused.isEmpty {
                    ProgressView("Lade Modelle…")
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, 40)
                } else if let err = forecastStore.error {
                    Text(err).foregroundStyle(.red)
                } else {
                    nowCard
                    hourlySection
                    dailySection
                    modelsSection
                }
            }
            .padding()
        }
        .refreshable {
            await forecastStore.refresh(for: coordinate)
        }
        .task(id: coordinate) {
            await forecastStore.refresh(for: coordinate)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(placeName ?? "Aktueller Standort")
                .font(.title).bold()
            if let updated = forecastStore.lastUpdated {
                Text("Aktualisiert: \(updated.formatted(date: .omitted, time: .shortened)) · \(forecastStore.contributingModelCount) Modelle")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var nowCard: some View {
        Group {
            if let now = forecastStore.fused.first(where: { $0.time >= Date().addingTimeInterval(-1800) }) ?? forecastStore.fused.first {
                NowCardView(point: now)
            }
        }
    }

    private var hourlySection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Nächste 24 Stunden").font(.headline)
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(Array(forecastStore.fused.prefix(24))) { point in
                        HourCardView(point: point)
                    }
                }
            }
        }
    }

    private var dailySection: some View {
        let days = aggregateByDay(forecastStore.fused)
        return VStack(alignment: .leading, spacing: 8) {
            Text("7-Tage-Übersicht").font(.headline)
            ForEach(days.prefix(7), id: \.0) { day in
                DayRowView(date: day.0, points: day.1)
                Divider()
            }
        }
    }

    private var modelsSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Beitragende Modelle").font(.headline)
            ForEach(forecastStore.rawForecasts, id: \.model) { f in
                HStack {
                    Image(systemName: "circle.fill").font(.system(size: 8)).foregroundStyle(.tint)
                    Text(f.model.displayName).font(.caption)
                    Spacer()
                    Text("\(f.hourly.count) h").font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding(.top)
    }

    private func aggregateByDay(_ hours: [FusedHourlyPoint]) -> [(Date, [FusedHourlyPoint])] {
        let cal = Calendar.current
        let grouped = Dictionary(grouping: hours) { cal.startOfDay(for: $0.time) }
        return grouped.sorted { $0.key < $1.key }
    }
}

private struct NowCardView: View {
    let point: FusedHourlyPoint

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let temp = point.temperature {
                HStack(alignment: .firstTextBaseline) {
                    Text("\(temp.mean, specifier: "%.1f")°")
                        .font(.system(size: 64, weight: .light))
                    VStack(alignment: .leading) {
                        Text("± \(temp.stdDev, specifier: "%.1f")°")
                            .font(.callout)
                            .foregroundStyle(.secondary)
                        DisagreementBadge(level: temp.disagreement)
                    }
                }
            }
            if let precip = point.precipitation {
                PrecipSummaryView(precip: precip)
            }
            if let wind = point.windSpeed {
                Label("\(wind.mean, specifier: "%.0f") km/h ± \(wind.stdDev, specifier: "%.0f")", systemImage: "wind")
                    .font(.subheadline)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 16).fill(Color(.secondarySystemBackground)))
    }
}

private struct PrecipSummaryView: View {
    let precip: FusedPrecip

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: "cloud.rain")
                Text("Regenwahrsch.: \(Int(precip.probability * 100))%")
                    .font(.subheadline)
                Text("(\(precip.modelsExpectingRain)/\(precip.totalModels) Modelle)")
                    .font(.caption).foregroundStyle(.secondary)
            }
            if precip.highMM > 0.1 {
                Text("Menge: \(precip.lowMM, specifier: "%.1f")–\(precip.highMM, specifier: "%.1f") mm (Median \(precip.meanMM, specifier: "%.1f"))")
                    .font(.caption)
            }
        }
    }
}

private struct HourCardView: View {
    let point: FusedHourlyPoint

    var body: some View {
        VStack(spacing: 6) {
            Text(point.time.formatted(date: .omitted, time: .shortened))
                .font(.caption2)
            if let t = point.temperature {
                Text("\(t.mean, specifier: "%.0f")°")
                    .font(.title3).bold()
                Text("±\(t.stdDev, specifier: "%.1f")")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            if let p = point.precipitation, p.probability > 0.1 {
                Label("\(Int(p.probability * 100))%", systemImage: "drop.fill")
                    .font(.caption2)
                    .foregroundStyle(.blue)
            }
        }
        .padding(8)
        .frame(width: 70)
        .background(RoundedRectangle(cornerRadius: 10).fill(Color(.tertiarySystemBackground)))
    }
}

private struct DayRowView: View {
    let date: Date
    let points: [FusedHourlyPoint]

    private var maxTemp: Double? {
        points.compactMap { $0.temperature?.mean }.max()
    }
    private var minTemp: Double? {
        points.compactMap { $0.temperature?.mean }.min()
    }
    private var totalPrecip: Double {
        points.compactMap { $0.precipitation?.meanMM }.reduce(0, +)
    }
    private var avgDisagreement: Disagreement {
        let stds = points.compactMap { $0.temperature?.stdDev }
        guard !stds.isEmpty else { return .low }
        let avg = stds.reduce(0, +) / Double(stds.count)
        if avg < 1.0 { return .low }
        if avg < 2.5 { return .medium }
        return .high
    }

    var body: some View {
        HStack {
            Text(date.formatted(.dateTime.weekday(.abbreviated).day().month()))
                .frame(width: 110, alignment: .leading)
            Spacer()
            if totalPrecip > 0.1 {
                Label("\(totalPrecip, specifier: "%.1f") mm", systemImage: "drop")
                    .font(.caption)
                    .foregroundStyle(.blue)
            }
            DisagreementBadge(level: avgDisagreement)
            if let minT = minTemp, let maxT = maxTemp {
                Text("\(minT, specifier: "%.0f")° – \(maxT, specifier: "%.0f")°")
                    .frame(width: 90, alignment: .trailing)
                    .font(.subheadline.monospacedDigit())
            }
        }
    }
}

private struct DisagreementBadge: View {
    let level: Disagreement

    var body: some View {
        Text(level.label)
            .font(.caption2)
            .padding(.horizontal, 6).padding(.vertical, 2)
            .background(color.opacity(0.18))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }

    private var color: Color {
        switch level {
        case .low: return .green
        case .medium: return .orange
        case .high: return .red
        }
    }
}
