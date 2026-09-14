// src/pages/StaticPage.tsx
import React from 'react';
import { Container, Typography, Paper, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const copy: Record<string, { title: string; body: string }> = {
  help: {
    title: 'Help Center',
    body: 'Select an event → choose showtime → lock seats (about 10 minutes) → pay with Razorpay → confirmation. Grey seats are locked or booked by others.',
  },
  faq: {
    title: 'FAQ',
    body: 'Locks expire if you do not pay in time. Confirmed bookings follow the cancellation policy. Payments run through Razorpay; card details are never stored on CinemaSync.',
  },
  contact: {
    title: 'Contact Us',
    body: 'Email support@cinemasync.com or call 1800-123-4567 (9 AM – 9 PM IST).',
  },
  cancellation: {
    title: 'Cancellation Policy',
    body: 'PENDING holds release on cancel or lock expiry. CONFIRMED tickets may be cancelled up to 2 hours before showtime when enabled; refunds follow Razorpay rules.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'We store account and booking data to run the service. Payment card data is processed by Razorpay only.',
  },
  terms: {
    title: 'Terms of Service',
    body: 'By using CinemaSync you agree to fair use of seat locks and accurate account information.',
  },
  cookies: {
    title: 'Cookie Policy',
    body: 'We use browser storage for auth tokens, favorites, and seat-lock timers needed for booking.',
  },
};

interface Props {
  pageKey: string;
}

const StaticPage: React.FC<Props> = ({ pageKey }) => {
  const navigate = useNavigate();
  const c = copy[pageKey] || { title: 'Page', body: 'Content coming soon.' };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
          {c.title}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.75 }}>
          {c.body}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => navigate('/')}>
            Home
          </Button>
          <Button variant="outlined" onClick={() => navigate('/events')}>
            Browse events
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default StaticPage;