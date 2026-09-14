// src/pages/Events.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Skeleton,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import {
  Search,
  GridView,
  ViewList,
  Refresh,
  Movie,
  LocalMovies,
  MusicNote,
  SportsBasketball,
  TheaterComedy,
  ArrowForward,
  MyLocation,
} from '@mui/icons-material';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/events/EventCard';
import { useAuth } from '../hooks/useAuth';
import favoritesService from '../services/favorites.service';
import { useNavigate, useSearchParams } from 'react-router-dom';

const categoryIcons: Record<string, any> = {
  MOVIE: <LocalMovies />,
  CONCERT: <MusicNote />,
  SPORTS: <SportsBasketball />,
  THEATER: <TheaterComedy />,
};

const categories = ['all', 'MOVIE', 'CONCERT', 'SPORTS', 'THEATER'];

// Default: Andheri, Mumbai (matches your backend tests)
const DEFAULT_LAT = 19.1197;
const DEFAULT_LNG = 72.8468;

const Events: React.FC = () => {
  const { events, fetchAllEvents, advancedSearch, isLoading, error, clearError } = useEvents();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('all');
  const [language, setLanguage] = useState('');
  const [genre, setGenre] = useState('');
  const [format, setFormat] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [city, setCity] = useState('');
  const [radiusKm, setRadiusKm] = useState(50);
  const [nearMe, setNearMe] = useState(true);
  const [lat, setLat] = useState<number>(DEFAULT_LAT);
  const [lng, setLng] = useState<number>(DEFAULT_LNG);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<string[]>(favoritesService.getFavorites());
  const [displayCount, setDisplayCount] = useState(6);
  const [heroIndex, setHeroIndex] = useState(0);

  // Geolocation (fallback stays Andheri)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        /* keep default */
      },
      { timeout: 5000 }
    );
  }, []);

  const loadEvents = useCallback(async () => {
    const hasFilters =
      searchTerm.trim() ||
      category !== 'all' ||
      language ||
      genre ||
      format ||
      timeSlot ||
      city ||
      nearMe;

    if (hasFilters) {
      await advancedSearch({
        keyword: searchTerm.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        language: language || undefined,
        genre: genre || undefined,
        format: format || undefined,
        timeSlot: timeSlot || undefined,
        city: city || undefined,
        lat: nearMe ? lat : undefined,
        lng: nearMe ? lng : undefined,
        radiusKm: nearMe ? radiusKm : undefined,
        sortBy: nearMe ? 'distance' : 'featured',
      });
    } else {
      await fetchAllEvents(0);
    }
  }, [
    searchTerm,
    category,
    language,
    genre,
    format,
    timeSlot,
    city,
    nearMe,
    lat,
    lng,
    radiusKm,
    advancedSearch,
    fetchAllEvents,
  ]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const onFocus = () => loadEvents();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadEvents]);

   useEffect(() => {
    setFavorites(favoritesService.getFavorites());
    return favoritesService.subscribe(setFavorites);
  }, []);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchTerm(q);
  }, [searchParams]);

  const featured = useMemo(() => events.filter((e) => e.featured).slice(0, 8), [events]);

  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % featured.length), 4500);
    return () => clearInterval(t);
  }, [featured.length]);

  const currentHero = featured[heroIndex] || featured[0];

  const handleFavoriteToggle = (eventId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    favoritesService.toggleFavorite(eventId);
  };

  const getCategoryIcon = (cat: string) => categoryIcons[cat] || <Movie />;

  const displayedEvents = events.slice(0, displayCount);
  const hasMore = events.length > displayCount;

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            clearError();
            loadEvents();
          }}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            Discover Events & Shows
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {nearMe
              ? `Showing events near you (within ${radiusKm} km), nearest first`
              : 'Find and book tickets for the best events'}
          </Typography>
        </Box>

        {currentHero && !searchTerm && (
          <Paper
            sx={{
              mb: 4,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              minHeight: { xs: 220, md: 320 },
              backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 55%, transparent 100%), url(${
                currentHero.posterUrl || ''
              })`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: 'white',
              display: 'flex',
              alignItems: 'flex-end',
              p: { xs: 3, md: 4 },
            }}
          >
            <Box sx={{ maxWidth: 560 }}>
              <Chip
                label={currentHero.category}
                size="small"
                sx={{ bgcolor: 'primary.main', color: 'white', mb: 1, fontWeight: 700 }}
              />
              <Typography
                variant="h3"
                sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.5rem', md: '2.35rem' } }}
              >
                {currentHero.title}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                {currentHero.venueName}
                {currentHero.city ? ` · ${currentHero.city}` : ''}
                {currentHero.distanceKm != null ? ` · ${currentHero.distanceKm} km` : ''}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/events/${currentHero.id}`)}
                sx={{ fontWeight: 700 }}
              >
                Book Now
              </Button>
            </Box>
          </Paper>
        )}

        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search title, city, venue, genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadEvents()}
              sx={{ flex: 1, minWidth: 200 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={loadEvents} size="small">
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {cat !== 'all' && getCategoryIcon(cat)}
                      {cat}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={language}
                label="Language"
                onChange={(e) => setLanguage(e.target.value)}
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Hindi">Hindi</MenuItem>
                <MenuItem value="Tamil">Tamil</MenuItem>
                <MenuItem value="Telugu">Telugu</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>Format</InputLabel>
              <Select value={format} label="Format" onChange={(e) => setFormat(e.target.value)}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="IMAX">IMAX</MenuItem>
                <MenuItem value="3D">3D</MenuItem>
                <MenuItem value="Standard">Standard</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time</InputLabel>
              <Select
                value={timeSlot}
                label="Time"
                onChange={(e) => setTimeSlot(e.target.value)}
              >
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="MORNING">Morning</MenuItem>
                <MenuItem value="AFTERNOON">Afternoon</MenuItem>
                <MenuItem value="EVENING">Evening</MenuItem>
                <MenuItem value="NIGHT">Night</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Radius</InputLabel>
              <Select
                value={radiusKm}
                label="Radius"
                onChange={(e) => setRadiusKm(Number(e.target.value))}
              >
                <MenuItem value={5}>5 km</MenuItem>
                <MenuItem value={10}>10 km</MenuItem>
                <MenuItem value={25}>25 km</MenuItem>
                <MenuItem value={50}>50 km</MenuItem>
                <MenuItem value={100}>100 km</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant={nearMe ? 'contained' : 'outlined'}
              startIcon={<MyLocation />}
              onClick={() => setNearMe((v) => !v)}
              size="small"
            >
              Near me
            </Button>

            <IconButton onClick={loadEvents} size="small">
              <Refresh />
            </IconButton>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              size="small"
            >
              <ToggleButton value="grid">
                <GridView />
              </ToggleButton>
              <ToggleButton value="list">
                <ViewList />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {nearMe && (
              <Chip
                label={`Near me · ${radiusKm} km`}
                onDelete={() => setNearMe(false)}
                color="primary"
                size="small"
              />
            )}
            {category !== 'all' && (
              <Chip label={category} onDelete={() => setCategory('all')} size="small" />
            )}
            {language && (
              <Chip label={language} onDelete={() => setLanguage('')} size="small" />
            )}
            {format && <Chip label={format} onDelete={() => setFormat('')} size="small" />}
            {searchTerm && (
              <Chip label={`“${searchTerm}”`} onDelete={() => setSearchTerm('')} size="small" />
            )}
          </Box>
        </Paper>

        {isLoading ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[...Array(6)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)' },
                }}
              >
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
              </Box>
            ))}
          </Box>
        ) : events.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Movie sx={{ fontSize: 80, color: '#ccc' }} />
            <Typography variant="h5" color="text.secondary" sx={{ mt: 2 }}>
              No events found
            </Typography>
            <Button
              sx={{ mt: 2 }}
              onClick={() => {
                setNearMe(false);
                setSearchTerm('');
                setCategory('all');
                setLanguage('');
                setFormat('');
              }}
            >
              Clear filters
            </Button>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Typography variant="subtitle1" color="text.secondary">
                Showing {displayedEvents.length} of {events.length} events
              </Typography>
              {hasMore && (
                <Button endIcon={<ArrowForward />} onClick={() => setDisplayCount(events.length)}>
                  See More
                </Button>
              )}
            </Box>

            <AnimatePresence>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {displayedEvents.map((event, index) => (
                  <Box
                    key={event.id}
                    sx={{
                      width:
                        viewMode === 'grid'
                          ? {
                              xs: '100%',
                              sm: 'calc(50% - 12px)',
                              md: 'calc(33.33% - 16px)',
                            }
                          : '100%',
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <EventCard
                        event={event}
                        featured={event.featured}
                        onFavorite={handleFavoriteToggle}
                        isFavorite={favorites.includes(event.id)}
                      />
                      {event.distanceKm != null && (
                        <Typography
                          variant="caption"
                          color="primary"
                          sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}
                        >
                          {event.distanceKm} km away
                        </Typography>
                      )}
                    </motion.div>
                  </Box>
                ))}
              </Box>
            </AnimatePresence>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Events;