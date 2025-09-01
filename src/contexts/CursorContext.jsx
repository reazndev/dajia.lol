import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CursorContext = createContext();

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error('useCursor must be used within a CursorProvider');
  }
  return context;
};

export const CursorProvider = ({ children }) => {
  const [activeCursor, setActiveCursor] = useState(null);

  useEffect(() => {
    fetchActiveCursor();
    
    // Subscribe to changes in the cursors table
    const channel = supabase
      .channel('cursors_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cursors'
        },
        () => {
          fetchActiveCursor();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActiveCursor = async () => {
    try {
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) return;

      const { data, error } = await supabase
        .from('cursors')
        .select('*')
        .eq('profile_id', profile.user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching active cursor:', error);
        return;
      }

      setActiveCursor(data);
    } catch (error) {
      console.error('Error in fetchActiveCursor:', error);
    }
  };

  return (
    <CursorContext.Provider value={{ activeCursor, fetchActiveCursor }}>
      {children}
    </CursorContext.Provider>
  );
}; 