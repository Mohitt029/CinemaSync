// frontend/src/pages/Settings.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [emailNotif, setEmailNotif] = useState(
    localStorage.getItem('pref_email') !== 'false'
  );
  const [smsNotif, setSmsNotif] = useState(localStorage.getItem('pref_sms') === 'true');

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const save = () => {
    localStorage.setItem('pref_email', String(emailNotif));
    localStorage.setItem('pref_sms', String(smsNotif));
    toast.success('Preferences saved');
  };

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="sm">
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
          Home
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
          Settings
        </Typography>
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Notifications
          </Typography>
          <FormControlLabel
            control={
              <Switch checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
            }
            label="Email alerts"
          />
          <FormControlLabel
            control={<Switch checked={smsNotif} onChange={(e) => setSmsNotif(e.target.checked)} />}
            label="SMS alerts"
          />
          <Divider sx={{ my: 2 }} />
          <Button variant="contained" onClick={save}>
            Save
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Settings;