import { supabase } from '../supabaseClient';
import { addBadgeToUser, getUserBadges } from './createBadgesTable';

// find a user ID by username or email
export const findUserByUsernameOrEmail = async (identifier) => {
  try {
    // Try by username first
    let { data: user, error } = await supabase
      .from('profiles_new')
      .select('id')
      .eq('username', identifier)
      .single();
      
    if (error && error.code === 'PGRST116') {
      // Not found by username, try by email
      const { data: emailUser, error: emailError } = await supabase
        .from('profiles_new')
        .select('id')
        .eq('email', identifier)
        .single();
        
      if (emailError) {
        console.error('Error finding user by email:', emailError);
        return { error: emailError };
      }
      
      user = emailUser;
    } else if (error) {
      console.error('Error finding user by username:', error);
      return { error };
    }
    
    if (!user) {
      return { error: { message: 'User not found' } };
    }
    
    return { userId: user.id };
  } catch (error) {
    console.error('Error in findUserByUsernameOrEmail:', error);
    return { error };
  }
};

// award badge
export const awardBadge = async (usernameOrEmail, badgeType) => {
  try {
    // find the user
    const { userId, error: findError } = await findUserByUsernameOrEmail(usernameOrEmail);
    
    if (findError) {
      return { success: false, error: findError };
    }
    
    // award badge
    const { success, error, message } = await addBadgeToUser(userId, badgeType);
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, message: message || `Badge '${badgeType}' awarded successfully` };
  } catch (error) {
    console.error('Error in awardBadge:', error);
    return { success: false, error };
  }
};

// Function to list all badges a user has
export const listUserBadges = async (usernameOrEmail) => {
  try {
    // Find the user first
    const { userId, error: findError } = await findUserByUsernameOrEmail(usernameOrEmail);
    
    if (findError) {
      return { success: false, error: findError };
    }
    
    // get badges
    const { success, badges, error } = await getUserBadges(userId);
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, badges };
  } catch (error) {
    console.error('Error in listUserBadges:', error);
    return { success: false, error };
  }
};

// debugging -> remove later 
window.badgeTools = {
  awardBadge: async (usernameOrEmail, badgeType) => {
    const result = await awardBadge(usernameOrEmail, badgeType);
    return result;
  },
  listBadges: async (usernameOrEmail) => {
    const result = await listUserBadges(usernameOrEmail);
    return result;
  }
}; 