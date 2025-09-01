import { supabase } from '../supabaseClient';

/**
 * Check if we can connect to the database
 */


// ty claude 


const checkDatabaseConnection = async () => {
  try {
    // Try a simple query to check connection
    const { data, error } = await supabase
      .from('profiles_new')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return { connected: false, error };
    }

    return { connected: true };
  } catch (error) {
    console.error('Database connection error:', error);
    return { connected: false, error };
  }
};

/**
 * Check if required database tables exist
 */
const checkDatabaseTables = async () => {
  const requiredTables = ['profiles_new', 'social_links', 'cursors'];
  const results = {
    exists: {},
    errors: {}
  };

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      results.exists[table] = !error;
      if (error) {
        results.errors[table] = error;
        console.error(`Error checking table ${table}:`, error);
      }
    } catch (error) {
      results.exists[table] = false;
      results.errors[table] = error;
      console.error(`Error checking table ${table}:`, error);
    }
  }

  return results;
};

/**
 * Check auth configuration
 */
const checkAuthConfiguration = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { configured: !error, session, error };
  } catch (error) {
    return { configured: false, error };
  }
};

/**
 * Run a complete database diagnostics check
 */
export const runDiagnostics = async () => {
  
  const results = {
    connection: null,
    auth: null,
    tables: null,
    socialLinks: null,
    timestamp: new Date().toISOString()
  };
  
  try {

    
    return results;
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    results.error = error.message;
    return results;
  }
};

/**
 * Check for issues with the social_links table
 */
export const checkSocialLinksTable = async () => {
  const results = {
    exists: false,
    canSelect: false,
    canInsert: false,
    canUpdate: false,
    canDelete: false,
    structure: null,
    sample: null,
    error: null
  };

  try {
    // 1. Check if table exists
    const { data: existsData, error: existsError } = await supabase
      .from('social_links')
      .select('*')
      .limit(1);
    
    results.exists = !existsError;
    
    if (existsError) {
      console.error('❌ social_links table does not exist:', existsError);
      results.error = existsError;
      return results;
    }
    
    results.sample = existsData;

    // 2. Attempt to get structure using RPC (might not be available)
    try {
      const { data: describeData, error: describeError } = await supabase.rpc('describe_table', {
        table_name: 'social_links'
      });
      
      if (describeError) {
        console.warn('⚠️ Cannot describe social_links table:', describeError);
      } else {
        results.structure = describeData;
      }
    } catch (error) {
      console.warn('⚠️ Error running describe_table RPC:', error);
    }

    // 3. Test insert permission
    try {
      const testRecord = {
        profile_id: '00000000-0000-0000-0000-000000000000', // Using a dummy UUID that shouldn't exist
        platform: '_test',
        url: 'test_url',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('social_links')
        .insert([testRecord])
        .select();
      
      results.canInsert = !insertError;
      
      if (insertError) {
        console.warn('⚠️ Cannot insert into social_links table:', insertError);
      } else {
        
        // If insertion succeeded, clean up by deleting the test record
        if (insertData && insertData.length > 0) {
          const { error: deleteError } = await supabase
            .from('social_links')
            .delete()
            .eq('id', insertData[0].id);
          
          results.canDelete = !deleteError;
          
          if (deleteError) {
            console.warn('⚠️ Cannot delete from social_links table:', deleteError);
          } else {
          }
        }
      }
    } catch (error) {
      console.error('❌ Error testing social_links table insert:', error);
    }

    // 4. Get a sample of social_links data (up to 5 records)
    const { data: sampleData, error: sampleError } = await supabase
      .from('social_links')
      .select('*')
      .limit(5);
    
    if (sampleError) {
      console.warn('⚠️ Cannot select from social_links table:', sampleError);
    } else {
      results.canSelect = true;
      results.sample = sampleData;
    }

    return results;
  } catch (error) {
    console.error('❌ Unexpected error in social_links diagnostics:', error);
    results.error = error;
    return results;
  }
};

// Add a global diagnostics function that can be called from the browser console
if (typeof window !== 'undefined') {
  window.runDatabaseDiagnostics = runDiagnostics;
}

export default runDiagnostics; 