// src/services/availability.service.ts
import axios from 'axios';
import { Seat, SeatAvailability } from '../types/booking.types';

const API = process.env.REACT_APP_BOOKING_API_URL || 'http://localhost:8084/api';

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  let userId = localStorage.getItem('userId');
  if (!userId) {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      userId = u.id || u._id || null;
    } catch {
      userId = null;
    }
  }
  if (userId) config.headers['X-User-Id'] = userId;
  return config;
});

export interface ShowtimeSummary {
  showId: string;
  availableSeats: number;
  totalSeats: number;
  bookedSeats: number;
  lockedSeats: number;
}

export function normalizeAvailability(data: any, showId: string): SeatAvailability {
  let seats: Seat[] = [];

  if (Array.isArray(data?.seats)) {
    seats = data.seats;
  } else if (data?.seatMap && typeof data.seatMap === 'object') {
    seats = Object.values(data.seatMap);
  } else if (Array.isArray(data?.matrix)) {
    seats = data.matrix.flat().filter(Boolean);
  }

  seats = seats.map((s: any) => {
    const status = (s.status || 'AVAILABLE') as Seat['status'];
    const owner = s.lockedBy ?? s.userId ?? null;
    return {
      seatId: s.seatId,
      rowName: s.rowName,
      number: s.number,
      category: s.category,
      price: s.price ?? 0,
      status,
      lockedBy: status === 'LOCKED' ? owner : s.lockedBy ?? null,
      userId: owner,
      lockedAt: s.lockedAt,
      expiresAt: s.expiresAt,
      isMine: s.isMine,
      row: s.row,
      col: s.col,
    } as Seat;
  });

  const recount = (st: string) => seats.filter((s) => s.status === st).length;

  return {
    showId: data?.showId || showId,
    totalSeats: data?.totalSeats ?? seats.length,
    availableSeats:
      typeof data?.availableSeats === 'number' ? data.availableSeats : recount('AVAILABLE'),
    lockedSeats:
      typeof data?.lockedSeats === 'number' ? data.lockedSeats : recount('LOCKED'),
    bookedSeats:
      typeof data?.bookedSeats === 'number' ? data.bookedSeats : recount('BOOKED'),
    seats,
  };
}

export async function getShowAvailability(showId: string): Promise<SeatAvailability> {
  const { data } = await api.get(`/seats/show/${showId}/availability`);
  return normalizeAvailability(data, showId);
}

export async function getShowtimeSummaries(
  showIds: string[]
): Promise<Record<string, ShowtimeSummary>> {
  if (!showIds.length) return {};
  const results = await Promise.allSettled(showIds.map((id) => getShowAvailability(id)));
  const map: Record<string, ShowtimeSummary> = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const d = r.value;
      map[showIds[i]] = {
        showId: d.showId || showIds[i],
        availableSeats: d.availableSeats,
        totalSeats: d.totalSeats,
        bookedSeats: d.bookedSeats,
        lockedSeats: d.lockedSeats,
      };
    }
  });
  return map;
}

export default {
  getShowAvailability,
  getShowtimeSummaries,
  normalizeAvailability,
};