// src/services/favorites.service.ts
/**
 * Per-user favorites, stored in localStorage under a user-scoped key so
 * different accounts in the same browser don't share favorites.
 * Dispatches a window event so Layout/Header badges update in the same tab.
 */

const EVENT_NAME = 'cinemasync:favorites-changed';

function getUserId(): string {
  let id = localStorage.getItem('userId');
  if (id) return id;
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    id = u.id || u._id || u.email || 'guest';
  } catch {
    id = 'guest';
  }
  return id || 'guest';
}

function key(): string {
  return `cinemasync_favorites_${getUserId()}`;
}

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function emitChange(list: string[]) {
  try {
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { favorites: list } })
    );
  } catch {
    /* noop */
  }
}

export function setFavorites(list: string[]) {
  const unique = Array.from(new Set(list));
  localStorage.setItem(key(), JSON.stringify(unique));
  emitChange(unique);
}

export function toggleFavorite(eventId: string): string[] {
  const current = getFavorites();
  const next = current.includes(eventId)
    ? current.filter((id) => id !== eventId)
    : [...current, eventId];
  setFavorites(next);
  return next;
}

export function isFavorite(eventId: string): boolean {
  return getFavorites().includes(eventId);
}

export function subscribe(cb: (list: string[]) => void): () => void {
  const handler = (e: Event) => {
    const ce = e as CustomEvent<{ favorites: string[] }>;
    cb(ce.detail?.favorites || []);
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === key() && e.newValue) {
      try {
        cb(JSON.parse(e.newValue));
      } catch {
        /* noop */
      }
    }
  });
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export function clearForUser() {
  // used on login/logout to reset the badge immediately
  emitChange([]);
}

export default {
  getFavorites,
  setFavorites,
  toggleFavorite,
  isFavorite,
  subscribe,
  clearForUser,
};