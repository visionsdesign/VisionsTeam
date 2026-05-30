import React, { useMemo } from 'react';
import Avatar from './Avatar.jsx';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TASK_H = 26;
const LANE_GAP = 4;
const ROW_PAD = 10;
const MIN_ROW_H = 56;
const MEMBER_COL_W = 190;

function getWeekDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function toMidnight(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d) ? null : d;
}

function dayIndex(date, weekStart) {
  return Math.round((date - weekStart) / 86400000);
}

function packLanes(tasks) {
  const sorted = [...tasks].sort((a, b) => a.startIdx - b.startIdx || a.endIdx - b.endIdx);
  const laneEnds = [];
  return sorted.map(task => {
    let lane = laneEnds.findIndex(end => end < task.startIdx);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = task.endIdx;
    return { ...task, lane };
  });
}

function TaskBar({ task }) {
  const left = `${(task.startIdx / 7) * 100}%`;
  const width = `${((task.endIdx - task.startIdx + 1) / 7) * 100}%`;
  const top = ROW_PAD + task.lane * (TASK_H + LANE_GAP);

  const categoryColor = {
    inProgress: task.color,
    upcoming:   task.color,
    overdue:    '#ef4444',
    blockers:   '#f59e0b',
  }[task.category] || task.color;

  const alpha = task.category === 'upcoming' ? 'aa' : 'ee';

  return (
    <a
      href={task.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${task.name}${task.folder ? ` · ${task.folder}` : ''}`}
      style={{
        position: 'absolute',
        left, width, top,
        height: TASK_H,
        background: categoryColor + alpha,
        border: `1px solid ${categoryColor}`,
        borderRadius: 5,
        padding: '0 7px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        textDecoration: 'none',
        cursor: 'pointer',
        boxSizing: 'border-box',
        zIndex: 1,
      }}
    >
      <span style={{
        fontSize: '0.71rem', fontWeight: 600, color: '#fff',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
      }}>
        {task.name}
      </span>
      {task.folder && (
        <span style={{
          fontSize: '0.63rem', color: 'rgba(255,255,255,0.7)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
        }}>
          {task.folder}
        </span>
      )}
    </a>
  );
}

export default function Schedule({ team }) {
  const weekDays = useMemo(() => getWeekDays(), []);
  const weekStart = weekDays[0];

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayIdx = weekDays.findIndex(d => d.getTime() === today.getTime());

  const rows = useMemo(() => {
    if (!team) return [];
    return team.map(member => {
      const categories = ['inProgress', 'upcoming', 'overdue', 'blockers'];
      const allTasks = categories.flatMap(cat =>
        (member.tasks?.[cat] || []).map(t => ({ ...t, category: cat, color: member.color }))
      );

      const positioned = allTasks
        .map(task => {
          const start = toMidnight(task.start_date) || toMidnight(task.due_date);
          const end   = toMidnight(task.due_date)   || start;
          if (!start) return null;

          const si = dayIndex(start, weekStart);
          const ei = dayIndex(end,   weekStart);

          // Skip if fully outside the week
          if (ei < 0 || si > 6) return null;

          return {
            ...task,
            startIdx: Math.max(0, si),
            endIdx:   Math.min(6, ei),
          };
        })
        .filter(Boolean);

      const packed = packLanes(positioned);
      const laneCount = packed.length > 0 ? Math.max(...packed.map(t => t.lane)) + 1 : 0;
      const rowHeight = Math.max(MIN_ROW_H, ROW_PAD * 2 + laneCount * (TASK_H + LANE_GAP) - LANE_GAP);

      return { ...member, packed, rowHeight };
    });
  }, [team, weekStart]);

  if (!team || team.length === 0) return null;

  const monthLabel = weekDays[0].toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

      {/* Month label + legend */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{monthLabel}</span>
        <div style={{ display: 'flex', gap: 14, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {[
            { label: 'In Progress', color: 'var(--accent)' },
            { label: 'Upcoming',    color: '#94a3b8' },
            { label: 'Overdue',     color: '#ef4444' },
            { label: 'Blocked',     color: '#f59e0b' },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: MEMBER_COL_W, minWidth: MEMBER_COL_W }} />
        {weekDays.map((day, i) => {
          const isToday = i === todayIdx;
          return (
            <div key={i} style={{
              flex: 1,
              padding: '8px 4px',
              textAlign: 'center',
              borderLeft: '1px solid var(--border)',
              background: isToday ? 'var(--accent-dim)' : 'transparent',
            }}>
              <div style={{
                fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: isToday ? 700 : 400,
              }}>
                {DAY_LABELS[i]}
              </div>
              <div style={{
                fontSize: '1rem', fontWeight: isToday ? 700 : 400,
                color: isToday ? 'var(--accent)' : 'var(--text)',
              }}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Member rows */}
      {rows.map((member, mi) => (
        <div key={member.id} style={{
          display: 'flex',
          borderBottom: mi < rows.length - 1 ? '1px solid var(--border)' : 'none',
          minHeight: member.rowHeight,
        }}>
          {/* Member info */}
          <div style={{
            width: MEMBER_COL_W, minWidth: MEMBER_COL_W,
            padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            borderRight: '1px solid var(--border)',
          }}>
            <Avatar
              initials={member.initials}
              color={member.color}
              profilePicture={member.profilePicture}
              size={34}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                {member.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.role}</div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
            {/* Day column stripes */}
            {weekDays.map((_, i) => (
              <div key={i} style={{
                flex: 1,
                background: i === todayIdx
                  ? 'var(--accent-dim)'
                  : i >= 5 ? 'rgba(255,255,255,0.015)' : 'transparent',
                borderLeft: '1px solid var(--border)',
              }} />
            ))}
            {/* Task bars */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {member.packed.map(task => (
                  <div key={task.id} style={{ pointerEvents: 'all' }}>
                    <TaskBar task={task} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
