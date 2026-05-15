import Foundation

struct ModelWeights: Codable {
    var weights: [WeatherModel: Double]

    static let uniform: ModelWeights = {
        let v = 1.0 / Double(WeatherModel.allCases.count)
        return ModelWeights(weights: Dictionary(uniqueKeysWithValues: WeatherModel.allCases.map { ($0, v) }))
    }()

    static let warmStartEurope: ModelWeights = ModelWeights(weights: [
        .iconD2: 0.22,
        .iconEu: 0.15,
        .iconGlobal: 0.05,
        .ecmwfIfs: 0.20,
        .ecmwfAifs: 0.10,
        .gfs: 0.08,
        .meteoFranceArome: 0.10,
        .meteoFranceArpege: 0.05,
        .jmaMsm: 0.02,
        .gem: 0.03
    ])

    func normalized() -> ModelWeights {
        let sum = weights.values.reduce(0, +)
        guard sum > 0 else { return .uniform }
        return ModelWeights(weights: weights.mapValues { $0 / sum })
    }
}

enum FusionEngine {

    static func fuse(forecasts: [ModelForecast], weights: ModelWeights = .warmStartEurope) -> [FusedHourlyPoint] {
        guard !forecasts.isEmpty else { return [] }

        let w = weights.normalized().weights
        let buckets = bucketByHour(forecasts: forecasts)
        let sortedTimes = buckets.keys.sorted()

        return sortedTimes.map { time in
            let entries = buckets[time] ?? []

            let tempValues = entries.compactMap { (m, h) -> (WeatherModel, Double)? in
                guard let t = h.temperature else { return nil }
                return (m, t)
            }
            let windValues = entries.compactMap { (m, h) -> (WeatherModel, Double)? in
                guard let v = h.windSpeed else { return nil }
                return (m, v)
            }
            let precipValues = entries.compactMap { (m, h) -> (WeatherModel, Double)? in
                guard let p = h.precipitation else { return nil }
                return (m, p)
            }

            return FusedHourlyPoint(
                time: time,
                temperature: fuseScalar(values: tempValues, weights: w),
                precipitation: fusePrecip(values: precipValues, weights: w),
                windSpeed: fuseScalar(values: windValues, weights: w),
                contributingModels: entries.map { $0.0 }
            )
        }
    }

    private static func bucketByHour(forecasts: [ModelForecast]) -> [Date: [(WeatherModel, HourlyForecast)]] {
        var buckets: [Date: [(WeatherModel, HourlyForecast)]] = [:]
        for forecast in forecasts {
            for hour in forecast.hourly {
                let key = hour.time
                buckets[key, default: []].append((forecast.model, hour))
            }
        }
        return buckets
    }

    private static func fuseScalar(values: [(WeatherModel, Double)], weights: [WeatherModel: Double]) -> FusedValue? {
        guard !values.isEmpty else { return nil }

        var weightSum = 0.0
        var weightedSum = 0.0
        for (model, v) in values {
            let wi = weights[model] ?? 0
            weightedSum += wi * v
            weightSum += wi
        }
        guard weightSum > 0 else {
            let plainMean = values.map(\.1).reduce(0, +) / Double(values.count)
            let variance = values.map { pow($0.1 - plainMean, 2) }.reduce(0, +) / Double(values.count)
            let std = sqrt(variance)
            return FusedValue(mean: plainMean, stdDev: std, lower: plainMean - std, upper: plainMean + std)
        }

        let mean = weightedSum / weightSum
        var weightedVarNum = 0.0
        for (model, v) in values {
            let wi = weights[model] ?? 0
            weightedVarNum += wi * pow(v - mean, 2)
        }
        let variance = weightedVarNum / weightSum
        let std = sqrt(variance)
        return FusedValue(mean: mean, stdDev: std, lower: mean - std, upper: mean + std)
    }

    private static func fusePrecip(values: [(WeatherModel, Double)], weights: [WeatherModel: Double]) -> FusedPrecip? {
        guard !values.isEmpty else { return nil }

        let rainThresholdMM = 0.1
        let modelsWithRain = values.filter { $0.1 >= rainThresholdMM }.count
        let probability = Double(modelsWithRain) / Double(values.count)

        var weightSum = 0.0
        var weightedSum = 0.0
        for (model, v) in values {
            let wi = weights[model] ?? 0
            weightedSum += wi * v
            weightSum += wi
        }
        let mean = weightSum > 0 ? weightedSum / weightSum : values.map(\.1).reduce(0, +) / Double(values.count)
        let low = values.map(\.1).min() ?? 0
        let high = values.map(\.1).max() ?? 0

        return FusedPrecip(
            meanMM: mean,
            probability: probability,
            lowMM: low,
            highMM: high,
            modelsExpectingRain: modelsWithRain,
            totalModels: values.count
        )
    }
}

struct WeightLearner {

    private(set) var weights: ModelWeights
    private let learningRate: Double
    private let minWeight: Double

    init(initial: ModelWeights = .warmStartEurope, learningRate: Double = 0.1, minWeight: Double = 0.01) {
        self.weights = initial.normalized()
        self.learningRate = learningRate
        self.minWeight = minWeight
    }

    mutating func update(observation actual: Double, predictions: [(WeatherModel, Double)]) {
        guard !predictions.isEmpty else { return }
        let errors = predictions.map { ($0.0, abs($0.1 - actual)) }
        let maxErr = (errors.map(\.1).max() ?? 1) + 1e-6

        var newWeights = weights.weights
        for (model, err) in errors {
            let normErr = err / maxErr
            let multiplier = 1.0 - learningRate * normErr
            let old = newWeights[model] ?? 0
            newWeights[model] = max(minWeight, old * multiplier)
        }
        weights = ModelWeights(weights: newWeights).normalized()
    }
}
