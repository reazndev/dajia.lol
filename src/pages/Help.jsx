import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/Subpage.css';
import { FaQuestionCircle, FaDiscord, FaGithub } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { SiBluesky } from 'react-icons/si';

const Help = () => {
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


      {/* Main Content */}
      <br /> <br /> <br />
      <div className="subpage-container">
        <h1 className="subpage-title">Need Help?</h1>
        
        <div className="help-docs-box">
          <Link to="https://www.notion.so/reazn/Dajia-lol-Documentation-1ec0893d5194809d807cfcc0c8aed579?pvs=4" className="help-docs-link">
            <span>View our documentation for extensive guides</span>
          </Link>
        </div>

        <p className="subpage-subtitle">
          Find answers to commonly asked questions about using Dajia.lol.
        </p>

        <div className="help-item">
          <div className="help-question">
            <FaQuestionCircle />
            How do I create my profile?
          </div>
          <div className="help-answer">
            Simply click the <a href="/register">Sign Up</a> button, choose your username, provide your LastFM account and optionally your Discord account and you're done!
          </div>
        </div>

        <div className="help-item">
          <div className="help-question">
            <FaQuestionCircle />
            Can I customize my profile's appearance?
          </div>
          <div className="help-answer">
            Yes! You can customize colors, fonts, layouts, background image, add links, add custom boxes, cursors and even your own audio.
          </div>
        </div>


        <div className="help-item">
          <div className="help-question">
            <FaQuestionCircle />
            Is my data secure?
          </div>
          <div className="help-answer">
            We take security seriously. We will never share your personal information with third parties. Your data is safely stored at <a href="https://supabase.com/" target="_blank">Supabase </a> Read our Privacy Policy for more details.
          </div>
        </div>

        <div className="help-item">
          <div className="help-question">
            <FaQuestionCircle />
            How do I contact support?
          </div>
          <div className="help-answer">
          You can reach us through our <a href="https://discord.gg/dhNXtEabMZ" target="_blank" rel="noopener noreferrer">Discord community</a> or email us at support@dajia.lol
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

export default Help; 