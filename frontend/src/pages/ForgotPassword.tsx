import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import {
  Container, Paper, TextField, Button, Typography, Box,
  InputAdornment, Alert, CircularProgress, Chip,
} from '@mui/material';
import { Email, Movie, ArrowBack, CheckCircle } from '@mui/icons-material';
import authService from '../services/auth.service';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

const ForgotPassword: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await authService.forgotPassword(values.email);
        setSubmitted(true);
        toast.success('If your email exists, a reset link is on its way ✉️');
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          'Could not send reset link. Please try again.';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
  });

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
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], rotate: [0, -45, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', width: 440, height: 440, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(229,9,20,0.20) 0%, transparent 70%)',
          bottom: -140, left: -140,
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
                background: 'linear-gradient(90deg, #667eea, #e50914, #667eea)',
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
                    background: 'linear-gradient(135deg, #667eea 0%, #4a5bd4 100%)',
                    boxShadow: '0 12px 40px rgba(102,126,234,0.45)',
                    mb: 2,
                  }}
                >
                  <Movie sx={{ fontSize: 40, color: 'white' }} />
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
                Forgot Password?
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Enter your email and we'll send you a secure reset link.
              </Typography>

              <Chip
                label="Link expires in 15 minutes"
                size="small"
                sx={{
                  mt: 1.5,
                  bgcolor: 'rgba(102,126,234,0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(102,126,234,0.35)',
                  fontWeight: 600,
                }}
              />
            </Box>

            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 3,
                      px: 2,
                      borderRadius: 3,
                      background: 'rgba(16,185,129,0.10)',
                      border: '1px solid rgba(16,185,129,0.35)',
                      mb: 2,
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 56, color: '#10b981', mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#a7f3d0' }}>
                      Check your inbox
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.5 }}>
                      If an account exists for
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'white', fontWeight: 700, mb: 2, wordBreak: 'break-all' }}
                    >
                      {formik.values.email}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      You'll receive a link shortly. Check spam if you don't see it in 2 minutes.
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setSubmitted(false)}
                    sx={{
                      mb: 1.5,
                      py: 1.3,
                      borderRadius: 2,
                      textTransform: 'none',
                      borderColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': { borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.04)' },
                    }}
                  >
                    Send to a different email
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
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
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                          '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
                          '&.Mui-focused fieldset': { borderColor: '#667eea' },
                        },
                        '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.65)' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#a5b4fc' },
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

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading}
                      sx={{
                        py: 1.6,
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #4a5bd4 100%)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '1rem',
                        textTransform: 'none',
                        boxShadow: '0 12px 32px rgba(102,126,234,0.35)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4a5bd4 0%, #3d4bb8 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 16px 40px rgba(102,126,234,0.5)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send Reset Link'}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link
                to="/login"
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
                Back to Sign In
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

export default ForgotPassword;