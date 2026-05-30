import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth.js';
import { useTeamData } from './hooks/useTeamData.js';
import { useProjectData } from './hooks/useProjectData.js';
import LoginScreen from './components/LoginScreen.jsx';
import DateRangePicker, { getRangeForPreset } from './components/DateRangePicker.jsx';
import Overview from './components/Overview.jsx';
import Capacity from './components/Capacity.jsx';
import Efficiency from './components/Efficiency.jsx';
import WorkloadPlanning from './components/WorkloadPlanning.jsx';
import Projects from './components/Projects.jsx';
import Schedule from './components/Schedule.jsx';

const TABS = [
  { id: 'overview',   label: 'Overview' },
  { id: 'capacity',   label: 'Capacity' },
  { id: 'efficiency', label: 'Efficiency' },
  { id: 'workload',   label: 'Workload Planning' },
  { id: 'projects',   label: 'Projects' },
  { id: 'schedule',   label: 'Schedule' },
];

const DEFAULT_RANGE = { ...getRangeForPreset('this-week'), preset: 'this-week' };

function formatTime(date) {
  if (!date) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const { token, login, logout, error: authError, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);

  const { team, loading, error, refresh, lastRefresh } = useTeamData({
    from: dateRange.from,
    to: dateRange.to,
  });

  const { projects, loading: projectsLoading, error: projectsError } = useProjectData({
    from: dateRange.from,
    to: dateRange.to,
  });

  if (!token) {
    return <LoginScreen onLogin={login} error={authError} loading={authLoading} />;
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>Team Dashboard</h1>
        <div className="header-right">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            preset={dateRange.preset}
            onChange={setDateRange}
          />
          <div className="header-actions">
            {lastRefresh && (
              <span className="last-refresh">Updated {formatTime(lastRefresh)}</span>
            )}
            <button className="btn btn-accent" onClick={refresh} disabled={loading}>
              {loading ? '↻' : '↻ Refresh'}
            </button>
            <button className="btn btn-ghost" onClick={logout} title="Sign out">
              Sign out
            </button>
          </div>
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
          {activeTab === 'projects'   && (
            <Projects
              projects={projects}
              loading={projectsLoading}
              error={projectsError}
              dateRange={dateRange}
            />
          )}
          {activeTab === 'schedule'   && <Schedule team={team} />}
        </>
      )}
    </div>
  );
}
