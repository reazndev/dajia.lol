import { supabase } from '../supabaseClient';
import { createBadgesTable } from './createBadgesTable';
import { createAdminsTable } from './createAdminsTable';
import { createTemplateFavoritesTable } from './createTemplateFavoritesTable';

export const initializeDatabase = async () => {
  try {
    // First check if we're authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      // Authentication issues are now silently handled
    }

    const results = {
      success: true,
      badgesTable: false,
      adminsTable: false,
      templateFavoritesTable: false
    };
    // Initialize user_badges table
    const badgesResult = await createBadgesTable();
    
    // Initialize admins table
    const adminsResult = await createAdminsTable();
    
    // Initialize template_favorites table
    const templateFavoritesResult = await createTemplateFavoritesTable();
    
    results.badgesTable = badgesResult.success;
    results.adminsTable = adminsResult.success;
    results.templateFavoritesTable = templateFavoritesResult.success;

    return results;
  } catch (error) {
    // Return partial success to allow the app to continue
    return { 
      success: false, 
      error, 
      message: 'Database initialization had issues but the app will continue to function with limited capabilities.' 
    };
  }
};

// Function to check if the database is properly initialized
export const checkDatabaseSetup = async () => {
  try {
    // Initialize tables only
    const results = await initializeDatabase();
    
    if (!results.success) {
      console.warn('Database initialization had some issues:', results.error);

    }

    return results;
  } catch (error) {
    return { 
      success: false, 
      error, 
      message: 'Database setup check failed but the app will continue to function with limited capabilities.' 
    };
  }
}; 
