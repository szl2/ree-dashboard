import React, { useState, useMemo } from 'react';
import { Map, Marker, Source, Layer } from 'react-map-gl/maplibre';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
  ReferenceLine,
} from 'recharts';

const LIGHT_STYLE = {
  version: 8,
  sources: {
    'carto-light': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
  },
  layers: [{ id: 'carto-light-layer', type: 'raster', source: 'carto-light' }],
};

const DARK_STYLE = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    },
  },
  layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }],
};

const STATE_CENTERS = {
  CA:[-119.5,37.3],TX:[-99.9,31.5],MI:[-84.5,44.3],NV:[-116.4,38.8],
  WY:[-107.5,43.0],MT:[-110.0,47.0],ID:[-114.5,44.5],AZ:[-111.5,34.3],
  CO:[-105.5,39.0],WA:[-120.5,47.4],OH:[-82.8,40.4],PA:[-77.2,41.2],
  GA:[-83.4,32.7],FL:[-82.5,28.6],IL:[-89.2,40.0],NY:[-75.5,43.0],
  NC:[-79.8,35.6],MN:[-94.6,46.4],IN:[-86.3,39.8],UT:[-111.1,39.3],
  NM:[-106.2,34.8],SC:[-81.2,33.8],MO:[-92.6,38.6],VA:[-78.7,37.4],
  TN:[-86.6,35.5],
};

const STATE_ZOOMS = {
  CA:5.2,TX:5.0,MI:6.0,NV:5.5,WY:5.8,MT:5.5,ID:5.8,AZ:5.8,
  CO:5.8,WA:6.0,OH:6.2,PA:6.2,GA:5.8,FL:5.5,IL:6.0,NY:5.8,
  NC:6.0,MN:5.5,IN:6.2,UT:5.8,NM:5.8,SC:6.5,MO:5.8,VA:6.0,TN:6.2,
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

const SOURCE_ICONS = {
  e_waste: { symbol: '\ud83d\udcbb', label: 'E-Waste' },
  industrial_scrap: { symbol: '\ud83c\udfed', label: 'Industrial Scrap' },
  magnet_reuse: { symbol: '\ud83e\uddf2', label: 'Magnet Reuse' },
};

const OPEX_COLORS = ['#339af0', '#51cf66', '#fcc419'];

const STATE_NAMES = {
  CA:'California',TX:'Texas',MI:'Michigan',NV:'Nevada',WY:'Wyoming',
  MT:'Montana',ID:'Idaho',AZ:'Arizona',CO:'Colorado',WA:'Washington',
  OH:'Ohio',PA:'Pennsylvania',GA:'Georgia',FL:'Florida',IL:'Illinois',
  NY:'New York',NC:'North Carolina',MN:'Minnesota',IN:'Indiana',UT:'Utah',
  NM:'New Mexico',SC:'South Carolina',MO:'Missouri',VA:'Virginia',TN:'Tennessee',
};

// Arc color = origin facility type color
function getArcColor(originType) {
  return TYPE_COLORS[originType] || '#8892aa';
}

function flowToArcPoints(flow, numPoints = 30) {
  const lng1 = +flow.origin_lng, lat1 = +flow.origin_lat;
  const lng2 = +flow.dest_lng, lat2 = +flow.dest_lat;
  const dist = Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);
  const arcHeight = Math.min(dist * 0.25, 3);
  const coords = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = lng1 + (lng2 - lng1) * t;
    const lat = lat1 + (lat2 - lat1) * t + arcHeight * Math.sin(Math.PI * t);
    coords.push([lng, lat]);
  }
  return coords;
}

// Which facility types belong to which layer
const LAYER_TYPES = {
  demand: ['factory'],
  production: ['mine', 'processing'],
  recycling: ['recycling'],
};

function yearMultiplier(year) {
  return 0.7 + (year - 2019) * 0.06;
}

export default function Level2({
  stateAbbr, statesData, facilitiesData, flowsData, timeseriesData,
  facilityFilters, layers, onFacilityClick, selectedYear, theme,
}) {
  const [hoveredFacility, setHoveredFacility] = useState(null);
  const [hoveredFlow, setHoveredFlow] = useState(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const facilityMap = {};
  (facilitiesData || []).forEach(f => { facilityMap[f.facility_id] = f; });

  // Compute visible facility types from layers + facilityFilters
  const visibleTypes = useMemo(() => {
    const fromLayers = new Set();
    Object.entries(LAYER_TYPES).forEach(([layer, types]) => {
      if (layers[layer] !== false) types.forEach(t => fromLayers.add(t));
    });
    // Further filter by facilityFilters
    return [...fromLayers].filter(t => facilityFilters[t] !== false);
  }, [layers, facilityFilters]);

  const stateFacilities = (facilitiesData || [])
    .filter(f => f.state === stateAbbr)
    .filter(f => visibleTypes.includes(f.type));
  const stateName = STATE_NAMES[stateAbbr] || stateAbbr;
  const center = STATE_CENTERS[stateAbbr] || [-98.5, 39.5];
  const zoom = STATE_ZOOMS[stateAbbr] || 6;
  const stateInfo = (statesData || []).find(s => s.abbr === stateAbbr) || {};

  const mult = yearMultiplier(selectedYear);

  // Filter flows: at least one endpoint must be a visible type
  const allStateFlows = (flowsData || []).filter(
    f => f.origin_state === stateAbbr || f.destination_state === stateAbbr
  );
  const stateFlows = allStateFlows.filter(flow => {
    const originFac = facilityMap[flow.origin_facility_id];
    const destFac = facilityMap[flow.dest_facility_id];
    const oType = originFac?.type;
    const dType = destFac?.type;
    return visibleTypes.includes(oType) && visibleTypes.includes(dType);
  });
  const scaledFlows = stateFlows.map(f => {
    const originFacType = facilityMap[f.origin_facility_id]?.type;
    return {
      ...f,
      tonnage: Math.round((f.tonnage || 0) * mult),
      arcColor: getArcColor(originFacType),
    };
  });
  const inboundFlows = scaledFlows.filter(f => f.destination_state === stateAbbr);
  const outboundFlows = scaledFlows.filter(f => f.origin_state === stateAbbr);
  const totalInbound = inboundFlows.reduce((a, f) => a + (f.tonnage || 0), 0);
  const totalOutbound = outboundFlows.reduce((a, f) => a + (f.tonnage || 0), 0);

  const stateTimeseries = (timeseriesData || []).filter(d => d.state === stateAbbr);
  const yearRow = stateTimeseries.find(d => +d.year === selectedYear) || {};

  const opexFacs = stateFacilities.filter(f => f.type === 'recycling' || f.type === 'processing');
  const totalEnergy = opexFacs.reduce((a, f) => a + (f.opex_energy_M || 0), 0);
  const totalChem = opexFacs.reduce((a, f) => a + (f.opex_chemicals_M || 0), 0);
  const totalLabor = opexFacs.reduce((a, f) => a + (f.opex_labor_M || 0), 0);
  const pieData = [
    { name: 'Energy', value: +totalEnergy.toFixed(2) },
    { name: 'Chemicals', value: +totalChem.toFixed(2) },
    { name: 'Labor', value: +totalLabor.toFixed(2) },
  ].filter(d => d.value > 0);

  const localSupply = stateFacilities
    .filter(f => f.type === 'recycling' || f.type === 'mine' || f.type === 'processing')
    .reduce((a, f) => a + (f.capacity_tons || 0), 0);
  const avgConv = opexFacs.length > 0
    ? (opexFacs.reduce((a, f) => a + (f.conversion_rate || 0), 0) / opexFacs.length * 100).toFixed(0)
    : 0;

  // GeoJSON for flow arcs (uses scaled flows)
  const flowsGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: scaledFlows.map(flow => ({
      type: 'Feature',
      properties: {
        flow_id: flow.flow_id,
        color: flow.arcColor,
        width: Math.max(1.5, Math.min(6, flow.tonnage / 600)),
      },
      geometry: {
        type: 'LineString',
        coordinates: flowToArcPoints(flow),
      },
    })),
  }), [scaledFlows]);

  return (
    <div
      style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
      onMouseMove={e => setMouse({ x: e.clientX, y: e.clientY })}
    >
      {/* Map */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-map)' }}>
        <Map
          key={theme}
          initialViewState={{
            longitude: center[0],
            latitude: center[1],
            zoom: zoom,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={theme === 'light' ? LIGHT_STYLE : DARK_STYLE}
          attributionControl={false}
        >
          {/* Flow arc lines */}
          <Source id="flows" type="geojson" data={flowsGeoJSON}>
            {scaledFlows.map(flow => (
              <Layer
                key={flow.flow_id}
                id={`flow-${flow.flow_id}`}
                type="line"
                filter={['==', ['get', 'flow_id'], flow.flow_id]}
                paint={{
                  'line-color': flow.arcColor,
                  'line-width': Math.max(1.5, Math.min(5, flow.tonnage / 600)),
                  'line-opacity': 0.7,
                  'line-dasharray': [3, 2],
                }}
              />
            ))}
          </Source>

          {/* Facility markers */}
          {stateFacilities.map(f => {
            const size = Math.max(12, Math.min(32, (f.capacity_tons || 2000) / 500));
            return (
              <Marker
                key={f.facility_id}
                longitude={+f.lng}
                latitude={+f.lat}
                anchor="center"
              >
                <div
                  style={{
                    width: size, height: size,
                    borderRadius: '50%',
                    background: TYPE_COLORS[f.type] || '#8892aa',
                    border: '2px solid var(--map-marker-border)',
                    opacity: 0.9,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 8px ${TYPE_COLORS[f.type] || '#8892aa'}44`,
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHoveredFacility(f)}
                  onMouseLeave={() => setHoveredFacility(null)}
                  onClick={() => onFacilityClick(f)}
                >
                  {f.recycling_source && SOURCE_ICONS[f.recycling_source] && (
                    <span style={{ fontSize: size * 0.45, lineHeight: 1 }}>
                      {SOURCE_ICONS[f.recycling_source].symbol}
                    </span>
                  )}
                </div>
                {/* City label */}
                <div style={{
                  position: 'absolute', top: size / 2 + 4, left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap',
                  textShadow: 'var(--map-text-shadow)',
                  fontWeight: 600, pointerEvents: 'none',
                }}>
                  {f.city}
                </div>
              </Marker>
            );
          })}
        </Map>

        {/* Legend */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'var(--bg-glass)', borderRadius: 16, border: 'none',
          boxShadow: 'var(--shadow-glass)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          padding: '14px 18px', fontSize: 11, color: 'var(--text-primary)', zIndex: 10,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>{stateName} Facilities</div>
          {Object.entries(TYPE_COLORS)
            .filter(([type]) => visibleTypes.includes(type))
            .map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ textTransform: 'capitalize' }}>{type.replace('_', ' ')}</span>
            </div>
          ))}
          <div style={{ marginTop: 6, borderTop: '1px solid var(--border-divider)', paddingTop: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: 4 }}>Recycling Source</div>
            {Object.entries(SOURCE_ICONS).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, fontSize: 10 }}>
                <span>{cfg.symbol}</span>
                <span style={{ color: 'var(--text-muted)' }}>{cfg.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 10 }}>Circle size = capacity</div>
        </div>

        {/* Supply-demand trend overlay */}
        {stateTimeseries.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            background: 'var(--bg-glass)', borderRadius: 16, border: 'none',
            boxShadow: 'var(--shadow-glass)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            padding: '14px 16px', width: 380, zIndex: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
              {stateName} Supply-Demand Trend
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={stateTimeseries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="year" tick={{ fill: 'var(--text-dimmer)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'var(--text-dimmer)', fontSize: 9 }} />
                <RTooltip contentStyle={{ background: 'var(--chart-tooltip-bg)', border: 'none', borderRadius: 12, color: 'var(--text-primary)', fontSize: 10, boxShadow: 'var(--chart-tooltip-shadow)' }} />
                <Legend wrapperStyle={{ fontSize: 9 }} />
                <ReferenceLine x={selectedYear} stroke="var(--accent)" strokeDasharray="4 2" strokeWidth={2} label={{ value: selectedYear, fill: 'var(--accent)', fontSize: 9, position: 'top' }} />
                {layers.recycling !== false && <Area type="monotone" dataKey="e_waste_tons" stackId="supply" stroke="#51cf66" fill="#51cf66" fillOpacity={0.15} name="E-waste" />}
                {layers.recycling !== false && <Area type="monotone" dataKey="industrial_scrap_tons" stackId="supply" stroke="#8ce99a" fill="#8ce99a" fillOpacity={0.15} name="Ind. Scrap" />}
                {layers.recycling !== false && <Area type="monotone" dataKey="magnet_reuse_tons" stackId="supply" stroke="#b2f2bb" fill="#b2f2bb" fillOpacity={0.15} name="Magnet" />}
                {layers.demand !== false && <Area type="monotone" dataKey="local_ev_production_tons" stroke="#ff6b6b" fill="none" strokeWidth={2} name="EV Demand" strokeDasharray="5 5" />}
                {layers.recycling !== false && <Area type="monotone" dataKey="recycling_capacity_tons" stroke="#fcc419" fill="none" strokeWidth={1.5} name="Recycl. Cap." />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Flow hover tooltip */}
        {hoveredFlow && (() => {
          const originFac = facilityMap[hoveredFlow.origin_facility_id];
          const destFac = facilityMap[hoveredFlow.dest_facility_id];
          return (
            <div style={{
              position: 'fixed', left: mouse.x + 14, top: mouse.y - 8,
              background: 'var(--bg-glass-heavy)', border: 'none',
              borderRadius: 16, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              padding: '10px 14px', fontSize: 12,
              color: 'var(--text-primary)', pointerEvents: 'none', zIndex: 1000,
              boxShadow: 'var(--shadow-tooltip)', maxWidth: 320,
            }}>
              <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 2, fontSize: 11 }}>
                {originFac?.name || hoveredFlow.origin_facility_id}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginBottom: 4 }}>&darr;</div>
              <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6, fontSize: 11 }}>
                {destFac?.name || hoveredFlow.dest_facility_id}
              </div>
              {[
                ['Route', `${hoveredFlow.origin_state} \u2192 ${hoveredFlow.destination_state}`],
                ['Tonnage', `${(hoveredFlow.tonnage || 0).toLocaleString()} t`],
                ['Cost', `$${hoveredFlow.transport_cost_per_ton}/ton`],
                ['Distance', `${hoveredFlow.distance_miles} mi`],
                ['Mode', hoveredFlow.transport_mode],
                ['Material', hoveredFlow.material_type?.replace(/_/g, ' ')],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}:</span><span>{v}</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Facility hover tooltip */}
        {hoveredFacility && !hoveredFlow && (
          <div style={{
            position: 'fixed', left: mouse.x + 14, top: mouse.y - 8,
            background: 'var(--bg-glass-heavy)', border: 'none',
            borderRadius: 16, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            padding: '10px 14px', fontSize: 12,
            color: 'var(--text-primary)', pointerEvents: 'none', zIndex: 1000,
            boxShadow: 'var(--shadow-tooltip)',
          }}>
            <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
              {hoveredFacility.name}
            </div>
            {[
              ['City', hoveredFacility.city],
              ['Type', [hoveredFacility.type, hoveredFacility.sub_type].filter(Boolean).map(s => s.replace(/_/g, ' ')).join(' — ')],
              ['Capacity', `${(hoveredFacility.capacity_tons || 0).toLocaleString()} t/yr`],
              ['Yield', `${((hoveredFacility.conversion_rate || 0) * 100).toFixed(0)}%`],
              ['Employees', hoveredFacility.employees || 'N/A'],
              ['Status', hoveredFacility.status],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}:</span><span>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 4, fontSize: 10, color: 'var(--accent)' }}>Click for full details</div>
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div style={{
        width: 300, background: 'var(--bg-panel)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: 'var(--text-primary)',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
        overflowY: 'auto', flexShrink: 0,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>
          {stateName} Supply Chain
        </div>

        {/* State KPI badges — year-aware */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            layers.economic !== false && { label: 'Econ. Value', value: `$${Math.round((stateInfo.total_economic_value_M || 0) * mult).toLocaleString()}M`, color: LAYER_COLORS.economic },
            layers.production !== false && { label: 'Production', value: `${((yearRow.local_supply_tons || 0) / 1000).toFixed(1)}k t`, color: LAYER_COLORS.production },
            layers.demand !== false && { label: 'Demand', value: `${((yearRow.total_demand_tons || 0) / 1000).toFixed(1)}k t`, color: LAYER_COLORS.demand },
            layers.recycling !== false && { label: 'Recycl. Cap.', value: `${((yearRow.recycling_capacity_tons || 0) / 1000).toFixed(1)}k t`, color: LAYER_COLORS.recycling },
            { label: 'Import Dep.', value: `${stateInfo.import_dependency_pct || 0}%`, color: '#ff6b6b' },
            { label: 'Policy Score', value: `${stateInfo.policy_incentive_score || 0}/10`, color: '#51cf66' },
            { label: 'Employment', value: `${(stateInfo.employment || 0).toLocaleString()}`, color: '#da77f2' },
            layers.demand !== false && { label: 'Imports', value: `${((yearRow.import_tons || 0) / 1000).toFixed(1)}k t`, color: '#ff6b6b' },
          ].filter(Boolean).map(m => (
            <div key={m.label} style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '10px 14px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>{m.label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Flow summary */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>Cross-State Material Flow</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#51cf66' }}>Inbound</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#51cf66' }}>{(totalInbound / 1000).toFixed(1)}k t</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{inboundFlows.length} routes</div>
            </div>
            <div style={{ width: 1, background: 'var(--border-divider)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#ff6b6b' }}>Outbound</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ff6b6b' }}>{(totalOutbound / 1000).toFixed(1)}k t</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{outboundFlows.length} routes</div>
            </div>
          </div>
        </div>

        {/* Local supply bar */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Local Supply Contribution</div>
          <div style={{ position: 'relative', height: 10, background: 'var(--bg-input)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 5,
              width: `${Math.min(100, (localSupply / (stateInfo.total_demand_tons || 20000)) * 100)}%`,
              background: 'linear-gradient(to right,#1c7ed6,#339af0)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 10, color: 'var(--text-muted)' }}>
            <span>{localSupply.toLocaleString()} t/yr</span>
            <span>Avg yield: {avgConv}%</span>
          </div>
        </div>

        {/* OpEx pie */}
        {pieData.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Cost Breakdown (Recycling + Processing)</div>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={32} outerRadius={52}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'var(--text-dimmer)', strokeWidth: 0.5 }}
                  style={{ fontSize: 9 }}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={OPEX_COLORS[i]} />)}
                </Pie>
                <RTooltip
                  contentStyle={{ background: 'var(--chart-tooltip-bg)', border: 'none', borderRadius: 12, color: 'var(--text-primary)', fontSize: 10, boxShadow: 'var(--chart-tooltip-shadow)' }}
                  formatter={v => `$${v}M`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Environmental footprint — shown when production or recycling layers active */}
        {(layers.production !== false || layers.recycling !== false) && <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '12px 16px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Environmental Footprint</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>CO2 Emissions</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fcc419' }}>
                {((stateInfo.co2_annual_tons || 0) / 1000).toFixed(1)}k tons
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Water Usage</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#339af0' }}>
                {stateInfo.water_usage_mgal || 0} Mgal
              </div>
            </div>
          </div>
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Vulnerability Score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 14, height: 6, borderRadius: 4,
                    background: i < (stateInfo.vulnerability_score || 0)
                      ? (i < 3 ? '#51cf66' : i < 6 ? '#fcc419' : '#ff6b6b')
                      : 'var(--bg-input)',
                  }}
                />
              ))}
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', marginLeft: 4 }}>
                {stateInfo.vulnerability_score || 0}/10
              </span>
            </div>
          </div>
        </div>}

        {/* Facility list */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
            Facilities ({stateFacilities.length})
          </div>
          {stateFacilities.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No facilities for {stateAbbr}
            </div>
          )}
          {stateFacilities.map(f => (
            <div
              key={f.facility_id}
              style={{
                background: 'var(--bg-card)', borderRadius: 14, padding: '12px 14px',
                marginBottom: 5, cursor: 'pointer', border: 'none',
                boxShadow: 'var(--shadow-card)',
                transition: 'background 0.15s',
              }}
              onClick={() => onFacilityClick(f)}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{f.name}</span>
                <span style={{ fontSize: 9, color: TYPE_COLORS[f.type] || '#8892aa', textTransform: 'capitalize' }}>
                  {f.sub_type ? f.sub_type.replace(/_/g, ' ') : f.type?.replace('_', ' ')}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', gap: 6 }}>
                <span>{f.city}</span>
                {f.capacity_tons > 0 && <span>&bull; {f.capacity_tons.toLocaleString()}t</span>}
                {f.employees > 0 && <span>&bull; {f.employees} jobs</span>}
                {f.environmental_rating && (
                  <span className={`rating-badge rating-${f.environmental_rating}`} style={{ width: 16, height: 16, fontSize: 9, borderRadius: 3 }}>
                    {f.environmental_rating}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
