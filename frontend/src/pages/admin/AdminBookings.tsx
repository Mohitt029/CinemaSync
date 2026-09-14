// src/pages/admin/AdminBookings.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

const statusSx = (s: string) => {
  const st = (s || '').toUpperCase();
  if (st === 'CONFIRMED') {
    return {
      bgcolor: 'rgba(63, 185, 80, 0.2)',
      color: '#3fb950',
      border: '1px solid #3fb950',
    };
  }
  if (st === 'PENDING') {
    return {
      bgcolor: 'rgba(210, 153, 34, 0.2)',
      color: '#d29922',
      border: '1px solid #d29922',
    };
  }
  if (st === 'CANCELLED') {
    return {
      bgcolor: 'rgba(248, 81, 73, 0.25)',
      color: '#ff7b72',
      border: '1px solid #f85149',
    };
  }
  return {
    bgcolor: 'rgba(139, 148, 158, 0.2)',
    color: '#e6edf3',
    border: '1px solid #8b949e',
  };
};

const PAGE_SIZE = 20;

const AdminBookings: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0); // 0-based for API
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:8084/api/admin/bookings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'X-User-Role': 'ADMIN',
        },
        params: {
          page,
          size: PAGE_SIZE,
          sort: 'createdAt,desc',
          ...(status ? { status } : {}),
        },
      });

      // Spring Page JSON
      if (data && Array.isArray(data.content)) {
        setRows(data.content);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? data.content.length);
      } else if (Array.isArray(data)) {
        // fallback if old non-paginated API still running
        setRows(data);
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setRows([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch {
      setRows([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  // status change → back to first page
  const onStatusChange = (value: string) => {
    setStatus(value);
    setPage(0);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#e6edf3' }}>
            Bookings
          </Typography>
          <Typography variant="body2" sx={{ color: '#8b949e', mt: 0.5 }}>
            {totalElements} total
            {status ? ` · filter: ${status}` : ''} · page {page + 1}
            {totalPages > 0 ? ` of ${totalPages}` : ''}
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: '#8b949e' }}>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => onStatusChange(e.target.value)}
            sx={{
              color: '#e6edf3',
              '.MuiOutlinedInput-notchedOutline': { borderColor: '#30363d' },
              '& .MuiSvgIcon-root': { color: '#8b949e' },
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PENDING">PENDING</MenuItem>
            <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
            <MenuItem value="CANCELLED">CANCELLED</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Paper
        sx={{
          bgcolor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: 3,
          overflow: 'auto',
        }}
      >
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ color: '#e50914' }} />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#8b949e' }}>Reference</TableCell>
                <TableCell sx={{ color: '#8b949e' }}>User</TableCell>
                <TableCell sx={{ color: '#8b949e' }}>Show</TableCell>
                <TableCell sx={{ color: '#8b949e' }}>Status</TableCell>
                <TableCell sx={{ color: '#8b949e' }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: '#8b949e', textAlign: 'center', py: 4 }}>
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((b) => (
                  <TableRow key={b.id || b.bookingId} hover>
                    <TableCell sx={{ color: '#e6edf3' }}>
                      {b.bookingReference || b.id}
                    </TableCell>
                    <TableCell sx={{ color: '#c9d1d9' }}>{b.userId}</TableCell>
                    <TableCell sx={{ color: '#c9d1d9' }}>{b.showId}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={b.status}
                        sx={{
                          ...statusSx(b.status),
                          fontWeight: 700,
                          '& .MuiChip-label': { color: 'inherit' },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#3fb950', fontWeight: 700 }}>
                      ₹{b.finalAmount ?? b.totalAmount ?? 0}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page + 1}
            onChange={(_, value) => setPage(value - 1)}
            color="primary"
            sx={{
              '& .MuiPaginationItem-root': {
                color: '#c9d1d9',
                borderColor: '#30363d',
              },
              '& .Mui-selected': {
                bgcolor: 'rgba(229, 9, 20, 0.25) !important',
                color: '#ff7b72',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default AdminBookings;