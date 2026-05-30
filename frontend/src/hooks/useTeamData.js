import { useState, useEffect, useCallback } from 'react';

export function useTeamData({ from, to }) {
  const [tasks, setTasks] = useState([]);
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
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
  }, [from, to]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const mergedTeam = tasks.map(member => {
    const h = hours.find(h => h.id === member.id) || {};
    return { ...member, ...h };
  });

  return { team: mergedTeam, loading, error, refresh: fetchAll, lastRefresh };
}
