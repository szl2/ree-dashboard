# REE Supply Chain Intelligence Dashboard — Demo Guide

## What This App Does

The REE Dashboard is an interactive geospatial tool for exploring the U.S. rare earth element supply chain. It visualizes where critical minerals are mined, processed, recycled, and consumed — and how materials flow between these nodes. The dashboard is designed for policy analysts, supply chain strategists, and researchers who need to understand domestic REE infrastructure at a glance and in detail.

Three drill-down levels — **National**, **State**, and **Facility** — let you move from a 30,000-foot strategic view down to a single plant's operating costs in a few clicks.

> **Note:** This demo uses entirely **mock data** — facility names, locations, tonnages, costs, and flow routes are synthetic and do not represent real-world operations. The data is designed to be realistic in structure and scale so that every feature of the dashboard can be demonstrated end-to-end. In a production deployment, these CSVs would be replaced with verified data from sources such as USGS, DOE, and industry reporting.

---

## A Walk-Through: Sarah's Monday Morning Briefing

Sarah is a supply chain analyst at the U.S. Department of Energy. She has a 10 AM meeting on domestic rare earth resilience. Here is how she prepares.

---

### 8:30 AM — The Big Picture (National View)

Sarah opens the dashboard. The **national choropleth map** fills the screen — states shaded by economic value, with colored dots marking every mine, processor, factory, and recycling plant in the country. Animated arcs trace material flows between them: blue lines streaming from mines in Wyoming and Montana, green lines looping back from recycling hubs, red lines feeding into factory clusters in Michigan and Texas.

On the **right panel**, six KPI tiles give her the numbers she needs:

- **$187M** total economic value across the REE sector
- **72,800 tons** domestic production
- **Import dependency at 42%** — still uncomfortably high
- **18,200 tons** recycling capacity and growing

She drags the **year slider** from 2024 back to 2019. The arcs thin out, KPI numbers drop. She slides it forward to 2026 — arcs thicken, recycling capacity climbs. The trend is heading the right direction.

At the bottom of the map, a **value chain pipeline** lays out the six stages from Mining through End-Use to Recycling, each box sized by throughput. She hovers over "Separation" — the bottleneck is obvious: output drops by 40% from Ore Processing.

The **import sources donut** in the right panel confirms what she already suspects: China still supplies 58% of U.S. rare earth imports. She screenshots this for her slide deck.

She clicks the **production cost heatmap** — a grid of colored state tiles. Texas glows green (low cost per ton). Colorado is orange. She makes a mental note.

---

### 8:45 AM — Zooming Into Michigan (State View)

Sarah's meeting focuses on the Midwest manufacturing corridor. She clicks **Michigan** on the map.

The view zooms into a MapLibre street map centered on the state. Facility markers appear — sized by capacity, colored by type. She can immediately see:

- A large **processing hub** in Ann Arbor (blue glow)
- **Ford and GM factories** in Detroit and Lansing (red glows)
- Three **recycling facilities** — Detroit (e-waste), Lansing (industrial scrap), Grand Rapids (magnet reuse) — each with a distinctive icon inside its green marker

Dashed arcs crisscross the state. Blue lines carry processed material from Ann Arbor to the auto plants. Green lines loop manufacturing scrap back from Ford to the Detroit recycler. This is the **circular economy in action** — factories returning rare earth scrap to recyclers, who feed it back into the supply chain.

The **supply-demand trend chart** in the bottom corner shows Michigan's trajectory: e-waste recovery (light green area) is growing steadily, but EV production demand (red dashed line) is climbing faster. The gap is the import dependency.

On the right panel, she checks the **cross-state flow summary**: 8,600 tons flowing in (from California, Ohio, Pennsylvania processors), 3,200 tons flowing out. Michigan is a net importer of processed REE — no surprise given its factory density.

The **OpEx pie chart** breaks down where Michigan's processing and recycling dollars go: 42% energy, 28% chemicals, 30% labor. She scrolls down to the **facilities list** — seven entries, each showing capacity, employee count, and environmental rating. The Ann Arbor processing hub has a B rating; the three recyclers all have A ratings.

She clicks **Ford EV Factory** in the list.

---

### 9:00 AM — Inside the Ford Plant (Facility View)

The map zooms to street level with a **45-degree isometric tilt**. A pulsing marker sits on the Ford plant in Detroit, ringed by a soft red glow. Smaller markers show connected facilities — the Ann Arbor processor feeding material in, the Detroit e-waste recycler receiving scrap back.

A **location info card** in the top-left corner gives her the essentials:

| | |
|---|---|
| **Type** | Factory — EV Motor |
| **City** | Detroit, MI |
| **Established** | 2019 |
| **Employees** | 2,800 |
| **Technology** | EV powertrain assembly |
| **Permit** | Approved |
| **Rating** | B |

The **connected supply chain legend** lists every flow in and out: 3,600 tons of processed material arriving from Ann Arbor, 800 tons of manufacturing scrap returning to Detroit E-Waste Recovery.

In the **right detail drawer**, she scrolls through:

1. **Yield Gauge** — a semicircular radial chart reading 82%, labeled "Highly Efficient." Year-adjusted capacity: 14,760 tons at the 2024 multiplier.

2. **Operating Cost Breakdown** — a donut chart splitting $17.4M into Energy ($3.2M), Chemicals ($1.8M), and Labor ($12.4M). Below it, per-ton cost tiles give her the unit economics.

3. **Element Composition** — a pie chart showing recovered REE split: 32% Nd, 18% Dy, 14% Pr, with La, Ce, and Others filling the rest.

4. **Environmental Metrics** — a 2x2 grid: 12,000 tons CO2/year, 18 Mgal water usage, 2,800 employees, B environmental rating in a cyan badge.

5. **External Resources** — links to the USGS Mineral Resources database and the DOE Critical Minerals Program for deeper research.

Sarah has what she needs. She clicks the **breadcrumb trail** at the top — "Country > MI > Ford" — clicking "Country" to jump straight back to the national view.

---

### 9:10 AM — Filtering for the Story

Back at the national level, Sarah uses the **sidebar controls** to build a specific view for her presentation.

She turns off the **Demand** and **Economic** layers, leaving only Production and Recycling. The map simplifies — factory markers vanish, red arcs disappear. What remains is the blue-and-green skeleton of domestic supply: mines feeding processors, recyclers collecting scrap, green loops closing the circle.

She clicks **"None"** under Facility Types to clear everything, then selectively enables just **Recycling**. Now only the 13 recycling facilities appear — isolated green dots scattered across the country. The visualization makes a clear point: *recycling infrastructure is sparse and concentrated on the coasts and Midwest.*

She re-enables **Factories** alongside Recycling. Green scrap-return arcs light up — the circular economy connections between manufacturers and recyclers. Some factories have short local loops (Ford to Detroit, 12 miles). Others ship scrap across state lines (TSMC Arizona to Savannah Georgia, 1,600 miles by rail). The disparity is visible at a glance.

She slides the year to **2026** and screenshots the map. Then slides back to **2019** and screenshots again. Two images, side by side, will show her audience how the network has grown.

---

## Feature Reference

### Sidebar Controls

| Control | What It Does |
|---|---|
| **Map Layers** (4 toggles) | Show/hide data by category: Demand (factories, red), Production (mines + processors, blue), Recycling (recyclers, green), Economic (choropleth + value chain, gold) |
| **All / None** (layers) | Toggle all layers on or off with one click |
| **Facility Types** (4 toggles) | Filter which facility markers appear: Mines, Processing, Factories, Recycling |
| **All / None** (facilities) | Toggle all facility types on or off |
| **Year Slider** (2019-2026) | Adjusts all tonnage, capacity, and flow data by a year multiplier. Affects KPIs, arc thickness, chart values, and trend reference lines across all three levels |
| **Drill-Down Breadcrumb** | Shows your current path (Country > State > Facility). Click any level to jump back |
| **Back Button** | Navigate up one level |

### Arc Visibility Rules

An arc (material flow line) is only visible when:
1. **Both endpoint facilities** pass the active facility type filter, AND
2. **Both endpoint types** belong to a layer that is currently turned on

This means toggling off "Recycling" hides all arcs that touch a recycling facility — including the scrap-return arcs from factories.

### National View (Level 1)

| Element | Description |
|---|---|
| Choropleth map | States colored by economic value (blue gradient). Requires Economic layer |
| Facility markers | Colored circles sized by capacity |
| Animated flow arcs | Dashed lines with shimmer animation, colored by origin facility type |
| Value chain bar | Bottom pipeline: Mining > Processing > Separation > Manufacturing > End-Use > Recycling. Requires Economic layer |
| KPI tiles | 6 summary metrics, filtered by active layers |
| Import donut | Global REE import share by country. Requires Demand layer |
| Cost comparison chart | Top 10 states, mining vs. recycling cost stacks. Requires Economic layer |
| Production cost heatmap | Clickable state grid, colored by $/ton. Click a state to drill down |

### State View (Level 2)

| Element | Description |
|---|---|
| MapLibre dark basemap | Centered on selected state with facility markers |
| Facility markers | Sized by capacity, with recycling source icons (e-waste, scrap, magnet) |
| Cross-state flow arcs | Inbound and outbound material flows |
| Supply-demand trend | Area chart with recycling source breakdown + EV demand + capacity lines |
| KPI grid | 8 state-level metrics |
| Flow summary | Inbound vs. outbound tonnage and route count |
| OpEx pie | Energy / Chemicals / Labor split for processors and recyclers |
| Environmental card | CO2, water usage, vulnerability score |
| Facility list | Clickable cards for every facility in the state |

### Facility View (Level 3)

| Element | Description |
|---|---|
| Isometric street map | 45-degree pitch, zoom level 13 |
| Pulsing facility marker | Animated ring with type-specific emoji icon |
| Connected facilities | Smaller markers for upstream/downstream partners |
| Micro-flow arcs | Direct supply chain connections |
| Location info card | Name, type, subtype, technology, permits, rating, notes |
| Yield gauge | Semicircular radial chart with efficiency rating |
| OpEx breakdown | Donut chart + per-ton cost tiles |
| Element composition | Recovered REE element percentages |
| Throughput vs. potential | Bar comparison of actual vs. capacity |
| Environmental grid | CO2, water, employees, rating badge |
| External links | USGS and DOE resource databases |

---

## Data

The dashboard reads from 7 CSV files in `public/data/`:

| File | Records | Purpose |
|---|---|---|
| `states.csv` | 25 states | Aggregate state metrics, policy scores, environmental data |
| `facilities.csv` | 55 facilities | Mines, processors, factories (8 subtypes), recyclers with full operational data |
| `flows.csv` | 96 flows | Material routes including ore, processed material, recycled material, and scrap returns |
| `state_timeseries.csv` | 25 states x 8 years | Year-over-year supply, demand, recycling by source type |
| `value_chain.csv` | 6 stages x 8 years | National value chain throughput and costs |
| `import_sources.csv` | 5 countries | Global REE import dependency breakdown |
| `facility_opex_detail.csv` | 28 facilities | Detailed cost-per-ton and element composition for mines, processors, and recyclers |

All tonnage and flow values scale with the year slider using a linear multiplier (0.70x in 2019, 1.12x in 2026), simulating sector growth over time.

---

## Quick Start

```bash
cd ree-dashboard
npm install
npm run dev
```

Open `http://localhost:5173`. Click a state. Click a facility. Drag the year slider. Toggle layers. Explore.
