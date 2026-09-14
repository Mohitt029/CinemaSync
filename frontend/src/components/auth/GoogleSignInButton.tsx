import React, { useEffect, useRef, useState } from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

type Props = {
  onCredential: (idToken: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
};

const GoogleSignInButton: React.FC<Props> = ({ onCredential, text = 'continue_with' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;

    const render = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !ref.current) return;
      g.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (res: { credential?: string }) => {
          if (res.credential) onCredential(res.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      g.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        width: 340,
        text,
        shape: 'pill',
        logo_alignment: 'left',
      });
      setReady(true);
    };

    if ((window as any).google?.accounts?.id) {
      render();
      return;
    }
    const id = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(id);
        render();
      }
    }, 150);
    return () => clearInterval(id);
  }, [onCredential, text]);

  if (!CLIENT_ID) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        Google Sign-In is not configured. Set <code>REACT_APP_GOOGLE_CLIENT_ID</code>.
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        minHeight: 48,
      }}
    >
      {!ready && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={20} />
        </Box>
      )}
      <Box ref={ref} sx={{ opacity: ready ? 1 : 0 }} />
    </Box>
  );
};

export default GoogleSignInButton;