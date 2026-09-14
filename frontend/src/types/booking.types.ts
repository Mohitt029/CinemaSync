// frontend/src/types/booking.types.ts

// ==================== Core Entities ====================

export interface City {
  id: string;
  name: string;
  state: string;
  country: string;
  pinCode: string;
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  cityId: string;
  cityName: string;
  totalScreens: number;
  imageUrl?: string;
  amenities: string[];
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  category: 'MOVIE' | 'CONCERT' | 'SPORTS' | 'THEATER';
  genre: string;
  duration: number;
  language: string;
  rating: string;
  posterUrl: string;
  trailerUrl?: string;
  releaseDate: string;
  cast: string[];
  director: string;
}

export interface Show {
  id: string;
  movieId: string;
  movieTitle: string;
  cinemaId: string;
  cinemaName: string;
  screenName: string;
  showTime: string;
  format: string; // 2D, 3D, IMAX, 4DX
  availableSeats: number;
  totalSeats: number;
  priceTiers: PriceTier[];
}

export interface PriceTier {
  name: string;
  price: number;
  seatsCount: number;
  description?: string;
}

// ==================== Seat Related ====================

// frontend/src/types/booking.types.ts
// frontend/src/types/booking.types.ts
export interface Seat {
  seatId: string;
  rowName: string;
  number: number;
  category: 'SILVER' | 'GOLD' | 'PLATINUM' | string;
  price: number;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'SELECTED';
  /** Who holds the lock — preferred field from API */
  lockedBy?: string | null;
  /** Same owner as lockedBy on some responses / matrix seats */
  userId?: string | null;
  /** True when this seat is locked by the current viewer */
  isMine?: boolean;
  lockedAt?: string;
  expiresAt?: string;
  row?: number;
  col?: number;
}
export interface SeatAvailability {
  showId: string;
  totalSeats: number;
  availableSeats: number;
  lockedSeats: number;
  bookedSeats: number;
  seats: Seat[];
}

export interface SeatLock {
  id: string;
  showId: string;
  userId: string;
  seatIds: string[];
  lockedAt: string;
  expiresAt: string;
  status: string;
}

// ==================== Booking Related ====================

export interface BookingRequest {
  showId: string;
  seatIds: string[];
  couponCode?: string;
  paymentMethod: string;
}

export interface BookingResponse {
  bookingId: string;
  bookingReference: string;
  status: string;
  movieTitle: string;
  theatreName: string;
  screenName: string;
  showDateTime: string;
  seats: {
    seatId: string;
    rowName: string;
    number: number;
    category: string;
    price: number;
  }[];
  totalAmount: number;
  couponCode?: string;
  discountAmount: number;
  finalAmount: number;
  paymentId?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountPercent: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  validUntil: string;
  status: string;
  usedCount: number;
  usageLimit: number;
}

// ==================== Search & Filter ====================

export interface MovieSearchParams {
  title?: string;
  language?: string;
  genre?: string;
  cityId?: string;
  releaseDateFrom?: string;
  releaseDateTo?: string;
}

export interface Booking {
  id: string;
  userId: string;
  showId: string;
  movieTitle: string;
  theatreName: string;
  screenName: string;
  showDateTime: string;
  seats: Seat[];
  totalAmount: number;
  finalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';
  bookingReference: string;
  createdAt: string;
}