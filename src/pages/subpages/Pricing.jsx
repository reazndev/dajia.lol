import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../styles/Subpage.css';
import { FaDiscord, FaGithub, FaTimes } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { SiBluesky } from 'react-icons/si';

const Pricing = () => {
  const [session, setSession] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="subpage">
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
          <Link to="https://discord.gg/kfcUExCjAQ" className="nav-link">Discord</Link>
          
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

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <button className="mobile-menu-close" onClick={toggleMobileMenu} aria-label="Close menu">
          <FaTimes />
        </button>
        <div className="mobile-menu-links">
          <Link to="/about" className="mobile-menu-link" onClick={toggleMobileMenu}>About</Link>
          <Link to="/help" className="mobile-menu-link" onClick={toggleMobileMenu}>Help</Link>
          <Link to="https://discord.gg/kfcUExCjAQ" className="mobile-menu-link" onClick={toggleMobileMenu}>Discord</Link>
          
          {session ? (
            <Link to="/settings" className="mobile-menu-link" onClick={toggleMobileMenu}>Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="mobile-menu-link" onClick={toggleMobileMenu}>Login</Link>
              <Link to="/register" className="mobile-menu-link" onClick={toggleMobileMenu}>Sign up</Link>
            </>
          )}
        </div>
      </div>

      <br /> <br /> <br />
      {/* Main Content */}
      <div className="subpage-container"style={{marginBottom: '450px'}}>
        <h1 className="subpage-title">Pricing</h1>
        <p className="subpage-subtitle">
          Our goal is to provide a free service for everyone. We guarantee that there will always be a free tier, and no features will ever be removed or locked behind a paywall.
          <br /><br />
          That said, we may introduce a premium tier in the future to help cover server costs.
          <br /> <br />
          If you want to help us out covering our server costs then feel free to donate and receive a custom badge.
        </p>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">大家 Dajia.lol</Link>
            <p className="footer-description">Create modern, feature-rich biolinks with a few clicks.</p>
            <div className="footer-social">
              <a href="mailto:contact@dajia.lol" className="social-icon"><MdEmail /></a>
              <a href="https://discord.gg/kfcUExCjAQ" className="social-icon"><FaDiscord /></a>
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

export default Pricing; 