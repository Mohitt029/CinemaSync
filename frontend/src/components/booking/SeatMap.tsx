// src/components/booking/SeatMap.tsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Tooltip,
  useTheme,
  CircularProgress,
  Alert,
  Zoom,
} from '@mui/material';
import {
  Close,
  Check,
  LocalOffer,
  Lock as LockIcon,
  ConfirmationNumber,
  Movie as MovieIcon,
  MusicNote,
  SportsBasketball,
  TheaterComedy,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Seat, SeatAvailability } from '../../types/booking.types';

const VENUE_CONFIGS = {
  MOVIE: {
    icon: <MovieIcon />,
    label: 'Cinema Hall',
    showScreen: true,
    screenLabel: 'SCREEN',
    seatSize: 'medium' as const,
  },
  CONCERT: {
    icon: <MusicNote />,
    label: 'Concert Venue',
    showScreen: true,
    screenLabel: 'STAGE',
    seatSize: 'medium' as const,
  },
  SPORTS: {
    icon: <SportsBasketball />,
    label: 'Stadium',
    showScreen: false,
    screenLabel: 'FIELD',
    seatSize: 'small' as const,
  },
  THEATER: {
    icon: <TheaterComedy />,
    label: 'Theater',
    showScreen: true,
    screenLabel: 'STAGE',
    seatSize: 'large' as const,
  },
};

const SECTION_MAP: Record<string, { section: string; prefix: string }> = {
  A: { section: 'NORTH', prefix: 'N-A' },
  B: { section: 'NORTH', prefix: 'N-B' },
  C: { section: 'NORTH', prefix: 'N-C' },
  D: { section: 'EAST', prefix: 'E-D' },
  E: { section: 'EAST', prefix: 'E-E' },
  F: { section: 'SOUTH', prefix: 'S-F' },
  G: { section: 'SOUTH', prefix: 'S-G' },
  H: { section: 'SOUTH', prefix: 'S-H' },
  I: { section: 'WEST', prefix: 'W-I' },
  J: { section: 'WEST', prefix: 'W-J' },
};

const SECTION_ORDER = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
const SECTION_COLORS: Record<string, string> = {
  NORTH: '#4a90d9',
  EAST: '#e67e22',
  SOUTH: '#27ae60',
  WEST: '#8e44ad',
};

interface SeatMapProps {
  showId: string;
  availability: SeatAvailability | null;
  isLoading: boolean;
  selectedSeats: Seat[];
  currentUserId?: string;
  onSeatSelect: (seat: Seat) => void;
  onProceedToBooking: () => void;
  onClearSelection?: () => void;
  venueType?: 'MOVIE' | 'CONCERT' | 'SPORTS' | 'THEATER';
  hasPending?: boolean;
  isLocked?: boolean;
  proceedButtonLabel?: string;
}

/** Owner of a LOCKED seat — supports both API shapes */
const lockOwner = (seat: Seat | null | undefined): string | null => {
  if (!seat) return null;
  const id = seat.lockedBy || seat.userId || null;
  return id && String(id).trim() ? String(id) : null;
};

const SeatMap: React.FC<SeatMapProps> = ({
  availability,
  isLoading,
  selectedSeats,
  currentUserId,
  onSeatSelect,
  onProceedToBooking,
  onClearSelection,
  venueType = 'MOVIE',
  hasPending = false,
  isLocked = false,
  proceedButtonLabel,
}) => {
  const theme = useTheme();
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const venueConfig = VENUE_CONFIGS[venueType] || VENUE_CONFIGS.MOVIE;

  const isLockedByOther = (seat: Seat) => {
    if (!seat || seat.status !== 'LOCKED') return false;
    const owner = lockOwner(seat);
    // Locked with unknown owner → treat as taken (safe)
    if (!owner) return true;
    if (!currentUserId) return true;
    return owner !== currentUserId;
  };

  const isMine = (seat: Seat) => {
    if (!seat || seat.status !== 'LOCKED') return false;
    if ((seat as any).isMine === true) return true;
    const owner = lockOwner(seat);
    if (!owner || !currentUserId) return false;
    return owner === currentUserId;
  };

  const getSeatColor = (seat: Seat) => {
    if (!seat) return theme.palette.grey[400];
    if (seat.status === 'BOOKED') return theme.palette.grey[400];
    if (isLockedByOther(seat)) return theme.palette.grey[500];
    if (isMine(seat)) return theme.palette.primary.main;
    if (selectedSeats.some((s) => s?.seatId === seat.seatId)) {
      return theme.palette.primary.main;
    }
    if (selectedCategory && seat.category === selectedCategory) {
      return theme.palette.success.light;
    }
    return theme.palette.success.main;
  };

  const getSeatIcon = (seat: Seat) => {
    if (isMine(seat) || isLockedByOther(seat)) {
      return <LockIcon sx={{ fontSize: 12, color: 'white' }} />;
    }
    if (seat.status === 'BOOKED') {
      return <ConfirmationNumber sx={{ fontSize: 12, color: 'white' }} />;
    }
    if (selectedSeats.some((s) => s?.seatId === seat.seatId)) {
      return <Check sx={{ fontSize: 12, color: 'white' }} />;
    }
    return null;
  };

  const getDisplayLabel = (seat: Seat) => {
    if (venueType === 'SPORTS') {
      const info = SECTION_MAP[seat.rowName];
      return info ? `${info.prefix}${seat.number}` : `${seat.rowName}${seat.number}`;
    }
    return `${seat.rowName}${seat.number}`;
  };

  const getSeatTooltip = (seat: Seat) => {
    if (!seat) return '';
    let statusLabel = 'Available';
    if (seat.status === 'BOOKED') statusLabel = 'Booked';
    else if (isMine(seat)) statusLabel = 'Locked by you';
    else if (isLockedByOther(seat)) statusLabel = 'Locked by another user';
    const selected =
      selectedSeats.some((s) => s?.seatId === seat.seatId) && !isMine(seat)
        ? ' ✓ Selected'
        : '';
    return `${getDisplayLabel(seat)} • ${seat.category} • ₹${seat.price} • ${statusLabel}${selected}`;
  };

  /** Only AVAILABLE seats are newly selectable */
  const isSeatSelectable = (seat: Seat) => {
    if (!seat) return false;
    if (seat.status === 'BOOKED') return false;
    if (isLockedByOther(seat)) return false;
    if (isMine(seat)) return false;
    return seat.status === 'AVAILABLE';
  };

  const getSeatSize = () => {
    switch (venueConfig.seatSize) {
      case 'small':
        return { width: 28, height: 28, fontSize: 8, borderRadius: '50%' };
      case 'large':
        return { width: 44, height: 44, fontSize: 12, borderRadius: 2 };
      default:
        return { width: 36, height: 36, fontSize: 10, borderRadius: 1.5 };
    }
  };

  const seatDimensions = getSeatSize();

  const seatsByRow = useMemo(() => {
    if (!availability?.seats) return {};
    return availability.seats.reduce((acc, seat) => {
      if (!seat) return acc;
      if (!acc[seat.rowName]) acc[seat.rowName] = [];
      acc[seat.rowName].push(seat);
      return acc;
    }, {} as Record<string, Seat[]>);
  }, [availability]);

  const sortedRows = useMemo(() => Object.keys(seatsByRow).sort(), [seatsByRow]);

  const categories = useMemo(() => {
    if (!availability?.seats) return [];
    return Array.from(
      new Set(availability.seats.map((s) => s?.category).filter(Boolean))
    ) as string[];
  }, [availability]);

  const sections = useMemo(() => {
    if (venueType !== 'SPORTS' || !availability?.seats) return null;
    const grouped: Record<string, Seat[]> = {};
    SECTION_ORDER.forEach((sec) => (grouped[sec] = []));
    availability.seats.forEach((seat) => {
      const info = SECTION_MAP[seat.rowName];
      if (info) grouped[info.section].push(seat);
      else grouped['NORTH'].push(seat);
    });
    return grouped;
  }, [availability, venueType]);

  const lockedByOthersCount =
    availability?.seats?.filter((s) => isLockedByOther(s)).length || 0;

  const totalPrice = selectedSeats.reduce((sum, s) => sum + (s?.price || 0), 0);
  const availableCount = availability?.availableSeats || 0;
  const bookedCount = availability?.bookedSeats || 0;
  const hasAvailableSeats = availableCount > 0;

  const renderSeatBox = (seat: Seat) => {
    const isSelected = selectedSeats.some((s) => s?.seatId === seat.seatId);
    const isSelectable = isSeatSelectable(seat);
    const otherLocked = isLockedByOther(seat);
    const isBooked = seat.status === 'BOOKED';
    const isMineSeat = isMine(seat);

    return (
      <Tooltip
        key={seat.seatId}
        title={getSeatTooltip(seat)}
        arrow
        placement="top"
        enterDelay={300}
      >
        <motion.div
          whileHover={isSelectable ? { scale: 1.15, y: -2 } : {}}
          whileTap={isSelectable ? { scale: 0.9 } : {}}
          style={{ display: 'inline-block' }}
        >
          <Zoom in>
            <Box
              onClick={() => {
                if (isSelectable) onSeatSelect(seat);
                // Optional: allow toggle on own pending selection only (not server lock release)
                else if (isSelected && !isMineSeat && !otherLocked && !isBooked) {
                  onSeatSelect(seat);
                }
              }}
              onMouseEnter={() => setHoveredSeat(seat.seatId)}
              onMouseLeave={() => setHoveredSeat(null)}
              sx={{
                width: seatDimensions.width,
                height: seatDimensions.height,
                borderRadius:
                  venueType === 'SPORTS' ? '50%' : seatDimensions.borderRadius,
                bgcolor: getSeatColor(seat),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isSelectable
                  ? 'pointer'
                  : otherLocked
                  ? 'not-allowed'
                  : 'default',
                opacity: isBooked ? 0.4 : 1,
                transition: 'all 0.2s ease',
                border:
                  isSelected || isMineSeat
                    ? `2px solid ${theme.palette.primary.dark}`
                    : otherLocked
                    ? `2px solid ${theme.palette.grey[700]}`
                    : '2px solid transparent',
                boxShadow:
                  isSelected || isMineSeat
                    ? `0 0 0 3px ${theme.palette.primary.light}`
                    : otherLocked
                    ? `0 0 0 2px ${theme.palette.grey[400]}`
                    : 'none',
                transform:
                  hoveredSeat === seat.seatId && isSelectable
                    ? 'translateY(-2px)'
                    : 'none',
                '&:hover': {
                  boxShadow: isSelectable ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                },
              }}
            >
              {getSeatIcon(seat)}
              <Typography
                variant="caption"
                sx={{
                  color: 'white',
                  fontWeight: isSelected || isMineSeat ? 700 : 600,
                  fontSize: seatDimensions.fontSize,
                  userSelect: 'none',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              >
                {seat.number}
              </Typography>
            </Box>
          </Zoom>
        </motion.div>
      </Tooltip>
    );
  };

  const renderStandardGrid = () => {
    if (!availability?.seats) return null;
    return (
      <Box
        sx={{
          overflowX: 'auto',
          pb: 2,
          bgcolor: 'rgba(0,0,0,0.02)',
          borderRadius: 2,
          p: 2,
        }}
      >
        {sortedRows.map((rowName) => {
          const seats = seatsByRow[rowName] || [];
          const filtered = selectedCategory
            ? seats.filter((s) => s?.category === selectedCategory)
            : seats;
          if (filtered.length === 0) return null;
          return (
            <Box
              key={rowName}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 1.5,
                px: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  width: 30,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: 'text.secondary',
                  flexShrink: 0,
                }}
              >
                {rowName}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {filtered.map((seat) => renderSeatBox(seat))}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  const renderStadium = () => {
    if (!sections) return null;
    const sectionSeats = SECTION_ORDER.map((section) => ({
      section,
      seats: sections[section] || [],
      color: SECTION_COLORS[section],
    }));

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          p: 2,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 900 }}>
          <Typography
            variant="subtitle2"
            align="center"
            sx={{ fontWeight: 700, color: SECTION_COLORS.NORTH, mb: 1 }}
          >
            NORTH STAND
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 0.6,
            }}
          >
            {sectionSeats
              .find((s) => s.section === 'NORTH')
              ?.seats.map((seat) => renderSeatBox(seat))}
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            width: '100%',
            maxWidth: 900,
            justifyContent: 'space-between',
            alignItems: 'stretch',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 90,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: SECTION_COLORS.WEST,
                writingMode: 'vertical-rl',
                mb: 1,
              }}
            >
              WEST
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              {sectionSeats
                .find((s) => s.section === 'WEST')
                ?.seats.map((seat) => renderSeatBox(seat))}
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 220,
              bgcolor: '#2e7d32',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 400 300"
              preserveAspectRatio="xMidYMid meet"
            >
              <rect width="400" height="300" fill="#2e7d32" rx="6" />
              <circle
                cx="200"
                cy="150"
                r="40"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              />
              <circle cx="200" cy="150" r="4" fill="white" />
              <line
                x1="0"
                y1="150"
                x2="400"
                y2="150"
                stroke="white"
                strokeWidth="2.5"
              />
              <rect
                x="20"
                y="70"
                width="70"
                height="160"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
              <rect
                x="310"
                y="70"
                width="70"
                height="160"
                fill="none"
                stroke="white"
                strokeWidth="2"
              />
              <text
                x="200"
                y="285"
                fill="white"
                fontSize="14"
                textAnchor="middle"
                fontFamily="sans-serif"
                fontWeight="600"
              >
                FIELD
              </text>
            </svg>
          </Box>

          <Box
            sx={{
              width: 90,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: SECTION_COLORS.EAST,
                writingMode: 'vertical-rl',
                mb: 1,
              }}
            >
              EAST
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
              {sectionSeats
                .find((s) => s.section === 'EAST')
                ?.seats.map((seat) => renderSeatBox(seat))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 900 }}>
          <Typography
            variant="subtitle2"
            align="center"
            sx={{ fontWeight: 700, color: SECTION_COLORS.SOUTH, mb: 1 }}
          >
            SOUTH STAND
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 0.6,
            }}
          >
            {sectionSeats
              .find((s) => s.section === 'SOUTH')
              ?.seats.map((seat) => renderSeatBox(seat))}
          </Box>
        </Box>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 8,
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Loading seat map...
        </Typography>
      </Box>
    );
  }

  if (!availability?.seats || availability.seats.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          No seat data available
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          borderRadius: 2,
          background:
            venueType === 'SPORTS'
              ? 'linear-gradient(135deg, #1a3a2e 0%, #2d5a3e 100%)'
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {venueConfig.icon}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {venueConfig.label}
          </Typography>
          <Chip
            label={venueType}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Box>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`${availableCount} Available`}
            size="small"
            sx={{ bgcolor: 'success.main', color: 'white' }}
          />
          <Chip
            label={`${selectedSeats.length} Selected`}
            size="small"
            sx={{ bgcolor: 'primary.main', color: 'white' }}
          />
          {lockedByOthersCount > 0 && (
            <Chip
              icon={<LockIcon sx={{ color: 'white !important' }} />}
              label={`${lockedByOthersCount} locked by others`}
              size="small"
              sx={{ bgcolor: 'grey.600', color: 'white' }}
            />
          )}
          {isLocked && (
            <Chip
              icon={<LockIcon />}
              label="Your seats locked"
              size="small"
              sx={{ bgcolor: 'info.main', color: 'white' }}
            />
          )}
          {hasPending && (
            <Chip
              icon={<LockIcon />}
              label="Pending"
              size="small"
              sx={{ bgcolor: 'warning.main', color: 'white' }}
            />
          )}
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 2,
          mb: 3,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 18, height: 18, bgcolor: 'success.main', borderRadius: 1 }} />
          <Typography variant="caption">Available ({availableCount})</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 18, height: 18, bgcolor: 'primary.main', borderRadius: 1 }} />
          <Typography variant="caption">
            Selected / Your locks ({selectedSeats.length})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 18, height: 18, bgcolor: 'grey.500', borderRadius: 1 }} />
          <Typography variant="caption">
            Locked by others ({lockedByOthersCount})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 18, height: 18, bgcolor: 'grey.400', borderRadius: 1 }} />
          <Typography variant="caption">Booked ({bookedCount})</Typography>
        </Box>
      </Paper>

      {categories.length > 0 && (
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            <LocalOffer fontSize="small" /> Filter:
          </Typography>
          <Chip
            label="All"
            size="small"
            color={selectedCategory === null ? 'primary' : 'default'}
            onClick={() => setSelectedCategory(null)}
            variant={selectedCategory === null ? 'filled' : 'outlined'}
          />
          {categories.map((cat) => {
            const count = availability.seats.filter(
              (s) => s?.category === cat && s?.status === 'AVAILABLE'
            ).length;
            return (
              <Chip
                key={cat}
                label={`${cat} (${count})`}
                size="small"
                color={selectedCategory === cat ? 'primary' : 'default'}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? null : cat)
                }
                variant={selectedCategory === cat ? 'filled' : 'outlined'}
              />
            );
          })}
        </Box>
      )}

      {!hasAvailableSeats && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No seats available for this show.
        </Alert>
      )}

      {venueConfig.showScreen && venueType !== 'SPORTS' && (
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Paper sx={{ py: 2, bgcolor: 'grey.200', borderRadius: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                letterSpacing: 4,
                fontWeight: 600,
              }}
            >
              {venueConfig.screenLabel}
            </Typography>
          </Paper>
        </Box>
      )}

      {venueType === 'SPORTS' ? renderStadium() : renderStandardGrid()}

      <AnimatePresence>
        {selectedSeats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Paper
              sx={{
                position: 'sticky',
                bottom: 0,
                p: 3,
                mt: 3,
                bgcolor: 'background.paper',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                zIndex: 10,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignItems: 'center',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Selected Seats ({selectedSeats.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedSeats.map((seat) => (
                      <Chip
                        key={seat.seatId}
                        label={`${getDisplayLabel(seat)} - ₹${seat.price}`}
                        size="small"
                        color="primary"
                        icon={
                          isMine(seat) ? (
                            <LockIcon sx={{ fontSize: 14 }} />
                          ) : undefined
                        }
                        onDelete={
                          isMine(seat) ? undefined : () => onSeatSelect(seat)
                        }
                        deleteIcon={isMine(seat) ? undefined : <Close />}
                      />
                    ))}
                    {onClearSelection && hasPending && (
                      <Chip
                        label="Clear New Picks"
                        size="small"
                        variant="outlined"
                        onClick={onClearSelection}
                      />
                    )}
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'right', minWidth: 110 }}>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                  <Typography
                    variant="h6"
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  >
                    ₹{totalPrice.toFixed(0)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  onClick={onProceedToBooking}
                  disabled={selectedSeats.length === 0}
                  sx={{
                    minWidth: 150,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                    },
                    '&:disabled': { background: theme.palette.grey[300] },
                    transition: 'all 0.3s ease',
                    py: 1.5,
                    borderRadius: 2,
                  }}
                >
                  {proceedButtonLabel ||
                    (selectedSeats.length === 0
                      ? 'Select Seats'
                      : `Book ${selectedSeats.length} Seat${
                          selectedSeats.length > 1 ? 's' : ''
                        }`)}
                </Button>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default SeatMap;