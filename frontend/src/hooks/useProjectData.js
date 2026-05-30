import { useState, useEffect, useCallback } from 'react';

export function useProjectData({ from, to }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects?from=${from}&to=${to}`);
      const data = await res.json();
      setProjects(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return { projects, loading, error, refresh: fetchProjects };
}
