import React, { useState } from 'react';
import MemberCard from './MemberCard.jsx';
import { healthColor } from '../utils/healthScore.js';

export default function Overview({ team }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!team || team.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No team data available.</p>;
  }

  const avgHealth = Math.round(team.reduce((s, m) => s + (m.healthScore || 65), 0) / team.length);
  const totalOverdue = team.reduce((s, m) => s + (m.tasks?.overdue?.length || 0), 0);
  const totalBlockers = team.reduce((s, m) => s + (m.tasks?.blockers?.length || 0), 0);
  const atRisk = team.filter(m => (m.healthScore || 65) < 60).length;

  const avgColor = healthColor(avgHealth);

  return (
    <div>
      <div className="summary-strip">
        <div className="summary-stat">
          <div className="stat-value" style={{ color: avgColor }}>{avgHealth}</div>
          <div className="stat-label">Avg Health Score</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value" style={{ color: totalOverdue > 0 ? '#ef4444' : 'var(--text)' }}>{totalOverdue}</div>
          <div className="stat-label">Overdue Tasks</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value" style={{ color: totalBlockers > 0 ? '#f59e0b' : 'var(--text)' }}>{totalBlockers}</div>
          <div className="stat-label">Blockers</div>
        </div>
        <div className="summary-stat">
          <div className="stat-value" style={{ color: atRisk > 0 ? '#ef4444' : 'var(--text)' }}>{atRisk}</div>
          <div className="stat-label">Members at Risk</div>
        </div>
      </div>

      <div className="grid-3">
        {team.map(member => (
          <MemberCard
            key={member.id}
            member={member}
            expanded={expandedId === member.id}
            onToggle={() => setExpandedId(expandedId === member.id ? null : member.id)}
          />
        ))}
      </div>
    </div>
  );
}
