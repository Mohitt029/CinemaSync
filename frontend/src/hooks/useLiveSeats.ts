// src/hooks/useLiveSeats.ts
import { useEffect, useRef, useState } from 'react';
import availabilityService, {
  ShowtimeSummary,
} from '../services/availability.service';

/**
 * Polls live availability for one or more showtimes.
 * Returns a map showId -> { availableSeats, totalSeats, ... }
 *
 * Polling stops automatically when the tab is hidden and resumes on focus.
 */
export function useLiveSeats(showIds: string[], intervalMs = 15000) {
  const [summaries, setSummaries] = useState<Record<string, ShowtimeSummary>>(
    {}
  );
  const [loading, setLoading] = useState<boolean>(false);
  const idsRef = useRef<string[]>([]);

  // stable key so we only re-run when the actual set changes
  const key = showIds.filter(Boolean).sort().join(',');

  useEffect(() => {
    idsRef.current = showIds.filter(Boolean);
    if (!idsRef.current.length) {
      setSummaries({});
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      if (cancelled) return;
      if (document.hidden) return;
      setLoading(true);
      try {
        const map = await availabilityService.getShowtimeSummaries(
          idsRef.current
        );
        if (!cancelled) setSummaries(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    timer = setInterval(load, intervalMs);

    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMs]);

  return { summaries, loading };
}

export default useLiveSeats;