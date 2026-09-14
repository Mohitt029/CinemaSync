import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import {
  Container, Paper, TextField, Button, Typography, Box,
  InputAdornment, IconButton, Alert, CircularProgress, Chip,
} from '@mui/material';
import {
  Lock, Visibility, VisibilityOff, Movie, ArrowBack, CheckCircle, ErrorOutlined,
} from '@mui/icons-material';
import authService from '../services/auth.service';

const validationSchema = Yup.object({
  password: Yup.string()
    .min(8, 'At least 8 characters')
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
      'Needs a letter, number, and special character'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password required'),
});

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema,
    onSubmit: async (values) => {
      setApiError(null);
      setLoading(true);
      try {
        await authService.resetPassword(token, values.password);
        setSuccess(true);
        toast.success('Password updated! You can now sign in 🎉');
        setTimeout(() => navigate('/login'), 2200);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Could not reset password. The link may have expired.';
        setApiError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
  });

  const tokenMissing = !token;

  useEffect(() => {
    if (tokenMissing) {
      setApiError('This reset link is missing a token. Please request a new one.');
    }
  }, [tokenMissing]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 30% 20%, #1a1a2e 0%, #0f0f1e 60%, #050510 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 60, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102,126,234,0.22) 0%, transparent 70%)',
          top: -160, right: -160,
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
                position: 'absolute', top: 0, left: 0, right: 0, height: 4,
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
                  <Lock sx={{ fontSize: 40, color: 'white' }} />
                </Box>
              </motion.div>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  background: 'linear-gradient(135deg, #ffffff 0%, #a7a7c7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                Set a New Password
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Choose a strong password to secure your CinemaSync account.
              </Typography>

              <Chip
                label="Min 8 chars · letter · number · special"
                size="small"
                sx={{
                  mt: 1.5,
                  bgcolor: 'rgba(229,9,20,0.15)',
                  color: '#ff8a8a',
                  border: '1px solid rgba(229,9,20,0.35)',
                  fontWeight: 600,
                }}
              />
            </Box>

            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert
                    severity="error"
                    icon={<ErrorOutlined />}
                    sx={{
                      mb: 2, borderRadius: 2,
                      bgcolor: 'rgba(229,9,20,0.12)',
                      color: '#ffb3b3',
                      border: '1px solid rgba(229,9,20,0.3)',
                      '& .MuiAlert-icon': { color: '#ff6b6b' },
                    }}
                  >
                    {apiError}
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {success ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 3,
                  px: 2,
                  borderRadius: 3,
                  background: 'rgba(16,185,129,0.10)',
                  border: '1px solid rgba(16,185,129,0.35)',
                }}
              >
                <CheckCircle sx={{ fontSize: 56, color: '#10b981', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#a7f3d0' }}>
                  Password updated
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Redirecting to sign in…
                </Typography>
              </Box>
            ) : (
              <form onSubmit={formik.handleSubmit}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
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

                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm New Password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                  sx={{
                    mb: 3,
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
                            onClick={() => setShowConfirm(!showConfirm)}
                            edge="end"
                            sx={{ color: 'rgba(255,255,255,0.6)' }}
                          >
                            {showConfirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || tokenMissing}
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
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Update Password'}
                </Button>
              </form>
            )}

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link
                to="/forgot-password"
                style={{
                  color: '#a5b4fc',
                  textDecoration: 'none',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.9rem',
                }}
              >
                <ArrowBack sx={{ fontSize: 16 }} />
                Request a new link
              </Link>
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

export default ResetPassword;