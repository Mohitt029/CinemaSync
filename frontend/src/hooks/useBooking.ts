// src/hooks/useBooking.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import bookingService from '../services/booking.service';
import {
  getShowAvailability,
  normalizeAvailability,
} from '../services/availability.service';
import { Seat, SeatAvailability } from '../types/booking.types';
import toast from 'react-hot-toast';

interface LockBatch {
  lockId: string;
  expiresAt: string;
  seats: Seat[];
  timeRemaining: number;
}

interface StoredLockState {
  showId: string;
  userId: string;
  batches: { lockId: string; expiresAt: string; seats: Seat[] }[];
}

const getMyUserId = (): string => {
  try {
    const fromKey = localStorage.getItem('userId');
    if (fromKey) return String(fromKey);
    const user = localStorage.getItem('user');
    if (!user) return '';
    const u = JSON.parse(user);
    return String(u.id || u._id || u.email || '');
  } catch {
    return '';
  }
};

const getLockStorageKey = (userId: string) =>
  `cinemasync_locks_${userId || 'anonymous'}`;

const safeRemaining = (expiresAt: string): number => {
  const t = new Date(expiresAt).getTime();
  if (isNaN(t)) return 600;
  return Math.max(0, Math.floor((t - Date.now()) / 1000));
};

const lockOwner = (seat: Seat): string | null => {
  const id = seat.lockedBy || seat.userId || null;
  return id && String(id).trim() ? String(id) : null;
};

let lastToastTime = 0;
let lastToastMessage = '';

export const useBooking = () => {
  const [seatAvailability, setSeatAvailability] = useState<SeatAvailability | null>(null);
  const [pendingSeats, setPendingSeats] = useState<Seat[]>([]);
  const [lockBatches, setLockBatches] = useState<LockBatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentShowIdRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  const seatAvailabilityRef = useRef<SeatAvailability | null>(null);
  const lockBatchesRef = useRef<LockBatch[]>([]);
  const pendingSeatsRef = useRef<Seat[]>([]);
  const currentUserIdRef = useRef<string>(getMyUserId());

  useEffect(() => {
    seatAvailabilityRef.current = seatAvailability;
  }, [seatAvailability]);
  useEffect(() => {
    lockBatchesRef.current = lockBatches;
  }, [lockBatches]);
  useEffect(() => {
    pendingSeatsRef.current = pendingSeats;
  }, [pendingSeats]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const now = Date.now();
      if (now - lastToastTime < 500 && message === lastToastMessage) return;
      lastToastTime = now;
      lastToastMessage = message;
      if (type === 'success') toast.success(message);
      else if (type === 'error') toast.error(message);
      else toast(message);
    },
    []
  );

  const readStored = (userId: string): StoredLockState | null => {
    if (!userId) return null;
    const saved = sessionStorage.getItem(getLockStorageKey(userId));
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved) as StoredLockState;
      if (parsed.userId !== userId) return null;
      return parsed;
    } catch {
      sessionStorage.removeItem(getLockStorageKey(userId));
      return null;
    }
  };

  const writeStored = (userId: string, showId: string, batches: LockBatch[]) => {
    if (!userId) return;
    const key = getLockStorageKey(userId);
    if (batches.length === 0) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(
      key,
      JSON.stringify({
        showId,
        userId,
        batches: batches.map((b) => ({
          lockId: b.lockId,
          expiresAt: b.expiresAt,
          seats: b.seats,
        })),
      } as StoredLockState)
    );
  };

  const clearStored = useCallback((userId: string) => {
    if (userId) sessionStorage.removeItem(getLockStorageKey(userId));
  }, []);

  const mergeLocksIntoData = useCallback(
    (data: SeatAvailability, batches: LockBatch[], myUserId: string): SeatAvailability => {
      if (!myUserId || batches.length === 0) return data;
      const myLocked = new Map<string, string>();
      batches.forEach((b) => b.seats.forEach((s) => myLocked.set(s.seatId, b.expiresAt)));

      const seats = data.seats.map((seat) => {
        if (seat.status === 'BOOKED') return seat;
        const owner = lockOwner(seat);
        if (seat.status === 'LOCKED' && owner && owner !== myUserId) return seat;
        if (myLocked.has(seat.seatId)) {
          return {
            ...seat,
            status: 'LOCKED' as const,
            lockedBy: myUserId,
            userId: myUserId,
            expiresAt: myLocked.get(seat.seatId),
          };
        }
        return seat;
      });

      const recount = (st: string) => seats.filter((s) => s.status === st).length;
      return {
        ...data,
        seats,
        availableSeats: recount('AVAILABLE'),
        lockedSeats: recount('LOCKED'),
        bookedSeats: recount('BOOKED'),
      };
    },
    []
  );

  const reconcileBatches = (
    batches: LockBatch[],
    serverSeats: Seat[],
    myUserId: string
  ): LockBatch[] => {
    if (!myUserId || batches.length === 0) return [];

    return batches
      .map((batch) => {
        if (safeRemaining(batch.expiresAt) <= 0) return null;
        const kept: Seat[] = [];
        for (const seat of batch.seats) {
          const serverSeat = serverSeats.find((s) => s.seatId === seat.seatId);
          if (!serverSeat) {
            kept.push(seat);
            continue;
          }
          if (serverSeat.status === 'BOOKED') continue;
          const owner = lockOwner(serverSeat);
          if (serverSeat.status === 'LOCKED' && owner && owner !== myUserId) continue;
          kept.push({
            ...seat,
            status: 'LOCKED',
            lockedBy: myUserId,
            userId: myUserId,
            expiresAt: serverSeat.expiresAt || batch.expiresAt,
          });
        }
        if (kept.length === 0) return null;
        const expiresAt = kept[0].expiresAt || batch.expiresAt;
        return {
          ...batch,
          seats: kept,
          expiresAt,
          timeRemaining: safeRemaining(expiresAt),
        };
      })
      .filter((b): b is LockBatch => b !== null);
  };

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      isPollingRef.current = false;
    }
  }, []);

  const resetLocalState = useCallback(() => {
    setPendingSeats([]);
    setLockBatches([]);
    setSeatAvailability(null);
    setError(null);
  }, []);

  const restoreLocksForShow = useCallback(
    (showId: string): LockBatch[] => {
      const myUserId = getMyUserId();
      if (!myUserId) return [];
      const stored = readStored(myUserId);
      if (!stored || stored.showId !== showId || stored.userId !== myUserId) return [];

      const valid = stored.batches
        .map((b) => ({
          lockId: b.lockId,
          expiresAt: b.expiresAt,
          seats: b.seats.map((s) => ({ ...s, lockedBy: myUserId, userId: myUserId })),
          timeRemaining: safeRemaining(b.expiresAt),
        }))
        .filter((b) => b.timeRemaining > 0);

      if (valid.length === 0) {
        clearStored(myUserId);
        setLockBatches([]);
        return [];
      }
      setLockBatches(valid);
      return valid;
    },
    [clearStored]
  );

  const startPollingForUpdates = useCallback(
    (showId: string) => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      isPollingRef.current = true;

      pollIntervalRef.current = setInterval(async () => {
        try {
          const myUserId = getMyUserId();
          if (myUserId !== currentUserIdRef.current) return;

          const raw = await getShowAvailability(showId);
          if (!raw?.seats?.length) return;

          const prev = lockBatchesRef.current;
          const reconciled = reconcileBatches(prev, raw.seats, myUserId);
          writeStored(myUserId, showId, reconciled);
          setLockBatches(reconciled);
          setSeatAvailability(mergeLocksIntoData(raw, reconciled, myUserId));

          const lostPending = pendingSeatsRef.current.filter((s) => {
            const u = raw.seats.find((x) => x.seatId === s.seatId);
            if (!u) return false;
            const owner = lockOwner(u);
            return u.status === 'LOCKED' && owner && owner !== myUserId;
          });
          if (lostPending.length > 0) {
            showToast(
              `Seat(s) ${lostPending.map((s) => `${s.rowName}${s.number}`).join(', ')} taken by another user`,
              'error'
            );
            setPendingSeats((p) =>
              p.filter((s) => !lostPending.some((l) => l.seatId === s.seatId))
            );
          }
        } catch {
          /* silent */
        }
      }, 3000);
    },
    [mergeLocksIntoData, showToast]
  );

  const loadSeatAvailability = useCallback(
    async (
      showId: string,
      options?: { startPolling?: boolean; lockedBatches?: LockBatch[]; silent?: boolean }
    ) => {
      const shouldPoll = options?.startPolling !== false;
      const silent = options?.silent === true;
      const myUserId = getMyUserId();
      if (!silent) {
        setIsLoading(true);
        setError(null);
      }
      currentShowIdRef.current = showId;
      currentUserIdRef.current = myUserId;

      try {
        let data: SeatAvailability;
        try {
          data = await getShowAvailability(showId);
        } catch {
          const raw = await bookingService.getSeatAvailability(showId);
          data = normalizeAvailability(raw, showId);
        }

        if (data?.seats?.length) {
          const candidate =
            options?.lockedBatches && options.lockedBatches.length > 0 && myUserId
              ? options.lockedBatches
              : lockBatchesRef.current;

          const reconciled = reconcileBatches(candidate, data.seats, myUserId);
          writeStored(myUserId, showId, reconciled);
          setLockBatches(reconciled);
          setSeatAvailability(mergeLocksIntoData(data, reconciled, myUserId));

          if (shouldPoll && !isPollingRef.current) {
            startPollingForUpdates(showId);
          }
          return data;
        }
        if (!silent) {
          setError('No seats available for this show');
          setSeatAvailability(null);
        }
      } catch (err: any) {
        if (!silent) {
          setError(err.response?.data?.message || err.message || 'Failed to load seats');
          setSeatAvailability(null);
          showToast('Failed to load seat availability', 'error');
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [mergeLocksIntoData, showToast, startPollingForUpdates]
  );

  const selectSeat = useCallback(
    (seat: Seat) => {
      if (!seat) return;
      const myUserId = getMyUserId();
      const owner = lockOwner(seat);

      if (seat.status === 'LOCKED' && owner && owner !== myUserId) {
        showToast(`Seat ${seat.rowName}${seat.number} is locked by another user`, 'error');
        return;
      }
      if (seat.status === 'BOOKED') {
        showToast(`Seat ${seat.rowName}${seat.number} is already booked`, 'error');
        return;
      }
      if (seat.status === 'LOCKED' && owner === myUserId) {
        const inBatch = lockBatchesRef.current.some((b) =>
          b.seats.some((s) => s.seatId === seat.seatId)
        );
        if (inBatch) {
          showToast(`Seat ${seat.rowName}${seat.number} is already locked`, 'info');
          return;
        }
      }

      setPendingSeats((prev) => {
        if (prev.find((s) => s.seatId === seat.seatId)) {
          return prev.filter((s) => s.seatId !== seat.seatId);
        }
        const total =
          prev.length + lockBatchesRef.current.reduce((n, b) => n + b.seats.length, 0);
        if (total >= 10) {
          showToast('Maximum 10 seats per booking', 'error');
          return prev;
        }
        showToast(`Seat ${seat.rowName}${seat.number} selected`, 'success');
        return [...prev, { ...seat, status: 'SELECTED' as const }];
      });
    },
    [showToast]
  );

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLockBatches((prev) => {
        if (prev.length === 0) return prev;
        const stillValid: LockBatch[] = [];
        const expired: LockBatch[] = [];
        prev.forEach((b) => {
          const rem = safeRemaining(b.expiresAt);
          if (rem <= 0) expired.push(b);
          else stillValid.push({ ...b, timeRemaining: rem });
        });
        if (expired.length > 0) {
          expired.forEach((b) => {
            showToast(
              `Lock expired for ${b.seats.map((s) => `${s.rowName}${s.number}`).join(', ')}`,
              'error'
            );
          });
          const showId = currentShowIdRef.current;
          const myUserId = currentUserIdRef.current;
          if (showId && myUserId) {
            writeStored(myUserId, showId, stillValid);
            setSeatAvailability((av) => {
              if (!av) return av;
              const ids = new Set(expired.flatMap((b) => b.seats.map((s) => s.seatId)));
              const seats = av.seats.map((s) =>
                ids.has(s.seatId)
                  ? {
                      ...s,
                      status: 'AVAILABLE' as const,
                      lockedBy: undefined,
                      userId: undefined,
                      expiresAt: undefined,
                    }
                  : s
              );
              return {
                ...av,
                seats,
                availableSeats: seats.filter((x) => x.status === 'AVAILABLE').length,
                lockedSeats: seats.filter((x) => x.status === 'LOCKED').length,
                bookedSeats: seats.filter((x) => x.status === 'BOOKED').length,
              };
            });
          }
        }
        return stillValid;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showToast]);

  const lockPendingSeats = useCallback(
    async (showId: string) => {
      const seatIds = pendingSeatsRef.current.map((s) => s.seatId);
      if (seatIds.length === 0) return null;
      const myUserId = getMyUserId();
      if (!myUserId) {
        showToast('Please log in to lock seats', 'error');
        return null;
      }

      setIsLoading(true);
      try {
        const response = await bookingService.lockSeats(showId, seatIds);
        const expiresAt =
          response?.expiresAt || new Date(Date.now() + 10 * 60 * 1000).toISOString();
        const resolvedLockId = response.lockId || `lock-${Date.now()}`;
        const lockedSeats = pendingSeatsRef.current.map((s) => ({
          ...s,
          status: 'LOCKED' as const,
          lockedBy: myUserId,
          userId: myUserId,
          expiresAt,
        }));

        const newBatch: LockBatch = {
          lockId: resolvedLockId,
          expiresAt,
          seats: lockedSeats,
          timeRemaining: safeRemaining(expiresAt),
        };

        setLockBatches((prev) => {
          const next = [...prev, newBatch];
          writeStored(myUserId, showId, next);
          return next;
        });
        setPendingSeats([]);

        setSeatAvailability((prev) => {
          if (!prev) return prev;
          const seats = prev.seats.map((s) =>
            seatIds.includes(s.seatId)
              ? {
                  ...s,
                  status: 'LOCKED' as const,
                  lockedBy: myUserId,
                  userId: myUserId,
                  expiresAt,
                }
              : s
          );
          return {
            ...prev,
            seats,
            availableSeats: seats.filter((x) => x.status === 'AVAILABLE').length,
            lockedSeats: seats.filter((x) => x.status === 'LOCKED').length,
            bookedSeats: seats.filter((x) => x.status === 'BOOKED').length,
          };
        });

        showToast(
          `${seatIds.length} seat(s) locked for ~${Math.floor(safeRemaining(expiresAt) / 60)} min`,
          'success'
        );
        return newBatch;
      } catch (err: any) {
        const msg = err.response?.data?.error || err.message || 'Failed to lock seats';
        showToast(msg, 'error');
        loadSeatAvailability(showId);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [loadSeatAvailability, showToast]
  );

  const releaseBatch = useCallback(
    async (showId: string, lockId: string) => {
      const myUserId = getMyUserId();
      const batch = lockBatchesRef.current.find((b) => b.lockId === lockId);
      if (!batch) return;

      try {
        await bookingService.releaseSeats(
          showId,
          batch.seats.map((s) => s.seatId)
        );
      } catch (err) {
        console.error('Release error:', err);
      } finally {
        setLockBatches((prev) => {
          const next = prev.filter((b) => b.lockId !== lockId);
          writeStored(myUserId, showId, next);
          setSeatAvailability((av) => {
            if (!av) return av;
            const ids = new Set(batch.seats.map((s) => s.seatId));
            const seats = av.seats.map((s) =>
              ids.has(s.seatId)
                ? {
                    ...s,
                    status: 'AVAILABLE' as const,
                    lockedBy: undefined,
                    userId: undefined,
                    expiresAt: undefined,
                  }
                : s
            );
            return {
              ...av,
              seats,
              availableSeats: seats.filter((x) => x.status === 'AVAILABLE').length,
              lockedSeats: seats.filter((x) => x.status === 'LOCKED').length,
              bookedSeats: seats.filter((x) => x.status === 'BOOKED').length,
            };
          });
          return next;
        });
        showToast('Seats released.', 'info');
      }
    },
    [showToast]
  );

  const createBooking = useCallback(
    async (showId: string, paymentMethod: string, couponCode?: string) => {
      const allLocked = lockBatchesRef.current.flatMap((b) => b.seats);
      if (allLocked.length === 0) {
        showToast('Please lock at least one seat first', 'error');
        return null;
      }
      setIsLoading(true);
      try {
        const data = await bookingService.createBooking({
          showId,
          seatIds: allLocked.map((s) => s.seatId),
          paymentMethod,
          couponCode,
        });
        showToast('Booking created — complete payment to confirm.', 'success');
        return data;
      } catch (err: any) {
        showToast(
          err.response?.data?.error || err.message || 'Failed to create booking',
          'error'
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const clearAfterSuccess = useCallback(() => {
    const myUserId = getMyUserId();
    setLockBatches([]);
    setPendingSeats([]);
    clearStored(myUserId);
    stopPolling();
  }, [clearStored, stopPolling]);

  const confirmPayment = useCallback(
    async (bookingId: string) => {
      setIsLoading(true);
      try {
        const data = await bookingService.confirmBooking(bookingId, `PAY-${Date.now()}`);
        showToast('Payment confirmed! Booking complete.', 'success');
        return data;
      } catch (err: any) {
        showToast(err.response?.data?.error || err.message || 'Payment failed', 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const clearPendingSeats = useCallback(() => setPendingSeats([]), []);

  useEffect(() => {
    const onUserMaybeChanged = () => {
      const id = getMyUserId();
      if (id === currentUserIdRef.current) return;
      const previous = currentUserIdRef.current;
      currentUserIdRef.current = id;
      clearStored(previous);
      stopPolling();
      resetLocalState();
      if (currentShowIdRef.current && id) {
        const restored = restoreLocksForShow(currentShowIdRef.current);
        loadSeatAvailability(currentShowIdRef.current, { lockedBatches: restored });
      }
    };
    window.addEventListener('storage', onUserMaybeChanged);
    window.addEventListener('focus', onUserMaybeChanged);
    const iv = setInterval(onUserMaybeChanged, 2000);
    return () => {
      window.removeEventListener('storage', onUserMaybeChanged);
      window.removeEventListener('focus', onUserMaybeChanged);
      clearInterval(iv);
    };
  }, [clearStored, stopPolling, resetLocalState, restoreLocksForShow, loadSeatAvailability]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopPolling();
    };
  }, [stopPolling]);

  const allSelectedSeats: Seat[] = [
    ...pendingSeats,
    ...lockBatches.flatMap((b) => b.seats),
  ];

  const getTotalPrice = useCallback(
    () => allSelectedSeats.reduce((sum, s) => sum + (s?.price || 0), 0),
    [allSelectedSeats]
  );

  const myId = getMyUserId();
  const lockedByOthersCount =
    seatAvailability?.seats?.filter((s) => {
      if (s.status !== 'LOCKED') return false;
      const owner = lockOwner(s);
      if (!owner) return true;
      return owner !== myId;
    }).length || 0;

  return {
    seatAvailability,
    pendingSeats,
    lockBatches,
    selectedSeats: allSelectedSeats,
    isLoading,
    error,
    isLocked: lockBatches.length > 0 || pendingSeats.length > 0,
    currentUserId: myId,
    lockedByOthersCount,
    loadSeatAvailability,
    restoreLocksForShow,
    selectSeat,
    lockPendingSeats,
    releaseBatch,
    createBooking,
    confirmPayment,
    clearPendingSeats,
    getTotalPrice,
    stopPolling,
    clearAfterSuccess,
  };
};