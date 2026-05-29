import React, { useState } from 'react';
import { useTeamData } from './hooks/useTeamData.js';
import Overview from './components/Overview.jsx';
import Capacity from './components/Capacity.jsx';
import Efficiency from './components/Efficiency.jsx';
import WorkloadPlanning from './components/WorkloadPlanning.jsx';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'capacity',  label: 'Capacity' },
  { id: 'efficiency', label: 'Efficiency' },
  { id: 'workload',  label: 'Workload Planning' },
];

function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const { team, loading, error, refresh, lastRefresh } = useTeamData();

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Team Dashboard</h1>
        <div className="header-meta">
          {lastRefresh && <span>Last updated {formatTime(lastRefresh)}</span>}
          <button className="btn btn-accent" onClick={refresh} disabled={loading}>
            {loading ? '↻ Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {loading && (
        <div className="loading-screen">
          <div className="spinner" />
          <span>Loading team data…</span>
        </div>
      )}

      {!loading && error && (
        <div className="error-screen">
          <div style={{ fontSize: '2rem' }}>⚠</div>
          <div style={{ fontWeight: 600 }}>Failed to load data</div>
          <div style={{ fontSize: '0.85rem', maxWidth: 400, textAlign: 'center' }}>{error}</div>
          <button className="btn btn-accent" onClick={refresh}>Try again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {activeTab === 'overview'   && <Overview team={team} />}
          {activeTab === 'capacity'   && <Capacity team={team} />}
          {activeTab === 'efficiency' && <Efficiency team={team} />}
          {activeTab === 'workload'   && <WorkloadPlanning team={team} />}
        </>
      )}
    </div>
  );
}
