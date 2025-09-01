import { supabase } from '../supabaseClient';
import { clearProfileCache } from './cacheUtils';

/**
 * Updates social links for a user's profile
 * @param {string} userId - The user's ID
 * @param {Object} links - Object containing social media links
 * @param {Array} orderedPlatforms - Array of platforms in desired display order
 * @returns {Promise<Object>} - The updated social links
 */
export const updateSocialLinks = async (userId, links, orderedPlatforms = []) => {
  try {
    // First, delete existing links
    const { error: deleteError } = await supabase
      .from('social_links')
      .delete()
      .eq('profile_id', userId);

    if (deleteError) throw deleteError;

    // Create a map of display orders
    const displayOrders = {};
    orderedPlatforms.forEach((platform, index) => {
      displayOrders[platform] = index;
    });

    // Prepare the new links for insertion with display order
    const linksToInsert = Object.entries(links)
      .filter(([_, url]) => url && url.trim()) // Only include links with values
      .map(([platform, url]) => ({
        profile_id: userId,
        platform,
        url,
        display_order: displayOrders[platform] ?? Object.keys(displayOrders).length, // Use ordered index or append to end
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

    // Insert new links
    const { data, error: insertError } = await supabase
      .from('social_links')
      .insert(linksToInsert)
      .select();

    if (insertError) throw insertError;

    // Get the user's username to clear their cache
    const { data: profileData, error: profileError } = await supabase
      .from('profiles_new')
      .select('username')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Clear the profile cache
    await clearProfileCache(profileData.username);

    return data;
  } catch (error) {
    console.error('Error updating social links:', error);
    throw error;
  }
}; 