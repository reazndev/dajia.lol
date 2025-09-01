/**
 * CORS Helper
 * This utility provides a list of public CORS proxies and helper methods to work with them.
 */

// cors stuff, idfk how this works either, ty claude

// List of public CORS proxies that can be used
export const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-proxy.fringe.zone/',
];

/**
 * Get a CORS proxy URL with fallbacks
 * @param {number} index Optional index to try a specific proxy
 * @returns {string} A CORS proxy URL
 */
export const getCorsProxy = (index = 0) => {
  // If no index is provided or it's out of bounds, use the first one
  if (index < 0 || index >= CORS_PROXIES.length) {
    index = 0;
  }
  
  return CORS_PROXIES[index];
};

/**
 * Fetch with CORS proxy and fallbacks
 * This function will try each proxy in order until one works
 * 
 * @param {string} url The URL to fetch
 * @param {object} options Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const fetchWithCorsProxy = async (url, options = {}) => {
  let lastError;
  
  // Try each proxy in order
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxy = getCorsProxy(i);
      const proxyUrl = `${proxy}${proxy.includes('?') ? '' : '?'}${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl, options);
      
      if (response.ok) {
        return response;
      }
    } catch (error) {
      lastError = error;
      console.warn(`CORS proxy ${CORS_PROXIES[i]} failed:`, error);
      // Continue to the next proxy
    }
  }
  
  // If all proxies fail, throw the last error
  throw lastError || new Error('All CORS proxies failed');
};

export default {
  CORS_PROXIES,
  getCorsProxy,
  fetchWithCorsProxy
}; 