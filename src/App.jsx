import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import LinkLastFM from './pages/LinkLastFM.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Settings from './pages/Settings.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import SimpleLinkTest from './pages/SimpleLinkTest.jsx';
import About from './pages/About.jsx';
import Help from './pages/Help.jsx';
import CustomCursor from './components/CustomCursor';
import { checkDatabaseSetup } from './utils/initializeDatabase';
import DiscordCallback from './pages/DiscordCallback';
import SetupProfile from './pages/SetupProfile.jsx';
import './App.css';
import './styles/fonts.css';
import Pricing from './pages/subpages/Pricing';
import Team from './pages/subpages/Team';
import Terms from './pages/subpages/Terms';
import Privacy from './pages/subpages/Privacy';

function App() {
  useEffect(() => {
    const initDb = async () => {
      try {
        const result = await checkDatabaseSetup();
        if (!result.success) {
          console.warn('Database initialization had some issues:', 
            result.message || 'Unknown error');
          
          if (result.error && typeof result.error === 'object') {
            console.error('Error details:', result.error);
          }
        }
      } catch (error) {
        console.error('Database initialization failed:', error);
      }
    };
    
    initDb();
  }, []);

  return (
    <div className="app" style={{ fontFamily: 'inherit' }}>
      <CustomCursor />
      <Router>
        <Routes>
          {/* Static routes (these paths are disallowed in usernames) */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/team" element={<Team />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/link-lastfm" element={<ProtectedRoute><LinkLastFM /></ProtectedRoute>} />
          
          {/* Auth callback routes - must be before username route */}
          <Route path="/discord-callback" element={<DiscordCallback />} />
          <Route path="/link-lastfm/callback" element={<LinkLastFM />} />
          <Route path="/auth/lastfm/callback" element={<LinkLastFM />} />
          <Route path="/simple-link-test" element={<SimpleLinkTest />} />
          
          {/* Setup profile route - must be before username route */}
          <Route path="/setup-profile" element={<ProtectedRoute><SetupProfile /></ProtectedRoute>} />
          
          {/* Username route - matches any path not matched above */}
          <Route path="/:username" element={<PublicProfile />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App; 