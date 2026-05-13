import { useCallback, useEffect, useState } from 'react';
import { request } from '../api/client.js';
import { useAuth } from '../state/auth.jsx';

export function useApi(path, options = {}) {
  const { token } = useAuth();
  const [data, setData] = useState(options.initialData ?? null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(path) && !options.skip);

  const load = useCallback(async () => {
    if (!path || options.skip) return null;
    setLoading(true);
    setError('');
    try {
      const payload = await request(path, { token });
      setData(payload.data);
      return payload.data;
    } catch (err) {
      setError(err.message || 'โหลดข้อมูลไม่สำเร็จ');
      return null;
    } finally {
      setLoading(false);
    }
  }, [path, token, options.skip]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load, setData };
}

export function useMutation() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mutate = useCallback(
    async (path, body, method = 'POST') => {
      setLoading(true);
      setError('');
      try {
        const payload = await request(path, { method, body, token });
        return payload.data;
      } catch (err) {
        setError(err.message || 'บันทึกข้อมูลไม่สำเร็จ');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  return { mutate, loading, error };
}
