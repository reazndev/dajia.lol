import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../styles/Subpage.css';
import { MdEmail } from 'react-icons/md';
import { FaDiscord, FaGithub, FaTimes } from 'react-icons/fa';
import { SiBluesky } from 'react-icons/si';

const Terms = () => {
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
        <br /> <br />
      {/* Main Content */}
      <div className="subpage-container" style={{marginBottom: '150px'}}>
        <h1 className="subpage-title">Terms of Service</h1>
        <div className="subpage-content">
          <div className="subpage-section">
            <h2 className="section-heading">1. Acceptance of Terms</h2>
            <p className="section-text">
              By accessing and using Dajia.lol, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">2. Description of Service</h2>
            <p className="section-text">
              Dajia.lol provides users with a platform to create and manage their online presence through customizable profile pages and link management tools.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">3. User Conduct</h2>
            <p className="section-text">
              You agree not to use the service for any unlawful purposes or to conduct yourself in a manner that is likely to result in damage to Dajia.lol's reputation.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">4. Account Terms</h2>
            <p className="section-text">
              You are responsible for maintaining the security of your account and password. Dajia.lol cannot and will not be liable for any loss or damage from your failure to comply with this security obligation.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">5. Content Guidelines</h2>
            <p className="section-text">
              You retain your rights to any content you submit, post or display on or through the service. By submitting, posting or displaying content on or through the service, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">6. Termination</h2>
            <p className="section-text">
              We reserve the right to suspend or terminate your account and refuse any and all current or future use of the Service for any reason at any time.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">7. Changes to Terms</h2>
            <p className="section-text">
              We reserve the right to modify or replace these Terms at any time. We'll notify you of any changes by posting the new Terms on the website.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">8. Privacy & Data Protection</h2>
            <p className="section-text">
            We are committed to protecting your personal data. Our collection, use, and storage of personal information is governed by our{' '}
            <a href="https://dajia.lol/privacy" className="text-blue-600 underline">
              Privacy Policy
            </a>, which complies with the General Data Protection Regulation (GDPR) and applicable Swiss data protection laws. By using the Service, you consent to the processing of your personal data in accordance with the Privacy Policy.
            </p>
          </div>
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

export default Terms; 