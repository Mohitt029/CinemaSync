import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import {
  Container, Paper, TextField, Button, Typography, Box,
  InputAdornment, IconButton, Alert, CircularProgress,
  Stepper, Step, StepLabel, Divider,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Email, Lock, Person, Phone, Movie,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

const validationSchema = Yup.object({
  name: Yup.string().min(2).required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string().matches(/^[0-9]{10}$/, 'Must be 10 digits').optional(),
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

const inputSx = {
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
};

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '', email: '', phone: '', password: '', confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLocalError(null);
        clearError();
        await register(values);
        toast.success('Account created! 🎉');
        navigate('/');
      } catch (err: any) {
        const msg = typeof err === 'string' ? err : err?.message || 'Registration failed';
        setLocalError(msg);
        toast.error(msg);
      }
    },
  });

  const handleGoogle = async (idToken: string) => {
    try {
      setGoogleLoading(true);
      setLocalError(null);
      clearError();
      await loginWithGoogle(idToken);
      toast.success('Signed up with Google 🎉');
      navigate('/');
    } catch (err: any) {
      const msg = typeof err === 'string' ? err : err?.message || 'Google sign-up failed';
      setLocalError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const steps = ['Personal', 'Security'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 80% 20%, #2b1055 0%, #121026 60%, #050510 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.18, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', width: 560, height: 560, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(117, 78, 249, 0.22) 0%, transparent 70%)',
          top: -200, left: -200,
        }}
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], rotate: [0, -45, 0] }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(229,9,20,0.22) 0%, transparent 70%)',
          bottom: -160, right: -140,
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
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
                background: 'linear-gradient(90deg, #754ef9, #e50914, #754ef9)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s linear infinite',
              }}
            />

            <Box sx={{ textAlign: 'center', mb: 3, mt: 1 }}>
              <motion.div whileHover={{ scale: 1.08, rotate: -6 }} whileTap={{ scale: 0.94 }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    p: 1.5,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #754ef9 0%, #4a2dd4 100%)',
                    boxShadow: '0 12px 40px rgba(117,78,249,0.45)',
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
                Create Account
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Join CinemaSync and never miss a show.
              </Typography>
            </Box>

            <Stepper
              activeStep={activeStep}
              sx={{
                mb: 3,
                '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.5)', fontWeight: 600 },
                '& .MuiStepLabel-label.Mui-active': { color: '#ff6b6b' },
                '& .MuiStepLabel-label.Mui-completed': { color: '#754ef9' },
                '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.15)' },
                '& .MuiStepIcon-root.Mui-active': { color: '#e50914' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#754ef9' },
                '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>

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
                      mb: 2, borderRadius: 2,
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

            {activeStep === 0 && (
              <>
                <Box sx={{ mb: 2 }}>
                  {googleLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                      <CircularProgress size={24} sx={{ color: '#e50914' }} />
                    </Box>
                  ) : (
                    <GoogleSignInButton onCredential={handleGoogle} text="signup_with" />
                  )}
                </Box>

                <Divider sx={{ my: 2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: 2,
                      fontWeight: 600,
                    }}
                  >
                    or fill details
                  </Typography>
                </Divider>
              </>
            )}

            <form onSubmit={formik.handleSubmit}>
              {activeStep === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <TextField
                    fullWidth id="name" name="name" label="Full Name"
                    placeholder="Mohit Sharma"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    sx={inputSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    fullWidth id="email" name="email" label="Email"
                    placeholder="you@example.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    sx={inputSx}
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
                    fullWidth id="phone" name="phone" label="Phone (optional)"
                    placeholder="9876543210"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    helperText={formik.touched.phone && formik.errors.phone}
                    sx={inputSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone sx={{ color: 'rgba(255,255,255,0.5)' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                    onClick={async () => {
  const errs = await formik.validateForm();
  const fields: Array<keyof typeof formik.values> = ['name', 'email', 'phone'];
  const step0Errs = fields.filter((k) => (errs as any)[k]);
  formik.setTouched(
    { name: true, email: true, phone: true },
    true
  );
  if (step0Errs.length === 0) setActiveStep(1);
}}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        background: 'linear-gradient(135deg, #754ef9 0%, #4a2dd4 100%)',
                        textTransform: 'none',
                        fontWeight: 700,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 25px rgba(117,78,249,0.5)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Continue
                    </Button>
                  </Box>
                </motion.div>
              )}

              {activeStep === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <TextField
                    fullWidth id="password" name="password" label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    sx={inputSx}
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
                    fullWidth id="confirmPassword" name="confirmPassword" label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    sx={inputSx}
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

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveStep(0)}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        borderColor: 'rgba(255,255,255,0.25)',
                        color: 'white',
                        '&:hover': { borderColor: 'rgba(255,255,255,0.5)' },
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      sx={{
                        flex: 2,
                        py: 1.6,
                        borderRadius: 2.5,
                        background: 'linear-gradient(135deg, #754ef9 0%, #e50914 100%)',
                        color: 'white',
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: '0 12px 32px rgba(117,78,249,0.35)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 16px 40px rgba(117,78,249,0.5)',
                        },
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
                    </Button>
                  </Box>
                </motion.div>
              )}
            </form>

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{ color: '#ff6b6b', textDecoration: 'none', fontWeight: 700 }}
                >
                  Sign in
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

export default Register;