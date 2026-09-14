// frontend/src/pages/MyBookings.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  ConfirmationNumber,
  EventSeat,
  ArrowBack,
  Home,
} from '@mui/icons-material';
import bookingService from '../services/booking.service';
import { BookingResponse } from '../types/booking.types';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const statusColor = (s: string) => {
  if (s === 'CONFIRMED') return 'success';
  if (s === 'PENDING') return 'warning';
  if (s === 'CANCELLED') return 'error';
  return 'default';
};

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    bookingService
      .getUserBookings()
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleCancel = async (id: string) => {
    try {
      await bookingService.cancelBooking(id);
      setBookings((prev) =>
        prev.map((b) => (b.bookingId === id ? { ...b, status: 'CANCELLED' } : b))
      );
      toast.success('Booking cancelled');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Cancel failed');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
          Home
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          My Bookings
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
        </Typography>

        {bookings.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <ConfirmationNumber sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No bookings yet
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
              Browse events
            </Button>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {bookings.map((b) => (
              <Paper key={b.bookingId} sx={{ p: 3, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {b.movieTitle || 'Event'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ref: {b.bookingReference}
                    </Typography>
                    {b.theatreName && (
                      <Typography variant="body2" color="text.secondary">
                        {b.theatreName}
                      </Typography>
                    )}
                  </Box>
                  <Chip label={b.status} color={statusColor(b.status) as any} size="small" sx={{ fontWeight: 700 }} />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                  {(b.seats || []).map((s) => (
                    <Chip
                      key={s.seatId}
                      size="small"
                      icon={<EventSeat />}
                      label={`${s.rowName}${s.number} · ${s.category}`}
                    />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>
                    ₹{(b.finalAmount ?? b.totalAmount ?? 0).toFixed(0)}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/booking-confirmation/${b.bookingId}`)}
                    >
                      View
                    </Button>
                    {b.status !== 'CANCELLED' && (
                      <Button size="small" color="error" onClick={() => handleCancel(b.bookingId)}>
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </Box>
  );
};

export default MyBookings;