// src/components/events/EventCard.tsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card, CardMedia, CardContent, Typography, Box, Chip,
  IconButton, Button, useTheme,
} from '@mui/material';
import {
  LocationOn, AccessTime, Event as EventIcon,
  Favorite, FavoriteBorder,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Event } from '../../types/event.types';
import { getShowAvailability } from '../../services/availability.service';

interface EventCardProps {
  event: Event;
  featured?: boolean;
  isFavorite?: boolean;
  onFavorite?: (id: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  featured = false,
  isFavorite = false,
  onFavorite,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [liveAvailable, setLiveAvailable] = useState<number | null>(null);

  useEffect(() => {
    const showId = event.showtimes?.[0]?.id;
    if (!showId) {
      setLiveAvailable(null);
      return;
    }
    let cancelled = false;
    getShowAvailability(showId)
      .then((d) => {
        if (!cancelled) setLiveAvailable(d.availableSeats);
      })
      .catch(() => {
        if (!cancelled) setLiveAvailable(null);
      });
    return () => {
      cancelled = true;
    };
  }, [event.showtimes]);

  const seatsLeft =
    liveAvailable != null
      ? liveAvailable
      : event.showtimes?.[0]?.availableSeats ?? event.availableSeats ?? 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING': return 'success';
      case 'ONGOING': return 'warning';
      case 'COMPLETED': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.15)' },
        }}
        onClick={() => navigate(`/events/${event.id}`)}
      >
        {featured && (
          <Chip
            label="⭐ Featured"
            color="secondary"
            size="small"
            sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1, fontWeight: 600 }}
          />
        )}
        {onFavorite && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(event.id);
            }}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 1,
              bgcolor: 'rgba(255,255,255,0.9)',
            }}
            size="small"
          >
            {isFavorite ? <Favorite sx={{ color: '#e74c3c' }} /> : <FavoriteBorder />}
          </IconButton>
        )}

        <CardMedia
          component="img"
          height="200"
          image={event.posterUrl || '/placeholder-event.jpg'}
          alt={event.title}
          sx={{ objectFit: 'cover' }}
        />

        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }} noWrap>
              {event.title}
            </Typography>
            <Chip
              label={event.status}
              color={getStatusColor(event.status) as any}
              size="small"
              sx={{ fontSize: '0.65rem', fontWeight: 600, ml: 1 }}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {event.category} • {event.genre}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {event.venueName}, {event.city}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {event.duration} min • {event.language}
            </Typography>
          </Box>

          {event.showtimes?.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
              {event.showtimes.slice(0, 3).map((st) => (
                <Chip
                  key={st.id}
                  label={formatDate(st.dateTime)}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem' }}
                />
              ))}
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 'auto',
              pt: 1,
            }}
          >
            <Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                ₹{event.minPrice}
                {event.maxPrice > event.minPrice && ` - ₹${event.maxPrice}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {seatsLeft} seats left
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              }}
            >
              Book Now
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default EventCard;