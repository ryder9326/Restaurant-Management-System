import { useCallback, useEffect, useState } from 'react';

export interface AsyncDataState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  initialValue: T
): AsyncDataState<T> {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  const reload = useCallback(() => {
    setReloadTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Đã xảy ra lỗi khi tải dữ liệu.'
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, reloadTick]);

  return { data, loading, error, reload };
}
