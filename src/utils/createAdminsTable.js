import { supabase } from '../supabaseClient';

// Create admins table for managing admin users
export const createAdminsTable = async () => {
  return { success: true };
  };

// Function to add an admin user
export const addAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .insert([{ user_id: userId }]);
    
    if (error) {
      console.error('Error adding admin:', error);
      return { error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in addAdmin:', error);
    return { error };
  }
};

// Function to remove an admin user
export const removeAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error removing admin:', error);
      return { error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in removeAdmin:', error);
    return { error };
  }
};

// Function to check if a user is an admin
export const isAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No match found, user is not an admin
        return { success: true, isAdmin: false };
      }
      console.error('Error checking admin status:', error);
      return { error };
    }
    
    return { success: true, isAdmin: true };
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return { error };
  }
}; 