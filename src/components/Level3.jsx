import React, { useMemo } from 'react';
import { Map, Marker, Source, Layer } from 'react-map-gl/maplibre';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, PieChart, Pie, Cell,
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

// Facility colors match their parent layer
const TYPE_COLORS = {
  mine: '#339af0',       // production (blue)
  processing: '#74c0fc', // production (light blue)
  factory: '#ff6b6b', // demand (red)
  recycling: '#51cf66',  // recycling (green)
};

const ELEMENT_COLORS = ['#339af0', '#51cf66', '#fcc419', '#ff6b6b', '#da77f2', '#8892aa'];

const SOURCE_LABELS = {
  e_waste: 'E-Waste (Electronics / Motors)',
  industrial_scrap: 'Industrial Scrap',
  magnet_reuse: 'Permanent Magnet Reuse',
};

function flowToArcPoints(flow, numPoints = 30) {
  const lng1 = +flow.origin_lng, lat1 = +flow.origin_lat;
  const lng2 = +flow.dest_lng, lat2 = +flow.dest_lat;
  const dist = Math.sqrt((lng2 - lng1) ** 2 + (lat2 - lat1) ** 2);
  const arcHeight = Math.min(dist * 0.2, 2);
  const coords = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = lng1 + (lng2 - lng1) * t;
    const lat = lat1 + (lat2 - lat1) * t + arcHeight * Math.sin(Math.PI * t);
    coords.push([lng, lat]);
  }
  return coords;
}

function getArcColor(originType) {
  return TYPE_COLORS[originType] || '#8892aa';
}

function yearMultiplier(year) {
  return 0.7 + (year - 2019) * 0.06;
}

export default function Level3({ facility, opexDetail, flowsData, facilitiesData, selectedYear, theme }) {
  if (!facility) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: 14,
      }}>
        No facility selected
      </div>
    );
  }

  const detail = (opexDetail || []).find(d => d.facility_id === facility.facility_id) || {};

  const facilityMap = {};
  (facilitiesData || []).forEach(f => { facilityMap[f.facility_id] = f; });

  const mult = yearMultiplier(selectedYear || 2024);

  // Flows directly connected to this facility (scaled by year)
  const directFlows = (flowsData || []).filter(
    f => f.origin_facility_id === facility.facility_id || f.dest_facility_id === facility.facility_id
  );
  const rawMicroFlows = directFlows.length > 0
    ? directFlows.slice(0, 8)
    : (flowsData || []).filter(
        f => f.origin_state === facility.state || f.destination_state === facility.state
      ).slice(0, 6);
  const microFlows = rawMicroFlows.map(f => {
    const originFacType = facilityMap[f.origin_facility_id]?.type;
    return {
      ...f,
      tonnage: Math.round((f.tonnage || 0) * mult),
      arcColor: getArcColor(originFacType),
    };
  });

  // Connected facility markers (the other end of each flow)
  const connectedFacilities = microFlows.map(flow => {
    const otherId = flow.origin_facility_id === facility.facility_id
      ? flow.dest_facility_id : flow.origin_facility_id;
    return facilityMap[otherId];
  }).filter(Boolean);

  const yieldPct = facility.conversion_rate
    ? +(facility.conversion_rate * 100).toFixed(0) : 0;
  const gaugeColor = yieldPct >= 80 ? '#3cb87a' : yieldPct >= 60 ? '#e08a3c' : '#c94040';
  const gaugeData = [{ name: 'Yield', value: yieldPct, fill: gaugeColor }];

  const totalOpex =
    (facility.opex_energy_M || 0) +
    (facility.opex_chemicals_M || 0) +
    (facility.opex_labor_M || 0);

  const opexPieData = [
    { name: 'Energy', value: +(facility.opex_energy_M || 0).toFixed(2) },
    { name: 'Chemicals', value: +(facility.opex_chemicals_M || 0).toFixed(2) },
    { name: 'Labor', value: +(facility.opex_labor_M || 0).toFixed(2) },
  ].filter(d => d.value > 0);

  const opexColors = ['#339af0', '#51cf66', '#fcc419'];

  const elementData = [
    { name: 'Nd', value: detail.element_Nd_pct || 0 },
    { name: 'Dy', value: detail.element_Dy_pct || 0 },
    { name: 'Pr', value: detail.element_Pr_pct || 0 },
    { name: 'La', value: detail.element_La_pct || 0 },
    { name: 'Ce', value: detail.element_Ce_pct || 0 },
    { name: 'Other', value: detail.element_other_pct || 0 },
  ].filter(e => e.value > 0);

  const throughputData = detail.throughput_potential_tons
    ? [
        { name: 'Potential', value: detail.throughput_potential_tons },
        { name: 'Processed', value: detail.processed_tonnage || 0 },
      ]
    : null;

  const envRating = facility.environmental_rating || detail.environmental_rating || null;

  // GeoJSON for flow arcs
  const flowsGeoJSON = useMemo(() => ({
    type: 'FeatureCollection',
    features: microFlows.map(flow => ({
      type: 'Feature',
      properties: {
        flow_id: flow.flow_id,
        color: flow.arcColor,
        isInbound: flow.dest_facility_id === facility.facility_id,
      },
      geometry: {
        type: 'LineString',
        coordinates: flowToArcPoints(flow),
      },
    })),
  }), [microFlows, facility.facility_id]);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Map with street-level detail */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--bg-map)' }}>
        <Map
          key={theme}
          initialViewState={{
            longitude: +facility.lng,
            latitude: +facility.lat,
            zoom: 13,
            pitch: 45,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={theme === 'light' ? LIGHT_STYLE : DARK_STYLE}
          attributionControl={false}
        >
          {/* Flow arc lines */}
          <Source id="micro-flows" type="geojson" data={flowsGeoJSON}>
            {microFlows.map(flow => (
              <Layer
                key={flow.flow_id}
                id={`mflow-${flow.flow_id}`}
                type="line"
                filter={['==', ['get', 'flow_id'], flow.flow_id]}
                paint={{
                  'line-color': flow.arcColor,
                  'line-width': 3,
                  'line-opacity': 0.6,
                  'line-dasharray': [3, 2],
                }}
              />
            ))}
          </Source>

          {/* Connected facility markers (smaller, dimmer) */}
          {connectedFacilities.map(f => (
            <Marker key={f.facility_id} longitude={+f.lng} latitude={+f.lat} anchor="center">
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                background: TYPE_COLORS[f.type] || '#8892aa',
                border: '2px solid var(--map-marker-border)', opacity: 0.7,
                boxShadow: `0 0 6px ${TYPE_COLORS[f.type] || '#8892aa'}33`,
              }} />
              <div style={{
                position: 'absolute', top: 18, left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap',
                textShadow: 'var(--map-text-shadow)',
                fontWeight: 600, pointerEvents: 'none',
              }}>
                {f.name.split(' ').slice(0, 2).join(' ')}
              </div>
            </Marker>
          ))}

          {/* Main facility marker (large, pulsing) */}
          <Marker longitude={+facility.lng} latitude={+facility.lat} anchor="center">
            <div style={{ position: 'relative', width: 32, height: 32 }}>
              {/* Pulse ring */}
              <div style={{
                position: 'absolute', inset: -6,
                borderRadius: '50%',
                border: `2px solid ${TYPE_COLORS[facility.type] || '#ff6b6b'}`,
                opacity: 0.4,
                animation: 'pulse-ring 2s ease-out infinite',
              }} />
              {/* Dot */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: TYPE_COLORS[facility.type] || '#ff6b6b',
                border: '3px solid #fff',
                boxShadow: `0 0 16px ${TYPE_COLORS[facility.type] || '#ff6b6b'}88`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#fff', fontWeight: 700,
              }}>
                {facility.type === 'recycling' ? '\u267b' :
                 facility.type === 'mine' ? '\u26cf' :
                 facility.type === 'processing' ? '\u2699' :
                 facility.sub_type === 'semiconductor' ? '\ud83d\udcbb' :
                 facility.sub_type === 'defense' ? '\ud83d\udee1' :
                 facility.sub_type === 'wind_turbine' ? '\ud83c\udf2c' :
                 facility.sub_type === 'medical' ? '\ud83c\udfe5' :
                 facility.sub_type === 'electronics' ? '\ud83d\udcf1' :
                 facility.sub_type === 'catalyst' ? '\u2697' :
                 facility.sub_type === 'glass_ceramics' ? '\ud83c\udf21' :
                 '\ud83c\udfed'}
              </div>
            </div>
          </Marker>
        </Map>

        {/* Location info card */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          background: 'var(--bg-glass)', borderRadius: 16,
          padding: '16px 20px', border: 'none', boxShadow: 'var(--shadow-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          color: 'var(--text-primary)', fontSize: 12, maxWidth: 320, zIndex: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: 14 }}>
              {facility.name}
            </div>
            {envRating && (
              <span className={`rating-badge rating-${envRating}`}>
                {envRating}
              </span>
            )}
          </div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
            {facility.city}, {facility.state}
          </div>
          <div style={{ marginBottom: 3 }}>
            <span style={{ color: 'var(--text-muted)' }}>Type: </span>
            <span style={{ textTransform: 'capitalize' }}>{facility.type?.replace('_', ' ')}</span>
            {facility.sub_type && (
              <span style={{
                background: 'rgba(255,107,107,0.12)', padding: '1px 6px', borderRadius: 8, fontSize: 10,
                color: '#ff6b6b', marginLeft: 6,
              }}>
                {facility.sub_type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          {facility.recycling_source && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ color: 'var(--text-muted)' }}>Source: </span>
              <span style={{
                background: 'var(--accent-bg)', padding: '1px 6px', borderRadius: 8, fontSize: 10,
                color: 'var(--accent)',
              }}>
                {SOURCE_LABELS[facility.recycling_source] || facility.recycling_source}
              </span>
            </div>
          )}
          {facility.technology && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ color: 'var(--text-muted)' }}>Technology: </span>
              <span style={{ fontSize: 11 }}>{facility.technology}</span>
            </div>
          )}
          {facility.federal_permit_status && (
            <div style={{ marginBottom: 3 }}>
              <span style={{ color: 'var(--text-muted)' }}>Federal Permit: </span>
              <span style={{
                color: facility.federal_permit_status === 'approved' ? '#3cb87a' : '#e08a3c',
                fontWeight: 600, textTransform: 'capitalize',
              }}>
                {facility.federal_permit_status}
              </span>
            </div>
          )}
          {facility.notes && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-heading)', borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
              {facility.notes}
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
            Est. {facility.year_established} &bull; Status: {facility.status}
            {facility.employees > 0 && <> &bull; {facility.employees} employees</>}
          </div>
        </div>

        {/* Connected flows legend */}
        {microFlows.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            background: 'var(--bg-glass)', borderRadius: 16,
            padding: '14px 18px', fontSize: 10, color: 'var(--text-primary)',
            border: 'none', boxShadow: 'var(--shadow-glass)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', zIndex: 10, maxWidth: 260,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-heading)', marginBottom: 6 }}>Connected Supply Chain</div>
            {microFlows.map(flow => {
              const isInbound = flow.dest_facility_id === facility.facility_id;
              const otherId = isInbound ? flow.origin_facility_id : flow.dest_facility_id;
              const otherFac = facilityMap[otherId];
              return (
                <div key={flow.flow_id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ color: isInbound ? '#51cf66' : '#ff6b6b', fontWeight: 700 }}>
                    {isInbound ? '\u2190' : '\u2192'}
                  </span>
                  <span style={{ flex: 1 }}>{otherFac?.name || otherId}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{(flow.tonnage / 1000).toFixed(1)}k t</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <div className="detail-drawer" style={{
        width: 360, background: 'var(--bg-panel)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', color: 'var(--text-primary)',
        padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
        borderLeft: 'none', overflowY: 'auto', flexShrink: 0,
      }}>
        {/* Header */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: 14 }}>
              {facility.city?.toUpperCase()} &mdash; {(facility.sub_type || facility.type)?.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div style={{ background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: 8, fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>
              {selectedYear || 2024}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {SOURCE_LABELS[facility.recycling_source] || facility.technology || 'Primary Operations'}
          </div>
        </div>

        {/* Yield Gauge */}
        {yieldPct > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              Overall Yield / Conversion Rate
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                <ResponsiveContainer width={80} height={80}>
                  <RadialBarChart
                    cx="50%" cy="50%"
                    innerRadius="60%" outerRadius="82%"
                    startAngle={180} endAngle={0}
                    data={gaugeData} barSize={10}
                  >
                    <RadialBar
                      dataKey="value" cornerRadius={5}
                      background={{ fill: theme === 'light' ? '#e0e0e0' : '#2d3548' }}
                      isAnimationActive={false}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute', bottom: 4, left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 15, fontWeight: 700, color: gaugeColor,
                }}>
                  {yieldPct}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: gaugeColor }}>
                  {yieldPct >= 80 ? 'Highly Efficient' : yieldPct >= 60 ? 'Moderate' : 'Low Yield'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                  Capacity: {Math.round((facility.capacity_tons || 0) * mult).toLocaleString()} t/yr
                </div>
                {detail.processed_tonnage != null && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                    Processed: {(detail.processed_tonnage || 0).toLocaleString()} t
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* OpEx Breakdown */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
            Operating Cost (OpEx) &mdash; ${totalOpex.toFixed(1)}M
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ResponsiveContainer width={90} height={90}>
              <PieChart>
                <Pie
                  data={opexPieData} cx="50%" cy="50%"
                  innerRadius={25} outerRadius={40}
                  dataKey="value" isAnimationActive={false}
                >
                  {opexPieData.map((_, i) => <Cell key={i} fill={opexColors[i]} />)}
                </Pie>
                <RTooltip
                  contentStyle={{ background: 'var(--chart-tooltip-bg)', border: 'none', borderRadius: 12, color: 'var(--text-primary)', fontSize: 10, boxShadow: 'var(--chart-tooltip-shadow)' }}
                  formatter={v => `$${v}M`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {opexPieData.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: opexColors[i], flexShrink: 0 }} />
                  <span style={{ fontSize: 10, flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: opexColors[i] }}>${d.value}M</span>
                </div>
              ))}
            </div>
          </div>
          {detail.energy_cost_per_ton != null && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginTop: 8 }}>
              {[
                { label: 'Energy', val: `$${detail.energy_cost_per_ton}/t`, color: '#4a9eff' },
                { label: 'Chemicals', val: `$${detail.chemical_cost_per_ton}/t`, color: '#3cb87a' },
                { label: 'Labor', val: `$${detail.labor_cost_per_ton}/t`, color: '#e08a3c' },
              ].map(m => (
                <div key={m.label} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{m.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Element Composition */}
        {elementData.length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              Element Composition of Recovered REE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie
                    data={elementData} cx="50%" cy="50%"
                    outerRadius={40} dataKey="value"
                    labelLine={false} isAnimationActive={false}
                  >
                    {elementData.map((_, i) => <Cell key={i} fill={ELEMENT_COLORS[i]} />)}
                  </Pie>
                  <RTooltip
                    contentStyle={{ background: 'var(--chart-tooltip-bg)', border: 'none', borderRadius: 12, color: 'var(--text-primary)', fontSize: 10, boxShadow: 'var(--chart-tooltip-shadow)' }}
                    formatter={v => `${v}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {elementData.map((el, i) => (
                  <div key={el.name} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: ELEMENT_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontSize: 10, flex: 1 }}>[{el.name}]</span>
                    <span style={{ fontSize: 10, color: ELEMENT_COLORS[i], fontWeight: 600 }}>{el.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Throughput vs Potential */}
        {throughputData && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: '16px 18px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
              Throughput vs. Potential Stock
            </div>
            <ResponsiveContainer width="100%" height={70}>
              <BarChart data={throughputData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-dimmer)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'var(--text-dimmer)', fontSize: 9 }} />
                <RTooltip
                  contentStyle={{ background: 'var(--chart-tooltip-bg)', border: 'none', borderRadius: 12, color: 'var(--text-primary)', fontSize: 10, boxShadow: 'var(--chart-tooltip-shadow)' }}
                  formatter={v => [`${(v || 0).toLocaleString()} tons`, 'Tons']}
                />
                <Bar dataKey="value" fill="#4a9eff" radius={[3, 3, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Environmental & Employment */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
            Environmental & Workforce
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'CO2/yr', value: facility.co2_annual_tons ? `${(facility.co2_annual_tons / 1000).toFixed(1)}k t` : 'N/A', color: '#fcc419' },
              { label: 'Water', value: facility.water_usage_mgal ? `${facility.water_usage_mgal} Mgal` : 'N/A', color: '#339af0' },
              { label: 'Employees', value: facility.employees ? facility.employees.toLocaleString() : 'N/A', color: '#da77f2' },
              { label: 'Env. Rating', value: envRating || 'N/A', color: envRating === 'A' ? '#51cf66' : envRating === 'B' ? '#a5d8ff' : '#fcc419' },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '4px 8px' }}>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)' }}>{m.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* External links */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>External Resources</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <a href="https://mrdata.usgs.gov/mrds/" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#74c0fc', textDecoration: 'none' }}>
              USGS Mineral Resources Data System &rarr;
            </a>
            <a href="https://www.usgs.gov/centers/national-minerals-information-center/rare-earths-statistics-and-information"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#74c0fc', textDecoration: 'none' }}>
              USGS Rare Earths Statistics &rarr;
            </a>
            <a href="https://www.energy.gov/cmm/critical-minerals-and-materials"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#74c0fc', textDecoration: 'none' }}>
              DOE Critical Minerals Program &rarr;
            </a>
          </div>
        </div>

        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          Data: Mock dataset for demonstration &bull; Future: USGS MRDS + DOE CMM integration
        </div>
      </div>
    </div>
  );
}
