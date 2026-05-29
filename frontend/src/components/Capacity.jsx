import React from 'react';
import HoursBar from './HoursBar.jsx';
import { getCapacityStatus } from '../utils/capacityStatus.js';

export default function Capacity({ team }) {
  if (!team || team.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No hours data available.</p>;
  }

  const sorted = [...team].sort((a, b) => (b.percentOfTarget || 0) - (a.percentOfTarget || 0));

  const totalTracked = team.reduce((s, m) => s + (m.trackedHours || 0), 0);
  const totalTarget = team.length * 40;
  const totalPercent = Math.round((totalTracked / totalTarget) * 100);

  const dist = { 'under-utilised': 0, 'on-track': 0, 'high-load': 0, 'over-capacity': 0 };
  team.forEach(m => {
    const key = m.capacityStatus || getCapacityStatus(m.percentOfTarget || 0).label.toLowerCase().replace(' ', '-');
    if (dist[key] !== undefined) dist[key]++;
    else {
      const s = getCapacityStatus(m.percentOfTarget || 0);
      const k = s.label.toLowerCase().replace(/\s+/g, '-');
      if (dist[k] !== undefined) dist[k]++;
    }
  });

  const distItems = [
    { key: 'under-utilised', label: 'Under-utilised', color: '#6b7280' },
    { key: 'on-track',        label: 'On Track',       color: '#22c55e' },
    { key: 'high-load',       label: 'High Load',      color: '#f59e0b' },
    { key: 'over-capacity',   label: 'Over Capacity',  color: '#ef4444' },
  ];

  const teamTotalColor = getCapacityStatus(totalPercent).color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Team totals */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Team Hours This Week</span>
          <span className="badge" style={{ background: teamTotalColor + '22', color: teamTotalColor, border: `1px solid ${teamTotalColor}44` }}>
            {totalPercent}% of target
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div className="progress-bar thick" style={{ flex: 1 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(totalPercent, 100)}%`, background: teamTotalColor }}
            />
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {Math.round(totalTracked * 10) / 10}h / {totalTarget}h
          </span>
        </div>

        <div className="capacity-dist">
          {distItems.map(item => (
            <div className="capacity-dist-item" key={item.key}>
              <div className="count" style={{ color: item.color }}>{dist[item.key]}</div>
              <div className="label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-member bars */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Individual Capacity</span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sorted by utilisation ↓</span>
        </div>
        {sorted.map(member => (
          <HoursBar key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
