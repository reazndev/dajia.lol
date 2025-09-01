import React, { useState, useEffect } from 'react';
import { 
  FaGlobe, FaGithub, FaXTwitter, FaInstagram, FaLinkedin, FaYoutube, 
  FaTwitch, FaDiscord, FaSpotify, FaReddit, FaSoundcloud, FaTiktok, FaLastfm,
  FaTelegram, FaSnapchat, FaPaypal, FaSteam, FaPinterest, FaFacebook, FaEnvelope,
  FaBitcoin, FaEthereum, FaGitlab, FaCoffee, FaPlus, FaUpload, FaXmark, 
  FaArrowLeft, FaArrowRight, FaGripVertical, FaMusic
} from 'react-icons/fa6';
import { Draggable } from "react-drag-reorder";
import { SiRoblox, SiCashapp, SiNamemc, SiKick, SiBuymeacoffee, SiKofi, SiPatreon, SiLitecoin, SiMonero, SiSolana } from 'react-icons/si';
import { supabase } from '../supabaseClient';
import ImageUploader from './ImageUploader';
import './SocialMediaSettings.css';

const platformIcons = {
  website: { icon: FaGlobe, label: 'Website' },
  github: { icon: FaGithub, label: 'GitHub' },
  twitter: { icon: FaXTwitter, label: 'X' },
  instagram: { icon: FaInstagram, label: 'Instagram' },
  linkedin: { icon: FaLinkedin, label: 'LinkedIn' },
  youtube: { icon: FaYoutube, label: 'YouTube' },
  twitch: { icon: FaTwitch, label: 'Twitch' },
  discord: { icon: FaDiscord, label: 'Discord' },
  spotify: { icon: FaSpotify, label: 'Spotify' },
  reddit: { icon: FaReddit, label: 'Reddit' },
  soundcloud: { icon: FaSoundcloud, label: 'SoundCloud' },
  tiktok: { icon: FaTiktok, label: 'TikTok' },
  lastfm: { icon: FaLastfm, label: 'Last.fm' },
  rateyourmusic: { icon: FaMusic, label: 'RYM' },
  telegram: { icon: FaTelegram, label: 'Telegram' },
  snapchat: { icon: FaSnapchat, label: 'Snapchat' },
  paypal: { icon: FaPaypal, label: 'PayPal' },
  roblox: { icon: SiRoblox, label: 'Roblox' },
  cashapp: { icon: SiCashapp, label: 'Cash App' },
  gitlab: { icon: FaGitlab, label: 'GitLab' },
  namemc: { icon: SiNamemc, label: 'NameMC' },
  steam: { icon: FaSteam, label: 'Steam' },
  kick: { icon: SiKick, label: 'Kick' },
  pinterest: { icon: FaPinterest, label: 'Pinterest' },
  buymeacoffee: { icon: SiBuymeacoffee, label: 'BMaC' },
  kofi: { icon: SiKofi, label: 'Ko-fi' },
  facebook: { icon: FaFacebook, label: 'Facebook' },
  patreon: { icon: SiPatreon, label: 'Patreon' },
  email: { icon: FaEnvelope, label: 'Email' },
  btc: { icon: FaBitcoin, label: 'Bitcoin' },
  litecoin: { icon: SiLitecoin, label: 'Litecoin' },
  eth: { icon: FaEthereum, label: 'Ethereum' },
  monero: { icon: SiMonero, label: 'Monero' },
  solana: { icon: SiSolana, label: 'Solana' }
};

const SocialMediaSettings = ({ 
  initialLinks = {}, 
  onSave, 
  color = '#8b5cf6', 
  iconColor = 'white',
  lastfmUsername: initialLastfmUsername = '',
  discordUsername: initialDiscordUsername = '',
  customIcons: initialCustomIcons = {}
}) => {
  const [links, setLinks] = useState({ ...initialLinks });
  const [orderedPlatforms, setOrderedPlatforms] = useState([]);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastfmUsername, setLastfmUsername] = useState(initialLastfmUsername);
  const [discordUsername, setDiscordUsername] = useState(initialDiscordUsername);
  const [showCustomIconUploader, setShowCustomIconUploader] = useState(false);
  const [customIcons, setCustomIcons] = useState(initialCustomIcons || {});
  const [customPlatformName, setCustomPlatformName] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchOrderedPlatforms = async () => {
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

        // Extract platforms in order
        const platforms = socialLinks.map(link => link.platform);
        
        // Set ordered platforms
        setOrderedPlatforms([...platforms]);

        console.log("Fetched ordered platforms:", platforms);
      } catch (error) {
        console.error('Error fetching ordered platforms:', error);
        setErrorMessage('Failed to fetch social links order: ' + error.message);
      }
    };

    if (initialLinks && Object.keys(initialLinks).length > 0) {
      console.log("Initializing social links with:", initialLinks);
      setLinks(initialLinks);
      
      // Set platforms from initialLinks if we don't have ordered platforms yet
      if (orderedPlatforms.length === 0) {
        const platforms = Object.entries(initialLinks)
          .filter(([_, value]) => value)
          .map(([platform]) => platform);
        setOrderedPlatforms([...new Set(platforms)]);
      }
    }
    
    // Set LastFM and Discord usernames from props or initialLinks
    if (initialLastfmUsername) {
      setLastfmUsername(initialLastfmUsername);
    } else if (initialLinks.lastfm) {
      setLastfmUsername(initialLinks.lastfm);
    }
    
    if (initialDiscordUsername) {
      setDiscordUsername(initialDiscordUsername);
    } else if (initialLinks.discord) {
      setDiscordUsername(initialLinks.discord);
    }
    
    // Initialize custom icons
    if (initialCustomIcons && Object.keys(initialCustomIcons).length > 0) {
      console.log("Initializing custom icons:", initialCustomIcons);
      setCustomIcons(initialCustomIcons);
    }
    
    // Fetch ordered platforms from the database
    fetchOrderedPlatforms();
  }, [initialLinks, initialLastfmUsername, initialDiscordUsername, initialCustomIcons]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      }
    };

    fetchUser();
  }, []);

  const handleSave = async () => {
    try {
      const filteredLinks = {};
      Object.entries(links).forEach(([platform, url]) => {
        // Include the platform even if URL is empty, as long as it exists in orderedPlatforms
        if (orderedPlatforms.includes(platform)) {
          filteredLinks[platform] = url || ''; // Convert null/undefined to empty string
        }
      });
      
      // Make sure lastfm and discord usernames are included in the links
      if (lastfmUsername && !filteredLinks.lastfm) {
        filteredLinks.lastfm = lastfmUsername;
      }
      
      if (discordUsername && !filteredLinks.discord) {
        filteredLinks.discord = discordUsername;
      }
      
      console.log('Saving links:', filteredLinks);
      console.log('Ordered platforms:', orderedPlatforms);
      console.log('Custom icons:', customIcons);
      
      // Call the onSave function passed from the parent component
      await onSave(filteredLinks, orderedPlatforms, customIcons);
      setSuccessMessage('Social links saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error saving social links:", error);
      setErrorMessage('Failed to save social links: ' + error.message);
    }
  };

  const handleEditClick = (platform) => {
    setEditingPlatform(platform);
    if (platform === 'lastfm') {
      setEditValue(lastfmUsername || '');
    } else if (platform === 'discord') {
      setEditValue(discordUsername || '');
    } else {
      setEditValue(links[platform] || '');
    }
  };

  const handleEditSave = () => {
    if (editingPlatform) {
      // Handle LastFM and Discord specially
      if (editingPlatform === 'lastfm') {
        setLastfmUsername(editValue);
        // Also update links for consistency
        setLinks(prev => ({
          ...prev,
          [editingPlatform]: editValue
        }));
      } else if (editingPlatform === 'discord') {
        setDiscordUsername(editValue);
        // Also update links for consistency
        setLinks(prev => ({
          ...prev,
          [editingPlatform]: editValue
        }));
      } else {
        // Regular social links
        setLinks(prev => ({
          ...prev,
          [editingPlatform]: editValue
        }));
      }
      
      if (editValue && !orderedPlatforms.includes(editingPlatform)) {
        setOrderedPlatforms(prev => [...prev, editingPlatform]);
      } else if (!editValue && orderedPlatforms.includes(editingPlatform)) {
        setOrderedPlatforms(prev => prev.filter(p => p !== editingPlatform));
      }
      
      setEditingPlatform(null);
      setEditValue('');
    }
  };

  const handleCustomIconUpload = async (iconUrl) => {
    if (!customPlatformName.trim()) {
      setErrorMessage('Please enter a name for your custom platform');
      return;
    }

    try {
      const platformKey = `custom_${customPlatformName.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Update custom icons state
      setCustomIcons(prev => ({
        ...prev,
        [platformKey]: iconUrl
      }));

      // Add the custom platform to the list of platforms if not already present
      if (!orderedPlatforms.includes(platformKey)) {
        setOrderedPlatforms(prev => [...prev, platformKey]);
      }

      // Also set an empty link value to indicate this platform exists
      setLinks(prev => ({
        ...prev,
        [platformKey]: '' // We'll update this when user provides the URL
      }));

      // Reset the custom platform UI
      setCustomPlatformName('');
      setShowCustomIconUploader(false);
      
      // Show success message
      setSuccessMessage('Custom icon uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error handling custom icon upload:', error);
      setErrorMessage('Failed to upload custom icon: ' + error.message);
    }
  };

  const moveItemLeft = (index) => {
    if (index === 0) return; // Already at the beginning
    
    const newOrderedPlatforms = [...orderedPlatforms];
    const temp = newOrderedPlatforms[index];
    newOrderedPlatforms[index] = newOrderedPlatforms[index - 1];
    newOrderedPlatforms[index - 1] = temp;
    setOrderedPlatforms(newOrderedPlatforms);
  };

  const moveItemRight = (index) => {
    if (index === orderedPlatforms.length - 1) return; // Already at the end
    
    const newOrderedPlatforms = [...orderedPlatforms];
    const temp = newOrderedPlatforms[index];
    newOrderedPlatforms[index] = newOrderedPlatforms[index + 1];
    newOrderedPlatforms[index + 1] = temp;
    setOrderedPlatforms(newOrderedPlatforms);
  };

  const handleRemoveLink = (e, platform) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    
    // Create a copy of the current links
    const updatedLinks = { ...links };
    // Remove the link
    delete updatedLinks[platform];
    // Update links state
    setLinks(updatedLinks);
    
    // Remove from ordered platforms
    setOrderedPlatforms(prev => prev.filter(p => p !== platform));
    
    // If it's a custom platform, also remove from custom icons
    if (platform.startsWith('custom_') && customIcons[platform]) {
      const updatedCustomIcons = { ...customIcons };
      delete updatedCustomIcons[platform];
      setCustomIcons(updatedCustomIcons);
    }

    // Special handling for LastFM and Discord
    if (platform === 'lastfm') {
      setLastfmUsername('');
    } else if (platform === 'discord') {
      setDiscordUsername('');
    }
  };

  return (
    <div className="settings-section" style={{ backgroundColor: '#1e1e2b' }}>
      
      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      
      <p className="help-text">Click on the platforms below to add your social media accounts</p>
      
      <div className="social-icons-grid">
        {Object.entries(platformIcons).map(([platform, { icon: Icon, label }]) => {
          if (platform === 'lastfm' || platform === 'discord') return null;
          
          const isActive = links[platform];
          
          return (
            <div 
              key={platform}
              className={`social-icon-box ${isActive ? 'active' : ''}`}
              onClick={() => handleEditClick(platform)}
            >
              {isActive && (
                <button
                  className="remove-link-btn"
                  onClick={(e) => handleRemoveLink(e, platform)}
                >
                  ×
                </button>
              )}
              <Icon size={24} color={isActive ? color : iconColor} />
              <span>{label}</span>
              {isActive && (
                <span className="platform-username" style={{ fontSize: '12px', marginTop: '-5px', marginBottom: '-15px' }}>
                  {links[platform]}
                </span>
              )}
            </div>
          );
        })}
        
        {/* Add custom platform button */}
        <div 
          className="social-icon-box"
          onClick={() => setShowCustomIconUploader(true)}
        >
          <FaPlus size={24} color={iconColor} />
          <span>Custom</span>
        </div>
      </div>

      {/* Custom platform popup */}
      {showCustomIconUploader && (
        <div className="edit-popup-overlay">
          <div className="edit-popup">
            <div className="edit-popup-header">
              <div className="edit-popup-title">
                <FaUpload size={24} color={color} />
                <span>This feature is still in development and might not work</span>
              </div>
              <button 
                className="close-popup-btn"
                onClick={() => setShowCustomIconUploader(false)}
              >
                <FaXmark />
              </button>
            </div>
            
            <input
              type="text"
              value={customPlatformName}
              onChange={(e) => setCustomPlatformName(e.target.value)}
              placeholder="Enter platform name"
              className="edit-popup-input"
            />
            
            <ImageUploader
              bucketName="custom-icons"
              userId={user?.id}
              onUploadSuccess={handleCustomIconUpload}
              onUploadError={(error) => setErrorMessage(error.message)}
              acceptedFileTypes="image/*"
              maxSizeMB={1}
              buttonText="Upload Icon"
            />
          </div>
        </div>
      )}

      {/* Link edit popup */}
      {editingPlatform && (
        <div className="edit-popup-overlay">
          <div className="edit-popup">
            <div className="edit-popup-header">
              <div className="edit-popup-title">
                {editingPlatform.startsWith('custom_') ? (
                  <img 
                    src={customIcons[editingPlatform]} 
                    alt={editingPlatform}
                    style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                  />
                ) : (
                  platformIcons[editingPlatform]?.icon && 
                  React.createElement(platformIcons[editingPlatform].icon, { size: 24, color: color })
                )}
                <span>
                  {editingPlatform.startsWith('custom_') 
                    ? editingPlatform.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    : platformIcons[editingPlatform]?.label}
                </span>
              </div>
              <button 
                className="close-popup-btn"
                onClick={() => setEditingPlatform(null)}
              >
                <FaXmark />
              </button>
            </div>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={`Enter your ${
                editingPlatform.startsWith('custom_')
                  ? editingPlatform.replace('custom_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  : platformIcons[editingPlatform]?.label
              } username or URL`}
              className="edit-popup-input"
            />
            <div className="edit-popup-actions">
              <button 
                className="edit-popup-save"
                onClick={handleEditSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <h3>Link Order</h3>
      <p className="help-text">Use the arrows to arrange how your social links will appear on your profile</p>
      
      <div className="social-links-preview">
        <div className="preview-icons">
          {orderedPlatforms.length > 0 ? (
            orderedPlatforms.map((platform, index) => {
              const isCustom = platform.startsWith('custom_');
              return (
                <div key={platform} className="preview-icon-wrapper">
                  <div className="arrow-controls">
                    <button 
                      className="arrow-btn left" 
                      onClick={() => moveItemLeft(index)}
                      disabled={index === 0}
                    >
                      <FaArrowLeft size={12} />
                    </button>
                    <button 
                      className="arrow-btn right" 
                      onClick={() => moveItemRight(index)}
                      disabled={index === orderedPlatforms.length - 1}
                    >
                      <FaArrowRight size={12} />
                    </button>
                    <span className="order-number">{index + 1}</span>
                  </div>
                  <div className="preview-icon-content">
                    {isCustom ? (
                      <img 
                        src={customIcons[platform]} 
                        alt={platform}
                        style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                      />
                    ) : (
                      React.createElement(platformIcons[platform]?.icon || FaLink, { size: 24, color: color })
                    )}
                      
                    <div className="link-value">
                      {platform === 'lastfm' ? lastfmUsername : 
                       platform === 'discord' ? discordUsername : 
                       links[platform]}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-links-message">No social links added yet. Click on the platforms above to add links.</div>
          )}
        </div>
      </div>
      
      {/* Add a save button */}
      <div className="save-links-btn-container" style={{ marginTop: '20px', textAlign: 'right' }}>
        <button 
          className="save-links-btn"
          onClick={handleSave}
          style={{
            background: color,
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default SocialMediaSettings; 