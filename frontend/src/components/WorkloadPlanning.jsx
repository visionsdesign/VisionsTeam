import React from 'react';
import { healthColor } from '../utils/healthScore.js';
import { getCapacityStatus } from '../utils/capacityStatus.js';

export default function WorkloadPlanning({ team }) {
  if (!team || team.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No data available.</p>;
  }

  // Remaining capacity
  const withRemaining = team.map(m => ({
    ...m,
    remainingHours: Math.max(0, (m.targetHours || 40) - (m.trackedHours || 0)),
  }));

  const sortedByCapacity = [...withRemaining].sort((a, b) => b.remainingHours - a.remainingHours);

  // Best to assign: composite score
  const sortedByScore = [...withRemaining].map(m => ({
    ...m,
    assignScore: Math.round(
      (m.healthScore || 65) * 0.4 +
      (m.remainingHours / (m.targetHours || 40)) * 60
    ),
  })).sort((a, b) => b.assignScore - a.assignScore);

  // Project involvement matrix: collect unique list names from tasks
  const allLists = new Set();
  team.forEach(m => {
    const allTasks = [
      ...(m.tasks?.inProgress || []),
      ...(m.tasks?.upcoming || []),
      ...(m.tasks?.done || []),
      ...(m.tasks?.overdue || []),
      ...(m.tasks?.blockers || []),
    ];
    allTasks.forEach(t => { if (t.list && t.list !== 'Mock List') allLists.add(t.list); });
  });

  // Fallback: use mock list names if no real lists
  const projects = allLists.size > 0
    ? [...allLists]
    : ['Sprint Board', 'Marketing', 'Dev Tasks', 'Design', 'Client Projects', 'Operations'];

  const matrixData = team.map(m => {
    const allTasks = [
      ...(m.tasks?.inProgress || []),
      ...(m.tasks?.upcoming || []),
      ...(m.tasks?.done || []),
      ...(m.tasks?.overdue || []),
      ...(m.tasks?.blockers || []),
    ];
    const counts = {};
    projects.forEach(p => {
      counts[p] = allTasks.filter(t => t.list === p).length;
    });
    return { ...m, counts };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="grid-2">
        {/* Remaining capacity */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>Remaining Capacity This Week</div>
          <div className="ranked-list">
            {sortedByCapacity.map((m, i) => {
              const status = getCapacityStatus(m.percentOfTarget || 0);
              return (
                <div className="ranked-item" key={m.id}>
                  <div className="rank-badge">{i + 1}</div>
                  <div className="avatar" style={{ background: m.color }}>{m.initials}</div>
                  <div className="ranked-item-info">
                    <div className="ranked-item-name">{m.name}</div>
                    <div className="ranked-item-sub">{m.role}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {Math.round(m.remainingHours * 10) / 10}h
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>remaining</div>
                  </div>
                  <span
                    className="badge"
                    style={{ background: status.color + '22', color: status.color, border: `1px solid ${status.color}44` }}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Best to assign */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 4 }}>Best to Assign</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Ranked by health (40%) + remaining capacity (60%)
          </div>
          <div className="ranked-list">
            {sortedByScore.map((m, i) => {
              const hColor = healthColor(m.healthScore || 65);
              return (
                <div className="ranked-item" key={m.id}>
                  <div className="rank-badge">{i + 1}</div>
                  <div className="avatar" style={{ background: m.color }}>{m.initials}</div>
                  <div className="ranked-item-info">
                    <div className="ranked-item-name">{m.name}</div>
                    <div className="ranked-item-sub">{m.role} · {Math.round(m.remainingHours * 10) / 10}h free</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: hColor }}>
                      {m.assignScore}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>score</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Project involvement matrix */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 14 }}>Project Involvement Matrix</div>
        <div className="matrix-wrap">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Member</th>
                {projects.map(p => <th key={p}>{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrixData.map(m => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ background: m.color, width: 24, height: 24, fontSize: '0.65rem' }}>{m.initials}</div>
                      {m.name}
                    </div>
                  </td>
                  {projects.map(p => (
                    <td
                      key={p}
                      className={m.counts[p] > 0 ? 'matrix-cell-active' : 'matrix-cell-zero'}
                    >
                      {m.counts[p] > 0 ? m.counts[p] : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
