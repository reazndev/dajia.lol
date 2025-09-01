import { supabase } from '../supabaseClient';

// Create template_favorites table
export const createTemplateFavoritesTable = async () => {
  try {
    // Create the table using SQL
    const { error } = await supabase.rpc('create_template_favorites_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS template_favorites (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES profiles_new(id) ON DELETE CASCADE,
          template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
          UNIQUE(user_id, template_id)
        );
        CREATE INDEX IF NOT EXISTS idx_template_favorites_user ON template_favorites(user_id);
        CREATE INDEX IF NOT EXISTS idx_template_favorites_template ON template_favorites(template_id);
      `
    });

    if (error) {
      console.error('Error creating template_favorites table:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createTemplateFavoritesTable:', error);
    return { success: false, error };
  }
};

// Add a favorite
export const addTemplateFavorite = async (userId, templateId) => {
  try {
    const { data, error } = await supabase
      .from('template_favorites')
      .insert([{ user_id: userId, template_id: templateId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding template favorite:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in addTemplateFavorite:', error);
    return { success: false, error };
  }
};

// Remove a favorite
export const removeTemplateFavorite = async (userId, templateId) => {
  try {
    const { data, error } = await supabase
      .from('template_favorites')
      .delete()
      .match({ user_id: userId, template_id: templateId });

    if (error) {
      console.error('Error removing template favorite:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in removeTemplateFavorite:', error);
    return { success: false, error };
  }
};

// Get user's favorites
export const getUserTemplateFavorites = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('template_favorites')
      .select(`
        template_id,
        templates (*)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user template favorites:', error);
      return { success: false, error };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getUserTemplateFavorites:', error);
    return { success: false, error };
  }
};

// Check if a template is favorited by user
export const isTemplateFavorited = async (userId, templateId) => {
  try {
    const { data, error } = await supabase
      .from('template_favorites')
      .select('id')
      .match({ user_id: userId, template_id: templateId })
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking template favorite:', error);
      return { success: false, error };
    }

    return { success: true, favorited: !!data };
  } catch (error) {
    console.error('Error in isTemplateFavorited:', error);
    return { success: false, error };
  }
}; 