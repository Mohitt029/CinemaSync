import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import eventService from '../../services/event.service';
import { Event, CreateEventData, AdvancedSearchParams } from '../../types/event.types';

interface EventState {
  events: Event[];
  featuredEvents: Event[];
  upcomingEvents: Event[];
  selectedEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  totalPages: number;
}

const initialState: EventState = {
  events: [],
  featuredEvents: [],
  upcomingEvents: [],
  selectedEvent: null,
  isLoading: false,
  error: null,
  totalPages: 0,
};

export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async ({ page = 0, size = 20 }: { page?: number; size?: number }) => {
    const response = await eventService.getAllEvents(page, size);
    return response;
  }
);

export const fetchFeaturedEvents = createAsyncThunk(
  'events/fetchFeatured',
  async () => {
    const response = await eventService.getFeaturedEvents();
    return response;
  }
);

export const fetchUpcomingEvents = createAsyncThunk(
  'events/fetchUpcoming',
  async () => {
    const response = await eventService.getUpcomingEvents();
    return response;
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async (id: string) => {
    const response = await eventService.getEventById(id);
    return response;
  }
);

export const searchEvents = createAsyncThunk(
  'events/search',
  async ({ keyword, page = 0 }: { keyword: string; page?: number }) => {
    const response = await eventService.searchEvents(keyword, page);
    return response;
  }
);

export const advancedSearchEvents = createAsyncThunk(
  'events/advancedSearch',
  async (params: AdvancedSearchParams) => {
    return await eventService.advancedSearch(params);
  }
);

export const createEvent = createAsyncThunk(
  'events/create',
  async (data: CreateEventData) => {
    const response = await eventService.createEvent(data);
    return response;
  }
);

export const updateEvent = createAsyncThunk(
  'events/update',
  async ({ id, data }: { id: string; data: CreateEventData }) => {
    const response = await eventService.updateEvent(id, data);
    return response;
  }
);

export const deleteEvent = createAsyncThunk(
  'events/delete',
  async (id: string) => {
    await eventService.deleteEvent(id);
    return id;
  }
);

const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearSelectedEvent: (state) => {
      state.selectedEvent = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.content;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch events';
      })
      // Fetch Featured
      .addCase(fetchFeaturedEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFeaturedEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredEvents = action.payload;
      })
      .addCase(fetchFeaturedEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch featured events';
      })
      // Fetch Upcoming
      .addCase(fetchUpcomingEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUpcomingEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.upcomingEvents = action.payload;
      })
      .addCase(fetchUpcomingEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch upcoming events';
      })
      // Fetch By ID
      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch event';
      })
      // Search
      .addCase(searchEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.content;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Search failed';
      })
      // Advanced Search
      .addCase(advancedSearchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(advancedSearchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload;
        state.totalPages = 1;
      })
      .addCase(advancedSearchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Advanced search failed';
      })
      // Create
      .addCase(createEvent.fulfilled, (state, action) => {
        state.events.unshift(action.payload);
        state.isLoading = false;
      })
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to create event';
      })
      // Update
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        if (state.selectedEvent?.id === action.payload.id) {
          state.selectedEvent = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update event';
      })
      // Delete
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter(e => e.id !== action.payload);
        if (state.selectedEvent?.id === action.payload) {
          state.selectedEvent = null;
        }
      });
  },
});

export const { clearSelectedEvent, clearError } = eventSlice.actions;
export default eventSlice.reducer;