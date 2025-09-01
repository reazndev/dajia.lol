import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/Home.css';
import { FaLink, FaMusic, FaPalette, FaDiscord, FaTwitter, FaYoutube, FaInstagram, FaTiktok, FaLinkedin, FaGithub, FaTimes } from 'react-icons/fa';
import { FaThreads } from 'react-icons/fa6';
import { MdEmail } from 'react-icons/md';
import { SiBluesky } from 'react-icons/si';

const Home = () => {
  const [session, setSession] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [username, setUsername] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };

    fetchSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Add overflow:hidden to body when mobile menu is open
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      subscription?.unsubscribe();
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSignup = () => {
    navigate('/register', { state: { username } });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <nav className="glass-navbar">
        <div className="nav-left">
          <Link to="/" className="logo">大家 Dajia.lol</Link>
        </div>
        
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div className="nav-right">
          <Link to="/about" className="nav-link">About</Link>
          <Link to="/help" className="nav-link">Help</Link>
          <Link to="https://discord.gg/dhNXtEabMZ" className="nav-link">Discord</Link>
          
          {session ? (
            <Link to="settings" className="nav-link dashboard-btn">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link signup-btn">Sign up</Link>
            </>
          )}
        </div>
      </nav>
      
      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <button className="mobile-menu-close" onClick={toggleMobileMenu} aria-label="Close menu">
          <FaTimes />
        </button>
        <div className="mobile-menu-links">
          <Link to="/about" className="mobile-menu-link" onClick={toggleMobileMenu}>About</Link>
          <Link to="/help" className="mobile-menu-link" onClick={toggleMobileMenu}>Help</Link>
          <Link to="https://discord.gg/dhNXtEabMZ" className="mobile-menu-link" onClick={toggleMobileMenu}>Discord</Link>
          
          {session ? (
            <Link to="settings" className="mobile-menu-link" onClick={toggleMobileMenu}>Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="mobile-menu-link" onClick={toggleMobileMenu}>Login</Link>
              <Link to="/register" className="mobile-menu-link" onClick={toggleMobileMenu}>Sign up</Link>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div className="mobile-menu-backdrop" onClick={toggleMobileMenu}></div>
      )}

      {/* Main Content */}
      <div className="home-content">
        <div className="home-left">
          <h1 className="main-title">Dajia.lol</h1>
          <p className="subtitle">
            Your customizable corner on the internet - showcase your music taste & share all your links in one personalized place.
          </p>
          <div className="signup-section">
            <div className="domain-section">
              <input
                type="text"
                className="username-input-home"
                placeholder="username"
                spellCheck="false"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.0)', 
                  border: 'none', 
                  fontSize: '1em',
                  width: '100%'
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <div className={`domain-box ${inputFocused ? 'input-focused' : ''}`} style={{fontSize: '1em'}}>
                <span className={`domain-prefix ${inputFocused ? 'input-focused' : ''}`}>dajia.lol/</span>
              </div>
            </div>
            <button onClick={handleSignup} className="signup-button-home" style={{fontSize: '1em'}}>Create My Page</button>
          </div>
        </div>
        
        <div className="home-right">
          <div className="browser-window">
            <div className="browser-header">
              <div className="browser-controls">
                <div className="browser-control red"></div>
                <div className="browser-control yellow"></div>
                <div className="browser-control green"></div>
              </div>
              <div className="browser-address">www.dajia.lol/reazn</div>
            </div>
            <div className="browser-content">
              {/* Using a video element to display the demo profile */}
              <video 
                src="/assets/showcase.mp4" 
                className="demo-iframe"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* About Section */}
      <section className="about-section" style={{marginBottom: '150px'}}>
        <h2 className="section-title">Why Choose Dajia.lol?</h2>
        <p className="section-subtitle">
          Create your unique digital identity with our powerful and customizable platform
        </p>
        
        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon">
              <FaLink />
            </div>
            <h3 className="about-title">All Links in One Place</h3>
            <p className="about-description">
              Put all your social media, websites, and content in one simple link. Easy to share, great for anyone who wants to show off their online presence.
            </p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">
              <FaMusic />
            </div>
            <h3 className="about-title">Share Your Music</h3>
            <p className="about-description">
              Show off your favorite tracks, recent plays and playlists from all your music platforms. Let people exploree your taste and share your vibe with ease.            </p>
          </div>
          
          <div className="about-card">
            <div className="about-icon">
              <FaPalette />
            </div>
            <h3 className="about-title">Full Customization</h3>
            <p className="about-description">
              Make your page truly yours with our extensive customization options. Guaranteed to match your unique style.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{marginBottom: '-60px'}}>
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

export default Home; 