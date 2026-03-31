import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Annotation, useMapContext } from 'react-simple-maps';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  Legend, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const FIPS_ABBR = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE',
  '11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA',
  '20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN',
  '28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM',
  '36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI',
  '45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA',
  '54':'WV','55':'WI','56':'WY',
};

// Facility colors match their parent layer
const TYPE_COLORS = {
  mine: '#339af0',       // production (blue)
  processing: '#74c0fc', // production (light blue)
  factory: '#ff6b6b', // demand (red)
  recycling: '#51cf66',  // recycling (green)
};
const LAYER_COLORS = {
  demand: '#ff6b6b',
  production: '#339af0',
  recycling: '#51cf66',
  economic: '#fcc419',
};
const TYPE_LABELS = { mine: 'Mine', processing: 'Processing', factory: 'Factory', recycling: 'Recycling' };
const IMPORT_COLORS = ['#ff6b6b', '#339af0', '#fcc419', '#51cf66', '#8892aa'];
const VALUE_CHAIN_STAGES = [
  { key: 'Mining', color: '#339af0', icon: '\u26cf' },
  { key: 'Ore Processing', color: '#74c0fc', icon: '\u2699' },
  { key: 'Separation', color: '#da77f2', icon: '\ud83e\uddea' },
  { key: 'Manufacturing', color: '#ff6b6b', icon: '\ud83c\udfed' },
  { key: 'End-Use', color: '#fcc419', icon: '\ud83d\ude97' },
  { key: 'Recycling', color: '#51cf66', icon: '\u267b' },
];

// Which facility types belong to which layer
const LAYER_TYPES = {
  demand: ['factory'],
  production: ['mine', 'processing'],
  recycling: ['recycling'],
};

// Arc color = origin facility type color (matches filter colors)
function getArcColor(originType) {
  return TYPE_COLORS[originType] || '#8892aa';
}

// Year-based multiplier for flows (base year = 2024)
function yearMultiplier(year) {
  return 0.7 + (year - 2019) * 0.06; // 0.7 in 2019, 1.12 in 2026
}

function FlowArcs({ flowsData, onHover, facilityMap, facilityFilters, layers }) {
  const { projection } = useMapContext();

  // Determine which facility types are visible (intersection of layers + facility filters)
  const visibleTypes = new Set();
  for (const [layerKey, types] of Object.entries(LAYER_TYPES)) {
    if (layers[layerKey] !== false) {
      for (const t of types) {
        if (facilityFilters[t] !== false) visibleTypes.add(t);
      }
    }
  }

  return (
    <>
      {flowsData.map(flow => {
        // Arc shown only if BOTH endpoint vertices are visible
        const originFac = facilityMap[flow.origin_facility_id];
        const destFac = facilityMap[flow.dest_facility_id];
        const originType = originFac?.type;
        const destType = destFac?.type;
        if (!visibleTypes.has(originType) || !visibleTypes.has(destType)) return null;

        const o = projection([+flow.origin_lng, +flow.origin_lat]);
        const d = projection([+flow.dest_lng, +flow.dest_lat]);
        if (!o || !d) return null;
        const [x1, y1] = o;
        const [x2, y2] = d;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.22;
        const color = getArcColor(originType);
        const width = Math.max(1.5, Math.min(8, flow.scaledTonnage / 800));
        const opacity = 0.8;

        return (
          <g key={flow.flow_id}>
            <path
              d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
              fill="none" stroke={color} strokeWidth={width}
              opacity={opacity * 0.4} strokeLinecap="round" pointerEvents="none"
            />
            <path
              d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
              fill="none" stroke={color} strokeWidth={width * 0.6}
              className="flow-arc-animated"
              opacity={opacity} strokeLinecap="round" pointerEvents="none"
            />
            <path
              d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
              fill="none" stroke="transparent" strokeWidth={16}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onHover(flow)}
              onMouseLeave={() => onHover(null)}
            />
          </g>
        );
      })}
    </>
  );
}

export default function Level1({
  statesData, flowsData, facilitiesData, facilityFilters, layers,
  onStateClick, selectedYear, valueChainData, importData, timeseriesData,
  theme,
}) {
  const [hoveredFlow, setHoveredFlow] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Facility lookup
  const facilityMap = useMemo(() => {
    const m = {};
    (facilitiesData || []).forEach(f => { m[f.facility_id] = f; });
    return m;
  }, [facilitiesData]);

  // Year multiplier for flow scaling
  const ym = yearMultiplier(selectedYear);
  const scaledFlows = useMemo(() =>
    (flowsData || []).map(f => ({ ...f, scaledTonnage: Math.round((f.tonnage || 0) * ym) })),
    [flowsData, ym]
  );

  // Determine visible facility types from layers + facility filters
  const visibleTypes = useMemo(() => {
    const s = new Set();
    for (const [layerKey, types] of Object.entries(LAYER_TYPES)) {
      if (layers[layerKey] !== false) {
        for (const t of types) {
          if (facilityFilters[t] !== false) s.add(t);
        }
      }
    }
    return s;
  }, [layers, facilityFilters]);

  // Filtered facilities
  const visibleFacilities = (facilitiesData || []).filter(f => visibleTypes.has(f.type));

  // Year-filtered timeseries KPIs (aggregate across all states for the selected year)
  const yearTS = (timeseriesData || []).filter(d => d.year === selectedYear);
  const tsProduction = yearTS.reduce((a, d) => a + (d.local_supply_tons || 0), 0);
  const tsDemand = yearTS.reduce((a, d) => a + (d.total_demand_tons || 0), 0);
  const tsRecycling = yearTS.reduce((a, d) => a + (d.recycling_capacity_tons || 0), 0);
  const tsImport = yearTS.reduce((a, d) => a + (d.import_tons || 0), 0);
  const tsEVDemand = yearTS.reduce((a, d) => a + (d.local_ev_production_tons || 0), 0);

  // Static state KPIs (always available)
  const totalVal = statesData.reduce((a, s) => a + (s.total_economic_value_M || 0), 0);
  const totalEmployment = statesData.reduce((a, s) => a + (s.employment || 0), 0);
  const avgVulnerability = statesData.length > 0
    ? (statesData.reduce((a, s) => a + (s.vulnerability_score || 0), 0) / statesData.length).toFixed(1) : 0;
  const totalReserve = statesData.reduce((a, s) => a + (s.strategic_reserve_tons || 0), 0);

  // Use timeseries for production/demand if available, else fall back to static
  const displayProd = yearTS.length > 0 ? tsProduction : statesData.reduce((a, s) => a + (s.total_production_tons || 0), 0);
  const displayDemand = yearTS.length > 0 ? tsDemand : statesData.reduce((a, s) => a + (s.total_demand_tons || 0), 0);
  const displayRecycling = yearTS.length > 0 ? tsRecycling : statesData.reduce((a, s) => a + (s.recycling_capacity_tons || 0), 0);
  const displayImport = yearTS.length > 0 ? tsImport : 0;

  // Choropleth: color by demand, production, or economic value depending on layers
  function getStateColor(abbr) {
    const s = statesData.find(d => d.abbr === abbr);
    if (!s) return theme === 'light' ? '#c8cdd5' : '#111824';
    if (layers.economic === false) return 'var(--map-state-off)';
    const vals = statesData.map(d => d.total_economic_value_M || 0);
    const min = Math.min(...vals), max = Math.max(...vals);
    const t = max > min ? (s.total_economic_value_M - min) / (max - min) : 0.5;
    if (theme === 'light') {
      const r = Math.round(200 - t * 140);
      const g = Math.round(210 - t * 110);
      const b = Math.round(230 - t * 60);
      return `rgb(${r},${g},${b})`;
    }
    const r = Math.round(12 + t * 20);
    const g = Math.round(28 + t * 90);
    const b = Math.round(55 + t * 120);
    return `rgb(${r},${g},${b})`;
  }

  // Cost comparison chart
  const chartData = statesData.slice(0, 10).map(s => ({
    name: s.abbr,
    Mining: +(s.mining_cost_M || 0),
    Processing: +(s.processing_cost_M || 0),
    Env: +(s.env_remediation_cost_M || 0),
    Collect: +(s.collection_cost_M || 0),
    Dismantle: +(s.dismantling_cost_M || 0),
    Extract: +(s.extraction_cost_M || 0),
  }));

  // Import source donut
  const importDonut = (importData || [])
    .filter(d => d.element === 'All REE')
    .map(d => ({ name: d.country, value: d.percentage }));

  // Value chain for selected year
  const chainForYear = (valueChainData || []).filter(d => d.year === selectedYear);

  // Top states for labels
  const topStates = statesData
    .slice().sort((a, b) => (b.total_economic_value_M || 0) - (a.total_economic_value_M || 0))
    .slice(0, 8);

  // Build KPI tiles based on active layers
  const kpiTiles = [];
  if (layers.economic !== false)
    kpiTiles.push({ label: 'Total Value', value: `$${(totalVal / 1000).toFixed(1)}B`, color: LAYER_COLORS.economic });
  if (layers.production !== false)
    kpiTiles.push({ label: `Production (${selectedYear})`, value: `${(displayProd / 1000).toFixed(0)}k t`, color: LAYER_COLORS.production });
  if (layers.demand !== false)
    kpiTiles.push({ label: `Demand (${selectedYear})`, value: `${(displayDemand / 1000).toFixed(0)}k t`, color: LAYER_COLORS.demand });
  if (layers.recycling !== false)
    kpiTiles.push({ label: `Recycling Cap. (${selectedYear})`, value: `${(displayRecycling / 1000).toFixed(0)}k t`, color: LAYER_COLORS.recycling });
  kpiTiles.push({ label: 'Employment', value: `${(totalEmployment / 1000).toFixed(1)}k`, color: '#da77f2' });
  if (layers.demand !== false && yearTS.length > 0)
    kpiTiles.push({ label: `Import (${selectedYear})`, value: `${(displayImport / 1000).toFixed(0)}k t`, color: '#ff6b6b' });
  if (kpiTiles.length < 6)
    kpiTiles.push({ label: 'Vulnerability', value: `${avgVulnerability}/10`, color: '#fcc419' });

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Map area */}
      <div
        style={{ flex: 1, minWidth: 0, position: 'relative', background: 'var(--bg-map)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onMouseMove={e => setMouse({ x: e.clientX, y: e.clientY })}
      >
        <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{ scale: 1000 }}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => {
                  const fips = String(geo.id).padStart(2, '0');
                  const abbr = FIPS_ABBR[fips];
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getStateColor(abbr)}
                      stroke="var(--map-state-stroke)"
                      strokeWidth={0.6}
                      style={{
                        default: { outline: 'none' },
                        hover: { fill: theme === 'light' ? '#a8c4e0' : '#2a5a9a', outline: 'none', cursor: 'pointer' },
                        pressed: { outline: 'none' },
                      }}
                      onClick={() => abbr && onStateClick(abbr)}
                    />
                  );
                })
              }
            </Geographies>

            <FlowArcs
              flowsData={scaledFlows}
              onHover={setHoveredFlow}
              facilityMap={facilityMap}
              facilityFilters={facilityFilters}
              layers={layers}
            />

            {visibleFacilities.map(f => (
              <Marker key={f.facility_id} coordinates={[+f.lng, +f.lat]}>
                <circle
                  r={Math.max(2.5, Math.min(6, (f.capacity_tons || 2000) / 4000))}
                  fill={TYPE_COLORS[f.type] || '#8892aa'}
                  stroke="var(--map-marker-border)"
                  strokeWidth={0.8}
                  opacity={0.85}
                />
              </Marker>
            ))}

            {topStates.map(s => (
              <Annotation key={s.abbr} subject={[s.lng, s.lat]} dx={0} dy={0} connectorProps={{ stroke: 'none' }}>
                <text textAnchor="middle" fill="var(--text-muted)" fontSize={7} fontWeight={600} style={{ pointerEvents: 'none' }}>
                  {s.abbr}
                </text>
              </Annotation>
            ))}
          </ComposableMap>

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            background: 'var(--bg-glass)', borderRadius: 16,
            padding: '14px 18px', fontSize: 11, color: 'var(--text-primary)',
            border: 'none', boxShadow: 'var(--shadow-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          }}>
            {layers.economic !== false && (
              <>
                <div style={{ fontWeight: 600, color: LAYER_COLORS.economic, marginBottom: 5 }}>Economic Value</div>
                <div style={{ width: 90, height: 8, background: 'linear-gradient(to right,rgb(12,28,55),rgb(32,118,175))', borderRadius: 2, marginBottom: 3 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: 10, width: 90 }}>
                  <span>Low</span><span>High</span>
                </div>
              </>
            )}
            <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: 5 }}>Facilities & Flows</div>
            {Object.entries(TYPE_COLORS).map(([type, color]) => {
              if (!visibleTypes.has(type)) return null;
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[type]}</span>
                </div>
              );
            })}
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>Arc color = origin facility type</div>
          </div>

          {/* Flow hover tooltip */}
          {hoveredFlow && (() => {
            const originFac = facilityMap[hoveredFlow.origin_facility_id];
            const destFac = facilityMap[hoveredFlow.dest_facility_id];
            return (
              <div style={{
                position: 'fixed', left: mouse.x + 14, top: mouse.y - 8,
                background: 'var(--bg-glass-heavy)', border: 'none',
                borderRadius: 16, padding: '14px 18px', fontSize: 12,
                color: 'var(--text-primary)', pointerEvents: 'none', zIndex: 1000,
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                boxShadow: 'var(--shadow-tooltip)', maxWidth: 320,
              }}>
                <div style={{ fontWeight: 700, color: '#6ab4ff', marginBottom: 2, fontSize: 11 }}>
                  {originFac?.name || hoveredFlow.origin_facility_id}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>&darr;</div>
                <div style={{ fontWeight: 700, color: '#6ab4ff', marginBottom: 6, fontSize: 11 }}>
                  {destFac?.name || hoveredFlow.dest_facility_id}
                </div>
                {[
                  ['Route', `${hoveredFlow.origin_state} \u2192 ${hoveredFlow.destination_state}`],
                  ['Distance', `${hoveredFlow.distance_miles} mi`],
                  ['Transport cost', `$${hoveredFlow.transport_cost_per_ton}/ton`],
                  ['Mode', hoveredFlow.transport_mode],
                  ['Tonnage', `${(hoveredFlow.scaledTonnage || 0).toLocaleString()} t (${selectedYear})`],
                  ['Material', hoveredFlow.material_type?.replace(/_/g, ' ')],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}:</span><span>{v}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Value Chain Flow bar — only when economic layer is on */}
        {layers.economic !== false && chainForYear.length > 0 && (
          <div style={{
            height: 80, background: 'var(--bg-glass)', borderTop: '1px solid var(--border-subtle)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', padding: '0 24px', gap: 0, flexShrink: 0,
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginRight: 12, minWidth: 70 }}>
              US Value<br />Chain ({selectedYear})
            </div>
            {VALUE_CHAIN_STAGES.map((stage, i) => {
              const d = chainForYear.find(c => c.stage === stage.key);
              if (!d) return null;
              const maxOutput = Math.max(...chainForYear.map(c => c.output_tons || 0));
              const widthPct = maxOutput > 0 ? Math.max(8, ((d.output_tons || 0) / maxOutput) * 100) : 15;
              return (
                <React.Fragment key={stage.key}>
                  {i > 0 && (
                    <div style={{
                      width: 0, height: 0,
                      borderTop: '12px solid transparent', borderBottom: '12px solid transparent',
                      borderLeft: `10px solid ${VALUE_CHAIN_STAGES[i - 1].color}`,
                      opacity: 0.4, flexShrink: 0,
                    }} />
                  )}
                  <div className="value-chain-stage" style={{
                    flex: widthPct,
                    background: stage.color + '22', border: `1px solid ${stage.color}44`, color: stage.color,
                  }} title={`${stage.key}: ${(d.output_tons || 0).toLocaleString()}t output, $${d.cost_per_ton}/t`}>
                    <span style={{ fontSize: 12 }}>{stage.icon}</span>
                    <span style={{ fontWeight: 600 }}>{stage.key.split(' ')[0]}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 8 }}>{(d.output_tons / 1000).toFixed(0)}k t</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div style={{
        width: 320, background: 'var(--bg-panel)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: 'var(--text-primary)',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
        overflowY: 'auto', flexShrink: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>
          National Metrics ({selectedYear})
        </div>

        {/* KPI grid — dynamic based on active layers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {kpiTiles.slice(0, 6).map(m => (
            <div key={m.label} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '10px 14px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 9, marginBottom: 1 }}>{m.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Strategic Reserve — only when production layer is on */}
        {layers.production !== false && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '12px 16px' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>Strategic Reserve</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${Math.min(100, (totalReserve / 40000) * 100)}%`,
                  background: 'linear-gradient(to right, #fcc419, #51cf66)',
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#51cf66' }}>
                {(totalReserve / 1000).toFixed(1)}k t
              </span>
            </div>
          </div>
        )}

        {/* Import source donut — only when demand layer is on */}
        {layers.demand !== false && importDonut.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Global REE Import Sources
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={importDonut} cx="50%" cy="50%" innerRadius={28} outerRadius={45}
                    dataKey="value" isAnimationActive={false}>
                    {importDonut.map((_, i) => <Cell key={i} fill={IMPORT_COLORS[i]} />)}
                  </Pie>
                  <RTooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 10, boxShadow: 'var(--chart-tooltip-shadow)' }}
                    formatter={v => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {importDonut.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: IMPORT_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 10, flex: 1 }}>{d.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: IMPORT_COLORS[i] }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cost comparison — only when economic layer is on */}
        {layers.economic !== false && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              Mine vs. Recycle Cost ($M)
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 9 }} />
                <RTooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 10, boxShadow: 'var(--chart-tooltip-shadow)' }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                {layers.production !== false && <Bar dataKey="Mining" stackId="mine" fill="#339af0" />}
                {layers.production !== false && <Bar dataKey="Processing" stackId="mine" fill="#74c0fc" />}
                {layers.production !== false && <Bar dataKey="Env" stackId="mine" fill="#a5d8ff" name="Env. Remed." />}
                {layers.recycling !== false && <Bar dataKey="Collect" stackId="recycle" fill="#51cf66" />}
                {layers.recycling !== false && <Bar dataKey="Dismantle" stackId="recycle" fill="#8ce99a" />}
                {layers.recycling !== false && <Bar dataKey="Extract" stackId="recycle" fill="#b2f2bb" />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Transport cost heatmap */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            Production Cost per State ($/ton)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {statesData.map(s => {
              const avgCost = s.total_production_tons > 0
                ? (s.mining_cost_M * 1e6) / s.total_production_tons : 100;
              const t = Math.min(1, Math.max(0, (avgCost - 50) / 100));
              const r = Math.round(50 + t * 200);
              const g = Math.round(200 - t * 150);
              return (
                <div key={s.abbr} title={`${s.state_name}: $${avgCost.toFixed(0)}/ton`}
                  style={{
                    width: 30, height: 22, borderRadius: 8, fontSize: 9, fontWeight: 600, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `rgb(${r},${g},50)`, cursor: 'pointer',
                  }}
                  onClick={() => onStateClick(s.abbr)}>
                  {s.abbr}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ fontSize: 9, color: 'var(--text-faint)', borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
          Click any state to drill down &bull; Year: {selectedYear}
        </div>
      </div>
    </div>
  );
}
