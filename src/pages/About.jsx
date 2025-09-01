import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/Subpage.css';
import { MdEmail } from 'react-icons/md';
import { FaDiscord, FaGithub } from 'react-icons/fa';
import { SiBluesky } from 'react-icons/si';

const About = () => {
  const [session, setSession] = useState(null);

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

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <div className="subpage">
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
      <br /> <br />
      {/* Main Content */}
      <div className="subpage-container" style={{marginBottom: '150px'}}>
        <h1 className="subpage-title">About Dajia.lol</h1>
        <p className="subpage-subtitle">
          Your all-in-one platform for sharing music taste and managing your online presence
        </p>

        <div className="subpage-content">
          <div className="subpage-section">
            <h2 className="section-heading">Our Mission</h2>
            <p className="section-text">
              Dajia.lol is a platform that lets you showcase your music taste and share all your important links in one
              beautiful, customizable page. It's perfect for music enthusiasts, creators, and anyone who wants a personal
              corner on the internet.
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">Our Team</h2>
            <p className="section-text">
              Dajia is a solo project by <a href="http://dajia.lol/reazn" target="_blank">@reazn</a>. Find out more about the team <a href="/team">here</a>!
            </p>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">Key Features</h2>
            
            <div className="features-grid">
              <div className="feature-box">
                <h2 className="section-heading">Share your LastFM data</h2>
                <p className="section-text">
                  Connect your LastFM account to share your music taste with real-time data.
                </p>
              </div>

              <div className="feature-box">
                <h2 className="section-heading">All your links in one place</h2>
                <p className="section-text">
                  Share all your social media and other important links in a personalized place.
                </p>
              </div>

              <div className="feature-box">
                <h2 className="section-heading">Customizability</h2>
                <p className="section-text">
                  Personalize the look of your page with custom backgrounds, colors, fonts and much more.
                </p>
              </div>

              <div className="feature-box">
                <h2 className="section-heading">Community</h2>
                <p className="section-text">
                  Find yourself a home in a community full of like minded people.
                </p>
              </div>
            </div>
          </div>

          <div className="subpage-section">
            <h2 className="section-heading">Get Started</h2>
            <p className="section-text">
              Ready to create your own personalized page? Sign up now and join our growing community of creators and music enthusiasts.
            </p>
            <div className="cta-section" style={{ marginTop: '20px' }}>
              <Link to="/register" className="signup-btn" style={{ padding: '12px 24px', textDecoration: 'none' }}>Create Your Page</Link>
              <Link to="/help" style={{ marginLeft: '20px', color: 'var(--text-secondary)', textDecoration: 'none' }}>Need Help?</Link>
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
            <h2>General</h2>
            <Link to="/pricing" className="footer-link">Pricing</Link>
            <Link to="/help" className="footer-link">Need help?</Link>
            <Link to="/team" className="footer-link">Team</Link>
          </div>

          <div className="footer-column">
            <h2>Legal</h2>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About; 