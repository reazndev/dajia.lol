import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import axios from 'axios';
import { getNextLastFMApiKey, getMultipleLastFMApiKeys, getNextSpotifyCredentials } from '../utils/apiKeys';
import SocialLinks from '../components/SocialLinks';
import ReactMarkdown from 'react-markdown';
import { FaPlay, FaUser, FaHome } from 'react-icons/fa';
import { getCompleteProfileByUsername } from '../utils/dbHelpers';
import { generateCacheKey, getCache, setCache } from '../utils/cacheUtils';
import CustomBoxes from '../components/CustomBoxes';
import CustomCursor from '../components/CustomCursor';
import ParticleCursor from '../components/ParticleCursor';
import TypewriterText from '../components/TypewriterText';
import VolumeControl from '../components/VolumeControl';
import UserBadges from '../components/UserBadges';
import { getUserBadges } from '../utils/createBadgesTable';
import '../styles/UsernameNotClaimed.css';

const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iNDAiIGZpbGw9IiM2NjYiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIyMDAiIHI9IjgwIiBmaWxsPSIjNjY2Ii8+PC9zdmc+";
const DEFAULT_ALBUM = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjcwIiBmaWxsPSIjNTU1Ii8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxNSIgZmlsbD0iIzMzMyIvPjwvc3ZnPg==";

// Module types
const MODULES = {
  RECENT_TRACKS: 'recent_tracks',
  TOP_ARTISTS: 'top_artists',
  TOP_ALBUMS: 'top_albums',
  TOP_TRACKS: 'top_tracks'
};

// Time periods for top charts
const TIME_PERIODS = {
  WEEK: '7day',
  MONTH: '1month',
  YEAR: '12month',
  OVERALL: 'overall'
};

const hexToRgba = (hex, opacity) => {
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Return rgba value
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const getGlowStyle = (color, strength) => ({
  textShadow: `0 0 ${strength}px ${color}`,
  transition: 'text-shadow 0.3s ease'
});

const TOTAL_TRACKS = 50;  

const globalCustomBoxesCache = {};

export const preloadCommonProfileData = async () => {
  try {
    const recentProfiles = JSON.parse(localStorage.getItem('recent_profiles') || '[]');
    
    const profilesToPreload = recentProfiles.slice(0, 10);
    
    const promises = profilesToPreload.map(async (profileId) => {
      if (profileId) {
        const { data: boxes } = await supabase
          .from('custom_boxes')
          .select('*')
          .eq('user_id', profileId)
          .order('display_order');
          
        if (boxes && boxes.length > 0) {
          globalCustomBoxesCache[profileId] = boxes;
          
          const cacheKey = generateCacheKey('custom_boxes', profileId);
          setCache(cacheKey, boxes, 1000 * 60 * 10); // 10 minutes cache
          localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
      }
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error preloading profile data:', error);
  }
};

// Call this once when the app starts
if (typeof window !== 'undefined') {
  setTimeout(() => {
    preloadCommonProfileData();
  }, 2000); // Delay by 2 seconds to not block initial page load
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{
          padding: '20px',
          textAlign: 'center',
          color: '#fff',
          background: 'rgba(0,0,0,0.8)'
        }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const PublicProfile = ({ profile: previewProfile, recentTracks: previewRecentTracks, isPreview = false }) => {
  const { username } = useParams();
  const [profile, setProfile] = useState(previewProfile || null);
  const [lastFMData, setLastFMData] = useState({ recentTracks: previewRecentTracks || [] });
  const [discordData, setDiscordData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [moduleLoading, setModuleLoading] = useState({});
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [customBoxes, setCustomBoxes] = useState([]);
  const [audioSettings, setAudioSettings] = useState(null);
  const [audioVolume, setAudioVolume] = useState(0.5);
  const audioRef = useRef(null);
  
  // Module state
  const [activeModule, setActiveModule] = useState(MODULES.RECENT_TRACKS);
  const [timePeriod, setTimePeriod] = useState(TIME_PERIODS.WEEK);
  const [topData, setTopData] = useState({
    artists: [],
    albums: [],
    tracks: []
  });

  const [dataPreloaded, setDataPreloaded] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!previewProfile);
  const [dataLoading, setDataLoading] = useState(true);
  const [iconColor, setIconColor] = useState('white');
  const [viewMode, setViewMode] = useState('default');
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [audioRetries, setAudioRetries] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [defaultVolume, setDefaultVolume] = useState(0.5);
  const [badges, setBadges] = useState([]);
  const MAX_RETRIES = 3;

  // rate limits cuz spotify's api is a shit
  const spotifyRequestQueue = [];
  let isProcessingQueue = false;
  let retryDelay = 1000; // Start with 1 second delay

  const processSpotifyQueue = async () => {
    if (isProcessingQueue || spotifyRequestQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    try {
      const { request, resolve, reject } = spotifyRequestQueue.shift();
      
      try {
        const result = await request();
        resolve(result);
        retryDelay = 1000;
      } catch (error) {
        if (error.response && error.response.status === 429) {
          // If rate limited, put request back in queue with increased delay
          spotifyRequestQueue.unshift({ request, resolve, reject });
          // Exponential backoff - double the delay each time
          retryDelay *= 2;
          // Cap at 30 seconds
          retryDelay = Math.min(retryDelay, 30000);
          console.log(`Spotify rate limited. Retrying in ${retryDelay/1000} seconds.`);
        } else {
          // For other errors, just reject
          reject(error);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    } finally {
      isProcessingQueue = false;
      // Process next request if any
      if (spotifyRequestQueue.length > 0) {
        processSpotifyQueue();
      }
    }
  };

  // Queue a Spotify API request
  const queueSpotifyRequest = (requestFn) => {
    return new Promise((resolve, reject) => {
      spotifyRequestQueue.push({ request: requestFn, resolve, reject });
      if (!isProcessingQueue) {
        processSpotifyQueue();
      }
    });
  };

  // Get Spotify access token
  const getSpotifyToken = async () => {
    try {
      // Get the next credentials in rotation
      const credentials = getNextSpotifyCredentials();
      
      if (!credentials) {
        console.error('No valid Spotify credentials found');
        return null;
      }
      
      const { clientId, clientSecret } = credentials;
      
      const response = await axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
        },
        data: 'grant_type=client_credentials'
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Spotify token:', error);
      
      // If the error was due rate limiting (429) -> try with the next set of credentials (fuck you spotify)
      if (error.response && error.response.status === 429) {
        console.log('Rate limited by Spotify, trying next credentials...');
        return getSpotifyToken();
      }
      
      return null;
    }
  };

  // Modified getSpotifyArtwork to use queue
  const getSpotifyArtwork = async (track, artist, token) => {
    try {
      const cacheKey = `${track}-${artist}`;
      
      // Check if we already have artwork
      if (trackArtwork[cacheKey]) {
        return trackArtwork[cacheKey];
      }
      
      // Queue the actual request
      const artwork = await queueSpotifyRequest(async () => {
        const response = await axios({
          method: 'get',
          url: `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(track)}%20artist:${encodeURIComponent(artist)}&type=track&limit=1`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.tracks.items.length > 0) {
          return response.data.tracks.items[0].album.images[1]?.url || DEFAULT_ALBUM;
        }
        
        return DEFAULT_ALBUM;
      });
      
      // Cache the result
      setTrackArtwork(prev => ({
        ...prev,
        [cacheKey]: artwork
      }));
      
      return artwork;
    } catch (error) {
      console.error('Error getting Spotify artwork:', error);
      return DEFAULT_ALBUM;
    }
  };

  const batchGetArtwork = async (items, type, token) => {
    // Create a copy of the items
    const updatedItems = [...items];
    const pendingRequests = [];
    
    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i];
      let cacheKey;
      
      if (type === 'track') {
        const artistName = item.artist['#text'] || item.artist.name;
        const trackName = item.name;
        cacheKey = `track-${trackName}-${artistName}`;
      } else if (type === 'album') {
        const artistName = item.artist.name || item.artist['#text'];
        const albumName = item.name;
        cacheKey = `album-${albumName}-${artistName}`;
      } else if (type === 'artist') {
        const artistName = item.name;
        cacheKey = `artist-${artistName}`;
      }
      
      if (trackArtwork[cacheKey]) {
        item.spotifyImage = trackArtwork[cacheKey];
      } else {
        // Add to pending requests
        pendingRequests.push({ item, cacheKey, index: i });
      }
    }
    
    const batchSize = 2;
    for (let i = 0; i < pendingRequests.length; i += batchSize) {
      const batch = pendingRequests.slice(i, i + batchSize);
      await Promise.all(batch.map(async ({ item, cacheKey }) => {
        try {
          let artwork;
          
          if (type === 'track') {
            const artistName = item.artist['#text'] || item.artist.name;
            artwork = await getSpotifyArtwork(item.name, artistName, token);
          } else if (type === 'album') {
            const artistName = item.artist.name || item.artist['#text'];
            
            // Queue the album request
            artwork = await queueSpotifyRequest(async () => {
              const response = await axios({
                method: 'get',
                url: `https://api.spotify.com/v1/search?q=album:${encodeURIComponent(item.name)}%20artist:${encodeURIComponent(artistName)}&type=album&limit=1`,
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              return response.data.albums.items.length > 0 
                ? response.data.albums.items[0].images[1]?.url 
                : (item.image?.[2]?.['#text'] || DEFAULT_ALBUM);
            });
          } else if (type === 'artist') {
            // Queue the artist request
            artwork = await queueSpotifyRequest(async () => {
              const response = await axios({
                method: 'get',
                url: `https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(item.name)}&type=artist&limit=1`,
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              return response.data.artists.items.length > 0 
                ? response.data.artists.items[0].images[1]?.url 
                : (item.image?.[1]?.['#text'] || DEFAULT_ALBUM);
            });
          }
          
          setTrackArtwork(prev => ({
            ...prev,
            [cacheKey]: artwork
          }));
          
          item.spotifyImage = artwork;
        } catch (error) {
          console.error(`Error getting artwork for ${type}:`, error);
          if (type === 'track') {
            item.spotifyImage = item.image?.[1]?.['#text'] || DEFAULT_ALBUM;
          } else if (type === 'album') {
            item.spotifyImage = item.image?.[2]?.['#text'] || DEFAULT_ALBUM;
          } else if (type === 'artist') {
            item.spotifyImage = item.image?.[1]?.['#text'] || DEFAULT_ALBUM;
          }
        }
      }));
    }
    
    return updatedItems;
  };

  const getArtworkForItems = async (items, type, token) => {
    return batchGetArtwork(items, type, token);
  };

  // Update the fetchLastFMData function to use the database
  const fetchLastFMData = async (profileId) => {
    try {
      if (!profileId) return;
      
      setDataLoading(true);
      
      // Generate cache key for LastFM data
      const cacheKey = generateCacheKey('lastfm_recent', profileId);
      
      // Check cache first
      const cachedData = getCache(cacheKey);
      if (cachedData) {
        setLastFMData(prev => ({
          ...prev,
          recentTracks: cachedData.recentTracks
        }));
        setDataLoading(false);
        return cachedData;
      }
      
      // Fetch recent tracks from profile_lastfm table
      const { data: profileLastFM, error } = await supabase
        .from('profile_lastfm')
        .select('recent_scrobbles')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        console.error('Error fetching recent tracks:', error);
        throw error;
      }

      if (!profileLastFM?.recent_scrobbles || !Array.isArray(profileLastFM.recent_scrobbles) || profileLastFM.recent_scrobbles.length === 0) {
        console.log('No recent tracks found for profile:', profileId);
        setLastFMData(prev => ({
          ...prev,
          recentTracks: []
        }));
        setDataLoading(false);
        return { recentTracks: [] };
      }
      
      // Transform the data to match the expected format
      const transformedTracks = profileLastFM.recent_scrobbles.map(track => ({
        name: track.track_name,
        artist: { '#text': track.artist_name },
        album: { '#text': track.album_name || '' },
        date: { 
          uts: new Date(track.timestamp).getTime() / 1000,
          // Add the actual timestamp for easier access
          timestamp: track.timestamp
        },
        image: [
          { '#text': track.image_url },
          { '#text': track.image_url },
          { '#text': track.image_url }
        ],
        url: track.url,
        mbid: track.mbid,
        // Check if track played within last 3 minutes -> display now playing
        '@attr': {
          nowplaying: (Date.now() - new Date(track.timestamp).getTime()) < 180000 ? 'true' : 'false'
        }
      }));
      
      setLastFMData(prev => ({
        ...prev,
        recentTracks: transformedTracks
      }));
      
      // Cache the result
      const dataToCache = { recentTracks: transformedTracks };
      setCache(cacheKey, dataToCache, 1000 * 60 * 5); // 5 minutes cache
      
      setDataLoading(false);
      return dataToCache;
    } catch (error) {
      console.error('Error fetching LastFM data:', error);
      setError('Failed to load LastFM data');
      setDataLoading(false);
      return null;
    }
  };

  const fetchTopData = async (profileId, type, period) => {
    try {
      if (!profileId) return;
      
      // Set loading state for just this module
      setModuleLoading(prev => ({ ...prev, [type]: true }));
      
      // Generate cache key
      const cacheKey = generateCacheKey('lastfm_top', profileId, type, period);
      
      // Check cache first
      const cachedData = getCache(cacheKey);
      if (cachedData) {
        setTopData(prev => ({
          ...prev,
          [type.replace('top_', '')]: cachedData,
          [`${type.replace('top_', '')}-period`]: period
        }));
        
        setModuleLoading(prev => ({ ...prev, [type]: false }));
        return cachedData;
      }
      
      let tableName;
      switch (type) {
        case MODULES.TOP_ARTISTS:
          tableName = 'lastfm_top_artists';
          break;
        case MODULES.TOP_ALBUMS:
          tableName = 'lastfm_top_albums';
          break;
        case MODULES.TOP_TRACKS:
          tableName = 'lastfm_top_tracks';
          break;
        default:
          return;
      }
      
      // Fetch data from database
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('profile_id', profileId)
        .eq('timeframe', period)
        .order('rank', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      const transformedData = data.map(item => {
        const base = {
          playcount: item.playcount,
          url: item.url,
          mbid: item.mbid,
          image: [
            { '#text': item.image_url },
            { '#text': item.image_url },
            { '#text': item.image_url }
          ]
        };

        switch (type) {
          case MODULES.TOP_ARTISTS:
            return {
              ...base,
              name: item.artist_name
            };
          case MODULES.TOP_ALBUMS:
            return {
              ...base,
              name: item.album_name,
              artist: { name: item.artist_name }
            };
          case MODULES.TOP_TRACKS:
            return {
              ...base,
              name: item.track_name,
              artist: { name: item.artist_name }
            };
          default:
            return item;
        }
      });
      
      // Cache the result
      setCache(cacheKey, transformedData, 1000 * 60 * 30); // 30 minute cache
      
      // Update state
      setTopData(prev => ({
        ...prev,
        [type.replace('top_', '')]: transformedData,
        [`${type.replace('top_', '')}-period`]: period
      }));
      
      return transformedData;
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      setError(`Failed to load ${type} data`);
      return [];
    } finally {
      setModuleLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  useEffect(() => {
    getSpotifyToken();
  }, []);

  const fetchCustomBoxes = async (userId) => {
    try {
      // makes shit faster idfk
      if (globalCustomBoxesCache[userId]) {
        setCustomBoxes(globalCustomBoxesCache[userId]);
        
        const now = Date.now();
        const lastRefreshTime = parseInt(localStorage.getItem(`cache_refresh_time_${userId}`) || '0', 10);
        if (now - lastRefreshTime > 5 * 60 * 1000) { // 5 minutes
          // Refresh in the background
          refreshCustomBoxes(userId).then(boxes => {
            if (boxes && boxes.length > 0) {
              globalCustomBoxesCache[userId] = boxes;
              localStorage.setItem(`cache_refresh_time_${userId}`, now.toString());
            }
          });
        }
        return globalCustomBoxesCache[userId];
      }
      
      const cacheKey = generateCacheKey('custom_boxes', userId);
      
      // Check regular cache second
      const cachedBoxes = getCache(cacheKey);
      if (cachedBoxes) {
        setCustomBoxes(cachedBoxes);
        
        // Store in global cache too
        globalCustomBoxesCache[userId] = cachedBoxes;
        
        // Refresh in the background if cache is older than 5 minutes
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        const cacheAge = Date.now() - (cacheTime || 0);
        if (cacheAge > 5 * 60 * 1000) {
          // Refresh in background
          refreshCustomBoxes(userId, cacheKey);
        }
        return cachedBoxes;
      }
      
      return await refreshCustomBoxes(userId, cacheKey);
    } catch (error) {
      console.error('Error fetching custom boxes:', error);
      return [];
    }
  };
  
  const refreshCustomBoxes = async (userId, cacheKey) => {
    try {
      const { data: boxes, error } = await supabase
        .from('custom_boxes')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');

      if (error) throw error;
      
      // Cache the result
      if (boxes) {
        // Update global cache
        globalCustomBoxesCache[userId] = boxes;
        localStorage.setItem(`cache_refresh_time_${userId}`, Date.now().toString());
        
        // Update regular cache
        if (cacheKey) {
          setCache(cacheKey, boxes, 1000 * 60 * 10); // 10 minutes cache
          localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        }
        
        setCustomBoxes(boxes);
      }
      
      return boxes || [];
    } catch (error) {
      console.error('Error refreshing custom boxes:', error);
      return [];
    }
  };

  // Add function to fetch audio tracks
  const fetchAudioTracks = async (userId) => {
    try {
      // First get audio settings
      const { data: audioData, error: audioError } = await supabase
        .from('audio_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!audioError && audioData) {
        setAudioEnabled(audioData.audio_enabled);
        setDefaultVolume(audioData.default_volume);
        setAudioVolume(audioData.default_volume);
      }

      // Then get all audio tracks
      const { data: tracks, error } = await supabase
        .from('profile_audio_tracks')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');

      if (error) throw error;


      const activeTrackIndex = tracks.findIndex(track => track.is_active);
      setCurrentTrackIndex(activeTrackIndex >= 0 ? activeTrackIndex : 0);
      setAudioTracks(tracks);

      if (tracks.length > 0) {
        setAudioSettings({
          audio_enabled: audioData?.audio_enabled ?? true,
          default_volume: audioData?.default_volume ?? 0.5,
          audio_url: tracks[activeTrackIndex >= 0 ? activeTrackIndex : 0]?.url
        });
      }

      return tracks;
    } catch (error) {
      console.error('Error fetching audio tracks:', error);
      return [];
    }
  };

  useEffect(() => {
    if (previewProfile) {
      setProfile(previewProfile);
      setInitialLoading(false);
      setCustomBoxes(previewProfile.custom_boxes || []);
      setAvatarUrl(previewProfile.profile_image || DEFAULT_AVATAR);
      setBackgroundUrl(previewProfile.background_image || null);
      setBadges([]);
      setIsOwnProfile(false);
      setLastFMData({ recentTracks: previewRecentTracks || [] });
      return;
    }
    const fetchProfileData = async () => {
      try {
        setInitialLoading(true);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        try {
          const profileData = await getCompleteProfileByUsername(username);
          
          if (!profileData) {
            setError('username_not_claimed');
            setInitialLoading(false);
            return;
          }

          setProfile(profileData);
          
          fetchCustomBoxes(profileData.id);
          
          const { data: socialLinks, error: socialLinksError } = await supabase
            .from('social_links')
            .select('*')
            .eq('profile_id', profileData.id)
            .order('display_order');
            
          if (socialLinksError) throw socialLinksError;
          
          const formattedSocialLinks = {};
          const customIcons = {};
          
          if (socialLinks) {
            socialLinks.forEach(link => {
              formattedSocialLinks[link.platform] = link.url;
              if (link.is_custom && link.icon_url) {
                customIcons[link.platform] = link.icon_url;
              }
            });
          }
          
          profileData.social_links = formattedSocialLinks;
          profileData.custom_icons = customIcons;
          
          // Fetch user badges
          const { success, badges: userBadges, error: badgesError } = await getUserBadges(profileData.id);
          if (success && userBadges) {
            setBadges(userBadges);
          }
          
          if (user && user.id === profileData.id) {
            setIsOwnProfile(true);
          }

          if (profileData.profile_image) {
            setAvatarUrl(profileData.profile_image);
          }
          
          if (profileData.background_image) {
            setBackgroundUrl(profileData.background_image);
          }
          
          setInitialLoading(false);
          
          // Load LastFM data from database
          if (profileData.id) {
            await fetchLastFMData(profileData.id);
            await loadDataInBackground(profileData.id);
            
            // Fetch Discord data with the profile ID
            const discordData = await fetchDiscordData(profileData.id);
            if (discordData) {
              setDiscordData(discordData);
            }
          }

          await fetchAudioTracks(profileData.id);
        } catch (error) {
          console.error('Error fetching profile: ', error);
          if (error.code === 'PGRST116') {
            setError('username_not_claimed');
          } else {
            setError(error.message || 'Failed to load profile');
          }
          setInitialLoading(false);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError(error.message || 'An unexpected error occurred');
        setInitialLoading(false);
      }
    };

    fetchProfileData();
  }, [username, previewProfile, previewRecentTracks]);

  // Update the loadDataInBackground function
  const loadDataInBackground = async (profileId) => {
    try {
      await fetchLastFMData(profileId);
      
      if (!dataPreloaded) {
        await Promise.all([
          fetchTopData(profileId, MODULES.TOP_ARTISTS, TIME_PERIODS.WEEK),
          fetchTopData(profileId, MODULES.TOP_ALBUMS, TIME_PERIODS.WEEK),
          fetchTopData(profileId, MODULES.TOP_TRACKS, TIME_PERIODS.WEEK)
        ]);
        
        setDataPreloaded(true);
      }
    } catch (error) {
      console.error("Error loading background data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id && activeModule !== MODULES.RECENT_TRACKS) {
      // Only fetch if we don't already have the data for this period
      const dataType = activeModule.replace('top_', '');
      if (!topData[dataType] || topData[`${dataType}-period`] !== timePeriod) {
        fetchTopData(profile.id, activeModule, timePeriod);
      }
    }
  }, [activeModule, timePeriod, profile?.id]);

  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    
    if (activeModule === MODULES.TOP_ARTISTS) {
      setModuleLoading(prev => ({ ...prev, [MODULES.TOP_ARTISTS]: true }));
      fetchTopData(profile.id, MODULES.TOP_ARTISTS, period);
    } else if (activeModule === MODULES.TOP_ALBUMS) {
      setModuleLoading(prev => ({ ...prev, [MODULES.TOP_ALBUMS]: true }));
      fetchTopData(profile.id, MODULES.TOP_ALBUMS, period);
    } else if (activeModule === MODULES.TOP_TRACKS) {
      setModuleLoading(prev => ({ ...prev, [MODULES.TOP_TRACKS]: true }));
      fetchTopData(profile.id, MODULES.TOP_TRACKS, period);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'object' && timestamp.uts) {
      date = new Date(timestamp.uts * 1000);
    } else if (typeof timestamp === 'object' && timestamp.timestamp) {
      date = new Date(timestamp.timestamp);
    } else {
      return '';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // For older dates, show the actual date
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Add this function to fetch user info from Last.fm
  const fetchUserInfo = async (lastfmUsername) => {
    try {
      const apiKey = getNextLastFMApiKey();
      const response = await axios.get(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${lastfmUsername}&api_key=${apiKey}&format=json`);
      
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      
      return response.data.user;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  };

  // Add these functions to fetch top data
  const fetchTopArtists = async (period) => {
    try {
      setModuleLoading(prev => ({ ...prev, [MODULES.TOP_ARTISTS]: true }));
      
      const result = await fetchTopData(profile.id, MODULES.TOP_ARTISTS, period);
      setTopData(prev => ({ ...prev, artists: result }));
      
      return result;
    } catch (error) {
      console.error('Error fetching top artists:', error);
      return [];
    } finally {
      setModuleLoading(prev => ({ ...prev, [MODULES.TOP_ARTISTS]: false }));
    }
  };

  const fetchTopAlbums = async (period) => {
    try {
      setModuleLoading(prev => ({ ...prev, [MODULES.TOP_ALBUMS]: true }));
      
      const result = await fetchTopData(profile.id, MODULES.TOP_ALBUMS, period);
      setTopData(prev => ({ ...prev, albums: result }));
      
      return result;
    } catch (error) {
      console.error('Error fetching top albums:', error);
      return [];
    } finally {
      setModuleLoading(prev => ({ ...prev, [MODULES.TOP_ALBUMS]: false }));
    }
  };

  const fetchTopTracks = async (period) => {
    try {
      setModuleLoading(prev => ({ ...prev, [MODULES.TOP_TRACKS]: true }));
      
      const result = await fetchTopData(profile.id, MODULES.TOP_TRACKS, period);
      setTopData(prev => ({ ...prev, tracks: result }));
      
      return result;
    } catch (error) {
      console.error('Error fetching top tracks:', error);
      return [];
    } finally {
      setModuleLoading(prev => ({ ...prev, [MODULES.TOP_TRACKS]: false }));
    }
  };

  const loadAllData = async () => {
    try {
      await getSpotifyToken();
      
      // Create an array of promises to run in parallel
      const promises = [fetchRecentTracks(profile.lastfm_username)];
      
      // Only fetch user info if we don't already have it
      if (!lastFMData?.userInfo) {
        promises.push(fetchUserInfo(profile.lastfm_username));
      }
      
      // Load data in parallel
      const results = await Promise.all(promises);
      
      setLastFMData(prev => ({
        ...prev,
        recentTracks: results[0],
        ...(results.length > 1 ? { userInfo: results[1] } : {})
      }));
      
      await Promise.all([
        fetchTopData(profile.id, MODULES.TOP_ARTISTS, timePeriod)
          .then(data => setTopData(prev => ({ ...prev, artists: data }))),
        fetchTopData(profile.id, MODULES.TOP_ALBUMS, timePeriod)
          .then(data => setTopData(prev => ({ ...prev, albums: data }))),
        fetchTopData(profile.id, MODULES.TOP_TRACKS, timePeriod)
          .then(data => setTopData(prev => ({ ...prev, tracks: data })))
      ]);
      
      setDataPreloaded(true);
    } catch (error) {
      console.error('Error loading Last.fm data:', error);
      setError('Failed to load music data. Please try again later.');
    } finally {
      setDataLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.lastfm_username && !dataPreloaded) {
      setDataLoading(true);
      loadAllData();
    }
  }, [profile]);

  const fetchRecentTracks = async (lastfmUsername, attempt = 0) => {
    try {
      setModuleLoading(prev => ({ ...prev, [MODULES.RECENT_TRACKS]: true }));
      
      const apiKey = getNextLastFMApiKey();
      
      if (!apiKey) {
        throw new Error('No valid Last.fm API key available');
      }
      
      const response = await axios.get(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUsername}&api_key=${apiKey}&format=json&limit=${TOTAL_TRACKS}`
      );
      
      if (response.data.error) {
        throw new Error(response.data.message);
      }
      
      const tracks = response.data.recenttracks.track;
      
      setLastFMData(prev => ({
        ...prev,
        recentTracks: tracks
      }));
      
      setModuleLoading(prev => ({ ...prev, [MODULES.RECENT_TRACKS]: false }));
      return tracks;
    } catch (error) {
      console.error('Error fetching recent tracks:', error);
      
      if (error.response && error.response.status === 429 && attempt < 3) {
        console.log(`Rate limited by Last.fm for recent tracks, trying next API key... (attempt ${attempt + 1})`);
        // Wait a short time before retrying with a different key
        await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
        return fetchRecentTracks(lastfmUsername, attempt + 1);
      }
      
      setModuleLoading(prev => ({ ...prev, [MODULES.RECENT_TRACKS]: false }));
      return [];
    }
  };

  const fetchNowPlaying = async (profileId) => {
    try {
      const { data: profileLastFM, error } = await supabase
        .from('profile_lastfm')
        .select('recent_scrobbles')
        .eq('profile_id', profileId)
        .single();

      if (error) {
        console.error('Error fetching now playing:', error);
        return null;
      }

      if (profileLastFM?.recent_scrobbles) {
        const recentScrobbles = profileLastFM.recent_scrobbles;
        if (Array.isArray(recentScrobbles) && recentScrobbles.length > 0) {
          const mostRecentTrack = recentScrobbles[0];
          
          const playedAt = new Date(mostRecentTrack.timestamp);
          const now = new Date();
          const timeDiff = now - playedAt;
          const isNowPlaying = timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds

          return {
            name: mostRecentTrack.track_name,
            artist: { '#text': mostRecentTrack.artist_name },
            album: { '#text': mostRecentTrack.album_name || '' },
            date: { 
              uts: playedAt.getTime() / 1000,
              timestamp: mostRecentTrack.timestamp
            },
            image: [
              { '#text': mostRecentTrack.image_url },
              { '#text': mostRecentTrack.image_url },
              { '#text': mostRecentTrack.image_url }
            ],
            url: mostRecentTrack.url,
            mbid: mostRecentTrack.mbid,
            '@attr': {
              nowplaying: isNowPlaying ? 'true' : 'false'
            }
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error fetching now playing:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!profile?.id) return;
    
    const checkNowPlaying = async () => {
      try {
        const [profileLastFMResponse, discordResponse] = await Promise.all([
          // Get recent tracks from profile_lastfm table
          supabase
            .from('profile_lastfm')
            .select('recent_scrobbles')
            .eq('profile_id', profile.id)
            .single(),
          
          // Get Discord activity
          supabase
            .from('profile_discord')
            .select('discord_activity')
            .eq('profile_id', profile.id)
            .single()
        ]);

        if (profileLastFMResponse.error) {
          console.error('Error fetching recent tracks:', profileLastFMResponse.error);
          return;
        }

        const recentScrobbles = profileLastFMResponse.data?.recent_scrobbles || [];
        if (recentScrobbles.length === 0) return;

        const mostRecentTrack = recentScrobbles[0];
        let isNowPlaying = false;

        // Check if the track is recent (within last 5 minutes)
        const playedAt = new Date(mostRecentTrack.timestamp);
        const now = new Date();
        const timeDiff = now - playedAt;
        const isRecentTrack = timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds

        // Check if the same track is in Discord activity
        if (!discordResponse.error && discordResponse.data?.discord_activity) {
          try {
            const discordActivity = JSON.parse(discordResponse.data.discord_activity);
            if (Array.isArray(discordActivity)) {
              const spotifyActivity = discordActivity.find(activity => 
                activity.isListening && 
                activity.name === "Spotify" &&
                activity.details // song name
              );

              if (spotifyActivity) {
                // If the same song is playing on Discord, consider it as now playing
                isNowPlaying = spotifyActivity.details === mostRecentTrack.track_name &&
                              spotifyActivity.state === mostRecentTrack.artist_name;
              }
            }
          } catch (e) {
            console.error('Error parsing Discord activity:', e);
          }
        }

        // If we haven't confirmed it's playing from Discord but it's a recent track,
        // check if it's the same as the current "now playing" track
        if (!isNowPlaying && isRecentTrack) {
          const currentTrack = lastFMData?.recentTracks?.[0];
          if (currentTrack && 
              currentTrack['@attr']?.nowplaying === 'true' &&
              currentTrack.name === mostRecentTrack.track_name &&
              currentTrack.artist['#text'] === mostRecentTrack.artist_name) {
            isNowPlaying = true;
          }
        }

        // If it's a very recent track (within 1 minute), consider it playing anyway
        if (!isNowPlaying && timeDiff < 60 * 1000) {
          isNowPlaying = true;
        }

        // Transform all recent tracks
        const transformedTracks = recentScrobbles.map(track => ({
          name: track.track_name,
          artist: { '#text': track.artist_name },
          album: { '#text': track.album_name || '' },
          date: { 
            uts: new Date(track.timestamp).getTime() / 1000,
            timestamp: track.timestamp
          },
          image: [
            { '#text': track.image_url },
            { '#text': track.image_url },
            { '#text': track.image_url }
          ],
          url: track.url,
          mbid: track.mbid,
          '@attr': track === mostRecentTrack ? { nowplaying: isNowPlaying ? 'true' : 'false' } : undefined
        }));

        setLastFMData(prev => {
          const currentTrack = prev.recentTracks?.[0];
          
          // If we have the same track and it was playing, keep it playing unless we're sure it's stopped
          if (currentTrack && 
              currentTrack['@attr']?.nowplaying === 'true' &&
              currentTrack.name === transformedTracks[0].name &&
              currentTrack.artist['#text'] === transformedTracks[0].artist['#text']) {
            return {
              ...prev,
              recentTracks: prev.recentTracks.map((track, index) => 
                index === 0 ? { ...track, '@attr': { nowplaying: 'true' } } : track
              )
            };
          }

          // Otherwise update with the new data
          return {
            ...prev,
            recentTracks: transformedTracks
          };
        });

      } catch (error) {
        console.error('Error in checkNowPlaying:', error);
      }
    };
    
    // Check now playing every 15 seconds
    const interval = setInterval(checkNowPlaying, 15000);
    
    // Initial check
    checkNowPlaying();
    
    return () => clearInterval(interval);
  }, [profile?.id, lastFMData]);

  const tryPlayAudio = async () => {
    try {
      if (audioRef.current && audioRef.current.paused) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          audioRef.current.muted = false;
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  useEffect(() => {
    if (audioTracks.length > 0 && audioEnabled && audioRef.current) {
      const activeTrack = audioTracks.find(track => track.is_active);
      if (!activeTrack) return;
      
      setAudioLoaded(false);
      setAudioError(null);
      setAudioRetries(0);
      
      audioRef.current.src = activeTrack.url;
      audioRef.current.volume = defaultVolume;
      audioRef.current.muted = true;
      
      const handleLoaded = () => {
        setAudioLoaded(true);
        setAudioError(null);
        if (audioRef.current) {
          audioRef.current.muted = true;
          tryPlayAudio();
        }
      };

      const handleError = (e) => {
        console.error('Audio loading error:', e);
        setAudioError(e);
        setAudioLoaded(false);
        
        if (audioRetries < MAX_RETRIES) {
          setAudioRetries(prev => prev + 1);
          if (audioRef.current) {
            audioRef.current.load();
          }
        }
      };

      const handleEnded = () => {
        const currentIndex = audioTracks.findIndex(track => track.is_active);
        const nextIndex = (currentIndex + 1) % audioTracks.length;
        if (audioRef.current) {
          audioRef.current.src = audioTracks[nextIndex].url;
          audioRef.current.load();
        }
      };
      
      audioRef.current.addEventListener('loadeddata', handleLoaded);
      audioRef.current.addEventListener('error', handleError);
      audioRef.current.addEventListener('ended', handleEnded);
      
      audioRef.current.load();
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadeddata', handleLoaded);
          audioRef.current.removeEventListener('error', handleError);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [audioTracks, audioEnabled, defaultVolume]);

  const handleVolumeChange = (volume) => {
    setAudioVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (audioRef.current.muted && volume > 0) {
        audioRef.current.muted = false;
        tryPlayAudio();
      }
    }
  };

  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioRef.current && audioRef.current.paused && audioEnabled) {
        tryPlayAudio();
      }
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioEnabled]);

  const preloadRecentProfilesData = async () => {
    try {
      const recentProfiles = JSON.parse(localStorage.getItem('recent_profiles') || '[]');
      
      const profilesToPreload = recentProfiles.slice(0, 5);
      
      profilesToPreload.forEach(async (profileId) => {
        if (profileId) {
          // Generate cache key
          const cacheKey = generateCacheKey('custom_boxes', profileId);
          
          // Skip if we already have fresh cache
          const cacheTime = localStorage.getItem(`${cacheKey}_time`);
          const cacheAge = Date.now() - (cacheTime || 0);
          if (cacheAge < 15 * 60 * 1000) return; // Skip if cache is less than 15 minutes old
          
          // Fetch in background
          const { data: boxes } = await supabase
            .from('custom_boxes')
            .select('*')
            .eq('user_id', profileId)
            .order('display_order');
            
          if (boxes) {
            setCache(cacheKey, boxes, 1000 * 60 * 10); // 10 minutes cache
            localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
          }
        }
      });
    } catch (error) {
      console.error('Error preloading recent profiles data:', error);
    }
  };
  
  useEffect(() => {
    if (profile?.id) {
      const recentProfiles = JSON.parse(localStorage.getItem('recent_profiles') || '[]');
      
      const filteredProfiles = recentProfiles.filter(id => id !== profile.id);
      
      filteredProfiles.unshift(profile.id);
      
      const updatedProfiles = filteredProfiles.slice(0, 10);
      
      // Save to localStorage
      localStorage.setItem('recent_profiles', JSON.stringify(updatedProfiles));
    }
  }, [profile?.id]);
  
  useEffect(() => {
    preloadRecentProfilesData();
  }, []);

  const UsernameNotClaimedPage = () => {
    const navigate = useNavigate();
    
    const handleClaimUsername = () => {
      navigate('/register', { state: { username } });
    };
    
    return (
      <div className="unclaimed-page-container" style={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1f1f2c 0%, #121218 100%)',
        padding: '2rem 1rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div className="username-not-claimed">
          <div className="username-badge">@{username}</div>
          
          <h1 className="username-heading">@{username} is available!</h1>
          
          <h2 className="page-subtitle">Be the first to claim it</h2>
          
          <button 
            onClick={handleClaimUsername}
            className="claim-button"
          >
            Claim this username
          </button>
          
          <p className="disclaimer-text">
            By claiming this username, you'll create a new account that you can customize with your music, Discord activity, and social links.
          </p>
          
          <Link to="/" className="home-link">
            <FaHome size={16} /> Return to home page
          </Link>
        </div>
      </div>
    );
  };

  const renderTrackItem = (track, index) => {
    if (!track) return null;

    return (
      <div key={`${track.name}-${index}`} className="track-item" style={{
        background: profile?.widget_bg_color ? 
          hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
          'transparent',
        borderRadius: `${profile?.presence_border_radius || 12}px`,
        marginBottom: '4px',
        padding: '10px', // Reduced padding
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center' // Back to center alignment
      }}>
        <span className="rank-number">{index + 1}</span>
        <img 
          src={track.image?.[2]?.['#text'] || DEFAULT_ALBUM} 
          alt={track.name} 
          className="track-image"
          style={{
            width: isMobileView ? '45px' : '50px', 
            height: isMobileView ? '45px' : '50px', 
            marginRight: '10px',
            flexShrink: 0
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_ALBUM;
          }}
        />
        <div className="track-info" style={{
          fontFamily: 'inherit',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          flex: '1',
          minWidth: 0,
          justifyContent: 'center',
          gap: '2px' 
        }}>
          <p className="track-name" style={{ 
            color: 'var(--primary-text-color)',
            fontSize: isMobileView ? '13px' : '15px',
            margin: '0',
            padding: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '1' 
          }}>
            {track.name || 'Unknown Track'}
          </p>
          <p className="track-artist" style={{ 
            color: 'var(--secondary-text-color)',
            fontSize: isMobileView ? '12px' : '13px', 
            margin: '0',
            padding: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '1' 
          }}>
            {track.artist?.['#text'] || 'Unknown Artist'}
          </p>
          <p className="play-time" style={{ 
            color: 'var(--tertiary-text-color)',
            fontSize: isMobileView ? '11px' : '12px', 
            margin: '0',
            padding: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '1'
          }}>
            {formatDate(track.date)}
          </p>
        </div>
      </div>
    );
  };

  const renderModuleContent = () => {
    if (moduleLoading[activeModule]) {
      return <div className="loading" style={{ height: '300px', overflowY: 'auto' }}>Loading data...</div>;
    }

    switch (activeModule) {
      case MODULES.RECENT_TRACKS:
        const recentTracks = lastFMData?.recentTracks || [];
        if (recentTracks.length === 0) {
          return <div className="no-data" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No recent tracks found</div>;
        }
        
        const recentTracksToDisplay = recentTracks.filter(track => 
          !track['@attr'] || !track['@attr'].nowplaying
        );
        
        return (
          <div className="recent-tracks module-content" style={{ 
            marginBottom: '0', 
            paddingBottom: '0',
            marginTop: '0',
            paddingTop: '4px',
            height: getModuleHeight(),
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-family) !important'
          }}>
            <h3 style={{ 
              marginTop: '0', 
              marginBottom: '6px',
              fontSize: '16px',
              fontFamily: 'var(--font-family) !important'
            }}>Recently Played</h3>
            <div style={{ 
              overflowY: 'auto', 
              flex: 1, 
              scrollbarWidth: 'thin',
              scrollbarColor: `${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)} transparent`,
              '--scrollbar-color': hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)
            }}>
              <div className="track-list" style={{ marginBottom: '0', fontFamily: 'inherit' }}>
                {recentTracksToDisplay.map((track, index) => renderTrackItem(track, index))}
              </div>
            </div>
          </div>
        );
      
      case MODULES.TOP_ARTISTS:
        return (
          <div className="module-content" style={{ 
            marginBottom: '0', 
            paddingBottom: '0',
            height: getModuleHeight(),
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-family) !important'
          }}>
            <div className="time-period-selector" style={{ 
              marginBottom: '6px', 
              marginLeft: '5px',
              display: 'flex',
              flexDirection: isMobileView ? 'column' : 'row',
              overflowX: 'visible',
              flexWrap: 'wrap',
              gap: '5px'
            }}>
              <button 
                className={timePeriod === TIME_PERIODS.WEEK ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.WEEK)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.WEEK ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                Last 7 Days
              </button>
              <button 
                className={timePeriod === TIME_PERIODS.MONTH ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.MONTH)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.MONTH ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                Last Month
              </button>
              <button 
                className={timePeriod === TIME_PERIODS.YEAR ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.YEAR)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.YEAR ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                Last Year
              </button>
              <button 
                className={timePeriod === TIME_PERIODS.OVERALL ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.OVERALL)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.OVERALL ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                All Time
              </button>
            </div>
            
            <div className="module-content" style={{ 
              overflowY: 'auto', 
              flex: 1,
              height: getModuleHeight(),
              scrollbarColor: `${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)} transparent`,
              '--scrollbar-color': hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)
            }}>
              {moduleLoading[MODULES.TOP_ARTISTS] ? (
                <div className="loading-spinner">Loading...</div>
              ) : (
                <ul className="artist-list" style={{ marginBottom: '0', paddingBottom: '0' }}>
                  {topData.artists?.map((artist, index) => (
                    <li key={index} className="artist-item" style={{
                      background: profile.widget_bg_color ? 
                        hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                        'transparent',
                      borderRadius: `${profile?.presence_border_radius || 12}px`,
                      marginBottom: '4px',
                      padding: '10px', 
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center' 
                    }}>
                      <span className="rank-number">{index + 1}</span>
                      <img 
                        src={artist.spotifyImage || artist.image[2]['#text'] || DEFAULT_ALBUM} 
                        alt={artist.name} 
                        className="artist-image"
                        style={{
                          width: isMobileView ? '45px' : '50px', 
                          height: isMobileView ? '45px' : '50px', 
                          marginRight: '10px',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-artist.png';
                        }}
                      />
                      <div className="artist-info" style={{
                        fontFamily: 'inherit',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: '1',
                        minWidth: 0,
                        justifyContent: 'center',
                        gap: '2px' 
                      }}>
                        <p className="artist-name" style={{ 
                          color: 'var(--primary-text-color)',
                          fontSize: isMobileView ? '13px' : '15px', 
                          margin: '0',
                          padding: 0,
                          lineHeight: '1',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{artist.name}</p>
                        <p className="play-count" style={{ 
                          color: 'var(--secondary-text-color)',
                          fontSize: isMobileView ? '12px' : '13px', 
                          margin: '0',
                          padding: 0,
                          lineHeight: '1', 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{artist.playcount} plays</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      
      case MODULES.TOP_ALBUMS:
        return (
          <div className="module-content" style={{ 
            marginBottom: '0', 
            paddingBottom: '0',
            height: getModuleHeight(),
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-family) !important'
          }}>
            <div className="time-period-selector" style={{ 
              marginBottom: '6px', 
              marginLeft: '5px',
              display: 'flex',
              flexDirection: isMobileView ? 'column' : 'row',
              overflowX: 'visible',
              flexWrap: 'wrap',
              gap: '5px'
            }}>
              <button 
                className={timePeriod === TIME_PERIODS.WEEK ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.WEEK)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.WEEK ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                Last 7 Days
              </button>
              <button 
                className={timePeriod === TIME_PERIODS.MONTH ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.MONTH)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.MONTH ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                Last Month
              </button>
              <button 
                className={timePeriod === TIME_PERIODS.YEAR ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.YEAR)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.YEAR ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                Last Year
              </button>
              <button 
                className={timePeriod === TIME_PERIODS.OVERALL ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.OVERALL)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.OVERALL ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                All Time
              </button>
            </div>
            
            <div className="module-content" style={{ 
              overflowY: 'auto', 
              flex: 1,
              height: getModuleHeight(),
              scrollbarColor: `${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)} transparent`,
              '--scrollbar-color': hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)
            }}>
              {moduleLoading[MODULES.TOP_ALBUMS] ? (
                <div className="loading-spinner">Loading...</div>
              ) : (
                <ul className="album-list" style={{ marginBottom: '0', paddingBottom: '0' }}>
                  {topData.albums?.map((album, index) => (
                    <li key={index} className="album-item" style={{
                      background: profile.widget_bg_color ? 
                        hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                        'transparent',
                      borderRadius: `${profile?.presence_border_radius || 12}px`,
                      marginBottom: '4px',
                      padding: '10px', // Reduced padding
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center' // Back to center alignment
                    }}>
                      <span className="rank-number">{index + 1}</span>
                      <img 
                        src={album.spotifyImage || album.image[2]['#text'] || DEFAULT_ALBUM} 
                        alt={album.name} 
                        className="album-image"
                        style={{
                          width: isMobileView ? '45px' : '50px', // Reduced image size
                          height: isMobileView ? '45px' : '50px', // Reduced image size
                          marginRight: '10px',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/default-album.png';
                        }}
                      />
                      <div className="album-info" style={{
                        fontFamily: 'inherit',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: '1',
                        minWidth: 0,
                        justifyContent: 'center',
                        gap: '2px' // Reduced gap
                      }}>
                        <p className="album-name" style={{ 
                          color: 'var(--primary-text-color)',
                          fontSize: isMobileView ? '13px' : '15px', // Reduced font size
                          margin: '0',
                          padding: 0,
                          lineHeight: '1', // Reduced line height
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{album.name}</p>
                        <p className="album-artist" style={{ 
                          color: 'var(--secondary-text-color)',
                          fontSize: isMobileView ? '12px' : '13px', // Reduced font size
                          margin: '0',
                          padding: 0,
                          lineHeight: '1', // Reduced line height
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{album.artist.name}</p>
                        <p className="play-count" style={{ 
                          color: 'var(--tertiary-text-color)',
                          fontSize: isMobileView ? '11px' : '12px', // Reduced font size
                          margin: '0',
                          padding: 0,
                          lineHeight: '1', // Reduced line height
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{album.playcount} plays</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      
      case MODULES.TOP_TRACKS:
        return (
          <div className="module-content" style={{ 
            marginBottom: '0', 
            paddingBottom: '0',
            height: getModuleHeight(),
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-family) !important'
          }}>
            <div className="time-period-selector" style={{ 
              marginBottom: '6px', 
              marginLeft: '5px',
              display: 'flex',
              flexDirection: isMobileView ? 'column' : 'row',
              overflowX: 'visible',
              flexWrap: 'wrap',
              gap: '5px'
            }}>
              <button 
                className={timePeriod === TIME_PERIODS.WEEK ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.WEEK)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.WEEK ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                Last 7 Days
              </button>
              <button 
                className={timePeriod === TIME_PERIODS.MONTH ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.MONTH)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.MONTH ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                Last Month
              </button>
              <button 
                className={timePeriod === TIME_PERIODS.YEAR ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.YEAR)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.YEAR ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                Last Year
              </button>
              <button 
                className={timePeriod === TIME_PERIODS.OVERALL ? 'active' : ''} 
                onClick={() => handleTimePeriodChange(TIME_PERIODS.OVERALL)}
                style={{
                  backgroundColor: profile.widget_bg_color ? 
                    hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                    'transparent',
                  ...(timePeriod === TIME_PERIODS.OVERALL ? { 
                    outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                    border: 'none'
                  } : {}),
                  width: isMobileView ? '100%' : 'auto',
                  padding: isMobileView ? '8px' : undefined
                }}
              >
                All Time
              </button>
            </div>
            
            <div className="module-content" style={{ 
              overflowY: 'auto', 
              flex: 1,
              height: getModuleHeight(),
              scrollbarColor: `${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)} transparent`,
              '--scrollbar-color': hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)
            }}>
              {moduleLoading[MODULES.TOP_TRACKS] ? (
                <div className="loading-spinner">Loading...</div>
              ) : (
                <ul className="track-list" style={{ margin: '0', padding: '0' }}>
                  {topData.tracks?.map((track, index) => (
                    <li key={index} className="track-item" style={{
                      background: profile.widget_bg_color ? 
                        hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                        'transparent',
                      borderRadius: `${profile?.presence_border_radius || 12}px`,
                      marginBottom: '4px',
                      padding: '10px', // Reduced padding
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center' // Back to center alignment
                    }}>
                      <span className="rank-number">{index + 1}</span>
                      <img 
                        src={track.spotifyImage || (track.image && track.image[2] ? track.image[2]['#text'] : DEFAULT_ALBUM)} 
                        alt={track.name} 
                        className="track-image"
                        style={{
                          width: isMobileView ? '45px' : '50px', // Reduced image size
                          height: isMobileView ? '45px' : '50px', // Reduced image size
                          marginRight: '10px',
                          flexShrink: 0
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_ALBUM;
                        }}
                      />
                      <div className="track-info" style={{
                        fontFamily: 'inherit',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        flex: '1',
                        minWidth: 0,
                        gap: '2px' // Reduced gap
                      }}>
                        <p className="track-name" style={{ 
                          color: 'var(--primary-text-color)',
                          fontSize: isMobileView ? '13px' : '15px', // Reduced font size
                          margin: '0',
                          padding: 0,
                          lineHeight: '1', // Reduced line height
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {track.name}
                        </p>
                        <p className="track-artist" style={{ 
                          color: 'var(--secondary-text-color)',
                          fontSize: isMobileView ? '12px' : '13px', // Reduced font size
                          margin: '0',
                          padding: 0,
                          lineHeight: '1', // Reduced line height
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {track.artist.name}
                        </p>
                        <p className="play-count" style={{ 
                          color: 'var(--tertiary-text-color)',
                          fontSize: isMobileView ? '11px' : '12px', // Reduced font size
                          margin: '0',
                          padding: 0,
                          lineHeight: '1', // Reduced line height
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {track.playcount} plays
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      
      default:
        return <div>Select a module</div>;
    }
  };

  // Helper function to map font names to CSS variable names
  const getFontVariableName = (fontName) => {
    if (!fontName) return 'inter';
    
    // Special case mappings
    const specialCases = {
      'Playfair Display': 'playfair-display',
      'Dancing Script': 'dancing-script',
      'Bebas Neue': 'bebas-neue',
      'Abril Fatface': 'abril-fatface',
      'JetBrains Mono': 'jetbrains-mono',
      'Fira Code': 'fira-code',
    };
    
    if (specialCases[fontName]) {
      return specialCases[fontName];
    }
    
    // Default: lowercase and replace spaces with hyphens
    return fontName.toLowerCase().replace(/\s+/g, '-');
  };
  
  // Helper function to map font names to CSS class names
  const getFontClassName = (fontName) => {
    if (!fontName) return 'font-inter';
    
    // Special case mappings
    const specialCases = {
      'Playfair Display': 'font-playfair',
      'Dancing Script': 'font-dancing-script',
      'Bebas Neue': 'font-bebas-neue',
      'Abril Fatface': 'font-abril-fatface',
      'JetBrains Mono': 'font-jetbrains',
      'Fira Code': 'font-fira-code',
    };
    
    if (specialCases[fontName]) {
      return specialCases[fontName];
    }
    
    // Default: lowercase and replace spaces with hyphens
    return `font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;
  };
  
  // Debug the font values
  const fontVariableName = getFontVariableName(profile?.font_family || 'Inter');
  const fontClassName = getFontClassName(profile?.font_family || 'Inter');

  // Add this function to calculate module height
  const getModuleHeight = () => {
    const hasEnabledCustomBoxes = customBoxes.some(box => box.enabled);
    return isMobileView 
      ? '300px' 
      : (hasEnabledCustomBoxes ? '370px' : '455px');
  };

  // Add this function to fetch Discord data
  const fetchDiscordData = async (profileId) => {
    try {
      if (!profileId) {
        console.log('No profile ID provided to fetchDiscordData');
        return null;
      }

      // Get the discord data directly using the profile ID
      const { data: discordData, error: discordError } = await supabase
        .from('profile_discord')
        .select(`
          discord_id,
          discord_username,
          discord_avatar,
          discord_connected,
          discord_status,
          discord_activity,
          is_server_booster
        `)
        .eq('profile_id', profileId)
        .single();

      if (discordError) {
        console.error('Error fetching Discord data:', discordError);
        return null;
      }

      // If no discord data or not connected, return null
      if (!discordData || !discordData.discord_connected) {
        return null;
      }

      // Parse the discord_activity JSON if it exists
      let activities = [];
      if (discordData.discord_activity) {
        try {
          const parsedActivities = JSON.parse(discordData.discord_activity);
          if (Array.isArray(parsedActivities)) {
            activities = parsedActivities.map(activity => ({
              name: activity.name || '',
              state: activity.state || '',
              details: activity.details || '',
              isGame: activity.isGame || false,
              isStreaming: activity.isStreaming || false,
              isListening: activity.isListening || false,
              isWatching: activity.isWatching || false,
              isCustom: activity.isCustom || false,
              isCompeting: activity.isCompeting || false,
              timestamps: activity.timestamps || {},
              assets: activity.assets || {},
              applicationId: activity.applicationId || null,
              emoji: activity.emoji || null,
              emojiUrl: activity.emoji?.emojiUrl || (activity.emoji?.id ? `https://cdn.discordapp.com/emojis/${activity.emoji.id}.${activity.emoji.animated ? 'gif' : 'png'}` : null)
            }));
          } else {
            // Handle single activity object
            activities = [{
              name: parsedActivities.name || '',
              state: parsedActivities.state || '',
              details: parsedActivities.details || '',
              isGame: parsedActivities.isGame || false,
              isStreaming: parsedActivities.isStreaming || false,
              isListening: parsedActivities.isListening || false,
              isWatching: parsedActivities.isWatching || false,
              isCustom: parsedActivities.isCustom || false,
              isCompeting: parsedActivities.isCompeting || false,
              timestamps: parsedActivities.timestamps || {},
              assets: parsedActivities.assets || {},
              applicationId: parsedActivities.applicationId || null,
              emoji: parsedActivities.emoji || null,
              emojiUrl: parsedActivities.emoji?.emojiUrl || (parsedActivities.emoji?.id ? `https://cdn.discordapp.com/emojis/${parsedActivities.emoji.id}.${parsedActivities.emoji.animated ? 'gif' : 'png'}` : null)
            }];
          }
        } catch (parseError) {
          console.error('Error parsing discord_activity:', parseError);
        }
      }

      // Transform the data to match the expected format
      return {
        avatarUrl: discordData.discord_avatar || DEFAULT_AVATAR,
        status: discordData.discord_status || 'offline',
        activities: activities,
        isServerBooster: discordData.is_server_booster || false
      };

    } catch (error) {
      console.error('Error in fetchDiscordData:', error);
      return null;
    }
  };

  // Add this new function to check if the device is mobile
  const isMobile = () => {
    return window.innerWidth <= 768;
  };
  
  // Add state to track viewport width
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Add useEffect to handle window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    
    // Check on initial load
    checkMobile();
    
    // Add event listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Wrap the main return in the error boundary
  return (
    <ErrorBoundary>
      {initialLoading ? (
        <div className="loading">Loading profile...</div>
      ) : error === 'username_not_claimed' ? (
        <UsernameNotClaimedPage />
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : !profile ? (
        <UsernameNotClaimedPage />
      ) : (
        <>
          <CustomCursor />
          <ParticleCursor profileId={profile?.id} />
          <div 
            className={`profile-page ${fontClassName}`}
            data-font={profile?.font_family || 'Inter'}
            style={{
              ...(profile.background_image ? {
                backgroundImage: `url(${profile.background_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              } : {
                backgroundColor: hexToRgba(profile.bg_color || '#1f1f2c', profile.bg_opacity)
              }),
              display: 'flex',
              flexDirection: 'column',
              height: 'auto',
              paddingBottom: '0',
              '--primary-text-color': profile.primary_text_color || '#ffffff',
              '--secondary-text-color': profile.secondary_text_color || '#b9bbbe',
              '--tertiary-text-color': profile.tertiary_text_color || '#72767d',
              '--font-family': `var(--font-${fontVariableName})`
            }}
          >
            <style>
              {`
                /* Force font family on all elements */
                .profile-page[data-font="${profile?.font_family || 'Inter'}"] * {
                  font-family: var(--font-${fontVariableName}), sans-serif !important;
                }
                
                :root {
                  --font-family: var(--font-${fontVariableName});
                }
                
                /* Apply to specific elements that might be overriding */
                .profile-header, .user-info, .track-item, .artist-name, 
                .album-name, .now-playing-name, .discord-activity-title {
                  font-family: var(--font-${fontVariableName}), sans-serif !important;
                }
                
                /* Responsive styling */
                @media (max-width: 768px) {
                  .profile-container {
                    padding: 0 10px;
                  }
                  
                  .user-info {
                    flex-direction: column !important;
                    align-items: center !important;
                    text-align: center !important;
                  }
                  
                  .user-stats {
                    padding-left: 0 !important;
                    margin-top: 10px !important;
                    width: 100% !important;
                  }
                  
                  .links-container {
                    justify-content: center !important;
                  }
                  
                  .profile-overlay {
                    padding: 20px 10px 0 !important;
                  }
                  
                  .module-selector {
                    overflow-x: auto !important;
                    flex-wrap: nowrap !important;
                    justify-content: flex-start !important;
                    padding-bottom: 5px !important;
                  }
                  
                  .module-selector button {
                    min-width: 130px !important;
                    white-space: nowrap !important;
                  }
                }
              `}
            </style>
            <div className="profile-overlay" style={{
              background: 'rgba(15, 15, 19, 0.7)',
              width: '100%',
              padding: '40px 20px 0',
              position: 'relative',
              height: 'auto'
            }}>
              <div className="profile-container" style={{
                maxWidth: '800px',
                margin: '0 auto',
                position: 'relative',
                paddingBottom: '0',
                height: 'auto'
              }}>
                {dataLoading && <div className="background-loading">Loading music data...</div>}
                {!isPreview && isOwnProfile && (
                  <>
                    <Link to="/settings" className="settings-button">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="settings-icon">
                        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
                      </svg>
                    </Link>
                  </>
                )}
                <div className="glass-card profile-card" style={{
                  backgroundColor: hexToRgba(profile.bg_color || '#1f1f2c', profile.bg_opacity),
                  paddingBottom: '0',
                  marginBottom: '0',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div className="profile-header-container" style={{
                    marginBottom: '5px',
                  }}>
                    <div className="profile-header" style={{
                      padding: '0',
                      margin: '0'
                    }}>
                      <div className="user-info" style={{ 
                        '--accent-color': profile.accent_color ? 
                          hexToRgba(profile.accent_color, (profile.accent_opacity || 100) / 100) : 
                          '#8b5cf6',
                        gap: '0px',
                        background: profile.widget_bg_color ? 
                          hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                          'transparent',
                        borderRadius: `${profile?.presence_border_radius || 12}px`,
                        padding: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        flexDirection: isMobileView ? 'column' : 'row',
                        alignItems: isMobileView ? 'center' : 'flex-start',
                      }}>
                        <img 
                          src={profile.profile_image ? profile.profile_image.replace(/\/avatars\/+/, '/avatars//') : DEFAULT_AVATAR}
                          alt={`${profile.username}'s avatar`} 
                          className="avatar"
                          style={{
                            width: isMobileView ? '140px' : '170px',
                            height: isMobileView ? '140px' : '170px',
                            minWidth: isMobileView ? '140px' : '170px',
                            ...(profile.avatar_border_enabled && {
                              border: `3px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`,
                              padding: '3px'
                            })
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_AVATAR;
                          }}
                        />
                        <div className="user-stats" style={{
                          paddingLeft: isMobileView ? '0' : '8px',
                          marginTop: isMobileView ? '10px' : '0',
                          paddingTop: '0',
                          width: isMobileView ? '100%' : 'auto',
                          textAlign: isMobileView ? 'center' : 'left',
                        }}>
                          <h1 
                            style={{ 
                              color: 'var(--primary-text-color)',
                              position: 'relative',
                              display: 'inline-block',
                              transition: 'opacity 0.2s ease',
                              marginBottom: '-10px',
                              fontSize: isMobileView ? '32px' : '42px',
                            }}
                          >
                            <div 
                              className="username-container"
                              style={{ 
                                ...(profile.username_glow_enabled ? 
                                  getGlowStyle(profile.username_glow_color, profile.username_glow_strength) : {}),
                                position: 'relative', // Add this to make it a positioning context
                                display: 'flex',
                                alignItems: 'center',
                                flexDirection: isMobileView ? 'column' : 'row',
                                justifyContent: isMobileView ? 'center' : 'flex-start',
                              }}
                            >
                              {/* Wrap just the username text in the tooltip trigger */}
                              <div
                                onMouseEnter={(e) => {
                                  const tooltip = document.getElementById('username-tooltip');
                                  if (tooltip) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
                                    tooltip.style.left = `${rect.left}px`;
                                    tooltip.style.opacity = '1';
                                    tooltip.style.transform = 'translateY(0)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  const tooltip = document.getElementById('username-tooltip');
                                  if (tooltip) {
                                    tooltip.style.opacity = '0';
                                    tooltip.style.transform = 'translateY(-10px)';
                                  }
                                }}
                              >
                                <TypewriterText
                                  text={profile.display_name || profile.username}
                                  enabled={profile.username_typewriter_enabled === true}
                                  speed={parseInt(profile.username_typewriter_speed) || 100}
                                  mode="simple"
                                  alternatingTexts={[]}
                                  style={{
                                    fontSize: isMobileView ? '32px' : '42px',
                                    fontWeight: '600',
                                    color: profile.primary_text_color || '#fff',
                                    display: 'block',
                                    minHeight: '29px',
                                    lineHeight: '1.2',
                                    marginBottom: '5px'
                                  }}
                                />
                              </div>
                              
                              {/* User badges display */}
                              <UserBadges 
                                badges={badges} 
                                iconColor={profile.icon_color || '#ffffff'}
                                iconGlowEnabled={profile.icon_glow_enabled || false}
                                iconGlowColor={profile.icon_glow_color || '#8b5cf6'}
                                iconGlowStrength={profile.icon_glow_strength || 10}
                                profile={profile}
                              />
                            </div>
                            {profile.bio && (
                              <div className="bio-container markdown-content" style={{
                                marginTop: '0px',
                                width: '100%',
                                marginBottom: '4px',
                                lineHeight: '1.1',
                                minHeight: profile.bio ? '18px' : '0'
                              }}>
                                <TypewriterText
                                  text={profile.bio}
                                  enabled={profile.bio_typewriter_enabled === true}
                                  speed={parseInt(profile.bio_typewriter_speed) || 100}
                                  mode={profile.bio_typewriter_mode || 'simple'}
                                  alternatingTexts={[
                                    profile.bio_typewriter_text1,
                                    profile.bio_typewriter_text2,
                                    profile.bio_typewriter_text3
                                  ].filter(Boolean)}
                                  style={{
                                    margin: 0,
                                    padding: 0,
                                    lineHeight: '1.1',
                                    fontSize: '15px',
                                    color: 'var(--secondary-text-color)',
                                    width: '100%',
                                    fontWeight: '400',
                                    display: 'block',
                                    minHeight: '18px'
                                  }}
                                />
                              </div>
                            )}
                          </h1>
                          {lastFMData?.userInfo && (
                            <div className="scrobble-container" style={{
                              marginTop: '0px'
                            }}>
                              <p className="scrobble-count" style={{
                                color: 'var(--tertiary-text-color)'
                              }}>Scrobbles: {lastFMData.userInfo.playcount}</p>
                            </div>
                          )}
                          <div className="links-container" style={{
                            marginTop: '5px',
                            fontFamily: 'inherit',
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: isMobileView ? 'center' : 'flex-start',
                            gap: '5px'
                          }}>
                            {/* Ensure links is always an object, even if it comes as undefined or null */}
                            <SocialLinks 
                              links={profile.social_links || {}} 
                              iconColor={profile.icon_color || 'white'} 
                              iconGlowEnabled={profile.icon_glow_enabled || false}
                              iconGlowColor={profile.icon_glow_color || '#8b5cf6'}
                              iconGlowStrength={profile.icon_glow_strength || 10}
                              customIcons={profile.custom_icons || {}}
                              isMobile={isMobileView}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Always show Now Playing and Discord Presence cards */}
                  <div style={{ 
                    marginTop: '-25px',
                    marginBottom: '8px',
                    display: 'flex',
                    flexDirection: isMobileView ? 'column' : 'row',
                    gap: '10px',
                    alignItems: 'flex-start',
                    flexWrap: isMobileView ? 'nowrap' : 'wrap',
                    justifyContent: profile.discord_username && !isMobileView ? 'space-between' : 'flex-start'
                  }}>
                    {/* LastFM Now Playing card */}
                    <div style={{ 
                      flex: profile.discord_username && !isMobileView ? '1' : 'initial',
                      minWidth: isMobileView ? '100%' : '300px',
                      maxWidth: profile.discord_username && !isMobileView ? 'calc(50% - 10px)' : '100%',
                      width: '100%'
                    }}>
                      <div className="now-playing-card" style={{
                        height: '90px',
                        overflow: 'hidden',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        boxSizing: 'border-box',
                        position: 'relative',
                        background: profile?.lastfm_presence_color ? 
                          hexToRgba(profile.lastfm_presence_color, profile.content_opacity) : 
                          hexToRgba(profile.widget_bg_color || '#1f1f2c', profile.content_opacity),
                        borderRadius: `${profile?.presence_border_radius || 12}px`,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontFamily: 'inherit'
                      }}>
                        <div className="now-playing-header">
                          <div className="now-playing-badge">
                            {/* Remove this block that shows the pulse dot */}
                            {/* {lastFMData && lastFMData.recentTracks && lastFMData.recentTracks[0] && lastFMData.recentTracks[0]['@attr']?.nowplaying === 'true' ? (
                              <span className="pulse-dot"></span>
                            ) : null} */}
                          </div>
                        </div>
                        <div className="now-playing-content">
                          {lastFMData && lastFMData.recentTracks && lastFMData.recentTracks[0] ? (
                            <div className="now-playing-track-info">
                              {lastFMData.recentTracks[0]['@attr']?.nowplaying === 'true' ? (
                                <>
                                  <img 
                                    src={lastFMData.recentTracks[0].spotifyImage || lastFMData.recentTracks[0].image[2]['#text']} 
                                    alt={lastFMData.recentTracks[0].name} 
                                    className="now-playing-art"
                                    style={{ 
                                      width: '70px',
                                      height: '70px',
                                      borderRadius: `${(profile?.presence_border_radius || 12) / 3}px`
                                    }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = DEFAULT_ALBUM;
                                    }}
                                  />
                                  <div className="now-playing-details">
                                    <p className="now-playing-name" style={{
                                      maxWidth: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      fontSize: '16px',
                                      marginTop: '4px',
                                      color: profile.primary_text_color || '#fff'
                                    }}>
                                      {lastFMData.recentTracks[0].name.length > (isMobileView ? 20 : 25) 
                                        ? `${lastFMData.recentTracks[0].name.substring(0, isMobileView ? 20 : 25)}...` 
                                        : lastFMData.recentTracks[0].name}
                                    </p>
                                    <p className="now-playing-artist" style={{
                                      maxWidth: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      color: profile.secondary_text_color || '#fff',
                                      opacity: 0.8
                                    }}>
                                      {lastFMData.recentTracks[0].artist['#text'].length > (isMobileView ? 25 : 30) 
                                        ? `${lastFMData.recentTracks[0].artist['#text'].substring(0, isMobileView ? 25 : 30)}...` 
                                        : lastFMData.recentTracks[0].artist['#text']}
                                    </p>
                                    <p className="now-playing-album" style={{
                                      maxWidth: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      color: profile.tertiary_text_color || '#fff',
                                      opacity: 0.8
                                    }}>
                                      {lastFMData.recentTracks[0].album['#text'].length > (isMobileView ? 25 : 30) 
                                        ? `${lastFMData.recentTracks[0].album['#text'].substring(0, isMobileView ? 25 : 30)}...` 
                                        : lastFMData.recentTracks[0].album['#text']}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <div className="not-playing-message">
                                  <p className="now-playing-name" style={{ fontSize: '16px', margin: '0', padding: '16px' }}>
                                    Not listening to anything
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '16px' }}>
                              <p style={{ fontSize: '16px', margin: '0' }}>Nothing playing</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Discord Presence widget - only show if discord_username exists */}
                    {profile.discord_username && (
                      <div style={{ 
                        flex: !isMobileView ? '1' : 'initial',
                        minWidth: isMobileView ? '100%' : '300px',
                        maxWidth: !isMobileView ? 'calc(50% - 10px)' : '100%',
                        width: '100%'
                      }}>
                        <div className="now-playing-card" style={{
                          height: '90px',
                          overflow: 'hidden',
                          padding: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          boxSizing: 'border-box',
                          position: 'relative',
                          background: profile?.discord_presence_color ? 
                            hexToRgba(profile.discord_presence_color, profile.content_opacity) : 
                            hexToRgba(profile.widget_bg_color || '#1f1f2c', profile.content_opacity),
                          borderRadius: `${profile?.presence_border_radius || 12}px`,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontFamily: 'inherit'
                        }}>
                          {discordData && (
                            <>
                              <div style={{
                                position: 'relative',
                                marginRight: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                height: '100%'
                              }}>
                                <img 
                                  src={discordData.avatarUrl} 
                                  alt="Discord Avatar" 
                                  style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                  }}
                                />
                                <div style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: '6px',
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  backgroundColor: discordData.status === "dnd" ? "#ed4245" : 
                                                          discordData.status === "idle" ? "#faa81a" : 
                                                          discordData.status === "online" ? "#3ba55c" : "#747f8d"
                                }}></div>
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                flex: 1,
                                height: '100%',
                                justifyContent: 'center'
                              }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontSize: '16px',
                                  fontWeight: '600',
                                  color: profile.primary_text_color || '#fff',
                                  marginTop: '0',
                                  marginBottom: '4px',
                                  maxWidth: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {(profile.discord_username || profile.username).length > (isMobileView ? 20 : 25) 
                                    ? `${(profile.discord_username || profile.username).substring(0, isMobileView ? 20 : 25)}...` 
                                    : (profile.discord_username || profile.username)}
                                </div>
                                
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  flex: 1,
                                  marginTop: '-6px'
                                }}>
                                  {discordData.activities && discordData.activities.length > 0 ? (
                                    (() => {
                                      // First try to find a custom status
                                      let activity = discordData.activities.find(a => a.isCustom);
                                      
                                      // If no custom status, look for a game activity
                                      if (!activity) {
                                        activity = discordData.activities.find(a => !a.isListening && a.isGame);
                                      }
                                      
                                      if (!activity) {
                                        return (
                                          <div style={{
                                            fontSize: '13px',
                                            fontWeight: '400',
                                            color: profile.tertiary_text_color || '#fff',
                                            opacity: 0.8
                                          }}>
                                            Currently doing nothing
                                          </div>
                                        );
                                      }

                                      return (
                                        <>
                                          <div className="discord-activity-name" style={{
                                            fontSize: '14px',
                                            color: profile.secondary_text_color || '#fff',
                                            opacity: 0.8,
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            marginBottom: '-8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                          }}>
                                            {activity.isGame ? (
                                              <><span style={{ fontWeight: '600' }}>Playing</span> {activity.name}</>
                                            ) : activity.isCustom ? (
                                              <>
                                                {activity.emoji && (
                                                  <img 
                                                    src={activity.emojiUrl || `https://cdn.discordapp.com/emojis/${activity.emoji.id}.${activity.emoji.animated ? 'gif' : 'png'}`}
                                                    alt={activity.emoji.name}
                                                    style={{
                                                      width: '16px',
                                                      height: '16px',
                                                      objectFit: 'contain'
                                                    }}
                                                    onError={(e) => {
                                                      e.target.style.display = 'none';
                                                    }}
                                                  />
                                                )}
                                                <span>{activity.state || activity.name}</span>
                                              </>
                                            ) : null}
                                          </div>
                                          
                                          {/* Show elapsed time for games */}
                                          {activity.isGame && activity.timestamps?.start && (
                                            <div style={{
                                              fontSize: '13px',
                                              fontWeight: '400',
                                              color: profile.tertiary_text_color || '#fff',
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              marginTop: '2px',
                                              opacity: 0.8
                                            }}>
                                              {(() => {
                                                const startTime = new Date(activity.timestamps.start);
                                                const now = new Date();
                                                const elapsedMs = now - startTime;
                                                const elapsedMins = Math.floor(elapsedMs / 60000);
                                                const hours = Math.floor(elapsedMins / 60);
                                                const mins = elapsedMins % 60;
                                                return hours > 0 ? `${hours}h ${mins}m elapsed` : `${mins}m elapsed`;
                                              })()}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()
                                  ) : (
                                    <div style={{
                                      fontSize: '13px',
                                      fontWeight: '400',
                                      color: profile.tertiary_text_color || '#fff',
                                      opacity: 0.8
                                    }}>
                                      {discordData.status === 'offline' ? 'Offline' : 'Currently doing nothing'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                          {!discordData && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              width: '100%', 
                              height: '100%',
                              color: '#fff'
                            }}>
                              Loading Discord data...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Custom boxes section - moved above LastFM stats */}
                  {customBoxes.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <CustomBoxes
                        boxes={customBoxes}
                        accentColor={profile.accent_color}
                        bgColor={profile.widget_bg_color || profile.bg_color}
                        opacity={profile.content_opacity || profile.bg_opacity}
                        isMobile={isMobileView}
                      />
                    </div>
                  )}

                  {/* LastFM stats section */}
                  {lastFMData && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      marginBottom: '0',
                      paddingBottom: '0'
                    }}>
                      <div className="module-selector" style={{ 
                        marginBottom: '4px',
                        marginTop: '0px',
                        fontFamily: 'inherit',
                        display: 'flex',
                        flexDirection: isMobileView ? 'column' : 'row',
                        overflowX: 'visible',
                        flexWrap: 'wrap',
                        padding: '0',
                        gap: isMobileView ? '5px' : '0'
                      }}>
                        <button 
                          className={activeModule === MODULES.RECENT_TRACKS ? 'active' : ''} 
                          onClick={() => setActiveModule(MODULES.RECENT_TRACKS)}
                          style={{
                            backgroundColor: profile.widget_bg_color ? 
                              hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                              'transparent',
                            ...(activeModule === MODULES.RECENT_TRACKS ? { 
                              outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`
                            } : {}),
                            width: isMobileView ? '100%' : 'auto',
                            flex: isMobileView ? '0 0 auto' : '1',
                            padding: isMobileView ? '10px' : undefined
                          }}
                        >
                          Recently Played
                        </button>
                        <button 
                          className={activeModule === MODULES.TOP_ARTISTS ? 'active' : ''} 
                          onClick={() => setActiveModule(MODULES.TOP_ARTISTS)}
                          style={{
                            backgroundColor: profile.widget_bg_color ? 
                              hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                              'transparent',
                            ...(activeModule === MODULES.TOP_ARTISTS ? { 
                              outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`
                            } : {}),
                            width: isMobileView ? '100%' : 'auto',
                            flex: isMobileView ? '0 0 auto' : '1',
                            padding: isMobileView ? '10px' : undefined
                          }}
                        >
                          Top Artists
                        </button>
                        <button 
                          className={activeModule === MODULES.TOP_ALBUMS ? 'active' : ''} 
                          onClick={() => setActiveModule(MODULES.TOP_ALBUMS)}
                          style={{
                            backgroundColor: profile.widget_bg_color ? 
                              hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                              'transparent',
                            ...(activeModule === MODULES.TOP_ALBUMS ? { 
                              outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`
                            } : {}),
                            width: isMobileView ? '100%' : 'auto',
                            flex: isMobileView ? '0 0 auto' : '1',
                            padding: isMobileView ? '10px' : undefined
                          }}
                        >
                          Top Albums
                        </button>
                        <button 
                          className={activeModule === MODULES.TOP_TRACKS ? 'active' : ''} 
                          onClick={() => setActiveModule(MODULES.TOP_TRACKS)}
                          style={{
                            backgroundColor: profile.widget_bg_color ? 
                              hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
                              'transparent',
                            ...(activeModule === MODULES.TOP_TRACKS ? { 
                              outline: `2px solid ${hexToRgba(profile.accent_color || '#8b5cf6', (profile.accent_opacity || 100) / 100)}`
                            } : {}),
                            width: isMobileView ? '100%' : 'auto',
                            flex: isMobileView ? '0 0 auto' : '1',
                            padding: isMobileView ? '10px' : undefined
                          }}
                        >
                          Top Tracks
                        </button>
                      </div>
                      
                      {renderModuleContent()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Move the tooltip to be a direct child of the profile-overlay */}
          <div 
            id="username-tooltip"
            className={getFontClassName(profile?.font_family || 'Inter')}
            style={{
              position: 'fixed',
              backgroundColor: profile.widget_bg_color 
                ? hexToRgba(profile.widget_bg_color, profile.content_opacity)
                : 'rgba(15, 15, 19, 0.4)',
              color: profile.primary_text_color || '#fff',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              zIndex: 9999,
              opacity: 0,
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              backdropFilter: 'blur(8px) saturate(180%)',
              WebkitBackdropFilter: 'blur(8px) saturate(180%)',
              background: `linear-gradient(135deg, 
                ${profile.widget_bg_color 
                  ? hexToRgba(profile.widget_bg_color, (profile.content_opacity))
                  : 'rgba(15, 15, 19, 0.72)'} 0%,
                ${profile.widget_bg_color
                  ? hexToRgba(profile.widget_bg_color, (profile.content_opacity))
                  : 'rgba(15, 15, 19, 0.56)'} 100%)`,
              transform: 'translateY(-10px)',
              WebkitTransform: 'translateY(-10px)',
              msTransform: 'translateY(-10px)',
              fontFamily: `var(--font-${getFontVariableName(profile?.font_family || 'Inter')})`,
            }}
          >
            <div style={{ fontFamily: 'inherit' }}>
              {profile.display_name !== profile.username && (
                <div style={{ fontFamily: 'inherit' }}>Username: @{profile.username}</div>
              )}
              <div style={{ fontFamily: 'inherit' }}>ID: {profile.new_id}</div>
              <div style={{ fontFamily: 'inherit' }}>Joined: {new Date(profile.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Badge tooltip */}
          <div 
            id="badge-tooltip"
            className={getFontClassName(profile?.font_family || 'Inter')}
            style={{
              position: 'fixed',
              backgroundColor: profile.widget_bg_color 
                ? hexToRgba(profile.widget_bg_color, profile.content_opacity)
                : 'rgba(15, 15, 19, 0.4)',
              color: profile.primary_text_color || '#fff',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              zIndex: 9999,
              opacity: 0,
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              backdropFilter: 'blur(8px) saturate(180%)',
              WebkitBackdropFilter: 'blur(8px) saturate(180%)',
              background: `linear-gradient(135deg, 
                ${profile.widget_bg_color 
                  ? hexToRgba(profile.widget_bg_color, (profile.content_opacity))
                  : 'rgba(15, 15, 19, 0.72)'} 0%,
                ${profile.widget_bg_color
                  ? hexToRgba(profile.widget_bg_color, (profile.content_opacity))
                  : 'rgba(15, 15, 19, 0.56)'} 100%)`,
              transform: 'translateY(-10px)',
              WebkitTransform: 'translateY(-10px)',
              msTransform: 'translateY(-10px)',
              fontFamily: `var(--font-${getFontVariableName(profile?.font_family || 'Inter')})`,
            }}
          >
            <div style={{ fontFamily: 'inherit' }} id="badge-tooltip-content"></div>
          </div>

          {/* Update audio element */}
          {audioEnabled && audioTracks.length > 0 && (
            <>
              <audio
                ref={audioRef}
                src={audioTracks[currentTrackIndex]?.url}
                preload="auto"
                loop={false}
                style={{ display: 'none' }}
              />
              <VolumeControl
                defaultVolume={defaultVolume}
                onVolumeChange={handleVolumeChange}
                isLoading={!audioLoaded}
                error={audioError}
                currentTrack={audioTracks[currentTrackIndex]}
              />
            </>
          )}
        </>
      )}
    </ErrorBoundary>
  );
};

export default PublicProfile; 