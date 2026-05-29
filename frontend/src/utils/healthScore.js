export function calcHealth({ inProgress, done, overdue, blockers }) {
  let score = 65;
  score -= (overdue?.length || 0) * 10;
  score -= (blockers?.length || 0) * 15;
  score += (done?.length || 0) * 5;
  score -= Math.max(0, (inProgress?.length || 0) - 3) * 5;
  return Math.max(0, Math.min(100, score));
}

export function healthColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export function healthLabel(score) {
  if (score >= 80) return 'Healthy';
  if (score >= 60) return 'At Risk';
  return 'Critical';
}
