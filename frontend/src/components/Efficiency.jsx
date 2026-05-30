import React from 'react';
import { healthColor, healthLabel } from '../utils/healthScore.js';
import Avatar from './Avatar.jsx';

function getRecommendations(member) {
  const { tasks = {}, healthScore = 65, trackedHours = 0 } = member;
  const { overdue = [], blockers = [], inProgress = [] } = tasks;
  const recs = [];

  if (overdue.length > 0) recs.push({ text: `Clear ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`, type: 'danger' });
  if (blockers.length > 0) recs.push({ text: `Resolve ${blockers.length} blocker${blockers.length > 1 ? 's' : ''}`, type: 'warn' });
  if (healthScore < 60) recs.push({ text: 'Urgent attention needed', type: 'danger' });
  if (inProgress.length > 4) recs.push({ text: `Reduce WIP — ${inProgress.length} tasks in flight`, type: 'warn' });
  if (trackedHours / 5 < 6) recs.push({ text: 'Check in on hours tracking', type: 'warn' });
  if (recs.length === 0) recs.push({ text: 'On track — no action needed', type: 'ok' });

  return recs;
}

function HealthBreakdown({ member }) {
  const { tasks = {}, trackedHours = 0 } = member;
  const { inProgress = [], done = [], overdue = [], blockers = [] } = tasks;

  const factors = [
    { label: 'Completed', value: done.length * 5, color: '#22c55e', max: 25 },
    { label: 'Overdue', value: -(overdue.length * 10), color: '#ef4444', max: 30, negative: true },
    { label: 'Blockers', value: -(blockers.length * 15), color: '#f59e0b', max: 30, negative: true },
    { label: 'WIP excess', value: -(Math.max(0, inProgress.length - 3) * 5), color: '#7F77DD', max: 20, negative: true },
  ];

  return (
    <div className="health-breakdown">
      {factors.map(f => {
        const displayVal = Math.abs(f.value);
        const pct = f.max > 0 ? Math.min((displayVal / f.max) * 100, 100) : 0;
        return (
          <div className="health-factor-row" key={f.label}>
            <span className="health-factor-label">{f.label}</span>
            <div className="health-factor-bar">
              <div className="health-factor-fill" style={{ width: `${pct}%`, background: f.color }} />
            </div>
            <span className="health-factor-val" style={{ color: f.negative && displayVal > 0 ? '#ef4444' : 'var(--text-muted)' }}>
              {f.negative && displayVal > 0 ? '-' : '+'}{displayVal}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Efficiency({ team }) {
  if (!team || team.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No data available.</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Efficiency & PM Recommendations</span>
        </div>
        {team.map(member => {
          const { tasks = {}, trackedHours = 0, healthScore = 65 } = member;
          const done = tasks.done || [];
          const efficiency = trackedHours > 0
            ? Math.round((done.length / trackedHours) * 10 * 10) / 10
            : 0;
          const hColor = healthColor(healthScore);
          const recs = getRecommendations(member);

          return (
            <div className="efficiency-row" key={member.id}>
              <div className="efficiency-member-header">
                <Avatar initials={member.initials} color={member.color} profilePicture={member.profilePicture} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.role}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: hColor }}>{healthScore}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{healthLabel(healthScore)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{efficiency}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>tasks/10h</div>
                  </div>
                </div>
              </div>

              <HealthBreakdown member={member} />

              <div className="recommendations">
                {recs.map((rec, i) => (
                  <span key={i} className={`recommendation-chip ${rec.type}`}>
                    {rec.type === 'danger' && '⚠ '}
                    {rec.type === 'warn' && '◎ '}
                    {rec.type === 'ok' && '✓ '}
                    {rec.text}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
