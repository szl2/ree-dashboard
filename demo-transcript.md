# REE Supply Chain Dashboard — 5-Minute Demo Transcript

> Estimated time: 5 minutes. Actions in **[brackets]** are what you do on screen.

---

## Opening (0:00 - 0:30)

Thanks for joining. Today I'm going to walk you through an interactive dashboard we built to visualize the U.S. rare earth element supply chain — from mines and processing plants, through factories that consume these materials, to the recycling facilities that close the loop.

Before we start, a quick note: everything you see here uses mock data. The facility names, tonnages, and costs are synthetic — designed to be realistic in structure so we can demonstrate every feature. In production, this would plug into real data from USGS, DOE, and industry sources.

Let's dive in.

---

## National View (0:30 - 1:45)

**[Screen shows the full national map with all layers on, year set to 2024]**

This is the national overview. Each state is shaded by its total economic value in the REE sector — darker blue means higher value. You can see California, Texas, and Michigan standing out immediately.

The colored dots are individual facilities. Blue dots are mines and processors — that's our production layer. Red dots are factories — the demand side. Green dots are recycling plants. And the animated arcs connecting them represent material flows. The color of each arc matches the type of facility it originates from.

**[Point to right panel]**

Over here we have our key performance indicators. Total economic value across the sector, domestic production tonnage, demand, recycling capacity, import dependency — currently at 42% — and total employment. These numbers respond to the year slider, which I'll show you in a moment.

**[Point to bottom value chain bar]**

At the bottom, this pipeline shows the six stages of the value chain — Mining through Recycling — each sized by throughput. You can see the drop-off at Separation — that's a known bottleneck in domestic REE processing.

**[Hover over the import donut chart]**

And this donut chart confirms our import picture: China still accounts for about 58% of U.S. rare earth imports.

---

## Year Slider (1:45 - 2:15)

**[Drag year slider from 2024 back to 2019]**

Now watch what happens when I pull the year back to 2019. The arcs get thinner — less material moving. The KPI numbers drop. Recycling capacity was much smaller.

**[Drag year slider forward to 2026]**

Slide it forward to 2026 — the network thickens. Production is up, recycling capacity grows, more flow arcs appear. This gives you a sense of how the sector has scaled over time.

**[Set year back to 2024]**

I'll leave it at 2024 for the rest of the demo.

---

## Sidebar Filters (2:15 - 2:50)

**[Click "None" under Map Layers to turn everything off, then toggle on only Recycling]**

The sidebar gives us powerful filtering. Let me turn off all layers, then enable just Recycling. Now only the green recycling facilities and their connections are visible. You can see immediately where recycling infrastructure exists — and where the gaps are. It's concentrated in the Midwest, Texas, and a few coastal hubs.

**[Toggle Factories back on]**

Now I'll add Factories back. Watch — green arcs light up connecting factories to recyclers. These are scrap-return flows — manufacturing waste going back into the recycling loop. That's the circular economy in action.

**[Click "All" to restore everything]**

Let me turn everything back on.

---

## State Drill-Down — Michigan (2:50 - 3:50)

**[Click Michigan on the map]**

Let's drill into Michigan — a key state for EV manufacturing. The map zooms in and switches to a detailed street-level basemap.

**[Point to facility markers]**

Here you can see the Ann Arbor processing hub, Ford and GM factories in Detroit and Lansing, and three recycling facilities — each with an icon showing what they recycle: e-waste, industrial scrap, or magnets.

**[Point to arcs]**

The arcs tell the story. Processed material flows from Ann Arbor to the auto plants. Then — and this is important — scrap flows back from Ford to the Detroit recycler, and from GM to the Lansing recycler. These circular loops reduce import dependency.

**[Point to bottom trend chart]**

This trend chart at the bottom shows Michigan's supply-demand trajectory. The stacked green areas are recycling sources growing over time. The red dashed line is EV production demand — climbing faster. That gap is what we need to close.

**[Point to right panel KPIs and flow summary]**

On the right, we see Michigan's KPIs — economic value, production, demand — and a flow summary: 8,600 tons flowing in, 3,200 flowing out. Michigan is a net importer of processed REE, which makes sense given its factory density.

**[Scroll to facility list, point to Ford EV Factory]**

At the bottom of this panel is a list of every facility in the state. Let me click Ford EV Factory.

---

## Facility Detail — Ford Plant (3:50 - 4:40)

**[Click Ford EV Factory]**

Now we're at street level, looking at the Ford plant in Detroit with a 3D isometric view. The pulsing marker is the facility. The smaller dots are its supply chain partners — Ann Arbor sending material in, Detroit E-Waste Recovery taking scrap back.

**[Point to location info card]**

This card gives us the basics: EV motor factory, established 2019, 2,800 employees, B environmental rating, federal permit approved.

**[Point to right drawer — yield gauge]**

In the detail drawer, this gauge shows an 82% conversion rate — highly efficient. Below that, the operating cost breakdown: $17.4 million total, with labor dominating at $12.4 million — typical for an assembly operation.

**[Scroll to element composition]**

This pie chart shows the rare earth element mix: heavy on neodymium and dysprosium, which is what you'd expect for EV motor magnets.

**[Scroll to environmental metrics]**

And here are the environmental metrics: 12,000 tons of CO2 annually, 18 megagallons of water, B rating.

**[Point to external links]**

At the bottom, we link out to USGS and DOE databases for anyone who wants to go deeper.

---

## Wrap-Up (4:40 - 5:00)

**[Click "Country" in the breadcrumb to return to national view]**

Let me jump back to the national view using the breadcrumb.

So to recap: three levels of drill-down — national, state, facility. Layer and facility type filters that let you isolate exactly what you want to see. A year slider that shows how the network evolves over time. And circular economy flows that track material from mine to factory and back to recycler.

The framework is ready — plug in real data, and this becomes a live decision-support tool for REE supply chain policy. Happy to take questions.
