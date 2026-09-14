// src/services/event.service.ts
import axios from 'axios';
import { Event, CreateEventData, AdvancedSearchParams } from '../types/event.types';

const API_BASE_URL = process.env.REACT_APP_EVENT_API_URL || 'http://localhost:8082/api';

class EventService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  async createEvent(data: CreateEventData): Promise<Event> {
    const response = await this.api.post<Event>('/events', data);
    return response.data;
  }

  async getEventById(id: string): Promise<Event> {
    const response = await this.api.get<Event>(`/events/${id}`);
    return response.data;
  }

  async getAllEvents(
    page: number = 0,
    size: number = 20
  ): Promise<{ content: Event[]; totalPages: number; totalElements: number }> {
    const response = await this.api.get(`/events?page=${page}&size=${size}`);
    return response.data;
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const response = await this.api.get<Event[]>('/events/upcoming');
    return response.data;
  }

  async getFeaturedEvents(): Promise<Event[]> {
    const response = await this.api.get<Event[]>('/events/featured');
    return response.data;
  }

  async searchEvents(
    keyword: string,
    page: number = 0
  ): Promise<{ content: Event[]; totalPages: number }> {
    const response = await this.api.get(
      `/events/search?keyword=${encodeURIComponent(keyword)}&page=${page}`
    );
    return response.data;
  }

  /** BookMyShow-style advanced search with optional distance sort */
  async advancedSearch(params: AdvancedSearchParams): Promise<Event[]> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        qs.append(key, String(value));
      }
    });
    const response = await this.api.get<Event[]>(`/events/search/advanced?${qs.toString()}`);
    return response.data;
  }

  async updateEvent(id: string, data: CreateEventData): Promise<Event> {
    const response = await this.api.put<Event>(`/events/${id}`, data);
    return response.data;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.api.delete(`/events/${id}`);
  }
}

export default new EventService();