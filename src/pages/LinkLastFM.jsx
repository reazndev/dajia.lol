import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { updateLastFMUsername } from '../utils/dbHelpers';
import { clearProfileCache } from '../utils/cacheUtils';
import { LASTFM_CONFIG } from '../config/lastfm';
import { getDiscordAuthUrl } from '../utils/discordAuth';
import { FaDiscord } from 'react-icons/fa';
import md5 from 'md5';
import '../styles/LinkLastFM.css';

const LinkLastFM = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(true);
  const [lastFMConnected, setLastFMConnected] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkConnections = async () => {
      try {
        setChecking(true);
        
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        
        // Check if user already has a LastFM username
        const { data: lastfmData, error: lastfmError } = await supabase
          .from('profile_lastfm')
          .select('lastfm_username')
          .eq('profile_id', user.id)
          .single();
        
        // Check if user has Discord connected
        const { data: discordData, error: discordError } = await supabase
          .from('profile_discord')
          .select('discord_connected')
          .eq('profile_id', user.id)
          .single();
        
        // Get the username from profiles_new table
        const { data: profileData } = await supabase
          .from('profiles_new')
          .select('username')
          .eq('id', user.id)
          .single();
        
        if (lastfmData?.lastfm_username) {
          setLastFMConnected(true);
        }
        
        if (discordData?.discord_connected) {
          setDiscordConnected(true);
        }
        
        // Only redirect to profile if both are connected
        if (lastfmData?.lastfm_username && discordData?.discord_connected && profileData) {
          navigate(`/${profileData.username}`);
        }
      } catch (error) {
        console.error('Error checking connections:', error);
      } finally {
        setChecking(false);
      }
    };
    
    checkConnections();
  }, [navigate]);

  // Handle the OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const isCallback = location.pathname === '/link-lastfm/callback';
      
      if (!isCallback) return;

      const params = new URLSearchParams(location.search);
      const token = params.get('token');

      if (token) {
        try {
          setLoading(true);
          setError(null);

          // Check if LastFM is already connected in the database
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) throw new Error('Not authenticated');

          const { data: lastfmData } = await supabase
            .from('profile_lastfm')
            .select('lastfm_username')
            .eq('profile_id', currentUser.id)
            .single();

          // If LastFM is already connected, just set the state and proceed
          if (lastfmData?.lastfm_username) {
            console.log('LastFM already connected in database, proceeding...');
            setLastFMConnected(true);
            setLoading(false);
            return;
          }

          // Parameters for the getSession API call
          const apiParams = {
            method: 'auth.getSession',
            api_key: LASTFM_CONFIG.API_KEY,
            token: token
          };
          
          const signatureBase = Object.keys(apiParams)
            .sort()
            .map(key => `${key}${apiParams[key]}`)
            .join('') + LASTFM_CONFIG.API_SECRET;
          
          console.log('Debug - LastFM Auth:', {
            token,
            api_key: LASTFM_CONFIG.API_KEY,
            callback: LASTFM_CONFIG.CALLBACK_URL
          });
          
          const apiSig = md5(signatureBase);
          
          // Build the API URL with all parameters
          const urlParams = new URLSearchParams({
            ...apiParams,
            api_sig: apiSig,
            format: 'json'
          });
          
          const url = `https://ws.audioscrobbler.com/2.0/?${urlParams.toString()}`;
          
          console.log('Debug - Making LastFM API request to:', url);
          
          const response = await fetch(url);
          const responseText = await response.text();
          
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse LastFM response:', responseText);
            throw new Error('Invalid response from LastFM API');
          }
          
          if (!response.ok) {
            console.error('Last.fm API error response:', responseText);
            throw new Error(`Failed to get Last.fm session: ${response.status} ${data.message || responseText}`);
          }

          console.log('Debug - LastFM API response:', data);
          
          if (data.error) {
            throw new Error(`LastFM API Error: ${data.message || data.error}`);
          }

          // Make sure we have the session name
          if (!data.session?.name) {
            console.error('Invalid LastFM response - missing session name:', data);
            throw new Error('Invalid response from LastFM - missing username');
          }

          // Store the username in our database
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');

          console.log('Debug - Updating LastFM username:', {
            userId: user.id,
            lastfmUsername: data.session.name
          });

          await updateLastFMUsername(user.id, data.session.name);
          setLastFMConnected(true);
          
          // Don't navigate to profile yet, show Discord connection option
        } catch (error) {
          console.error('Error during Last.fm authentication:', error);
          // Don't set the error in the UI if it's a token error, as the connection might already exist
          if (!error.message.includes('Unauthorized Token')) {
            setError(error.message);
          } else {
            // Check database again after a short delay
            setTimeout(async () => {
              try {
                const { data: { user: dbUser } } = await supabase.auth.getUser();
                if (dbUser) {
                  const { data: lastfmData } = await supabase
                    .from('profile_lastfm')
                    .select('lastfm_username')
                    .eq('profile_id', dbUser.id)
                    .single();
                  
                  if (lastfmData?.lastfm_username) {
                    setLastFMConnected(true);
                  }
                }
              } catch (e) {
                console.error('Error checking LastFM connection:', e);
              }
              setLoading(false);
            }, 2000); // Check after 2 seconds
          }
        } finally {
          if (!error?.message?.includes('Unauthorized Token')) {
            setLoading(false);
          }
        }
      } else {
        console.error('No token found in callback URL');
        setError('No authentication token received from Last.fm');
      }
    };

    handleCallback();
  }, [location, navigate]);

  const handleLastFMConnect = () => {
    // Build the auth URL with all required parameters
    const authParams = new URLSearchParams({
      api_key: LASTFM_CONFIG.API_KEY,
      cb: LASTFM_CONFIG.CALLBACK_URL
    });
    
    // Redirect to Last.fm auth page
    const authUrl = `${LASTFM_CONFIG.AUTH_URL}?${authParams.toString()}`;
    console.log('Debug - Redirecting to LastFM auth URL:', authUrl);
    window.location.href = authUrl;
  };

  const handleDiscordConnect = () => {
    // Redirect to Discord auth page
    window.location.href = getDiscordAuthUrl();
  };

  const handleSkip = () => {
    navigate('/settings');
  };

  // Don't show the main UI if we're on the callback path and still loading
  if (location.pathname === '/link-lastfm/callback' && loading) {
    return (
      <div className="link-lastfm-container">
        <h1>Checking Connection Status</h1>
        <p>Please wait while we verify your connection...</p>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="link-lastfm-container">
        <h1>Link Your Accounts</h1>
        <p>Checking connection status...</p>
      </div>
    );
  }

  return (
    <div className="link-lastfm-container">
      <h1>Link Your Accounts</h1>
      {error && !error.includes('Unauthorized Token') && (
        <p className="error-message">{error}</p>
      )}
      
      <div className="connection-sections">
        <div className="lastfm-connect-section">
          <h2>Last.fm Connection</h2>
          {lastFMConnected ? (
            <div className="connection-status success">
              <p>✓ Last.fm account successfully connected!</p>
            </div>
          ) : (
            <>
              <p>Connect your Last.fm account to share your music taste and track your listening history.</p>
              <button 
                onClick={handleLastFMConnect} 
                disabled={loading}
                className="lastfm-connect-button"
              >
                {loading ? 'Connecting...' : 'Connect with Last.fm'}
              </button>
            </>
          )}
        </div>

        {(!loading || lastFMConnected) && !discordConnected && (
          <div className="discord-connect-section">
            <h2>Discord Connection</h2>
            <p>Connect your Discord account to display your Discord presence and activities.</p>
            <button 
              onClick={handleDiscordConnect}
              className="discord-connect-button"
            >
              <FaDiscord /> Connect with Discord
            </button>
          </div>
        )}

        {lastFMConnected && discordConnected && (
          <div className="connection-complete">
            <p>✓ All accounts connected successfully!</p>
            <button onClick={() => navigate('/settings')} className="continue-button">
              Continue to Settings
            </button>
          </div>
        )}

        <div className="skip-section">
          <p className="skip-text">Want to connect your accounts later?</p>
          <button onClick={handleSkip} className="skip-button">
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkLastFM; 