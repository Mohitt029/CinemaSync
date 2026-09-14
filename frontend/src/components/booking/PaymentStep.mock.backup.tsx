// frontend/src/components/booking/PaymentStep.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
  InputAdornment,
  Stack,
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  PhoneAndroid,
  Lock,
  CheckCircle,
  EventSeat,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export interface PaymentStepProps {
  amount: number;
  seatLabels: string[];
  eventTitle: string;
  timeRemaining?: number;
  isLoading?: boolean;
  onPay: (method: string, mockDetails: Record<string, string>) => Promise<void>;
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
  const [method, setMethod] = useState('CARD');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const validate = () => {
    if (method === 'CARD') {
      if (cardNumber.replace(/\s/g, '').length < 16) return 'Enter a valid 16-digit card number';
      if (expiry.length < 5) return 'Enter expiry (MM/YY)';
      if (cvv.length < 3) return 'Enter CVV';
      if (!name.trim()) return 'Enter name on card';
    }
    if (method === 'UPI' && !upiId.includes('@')) return 'Enter a valid UPI ID (e.g. name@upi)';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      await onPay(method, {
        cardNumber: cardNumber.replace(/\s/g, ''),
        expiry,
        cvv,
        name,
        upiId,
      });
    } catch (e: any) {
      setError(e?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const busy = isLoading || processing;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
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
                Demo payment · no real charge
              </Typography>
            </Box>
          </Box>

          {typeof timeRemaining === 'number' && timeRemaining > 0 && (
            <Alert severity={timeRemaining < 60 ? 'error' : 'info'} sx={{ mb: 2, borderRadius: 2 }}>
              Complete payment in <strong>{formatTime(timeRemaining)}</strong> or seats may be released.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Payment method
            </Typography>
            <RadioGroup row value={method} onChange={(e) => setMethod(e.target.value)} sx={{ gap: 1 }}>
              {[
                { value: 'CARD', label: 'Card', icon: <CreditCard fontSize="small" /> },
                { value: 'UPI', label: 'UPI', icon: <PhoneAndroid fontSize="small" /> },
                { value: 'NETBANKING', label: 'Net Banking', icon: <AccountBalance fontSize="small" /> },
              ].map((m) => (
                <Paper
                  key={m.value}
                  variant="outlined"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    borderColor: method === m.value ? 'primary.main' : 'divider',
                    bgcolor: method === m.value ? 'rgba(229, 9, 20, 0.06)' : 'transparent',
                    flex: 1,
                    minWidth: 100,
                  }}
                >
                  <FormControlLabel
                    value={m.value}
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {m.icon}
                        <Typography variant="body2">{m.label}</Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </FormControl>

          {method === 'CARD' && (
            <Stack spacing={2}>
              <TextField
                label="Card number"
                placeholder="4111 1111 1111 1111"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CreditCard color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Expiry"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  fullWidth
                />
                <TextField
                  label="CVV"
                  placeholder="123"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  fullWidth
                />
              </Box>
              <TextField
                label="Name on card"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
              />
            </Stack>
          )}

          {method === 'UPI' && (
            <TextField
              label="UPI ID"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              fullWidth
              helperText="Demo: any id like user@okaxis works"
            />
          )}

          {method === 'NETBANKING' && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Demo mode: Net Banking simulates a successful bank redirect.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button variant="outlined" onClick={onBack} disabled={busy} sx={{ borderRadius: 2 }}>
              Back
            </Button>
            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={busy}
              onClick={handleSubmit}
              sx={{
                borderRadius: 2,
                py: 1.4,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                },
              }}
            >
              {busy ? <CircularProgress size={24} color="inherit" /> : `Pay ₹${amount.toFixed(0)}`}
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
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600 }}
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

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
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
              Seats held until payment completes.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </motion.div>
  );
};

export default PaymentStep;