// src/components/layout/Footer.tsx
import React from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  YouTube,
  LinkedIn,
  LocalPhone,
  Email,
  LocationOn,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({
  to,
  children,
}) => (
  <MuiLink
    component={RouterLink}
    to={to}
    color="inherit"
    underline="hover"
    sx={{ display: 'block', py: 0.25, '&:hover': { color: '#e50914' } }}
  >
    {children}
  </MuiLink>
);

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1a1a2e',
        color: 'rgba(255,255,255,0.7)',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              Cinema<span style={{ color: '#e50914' }}>Sync</span>
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, maxWidth: 360 }}>
              Book movies, concerts, sports and theatre across India. Live seat maps,
              secure Razorpay checkout, and real-time availability.
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[
                { icon: <Facebook />, href: 'https://facebook.com' },
                { icon: <Twitter />, href: 'https://twitter.com' },
                { icon: <Instagram />, href: 'https://instagram.com' },
                { icon: <YouTube />, href: 'https://youtube.com' },
                { icon: <LinkedIn />, href: 'https://linkedin.com' },
              ].map((s, i) => (
                <IconButton
                  key={i}
                  component="a"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{ color: 'white', '&:hover': { color: '#e50914' } }}
                >
                  {s.icon}
                </IconButton>
              ))}
            </Box>
          </Box>

          <Box sx={{ flex: { xs: '1 1 40%', md: '1 1 15%' } }}>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Discover
            </Typography>
            <FooterLink to="/">Home</FooterLink>
            <FooterLink to="/events">All events</FooterLink>
            <FooterLink to="/events/category/MOVIE">Movies</FooterLink>
            <FooterLink to="/events/category/CONCERT">Concerts</FooterLink>
            <FooterLink to="/events/category/SPORTS">Sports</FooterLink>
            <FooterLink to="/events/category/THEATER">Theater</FooterLink>
          </Box>

          <Box sx={{ flex: { xs: '1 1 40%', md: '1 1 15%' } }}>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Account
            </Typography>
            <FooterLink to="/favorites">My favorites</FooterLink>
            <FooterLink to="/login">Sign in</FooterLink>
            <FooterLink to="/register">Register</FooterLink>
            <FooterLink to="/profile">Profile</FooterLink>
          </Box>

          <Box sx={{ flex: { xs: '1 1 40%', md: '1 1 15%' } }}>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Support
            </Typography>
            <FooterLink to="/help">Help center</FooterLink>
            <FooterLink to="/faq">FAQ</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/cancellation">Cancellations</FooterLink>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 20%' } }}>
            <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalPhone sx={{ fontSize: 18 }} />
                <MuiLink href="tel:+9118001234567" color="inherit" underline="hover">
                  1800-123-4567
                </MuiLink>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 18 }} />
                <MuiLink href="mailto:support@cinemasync.com" color="inherit" underline="hover">
                  support@cinemasync.com
                </MuiLink>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOn sx={{ fontSize: 18, mt: 0.25 }} />
                <Typography variant="body2">
                  PVR Select Citywalk · Saket, New Delhi &amp; pan-India venues
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Typography variant="body2">© {new Date().getFullYear()} CinemaSync. All rights reserved.</Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <FooterLink to="/privacy">Privacy</FooterLink>
            <FooterLink to="/terms">Terms</FooterLink>
            <FooterLink to="/cookies">Cookies</FooterLink>
            <FooterLink to="/admin">Admin</FooterLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;