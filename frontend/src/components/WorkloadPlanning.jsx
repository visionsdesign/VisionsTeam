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

  // Project involvement matrix: group by folder (ClickUp project), not individual list
  const allFolders = new Set();
  team.forEach(m => {
    const allTasks = [
      ...(m.tasks?.inProgress || []),
      ...(m.tasks?.upcoming || []),
      ...(m.tasks?.done || []),
      ...(m.tasks?.overdue || []),
      ...(m.tasks?.blockers || []),
    ];
    allTasks.forEach(t => {
      if (t.folder && t.folder !== 'Mock List' && t.folder !== 'hidden') allFolders.add(t.folder);
    });
  });

  // Fallback: use mock project names if no real data
  // Rank folders by total tasks across team; keep only those with multi-member involvement
  let projects;
  if (allFolders.size > 0) {
    const folderTotals = {};
    const folderMembers = {};
    team.forEach(m => {
      const allTasks = [
        ...(m.tasks?.inProgress || []),
        ...(m.tasks?.upcoming || []),
        ...(m.tasks?.done || []),
        ...(m.tasks?.overdue || []),
        ...(m.tasks?.blockers || []),
      ];
      allTasks.forEach(t => {
        if (!t.folder || t.folder === 'Mock List') return;
        folderTotals[t.folder] = (folderTotals[t.folder] || 0) + 1;
        folderMembers[t.folder] = folderMembers[t.folder] || new Set();
        folderMembers[t.folder].add(m.id);
      });
    });
    projects = [...allFolders]
      .filter(f => (folderMembers[f]?.size || 0) >= 2)
      .sort((a, b) => (folderTotals[b] || 0) - (folderTotals[a] || 0))
      .slice(0, 12);
    // If fewer than 3 multi-member folders, fall back to top folders by task count
    if (projects.length < 3) {
      projects = [...allFolders]
        .sort((a, b) => (folderTotals[b] || 0) - (folderTotals[a] || 0))
        .slice(0, 10);
    }
  } else {
    projects = ['Sprint Board', 'Marketing', 'Dev Tasks', 'Design', 'Client Projects', 'Operations'];
  }

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
      counts[p] = allTasks.filter(t => t.folder === p).length;
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
