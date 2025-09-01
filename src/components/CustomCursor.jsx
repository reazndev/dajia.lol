import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const CustomCursor = () => {
  const { username } = useParams();
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCursor = async () => {
      try {
        // First get the profile ID from the username
        const { data: profile, error: profileError } = await supabase
          .from('profiles_new')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          return;
        }

        if (!profile) return;

        // Then get the active cursor for this profile
        const { data: cursorData, error: cursorError } = await supabase
          .from('custom_cursors')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('is_active', true)
          .maybeSingle();

        if (cursorError) {
          console.error('Error fetching cursor:', cursorError);
          setError(cursorError);
          return;
        }

        if (cursorData) {
          setCursor(cursorData);
          // Apply the cursor to the body
          document.body.style.cursor = `url(${cursorData.cursor_url}), auto`;
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error);
      }
    };

    fetchCursor();

    // Cleanup function
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [username]);

  return null; // This component doesn't render anything
};

export default CustomCursor; 