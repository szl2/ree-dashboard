# US Rare Earth Elements (REE) Supply Chain Visualization Dashboard

A multi-level interactive dashboard for exploring the US rare earth mineral supply chain — covering mining, processing, recycling, and EV manufacturing. Focused on economic value flows, transport costs, and recycling site classification. Built for research purposes with mock CSV data; designed for easy replacement with real USGS data.

---

## Product Overview

This is a pure frontend React application that visualizes the US REE supply chain across three interactive drill-down levels. Users can explore national-level economic value distributions, state-level facility networks, and individual facility operational details — all driven by CSV files that can be swapped for real data without any code changes.

---

## Three Drill-Down Levels

### Level 1 — National View
- US choropleth map colored by total economic value per state
- Arc/flow lines between states colored by unit transport cost (green = cheap, red = expensive); line thickness encodes tonnage
- Right panel: stacked bar chart comparing mine vs. recycle costs nationally

### Level 2 — State View (Michigan)
- Zoomed state map with facility scatter points categorized by type:
  - E-waste recycling
  - Industrial scrap processing
  - Magnet reuse / EV-related
- Local flow lines connecting facilities to EV demand centers
- Right panel: supply-demand trend chart (area) and cost breakdown pie chart

### Level 3 — Facility Detail
- Tilted 2.5D map zoom centered on a specific facility
- Right drawer containing:
  - Gauge chart (conversion rate / yield)
  - OpEx stacked bar (energy / chemicals / labor)
  - Element composition pie chart (Nd, Dy, Pr, La, Ce)
  - Throughput bar chart

---

## Tech Stack

| Technology | Role |
|---|---|
| React 18 + Vite | Frontend framework and build tool |
| react-simple-maps | US map rendering (no API key required) |
| Recharts | All charts (bar, pie, area, radial bar for gauge simulation) |
| Papaparse | CSV parsing |
| D3 | Color scales and data utilities |
| CSV files in `/public/data/` | Mock backend data store |

---

## Data Files

All mock data lives in `public/data/`:

| File | Description |
|---|---|
| `states.csv` | 15 US states with economic value, costs, production, and demand |
| `facilities.csv` | 15 facilities: mines, processing plants, recycling centers, EV factories |
| `flows.csv` | 20 inter-state material flows with tonnage, transport cost, and mode |
| `michigan_supply_demand.csv` | Michigan time series 2019–2025 for supply/demand trend chart |
| `facility_opex_detail.csv` | Per-facility REE element composition and per-ton cost breakdown |

---

## Project Structure

```
ree-dashboard/
├── public/
│   └── data/                        # CSV mock data files
│       ├── states.csv
│       ├── facilities.csv
│       ├── flows.csv
│       ├── michigan_supply_demand.csv
│       └── facility_opex_detail.csv
├── src/
│   ├── components/
│   │   ├── Level1National/          # National choropleth + arc flows + cost panel
│   │   ├── Level2State/             # State drill-down map + supply-demand panel
│   │   ├── Level3Facility/          # Facility detail drawer + charts
│   │   └── shared/                  # Sidebar, legend, tooltip components
│   ├── hooks/
│   │   └── useCSVData.js            # CSV loading hook via Papaparse
│   ├── utils/
│   │   └── colorScales.js           # D3 color scale utilities
│   ├── App.jsx                      # Root component, drill-down state management
│   └── main.jsx
├── README.md
└── package.json
```

---

## Getting Started

```bash
cd ree-dashboard
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Interaction Guide

| Action | Result |
|---|---|
| Click a state on the national map | Drills down to Level 2 (state view) |
| Hover a flow arc | Tooltip shows origin → destination, distance, cost, transport mode |
| Click a facility dot on the state map | Opens the Level 3 facility detail drawer |
| Click the Back button | Returns to the previous drill-down level |
| Layer toggles in the left sidebar | Show/hide Demand, Production, and Recycling layers |

---

## Extending with Real Data

Replace any CSV file in `public/data/` with real USGS or industry data following the same column schema. No code changes are required — the app reads all data dynamically from CSVs at runtime.

---

## Future Work

- Connect to a real backend API (FastAPI or Node.js) replacing CSV fetch calls
- Add Mapbox GL for higher-fidelity 2.5D facility maps (requires API key)
- Deep-link from the facility drawer to USGS database records
- Add a time slider to animate material flows across years
