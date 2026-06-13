# 2026 FIFA World Cup Predictor

Interactive React app for exploring 2026 World Cup champion probabilities with Elo ratings, Bayesian match-result updates, Poisson goal modeling, Monte Carlo tournament simulation, and historical Brier-score backtesting.

> Note: this is an analytical/demo tool, not betting advice. Some tournament fields are bundled as editable seed data so the simulator can run offline. Update the match JSON as real results become available.

## Features

- Team Elo ratings and strength radar for highlighted contenders
- Known-result priors that update Elo with `Delta Elo = K * (S - E)`
- Poisson match simulation for remaining group and knockout matches
- Monte Carlo champion probability ranking
- Historical knockout-match backtest with Brier score
- Offline result import with JSON, so the app can be deployed without API keys

## Quick Start

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Updating Match Results

Go to the **赛况先验** tab and paste an array like this:

```json
[
  { "grp": "A", "a": "MEX", "b": "RSA", "gA": 2, "gB": 0, "date": "6/11", "note": "sample result" },
  { "grp": "A", "a": "KOR", "b": "CZE", "gA": 2, "gB": 1, "date": "6/11" }
]
```

Required fields are:

- `grp`: group letter
- `a`, `b`: team codes used by the app
- `gA`, `gB`: final goals

Optional fields are `date` and `note`.

## Model Notes

The app uses:

- Elo-adjusted expected goals: `lambda_A = 1.2 * exp(0.45 * (Elo_A - Elo_B) / 400)`
- Poisson goal draws for simulated matches
- A 100 Elo host adjustment for host teams in match simulation
- `K = 60` for Elo updates from known results
- Monte Carlo sampling to estimate champion probability

The model is intentionally transparent and tweakable. It is best used for scenario exploration rather than exact forecasting.

## Project Structure

```text
src/
  main.jsx
  WorldCupPredictor.jsx
  styles.css
```

## License

MIT
