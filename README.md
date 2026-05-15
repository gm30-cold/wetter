# Wetterfusion

Eine Web-App (PWA), die mehrere numerische Wettermodelle live zu einer ehrlichen Vorhersage fusioniert.

> Gängige Apps zeigen ein Modell — wir zeigen das ehrliche Mittel **plus** wie sehr die Modelle übereinander uneinig sind.

## Quickstart

Siehe [docs/SETUP.md](docs/SETUP.md). Kurzfassung:

```bash
cd web
npm install
npm run dev
```

→ http://localhost:5173

## Architektur

- **Web-App** in `web/` — React + TypeScript + Tailwind + Vite + framer-motion. Glassmorphism-UI mit Aurora-Background.
- **PWA** via `vite-plugin-pwa` — installierbar auf iOS/Android Home-Screen.
- **Deploy** via GitHub Actions auf GitHub Pages — kostenlos, automatisch.
- **Datenquelle** Open-Meteo (alle großen Wettermodelle, kein API-Key, gratis).
- **Backtest** in `backend/backtest/` — Python-Script erzeugt Warmstart-Gewichte aus historischen Daten.
- **iOS-Native** in `ios/` — frühe Variante, vorerst nicht weiter ausgebaut.

## Modelle

Die Fusion zieht parallel:

| Modell           | Provider     | Auflösung |
|------------------|--------------|-----------|
| ICON-D2/EU/Glob. | DWD          | 2 / 7 / 13 km |
| ECMWF IFS, AIFS  | ECMWF        | 9 / 25 km |
| GFS              | NOAA         | 13 km |
| AROME / ARPEGE   | MeteoFrance  | 1,3 / 11 km |
| JMA MSM          | JMA          | 5 km |
| GEM              | ECCC Canada  | 10 km |

Details in [docs/FUSION.md](docs/FUSION.md).

## Roadmap

- v0.1: Standort, Multi-Modell-Fusion, Hourly + 10-Tage, Expert-Mode, PWA. ✅
- v0.2: Lokale Gewichts-Anpassung (lernend) gegen DWD Bright Sky.
- v0.3: Severe-Weather-Push (Web Push), Regenradar, mehrere gespeicherte Orte.
- v0.4: Gärtner-/Outdoor-Profile (Bodenfeuchte, UV, Frostneigung).
- v1.0: Eigene Domain, SEO, Public Launch.
