// src/pages/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Chip, CircularProgress } from '@mui/material';
import axios from 'axios';

const cardSx = {
  p: 3,
  borderRadius: 3,
  bgcolor: '#161b22',
  border: '1px solid #30363d',
  color: '#e6edf3',
};

const AdminDashboard: React.FC = () => {
  const [booking, setBooking] = useState<any>(null);
  const [eventTotal, setEventTotal] = useState<string | number>('…');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      'X-User-Role': 'ADMIN',
    };
    Promise.allSettled([
      axios.get('http://localhost:8084/api/admin/dashboard', { headers }),
      axios.get('http://localhost:8082/api/events?page=0&size=1'),
    ]).then(([b, e]) => {
      if (b.status === 'fulfilled') setBooking(b.value.data);
      else setBooking({ totalBookings: '—', confirmed: '—', pending: '—', revenueInr: null });
      if (e.status === 'fulfilled') {
        setEventTotal(e.value.data?.totalElements ?? e.value.data?.content?.length ?? '—');
      }
      setLoading(false);
    });
  }, []);

  const tiles = [
    { label: 'Events', value: eventTotal, color: '#58a6ff' },
    { label: 'Confirmed', value: booking?.confirmed ?? '…', color: '#3fb950' },
    { label: 'Pending holds', value: booking?.pending ?? '…', color: '#d29922' },
    {
      label: 'Revenue',
      value:
        booking?.revenueInr != null
          ? `₹${Number(booking.revenueInr).toLocaleString('en-IN')}`
          : '…',
      color: '#e50914',
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#e50914' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#e6edf3', mb: 1 }}>
        Dashboard
      </Typography>
      <Typography sx={{ color: '#8b949e', mb: 3 }}>
        Ops overview · booking-service + event-service
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {tiles.map((t) => (
          <Paper key={t.label} sx={{ ...cardSx, flex: '1 1 200px', minWidth: 180 }}>
            <Typography variant="caption" sx={{ color: '#8b949e' }}>
              {t.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: t.color, mt: 1 }}>
              {t.value}
            </Typography>
          </Paper>
        ))}
      </Box>
      <Paper sx={{ ...cardSx, mt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          How new events get seats
        </Typography>
        <Typography variant="body2" sx={{ color: '#8b949e', mb: 2, lineHeight: 1.7 }}>
          <strong style={{ color: '#e6edf3' }}>POST /api/events</strong> creates the event and
          showtimes. Event-service then calls booking-service{' '}
          <code style={{ color: '#58a6ff' }}>POST /api/seats/init?showId=…</code> for each
          showtime so the matrix exists before users book.
        </Typography>
        <Chip label="Create event → auto seat matrix" sx={{ mr: 1, mb: 1, bgcolor: '#21262d', color: '#c9d1d9' }} />
        <Chip label="Admin can re-init from Seat init" sx={{ mr: 1, mb: 1, bgcolor: '#21262d', color: '#c9d1d9' }} />
        <Chip label="Pay → confirm → BOOKED" sx={{ mb: 1, bgcolor: '#21262d', color: '#c9d1d9' }} />
      </Paper>
    </Box>
  );
};

export default AdminDashboard;