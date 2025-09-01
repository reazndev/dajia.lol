import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import '../../styles/Subpage.css';
import { MdEmail } from 'react-icons/md';
import { FaDiscord, FaGithub, FaTimes } from 'react-icons/fa';
import { SiBluesky } from 'react-icons/si';

const Privacy = () => {
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
        <h1 className="subpage-title">Privacy Policy</h1>
        <div className="subpage-content">
          <div className="subpage-section">
            <h2 className="section-heading">Information We Collect</h2>
            <p className="section-text">
              We collect information you provide directly to us when you create an account, such as your email address, username, and any profile information you choose to share.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">How We Use Your Information</h2>
            <p className="section-text">
              We use the information we collect to:
            </p>
            <ul className="section-text" style={{paddingLeft: '20px'}}>
              <li>Provide, maintain, and improve our services</li>
              <li>Send you technical notices and support messages</li>
              <li>Communicate with you about products, services, and events</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">Information Sharing</h2>
            <p className="section-text">
              We do not share your personal information with third parties except as described in this privacy policy. We may share your information with:
            </p>
            <ul className="section-text" style={{paddingLeft: '20px'}}>
              <li>Service providers who assist in our operations</li>
              <li>Professional advisors</li>
              <li>Law enforcement when required by law</li>
            </ul>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">Data Security</h2>
            <p className="section-text">
              We implement appropriate technical and organizational measures to protect the security of your personal information. However, no security system is impenetrable and we cannot guarantee the security of our systems 100%.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">Your Rights</h2>
            <p className="section-text">
              You have the right to:
            </p>
            <ul className="section-text" style={{paddingLeft: '20px'}}>
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to our use of your information</li>
              <li>Request a copy of your information</li>
            </ul>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">Contact Us</h2>
            <p className="section-text">
              If you have any questions about this Privacy Policy, please contact us at privacy@dajia.lol
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

export default Privacy; 