// src/pages/EventDetail.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Container, Typography, Box, Paper, Chip, Button, Divider, Skeleton,
  Card, CardContent, Rating, IconButton, useTheme, Alert, CircularProgress,
} from '@mui/material';
import {
  ArrowBack, LocationOn, AccessTime, Event as EventIcon,
  Favorite, FavoriteBorder, CalendarToday, LocalMovies, MusicNote,
  SportsBasketball, TheaterComedy, Star, Refresh,
} from '@mui/icons-material';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../hooks/useAuth';
import { useLiveSeats } from '../hooks/useLiveSeats';
import { Event } from '../types/event.types';
import favoritesService from '../services/favorites.service';
import toast from 'react-hot-toast';

const categoryIcons: Record<string, any> = {
  MOVIE: <LocalMovies />,
  CONCERT: <MusicNote />,
  SPORTS: <SportsBasketball />,
  THEATER: <TheaterComedy />,
};

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { getEvent } = useEvents();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);

  const showtimeIds = useMemo(
    () => (event?.showtimes || []).map((s) => s.id).filter(Boolean),
    [event]
  );

  const { summaries, loading: seatsLoading } = useLiveSeats(showtimeIds, 15000);

  const loadEvent = useCallback(async (eventId: string) => {
    setLoading(true);
    const data = await getEvent(eventId);
    if (data) {
      setEvent(data);
      setIsFavorite(favoritesService.isFavorite(data.id));
      if (isAuthenticated) {
        const ratings = JSON.parse(localStorage.getItem('userRatings') || '{}');
        setUserRating(ratings[data.id] || null);
      }
    }
    setLoading(false);
  }, [getEvent, isAuthenticated]);

  useEffect(() => {
    if (id) loadEvent(id);
  }, [id, loadEvent]);

  // keep favorite state in sync if changed elsewhere
  useEffect(() => {
    const unsub = favoritesService.subscribe(() => {
      if (event) setIsFavorite(favoritesService.isFavorite(event.id));
    });
    return () => unsub();
  }, [event]);

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add favorites');
      navigate('/login');
      return;
    }
    if (!event) return;
    const next = favoritesService.toggleFavorite(event.id);
    setIsFavorite(next.includes(event.id));
    toast.success(
      next.includes(event.id) ? 'Added to favorites' : 'Removed from favorites'
    );
  };

  const handleRating = (newValue: number | null) => {
    if (!isAuthenticated) {
      toast.error('Please login to rate events');
      navigate('/login');
      return;
    }
    setUserRating(newValue);
    const ratings = JSON.parse(localStorage.getItem('userRatings') || '{}');
    if (newValue === null) delete ratings[event!.id];
    else ratings[event!.id] = newValue;
    localStorage.setItem('userRatings', JSON.stringify(ratings));
    toast.success(newValue ? `Rated ${newValue} stars!` : 'Rating removed');
  };

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
    if (!dateString) return 'Date TBD';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleProceedToBook = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book tickets');
      navigate('/login');
      return;
    }
    if (!selectedShowtime) {
      toast.error('Please select a showtime');
      return;
    }
    navigate(`/booking/${selectedShowtime}`, {
      state: {
        eventId: event?.id,
        eventTitle: event?.title,
        showtimeId: selectedShowtime,
        showtimeData: event?.showtimes?.find((s) => s.id === selectedShowtime),
      },
    });
  };

  if (loading || !event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
          </Box>
          <Box sx={{ width: { xs: '100%', md: '66.66%' } }}>
            <Skeleton variant="text" height={60} />
            <Skeleton variant="text" height={30} width="60%" />
            <Skeleton variant="text" height={20} />
            <Skeleton variant="text" height={100} />
            <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
          </Box>
        </Box>
      </Container>
    );
  }

  const hasShowtimes = event.showtimes && event.showtimes.length > 0;
  const selectedShowtimeData = event.showtimes?.find((s) => s.id === selectedShowtime);

  const liveFor = (showId?: string) => (showId ? summaries[showId] : undefined);
  const selectedLive = liveFor(selectedShowtime || undefined);

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mb: 3 }}>
            Back to Home
          </Button>
        </motion.div>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {/* Poster */}
          <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card sx={{ borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                <img
                  src={event.posterUrl || '/placeholder-event.jpg'}
                  alt={event.title}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                {event.featured && (
                  <Chip
                    label="⭐ Featured"
                    color="secondary"
                    sx={{ position: 'absolute', top: 16, left: 16, fontWeight: 600 }}
                  />
                )}
                <IconButton
                  onClick={handleFavoriteToggle}
                  sx={{
                    position: 'absolute', top: 16, right: 16,
                    bgcolor: 'rgba(255,255,255,0.9)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                  }}
                >
                  {isFavorite ? (
                    <Favorite sx={{ color: '#e74c3c' }} />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
              </Card>

              <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip label={event.status} color={getStatusColor(event.status) as any} size="small" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Rating</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating value={event.averageRating || 0} readOnly size="small" precision={0.5} />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {event.averageRating || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="body2">{event.duration} min</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">Language</Typography>
                  <Typography variant="body2">{event.language}</Typography>
                </Box>
              </Paper>
            </motion.div>
          </Box>

          {/* Details */}
          <Box sx={{ width: { xs: '100%', md: '66.66%' } }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  {categoryIcons[event.category] || <EventIcon />}
                  <Chip label={event.category} size="small" color="primary" />
                  <Chip label={event.genre} size="small" variant="outlined" />
                  {seatsLoading && (
                    <CircularProgress size={14} sx={{ ml: 1 }} />
                  )}
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                  {event.title}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {event.venueName}, {event.city}, {event.state}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTime color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {event.duration} min
                    </Typography>
                  </Box>
                </Box>

                {isAuthenticated && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Your Rating:</Typography>
                    <Rating
                      value={userRating || 0}
                      onChange={(_, v) => handleRating(v)}
                      size="large"
                      icon={<Star sx={{ fontSize: 32 }} />}
                      emptyIcon={<Star sx={{ fontSize: 32, color: '#ddd' }} />}
                    />
                    {userRating && (
                      <Button size="small" color="error" onClick={() => handleRating(null)}>
                        Remove
                      </Button>
                    )}
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>About this event</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {event.description}
                </Typography>

                {event.tags && event.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                    {event.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Showtimes
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<Refresh />}
                    onClick={() => {
                      // re-trigger the polling hook by remounting via a key hack
                      // simplest: reload the page section — or just let 15s poll handle it
                      setSelectedShowtime((s) => s);
                    }}
                  >
                    Refresh seats
                  </Button>
                </Box>

                {hasShowtimes ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {event.showtimes.map((showtime) => {
                      const isSelected = selectedShowtime === showtime.id;
                      const live = liveFor(showtime.id);
                      const seatsLeft = live?.availableSeats ?? showtime.availableSeats ?? 0;
                      return (
                        <Box
                          key={showtime.id}
                          sx={{
                            width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' },
                          }}
                        >
                          <Card
                            onClick={() => setSelectedShowtime(showtime.id)}
                            sx={{
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              border: isSelected
                                ? `2px solid ${theme.palette.primary.main}`
                                : '2px solid transparent',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                              },
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <CalendarToday color="action" fontSize="small" />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatDate(showtime.dateTime)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Screen {showtime.screen || 'Main'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {showtime.format || 'Standard'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 600,
                                    color: seatsLeft < 20 ? 'error.main' : 'success.main',
                                  }}
                                >
                                  {seatsLeft} seats left
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  Starting ₹{event.minPrice || 0}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ width: '100%' }}>
                    No showtimes available for this event. Please check back later.
                  </Alert>
                )}

                {event.priceTiers && event.priceTiers.length > 0 && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Price Tiers</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {event.priceTiers.map((tier, i) => (
                        <Box key={i} sx={{ width: { xs: '100%', sm: 'calc(33.33% - 11px)' } }}>
                          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: '#f8f9fa' }}>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                              ₹{tier.price}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{tier.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tier.seatsCount} seats
                            </Typography>
                          </Paper>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={!hasShowtimes || !selectedShowtime}
                    onClick={handleProceedToBook}
                    sx={{
                      py: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {!hasShowtimes
                      ? 'No Showtimes Available'
                      : selectedShowtime
                      ? `Proceed to Book — ${selectedLive?.availableSeats ?? selectedShowtimeData?.availableSeats ?? 0} seats left`
                      : 'Select a Showtime to Book'}
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default EventDetail;