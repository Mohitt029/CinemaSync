// frontend/src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './store';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import HomePage from './pages/Events';
import EventsList from './pages/EventsList';
import EventDetail from './pages/EventDetail';
import Booking from './pages/Booking';
import BookingConfirmation from './pages/BookingConfirmation';
import Favorites from './pages/Favorites';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import './assets/styles/global.css';
import StaticPage from './pages/StaticPage';
import AdminApp from './pages/admin/AdminApp';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#e50914', light: '#ff4d4d', dark: '#b20710' },
    secondary: { main: '#221f1f', light: '#4a4848', dark: '#000000' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 20px rgba(229, 9, 20, 0.3)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' },
      },
    },
  },
});

const hasValidSession = (): boolean => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return !payload.exp || Date.now() < payload.exp * 1000;
  } catch {
    return false;
  }
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  if (!hasValidSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (hasValidSession()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const withLayout = (page: React.ReactNode) => <Layout>{page}</Layout>;

function App() {
  return (
    <Provider store={store}>
      <HelmetProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  borderRadius: 12,
                  background: '#1f1f2e',
                  color: '#fff',
                  fontWeight: 500,
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
            <Routes>
              {/* Auth — public only */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />
              {/* Forgot password — public, no login required, not bounced if logged in */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Public browse routes */}
              <Route path="/" element={withLayout(<HomePage />)} />
              <Route path="/events/all" element={withLayout(<EventsList />)} />
              <Route path="/events/category/:category" element={withLayout(<EventsList />)} />
              <Route path="/events/:id" element={withLayout(<EventDetail />)} />

              {/* Protected */}
              <Route
                path="/booking/:showId"
                element={<ProtectedRoute>{withLayout(<Booking />)}</ProtectedRoute>}
              />
              <Route
                path="/booking-confirmation/:bookingId"
                element={
                  <ProtectedRoute>
                    {withLayout(<BookingConfirmation />)}
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={<ProtectedRoute>{withLayout(<Favorites />)}</ProtectedRoute>}
              />
              <Route
                path="/my-bookings"
                element={<ProtectedRoute>{withLayout(<MyBookings />)}</ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute>{withLayout(<Profile />)}</ProtectedRoute>}
              />
              <Route path="/help" element={<Layout><StaticPage pageKey="help" /></Layout>} />
<Route path="/faq" element={<Layout><StaticPage pageKey="faq" /></Layout>} />
<Route path="/contact" element={<Layout><StaticPage pageKey="contact" /></Layout>} />
<Route path="/cancellation" element={<Layout><StaticPage pageKey="cancellation" /></Layout>} />
<Route path="/privacy" element={<Layout><StaticPage pageKey="privacy" /></Layout>} />
<Route path="/terms" element={<Layout><StaticPage pageKey="terms" /></Layout>} />
<Route path="/cookies" element={<Layout><StaticPage pageKey="cookies" /></Layout>} />
<Route path="/admin/*" element={<AdminApp />} />
              <Route
                path="/settings"
                element={<ProtectedRoute>{withLayout(<Settings />)}</ProtectedRoute>}
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </HelmetProvider>
    </Provider>
  );
}

export default App;