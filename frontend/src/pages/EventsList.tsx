// src/pages/EventsList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  Pagination,
  Skeleton,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Breadcrumbs,
  Link,
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
  ArrowBack,
} from '@mui/icons-material';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/events/EventCard';
import { useAuth } from '../hooks/useAuth';
import favoritesService from '../services/favorites.service';

const categoryIcons: Record<string, any> = {
  MOVIE: <LocalMovies />,
  CONCERT: <MusicNote />,
  SPORTS: <SportsBasketball />,
  THEATER: <TheaterComedy />,
};

const categories = ['all', 'MOVIE', 'CONCERT', 'SPORTS', 'THEATER'];

const EventsList: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { events, fetchAllEvents, search, isLoading, totalPages, error, clearError } = useEvents();
  const { isAuthenticated } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || 'all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(0);
  const [favorites, setFavorites] = useState<string[]>(favoritesService.getFavorites());

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    if (category && category !== 'all') {
      setSelectedCategory(category);
    }
  }, [category]);

  const loadEvents = useCallback(async () => {
    if (searchTerm) {
      await search(searchTerm, page);
    } else if (selectedCategory !== 'all') {
      await fetchAllEvents(page);
    } else {
      await fetchAllEvents(page);
    }
  }, [searchTerm, page, selectedCategory, search, fetchAllEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSearch = async () => {
    setPage(0);
    await loadEvents();
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setPage(0);
    navigate(`/events/category/${newCategory}`);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFavoriteToggle = (eventId: string) => {
    if (!isAuthenticated) {
      alert('Please login to add favorites');
      navigate('/login');
      return;
    }
    favoritesService.toggleFavorite(eventId);
  };

  const getCategoryIcon = (cat: string) => {
    return categoryIcons[cat] || <Movie />;
  };

  const filteredEvents = events.filter(event =>
    selectedCategory === 'all' || event.category === selectedCategory
  );

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      'all': 'All Events',
      'MOVIE': 'Movies',
      'CONCERT': 'Concerts',
      'SPORTS': 'Sports',
      'THEATER': 'Theater'
    };
    return names[cat] || 'Events';
  };

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">{error}</Typography>
        <Button variant="contained" onClick={() => { clearError(); loadEvents(); }} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
            Home
          </Link>
          <Typography color="text.primary">{getCategoryName(selectedCategory)}</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton onClick={() => navigate('/')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {getCategoryName(selectedCategory)}
          </Typography>
          {selectedCategory !== 'all' && (
            <Chip
              icon={getCategoryIcon(selectedCategory)}
              label={selectedCategory}
              color="primary"
            />
          )}
        </Box>

        {/* Search and Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            bgcolor: 'white',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
                      <IconButton onClick={handleSearch} size="small">
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                }
              }}
            />

            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                label="Category"
                size="small"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {cat !== 'all' && getCategoryIcon(cat)}
                      {cat.toUpperCase()}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto' }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, val) => val && setViewMode(val)}
                size="small"
              >
                <ToggleButton value="grid">
                  <GridView />
                </ToggleButton>
                <ToggleButton value="list">
                  <ViewList />
                </ToggleButton>
              </ToggleButtonGroup>
              <IconButton onClick={loadEvents} size="small">
                <Refresh />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Results Count */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="text.secondary">
            Showing {filteredEvents.length} events
          </Typography>
        </Box>

        {/* Events Grid */}
        {isLoading ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {[...Array(6)].map((_, i) => (
              <Box key={i} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)' } }}>
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
                <Skeleton variant="text" sx={{ mt: 1 }} />
                <Skeleton variant="text" width="60%" />
              </Box>
            ))}
          </Box>
        ) : filteredEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Movie sx={{ fontSize: 80, color: '#ccc' }} />
            <Typography variant="h5" color="text.secondary" sx={{ mt: 2 }}>
              No events found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search or filters
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                navigate('/events/all');
              }}
              sx={{ mt: 2 }}
            >
              View All Events
            </Button>
          </Box>
        ) : (
          <>
            <AnimatePresence>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {filteredEvents.map((event, index) => (
                  <Box
                    key={event.id}
                    sx={{
                      width: viewMode === 'grid' 
                        ? { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.33% - 16px)' }
                        : '100%'
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <EventCard
                        event={event}
                        featured={event.featured}
                        onFavorite={handleFavoriteToggle}
                        isFavorite={favorites.includes(event.id)}
                      />
                    </motion.div>
                  </Box>
                ))}
              </Box>
            </AnimatePresence>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default EventsList;