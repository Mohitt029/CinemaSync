// frontend/src/pages/Booking.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  EventSeat,
  Home,
  Movie,
  MusicNote,
  SportsBasketball,
  TheaterComedy,
  Lock as LockIcon,
  Timer as TimerIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useBooking } from '../hooks/useBooking';
import SeatMap from '../components/booking/SeatMap';
import PaymentStep from '../components/booking/PaymentStep';
import { payWithRazorpay } from '../services/payment.service';
import { useEvents } from '../hooks/useEvents';
import toast from 'react-hot-toast';

const steps = ['Select Seats', 'Review', 'Payment'];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const Booking: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { state } = location;

  const {
    loadSeatAvailability,
    restoreLocksForShow,
    seatAvailability,
    pendingSeats,
    lockBatches,
    selectedSeats,
    selectSeat,
    lockPendingSeats,
    releaseBatch,
    createBooking,
    confirmPayment,
    clearAfterSuccess,
    isLoading,
    getTotalPrice,
    clearPendingSeats,
    isLocked,
    currentUserId,
    lockedByOthersCount,
    error,
  } = useBooking();

  const { getEvent } = useEvents();
  const [activeStep, setActiveStep] = useState(0);
  const [venueType, setVenueType] = useState<'MOVIE' | 'CONCERT' | 'SPORTS' | 'THEATER'>('MOVIE');

  const showId = state?.showtimeId;
  const eventTitle = state?.eventTitle || 'Event';
  const eventId = state?.eventId;

  useEffect(() => {
    if (eventId) {
      getEvent(eventId).then((event) => {
        if (event) setVenueType(event.category as any);
      });
    }
  }, [eventId, getEvent]);

  useEffect(() => {
    if (!showId) {
      toast.error('No showtime selected');
      navigate('/');
      return;
    }
    const restored = restoreLocksForShow(showId);
    loadSeatAvailability(showId, { lockedBatches: restored });
  }, [showId, restoreLocksForShow, loadSeatAvailability]);

  const hasAutoAdvancedRef = useRef(false);
  useEffect(() => {
    if (
      !hasAutoAdvancedRef.current &&
      isLocked &&
      pendingSeats.length === 0 &&
      lockBatches.length > 0
    ) {
      hasAutoAdvancedRef.current = true;
      setActiveStep(1);
    }
  }, [isLocked, pendingSeats.length, lockBatches.length]);

  const handleProceedFromSeatMap = async () => {
    if (pendingSeats.length > 0) {
      const batch = await lockPendingSeats(showId);
      if (batch) setActiveStep(1);
    } else if (isLocked) {
      setActiveStep(1);
    } else {
      toast.error('Please select at least one seat');
    }
  };

  const handleBackToSeats = () => setActiveStep(0);

  const handleCancelBatch = async (lockId: string) => {
    await releaseBatch(showId, lockId);
  };

  /** Review → Payment UI only (do NOT create booking yet) */
  const handleGoToPayment = async () => {
    if (pendingSeats.length > 0) {
      const batch = await lockPendingSeats(showId);
      if (!batch) return;
    }
    if (lockBatches.length === 0 && pendingSeats.length === 0) {
      toast.error('Lock seats first');
      return;
    }
    setActiveStep(2);
  };

  /**
   * Pay click:
   * 1) Create PENDING booking (seats stay LOCKED server-side)
   * 2) Razorpay order + Checkout + verify
   *    - On cancel/failure, payWithRazorpay() cancels the booking
   *      and releases the seats internally.
   * 3) On success → clear local lock batches → navigate to confirmation
   */
  const handlePay = async () => {
    // 1) Create PENDING booking — seats are still LOCKED at this point
    const booking = await createBooking(showId, 'RAZORPAY');
    if (!booking?.bookingId) {
      throw new Error(
        'Could not create booking. Seats may have expired — go back and lock again.'
      );
    }

    // 2) Razorpay flow. On cancel, payWithRazorpay() calls the
    //    /bookings/{id}/cancel endpoint internally to release seats.
    const result = await payWithRazorpay(booking.bookingId);

    if (!result?.success) {
      throw new Error(result?.error || 'Payment verification failed');
    }

    // 3) Success — now safe to clear lock batches
    clearAfterSuccess();
    navigate(`/booking-confirmation/${booking.bookingId}`);
  };

  const getVenueIcon = () => {
    switch (venueType) {
      case 'MOVIE':
        return <Movie />;
      case 'CONCERT':
        return <MusicNote />;
      case 'SPORTS':
        return <SportsBasketball />;
      case 'THEATER':
        return <TheaterComedy />;
      default:
        return <EventSeat />;
    }
  };

  if (isLoading && !seatAvailability) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const grandTotal = getTotalPrice();
  const minTimeRemaining =
    lockBatches.length > 0 ? Math.min(...lockBatches.map((b) => b.timeRemaining)) : undefined;

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <Home sx={{ mr: 0.5, fontSize: 16 }} /> Home
          </Link>
          <Link
            color="inherit"
            onClick={() => navigate(`/events/${eventId}`)}
            sx={{ cursor: 'pointer' }}
          >
            {eventTitle}
          </Link>
          <Typography color="text.primary">Booking</Typography>
        </Breadcrumbs>

        {error && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
            <Typography color="error">{error}</Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => loadSeatAvailability(showId)}
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          </Paper>
        )}

        {lockedByOthersCount > 0 && (
          <Alert severity="info" sx={{ mb: 2 }} icon={<LockIcon />}>
            {lockedByOthersCount} seat{lockedByOthersCount > 1 ? 's are' : ' is'} currently locked by
            other users.
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getVenueIcon()}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {eventTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeStep === 0 && 'Select your seats'}
                {activeStep === 1 && 'Review your booking'}
                {activeStep === 2 && 'Complete payment'}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={`${selectedSeats.length} seats selected`}
            color="primary"
            variant="outlined"
          />
        </Paper>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && seatAvailability && (
          <SeatMap
            showId={showId}
            availability={seatAvailability}
            isLoading={isLoading}
            selectedSeats={selectedSeats}
            currentUserId={currentUserId}
            onSeatSelect={selectSeat}
            onProceedToBooking={handleProceedFromSeatMap}
            onClearSelection={clearPendingSeats}
            venueType={venueType as any}
            hasPending={pendingSeats.length > 0}
            isLocked={isLocked}
            proceedButtonLabel={
              pendingSeats.length > 0
                ? `Lock ${pendingSeats.length} New Seat${pendingSeats.length > 1 ? 's' : ''}`
                : isLocked
                ? 'Continue to Review'
                : 'Select Seats'
            }
          />
        )}

        {activeStep === 1 && (
          <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Review Your Booking
              </Typography>
              <Button startIcon={<ArrowBack />} onClick={handleBackToSeats} size="small">
                Back to Seats
              </Button>
            </Box>

            {pendingSeats.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'warning.main' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="warning.main">
                    Pending Selections ({pendingSeats.length})
                  </Typography>
                  <Button size="small" color="warning" onClick={() => clearPendingSeats()}>
                    Clear All
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {pendingSeats.map((seat) => (
                    <Chip
                      key={seat.seatId}
                      label={`${seat.rowName}${seat.number} - ${seat.category}`}
                      color="warning"
                    />
                  ))}
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  onClick={() => lockPendingSeats(showId)}
                  sx={{ mt: 1 }}
                >
                  Lock These Seats
                </Button>
              </Paper>
            )}

            {lockBatches.map((batch, idx) => (
              <Paper
                key={batch.lockId}
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  borderColor: batch.timeRemaining < 60 ? 'error.main' : 'divider',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Lock Batch {idx + 1}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimerIcon
                      fontSize="small"
                      color={batch.timeRemaining < 60 ? 'error' : 'action'}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: batch.timeRemaining < 60 ? 'error.main' : 'text.primary',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatTime(batch.timeRemaining)}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {batch.seats.map((seat) => (
                    <Chip
                      key={seat.seatId}
                      label={`${seat.rowName}${seat.number} - ${seat.category}`}
                      color="primary"
                      icon={<EventSeat />}
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    ₹{batch.seats.reduce((s, seat) => s + (seat.price || 0), 0).toFixed(0)}
                  </Typography>
                  <Button size="small" color="error" onClick={() => handleCancelBatch(batch.lockId)}>
                    Cancel
                  </Button>
                </Box>
              </Paper>
            ))}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Grand Total
              </Typography>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                ₹{grandTotal.toFixed(0)}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={handleBackToSeats}>
                Back to Seats
              </Button>
              <Button
                variant="contained"
                onClick={handleGoToPayment}
                disabled={lockBatches.length === 0 && pendingSeats.length === 0}
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                }}
              >
                {lockBatches.length > 0 ? 'Proceed to Payment' : 'Lock Seats First'}
              </Button>
            </Box>
          </Paper>
        )}

        {activeStep === 2 && (
          <PaymentStep
            amount={grandTotal}
            seatLabels={selectedSeats.map((s) => `${s.rowName}${s.number}`)}
            eventTitle={eventTitle}
            timeRemaining={minTimeRemaining}
            isLoading={isLoading}
            onPay={handlePay}
            onBack={() => setActiveStep(1)}
          />
        )}
      </Container>
    </Box>
  );
};

export default Booking;