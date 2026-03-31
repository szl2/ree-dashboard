import React, { useState, useEffect } from 'react';
import { useCSVData } from './hooks/useCSVData';
import Sidebar from './components/Sidebar';
import Level1 from './components/Level1';
import Level2 from './components/Level2';
import Level3 from './components/Level3';
import './App.css';

export default function App() {
  const [level, setLevel] = useState(0);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [layers, setLayers] = useState({ demand: true, production: true, recycling: true, economic: true });
  const [facilityFilters, setFacilityFilters] = useState({});
  const [selectedYear, setSelectedYear] = useState(2024);
  const [theme, setTheme] = useState(() => localStorage.getItem('ree-theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ree-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const { data: statesData, loading: loadingStates } = useCSVData('states.csv');
  const { data: facilitiesData } = useCSVData('facilities.csv');
  const { data: flowsData } = useCSVData('flows.csv');
  const { data: timeseriesData } = useCSVData('state_timeseries.csv');
  const { data: opexDetail } = useCSVData('facility_opex_detail.csv');
  const { data: valueChainData } = useCSVData('value_chain.csv');
  const { data: importData } = useCSVData('import_sources.csv');

  const handleStateClick = (abbr) => {
    setSelectedState(abbr);
    setLevel(1);
  };

  const handleFacilityClick = (facility) => {
    setSelectedFacility(facility);
    setLevel(2);
  };

  const handleBack = () => {
    if (level === 2) {
      setLevel(1);
      setSelectedFacility(null);
    } else if (level === 1) {
      setLevel(0);
      setSelectedState(null);
    }
  };

  const handleBreadcrumb = (targetLevel) => {
    if (targetLevel < level) {
      if (targetLevel === 0) {
        setLevel(0);
        setSelectedState(null);
        setSelectedFacility(null);
      } else if (targetLevel === 1) {
        setLevel(1);
        setSelectedFacility(null);
      }
    }
  };

  const toggleLayer = (key) =>
    setLayers(l => ({ ...l, [key]: !l[key] }));
  const setAllLayers = (val) =>
    setLayers({ demand: val, production: val, recycling: val, economic: val });

  const toggleFacility = (key) =>
    setFacilityFilters(f => ({ ...f, [key]: f[key] === false ? true : false }));
  const setAllFacilities = (val) =>
    setFacilityFilters({ mine: val, processing: val, factory: val, recycling: val });

  const levelTitles = [
    'Global Value Stream Board (Level 1 - National View)',
    `State Level Drill-Down (Level 2 - ${selectedState || 'State'})`,
    `Facility Detail (Level 3 - ${selectedFacility?.name || 'Facility'})`,
  ];

  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-title">US Rare Earths Big Data Platform</div>
        <div className="topbar-subtitle">{levelTitles[level]}</div>
        <div className="topbar-year-display">
          <span className="year-label">Year:</span>
          <span className="year-value">{selectedYear}</span>
        </div>
        <div className="topbar-range">
          <span className="range-bound">2019</span>
          <input
            type="range"
            min={2019}
            max={2026}
            value={selectedYear}
            onChange={e => setSelectedYear(+e.target.value)}
            className="year-slider-top"
          />
          <span className="range-bound">2026</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '\u2600\ufe0f' : '\ud83c\udf19'}
        </button>
      </div>

      <div className="main-content">
        <Sidebar
          level={level}
          layers={layers}
          onToggleLayer={toggleLayer}
          onSetAllLayers={setAllLayers}
          facilityFilters={facilityFilters}
          onToggleFacility={toggleFacility}
          onSetAllFacilities={setAllFacilities}
          onBack={handleBack}
          onBreadcrumb={handleBreadcrumb}
          selectedState={selectedState}
          selectedFacility={selectedFacility}
        />

        {loadingStates && level === 0 ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#8892aa', fontSize: 14, gap: 10,
          }}>
            <div className="loading-spinner" />
            Loading REE data...
          </div>
        ) : (
          <>
            {level === 0 && (
              <Level1
                statesData={statesData}
                flowsData={flowsData}
                facilitiesData={facilitiesData}
                facilityFilters={facilityFilters}
                layers={layers}
                onStateClick={handleStateClick}
                selectedYear={selectedYear}
                valueChainData={valueChainData}
                importData={importData}
                timeseriesData={timeseriesData}
                theme={theme}
              />
            )}
            {level === 1 && (
              <Level2
                stateAbbr={selectedState}
                statesData={statesData}
                facilitiesData={facilitiesData}
                flowsData={flowsData}
                timeseriesData={timeseriesData}
                facilityFilters={facilityFilters}
                layers={layers}
                onFacilityClick={handleFacilityClick}
                selectedYear={selectedYear}
                theme={theme}
              />
            )}
            {level === 2 && (
              <Level3
                facility={selectedFacility}
                opexDetail={opexDetail}
                flowsData={flowsData}
                facilitiesData={facilitiesData}
                selectedYear={selectedYear}
                theme={theme}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
