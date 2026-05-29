import React from 'react';
import { getCapacityStatus } from '../utils/capacityStatus.js';

export default function HoursBar({ member }) {
  const {
    initials,
    color,
    name,
    role,
    trackedHours = 0,
    targetHours = 40,
    percentOfTarget = 0,
  } = member;

  const status = getCapacityStatus(percentOfTarget);
  const fillWidth = Math.min(percentOfTarget, 130);

  return (
    <div className="hours-bar-row">
      <div className="hours-bar-member">
        <div className="avatar" style={{ background: color }}>{initials}</div>
        <div>
          <div className="member-name">{name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{role}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="progress-bar thick">
          <div
            className="progress-bar-fill"
            style={{ width: `${fillWidth}%`, background: status.color }}
          />
        </div>
        {percentOfTarget > 100 && (
          <div
            style={{
              width: `${Math.min((percentOfTarget - 100) * 0.5, 20)}px`,
              height: 12,
              background: '#ef444466',
              borderRadius: 50,
              flexShrink: 0,
            }}
          />
        )}
      </div>

      <div className="hours-label">
        {trackedHours}h / {targetHours}h
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{percentOfTarget}%</div>
      </div>

      <div className="hours-status">
        <span
          className="badge"
          style={{
            background: status.color + '22',
            color: status.color,
            border: `1px solid ${status.color}44`,
          }}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}
