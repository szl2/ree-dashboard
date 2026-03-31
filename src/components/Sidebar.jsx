import React from 'react';

const LAYER_CONFIG = [
  { key: 'demand', label: 'Demand', color: '#ff6b6b' },
  { key: 'production', label: 'Production', color: '#339af0' },
  { key: 'recycling', label: 'Recycling', color: '#51cf66' },
  { key: 'economic', label: 'Economic', color: '#fcc419' },
];

const FACILITY_TYPES = [
  { key: 'mine', label: 'Mines', color: '#339af0' },
  { key: 'processing', label: 'Processing', color: '#74c0fc' },
  { key: 'factory', label: 'Factories', color: '#ff6b6b' },
  { key: 'recycling', label: 'Recycling', color: '#51cf66' },
];

export default function Sidebar({
  level, layers, onToggleLayer, onSetAllLayers,
  facilityFilters, onToggleFacility, onSetAllFacilities,
  onBack, onBreadcrumb, selectedState, selectedFacility,
}) {
  const allLayersOn = LAYER_CONFIG.every(l => layers[l.key] !== false);
  const allFacilitiesOn = FACILITY_TYPES.every(f => facilityFilters[f.key] !== false);
  const breadcrumbs = [
    { label: 'Country', level: 0 },
    ...(level >= 1 ? [{ label: selectedState || 'State', level: 1 }] : []),
    ...(level >= 2 ? [{ label: selectedFacility?.name?.split(' ')[0] || 'Facility', level: 2 }] : []),
  ];

  return (
    <div className="sidebar">
      {/* Map Layers */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Map Layers</div>
          <span
            className="select-all-btn"
            onClick={() => onSetAllLayers(!allLayersOn)}
          >
            {allLayersOn ? 'None' : 'All'}
          </span>
        </div>
        {LAYER_CONFIG.map(l => (
          <label key={l.key} className="toggle-row">
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                checked={layers[l.key] !== false}
                onChange={() => onToggleLayer(l.key)}
              />
              <span className="toggle-dot" style={{ background: layers[l.key] !== false ? l.color : 'var(--bg-toggle-off)' }} />
            </div>
            <span>{l.label}</span>
          </label>
        ))}
      </section>

      {/* Drill-Down Level breadcrumb */}
      <section>
        <div className="section-title">Drill-Down Level</div>
        <div className="breadcrumb-trail">
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={b.level}>
              {i > 0 && <span className="breadcrumb-sep">&rsaquo;</span>}
              <span
                className={`breadcrumb-item${b.level === level ? ' active' : ''}`}
                onClick={() => onBreadcrumb(b.level)}
              >
                {b.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Facility Types */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="section-title" style={{ marginBottom: 0 }}>Facility Types</div>
          <span
            className="select-all-btn"
            onClick={() => onSetAllFacilities(!allFacilitiesOn)}
          >
            {allFacilitiesOn ? 'None' : 'All'}
          </span>
        </div>
        {FACILITY_TYPES.map(f => (
          <label key={f.key} className="toggle-row">
            <div className="toggle-switch-container">
              <input
                type="checkbox"
                checked={facilityFilters[f.key] !== false}
                onChange={() => onToggleFacility(f.key)}
              />
              <span className="toggle-dot" style={{ background: facilityFilters[f.key] !== false ? f.color : 'var(--bg-toggle-off)' }} />
            </div>
            <span>{f.label}</span>
          </label>
        ))}
      </section>

      {level > 0 && (
        <button className="back-btn" onClick={onBack}>
          &larr; Back
        </button>
      )}
    </div>
  );
}
