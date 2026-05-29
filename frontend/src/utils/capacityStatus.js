export const WEEKLY_TARGET_HOURS = 40;

export function getCapacityStatus(percentOfTarget) {
  if (percentOfTarget < 60) return { label: 'Under-utilised', color: '#6b7280' };
  if (percentOfTarget <= 100) return { label: 'On Track', color: '#22c55e' };
  if (percentOfTarget <= 120) return { label: 'High Load', color: '#f59e0b' };
  return { label: 'Over Capacity', color: '#ef4444' };
}
