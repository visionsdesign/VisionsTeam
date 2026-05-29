import { useState, useEffect, useCallback } from 'react';

function getWeekRange() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(sunday) };
}

export function useTeamData() {
  const [tasks, setTasks] = useState([]);
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { from, to } = getWeekRange();
    try {
      const [tasksRes, hoursRes] = await Promise.all([
        fetch(`/api/team-tasks?from=${from}&to=${to}`).then(r => r.json()),
        fetch(`/api/team-hours?from=${from}&to=${to}`).then(r => r.json()),
      ]);
      setTasks(tasksRes);
      setHours(hoursRes);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const mergedTeam = tasks.map(member => {
    const h = hours.find(h => h.id === member.id) || {};
    return { ...member, ...h };
  });

  return { team: mergedTeam, loading, error, refresh: fetchAll, lastRefresh };
}
