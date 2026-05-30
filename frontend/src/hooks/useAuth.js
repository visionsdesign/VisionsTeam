import { useState, useCallback } from 'react';

const TOKEN_KEY = 'vt_token';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Could not reach server');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return { token, login, logout, error, loading };
}
