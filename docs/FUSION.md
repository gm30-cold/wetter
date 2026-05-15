# Fusionsstrategie

## Das Problem konkret

Wenn DWD-ICON sagt "morgen 14:00 = 22°C, 0mm Regen" und ECMWF sagt "morgen 14:00 = 18°C, 4mm Regen", was tun?

Gängige Apps zeigen typischerweise nur **ein** Modell — meist nicht offengelegt welches. Bei einem solchen Konflikt liegt die "wahre" Vorhersage realistisch irgendwo dazwischen, mit hoher Unsicherheit. Das wollen wir transparent machen.

## Unsere Logik

### 1. Datenabruf (parallel)

Wir holen für den Ort alle Modelle, die Open-Meteo gratis anbietet:

| Modell           | Provider     | Auflösung | Reichweite |
|------------------|--------------|-----------|------------|
| ICON-D2          | DWD          | 2 km      | 48 h       |
| ICON-EU          | DWD          | 7 km      | 5 d        |
| ICON-Global      | DWD          | 13 km     | 7,5 d      |
| ECMWF IFS        | ECMWF        | 9 km      | 10 d       |
| ECMWF AIFS       | ECMWF        | 25 km     | 10 d       |
| GFS              | NOAA         | 13 km     | 16 d       |
| MeteoFrance AROME| MeteoFrance  | 1,3 km    | 48 h       |
| MeteoFrance ARPEGE| MeteoFrance | 11 km     | 4 d        |
| JMA MSM/GSM      | JMA          | 5/27 km   | 11 d       |
| GEM              | ECCC Canada  | 10 km     | 10 d       |

**Auflösung = Größe einer Gitterzelle.** Niedriger ist besser für Mikroklima. ICON-D2 mit 2 km schlägt im DACH-Raum oft alles andere.

### 2. Gewichtung pro Standort

Jeder Standort hat einen Gewichtsvektor `w = [w_ICON, w_ECMWF, …]`. Beim allerersten Start: Warmstart-Werte aus dem Backtest (siehe `backend/backtest/`). Danach justieren wir online:

```
fehler_modell_i = | vorhersage_modell_i_gestern_14:00 − beobachtung_gestern_14:00 |
neue_gewichtung ∝ 1 / (fehler_gleitender_mittelwert + ε)
```

(In Worten: Modelle, die am Standort historisch nah an der Beobachtung lagen, bekommen mehr Stimme.)

Beobachtung kommt aus:
- DWD Bright Sky (Deutschland, Stationsdaten, kostenlos)
- Open-Meteo Reanalyse-API (ERA5, weltweit, kostenlos)

### 3. Fusion

Punktvorhersage pro Variable (Temp, Niederschlag, Wind, …):

```
fusion = Σ_i w_i · vorhersage_i
unsicherheit = std(vorhersagen) ⊕ modellunsicherheit_aus_ensemble
```

### 4. Anzeige

- **Hauptzahl:** fusion
- **Unsicherheits-Band:** ±1σ um die fusion herum
- **"Modelle uneinig" Hinweis,** wenn σ > Schwelle (z.B. bei Niederschlag > 30% Variationskoeffizient)
- **Modell-Übersicht** auf Tap (zeigt alle Quellen einzeln) — für Power-User

### 5. Niederschlag — Spezialfall

Niederschlag ist die mit Abstand schwierigste Variable. Tricks:
- **Probability of Precipitation (PoP):** Anteil der Modelle, die >0,1 mm vorhersagen → ehrliche Wahrscheinlichkeit
- **Mengen-Spread:** wir zeigen nicht "5 mm" sondern "2–9 mm" wenn die Modelle uneinig sind
- **Nowcasting (0–2 h):** für sehr nahe Vorhersage Radarextrapolation (Open-Meteo bietet das via DWD Radvor)

## Was wir bewusst NICHT machen (v1)

- Eigenes Deep-Learning-Modell trainieren (zu teuer, zu wenig Daten, zu intransparent)
- Crowdsourcing von Nutzerwetter (DSGVO, Spam, kalter Start)
- Eigene Sensoren (Hardware-Kosten)

Diese Optionen bleiben für später offen, aber das Ensemble-Approach hat sich in der akademischen Literatur (Multi-Model Ensemble Forecasting, "wisdom of crowds" für Wettermodelle) als überraschend stark erwiesen — oft auf dem Niveau von kommerziellen Premium-Anbietern.
