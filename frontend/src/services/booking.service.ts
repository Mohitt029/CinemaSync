// frontend/src/services/booking.service.ts
import axios from 'axios';
import {
  Seat,
  SeatAvailability,
  BookingRequest,
  BookingResponse,
  Coupon,
} from '../types/booking.types';

const API_BASE_URL = process.env.REACT_APP_BOOKING_API_URL || 'http://localhost:8084/api';

interface SeatMatrixData {
  seatId: string;
  row: number;
  col: number;
  rowName: string;
  number: number;
  category: string;
  price: number;
  status: string;
  userId?: string;
  lockedAt?: any;
  expiresAt?: any;
  version?: number;
}

interface SeatMatrixResponse {
  id: string;
  showId: string;
  rows: number;
  cols: number;
  matrix: SeatMatrixData[][];
  seatMap?: Record<string, SeatMatrixData>;
  totalSeats: number;
  availableSeats: number;
  lockedSeats: number;
  bookedSeats: number;
}

export function normalizeDate(value: any): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d, h = 0, min = 0, s = 0] = value.map(Number);
    const date = new Date(y, m - 1, d, h, min, s);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  if (typeof value === 'object' && value.year != null) {
    const date = new Date(
      value.year,
      (value.monthValue ?? value.month ?? 1) - 1,
      value.dayOfMonth ?? value.day ?? 1,
      value.hour ?? 0,
      value.minute ?? 0,
      value.second ?? 0
    );
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  return undefined;
}

function mapSeat(sd: SeatMatrixData, fallbackRow?: string, fallbackNum?: number): Seat {
  const rawStatus = (sd.status || 'AVAILABLE').toUpperCase();
  const status: Seat['status'] =
    rawStatus === 'LOCKED' ? 'LOCKED' :
    rawStatus === 'BOOKED' ? 'BOOKED' : 'AVAILABLE';

  const rawCat = (sd.category || 'SILVER').toUpperCase();
  const category: Seat['category'] =
    rawCat === 'GOLD' ? 'GOLD' :
    rawCat === 'PLATINUM' ? 'PLATINUM' : 'SILVER';

  return {
    seatId: sd.seatId,
    rowName: sd.rowName || fallbackRow || 'A',
    number: sd.number ?? fallbackNum ?? 1,
    category,
    price: sd.price || 0,
    status,
    lockedBy: sd.userId || undefined,
    lockedAt: normalizeDate(sd.lockedAt),
    expiresAt: normalizeDate(sd.expiresAt),
  };
}

class BookingService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  constructor() {
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        if (user) {
          try {
            const userData = JSON.parse(user);
            config.headers['X-User-Id'] = String(userData.id || userData.email || '');
          } catch {}
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async getSeatAvailability(showId: string): Promise<SeatAvailability> {
    const response = await this.api.get(`/seats/show/${showId}/availability`);
    const data = response.data as SeatMatrixResponse;

    // Prefer seatMap if present (authoritative after lock stamps)
    if (data?.seatMap && Object.keys(data.seatMap).length > 0) {
      const seats = Object.entries(data.seatMap).map(([id, sd]) =>
        mapSeat({ ...(sd as SeatMatrixData), seatId: (sd as SeatMatrixData).seatId || id })
      );
      return {
        showId: data.showId || showId,
        totalSeats: data.totalSeats || seats.length,
        availableSeats: data.availableSeats ?? seats.filter((s) => s.status === 'AVAILABLE').length,
        lockedSeats: data.lockedSeats ?? seats.filter((s) => s.status === 'LOCKED').length,
        bookedSeats: data.bookedSeats ?? seats.filter((s) => s.status === 'BOOKED').length,
        seats,
      };
    }

    if (data?.matrix?.length) {
      const seats: Seat[] = [];
      for (let r = 0; r < data.matrix.length; r++) {
        const row = data.matrix[r];
        if (!row) continue;
        for (let c = 0; c < row.length; c++) {
          const sd = row[c];
          if (!sd?.seatId) continue;
          seats.push(mapSeat(sd, String.fromCharCode(65 + r), c + 1));
        }
      }
      return {
        showId: data.showId || showId,
        totalSeats: data.totalSeats || seats.length,
        availableSeats: data.availableSeats ?? seats.filter((s) => s.status === 'AVAILABLE').length,
        lockedSeats: data.lockedSeats ?? seats.filter((s) => s.status === 'LOCKED').length,
        bookedSeats: data.bookedSeats ?? seats.filter((s) => s.status === 'BOOKED').length,
        seats,
      };
    }

    return this.generateMockSeats(showId);
  }

  private generateMockSeats(showId: string): SeatAvailability {
    const seats: Seat[] = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (let r = 0; r < rows.length; r++) {
      for (let c = 1; c <= 10; c++) {
        seats.push({
          seatId: `${rows[r]}${c}`,
          rowName: rows[r],
          number: c,
          category: r < 3 ? 'PLATINUM' : r < 6 ? 'GOLD' : 'SILVER',
          price: r < 3 ? 600 : r < 6 ? 400 : 250,
          status: 'AVAILABLE',
        });
      }
    }
    return {
      showId,
      totalSeats: seats.length,
      availableSeats: seats.length,
      lockedSeats: 0,
      bookedSeats: 0,
      seats,
    };
  }

  async lockSeats(showId: string, seatIds: string[]): Promise<any> {
    const response = await this.api.post('/seats/lock', { showId, seatIds });
    const data = response.data || {};
    let expiresAt = normalizeDate(data.expiresAt);
    if (!expiresAt) {
      expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    }
    data.expiresAt = expiresAt;
    return data;
  }

  async releaseSeatLock(showId: string, seatId: string): Promise<void> {
    await this.api.delete(`/seats/lock/${showId}/${seatId}`);
  }

  async releaseSeats(showId: string, seatIds: string[]): Promise<void> {
    await Promise.all(seatIds.map((id) => this.releaseSeatLock(showId, id).catch(() => {})));
  }

  async createBooking(bookingData: BookingRequest): Promise<BookingResponse> {
    const response = await this.api.post('/bookings', bookingData);
    return response.data;
  }

  async getBooking(bookingId: string): Promise<BookingResponse> {
    const response = await this.api.get(`/bookings/${bookingId}`);
    return response.data;
  }

  async getUserBookings(): Promise<BookingResponse[]> {
    const response = await this.api.get('/bookings/user/current');
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<BookingResponse> {
    const response = await this.api.put(`/bookings/${bookingId}/cancel`);
    return response.data;
  }

  async confirmBooking(bookingId: string, paymentId: string): Promise<BookingResponse> {
    const response = await this.api.put(
      `/bookings/${bookingId}/confirm?paymentId=${paymentId}`
    );
    return response.data;
  }

  async validateCoupon(code: string): Promise<Coupon | null> {
    try {
      const response = await this.api.get(`/coupons/validate/${code}`);
      return response.data;
    } catch {
      return null;
    }
  }
}

const bookingService = new BookingService();
export default bookingService;