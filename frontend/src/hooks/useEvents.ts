// src/hooks/useEvents.ts
import { useState, useCallback } from 'react';
import { Event, AdvancedSearchParams } from '../types/event.types';
import eventService from '../services/event.service';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchAllEvents = useCallback(async (page: number = 0, size: number = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await eventService.getAllEvents(page, size);
      setEvents(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUpcomingEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventService.getUpcomingEvents();
      setEvents(data);
      setTotalPages(1);
      setTotalElements(data.length);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch upcoming events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFeaturedEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventService.getFeaturedEvents();
      setEvents(data);
      setTotalPages(1);
      setTotalElements(data.length);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch featured events');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const search = useCallback(async (keyword: string, page: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await eventService.searchEvents(keyword, page);
      setEvents(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.content.length);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** BookMyShow-style advanced search (distance, filters) */
  const advancedSearch = useCallback(async (params: AdvancedSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventService.advancedSearch(params);
      setEvents(data);
      setTotalPages(1);
      setTotalElements(data.length);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Advanced search failed');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getEvent = useCallback(async (id: string) => {
    try {
      return await eventService.getEventById(id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch event');
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    events,
    isLoading,
    error,
    totalPages,
    totalElements,
    fetchAllEvents,
    fetchUpcomingEvents,
    fetchFeaturedEvents,
    search,
    advancedSearch,
    getEvent,
    clearError,
  };
};