import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { updateAppearance, updateLastFMUsername, updateDiscordData } from '../utils/dbHelpers';
import '../styles/Register.css';
import { FaDiscord, FaGithub, FaGoogle, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { SiBluesky } from 'react-icons/si';

// banned usernames (no more dajia.lol/docs...)
const RESERVED_USERNAMES = [
  'settings', 'terms', 'privacy', 'admin', 'team', 'help', 'pricing',
  'docs', 'api', 'blog', 'about', 'contact', 'support', 'login',
  'register', 'dashboard', 'link-lastfm', 'link-discord', 'setup-profile',
  'setupprofile', 'setup_profile'
];

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(location.state?.username || '');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();
  }, []);

  // Add input validation before registration
  const validateInputs = () => {
    if (!username || username.trim().length < 1) {
      return 'Username must be at least 1 character';
    }
    
    if (username.includes(' ')) {
      return 'Username cannot contain spaces';
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, underscores, and dashes';
    }

    // Check if username is reserved
    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      return 'This username is reserved and cannot be used';
    }
    
    if (!email || !email.includes('@') || !email.includes('.')) {
      return 'Please enter a valid email address';
    }
    
    if (!password || password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    
    return null;
  }

  const handleSocialLogin = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'https://dajia.lol/link-lastfm'
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Convert username to lowercase before validation
      const lowercaseUsername = username.toLowerCase();
      setUsername(lowercaseUsername);
      
      // Validate inputs first
      const validationError = validateInputs();
      if (validationError) {
        setError(validationError);
        return;
      }
      
      console.log('Starting registration process for:', email, lowercaseUsername);
      
      // Check if username is already taken
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('profiles_new')
        .select('username')
        .eq('username', lowercaseUsername)
        .single();
      
      if (existingUser) {
        setError('Username is already taken. Please choose another one.');
        return;
      }
      
      if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
        // PGRST116 means no rows returned aka what we need
        console.error('Error checking username:', usernameCheckError);
      }
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: lowercaseUsername,
            display_name: displayName
          }
        }
      });

      if (authError) {
        console.error('Auth error during signup:', authError);
        throw authError;
      }

      console.log('Auth signup successful:', authData);

      if (authData.user) {
        const userId = authData.user.id;
        const now = new Date().toISOString();
        
        console.log('Creating profile data for user ID:', userId);

        try {
          console.log('Attempting to create core profile record');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles_new')
            .upsert({
              id: userId,
              username: lowercaseUsername,
              email,
              created_at: now,
              updated_at: now,
            }, { onConflict: 'id' });
          
          if (profileError) {
            console.error("Error creating profile:", profileError);
            throw new Error(`Error creating profile: ${profileError.message}`);
          }
          
          console.log('Profile created successfully:', profileData);

          console.log('Attempting to create appearance settings');
          const defaultAppearance = {
            accent_color: '#8b5cf6',
            bg_color: '#1f1f2c',
            widget_bg_color: '#1f1f2c',
            bg_opacity: 0.7,
            content_opacity: 0.7,
            icon_color: '#ffffff',
            primary_text_color: '#ffffff',
            secondary_text_color: '#b9bbbe',
            tertiary_text_color: '#72767d',
            presence_border_radius: 12,
            font_family: 'Inter'
          };
          
          const appearanceResult = await updateAppearance(userId, defaultAppearance);
          console.log('Appearance settings created successfully:', appearanceResult);

          // Initialize discord settings
          console.log('Attempting to create discord settings');
          const discordSettings = {
            discord_connected: false
          };
          
          const discordResult = await updateDiscordData(userId, discordSettings);
          console.log('Discord settings created successfully:', discordResult);

          // Initialize lastfm settings
          console.log('Attempting to create lastfm settings');
          const lastfmResult = await updateLastFMUsername(userId, '');
          console.log('LastFM settings created successfully:', lastfmResult);
          
          console.log('Registration process completed successfully');

          // Navigate to LastFM link page
          navigate('/link-lastfm');
        } catch (dbError) {
          console.error('Database error during registration:', dbError);
          
          try {
            console.log('Cleaning up auth user due to database error');
            await supabase.auth.signOut();
          } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
          }
          
          throw new Error(`Database error: ${dbError.message}`);
        }
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordSignup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: 'https://dajia.lol/setup-profile'
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error signing up with Discord:', error);
      setError(error.message || 'An error occurred during Discord signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Navigation Bar */}
      <nav className="glass-navbar">
        <div className="nav-left">
          <Link to="/" className="logo">大家 Dajia.lol</Link>
        </div>
        <div className="nav-right">
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/help" className="nav-link">Help</Link>
          <Link to="https://discord.gg/dhNXtEabMZ" className="nav-link">Discord</Link>
          
          {session ? (
            <Link to="/settings" className="nav-link dashboard-btn">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link signup-btn">Sign up</Link>
            </>
          )}
        </div>
      </nav>
      {/* Main Content */}
      <div className="register-container" style={{marginTop: '150px', marginBottom: '50px'}}>
        <div className="register-box">
          <h1>Create Account</h1>
          <div className="login-link" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Already have an account? <Link to="/login">Login</Link>
          </div>
          {error && <div className="error-message">{error}</div>}
          
          <div className="register-content">
            <div className="register-form-section">
              <form onSubmit={handleRegister} className="register-form">
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
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
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
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <FaEnvelope className="input-icon" />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <FaLock className="input-icon" />
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="terms-checkbox">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <label htmlFor="terms">
                    I agree to the <Link to="/terms">Terms of Service</Link>
                  </label>
                </div>
                <button type="submit" className="register-button" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create an account'}
                </button>
              </form>
            </div>

            <div className="social-login-section">
              <div className="social-login-title">...or</div>
              <button 
                className="social-login-button discord"
                onClick={handleDiscordSignup}
              >
                <FaDiscord size={20} />
                Register with Discord
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">大家 Dajia.lol</Link>
            <p className="footer-description">Create modern, feature-rich biolinks with a few clicks.</p>
            <div className="footer-social">
              <a href="mailto:contact@dajia.lol" className="social-icon"><MdEmail /></a>
              <a href="https://discord.gg/dhNXtEabMZ" className="social-icon"><FaDiscord /></a>
              <a href="https://bsky.app/profile/dajia.lol" className="social-icon"><SiBluesky /></a>
              <a href="https://github.com/Dajialol" className="social-icon"><FaGithub /></a>
            </div>
            <p className="footer-copyright">Copyright © 2025 dajia.lol. All rights reserved.</p>
          </div>

          <div className="footer-column">
            <h3>General</h3>
            <Link to="/pricing" className="footer-link">Pricing</Link>
            <Link to="/help" className="footer-link">Need help?</Link>
            <Link to="/team" className="footer-link">Team</Link>
          </div>

          <div className="footer-column">
            <h3>Legal</h3>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Register; 