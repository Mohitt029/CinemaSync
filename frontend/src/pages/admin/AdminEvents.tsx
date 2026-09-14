// src/pages/admin/AdminEvents.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
} from '@mui/material';
import eventService from '../../services/event.service';
import { Event } from '../../types/event.types';
import toast from 'react-hot-toast';

const fieldSx = {
  mb: 1.5,
  '& .MuiInputBase-root': { color: '#e6edf3', bgcolor: '#0d1117' },
  '& .MuiInputLabel-root': { color: '#8b949e' },
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' },
};

const categorySx = {
  bgcolor: 'rgba(88, 166, 255, 0.15)',
  color: '#79c0ff',
  border: '1px solid #58a6ff',
  fontWeight: 600,
  '& .MuiChip-label': { color: '#79c0ff' },
};

const AdminEvents: React.FC = () => {
  const [rows, setRows] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('Admin-created event');
  const [category, setCategory] = useState('MOVIE');
  const [genre, setGenre] = useState('Drama');
  const [duration, setDuration] = useState(120);
  const [language, setLanguage] = useState('Hindi');
  const [city, setCity] = useState('Delhi');
  const [venueName, setVenueName] = useState('PVR Select Citywalk');
  const [address, setAddress] = useState('Saket');
  const [state, setState] = useState('Delhi');
  const [posterUrl, setPosterUrl] = useState(
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500'
  );
  const [featured, setFeatured] = useState(false);
  const [lat, setLat] = useState(28.5245);
  const [lng, setLng] = useState(77.2066);
  const [showDate, setShowDate] = useState('2026-09-25T14:00:00');
  const [totalSeats, setTotalSeats] = useState(100);
  const [silver, setSilver] = useState(250);
  const [gold, setGold] = useState(400);

  const load = async () => {
    setLoading(true);
    try {
      const page = await eventService.getAllEvents(0, 50);
      setRows(page.content || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await eventService.createEvent({
        title: title.trim(),
        description,
        category,
        genre,
        duration,
        language,
        rating: 'U/A',
        posterUrl,
        images: [],
        venueId: `venue-${city.toLowerCase()}`,
        venueName,
        address,
        city,
        state,
        country: 'India',
        latitude: lat,
        longitude: lng,
        featured,
        tags: [category, genre],
        showtimes: [
          {
            dateTime: showDate,
            totalSeats,
            screen: 'Screen 1',
            format: category === 'MOVIE' ? 'IMAX' : 'Standard',
          },
        ],
        priceTiers: [
          {
            name: 'SILVER',
            price: silver,
            seatsCount: Math.floor(totalSeats * 0.5),
            description: 'Standard',
          },
          {
            name: 'GOLD',
            price: gold,
            seatsCount: Math.floor(totalSeats * 0.3),
            description: 'Premium',
          },
          {
            name: 'PLATINUM',
            price: gold + 150,
            seatsCount: Math.floor(totalSeats * 0.2),
            description: 'VIP',
          },
        ],
      } as any);
      toast.success('Event created — seat matrices auto-init per showtime');
      setTitle('');
      await load();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Create failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#e6edf3', mb: 2 }}>
        Events
      </Typography>

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: '#161b22',
          border: '1px solid #30363d',
        }}
      >
        <Typography variant="h6" sx={{ color: '#e6edf3', fontWeight: 700, mb: 2 }}>
          Create event
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            sx={fieldSx}
          />
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            sx={{ ...fieldSx, minWidth: 160 }}
          >
            {['MOVIE', 'CONCERT', 'SPORTS', 'THEATER'].map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            sx={fieldSx}
          />
          <TextField
            label="Venue"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            sx={fieldSx}
          />
          <TextField
            label="Poster URL"
            value={posterUrl}
            onChange={(e) => setPosterUrl(e.target.value)}
            fullWidth
            sx={fieldSx}
          />
          <TextField
            label="Show datetime (ISO)"
            value={showDate}
            onChange={(e) => setShowDate(e.target.value)}
            sx={fieldSx}
            helperText="e.g. 2026-09-25T14:00:00"
          />
          <TextField
            type="number"
            label="Total seats"
            value={totalSeats}
            onChange={(e) => setTotalSeats(Number(e.target.value))}
            sx={fieldSx}
          />
          <TextField
            type="number"
            label="Silver ₹"
            value={silver}
            onChange={(e) => setSilver(Number(e.target.value))}
            sx={fieldSx}
          />
          <TextField
            type="number"
            label="Gold ₹"
            value={gold}
            onChange={(e) => setGold(Number(e.target.value))}
            sx={fieldSx}
          />
          <FormControlLabel
            control={
              <Switch
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                color="error"
              />
            }
            label={<Typography sx={{ color: '#c9d1d9' }}>Featured</Typography>}
          />
        </Box>
        <Divider sx={{ my: 2, borderColor: '#30363d' }} />
        <Button variant="contained" color="error" disabled={saving} onClick={handleCreate}>
          {saving ? 'Creating…' : 'Create event + init seats'}
        </Button>
      </Paper>

      <Paper
        sx={{
          bgcolor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 3,
          overflow: 'auto',
        }}
      >
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#e50914' }} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#8b949e' }}>Title</TableCell>
                <TableCell sx={{ color: '#8b949e' }}>City</TableCell>
                <TableCell sx={{ color: '#8b949e' }}>Category</TableCell>
                <TableCell sx={{ color: '#8b949e' }}>Shows</TableCell>
                <TableCell sx={{ color: '#8b949e' }}>Featured</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell sx={{ color: '#e6edf3', fontWeight: 600 }}>
                    {e.title}
                  </TableCell>
                  <TableCell sx={{ color: '#c9d1d9' }}>{e.city}</TableCell>
                  <TableCell>
                    <Chip size="small" label={e.category} sx={categorySx} />
                  </TableCell>
                  <TableCell sx={{ color: '#c9d1d9' }}>
                    {e.showtimes?.length || 0}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={e.featured ? 'Yes' : 'No'}
                      sx={{
                        bgcolor: e.featured
                          ? 'rgba(229, 9, 20, 0.2)'
                          : 'rgba(139, 148, 158, 0.15)',
                        color: e.featured ? '#ff7b72' : '#c9d1d9',
                        fontWeight: 600,
                        border: e.featured
                          ? '1px solid #e50914'
                          : '1px solid #484f58',
                        '& .MuiChip-label': { color: 'inherit' },
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

export default AdminEvents;