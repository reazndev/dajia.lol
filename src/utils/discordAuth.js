import { supabase } from '../supabaseClient';
import { updateDiscordData } from './dbHelpers';
import { clearProfileCache } from './cacheUtils';

// Discord OAuth2 configuration
const DISCORD_CLIENT_ID = '1327212247730356234'; // Hardcoded
const DISCORD_REDIRECT_URI = 'https://dajia.lol/discord-callback';
const DISCORD_GUILD_ID = import.meta.env.VITE_DISCORD_GUILD_ID || '1171817659403165746';

// Generate Discord auth URL
export const getDiscordAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify'
  });
  
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
};

// Handle Discord auth callback
export const handleDiscordCallback = async (code) => {
  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: import.meta.env.VITE_DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Failed to get Discord token');
    }

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();
    
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to link Discord');
    }

    // Get username for cache clearing
    const { data: profileData } = await supabase
      .from('profiles_new')
      .select('username')
      .eq('id', user.id)
      .single();

    await updateDiscordData(user.id, {
      discord_id: userData.id,
      discord_username: userData.username,
      discord_avatar: userData.avatar ? 
        `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : 
        null,
      discord_token: tokenData.access_token,
      discord_refresh_token: tokenData.refresh_token,
      discord_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      discord_connected: true,
      updated_at: new Date().toISOString()
    });

    // Clear the profile cache
    if (profileData?.username) {
      clearProfileCache(profileData.username);
    }

    return { success: true, userData };
  } catch (error) {
    console.error('Discord auth error:', error);
    return { success: false, error: error.message };
  }
};

// Disconnect Discord
export const disconnectDiscord = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('You must be logged in to disconnect Discord');
    }
    
    // Get username for cache clearing
    const { data: profileData } = await supabase
      .from('profiles_new')
      .select('username')
      .eq('id', user.id)
      .single();
    
    // Update Discord data to disconnect
    await updateDiscordData(user.id, {
      discord_connected: false,
    });
    
    // Clear the profile cache
    if (profileData?.username) {
      clearProfileCache(profileData.username);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting Discord:', error);
    return { success: false, error: error.message };
  }
}; 