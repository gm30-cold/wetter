"""
Backtest verschiedener Wettermodelle gegen ERA5-Reanalyse.

Idee: für eine Liste repräsentativer Standorte holen wir
- die archivierte Vorhersage je Modell (Open-Meteo Historical Forecast API)
- die ERA5-Reanalyse (Open-Meteo Historical API) als Ground Truth
- berechnen MAE pro Modell und Region
- erzeugen daraus warmstart-Gewichte (1 / MAE, normalisiert)

Output: warmstart_weights.json, das in die iOS-App eingebettet wird.

Voraussetzungen: Python 3.10+, requests. Komplett kostenlos, kein API-Key.
"""
from __future__ import annotations
import json
import math
import statistics
import time
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path

import requests

MODELS = [
    "icon_d2", "icon_eu", "icon_global",
    "ecmwf_ifs025", "ecmwf_aifs025",
    "gfs_seamless",
    "meteofrance_arome_france_hd", "meteofrance_arpege_europe",
    "jma_msm",
    "gem_seamless",
]

REGIONS = {
    "dach": [
        ("Berlin", 52.52, 13.41),
        ("Muenchen", 48.14, 11.58),
        ("Hamburg", 53.55, 9.99),
        ("Wien", 48.21, 16.37),
        ("Zuerich", 47.38, 8.55),
    ],
    "westeu": [
        ("Paris", 48.86, 2.35),
        ("London", 51.51, -0.13),
        ("Madrid", 40.42, -3.70),
        ("Rom", 41.90, 12.50),
    ],
    "northam": [
        ("NewYork", 40.71, -74.01),
        ("Chicago", 41.88, -87.63),
        ("LosAngeles", 34.05, -118.24),
    ],
}

BACKTEST_DAYS = 30
HISTORICAL_API = "https://archive-api.open-meteo.com/v1/archive"
HISTORICAL_FORECAST_API = "https://historical-forecast-api.open-meteo.com/v1/forecast"


@dataclass
class ModelStats:
    errors_temp: list[float] = field(default_factory=list)
    errors_precip: list[float] = field(default_factory=list)
    errors_wind: list[float] = field(default_factory=list)

    @property
    def mae_temp(self) -> float:
        return statistics.mean(self.errors_temp) if self.errors_temp else math.inf

    @property
    def mae_precip(self) -> float:
        return statistics.mean(self.errors_precip) if self.errors_precip else math.inf


def fetch_actuals(lat: float, lon: float, start: date, end: date) -> dict:
    params = {
        "latitude": lat, "longitude": lon,
        "start_date": start.isoformat(), "end_date": end.isoformat(),
        "hourly": "temperature_2m,precipitation,wind_speed_10m",
        "timezone": "UTC",
    }
    r = requests.get(HISTORICAL_API, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def fetch_model_forecast(lat: float, lon: float, model: str, start: date, end: date) -> dict | None:
    params = {
        "latitude": lat, "longitude": lon,
        "start_date": start.isoformat(), "end_date": end.isoformat(),
        "hourly": "temperature_2m,precipitation,wind_speed_10m",
        "models": model,
        "timezone": "UTC",
    }
    try:
        r = requests.get(HISTORICAL_FORECAST_API, params=params, timeout=30)
        if r.status_code != 200:
            return None
        return r.json()
    except requests.RequestException:
        return None


def evaluate(region_key: str, cities: list[tuple[str, float, float]]) -> dict[str, dict]:
    end = date.today() - timedelta(days=2)
    start = end - timedelta(days=BACKTEST_DAYS)

    stats: dict[str, ModelStats] = {m: ModelStats() for m in MODELS}

    for city, lat, lon in cities:
        print(f"  - {city}…")
        try:
            actual = fetch_actuals(lat, lon, start, end)
        except Exception as e:
            print(f"    actuals failed: {e}")
            continue

        a_hourly = actual.get("hourly", {})
        a_time = a_hourly.get("time", [])
        a_temp = a_hourly.get("temperature_2m", [])
        a_precip = a_hourly.get("precipitation", [])
        a_wind = a_hourly.get("wind_speed_10m", [])
        time_index = {t: i for i, t in enumerate(a_time)}

        for model in MODELS:
            time.sleep(0.2)
            fcst = fetch_model_forecast(lat, lon, model, start, end)
            if not fcst:
                continue
            h = fcst.get("hourly", {})
            for i, t in enumerate(h.get("time", [])):
                if t not in time_index:
                    continue
                j = time_index[t]
                temp_pred = (h.get("temperature_2m") or [None])[i] if i < len(h.get("temperature_2m") or []) else None
                temp_act = a_temp[j] if j < len(a_temp) else None
                if temp_pred is not None and temp_act is not None:
                    stats[model].errors_temp.append(abs(temp_pred - temp_act))

                prec_pred = (h.get("precipitation") or [None])[i] if i < len(h.get("precipitation") or []) else None
                prec_act = a_precip[j] if j < len(a_precip) else None
                if prec_pred is not None and prec_act is not None:
                    stats[model].errors_precip.append(abs(prec_pred - prec_act))

                wind_pred = (h.get("wind_speed_10m") or [None])[i] if i < len(h.get("wind_speed_10m") or []) else None
                wind_act = a_wind[j] if j < len(a_wind) else None
                if wind_pred is not None and wind_act is not None:
                    stats[model].errors_wind.append(abs(wind_pred - wind_act))

    return {m: {"mae_temp": s.mae_temp, "mae_precip": s.mae_precip, "n_temp": len(s.errors_temp)} for m, s in stats.items()}


def to_weights(per_model: dict[str, dict]) -> dict[str, float]:
    inv = {}
    for m, s in per_model.items():
        mae = s["mae_temp"]
        if math.isinf(mae) or mae <= 0:
            continue
        inv[m] = 1.0 / mae
    total = sum(inv.values()) or 1.0
    return {m: round(v / total, 4) for m, v in inv.items()}


def main():
    output = {}
    for region, cities in REGIONS.items():
        print(f"Region: {region}")
        stats = evaluate(region, cities)
        weights = to_weights(stats)
        output[region] = {"stats": stats, "weights": weights}

    out_path = Path(__file__).parent / "warmstart_weights.json"
    out_path.write_text(json.dumps(output, indent=2))
    print(f"\nGeschrieben: {out_path}")
    print("Region-Gewichte:")
    for r, data in output.items():
        print(f"  {r}: {data['weights']}")


if __name__ == "__main__":
    main()
