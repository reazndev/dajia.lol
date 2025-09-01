// not needed anymore but no reason to remove -> might cause issues just dont



import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { updateSocialLinks } from '../utils/dbHelpers';

const SimpleLinkTest = () => {
  const [github, setGithub] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Get current social links from social_links table
        const { data } = await supabase
          .from('social_links')
          .select('platform, url')
          .eq('profile_id', user.id)
          .eq('platform', 'github')
          .single();
          
        if (data && data.url) {
          setGithub(data.url);
        }
      }
    }
    getUser();
  }, []);

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      if (!userId) {
        setMessage('User not authenticated');
        return;
      }
      
      const links = { github };
      console.log('Saving link:', links);
      
      // Use the updateSocialLinks helper to properly update the social_links table
      await updateSocialLinks(userId, links);
      
      setMessage('Link saved successfully!');
      console.log('Link saved successfully');
    } catch (error) {
      console.error('Error saving link:', error);
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h1>Simple Link Test</h1>
      {message && <div style={{ 
        padding: '10px', 
        background: message.includes('Error') ? '#ffcccc' : '#ccffcc',
        marginBottom: '20px'
      }}>{message}</div>}
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          GitHub Username:
        </label>
        <input
          type="text"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px', 
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>
      
      <button
        onClick={handleSave}
        disabled={loading}
        style={{
          padding: '10px 15px',
          background: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Saving...' : 'Save Link'}
      </button>
    </div>
  );
};

export default SimpleLinkTest; 