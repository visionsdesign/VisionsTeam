import React from 'react';
import { healthColor, healthLabel } from '../utils/healthScore.js';

const STATUS_COLORS = {
  'in progress': '#7F77DD',
  'to do': '#94a3b8',
  'complete': '#22c55e',
  'blocked': '#ef4444',
};

function TaskGroup({ title, tasks, dotColor }) {
  if (!tasks || tasks.length === 0) return null;
  return (
    <div className="task-group">
      <div className="task-group-title">{title} ({tasks.length})</div>
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className="task-item">
            <span className="task-dot" style={{ background: dotColor }} />
            {task.url && task.url !== '#' ? (
              <a href={task.url} target="_blank" rel="noopener noreferrer">{task.name}</a>
            ) : (
              task.name
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MemberCard({ member, expanded, onToggle }) {
  const { name, role, initials, color, tasks = {}, healthScore = 65 } = member;
  const { inProgress = [], upcoming = [], done = [], overdue = [], blockers = [] } = tasks;
  const hColor = healthColor(healthScore);
  const hLabel = healthLabel(healthScore);

  return (
    <div className="member-card">
      <div className="member-card-header" onClick={onToggle}>
        <div className="avatar" style={{ background: color }}>{initials}</div>
        <div className="member-card-info">
          <div className="name">{name}</div>
          <div className="role">{role}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span className="badge" style={{ background: hColor + '22', color: hColor, border: `1px solid ${hColor}44` }}>
            {healthScore} · {hLabel}
          </span>
        </div>
        <span className={`expand-chevron${expanded ? ' open' : ''}`}>▼</span>
      </div>

      <div className="task-pills">
        {inProgress.length > 0 && (
          <span className="badge-pill" style={{ color: '#7F77DD', borderColor: '#7F77DD44' }}>
            ◎ {inProgress.length} in progress
          </span>
        )}
        {overdue.length > 0 && (
          <span className="badge-pill" style={{ color: '#ef4444', borderColor: '#ef444444' }}>
            ⚠ {overdue.length} overdue
          </span>
        )}
        {blockers.length > 0 && (
          <span className="badge-pill" style={{ color: '#f59e0b', borderColor: '#f59e0b44' }}>
            ✕ {blockers.length} blocked
          </span>
        )}
        {done.length > 0 && (
          <span className="badge-pill" style={{ color: '#22c55e', borderColor: '#22c55e44' }}>
            ✓ {done.length} done
          </span>
        )}
        {upcoming.length > 0 && (
          <span className="badge-pill">
            → {upcoming.length} upcoming
          </span>
        )}
      </div>

      {expanded && (
        <div className="member-card-expand">
          <TaskGroup title="In Progress" tasks={inProgress} dotColor="#7F77DD" />
          <TaskGroup title="Overdue" tasks={overdue} dotColor="#ef4444" />
          <TaskGroup title="Blockers" tasks={blockers} dotColor="#f59e0b" />
          <TaskGroup title="Upcoming" tasks={upcoming} dotColor="#94a3b8" />
          <TaskGroup title="Completed This Week" tasks={done} dotColor="#22c55e" />
          {inProgress.length === 0 && overdue.length === 0 && blockers.length === 0 && upcoming.length === 0 && done.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No tasks tracked this week.</p>
          )}
        </div>
      )}
    </div>
  );
}
