// src/components/chat/ChatBot.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Fab, Paper, Typography, TextField, IconButton, Avatar, Chip,
  CircularProgress, Divider, Tooltip,
} from '@mui/material';
import {
  Chat as ChatIcon, Close, Send, SmartToy, Person, Movie,
  ConfirmationNumber, Search, Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import chatService from '../../services/chat.service';
import { Event } from '../../types/event.types';

type Msg = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  events?: Event[];
  actions?: { label: string; path?: string; query?: string }[];
  source?: string;
};

const QUICK = [
  { label: 'Movies near me', query: 'movies near me' },
  { label: 'How to book?', query: 'how to book' },
  { label: 'IMAX shows', query: 'imax' },
  { label: 'My bookings', path: '/my-bookings' },
];

const MAX_MESSAGES = 40;

const WELCOME: Msg = {
  id: 'welcome',
  role: 'bot',
  text: "Hi! I'm SyncBot 🎬 Ask about movies, concerts, seats, or booking. Typos are OK — try “intersteller” or “movies near me”.",
  actions: QUICK.map((q) => ({ label: q.label, path: q.path, query: q.query })),
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const ChatBot: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const append = useCallback((msg: Msg) => {
    setMessages((prev) => {
      const next = [...prev, msg];
      if (next.length <= MAX_MESSAGES) return next;
      const welcome = next[0]?.id === 'welcome' ? [next[0]] : [];
      return [...welcome, ...next.slice(-(MAX_MESSAGES - welcome.length))];
    });
  }, []);

  const clearChat = () => setMessages([{ ...WELCOME, id: 'welcome' }]);

  const reply = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      append({ id: uid(), role: 'user', text });
      setLoading(true);

      try {
        const q = text.toLowerCase();
        if (q.includes('my booking') || q.includes('my ticket')) {
          append({
            id: uid(),
            role: 'bot',
            text: 'Opening your bookings…',
            actions: [{ label: 'Go to My Bookings', path: '/my-bookings' }],
          });
          navigate('/my-bookings');
          return;
        }
        if (q === 'clear' || q.includes('reset chat')) {
          clearChat();
          return;
        }

        const data = await chatService.send(text);
        const events = data.events || [];
        const actions = events.slice(0, 5).map((e) => ({
          label: e.title.length > 28 ? e.title.slice(0, 26) + '…' : e.title,
          path: `/events/${e.id}`,
        }));

        if (q.includes('favorite')) {
          actions.push({ label: 'Open Favorites', path: '/favorites' });
        }

        append({
          id: uid(),
          role: 'bot',
          text: data.reply,
          events,
          actions: actions.length ? actions : undefined,
          source: data.source,
        });
      } catch {
        append({
          id: uid(),
          role: 'bot',
          text: 'Chat service unavailable. Is event-service running on 8082?',
        });
      } finally {
        setLoading(false);
      }
    },
    [append, navigate]
  );

  const onSend = () => {
    if (!input.trim() || loading) return;
    const t = input;
    setInput('');
    reply(t);
  };

  const onQuick = (a: { label: string; path?: string; query?: string }) => {
    if (a.path) {
      navigate(a.path);
      append({ id: uid(), role: 'bot', text: `Navigating to ${a.label}…` });
      return;
    }
    if (a.query) reply(a.query);
  };

  return (
    <>
      <Fab
        color="primary"
        onClick={() => setOpen((o) => !o)}
        sx={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1400,
          bgcolor: '#e50914', '&:hover': { bgcolor: '#b20710' },
          boxShadow: '0 8px 32px rgba(229,9,20,0.45)',
        }}
      >
        {open ? <Close /> : <ChatIcon />}
      </Fab>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            style={{
              position: 'fixed', bottom: 96, right: 24, zIndex: 1400,
              width: 'min(400px, calc(100vw - 32px))',
            }}
          >
            <Paper
              elevation={12}
              sx={{
                height: 520, display: 'flex', flexDirection: 'column',
                borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  px: 2, py: 1.5,
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #e50914 160%)',
                  color: 'white', display: 'flex', alignItems: 'center', gap: 1.5,
                }}
              >
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}><SmartToy /></Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>SyncBot</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>
                    AI + search · online
                  </Typography>
                </Box>
                <Tooltip title="Clear chat">
                  <IconButton size="small" onClick={clearChat} sx={{ color: 'white' }}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>

              <Box
                sx={{
                  flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f7f8fa',
                  display: 'flex', flexDirection: 'column', gap: 1.5,
                }}
              >
                {messages.map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex', gap: 1,
                      flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32, height: 32,
                        bgcolor: msg.role === 'user' ? '#e50914' : '#1a1a2e',
                      }}
                    >
                      {msg.role === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
                    </Avatar>
                    <Box sx={{ maxWidth: '78%' }}>
                      <Paper
                        elevation={0}
                        sx={{
                          px: 1.5, py: 1, borderRadius: 2, fontSize: 14, whiteSpace: 'pre-wrap',
                          bgcolor: msg.role === 'user' ? '#e50914' : 'white',
                          color: msg.role === 'user' ? 'white' : 'text.primary',
                          boxShadow: msg.role === 'bot' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        {msg.text}
                      </Paper>
                      {msg.source && msg.role === 'bot' && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          via {msg.source}
                        </Typography>
                      )}
                      {msg.actions && msg.actions.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                          {msg.actions.map((a, i) => (
                            <Chip
                              key={i}
                              size="small"
                              label={a.label}
                              onClick={() => onQuick(a)}
                              icon={
                                a.path?.startsWith('/events/') ? <Movie /> :
                                a.path === '/my-bookings' ? <ConfirmationNumber /> : <Search />
                              }
                              sx={{ cursor: 'pointer', bgcolor: 'white', border: '1px solid', borderColor: 'divider' }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
                {loading && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 5 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">SyncBot is thinking…</Typography>
                  </Box>
                )}
                <div ref={bottomRef} />
              </Box>

              <Divider />
              <Box sx={{ px: 1.5, pt: 1, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {QUICK.map((q) => (
                  <Chip
                    key={q.label}
                    size="small"
                    label={q.label}
                    onClick={() => onQuick(q)}
                    icon={<Search sx={{ fontSize: 14 }} />}
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ p: 1.5, display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth size="small"
                  placeholder="Ask anything… typos OK"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSend()}
                  disabled={loading}
                />
                <IconButton
                  onClick={onSend}
                  disabled={loading || !input.trim()}
                  sx={{
                    bgcolor: 'primary.main', color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': { bgcolor: 'grey.300' },
                  }}
                >
                  <Send fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;