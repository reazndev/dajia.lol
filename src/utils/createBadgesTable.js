import { supabase } from '../supabaseClient';

// Create user_badges table
export const createBadgesTable = async () => {
  return { success: true };

};

//  add a badge to a user
export const addBadgeToUser = async (profileId, badgeType) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .insert([
        { profile_id: profileId, badge_type: badgeType }
      ]);
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: true, message: 'Badge already awarded' };
      }
      return { error };
    }
    
    return { success: true, data };
  } catch (error) {
    return { error };
  }
};

// get all badges for a user
export const getUserBadges = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('profile_id', profileId)
      .order('awarded_at', { ascending: false });
    
    if (error) {
      return { error };
    }
    
    return { success: true, badges: data };
  } catch (error) {
    return { error };
  }
};

// remove a badge from a user
export const removeBadgeFromUser = async (profileId, badgeType) => {
  try {
    const { data, error } = await supabase
      .from('user_badges')
      .delete()
      .eq('profile_id', profileId)
      .eq('badge_type', badgeType);
    
    if (error) {
      return { error };
    }
    
    return { success: true, data };
  } catch (error) {
    return { error };
  }
};

// add early supporter badges to first 100 users
export const addEarlySupporterBadges = async () => {
  try {
    const { data: users, error } = await supabase
      .from('profiles_new')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(100);
    
    if (error) {
      return { error };
    }
    
    const results = [];
    for (const user of users) {
      results.push(result);
    }
    
    return { success: true, results };
  } catch (error) {
    return { error };
  }
};

// Export batch functions for initial setup
export const setupBadges = {
  createTable: createBadgesTable,
  addEarlySupporters: addEarlySupporterBadges
}; 