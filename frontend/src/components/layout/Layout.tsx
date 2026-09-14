// src/components/layout/Layout.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  AppBar, Toolbar, Typography, Box, Button, IconButton, Container,
  Avatar, Menu, MenuItem, Badge, InputBase, alpha, styled,
} from '@mui/material';
import {
  Search, Notifications, Person, Movie, Favorite, Logout, Settings,
  LocalMovies, Theaters, ConfirmationNumber, SportsBasketball, TheaterComedy,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import favoritesService from '../../services/favorites.service';
import Footer from './Footer';
import ChatBot from '../chat/ChatBot';

const SearchBar = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favCount, setFavCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  // Live favorites from service (per-user, cross-tab safe)
  useEffect(() => {
    setFavCount(favoritesService.getFavorites().length);
    const unsubscribe = favoritesService.subscribe((list) => {
      setFavCount(list.length);
    });
    return () => unsubscribe();
  }, []);

  const syncNotifs = useCallback(() => {
    try {
      const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
      setNotifCount(
        Array.isArray(notifs) ? notifs.filter((n: any) => !n.read).length : 0
      );
    } catch {
      setNotifCount(0);
    }
  }, []);

  useEffect(() => {
    syncNotifs();
    const iv = setInterval(syncNotifs, 5000);
    window.addEventListener('focus', syncNotifs);
    window.addEventListener('storage', syncNotifs);
    return () => {
      clearInterval(iv);
      window.removeEventListener('focus', syncNotifs);
      window.removeEventListener('storage', syncNotifs);
    };
  }, [syncNotifs]);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
    favoritesService.clearForUser();
    navigate('/login');
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNotificationsClick = () => {
    try {
      const notifs = JSON.parse(localStorage.getItem('notifications') || '[]');
      const marked = (Array.isArray(notifs) ? notifs : []).map((n: any) => ({
        ...n,
        read: true,
      }));
      localStorage.setItem('notifications', JSON.stringify(marked));
      setNotifCount(0);
    } catch {
      /* ignore */
    }
    navigate('/my-bookings');
  };

  const navItems = [
    { label: 'Movies', path: '/events/category/MOVIE', icon: <LocalMovies /> },
    { label: 'Concerts', path: '/events/category/CONCERT', icon: <Theaters /> },
    { label: 'Sports', path: '/events/category/SPORTS', icon: <SportsBasketball /> },
    { label: 'Theater', path: '/events/category/THEATER', icon: <TheaterComedy /> },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: '#1a1a2e',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: 72 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', mr: 4 }}
              onClick={() => navigate('/')}
            >
              <Movie sx={{ color: '#e50914', fontSize: 32, mr: 1 }} />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  color: 'white',
                  '& span': { color: '#e50914' },
                }}
              >
                Cinema<span>Sync</span>
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  startIcon={item.icon}
                  sx={{
                    color: location.pathname.includes(item.path) ? '#e50914' : 'white',
                    '&:hover': { backgroundColor: 'rgba(229, 9, 20, 0.1)' },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            <SearchBar sx={{ flex: 1, maxWidth: 500 }}>
              <SearchIconWrapper>
                <Search />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search events, movies, venues, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </SearchBar>

            <Box sx={{ flexGrow: 1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                color="inherit"
                size="large"
                onClick={() => navigate('/favorites')}
                sx={{ '&:hover': { color: '#e50914' } }}
              >
                <Badge
                  badgeContent={favCount}
                  color="error"
                  invisible={favCount === 0}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '10px',
                      height: '18px',
                      minWidth: '18px',
                    },
                  }}
                >
                  <Favorite />
                </Badge>
              </IconButton>

              {isAuthenticated ? (
                <>
                  <IconButton color="inherit" size="large" onClick={handleNotificationsClick}>
                    <Badge
                      badgeContent={notifCount}
                      color="error"
                      invisible={notifCount === 0}
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '10px',
                          height: '18px',
                          minWidth: '18px',
                        },
                      }}
                    >
                      <Notifications />
                    </Badge>
                  </IconButton>

                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    <Avatar
                      src={(user as any)?.avatarUrl}
                      sx={{
                        bgcolor: '#e50914',
                        width: 36,
                        height: 36,
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 },
                      }}
                      onClick={handleMenuOpen}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                      slotProps={{
                        paper: {
                          sx: {
                            mt: 1.5,
                            minWidth: 200,
                            borderRadius: 2,
                            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
                          },
                        },
                      }}
                    >
                      <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                        <Person sx={{ mr: 2 }} /> Profile
                      </MenuItem>
                      <MenuItem onClick={() => { handleMenuClose(); navigate('/my-bookings'); }}>
                        <ConfirmationNumber sx={{ mr: 2 }} /> My Bookings
                      </MenuItem>
                      <MenuItem onClick={() => { handleMenuClose(); navigate('/favorites'); }}>
                        <Favorite sx={{ mr: 2 }} /> Favorites
                      </MenuItem>
                      <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                        <Settings sx={{ mr: 2 }} /> Settings
                      </MenuItem>
                      <MenuItem onClick={handleLogout} sx={{ color: '#e50914' }}>
                        <Logout sx={{ mr: 2 }} /> Logout
                      </MenuItem>
                    </Menu>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      '&:hover': { borderColor: 'white' },
                    }}
                    onClick={() => navigate('/login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: '#e50914', '&:hover': { bgcolor: '#b20710' } }}
                    onClick={() => navigate('/register')}
                  >
                    Register
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Box component="main" sx={{ flex: 1, bgcolor: '#f8f9fa' }}>
        {children}
      </Box>

      <Footer />
      <ChatBot />
    </Box>
  );
};

export default Layout;