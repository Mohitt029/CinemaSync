// src/pages/admin/AdminSeats.tsx
import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminSeats: React.FC = () => {
  const [showId, setShowId] = useState('');
  const [rows, setRows] = useState(10);
  const [cols, setCols] = useState(10);
  const [msg, setMsg] = useState<string | null>(null);

  const init = async () => {
    if (!showId.trim()) {
      toast.error('showId required (showtime id from event)');
      return;
    }
    try {
      await axios.post(
        `http://localhost:8084/api/admin/seats/init`,
        {},
        {
          params: { showId: showId.trim(), rows, cols },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'X-User-Role': 'ADMIN',
          },
        }
      );
      setMsg(`Matrix initialized for ${showId}`);
      toast.success('Seat matrix ready');
    } catch (e: any) {
      // fallback public init if admin route not deployed yet
      try {
        await axios.post(
          `http://localhost:8084/api/seats/init?showId=${encodeURIComponent(showId)}&rows=${rows}&cols=${cols}`,
          {}
        );
        setMsg(`Matrix initialized (public init) for ${showId}`);
        toast.success('Seat matrix ready');
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || 'Init failed');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#e6edf3', mb: 2 }}>
        Seat matrix init
      </Typography>
      <Paper sx={{ p: 3, borderRadius: 3, bgcolor: '#161b22', border: '1px solid #30363d', maxWidth: 520 }}>
        <Typography variant="body2" sx={{ color: '#8b949e', mb: 2 }}>
          Use a showtime <code>id</code> from an event document. New events usually auto-init; use
          this to repair or recreate a map.
        </Typography>
        {msg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {msg}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Showtime ID"
          value={showId}
          onChange={(e) => setShowId(e.target.value)}
          sx={{ mb: 2, input: { color: '#e6edf3' }, label: { color: '#8b949e' } }}
        />
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            type="number"
            label="Rows"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            sx={{ input: { color: '#e6edf3' } }}
          />
          <TextField
            type="number"
            label="Cols"
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
            sx={{ input: { color: '#e6edf3' } }}
          />
        </Box>
        <Button variant="contained" color="error" onClick={init}>
          Initialize matrix
        </Button>
      </Paper>
    </Box>
  );
};

export default AdminSeats;