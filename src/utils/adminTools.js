import { supabase } from '../supabaseClient';
import { addAdmin, isAdmin } from './createAdminsTable';

// Function to make a user an admin
export const makeUserAdmin = async (userIdOrEmail) => {
  try {
    let userId = userIdOrEmail;
    
    // If input looks like an email, find the user ID first
    if (userIdOrEmail.includes('@')) {
      // Get user ID from email
      const { data: user, error: userError } = await supabase
        .from('profiles_new')
        .select('id')
        .eq('email', userIdOrEmail)
        .single();
        
      if (userError) {
        console.error('Error finding user by email:', userError);
        return { success: false, error: userError };
      }
      
      if (!user) {
        return { success: false, error: { message: 'User not found with that email' } };
      }
      
      userId = user.id;
    }
    
    const { success: checkSuccess, isAdmin: isAlreadyAdmin, error: checkError } = await isAdmin(userId);
    
    if (checkError) {
      return { success: false, error: checkError };
    }
    
    if (isAlreadyAdmin) {
      return { success: true, message: 'User is already an admin' };
    }
    
    // Make the user an admin
    const { success, error } = await addAdmin(userId);
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, message: 'User is now an admin' };
  } catch (error) {
    console.error('Error in makeUserAdmin:', error);
    return { success: false, error };
  }
};

window.debugTools = {
  makeAdmin: async (emailOrId) => {
    const result = await makeUserAdmin(emailOrId);
    return result;
  }
}; 