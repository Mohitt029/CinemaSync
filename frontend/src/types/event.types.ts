// src/types/event.types.ts
export interface Event {
  id: string;
  title: string;
  description: string;
  category: 'MOVIE' | 'CONCERT' | 'SPORTS' | 'THEATER';
  genre: string;
  duration: number;
  language: string;
  rating: string;
  posterUrl: string;
  trailerUrl: string;
  images: string[];
  venueId: string;
  venueName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  /** Only set by /search/advanced when lat/lng provided */
  distanceKm?: number;
  showtimes: Showtime[];
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  featured: boolean;
  totalSeats: number;
  availableSeats: number;
  minPrice: number;
  maxPrice: number;
  priceTiers: PriceTier[];
  tags: string[];
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface Showtime {
  id: string;
  dateTime: string;
  availableSeats: number;
  totalSeats: number;
  screen: string;
  format: string;
  priceTiers?: PriceTier[];
}

export interface PriceTier {
  name: string;
  price: number;
  seatsCount: number;
  description: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  category: string;
  genre: string;
  duration: number;
  language: string;
  rating: string;
  posterUrl: string;
  images: string[];
  venueId: string;
  venueName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  showtimes: {
    dateTime: string;
    totalSeats: number;
    screen: string;
    format: string;
  }[];
  priceTiers: {
    name: string;
    price: number;
    seatsCount: number;
    description: string;
  }[];
  tags: string[];
  featured: boolean;
}

export type CreateEventData = CreateEventRequest;

export interface AdvancedSearchParams {
  keyword?: string;
  city?: string;
  category?: string;
  language?: string;
  genre?: string;
  format?: string;
  minPrice?: number;
  maxPrice?: number;
  date?: string;
  timeSlot?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sortBy?: 'distance' | 'price' | 'date' | 'featured';
}