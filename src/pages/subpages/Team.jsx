import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../styles/Subpage.css';
import { FaDiscord, FaGithub, FaTimes } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { SiBluesky } from 'react-icons/si';

const Team = () => {
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
          <Link to="https://dajia.lol" className="logo">大家 Dajia.lol</Link>
        </div>
        
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div className="nav-right">
          <Link to="https://dajia.lol/about" className="nav-link">About</Link>
          <Link to="/help" className="nav-link">Help</Link>
          <Link to="https://discord.gg/kfcUExCjAQ" className="nav-link">Discord</Link>
          
          {session ? (
            <Link to="/" className="nav-link dashboard-btn">Dashboard</Link>
          ) : (
            <>
              <Link to="https://dajia.lol/login" className="nav-link">Login</Link>
              <Link to="https://dajia.lol/register" className="nav-link signup-btn">Sign up</Link>
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
          <Link to="https://dajia.lol/about" className="mobile-menu-link" onClick={toggleMobileMenu}>About</Link>
          <Link to="/help" className="mobile-menu-link" onClick={toggleMobileMenu}>Help</Link>
          <Link to="https://discord.gg/kfcUExCjAQ" className="mobile-menu-link" onClick={toggleMobileMenu}>Discord</Link>
          
          {session ? (
            <Link to="/" className="mobile-menu-link" onClick={toggleMobileMenu}>Dashboard</Link>
          ) : (
            <>
              <Link to="https://dajia.lol/login" className="mobile-menu-link" onClick={toggleMobileMenu}>Login</Link>
              <Link to="https://dajia.lol/register" className="mobile-menu-link" onClick={toggleMobileMenu}>Sign up</Link>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <br /> <br /> <br />
      <div className="subpage-container">
        <h1 className="subpage-title">Our Team</h1>
        <p className="subpage-subtitle">
          Dajia.lol is currently a solo project, but I'm actively looking for people to help out.
          <br /><br />
          Right now, I'm looking for support in the following areas:
          <li>Development of Dajia.lol & other projects</li>
          <li>Moderating the Discord server</li>
          <li>Graphic design</li>
          <li>General support</li>
          <br />
        </p>
        
        <div className="contact-boxes">
          <Link to="https://discord.gg/kfcUExCjAQ" className="contact-box discord">
            <FaDiscord className="contact-icon" />
            <div className="contact-text">
              <h3>Join our Discord</h3>
              <p>Connect with the community</p>
            </div>
          </Link>
          
          <a href="mailto:contact@dajia.lol" className="contact-box email">
            <MdEmail className="contact-icon" />
            <div className="contact-text">
              <h3>Send us an Email</h3>
              <p>Get in touch directly</p>
            </div>
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="https://dajia.lol" className="footer-logo">大家 Dajia.lol</Link>
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

export default Team; 