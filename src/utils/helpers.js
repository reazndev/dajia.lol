import { v4 as uuidv4 } from 'uuid';

export const generateUUID = () => {
  return uuidv4();
};

export const clearProfileCache = async (username) => {
  try {
    // Clear any cached data for this profile
    localStorage.removeItem(`profile_${username}`);
    localStorage.removeItem(`social_links_${username}`);
    return true;
  } catch (error) {
    console.error('Error clearing profile cache:', error);
    return false;
  }
}; 