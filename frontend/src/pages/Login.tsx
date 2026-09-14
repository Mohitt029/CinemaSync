// src/pages/Login.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';

import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';

import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Movie,
} from '@mui/icons-material';

import { useAuth } from '../hooks/useAuth';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

/** Supports roles: string[] and legacy role: string */
function isAdminUser(user: any): boolean {
  if (!user) return false;
  if (String(user.role || '').toUpperCase().includes('ADMIN')) return true;
  const roles: unknown = user.roles;
  if (Array.isArray(roles)) {
    return roles.some((r) => String(r).toUpperCase().includes('ADMIN'));
  }
  return false;
}

function readStoredUser(): any {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** After successful auth: ADMIN → /admin, else → from or / */
function redirectAfterAuth(
  navigate: ReturnType<typeof useNavigate>,
  from: string,
  userFromResponse?: any
) {
  const u = userFromResponse || readStoredUser();
  if (isAdminUser(u)) {
    localStorage.setItem('userRole', 'ADMIN');
    toast.success('Welcome, Admin');
    navigate('/admin', { replace: true });
    return;
  }
  localStorage.removeItem('userRole');
  navigate(from && from !== '/login' ? from : '/', { replace: true });
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';

  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLocalError(null);
        clearError();
        const result = await login(values);
        // login may return AuthResponse or void — prefer returned user
        const user =
          (result as any)?.user ||
          (result as any)?.data?.user ||
          readStoredUser();
        toast.success('Welcome back! 🎬');
        redirectAfterAuth(navigate, from, user);
      } catch (err: any) {
        const msg = typeof err === 'string' ? err : err?.message || 'Login failed';
        setLocalError(msg);
        toast.error(msg);
      }
    },
  });

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleGoogle = async (idToken: string) => {
    try {
      setGoogleLoading(true);
      setLocalError(null);
      clearError();
      const result = await loginWithGoogle(idToken);
      const user =
        (result as any)?.user ||
        (result as any)?.data?.user ||
        readStoredUser();
      toast.success('Signed in with Google 🎉');
      redirectAfterAuth(navigate, from, user);
    } catch (err: any) {
      const msg =
        typeof err === 'string' ? err : err?.message || 'Google sign-in failed';
      setLocalError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 20% 20%, #1a1a2e 0%, #0f0f1e 60%, #050510 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 60, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(229,9,20,0.20) 0%, transparent 70%)',
          top: -180,
          right: -160,
        }}
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], rotate: [0, -50, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          width: 460,
          height: 460,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(102,126,234,0.22) 0%, transparent 70%)',
          bottom: -140,
          left: -140,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, sm: 4.5 },
              borderRadius: 4,
              background: 'rgba(20, 20, 35, 0.85)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #e50914, #667eea, #e50914)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
              }}
            />

            <Box sx={{ textAlign: 'center', mb: 3, mt: 1 }}>
              <motion.div whileHover={{ scale: 1.08, rotate: 6 }} whileTap={{ scale: 0.94 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 1.5,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
                    boxShadow: '0 12px 40px rgba(229,9,20,0.45)',
                    mb: 2,
                  }}
                >
                  <Movie sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </motion.div>

              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  letterSpacing: -1,
                  background: 'linear-gradient(135deg, #ffffff 0%, #a7a7c7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                CinemaSync
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Welcome back. Sign in to continue your entertainment journey.
              </Typography>

              <Chip
                label="India's Premium Ticketing"
                size="small"
                sx={{
                  mt: 1.5,
                  bgcolor: 'rgba(229,9,20,0.15)',
                  color: '#ff6b6b',
                  border: '1px solid rgba(229,9,20,0.35)',
                  fontWeight: 600,
                }}
              />
            </Box>

            <AnimatePresence>
              {(error || localError) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert
                    severity="error"
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(229,9,20,0.12)',
                      color: '#ffb3b3',
                      border: '1px solid rgba(229,9,20,0.3)',
                      '& .MuiAlert-icon': { color: '#ff6b6b' },
                    }}
                  >
                    {error || localError}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <Box sx={{ mb: 2 }}>
              {googleLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                  <CircularProgress size={24} sx={{ color: '#e50914' }} />
                </Box>
              ) : (
                <GoogleSignInButton onCredential={handleGoogle} text="continue_with" />
              )}
            </Box>

            <Divider sx={{ my: 2, color: 'rgba(255,255,255,0.4)' }}>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  fontWeight: 600,
                }}
              >
                or email
              </Typography>
            </Divider>

            <form onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                id="email"
                name="email"
                label="Email"
                placeholder="you@example.com"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                    '&.Mui-focused fieldset': { borderColor: '#e50914' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#ff6b6b' },
                  '& .MuiFormHelperText-root': { color: '#ff8a8a' },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                    '&.Mui-focused fieldset': { borderColor: '#e50914' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#ff6b6b' },
                  '& .MuiFormHelperText-root': { color: '#ff8a8a' },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box sx={{ textAlign: 'right', mb: 3 }}>
                <Link
                  to="/forgot-password"
                  style={{
                    color: '#ff6b6b',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  py: 1.6,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 12px 32px rgba(229,9,20,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #b20710 0%, #8a050c 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 16px 40px rgba(229,9,20,0.5)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  style={{ color: '#ff6b6b', textDecoration: 'none', fontWeight: 700 }}
                >
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </Box>
  );
};

export default Login;