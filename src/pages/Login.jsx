import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/Login.css';
import { FaDiscord, FaGithub, FaGoogle, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { SiBluesky } from 'react-icons/si';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!emailOrUsername || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if input is an email (contains @ symbol)
      const isEmail = emailOrUsername.includes('@');
      
      if (isEmail) {
        // Login directly with email/password
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrUsername,
          password: password,
        });
        
        if (error) throw error;
        
        // Successful email login
        navigate('/profile');
      } else {
        // It's a username, so we need to find the associated email first
        const { data, error: userError } = await supabase
          .from('profiles_new')
          .select('id, email')
          .eq('username', emailOrUsername)
          .single();
        
        if (userError) {
          // User not found with this username
          throw new Error('Invalid username or password');
        }
        
        if (!data?.email) {
          throw new Error('No email associated with this username');
        }
        
        // Now login with the found email
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: password,
        });
        
        if (loginError) throw loginError;
        
        // Successful username login
        navigate('/profile');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
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
      console.error('Error logging in with Discord:', error);
      setError(error.message || 'An error occurred during Discord login');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'https://dajia.lol/profile'
        }
      });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-page">
      {/* Navigation Bar */}
      <nav className="glass-navbar">
        <div className="nav-left">
          <Link to="/" className="logo">大家 Dajia.lol</Link>
        </div>
        <div className="nav-right">
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/help" className="nav-link">Help</Link>
          <Link to="https://discord.gg/dhNXtEabMZ" className="nav-link">Discord</Link>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-link signup-btn">Sign up</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="login-container" style={{marginTop: '250px', marginBottom: '200px'}}>
        <div className="login-box">
          <h1>Welcome Back</h1>
          <div className="register-link">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="login-content">
            <div className="login-form-section">
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="emailOrUsername">Email or Username</label>
                  <FaUser className="input-icon" />
                  <input
                    id="emailOrUsername"
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Enter your email or username"
                    autoComplete="username"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <FaLock className="input-icon" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
                
                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            </div>

            <div className="social-login-section">
              <div className="social-login-title">...or</div>
              <button 
                className="social-login-button discord"
                onClick={handleDiscordLogin}
              >
                <FaDiscord size={20} />
                Login with Discord
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

export default Login; 