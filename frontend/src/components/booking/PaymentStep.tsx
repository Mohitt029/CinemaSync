// frontend/src/components/booking/PaymentStep.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  CreditCard,
  Lock,
  CheckCircle,
  EventSeat,
  Payment,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getPaymentStatus } from '../../services/payment.service';

export interface PaymentStepProps {
  amount: number;
  seatLabels: string[];
  eventTitle: string;
  timeRemaining?: number;
  isLoading?: boolean;
  /** Parent: create PENDING booking + Razorpay payWithRazorpay */
  onPay: () => Promise<void>;
  onBack: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const PaymentStep: React.FC<PaymentStepProps> = ({
  amount,
  seatLabels,
  eventTitle,
  timeRemaining,
  isLoading,
  onPay,
  onBack,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPaymentStatus()
      .then((s) => {
        if (!cancelled) setConfigured(!!s.razorpayConfigured);
      })
      .catch(() => {
        if (!cancelled) setConfigured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setProcessing(true);
    try {
      await onPay();
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        'Payment failed. Please try again.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const busy = isLoading || processing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
          gap: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
              }}
            >
              <Lock fontSize="small" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Secure Checkout
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Razorpay · test mode · no real charge with test keys
              </Typography>
            </Box>
          </Box>

          {typeof timeRemaining === 'number' && timeRemaining > 0 && (
            <Alert
              severity={timeRemaining < 60 ? 'error' : 'info'}
              sx={{ mb: 2, borderRadius: 2 }}
            >
              Complete payment in <strong>{formatTime(timeRemaining)}</strong> or
              seats may be released.
            </Alert>
          )}

          {configured === false && (
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              Razorpay is not configured on the server. Set{' '}
              <strong>RAZORPAY_KEY_ID</strong> /{' '}
              <strong>RAZORPAY_KEY_SECRET</strong> and restart booking-service.
            </Alert>
          )}

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Alert severity="info" icon={<Payment />} sx={{ mb: 2, borderRadius: 2 }}>
            You will pay via <strong>Razorpay Checkout</strong> (Card / UPI /
            Netbanking). Test card:{' '}
            <strong>4111 1111 1111 1111</strong>, any future expiry, any CVV.
          </Alert>

          <Box
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <CreditCard color="action" />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Card, UPI & Netbanking
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Handled securely by Razorpay modal — no card data stored here
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="outlined"
              onClick={onBack}
              disabled={busy}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={busy || configured === false}
              onClick={handleSubmit}
              sx={{
                borderRadius: 2,
                py: 1.4,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
                boxShadow: '0 8px 24px rgba(229, 9, 20, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #b20710 0%, #8a050c 100%)',
                },
              }}
            >
              {busy ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Pay ₹${amount.toFixed(0)} with Razorpay`
              )}
            </Button>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            height: 'fit-content',
            background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)',
            color: 'white',
          }}
        >
          <Typography variant="subtitle2" sx={{ opacity: 0.7, mb: 1 }}>
            ORDER SUMMARY
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            {eventTitle}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {seatLabels.map((label) => (
              <Chip
                key={label}
                icon={<EventSeat sx={{ color: 'white !important', fontSize: 16 }} />}
                label={label}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  fontWeight: 600,
                }}
              />
            ))}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Tickets ({seatLabels.length})
            </Typography>
            <Typography variant="body2">₹{amount.toFixed(0)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Convenience fee
            </Typography>
            <Typography variant="body2">₹0</Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 2 }} />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Total
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              ₹{amount.toFixed(0)}
            </Typography>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <CheckCircle sx={{ color: '#34d399', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: '#a7f3d0' }}>
              Seats held until payment completes or timer ends.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </motion.div>
  );
};

export default PaymentStep;