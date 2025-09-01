import axios from 'axios';
import { fetchWithCorsProxy } from './corsHelper';

// Helper function to extract Discord invite code from URL
export const extractDiscordInviteCode = (url) => {
  const patterns = [
    /discord\.gg\/([a-zA-Z0-9-]+)/,
    /discord\.com\/invite\/([a-zA-Z0-9-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

// extract GitHub info from URL
const extractGitHubInfo = (url) => {
  // Match repository pattern
  const repoPattern = /github\.com\/([^/]+)\/([^/]+)/; // fuck regex I hate you
  const repoMatch = url.match(repoPattern);
  if (repoMatch) {
    return { type: 'repository', owner: repoMatch[1], repo: repoMatch[2] };
  }
  
  // Match profile pattern
  const profilePattern = /github\.com\/([^/]+)\/?$/;
  const profileMatch = url.match(profilePattern);
  if (profileMatch) {
    return { type: 'profile', username: profileMatch[1] };
  }
  
  return null;
};

// extract YouTube channel ID from URL
export const extractYouTubeChannelId = (url) => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Handle different YouTube URL formats
    if (pathname.startsWith('/channel/')) {
      // Direct channel ID format: youtube.com/channel/UC...
      return pathname.split('/')[2];
    } else if (pathname.startsWith('/@')) {
      // Custom URL format: youtube.com/@name
      return decodeURIComponent(pathname.slice(2));
    } else if (pathname.startsWith('/c/')) {
      // Custom URL format: youtube.com/c/name - why do you exist seriously :( 
      return decodeURIComponent(pathname.split('/c/')[1]);
    } else if (pathname.startsWith('/user/')) {
      // Legacy username format: youtube.com/user/name - why do you exist seriously :( 
      return decodeURIComponent(pathname.split('/user/')[1]);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
};

// clean search query
const cleanSearchQuery = (query) => {
  return query.replace(/[^a-zA-Z0-9\s]/g, '').trim();
};

// Fetch Discord server information
export const fetchDiscordServerInfo = async (url) => {
  try {
    const inviteCode = extractDiscordInviteCode(url);
    if (!inviteCode) throw new Error('Invalid Discord invite URL');

    const response = await axios.get(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
    
    // note that this only updates once the user enters it and not after
    // gonna have to implement this some day but this works temporarily :)
    // counts for all custom boxes besides countdown
    return {
      type: 'discord',
      title: response.data.guild.name,
      description: response.data.approximate_member_count 
        ? `${response.data.approximate_member_count.toLocaleString()} members` 
        : 'Discord Server',
      image_url: response.data.guild.icon 
        ? `https://cdn.discordapp.com/icons/${response.data.guild.id}/${response.data.guild.icon}.png` 
        : null,
      additional_data: {
        member_count: response.data.approximate_member_count,
        online_count: response.data.approximate_presence_count,
        guild_id: response.data.guild.id
      }
    };
  } catch (error) {
    console.error('Error fetching Discord server info:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(`Failed to fetch Discord server information: ${error.response?.data?.message || error.message}`);
  }
};

// fetch GitHub repo info
export const fetchGitHubRepoInfo = async (url) => {
  try {
    const info = extractGitHubInfo(url);
    if (!info) throw new Error('Invalid GitHub URL');

    if (info.type === 'repository') {
      const response = await axios.get(
        `https://api.github.com/repos/${info.owner}/${info.repo}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(import.meta.env.VITE_GITHUB_TOKEN && {
              'Authorization': `token ${import.meta.env.VITE_GITHUB_TOKEN}`
            })
          }
        }
      );

      return {
        type: 'github',
        title: response.data.full_name,
        description: response.data.description,
        metadata: {
          stars: response.data.stargazers_count,
          forks: response.data.forks_count,
          language: response.data.language
        }
      };
    } else if (info.type === 'profile') {
      const response = await axios.get(
        `https://api.github.com/users/${info.username}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(import.meta.env.VITE_GITHUB_TOKEN && {
              'Authorization': `token ${import.meta.env.VITE_GITHUB_TOKEN}`
            })
          }
        }
      );

      return {
        type: 'github',
        account_type: 'profile',
        title: response.data.name || response.data.login,
        description: response.data.bio,
        image_url: response.data.avatar_url,
        additional_data: {
          followers_count: response.data.followers,
          repos_count: response.data.public_repos
        }
      };
    }
  } catch (error) {
    console.error('Error fetching GitHub info:', error);
    throw new Error(`Failed to fetch GitHub information: ${error.response?.data?.message || error.message}`);
  }
};

// Fetch YouTube channel information
export const fetchYouTubeChannelInfo = async (url) => {
  try {
    
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error('YouTube API key is not configured');
    }

    // First try to get channel info from custom URL/username
    let channelId = null;
    let searchQuery = null;
    
    try {
      const urlObj = new URL(url);
      
      // channel identifier
      if (urlObj.pathname.startsWith('/channel/')) {
        const potentialId = urlObj.pathname.split('/')[2];
        if (potentialId && potentialId.startsWith('UC')) {
          channelId = potentialId;
        } else {
          searchQuery = potentialId;
        }
      } else if (urlObj.pathname.startsWith('/@')) {
        searchQuery = decodeURIComponent(urlObj.pathname.slice(2));
      } else if (urlObj.pathname.startsWith('/c/')) {
        searchQuery = decodeURIComponent(urlObj.pathname.split('/c/')[1]);
      } else if (urlObj.pathname.startsWith('/user/')) {
        searchQuery = decodeURIComponent(urlObj.pathname.split('/user/')[1]);
      }
    } catch (urlError) {
      console.error('Error parsing URL:', urlError);
      throw new Error('Invalid YouTube URL format');
    }
    
    // If search query but no channel ID, try different search approaches - WHY TF ISNT THIS UNIFORM YOUTUBE
    if (!channelId && searchQuery) {
      
      // Create different variations of the search query
      const searchQueries = [
        searchQuery,                    // Original query
        `@${searchQuery}`,             // With @ prefix
        cleanSearchQuery(searchQuery),  // Cleaned query
        searchQuery.replace(/\./g, '')  // Remove dots
      ];
      
      for (const query of searchQueries) {
        
        try {
          const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
              part: 'snippet',
              type: 'channel',
              q: query,
              maxResults: 5,
              key: apiKey
            }
          });
          
          
          if (searchResponse.data.items && searchResponse.data.items.length > 0) {
            // Try to find an exact match first
            const exactMatch = searchResponse.data.items.find(item => {
              const title = item.snippet.title.toLowerCase();
              const customUrl = item.snippet.customUrl?.toLowerCase();
              const queryLower = query.toLowerCase();
              return title === queryLower || customUrl === queryLower;
            });
            
            if (exactMatch) {
              channelId = exactMatch.id.channelId;
              break;
            }
            
            // If no exact match, use the first result
            channelId = searchResponse.data.items[0].id.channelId;
            break;
          }
        } catch (searchError) {
          console.error('Search error for query:', query, searchError);
        }
      }
    }
    
    if (!channelId) {
      throw new Error(`Could not find YouTube channel "${searchQuery}". Please verify the channel exists and try using the channel's exact username.`);
    }
    
    // Get channel details
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet,statistics',
          id: channelId,
          key: apiKey
        }
      });
      
      
      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('YouTube channel not found. Please check the URL and try again.');
      }
      
      const channel = response.data.items[0];
      const subscriberCount = parseInt(channel.statistics.subscriberCount || 0);
      const videoCount = parseInt(channel.statistics.videoCount || 0);
      const viewCount = parseInt(channel.statistics.viewCount || 0);
      
      // Format the description to include both stats and channel description
      let description = '';
      
      const stats = [];
      if (channel.statistics.subscriberCount) {
        stats.push(`${subscriberCount.toLocaleString()} subscribers`);
      }
      if (videoCount > 0) {
        stats.push(`${videoCount.toLocaleString()} videos`);
      }
      if (viewCount > 0) {
        stats.push(`${viewCount.toLocaleString()} views`);
      }
      
      description = stats.join(' • ');
      
      if (channel.snippet.description) {
        // Add a line break only if we have stats
        if (description) {
          description += '\n';
        }
        // shrink description to 100 characters -> might still look bad with wider fonts but idc thats too much work
        const truncatedDesc = channel.snippet.description.length > 100 
          ? channel.snippet.description.substring(0, 97) + '...'
          : channel.snippet.description;
        description += truncatedDesc;
      }
      
      // if no description add a default one "Youtube Channel"
      if (!description) {
        description = 'YouTube Channel';
      }
      
      return {
        type: 'youtube',
        title: channel.snippet.title,
        description: description,
        image_url: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default.url,
        additional_data: {
          subscriber_count: channel.statistics.subscriberCount,
          video_count: channel.statistics.videoCount,
          view_count: channel.statistics.viewCount,
          channel_id: channel.id,
          custom_url: channel.snippet.customUrl,
          description: channel.snippet.description
        }
      };
    } catch (channelError) {
      console.error('Channel error:', channelError);
      console.error('Channel error response:', channelError.response?.data);
      
      if (channelError.response?.data?.error?.message) {
        throw new Error(`YouTube API Error: ${channelError.response.data.error.message}`);
      } else {
        throw new Error('Failed to fetch channel details');
      }
    }
  } catch (error) {
    console.error('Error fetching YouTube channel info:', error);
    throw error;
  }
};

// Helper function to extract Spotify track ID from URL - I have no clue how this works 
export const extractSpotifyTrackId = (url) => {
  // Match track pattern - supports regular and shortened links
  // Examples:
  // https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6
  // https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6?si=abc123
  // https://spotify.link/xyz123
  const trackPattern = /open\.spotify\.com\/track\/([^/?]+)/;
  const trackMatch = url.match(trackPattern);
  
  if (trackMatch) {
    return trackMatch[1];
  }
  
  return null;
};

// Fetch Spotify track information
export const fetchSpotifyTrackInfo = async (url) => {
  try {
    const trackId = extractSpotifyTrackId(url);
    if (!trackId) throw new Error('Invalid Spotify track URL');

    // Use Spotify's OEmbed API to get track data without needing authentication
    // This returns basic track information suitable for embedding
    const response = await axios.get('https://open.spotify.com/oembed', {
      params: {
        url: `https://open.spotify.com/track/${trackId}`
      }
    });
    
    
    // Process the title and extract track/artist information
    // Spotify's title format is typically "Track Name - Artist Name"
    let trackName = response.data.title || 'Unknown Track';
    let artistName = response.data.author_name || '';
    
    // Try to split the title if it contains a delimiter
    if (response.data.title && response.data.title.includes(' - ')) {
      const titleParts = response.data.title.split(' - ');
      trackName = titleParts[0].trim();
      // Use the title part if available, otherwise fall back to author_name
      if (titleParts.length > 1) {
        artistName = titleParts[1].trim();
      }
    }
    
    // Extract album information
    let albumName = '';
    
    // Try to extract album name from description
    if (response.data.description) {
      // Check common patterns in Spotify descriptions
      const albumPatterns = [
        /from the album "(.*?)"/i,
        /on the album "(.*?)"/i,
        /from the EP "(.*?)"/i,
        /from "(.*?)"/i,
      ];
      
      for (const pattern of albumPatterns) {
        const match = response.data.description.match(pattern);
        if (match && match[1]) {
          albumName = match[1].trim();
          break;
        }
      }
      
      // If we didn't find it with patterns, look for EP or album name in description
      if (!albumName) {
        // Try to identify the album name by context
        const lines = response.data.description.split('\n');
        for (const line of lines) {
          if (line.includes('· Album') || line.includes('· EP')) {
            const parts = line.split('·');
            if (parts.length >= 2) {
              const potentialAlbum = parts[0].trim();
              if (potentialAlbum && potentialAlbum !== trackName && potentialAlbum !== artistName) {
                albumName = potentialAlbum;
                break;
              }
            }
          }
        }
      }
    }
    
    // Parse the response data
    return {
      type: 'spotify',
      title: trackName,
      description: response.data.provider_name || 'Spotify',
      image_url: response.data.thumbnail_url,
      additional_data: {
        track_id: trackId,
        html: response.data.html, // This contains the iframe embed code -> causes issues in view, fix later
        author_name: artistName,
        album_name: albumName,
        raw_title: response.data.title,
        description: response.data.description
      }
    };
  } catch (error) {
    console.error('Error fetching Spotify track info:', error);
    throw new Error(`Failed to fetch Spotify track information: ${error.response?.data?.message || error.message}`);
  }
};

// Extract Steam ID from URL
export const extractSteamInfo = (url) => {
  // Common patterns for Steam profile URLs
  const patterns = [
    /steamcommunity\.com\/profiles\/(\d+)/, // Steam ID format
    /steamcommunity\.com\/id\/([^/]+)/, // Custom URL format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return {
        identifier: match[1],
        isCustomUrl: pattern.toString().includes('/id/')
      };
    }
  }

  return null;
};

// Fetch Steam profile info
export const fetchSteamProfileInfo = async (url) => {
  try {
    const info = extractSteamInfo(url);
    if (!info) throw new Error('Invalid Steam URL');

    const apiKey = import.meta.env.VITE_STEAM_API_KEY;
    
    // resolve steam url if custom else gg
    let steamId = info.identifier;
    if (info.isCustomUrl) {
      try {
        const resolveUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${info.identifier}`;
        const resolveResponse = await fetchWithCorsProxy(resolveUrl);
        const resolveData = await resolveResponse.json();
        
        if (resolveData.response.success !== 1) {
          throw new Error('Could not resolve Steam vanity URL');
        }
        
        steamId = resolveData.response.steamid;
      } catch (error) {
        console.error('Error resolving Steam vanity URL:', error);
        throw new Error('Could not resolve Steam vanity URL');
      }
    }
    
    // fetch user data
    const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`;
    const summaryResponse = await fetchWithCorsProxy(summaryUrl);
    const summaryData = await summaryResponse.json();
    
    if (!summaryData.response.players.length) {
      throw new Error('Steam user not found');
    }
    
    const playerInfo = summaryData.response.players[0];
    
    return {
      type: 'steam',
      title: playerInfo.personaname,
      description: `Steam Profile${playerInfo.realname ? ` - ${playerInfo.realname}` : ''}`,
      image_url: playerInfo.avatarfull,
      additional_data: {
        steam_id: steamId,
        avatar: playerInfo.avatarfull,
        profile_url: playerInfo.profileurl,
        persona_state: playerInfo.personastate
      }
    };
  } catch (error) {
    console.error('Error fetching Steam profile info:', error);
    throw new Error(`Failed to fetch Steam profile information: ${error.message || error}`);
  }
};

// Main function to fetch metadata based on URL
export const fetchLinkMetadata = async (url) => {
  try {
    // if Discord invite
    if (url.includes('discord.gg/') || url.includes('discord.com/invite/')) {
      return await fetchDiscordServerInfo(url);
    }
    
    // if GitHub repository
    if (url.includes('github.com/')) {
      return await fetchGitHubRepoInfo(url);
    }
    
    // if YouTube channel
    if (url.includes('youtube.com/')) {
      return await fetchYouTubeChannelInfo(url);
    }
    
    // if spotify track
    if (url.includes('open.spotify.com/track/') || url.includes('spotify.link/')) {
      return await fetchSpotifyTrackInfo(url);
    }
    
    // if Steam profile
    if (url.includes('steamcommunity.com/')) {
      return await fetchSteamProfileInfo(url);
    }

    // For other URLs, return basic metadata
    return {
      type: 'other',
      title: url,
      description: 'External Link',
      image_url: null,
      additional_data: {}
    };
  } catch (error) {
    console.error('Error fetching link metadata:', error);
    throw new Error('Failed to fetch link information');
  }
}; 