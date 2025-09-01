// Array of LastFM API keys
export const LASTFM_API_KEYS = [
  import.meta.env.VITE_LASTFM_API_KEY,
  import.meta.env.VITE_LASTFM_API_KEY_1,
  import.meta.env.VITE_LASTFM_API_KEY_2,
  import.meta.env.VITE_LASTFM_API_KEY_3,
  import.meta.env.VITE_LASTFM_API_KEY_4,
  import.meta.env.VITE_LASTFM_API_KEY_5,
  import.meta.env.VITE_LASTFM_API_KEY_6,
  import.meta.env.VITE_LASTFM_API_KEY_7,
  import.meta.env.VITE_LASTFM_API_KEY_8,
  import.meta.env.VITE_LASTFM_API_KEY_9,
  import.meta.env.VITE_LASTFM_API_KEY_10,
  import.meta.env.VITE_LASTFM_API_KEY_11,
  import.meta.env.VITE_LASTFM_API_KEY_12,
  import.meta.env.VITE_LASTFM_API_KEY_13,
  import.meta.env.VITE_LASTFM_API_KEY_14,
  import.meta.env.VITE_LASTFM_API_KEY_15,
  import.meta.env.VITE_LASTFM_API_KEY_16,
  import.meta.env.VITE_LASTFM_API_KEY_17,
  import.meta.env.VITE_LASTFM_API_KEY_18,
  import.meta.env.VITE_LASTFM_API_KEY_19,
  import.meta.env.VITE_LASTFM_API_KEY_20,
  import.meta.env.VITE_LASTFM_API_KEY_21,
  // Add three more Last.fm API keys
  import.meta.env.VITE_LASTFM_API_KEY_22,
  import.meta.env.VITE_LASTFM_API_KEY_23,
  import.meta.env.VITE_LASTFM_API_KEY_24
];

// Array of Spotify API client IDs and secrets
export const SPOTIFY_API_CREDENTIALS = [
  {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
  },
  {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID_1,
    clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET_1
  },
  {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID_2,
    clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET_2
  },
  {
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID_3,
    clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET_3
  }
];

// Keep track of the current key indices
let currentLastFMKeyIndex = 0;
let currentSpotifyKeyIndex = 0;

// filter out keys not in env
export const filterValidKeys = (keys) => {
  return keys.filter(key => key !== undefined && key !== '');
};

// ----
// export valid keys
// ----

export const getValidLastFMApiKeys = () => {
  return filterValidKeys(LASTFM_API_KEYS);
};

export const getValidSpotifyCredentials = () => {
  return SPOTIFY_API_CREDENTIALS.filter(cred => 
    cred.clientId !== undefined && cred.clientId !== '' && 
    cred.clientSecret !== undefined && cred.clientSecret !== ''
  );
};


// ----
// export api key currently in use
// ----

export const getNextLastFMApiKey = () => {
  const validKeys = getValidLastFMApiKeys();
  if (validKeys.length === 0) return null;
  
  const key = validKeys[currentLastFMKeyIndex];
  currentLastFMKeyIndex = (currentLastFMKeyIndex + 1) % validKeys.length;
  return key;
};

export const getNextSpotifyCredentials = () => {
  const validCredentials = getValidSpotifyCredentials();
  if (validCredentials.length === 0) return null;
  
  const credentials = validCredentials[currentSpotifyKeyIndex];
  currentSpotifyKeyIndex = (currentSpotifyKeyIndex + 1) % validCredentials.length;
  return credentials;
};

// Get a specific API key by index
export const getLastFMApiKey = (index) => {
  const validKeys = getValidLastFMApiKeys();
  if (validKeys.length === 0) return null;
  return validKeys[index % validKeys.length];
};

export const getMultipleLastFMApiKeys = (count) => {
  const validKeys = getValidLastFMApiKeys();
  if (validKeys.length === 0) return [];
  
  const keys = [];
  const startIndex = currentLastFMKeyIndex;
  
  for (let i = 0; i < count; i++) {
    keys.push(validKeys[(startIndex + i) % validKeys.length]);
  }
  
  // Update the current index
  currentLastFMKeyIndex = (startIndex + count) % validKeys.length;
  
  return keys;
}; 