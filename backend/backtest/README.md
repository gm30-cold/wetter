# Backtest — Warmstart-Gewichte

## Was macht das Script?

Es vergleicht für ~12 Städte in DACH / Westeuropa / Nordamerika die archivierten Vorhersagen jedes Wettermodells mit der tatsächlichen Reanalyse (ERA5) — über die letzten 30 Tage. Daraus berechnet es **MAE** (mittlerer absoluter Fehler) je Modell und Region und leitet Gewichte ab (`1/MAE` normalisiert).

Die App startet mit diesen Gewichten und lernt dann lokal weiter.

## Ausführen

```bash
cd backend/backtest
python3 -m venv venv
source venv/bin/activate
pip install requests
python backtest.py
```

Läuft ca. 5–15 Minuten (viele API-Calls, freundlich gedrosselt). Output: `warmstart_weights.json`.

Diese Datei kopierst du anschließend nach `ios/Wetterfusion/Resources/warmstart_weights.json` und sie wird beim nächsten App-Build mitgeliefert.

## Hinweis

Open-Meteo Free Tier erlaubt einige Tausend Calls pro Tag — wir bleiben deutlich darunter. Kein API-Key nötig.
