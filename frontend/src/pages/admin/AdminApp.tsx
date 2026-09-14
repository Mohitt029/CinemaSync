// src/pages/admin/AdminApp.tsx
import React from 'react';
import {
  Routes,
  Route,
  Navigate,
  Link as RouterLink,
  useLocation,
} from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
  CssBaseline,
} from '@mui/material';
import {
  Dashboard,
  Event,
  ConfirmationNumber,
  MeetingRoom,
  Home,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import AdminEvents from './AdminEvents';
import AdminBookings from './AdminBookings';
import AdminSeats from './AdminSeats';

const drawerWidth = 240;

const AdminApp: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const role =
    (user as any)?.role ||
    (user as any)?.roles?.[0] ||
    localStorage.getItem('userRole') ||
    '';
  const isAdmin = String(role).toUpperCase().includes('ADMIN');

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <Container sx={{ py: 8 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Admin access required
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Sign in with an account that has role ADMIN. In MongoDB auth DB set{' '}
          <code>role: &quot;ADMIN&quot;</code> on your user document.
        </Typography>
      </Container>
    );
  }

  const nav = [
    { to: '/admin', label: 'Dashboard', icon: <Dashboard />, end: true },
    { to: '/admin/events', label: 'Events', icon: <Event /> },
    { to: '/admin/bookings', label: 'Bookings', icon: <ConfirmationNumber /> },
    { to: '/admin/seats', label: 'Seat init', icon: <MeetingRoom /> },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f1117' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: 1201,
          bgcolor: '#161b22',
          borderBottom: '1px solid #30363d',
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1 }}>
            Cinema<span style={{ color: '#e50914' }}>Sync</span> Admin
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {(user as any)?.email || (user as any)?.name || 'Admin'}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#161b22',
            color: '#c9d1d9',
            borderRight: '1px solid #30363d',
          },
        }}
      >
        <Toolbar />
        <List>
          {nav.map((item) => {
            const selected = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                selected={selected}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'rgba(229,9,20,0.15)',
                    borderLeft: '3px solid #e50914',
                  },
                }}
              >
                <ListItemIcon sx={{ color: selected ? '#e50914' : '#8b949e' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
          <ListItemButton component={RouterLink} to="/">
            <ListItemIcon sx={{ color: '#8b949e' }}>
              <Home />
            </ListItemIcon>
            <ListItemText primary="Back to site" />
          </ListItemButton>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, width: `calc(100% - ${drawerWidth}px)` }}>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="seats" element={<AdminSeats />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminApp;