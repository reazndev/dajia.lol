import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleDiscordCallback } from '../utils/discordAuth';
import { supabase } from '../supabaseClient';

const DiscordCallback = () => {
  const [status, setStatus] = useState('Processing...');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const processCallback = async () => {
      try {
        let params;
        
        if (location.hash) {
          params = new URLSearchParams(location.hash.substring(1));
          
          if (params.get('access_token')) {
            console.log("Processing Supabase OAuth response from hash fragment");
            
            const { data, error } = await supabase.auth.setSession({
              access_token: params.get('access_token'),
              refresh_token: params.get('refresh_token')
            });
            
            if (error) {
              throw error;
            }
            
            const redirectTo = params.get('next') || '/setup-profile';
            setStatus('Successfully authenticated with Discord!');
            setTimeout(() => navigate(redirectTo), 1500);
            return;
          }
        }
        
        params = new URLSearchParams(location.search);
        const code = params.get('code');
        
        console.log("URL params:", location.search);
        console.log("Code received:", code);
        
        if (!code) {
          setStatus('Error: No authorization code received');
          return;
        }

        const isSupabaseOAuth = params.get('provider') === 'discord';
        
        if (isSupabaseOAuth) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            throw error;
          }
          
          const redirectTo = params.get('next') || '/profile';
          setTimeout(() => navigate(redirectTo), 1500);
          return;
        }
        
        setStatus('Connecting to Discord...');
        const result = await handleDiscordCallback(code);
        
        if (result.success) {
          setStatus('Successfully linked Discord account!');
          setTimeout(() => navigate('/settings'), 1500);
        } else {
          setStatus(`Error: ${result.error}`);
        }
      } catch (error) {
        console.error('Error in Discord callback:', error);
        setStatus(`Error: ${error.message}`);
      }
    };
    
    processCallback();
  }, [location, navigate]);

  return (
    <div className="auth-container">
      <h1>Linking Discord Account</h1>
      <div className="status-message">{status}</div>
    </div>
  );
};

export default DiscordCallback; 