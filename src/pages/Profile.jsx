import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CustomCursor from '../components/CustomCursor';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [lastFMData, setLastFMData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchLastFMData = async (username) => {
    try {
      const apiKey = import.meta.env.VITE_LASTFM_API_KEY;
      
      // Get user info
      const userInfoResponse = await axios.get(
        `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${apiKey}&format=json`
      );
      
      // Get recent tracks
      const recentTracksResponse = await axios.get(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&limit=5&format=json`
      );
      
      // Get top artists
      const topArtistsResponse = await axios.get(
        `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${username}&api_key=${apiKey}&limit=5&format=json`
      );

      setLastFMData({
        userInfo: userInfoResponse.data.user,
        recentTracks: recentTracksResponse.data.recenttracks.track,
        topArtists: topArtistsResponse.data.topartists.artist
      });
    } catch (error) {
      console.error('Error fetching LastFM data:', error);
      setError('Failed to load LastFM data');
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profileData, error: profileError } = await supabase
          .from('profiles_new')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        
        setProfile(profileData);
        // Redirect to public profile
        navigate(`/${profileData.username}`);

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <>
      <CustomCursor />
      <div className="profile-container">
        <div className="profile-card">
          <h1>{profile.username}'s Profile</h1>
          
          {lastFMData ? (
            <div className="lastfm-data">
              <div className="user-info">
                <img 
                  src={lastFMData.userInfo.image[2]['#text'] || 'default-avatar.png'} 
                  alt={`${profile.username}'s avatar`} 
                  className="avatar"
                />
                <div className="user-stats">
                  <p>Scrobbles: {lastFMData.userInfo.playcount}</p>
                  <p>LastFM Username: <a href={`https://www.last.fm/user/${profile.lastfm_username}`} target="_blank" rel="noopener noreferrer">{profile.lastfm_username}</a></p>
                </div>
              </div>
              
              <div className="music-section">
                <h2>Recently Played</h2>
                <ul className="track-list">
                  {lastFMData.recentTracks.map((track, index) => (
                    <li key={index} className="track-item">
                      <img src={track.image[0]['#text']} alt={track.name} className="track-image" />
                      <div className="track-info">
                        <p className="track-name">{track.name}</p>
                        <p className="artist-name">{track.artist['#text']}</p>
                        {track['@attr'] && track['@attr'].nowplaying && (
                          <span className="now-playing">Now Playing</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="music-section">
                <h2>Top Artists</h2>
                <ul className="artist-list">
                  {lastFMData.topArtists.map((artist, index) => (
                    <li key={index} className="artist-item">
                      <img src={artist.image[0]['#text']} alt={artist.name} className="artist-image" />
                      <div className="artist-info">
                        <p className="artist-name">{artist.name}</p>
                        <p className="play-count">{artist.playcount} plays</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="no-lastfm-data">
              <p>No LastFM data available. Please link your LastFM account.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Profile; 