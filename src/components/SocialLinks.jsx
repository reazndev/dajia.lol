import React, { useEffect, useState, useMemo } from 'react';
import { 
  FaGlobe, FaGithub, FaXTwitter, FaInstagram, FaLinkedin, FaYoutube, 
  FaTwitch, FaDiscord, FaSpotify, FaReddit, FaSoundcloud, FaTiktok, FaLastfm,
  FaTelegram, FaSnapchat, FaPaypal, FaSteam, FaPinterest, FaFacebook, FaEnvelope,
  FaBitcoin, FaEthereum, FaGitlab, FaCoffee, FaLink
} from 'react-icons/fa6';
import { SiRoblox, SiCashapp, SiNamemc, SiKick, SiBuymeacoffee, SiKofi, SiPatreon, SiLitecoin, SiMonero, SiSolana } from 'react-icons/si';
import { supabase } from '../supabaseClient';
import './SocialLinks.css';

const SocialLinks = ({ 
  links = {}, 
  iconColor = 'white',
  iconGlowEnabled = false,
  iconGlowColor = '#8b5cf6',
  iconGlowStrength = 10,
  customIcons = {}
}) => {
  const [orderedLinks, setOrderedLinks] = useState([]);
  const [customIconUrls, setCustomIconUrls] = useState({});

  useEffect(() => {
    const fetchOrderedLinks = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch social links with their order
        const { data: socialLinks, error } = await supabase
          .from('social_links')
          .select('*')
          .eq('profile_id', user.id)
          .order('display_order', { ascending: true });

        if (error) throw error;

        // Set the ordered links and gather custom icons
        const platforms = [];
        const customIcons = {};
        
        socialLinks.forEach(link => {
          platforms.push(link.platform);
          
          // Store custom icon URLs
          if (link.is_custom && link.icon_url) {
            customIcons[link.platform] = link.icon_url;
          }
        });
        
        setOrderedLinks(platforms);
        setCustomIconUrls(customIcons);

      } catch (error) {
      }
    };

    fetchOrderedLinks();
  }, []);

  // Define platformIcons object
  const platformIcons = {
    lastfm: FaLastfm,
    website: FaGlobe,
    github: FaGithub,
    twitter: FaXTwitter,
    instagram: FaInstagram,
    linkedin: FaLinkedin,
    youtube: FaYoutube,
    twitch: FaTwitch,
    discord: FaDiscord,
    spotify: FaSpotify,
    reddit: FaReddit,
    soundcloud: FaSoundcloud,
    tiktok: FaTiktok,
    telegram: FaTelegram,
    snapchat: FaSnapchat,
    paypal: FaPaypal,
    roblox: SiRoblox,
    cashapp: SiCashapp,
    gitlab: FaGitlab,
    namemc: SiNamemc,
    steam: FaSteam,
    kick: SiKick,
    pinterest: FaPinterest,
    buymeacoffee: SiBuymeacoffee,
    kofi: SiKofi,
    facebook: FaFacebook,
    patreon: SiPatreon,
    email: FaEnvelope,
    btc: FaBitcoin,
    litecoin: SiLitecoin,
    eth: FaEthereum,
    monero: SiMonero,
    solana: SiSolana
  };

  const iconStyle = {
    fontSize: '24px',
    color: iconColor,
    filter: iconGlowEnabled ? `drop-shadow(0 0 ${iconGlowStrength}px ${iconGlowColor})` : 'none'
  };

  const renderIcon = (platform) => {
    // First check if there's a custom icon for this platform
    if (platform.startsWith('custom_')) {
      // Check both prop customIcons and state customIconUrls
      const iconUrl = customIcons[platform] || customIconUrls[platform];
      
      if (iconUrl) {
        return (
          <img 
            src={iconUrl} 
            alt={platform}
            style={{ 
              width: '24px', 
              height: '24px', 
              objectFit: 'contain',
              display: 'block',
              filter: iconGlowEnabled ? `drop-shadow(0 0 ${iconGlowStrength}px ${iconGlowColor})` : 'none'
            }}
          />
        );
      }
    }

    // Fall back to standard icon
    const Icon = platformIcons[platform];
    return Icon ? <Icon style={iconStyle} /> : <FaLink style={iconStyle} />;
  };

  // Helper function to format URLs correctly
  const formatUrl = (platform, url) => {
    if (!url) return '#';
    
    // If URL already has http/https, return as is
    if (url.match(/^https?:\/\//)) return url;
    
    // Otherwise format based on platform
    switch (platform) {
      case 'website':
        return `https://${url}`;
      case 'github':
        return `https://github.com/${url}`;
      case 'twitter':
        return `https://x.com/${url}`;
      case 'instagram':
        return `https://instagram.com/${url}`;
      case 'linkedin':
        return `https://linkedin.com/in/${url}`;
      case 'youtube':
        return `https://youtube.com/c/${url}`;
      case 'twitch':
        return `https://twitch.tv/${url}`;
      case 'discord':
        return url.includes('discord.gg') ? `https://${url}` : `https://discord.com/users/${url}`;
      case 'spotify':
        return `https://open.spotify.com/user/${url}`;
      case 'reddit':
        return `https://reddit.com/user/${url}`;
      case 'soundcloud':
        return `https://soundcloud.com/${url}`;
      case 'tiktok':
        return `https://tiktok.com/@${url}`;
      case 'lastfm':
        return `https://last.fm/user/${url}`;
      // New social platforms
      case 'telegram':
        return `https://t.me/${url}`;
      case 'snapchat':
        return `https://snapchat.com/add/${url}`;
      case 'paypal':
        return `https://paypal.me/${url}`;
      case 'roblox':
        return `https://www.roblox.com/user.aspx?username=${url}`;
      case 'cashapp':
        return `https://cash.app/$${url}`;
      case 'gitlab':
        return `https://gitlab.com/${url}`;
      case 'namemc':
        return `https://namemc.com/profile/${url}`;
      case 'steam':
        return `https://steamcommunity.com/id/${url}`;
      case 'kick':
        return `https://kick.com/${url}`;
      case 'pinterest':
        return `https://pinterest.com/${url}`;
      case 'buymeacoffee':
        return `https://www.buymeacoffee.com/${url}`;
      case 'kofi':
        return `https://ko-fi.com/${url}`;
      case 'facebook':
        return `https://facebook.com/${url}`;
      case 'patreon':
        return `https://www.patreon.com/${url}`;
      case 'email':
        return `mailto:${url}`;
      // Crypto wallets - these are direct addresses, so no formatting needed
      case 'btc':
      case 'litecoin':
      case 'eth':
      case 'monero':
      case 'solana':
        return url;
      // Custom platforms - assume the URL is complete or a simple domain
      default:
        if (platform.startsWith('custom_')) {
          // Check if it's already a URL
          if (url.includes('.') && !url.includes(' ')) {
            return url.match(/^https?:\/\//) ? url : `https://${url}`;
          }
        }
        return `https://${url}`;
    }
  };

  // Filter out empty links and sort them according to the order
  const sortedLinks = useMemo(() => {
    const validLinks = Object.entries(links).filter(([_, value]) => value && value.trim() !== '');
    
    if (orderedLinks.length > 0) {
      // Sort based on the orderedLinks array
      return validLinks.sort(([platformA], [platformB]) => {
        const indexA = orderedLinks.indexOf(platformA);
        const indexB = orderedLinks.indexOf(platformB);
        
        // If both platforms are in orderedLinks, use their order
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // If only one platform is in orderedLinks, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // For platforms not in orderedLinks, maintain their original order
        return 0;
      });
    }
    
    return validLinks;
  }, [links, orderedLinks]);

  if (sortedLinks.length === 0) {
    return null;
  }

  return (
    <div className="social-links">
      {sortedLinks.map(([platform, url]) => (
        <a
          key={platform}
          href={formatUrl(platform, url)}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
          title={platform.startsWith('custom_') 
            ? platform.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            : platform}
        >
          {renderIcon(platform)}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks; 