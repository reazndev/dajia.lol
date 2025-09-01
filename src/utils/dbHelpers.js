/**
 * Database helper functions for working with normalized tables
 */
import { supabase } from '../supabaseClient';
import { generateCacheKey, getCache, setCache, clearProfileCache } from './cacheUtils';

/**
 * Generates a UUID v4
 * @returns {string} A UUID v4 string
 */
const generateUUID = () => {
  // Use crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Get complete profile data by username (combines data from all tables)
 * @param {string} username - Username to fetch profile for
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<Object>} - Complete profile data
 */
export const getCompleteProfileByUsername = async (username, useCache = true) => {
  try {
    // Convert username to lowercase for case-insensitive lookup
    const lowercaseUsername = username.toLowerCase();
    
    if (useCache) {
      const cacheKey = generateCacheKey('profile_complete', lowercaseUsername);
      const cachedProfile = getCache(cacheKey);
      if (cachedProfile) {
        return cachedProfile;
      }
    }

    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles_new')
      .select('*')
      .eq('username', lowercaseUsername)
      .single();

    if (profileError) throw profileError;

    // Get appearance data
    const { data: appearanceData, error: appearanceError } = await supabase
      .from('profile_appearance')
      .select('*')
      .eq('profile_id', profileData.id)
      .single();

    // Get discord data
    const { data: discordData, error: discordError } = await supabase
      .from('profile_discord')
      .select('*')
      .eq('profile_id', profileData.id)
      .single();

    // Get lastfm data
    const { data: lastfmData, error: lastfmError } = await supabase
      .from('profile_lastfm')
      .select('*')
      .eq('profile_id', profileData.id)
      .single();

    // Get social links
    const { data: socialLinksData, error: socialLinksError } = await supabase
      .from('social_links')
      .select('*')
      .eq('profile_id', profileData.id);

    const socialLinks = {};
    if (socialLinksData) {
      socialLinksData.forEach(link => {
        socialLinks[link.platform] = link.url;
      });
    }

    // Combine all data into a single profile object
    const completeProfile = {
      ...profileData,
      ...(appearanceData || {}),
      ...(discordData || {}),
      ...(lastfmData || {}),
      social_links: socialLinks,
      // Ensure typewriter and glow settings from profiles_new take precedence
      username_typewriter_enabled: profileData.username_typewriter_enabled,
      username_typewriter_speed: profileData.username_typewriter_speed,
      bio_typewriter_enabled: profileData.bio_typewriter_enabled,
      bio_typewriter_speed: profileData.bio_typewriter_speed,
      username_glow_enabled: profileData.username_glow_enabled,
      username_glow_color: profileData.username_glow_color,
      username_glow_strength: profileData.username_glow_strength
    };

    // Additional validation to ensure social_links is always an object
    if (!completeProfile.social_links || typeof completeProfile.social_links !== 'object' || Array.isArray(completeProfile.social_links)) {
      completeProfile.social_links = {};
    }

    // Cache the complete profile
    if (useCache) {
      const cacheKey = generateCacheKey('profile_complete', lowercaseUsername);
      setCache(cacheKey, completeProfile);
    }

    return completeProfile;
  } catch (error) {
    throw error;
  }
};

/**
 * Get profile by user ID
 * @param {string} userId - User ID to fetch profile for
 * @returns {Promise<Object>} - Profile data
 */
export const getProfileById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles_new')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting profile by ID:', error);
    throw error;
  }
};

/**
 * Update social links for a user
 * @param {string} userId - User ID to update social links for
 * @param {Object} links - Object with platform:url pairs
 * @returns {Promise<Object>} - Updated social links
 */
export const updateSocialLinks = async (userId, links) => {
  try {

    // Validate links input - ensure it's a proper object
    if (!links || typeof links !== 'object' || Array.isArray(links)) {
      throw new Error('Invalid links format: expected an object mapping platforms to URLs');
    }
    
    // Get the username for cache clearing
    const { data: profileData, error: profileError } = await supabase
      .from('profiles_new')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      throw profileError;
    }

    // First get existing links
    const { data: existingLinks, error: existingLinksError } = await supabase
      .from('social_links')
      .select('id, platform, url')
      .eq('profile_id', userId);

    if (existingLinksError) {
      throw existingLinksError;
    }
    

    // Check if the social_links table seems to be missing or improperly set up
    if (existingLinksError && (
        existingLinksError.code === '42P01' || // Undefined table
        existingLinksError.code === '42703'    // Undefined column
      )) {
      // Return early with a useful error
      throw new Error('Social links table is not properly configured. Please contact support.');
    }

    // Create a map of existing links by platform
    const existingLinksMap = {};
    if (existingLinks && existingLinks.length > 0) {
      existingLinks.forEach(link => {
        existingLinksMap[link.platform] = {
          id: link.id,
          url: link.url
        };
      });
    }
    

    // Prepare arrays for upsert and deletion
    const upsertLinks = [];
    const deleteIds = [];
    const platformsToKeep = new Set(Object.keys(links).filter(platform => links[platform] && links[platform].trim() !== ''));

    // Process each link from the input
    for (const [platform, url] of Object.entries(links)) {
      // Only process links that have a non-empty URL
      if (url && url.trim() !== '') {
        const existingLink = existingLinksMap[platform];
        
        // Check if we need to update this link
        if (!existingLink || existingLink.url !== url) {
          
          const linkData = {
            profile_id: userId,
            platform,
            url,
            updated_at: new Date().toISOString()
          };
          
          // Only include id for existing links (for updates)
          if (existingLink) {
            linkData.id = existingLink.id;
          } else {
            // For new links, add created_at and generate a UUID
            linkData.created_at = new Date().toISOString();
            // Generate a UUID for new records
            linkData.id = generateUUID();
          }
          
          upsertLinks.push(linkData);
        } else {
        }
      }
    }

    for (const platform in existingLinksMap) {
      if (!platformsToKeep.has(platform)) {
        deleteIds.push(existingLinksMap[platform].id);
      }
    }

    // Execute operations in order
    let result = { upserted: null, deleted: null };

    // Use a transaction to ensure all operations succeed or fail together
    try {
      // Upsert new/updated links
      if (upsertLinks.length > 0) {
        
        // Final validation to ensure no null IDs are being sent
        const validLinks = upsertLinks.filter(link => {
          // If it has an id property, make sure it's not null
          if ('id' in link && link.id === null) {
            return false;
          }
          return true;
        });
        
        
        const { data, error } = await supabase
          .from('social_links')
          .upsert(validLinks, { 
            onConflict: 'profile_id,platform',
            ignoreDuplicates: false 
          })
          .select();

        if (error) {
          console.error('[updateSocialLinks] Error upserting links:', error);
          console.error('[updateSocialLinks] Upsert error details:', error.details);
          console.error('[updateSocialLinks] Upsert error hint:', error.hint);
          console.error('[updateSocialLinks] Upsert error message:', error.message);
          throw error;
        }
        result.upserted = data;
      }

      // Delete removed links
      if (deleteIds.length > 0) {
        const { data, error } = await supabase
          .from('social_links')
          .delete()
          .in('id', deleteIds)
          .select();

        if (error) {
          throw error;
        }
        result.deleted = data;
      }
    } catch (transactionError) {
      throw new Error(`Failed to update social links: ${transactionError.message}`);
    }

    // Get all links after update for verification
    const { data: updatedLinks, error: updatedLinksError } = await supabase
      .from('social_links')
      .select('platform, url')
      .eq('profile_id', userId);

    if (updatedLinksError) {
      console.warn('[updateSocialLinks] Error verifying final links state:', updatedLinksError);
    } else {
    }

    // Clear the profile cache if we have a username
    if (profileData?.username) {
      try {
        await clearProfileCache(profileData.username);
      } catch (cacheError) {
        console.warn('[updateSocialLinks] Error clearing cache:', cacheError);
        // Don't throw here as this is not critical
      }
    }

    return result;
  } catch (error) {
    // Rethrow with a more user-friendly message
    throw new Error(`Failed to update social links: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Update LastFM information
 * @param {string} userId - User ID to update
 * @param {string} lastfmUsername - LastFM username
 * @returns {Promise<Object>} - Updated profile data
 */
export const updateLastFMUsername = async (userId, lastfmUsername) => {
  try {
    // Get the username for cache clearing
    const { data: profileData, error: profileError } = await supabase
      .from('profiles_new')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;

    // First check if a lastfm record exists for this user
    const { data: existingData, error: checkError } = await supabase
      .from('profile_lastfm')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    // Get the current table schema to check available columns
    const { columns } = await checkTableSchema('profile_lastfm');
    
    // Create data object with known correct properties
    const lastfmData = {
      lastfm_username: lastfmUsername,
      updated_at: new Date().toISOString()
    };

    let result;
    if (!existingData) {
      // Insert new record
      lastfmData.profile_id = userId;
      lastfmData.created_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('profile_lastfm')
        .insert([lastfmData]);
      
      if (error) throw error;
      result = data;
    } else {
      // Update existing record
      const { data, error } = await supabase
        .from('profile_lastfm')
        .update(lastfmData)
        .eq('profile_id', userId);
      
      if (error) throw error;
      result = data;
    }

    // Clear the profile cache if we have a username
    if (profileData?.username) {
      clearProfileCache(profileData.username);
    }

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Update appearance data
 * @param {string} userId - User ID to update
 * @param {Object} appearanceData - Appearance data to update
 * @returns {Promise<Object>} - Updated profile data
 */
export const updateAppearance = async (userId, appearanceData) => {
  try {
    
    // Get the username for cache clearing
    const { data: profileData, error: profileError } = await supabase
      .from('profiles_new')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      throw profileError;
    }
    

    // First check if appearance record exists for this user
    const { data: existingData, error: checkError } = await supabase
      .from('profile_appearance')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
      } else {
        console.error(`[updateAppearance] Error checking for existing appearance record:`, checkError);
        throw checkError;
      }
    } else {
    }
    
    // Get the current table schema to check available columns
    const { columns, error: schemaError } = await checkTableSchema('profile_appearance');
    
    if (schemaError) {
      console.error(`[updateAppearance] Error fetching table schema:`, schemaError);
      throw schemaError;
    }
    
    
    // Filter out any properties that aren't in the table schema
    const filteredAppearanceData = {};
    for (const key in appearanceData) {
      if (columns.includes(key)) {
        filteredAppearanceData[key] = appearanceData[key];
      } else {
        console.warn(`[updateAppearance] Column '${key}' not found in profile_appearance table, skipping`);
      }
    }
    
    // Add updated_at timestamp
    filteredAppearanceData.updated_at = new Date().toISOString();
    

    let result;
    if (!existingData) {
      // Insert new record
      filteredAppearanceData.profile_id = userId;
      filteredAppearanceData.created_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('profile_appearance')
        .insert([filteredAppearanceData])
        .select();
      
      if (error) {
        console.error('[updateAppearance] Error inserting appearance record:', error);
        console.error('[updateAppearance] Request payload:', filteredAppearanceData);
        throw error;
      }
      result = data;
    } else {
      // Update existing record with only provided fields
      const { data, error } = await supabase
        .from('profile_appearance')
        .update(filteredAppearanceData)
        .eq('profile_id', userId)
        .select();
      
      if (error) {
        console.error('[updateAppearance] Error updating appearance record:', error);
        console.error('[updateAppearance] Request payload:', filteredAppearanceData);
        throw error;
      }
      result = data;
    }

    // Clear the profile cache if we have a username
    if (profileData?.username) {
      clearProfileCache(profileData.username);
    }

    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * Update profile image
 * @param {string} userId - User ID to update
 * @param {string} imageUrl - URL of the profile image
 * @returns {Promise<Object>} - Updated profile data
 */
export const updateProfileImage = async (userId, imageUrl) => {
  try {
    // Get the username for cache clearing
    const { data: profileData, error: profileError } = await supabase
      .from('profiles_new')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;

    // Clean up the URL to ensure correct format for avatars
    // For avatars, we want exactly two slashes after the bucket name
    const cleanUrl = imageUrl.replace(/\/avatars\/+/, '/avatars//');

    // Update appearance table
    const { data, error } = await supabase
      .from('profile_appearance')
      .update({ 
        profile_image: cleanUrl,
        updated_at: new Date()
      })
      .eq('profile_id', userId);

    if (error) throw error;

    // Clear the profile cache if we have a username
    if (profileData?.username) {
      clearProfileCache(profileData.username);
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update background image
 * @param {string} userId - User ID to update
 * @param {string} imageUrl - URL of the background image
 * @returns {Promise<Object>} - Updated profile data
 */
export const updateBackgroundImage = async (userId, imageUrl) => {
  try {
    // Get the username for cache clearing
    const { data: profileData, error: profileError } = await supabase
      .from('profiles_new')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;

    // Update appearance table
    const { data, error } = await supabase
      .from('profile_appearance')
      .update({ 
        background_image: imageUrl,
        updated_at: new Date()
      })
      .eq('profile_id', userId);

    if (error) throw error;

    // Clear the profile cache if we have a username
    if (profileData?.username) {
      clearProfileCache(profileData.username);
    }

    return data;
  } catch (error) {
    console.error('Error updating background image:', error);
    throw error;
  }
};

/**
 * Update Discord data
 * @param {string} userId - User ID to update
 * @param {Object} discordData - Discord data to update
 * @returns {Promise<Object>} - Updated profile data
 */
export const updateDiscordData = async (userId, discordData) => {
  try {
    // Get the username for cache clearing
    const { data: profileData, error: profileError } = await supabase
      .from('profiles_new')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;

    // Check if discord record exists
    const { data: existingData, error: checkError } = await supabase
      .from('profile_discord')
      .select('*')
      .eq('profile_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    // Get the current table schema to check available columns
    const { columns } = await checkTableSchema('profile_discord');
    
    // Filter out any properties that aren't in the table schema
    const filteredDiscordData = {};
    for (const key in discordData) {
      if (columns.includes(key)) {
        filteredDiscordData[key] = discordData[key];
      } else {
      }
    }
    
    // Add updated_at timestamp
    filteredDiscordData.updated_at = new Date().toISOString();
    

    let result;
    if (!existingData) {
      // Add profile_id for new records
      filteredDiscordData.profile_id = userId;
      filteredDiscordData.created_at = new Date().toISOString();
      
      // Insert new record
      const { data, error } = await supabase
        .from('profile_discord')
        .insert([filteredDiscordData]);
      
      if (error) throw error;
      result = data;
    } else {
      // Update existing record
      const { data, error } = await supabase
        .from('profile_discord')
        .update(filteredDiscordData)
        .eq('profile_id', userId);
      
      if (error) throw error;
      result = data;
    }

    // Clear the profile cache if we have a username
    if (profileData?.username) {
      clearProfileCache(profileData.username);
    }

    return result;
  } catch (error) {
    throw error;
  }
};


export const checkDatabaseTables = async () => {
  try {
    
    // Check profiles_new table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles_new')
      .select('*')
      .limit(1);
    
    if (profilesError) {
    } else {
    }
    
    // Check profile_appearance table
    const { data: appearanceData, error: appearanceError } = await supabase
      .from('profile_appearance')
      .select('*')
      .limit(1);
    
    if (appearanceError) {
    } else {
    }
    
    // Check profile_discord table
    const { data: discordData, error: discordError } = await supabase
      .from('profile_discord')
      .select('*')
      .limit(1);
    
    if (discordError) {
    } else {
    }
    
    // Check profile_lastfm table
    const { data: lastfmData, error: lastfmError } = await supabase
      .from('profile_lastfm')
      .select('*')
      .limit(1);
    
    if (lastfmError) {
    } else {
    }
    
    // Check social_links table
    const { data: socialLinksData, error: socialLinksError } = await supabase
      .from('social_links')
      .select('*')
      .limit(1);
    
    if (socialLinksError) {
    } else {
    }
    
    // Check cursors table
    const { data: customCursorsData, error: customCursorsError } = await supabase
      .from('cursors')
      .select('*')
      .limit(1);
    
    if (customCursorsError) {

    } else {
    }
    
    return {
      profiles_new: !profilesError,
      profile_appearance: !appearanceError,
      profile_discord: !discordError,
      profile_lastfm: !lastfmError,
      social_links: !socialLinksError,
      cursors: !customCursorsError
    };
  } catch (error) {
    console.error('Error checking database tables:', error);
    return {
      profiles_new: false,
      profile_appearance: false,
      profile_discord: false,
      profile_lastfm: false,
      social_links: false,
      cursors: false
    };
  }
};

/**
 * Check the schema of a specific table
 * @param {string} tableName - The name of the table to check
 * @returns {Promise<Object>} - The columns and their data types
 */
export const checkTableSchema = async (tableName) => {
  try {
    
    // First check if the table exists directly with a simpler query
    const { data: checkData, error: checkError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (checkError) {

      return { exists: false, columns: [], error: checkError };
    }
    
    // Get column names from the result we already have
    const columnNames = checkData && checkData.length > 0 ? Object.keys(checkData[0]) : [];
    
    return { 
      exists: true, 
      columns: columnNames,
      error: null
    };
  } catch (error) {
    return { exists: false, columns: [], error };
  }
}; 