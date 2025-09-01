import React, { useState, useEffect } from 'react';
import { fetchWithCorsProxy } from '../utils/corsHelper';

const SteamProfile = ({ steamId }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSteamProfile = async () => {
      if (!steamId) {
        setError('Steam ID is required');
        setLoading(false);
        return;
      }

      try {
        const apiKey = import.meta.env.VITE_STEAM_API_KEY;
        
        // Use our CORS proxy helper that tries multiple proxies
        // Fetch user summary data
        const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
        const summaryResponse = await fetchWithCorsProxy(summaryUrl);
        const summaryData = await summaryResponse.json();
        
        if (!summaryData.response.players.length) {
          throw new Error('Steam user not found');
        }
        
        const playerInfo = summaryData.response.players[0];
        
        // Fetch player level
        const levelUrl = `https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${apiKey}&steamid=${steamId}`;
        const levelResponse = await fetchWithCorsProxy(levelUrl);
        const levelData = await levelResponse.json();
        
        // Fetch recently played games
        const recentGamesUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${apiKey}&steamid=${steamId}&count=10`;
        const recentGamesResponse = await fetchWithCorsProxy(recentGamesUrl);
        const recentGamesData = await recentGamesResponse.json();
        
        // Combine all data
        const fullProfileData = {
          ...playerInfo,
          level: levelData?.response?.player_level || 0,
          recentGames: recentGamesData?.response?.games || []
        };
        
        setProfileData(fullProfileData);
      } catch (err) {
        console.error('Steam API error:', err);
        setError(err.message || 'Failed to load Steam profile');
      } finally {
        setLoading(false);
      }
    };

    fetchSteamProfile();
  }, [steamId]);

  // Format Unix timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  // Calculate total playtime in last two weeks
  const calculateTotalPlaytime = (games) => {
    if (!games || !games.length) return 0;
    return games.reduce((total, game) => total + (game.playtime_2weeks || 0), 0);
  };

  if (loading) {
    return <div className="steam-profile loading">Loading Steam profile...</div>;
  }

  if (error) {
    return <div className="steam-profile error">Error: {error}</div>;
  }

  if (!profileData) {
    return <div className="steam-profile empty">No Steam profile data available</div>;
  }

  // Calculate total hours
  const totalMinutes = calculateTotalPlaytime(profileData.recentGames);
  const totalHours = Math.round(totalMinutes / 60);
  const hasRecentActivity = totalMinutes > 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginLeft: '28px',
      marginTop: '10px'
    }}>
      <img 
        src={profileData.avatarfull} 
        alt={profileData.personaname}
        style={{
          width: '47px',
          height: '47px',
          borderRadius: '8px',
          objectFit: 'cover',
          marginLeft: '-30px',
          marginTop: '-10px'
        }}
      />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginLeft: '-4px',
        marginTop: '-10px',
        flex: 1,
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          fontSize: '14px',
          color: 'var(--secondary-text-color)'
        }}>
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            color: 'var(--secondary-text-color)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#8c8c8c',
              display: 'inline-block'
            }}></span>
            Level {profileData.level} • Since {formatDate(profileData.timecreated)}
          </span>
          
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            color: 'var(--secondary-text-color)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: hasRecentActivity ? '#3ba55c' : '#8c8c8c',
              display: 'inline-block'
            }}></span>
            {hasRecentActivity 
              ? `${totalHours} hours played in past 2 weeks` 
              : 'No recent activity'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SteamProfile; 