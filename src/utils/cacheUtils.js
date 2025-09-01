/**
 * Utility functions for client-side caching to reduce Supabase egress
 */

// Cache duration constants (in milliseconds)

// works, idfk how, ty claude
// use ctrl + r when in localhost to see actual changes

const CACHE_DURATIONS = {
  PROFILE: 1000 * 60 * 15, // 15 minutes
  PROFILE_DISCORD: 1000 * 60 * 10, // 10 minutes
  PROFILE_LASTFM: 1000 * 60 * 5, // 5 minutes
  PROFILE_APPEARANCE: 1000 * 60 * 30, // 30 minutes
  SOCIAL_LINKS: 1000 * 60 * 30, // 30 minutes
  LASTFM: 1000 * 60 * 5,   // 5 minutes
  ARTIST: 1000 * 60 * 60,  // 1 hour
  ALBUM: 1000 * 60 * 60,   // 1 hour
  TRACK: 1000 * 60 * 60,   // 1 hour
  DEFAULT: 1000 * 60 * 10  // 10 minutes
};

/**
 * Generate consistent cache keys for different data types
 * @param {string} type - The type of data being cached
 * @param {string} identifier - Primary identifier (username, id, etc.)
 * @param {...any} additionalParams - Additional parameters for the key
 * @returns {string} - The cache key
 */
export const generateCacheKey = (type, identifier, ...additionalParams) => {
  let key = `cache_${type}_${identifier}`;
  
  if (additionalParams.length > 0) {
    key += '_' + additionalParams.join('_');
  }
  
  return key;
};

/**
 * Set data in cache with expiration
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} duration - Cache duration in ms (defaults to 10 minutes)
 */
export const setCache = (key, data, duration = CACHE_DURATIONS.DEFAULT) => {
  try {
    const cacheObject = {
      data,
      expiry: Date.now() + duration
    };
    localStorage.setItem(key, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('Error caching data:', error);
  }
};

/**
 * Get data from cache if valid
 * @param {string} key - Cache key
 * @returns {any|null} - Cached data or null if expired/not found
 */
export const getCache = (key) => {
  try {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;
    
    const { data, expiry } = JSON.parse(cachedItem);
    
    // Check if cache is expired
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error retrieving cached data:', error);
    return null;
  }
};

/**
 * Clear specific cache item
 * @param {string} key - Cache key to clear
 */
export const clearCache = (key) => {
  localStorage.removeItem(key);
};

/**
 * Clear all profile-related cache for a specific username
 * @param {string} username - The username to clear cache for
 */
export const clearProfileCache = (username) => {
  
  // Find all keys in localStorage that match this username
  Object.keys(localStorage).forEach(key => {
    if (key.includes(`profile_`) && key.includes(username)) {
      localStorage.removeItem(key);
    }
  });
  
  // Also clear any complete profile cache
  const completeProfileKey = generateCacheKey('profile_complete', username);
  localStorage.removeItem(completeProfileKey);
};

/**
 * Clear all cache in the application
 */
export const clearAllCache = () => {
  
  // Find all keys in localStorage that start with our cache prefix
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('lastfm_') || key.startsWith('profile_')) {
      localStorage.removeItem(key);
    }
  });
}; 