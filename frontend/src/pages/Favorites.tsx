// src/pages/Favorites.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Skeleton,
  IconButton,
  Chip,
} from '@mui/material';
import { Favorite, Movie, ArrowBack } from '@mui/icons-material';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/events/EventCard';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { events, fetchAllEvents, isLoading } = useEvents();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view favorites');
      navigate('/login');
      return;
    }
    const savedFavorites = localStorage.getItem('favorites') || '[]';
    setFavorites(JSON.parse(savedFavorites));
    fetchAllEvents(0);
  }, [isAuthenticated]);

  useEffect(() => {
    if (events.length > 0 && favorites.length > 0) {
      const filtered = events.filter(event => favorites.includes(event.id));
      setFavoriteEvents(filtered);
    }
  }, [events, favorites]);

  const handleFavoriteToggle = (eventId: string) => {
    const newFavorites = favorites.filter(id => id !== eventId);
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setFavoriteEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success('Removed from favorites');
  };

  // Render with Box + flexbox instead of Grid
  const renderEvents = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Box key={i} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 16px)' } }}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
            </Box>
          ))}
        </Box>
      );
    }

    if (favoriteEvents.length === 0) {
      return (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Favorite sx={{ fontSize: 80, color: '#ccc' }} />
          <Typography variant="h5" color="text.secondary" sx={{ mt: 2 }}>
            No favorite events yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start exploring events and heart the ones you like
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Browse Events
          </Button>
        </Paper>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {favoriteEvents.map((event) => (
          <Box
            key={event.id}
            sx={{
              width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(25% - 16px)' },
            }}
          >
            <EventCard
              event={event}
              featured={event.featured}
              onFavorite={handleFavoriteToggle}
              isFavorite={true}
            />
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate('/')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Your Favorites
          </Typography>
          <Chip
            label={`${favoriteEvents.length} events`}
            size="small"
            color="primary"
          />
        </Box>

        {renderEvents()}
      </Container>
    </Box>
  );
};

export default Favorites;