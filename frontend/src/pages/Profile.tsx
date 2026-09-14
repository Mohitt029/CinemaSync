import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, Avatar, Button,
  Divider, Stack, Chip,
} from '@mui/material';
import {
  ArrowBack, ConfirmationNumber, Favorite, Settings as SettingsIcon,
  Logout, VerifiedUser, Google as GoogleIcon,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const name = user?.name || user?.email || 'User';
  const email = user?.email || '';
  const initial = String(name).charAt(0).toUpperCase();
  const isGoogle = user?.authProvider === 'GOOGLE';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="sm">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
          Home
        </Button>

        <Paper
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            background: 'linear-gradient(160deg, #ffffff 0%, #fafbff 100%)',
          }}
        >
          <Avatar
            src={user?.avatarUrl}
            sx={{
              width: 96,
              height: 96,
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.main',
              fontSize: 40,
              fontWeight: 800,
              border: '4px solid white',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            {initial}
          </Avatar>

          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {name}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5 }}>
            {email}
          </Typography>

          {isGoogle && (
            <Chip
              icon={<GoogleIcon sx={{ color: '#4285f4 !important' }} />}
              label="Signed in with Google"
              size="small"
              sx={{
                bgcolor: 'rgba(66,133,244,0.1)',
                color: '#1a73e8',
                fontWeight: 600,
                mb: 1,
              }}
            />
          )}

          {user?.emailVerified && (
            <Chip
              icon={<VerifiedUser sx={{ fontSize: 16 }} />}
              label="Email verified"
              size="small"
              color="success"
              variant="outlined"
              sx={{ ml: 1, mb: 1 }}
            />
          )}

          <Divider sx={{ my: 3 }} />

          <Stack spacing={1.5}>
            <Button
              startIcon={<ConfirmationNumber />}
              onClick={() => navigate('/my-bookings')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.2 }}
            >
              My Bookings
            </Button>
            <Button
              startIcon={<Favorite />}
              onClick={() => navigate('/favorites')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.2 }}
            >
              Favorites
            </Button>
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/settings')}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.2 }}
            >
              Settings
            </Button>
            <Button
              startIcon={<Logout />}
              color="error"
              onClick={handleLogout}
              sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 1.2 }}
            >
              Logout
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile;