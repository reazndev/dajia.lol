export const LASTFM_CONFIG = {
  API_KEY: import.meta.env.VITE_LASTFM_API_KEY,
  API_SECRET: import.meta.env.VITE_LASTFM_API_SECRET,
  CALLBACK_URL: import.meta.env.MODE === 'development'
    ? 'http://localhost:5173/link-lastfm/callback'
    : `${window.location.origin}/link-lastfm/callback`,
  AUTH_URL: 'https://www.last.fm/api/auth'
}; 