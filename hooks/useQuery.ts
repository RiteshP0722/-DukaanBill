import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { friendlyError } from '@/lib/errors';

export interface QueryState<T> {
  data: T | undefined;
  /** True on the very first load (show a spinner). */
  loading: boolean;
  /** True on later reloads (old data stays on screen until the new data arrives). */
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Tiny data-loading hook: runs `fetcher` when the screen opens, every time the
 * screen comes back into focus (so stock is always fresh) and when `deps` change.
 * `deps` must be simple values (text, numbers, true/false). Handles loading,
 * error and "retry" for us.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[]): QueryState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const hasData = useRef(false);

  // Always call the newest fetcher, but only reload when the simple `deps` values change.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });
  const depsKey = JSON.stringify(deps);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    if (hasData.current) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await fetcherRef.current();
      if (id !== requestId.current) return; // a newer request is running
      setData(result);
      hasData.current = true;
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(friendlyError(e));
    } finally {
      if (id === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, loading, refreshing, error, reload };
}
