import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/Register.css';
import { FaUser } from 'react-icons/fa';

// banned usernames 
const RESERVED_USERNAMES = [
  'settings', 'terms', 'privacy', 'admin', 'team', 'help', 'pricing',
  'docs', 'api', 'blog', 'about', 'contact', 'support', 'login',
  'register', 'dashboard', 'link-lastfm', 'link-discord', 'setup-profile',
  'setupprofile', 'setup_profile'
];

const SetupProfile = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Pre-fill display name from Discord if available
      if (user.user_metadata?.full_name) {
        setDisplayName(user.user_metadata.full_name);
      }
      if (user.user_metadata?.username) {
        // Suggest a username based on Discord username, removing special characters
        const suggestedUsername = user.user_metadata.username.replace(/[^a-zA-Z0-9_-]/g, '');
        setUsername(suggestedUsername);
      }
    };

    checkAuth();
  }, [navigate]);

  const validateUsername = (username) => {
    if (!username || username.trim().length < 1) {
      return 'Username must be at least 1 character';
    }
    
    if (username.includes(' ')) {
      return 'Username cannot contain spaces';
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, underscores, and dashes';
    }

    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      return 'This username is reserved and cannot be used';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      // Convert username to lowercase
      const lowercaseUsername = username.toLowerCase();

      // Validate username
      const usernameError = validateUsername(lowercaseUsername);
      if (usernameError) {
        setError(usernameError);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check if username is already taken
      const { data: existingUser } = await supabase
        .from('profiles_new')
        .select('username')
        .eq('username', lowercaseUsername)
        .single();

      if (existingUser) {
        setError('Username is already taken');
        return;
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          username: lowercaseUsername,
          display_name: displayName
        }
      });

      // Create or update profile
      const { error: profileError } = await supabase
        .from('profiles_new')
        .upsert({
          id: user.id,
          username: lowercaseUsername,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw profileError;
      }

      // Navigate to LastFM link page
      navigate('/link-lastfm');
    } catch (error) {
      console.error('Error setting up profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container" style={{marginTop: '150px', marginBottom: '50px'}}>
        <div className="register-box">
          <h1>Complete Your Profile</h1>
          <p className="setup-description">Choose your username and display name to complete your profile setup.</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="username-input-wrapper">
                <span className="input-icon at-symbol">@</span>
                <span className="username-prefix">dajia.lol/</span>
                <input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="displayName">Display name</label>
              <FaUser className="input-icon" />
              <input
                id="displayName"
                type="text"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="register-button" disabled={loading}>
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupProfile; 