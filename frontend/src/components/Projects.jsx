import React, { useState } from 'react';
import AvatarBase from './Avatar.jsx';

function Avatar({ initials, color, size = 28, profilePicture }) {
  return (
    <AvatarBase
      initials={initials}
      color={color}
      profilePicture={profilePicture}
      size={size}
    />
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: color + '18', border: `1px solid ${color}33`,
      borderRadius: 8, padding: '8px 14px', gap: 2, minWidth: 64,
    }}>
      <span style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
    </div>
  );
}

function CompletionBar({ rate, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        flex: 1, height: 6, borderRadius: 3,
        background: 'var(--border)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${rate}%`, height: '100%', borderRadius: 3,
          background: color, transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 600, color, minWidth: 36, textAlign: 'right' }}>
        {rate}%
      </span>
    </div>
  );
}

function HoursSection({ hours, dateLabel }) {
  if (!hours || hours.totalHours === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: 8 }}>
        No hours tracked in this period
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
          {hours.totalHours}h
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{dateLabel}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {hours.members.map(m => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar initials={m.initials} color={m.color} size={24} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: 110, flexShrink: 0 }}>
              {m.name.split(' ')[0]}
            </span>
            <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${m.percent}%`, height: '100%', borderRadius: 3, background: m.color }} />
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, width: 38, textAlign: 'right' }}>
              {m.hours}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemberTaskRow({ m }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Avatar initials={m.initials} color={m.color} size={26} />
      <span style={{ fontSize: '0.82rem', color: 'var(--text)', flex: 1 }}>
        {m.name.split(' ')[0]}
      </span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {m.complete}/{m.total}
      </span>
      <div style={{ width: 60, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${m.completionRate}%`, height: '100%', background: m.color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: m.color, width: 32, textAlign: 'right', fontWeight: 600 }}>
        {m.completionRate}%
      </span>
    </div>
  );
}

function ActiveTaskRow({ task }) {
  const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
  return (
    <a
      href={task.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 10px', borderRadius: 6,
        background: 'var(--surface2)', textDecoration: 'none',
        border: '1px solid var(--border)',
      }}
    >
      <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: task.statusColor || '#6b7280', flexShrink: 0,
      }} />
      <span style={{ fontSize: '0.82rem', color: 'var(--text)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.name}
      </span>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
        {task.list}
      </span>
      {isOverdue && (
        <span style={{ fontSize: '0.68rem', color: '#ef4444', fontWeight: 600, flexShrink: 0 }}>OVERDUE</span>
      )}
      {task.assignees.length > 0 && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>
          {task.assignees[0].split(' ')[0]}
        </span>
      )}
    </a>
  );
}

function EfficiencyMetrics({ hours, tasks }) {
  const hoursPerTask = tasks.complete > 0 && hours.totalHours > 0
    ? Math.round((hours.totalHours / tasks.complete) * 10) / 10
    : null;

  const overdueRate = tasks.total > 0 ? Math.round((tasks.overdue / tasks.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {hoursPerTask !== null && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>h / completed task</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{hoursPerTask}h</div>
        </div>
      )}
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>overdue rate</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: overdueRate > 10 ? '#ef4444' : 'var(--text)' }}>
          {overdueRate}%
        </div>
      </div>
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>active tasks</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{tasks.inProgress + tasks.toDo}</div>
      </div>
    </div>
  );
}

function ProjectCard({ project, dateLabel }) {
  const [showAllTasks, setShowAllTasks] = useState(false);
  const { hours, tasks, color, name } = project;
  const visibleTasks = showAllTasks ? tasks.activeTasks : tasks.activeTasks.slice(0, 4);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 4, height: 40, borderRadius: 2, background: color, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>{name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {tasks.total} tasks · {tasks.complete} complete
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px',
            borderRadius: 20, background: color + '20', color,
            border: `1px solid ${color}44`,
          }}>
            {tasks.completionRate}% done
          </span>
          {tasks.overdue > 0 && (
            <span style={{
              fontSize: '0.78rem', fontWeight: 600, padding: '3px 10px',
              borderRadius: 20, background: '#ef444420', color: '#ef4444',
              border: '1px solid #ef444444',
            }}>
              {tasks.overdue} overdue
            </span>
          )}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Hours */}
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            Hours Tracked
          </div>
          <HoursSection hours={hours} dateLabel={dateLabel} />
        </div>

        {/* Task health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Task Breakdown
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatPill label="Total" value={tasks.total} color="var(--text-muted)" />
            <StatPill label="Done" value={tasks.complete} color="#22c55e" />
            <StatPill label="Active" value={tasks.inProgress} color="#f59e0b" />
            {tasks.overdue > 0 && <StatPill label="Overdue" value={tasks.overdue} color="#ef4444" />}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Completion rate</div>
            <CompletionBar rate={tasks.completionRate} color={color} />
          </div>
        </div>
      </div>

      {/* Efficiency metrics */}
      <div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Efficiency
        </div>
        <EfficiencyMetrics hours={hours} tasks={tasks} />
      </div>

      {/* Member task involvement */}
      {tasks.memberTasks.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Team Involvement
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.memberTasks.slice(0, 5).map(m => (
              <MemberTaskRow key={m.name} m={m} />
            ))}
          </div>
        </div>
      )}

      {/* Active tasks */}
      {tasks.activeTasks.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Open Tasks
            </div>
            {tasks.activeTasks.length > 4 && (
              <button
                onClick={() => setShowAllTasks(v => !v)}
                style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showAllTasks ? 'Show less' : `Show all ${tasks.activeTasks.length}`}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {visibleTasks.map(t => (
              <ActiveTaskRow key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Projects({ projects, loading, error, dateRange }) {
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading project data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div style={{ fontSize: '2rem' }}>⚠</div>
        <div style={{ fontWeight: 600 }}>Failed to load projects</div>
        <div style={{ fontSize: '0.85rem' }}>{error}</div>
      </div>
    );
  }

  if (!projects || projects.length === 0) return null;

  const totalHours = projects.reduce((s, p) => s + (p.hours?.totalHours || 0), 0);
  const totalTasks = projects.reduce((s, p) => s + (p.tasks?.total || 0), 0);
  const totalComplete = projects.reduce((s, p) => s + (p.tasks?.complete || 0), 0);
  const overallRate = totalTasks > 0 ? Math.round((totalComplete / totalTasks) * 100) : 0;

  const dateLabel = dateRange?.preset === 'this-week' ? 'this week'
    : dateRange?.preset === 'last-week' ? 'last week'
    : dateRange?.preset === 'last-30' ? 'last 30 days'
    : `${dateRange?.from} – ${dateRange?.to}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary bar */}
      <div className="card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Projects</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{projects.length}</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Hours ({dateLabel})</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{Math.round(totalHours * 10) / 10}h</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Tasks</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{totalTasks}</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Overall Completion</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: overallRate >= 80 ? '#22c55e' : overallRate >= 50 ? '#f59e0b' : '#ef4444' }}>
            {overallRate}%
          </div>
        </div>
      </div>

      {/* Project cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: 20 }}>
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} dateLabel={dateLabel} />
        ))}
      </div>
    </div>
  );
}
