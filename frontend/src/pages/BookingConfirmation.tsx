// frontend/src/pages/BookingConfirmation.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  CheckCircle,
  Home,
  ConfirmationNumber,
  EventSeat,
  ContentCopy,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import bookingService from '../services/booking.service';
import { BookingResponse } from '../types/booking.types';
import toast from 'react-hot-toast';

const BookingConfirmation: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    bookingService
      .getBooking(bookingId)
      .then(setBooking)
      .catch(() => toast.error('Could not load booking'))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const copyRef = () => {
    if (booking?.bookingReference) {
      navigator.clipboard.writeText(booking.bookingReference);
      toast.success('Reference copied');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!booking) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6">Booking not found</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Go home
        </Button>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 6,
        background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #0f766e 100%)',
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120 }}
        >
          <Paper
            elevation={0}
            sx={{ p: 4, borderRadius: 4, textAlign: 'center', overflow: 'hidden', position: 'relative' }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 6,
                background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)',
              }}
            />

            <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800 }}>
              Booking Confirmed!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your tickets are ready. Show this reference at the venue.
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                bgcolor: 'grey.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <ConfirmationNumber color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                {booking.bookingReference}
              </Typography>
              <Button size="small" onClick={copyRef} startIcon={<ContentCopy />}>
                Copy
              </Button>
            </Paper>

            <Chip label={booking.status} color="success" sx={{ mb: 3, fontWeight: 700 }} />

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1.5} sx={{ textAlign: 'left', mb: 3 }}>
              {booking.movieTitle && (
                <Typography>
                  <strong>Event:</strong> {booking.movieTitle}
                </Typography>
              )}
              {booking.theatreName && (
                <Typography>
                  <strong>Venue:</strong> {booking.theatreName}
                </Typography>
              )}
              {booking.showDateTime && (
                <Typography>
                  <strong>Show:</strong> {new Date(booking.showDateTime).toLocaleString()}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 700 }}>Seats:</Typography>
                {(booking.seats || []).map((s) => (
                  <Chip
                    key={s.seatId}
                    size="small"
                    icon={<EventSeat />}
                    label={`${s.rowName}${s.number} · ${s.category}`}
                  />
                ))}
              </Box>
              <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                Paid ₹{(booking.finalAmount ?? booking.totalAmount ?? 0).toFixed(0)}
              </Typography>
              {booking.paymentId && (
                <Typography variant="caption" color="text.secondary">
                  Payment ID: {booking.paymentId}
                </Typography>
              )}
            </Stack>

            <Box
              sx={{
                width: 140,
                height: 140,
                mx: 'auto',
                mb: 3,
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                fontFamily: 'monospace',
                fontSize: 11,
                p: 1,
                wordBreak: 'break-all',
              }}
            >
              {booking.bookingReference}
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ justifyContent: 'center' }}
            >
              <Button
                variant="contained"
                startIcon={<Home />}
                onClick={() => navigate('/')}
                sx={{ borderRadius: 2 }}
              >
                Home
              </Button>
              <Button variant="outlined" onClick={() => navigate('/')} sx={{ borderRadius: 2 }}>
                Browse more
              </Button>
            </Stack>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default BookingConfirmation;