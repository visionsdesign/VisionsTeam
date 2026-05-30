import React from 'react';

const PRESETS = [
  { label: 'This week', value: 'this-week' },
  { label: 'Last week', value: 'last-week' },
  { label: 'Last 14 days', value: 'last-14' },
  { label: 'This month', value: 'this-month' },
];

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

export function getRangeForPreset(preset) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (preset === 'this-week') {
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: fmt(mon), to: fmt(sun) };
  }
  if (preset === 'last-week') {
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { from: fmt(mon), to: fmt(sun) };
  }
  if (preset === 'last-14') {
    const start = new Date(now);
    start.setDate(now.getDate() - 13);
    return { from: fmt(start), to: fmt(now) };
  }
  if (preset === 'this-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: fmt(start), to: fmt(end) };
  }
  return null;
}

export default function DateRangePicker({ from, to, preset, onChange }) {
  function handlePreset(value) {
    const range = getRangeForPreset(value);
    if (range) onChange({ ...range, preset: value });
  }

  function handleCustomFrom(e) {
    onChange({ from: e.target.value, to, preset: 'custom' });
  }

  function handleCustomTo(e) {
    onChange({ from, to: e.target.value, preset: 'custom' });
  }

  return (
    <div className="date-picker">
      <div className="date-presets">
        {PRESETS.map(p => (
          <button
            key={p.value}
            className={`preset-btn${preset === p.value ? ' active' : ''}`}
            onClick={() => handlePreset(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="date-inputs">
        <input
          type="date"
          className="date-input"
          value={from}
          max={to}
          onChange={handleCustomFrom}
        />
        <span className="date-sep">→</span>
        <input
          type="date"
          className="date-input"
          value={to}
          min={from}
          onChange={handleCustomTo}
        />
      </div>
    </div>
  );
}
