import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import SocialMediaSettings from '../components/SocialMediaSettings';
import { SketchPicker, ChromePicker } from 'react-color';
import './Settings.css';
import { getDiscordAuthUrl, disconnectDiscord } from '../utils/discordAuth';
import { LASTFM_CONFIG } from '../config/lastfm';
import { 
  updateProfileImage, 
  updateBackgroundImage, 
  updateAppearance, 
  updateLastFMUsername, 
  updateSocialLinks 
} from '../utils/dbHelpers';
import { clearProfileCache } from '../utils/cacheUtils';
import { uploadProfileImage, uploadBackgroundImage } from '../utils/storageHelpers';
import { checkSocialLinksTable } from '../utils/diagnostics';
import { fetchLinkMetadata } from '../utils/customBoxHelpers';
import { FaDiscord, FaGithub, FaYoutube, FaLink, FaTrash, FaGripVertical, FaSpotify, FaSteam, FaBook, FaClock, FaLastfm } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import CursorSettings from '../components/CursorSettings';
import FontSettings from '../components/FontSettings';
import AudioSettings from '../components/AudioSettings';
import BadgeManager from '../components/BadgeManager';
import { isAdmin as checkIsAdmin } from '../utils/createAdminsTable';
import SettingsSlider from '../components/SettingsSlider';
import SettingsSwitch from '../components/SettingsSwitch';
import PublicProfile from './PublicProfile';
import { cleanupUnusedFiles } from '../utils/storageCleanup';
import { createPortal } from 'react-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [accentColor, setAccentColor] = useState('#8b5cf6');
  const [backgroundColor, setBackgroundColor] = useState('#1f1f2c');
  const [widgetBgColor, setWidgetBgColor] = useState('#1f1f2c');
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7);
  const [contentOpacity, setContentOpacity] = useState(0.7);
  const [iconColor, setIconColor] = useState('#ffffff');
  const [primaryTextColor, setPrimaryTextColor] = useState('#ffffff');
  const [secondaryTextColor, setSecondaryTextColor] = useState('#b9bbbe');
  const [tertiaryTextColor, setTertiaryTextColor] = useState('#72767d');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [lastfmUsername, setLastfmUsername] = useState('');
  const [spotifyUsername, setSpotifyUsername] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [twitterUsername, setTwitterUsername] = useState('');
  const [instagramUsername, setInstagramUsername] = useState('');
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [youtubeUsername, setYoutubeUsername] = useState('');
  const [twitchUsername, setTwitchUsername] = useState('');
  const [redditUsername, setRedditUsername] = useState('');
  const [linkedinUsername, setLinkedinUsername] = useState('');
  const [pinterestUsername, setPinterestUsername] = useState('');
  const [soundcloudUsername, setSoundcloudUsername] = useState('');
  const [bandcampUsername, setBandcampUsername] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordAvatar, setDiscordAvatar] = useState('');
  const [discordStatus, setDiscordStatus] = useState('offline');
  const [discordActivity, setDiscordActivity] = useState(null);
  const [discordPresenceColor, setDiscordPresenceColor] = useState('#1f1f2c');
  const [discordPresenceOpacity, setDiscordPresenceOpacity] = useState(90);
  const [lastfmPresenceColor, setLastfmPresenceColor] = useState('#1f1f2c');
  const [lastfmPresenceOpacity, setLastfmPresenceOpacity] = useState(90);
  const [presenceBorderRadius, setPresenceBorderRadius] = useState(12);
  const [successMessage, setSuccessMessage] = useState('');
  const [accountSuccessMessage, setAccountSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [socialLinks, setSocialLinks] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [connectingDiscord, setConnectingDiscord] = useState(false);
  const [disconnectingDiscord, setDisconnectingDiscord] = useState(false);
  const discordUsernameRef = useRef(null);
  const [showDiscordColorPicker, setShowDiscordColorPicker] = useState(false);
  const [showLastFMColorPicker, setShowLastFMColorPicker] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [separatePresenceSettings, setSeparatePresenceSettings] = useState(false);
  const [activeSection, setActiveSection] = useState('appearance');
  const [showIconColorPicker, setShowIconColorPicker] = useState(false);
  const [showPrimaryTextColorPicker, setShowPrimaryTextColorPicker] = useState(false);
  const [showSecondaryTextColorPicker, setShowSecondaryTextColorPicker] = useState(false);
  const [showTertiaryTextColorPicker, setShowTertiaryTextColorPicker] = useState(false);
  const [customBoxes, setCustomBoxes] = useState([]);
  const [newBoxUrl, setNewBoxUrl] = useState('');
  const [loadingBoxInfo, setLoadingBoxInfo] = useState(false);
  const [boxError, setBoxError] = useState('');
  const DEFAULT_AVATAR = 'https://placehold.co/150';
  const [showContentBgColorPicker, setShowContentBgColorPicker] = useState(false);
  const [showWidgetBgColorPicker, setShowWidgetBgColorPicker] = useState(false);
  const [iconGlowEnabled, setIconGlowEnabled] = useState(false);
  const [iconGlowColor, setIconGlowColor] = useState('#8b5cf6');
  const [iconGlowStrength, setIconGlowStrength] = useState(10);
  const [showIconGlowColorPicker, setShowIconGlowColorPicker] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUsernameGlowColorPicker, setShowUsernameGlowColorPicker] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const [colorPickerPosition, setColorPickerPosition] = useState({ top: 0, left: 0 });
  const [showCardTypeSelector, setShowCardTypeSelector] = useState(false);
  const [selectedCardType, setSelectedCardType] = useState('');
  const [customIcons, setCustomIcons] = useState({});
  const [avatarBorderEnabled, setAvatarBorderEnabled] = useState(true);
  const [localBio, setLocalBio] = useState('');
  const [localBioText1, setLocalBioText1] = useState('');
  const [localBioText2, setLocalBioText2] = useState('');
  const [localBioText3, setLocalBioText3] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const bioSaveTimeoutRef = useRef(null);
  const [countdownDate, setCountdownDate] = useState(null);
  const [countdownDescription, setCountdownDescription] = useState('');
  const [lastUploadedAvatar, setLastUploadedAvatar] = useState(null);
  const [lastUploadedBackground, setLastUploadedBackground] = useState(null);

  // Template states
  const [templates, setTemplates] = useState([]);
  const [userTemplates, setUserTemplates] = useState([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateTags, setTemplateTags] = useState([]);
  const [templatePreviewImage, setTemplatePreviewImage] = useState(null);
  const [templatePreviewFile, setTemplatePreviewFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  const [processedTags, setProcessedTags] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);

  const [cleanupStatus, setCleanupStatus] = useState('');
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const [isMobileView, setIsMobileView] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [activeTemplateTab, setActiveTemplateTab] = useState('all'); 
  const [isDeleting, setIsDeleting] = useState(false); 

  const TemplateModal = ({ onClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      tags: [],
      processedTags: [],
      tagsInput: ''  
    });

    const handleFormChange = (field, value) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    };

    const handleTagsChange = (e) => {
      const inputValue = e.target.value;
      handleFormChange('tagsInput', inputValue);
      
      // Split by comma and clean up tags
      const tags = inputValue.split(',').map(tag => tag.trim());
      const filtered = tags.filter(tag => tag !== '');
      
      // Update the tags arrays
      handleFormChange('tags', filtered);
      handleFormChange('processedTags', filtered);
    };

    const handleSubmit = async (e) => {
      e.preventDefault(); // Prevent form submission
      
      setTemplateName(formData.name);
      setTemplateDescription(formData.description);
      setTemplateTags(formData.tags);
      setProcessedTags(formData.processedTags);

      try {
        console.log("Starting template creation...");
        
        if (!formData.name) {
          setErrorMessage('Please enter a template name');
          return;
        }
        
        if (formData.tags.length === 0) {
          setErrorMessage('Please add at least one tag');
          return;
        }
        
        if (formData.tags.length > 3) {
          setErrorMessage('You can add up to 3 tags');
          return;
        }
        
        // 12 character limit on tags
        const processedTags = formData.tags.map(tag => 
          tag.length > 12 ? tag.substring(0, 12) : tag
        );
        
        setLoading(true);
        
        // Get current user to ensure we have a valid user ID
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !currentUser) {
          throw new Error("User not authenticated. Please log in again.");
        }
        
        // Use current profile image as preview image
        const previewImageUrl = profile?.profile_image || '';
        
        if (!previewImageUrl) {
          console.warn("No profile image available for preview, using a default placeholder");
        }
        
        // Prepare template data
        if (!currentUser || !currentUser.id) {
          throw new Error("Valid user ID is required to create a template");
        }
        
        const templateData = {
          creator_id: currentUser.id,
          name: formData.name,
          description: formData.description || "",
          preview_image: previewImageUrl || 'https://placehold.co/600x400?text=Template',
          profile_image: profile.profile_image || null,
          background_image: profile.background_image || null,
          accent_color: accentColor,
          bg_color: backgroundColor,
          bg_opacity: backgroundOpacity,
          primary_text_color: primaryTextColor,
          secondary_text_color: secondaryTextColor,
          tertiary_text_color: tertiaryTextColor,
          icon_color: iconColor,
          content_opacity: contentOpacity,
          widget_bg_color: widgetBgColor,
          icon_glow_enabled: iconGlowEnabled,
          icon_glow_color: iconGlowColor,
          icon_glow_strength: iconGlowStrength,
          font_family: fontFamily,
          cursor_effects: profile.cursor_effects || [],
          avatar_border_enabled: avatarBorderEnabled,
          username_typewriter_enabled: profile.username_typewriter_enabled,
          username_typewriter_mode: profile.username_typewriter_mode,
          username_typewriter_speed: profile.username_typewriter_speed,
          presence_border_radius: profile.presence_border_radius,
          tags: processedTags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Create template
        const { data, error } = await supabase
          .from('templates')
          .insert([templateData]);
          
        if (error) {
          console.error("Database error when creating template:", error);
          throw error;
        }
        
        setSuccessMessage('Template created successfully!');
        setShowCreateTemplate(false);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateTags([]);
        setTemplatePreviewImage(null);
        setTemplatePreviewFile(null);
        setPreviewImageUrl('');
        setProcessedTags([]);
        
        // Refresh templates list
        fetchTemplates();
      } catch (error) {
        console.error('Error creating template:', error);
        setErrorMessage('Failed to create template: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    return createPortal(
      <div className="modal-backdrop" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}>
        <div className="modal-content" style={{
          background: '#1f1f2c',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          animation: 'modalFadeIn 0.3s ease'
        }}>
          <div className="modal-header" style={{
            padding: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Create New Template</h3>
            <button 
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '24px',
                cursor: 'pointer',
                padding: 0,
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.9)' }}>
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Enter template name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.9)' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                placeholder="Enter template description"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.9)' }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tagsInput}
                onChange={handleTagsChange}
                placeholder="Enter tags (e.g. dark, minimal, purple)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
              {formData.tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        color: '#8b5cf6',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {errorMessage && (
              <div style={{
                padding: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                {errorMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name || formData.tags.length === 0}
                style={{
                  padding: '10px 20px',
                  background: '#8b5cf6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  opacity: (!formData.name || formData.tags.length === 0) ? '0.5' : '1'
                }}
              >
                Create Template
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    );
  };

  const fetchTemplates = async (filterByCreator = false) => {
    try {
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }
      
      let query = supabase
        .from('templates')
        .select(`
          *,
          creator:profiles_new!creator_id(
            id,
            username
          )
        `);
      
      // If filtering by creator, only get templates created by the current user
      if (filterByCreator && currentUser) {
        query = query.eq('creator_id', currentUser.id);
      }
      
      // Order by created_at descending
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;
      
      const processedTemplates = data.map(template => ({
        ...template,
        creator: template.creator || { username: 'Unknown' }
      }));
      
      if (filterByCreator) {
        setUserTemplates(processedTemplates || []);
      } else {
      setTemplates(processedTemplates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setErrorMessage('Failed to load templates: ' + error.message);
    }
  };

  const fetchLastFMData = async () => {
    if (!profile?.lastfm_username) return;
    
    try {
      // Fetch recent tracks
      const recentTracksResponse = await fetch(`/api/lastfm/recent-tracks?username=${profile.lastfm_username}`);
      const recentTracksData = await recentTracksResponse.json();
      if (recentTracksData.success) {
        setRecentTracks(recentTracksData.tracks || []);
      }

      // Fetch top artists
      const topArtistsResponse = await fetch(`/api/lastfm/top-artists?username=${profile.lastfm_username}`);
      const topArtistsData = await topArtistsResponse.json();
      if (topArtistsData.success) {
        setTopArtists(topArtistsData.artists || []);
      }
    } catch (error) {
      console.error('Error fetching LastFM data:', error);
    }
  };

  useEffect(() => {
    if (activeSection === 'templates') {
      fetchTemplates();
      fetchTemplates(true);
      fetchLastFMData();
    }
  }, [activeSection, profile?.lastfm_username]);

  const handleCreateTemplate = async () => {
    try {
      console.log("Starting template creation...");
      
      if (!templateName) {
        setErrorMessage('Please enter a template name');
        return;
      }
      
      if (templateTags.length === 0) {
        setErrorMessage('Please add at least one tag');
        return;
      }
      
      if (templateTags.length > 3) {
        setErrorMessage('You can add up to 3 tags');
        return;
      }
      
      // Enforce 12 character limit on tags
      const processedTags = templateTags.map(tag => 
        tag.length > 12 ? tag.substring(0, 12) : tag
      );
      
      setLoading(true);
      
      // Get current user to ensure we have a valid user ID
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // Get current appearance settings including correct image URLs
      const { data: currentAppearance, error: appearanceError } = await supabase
        .from('profile_appearance')
        .select('*')
        .eq('profile_id', currentUser.id)
        .single();

      if (appearanceError) {
        throw new Error(`Error fetching current appearance settings: ${appearanceError.message}`);
      }

      if (!currentAppearance) {
        throw new Error('No appearance settings found for the current user');
      }

      console.log('Current appearance settings:', currentAppearance);
      
      const templateData = {
        creator_id: currentUser.id,
        name: templateName,
        description: templateDescription || "",
        preview_image: currentAppearance.profile_image || 'https://placehold.co/600x400?text=Template',
        accent_color: currentAppearance.accent_color,
        bg_color: currentAppearance.bg_color,
        bg_opacity: currentAppearance.bg_opacity,
        primary_text_color: currentAppearance.primary_text_color,
        secondary_text_color: currentAppearance.secondary_text_color,
        tertiary_text_color: currentAppearance.tertiary_text_color,
        icon_color: currentAppearance.icon_color,
        content_opacity: currentAppearance.content_opacity,
        widget_bg_color: currentAppearance.widget_bg_color,
        icon_glow_enabled: currentAppearance.icon_glow_enabled,
        icon_glow_color: currentAppearance.icon_glow_color,
        icon_glow_strength: currentAppearance.icon_glow_strength,
        font_family: currentAppearance.font_family,
        cursor_effects: currentAppearance.cursor_effects || [],
        avatar_border_enabled: currentAppearance.avatar_border_enabled,
        username_typewriter_enabled: profile.username_typewriter_enabled,
        username_typewriter_mode: profile.username_typewriter_mode,
        username_typewriter_speed: profile.username_typewriter_speed,
        presence_border_radius: currentAppearance.presence_border_radius,
        profile_image: currentAppearance.profile_image,
        background_image: currentAppearance.background_image,
        tags: processedTags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating template with data:', templateData);
      
      // Create template
      const { data, error } = await supabase
        .from('templates')
        .insert([templateData]);
        
      if (error) {
        console.error("Database error when creating template:", error);
        throw error;
      }
      
      setSuccessMessage('Template created successfully!');
      setShowCreateTemplate(false);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateTags([]);
      setTemplatePreviewImage(null);
      setTemplatePreviewFile(null);
      setPreviewImageUrl('');
      setProcessedTags([]);
      
      // Refresh templates list
      fetchTemplates();
    } catch (error) {
      console.error('Error creating template:', error);
      setErrorMessage('Failed to create template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!currentUser) {
        throw new Error("User not authenticated. Please log in again.");
      }
      
      console.log("Starting template application process...");
      
      const appearanceUpdate = {
        accent_color: template.accent_color,
        bg_color: template.bg_color,
        bg_opacity: template.bg_opacity,
        primary_text_color: template.primary_text_color,
        secondary_text_color: template.secondary_text_color,
        tertiary_text_color: template.tertiary_text_color,
        icon_color: template.icon_color,
        content_opacity: template.content_opacity,
        widget_bg_color: template.widget_bg_color,
        icon_glow_enabled: template.icon_glow_enabled,
        icon_glow_color: template.icon_glow_color,
        icon_glow_strength: template.icon_glow_strength,
        font_family: template.font_family,
        avatar_border_enabled: template.avatar_border_enabled,
        profile_image: template.profile_image,
        background_image: template.background_image,
        updated_at: new Date().toISOString()
      };
      
      console.log("Updating profile_appearance with:", appearanceUpdate);
      
      const { error: appearanceError } = await supabase
        .from('profile_appearance')
        .update(appearanceUpdate)
        .eq('profile_id', currentUser.id);
        
      if (appearanceError) {
        console.error("Error updating appearance:", appearanceError);
        throw new Error(`Failed to update appearance: ${appearanceError.message}`);
      }
      
      console.log("Successfully updated profile_appearance");
      
      const profilesUpdate = {
        username_typewriter_enabled: template.username_typewriter_enabled,
        username_typewriter_mode: template.username_typewriter_mode,
        username_typewriter_speed: template.username_typewriter_speed,
        username_glow_enabled: template.username_glow_enabled,
        username_glow_color: template.username_glow_color,
        username_glow_strength: template.username_glow_strength,
        updated_at: new Date().toISOString()
      };
      
      console.log("Updating profiles_new with:", profilesUpdate);
      
      const { error: profileError } = await supabase
        .from('profiles_new')
        .update(profilesUpdate)
        .eq('id', currentUser.id);
        
      if (profileError) {
        console.error("Error updating profile:", profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }
      
      console.log("Successfully updated profiles_new");
      
      // Increment uses_count in the database
      const { error: usesError } = await supabase.rpc('increment_template_uses', {
        template_id: template.id
      });
      
      if (usesError) {
        console.error('Error incrementing template uses:', usesError);
      } else {
        console.log("Successfully incremented template uses count");
      }
      
      // Update local state to reflect changes
      setAccentColor(template.accent_color);
      setBackgroundColor(template.bg_color);
      setBackgroundOpacity(template.bg_opacity);
      setPrimaryTextColor(template.primary_text_color);
      setSecondaryTextColor(template.secondary_text_color);
      setTertiaryTextColor(template.tertiary_text_color);
      setIconColor(template.icon_color);
      setContentOpacity(template.content_opacity);
      setWidgetBgColor(template.widget_bg_color);
      setIconGlowEnabled(template.icon_glow_enabled);
      setIconGlowColor(template.icon_glow_color);
      setIconGlowStrength(template.icon_glow_strength);
      setFontFamily(template.font_family);
      setAvatarBorderEnabled(template.avatar_border_enabled);
      setAvatarUrl(template.profile_image);
      setBackgroundUrl(template.background_image);
      
      // Update profile state
      setProfile(prev => ({
        ...prev,
        accent_color: template.accent_color,
        bg_color: template.bg_color,
        bg_opacity: template.bg_opacity,
        primary_text_color: template.primary_text_color,
        secondary_text_color: template.secondary_text_color,
        tertiary_text_color: template.tertiary_text_color,
        icon_color: template.icon_color,
        content_opacity: template.content_opacity,
        widget_bg_color: template.widget_bg_color,
        icon_glow_enabled: template.icon_glow_enabled,
        icon_glow_color: template.icon_glow_color,
        icon_glow_strength: template.icon_glow_strength,
        font_family: template.font_family,
        avatar_border_enabled: template.avatar_border_enabled,
        username_typewriter_enabled: template.username_typewriter_enabled,
        username_typewriter_mode: template.username_typewriter_mode,
        username_typewriter_speed: template.username_typewriter_speed,
        username_glow_enabled: template.username_glow_enabled,
        username_glow_color: template.username_glow_color,
        username_glow_strength: template.username_glow_strength,
        profile_image: template.profile_image,
        background_image: template.background_image
      }));
      
      // Refresh templates list to show updated uses count
      fetchTemplates();
      
      setSuccessMessage('Template applied successfully! Refresh the page to see all changes.');
    } catch (error) {
      console.error('Error applying template:', error);
      setErrorMessage('Failed to apply template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplatePreviewChange = async (e) => {
    try {
      if (!e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      
      // Preview the image locally
      const reader = new FileReader();
      reader.onload = (e) => {
        setTemplatePreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setTemplatePreviewFile(file);
    } catch (error) {
      console.error('Error handling template preview:', error);
      setErrorMessage('Failed to process preview image');
    }
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        
        // Get current user
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        console.log("Auth response:", { currentUser, authError });
        
        if (authError) {
          throw new Error(`Authentication error: ${authError.message}`);
        }
        
        if (!currentUser) {
          console.error("No authenticated user found");
          navigate('/login');
          return;
        }
        
        setUser(currentUser);
        console.log("Current user:", currentUser);

        const { success, isAdmin: userIsAdmin } = await checkIsAdmin(currentUser.id);
        if (success && userIsAdmin) {
          setIsAdmin(true);
          console.log("User is an admin");
        }
        
        let profileData;
        
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles_new')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Error checking profile:", profileError);
          throw profileError;
        }
        
        if (!existingProfile) {
          console.log("No profile found, creating default profile");
          const defaultProfile = {
            id: currentUser.id,
            username: currentUser.email?.split('@')[0] || 'user',
            email: currentUser.email,
            bio: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            username_typewriter_enabled: false,
            username_typewriter_speed: 100,
            username_typewriter_mode: 'simple',
            bio_typewriter_enabled: false,
            bio_typewriter_speed: 100,
            bio_typewriter_mode: 'simple',
            bio_typewriter_text1: '',
            bio_typewriter_text2: '',
            bio_typewriter_text3: '',
            username_glow_enabled: false,
            username_glow_color: '#8b5cf6',
            username_glow_strength: 10
          };

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles_new')
            .insert([defaultProfile])
            .select()
            .maybeSingle();

          if (insertError) {
            console.error("Error creating profile:", insertError);
            throw insertError;
          }
          profileData = newProfile;
        } else {
          profileData = existingProfile;
        }

        const { data: existingAppearance, error: appearanceError } = await supabase
          .from('profile_appearance')
          .select('*')
          .eq('profile_id', currentUser.id)
          .maybeSingle();

        if (appearanceError) {
          console.error("Error checking appearance settings:", appearanceError);
          throw appearanceError;
        }

        if (!existingAppearance) {
          // Create default appearance settings
          console.log("No appearance settings found, creating defaults");
          const defaultAppearance = {
            profile_id: currentUser.id,
            accent_color: '#8b5cf6',
            bg_color: '#1f1f2c',
            widget_bg_color: '#1f1f2c',
            bg_opacity: 0.7,
            content_opacity: 0.7,
            icon_color: '#ffffff',
            primary_text_color: '#ffffff',
            secondary_text_color: '#b9bbbe',
            tertiary_text_color: '#72767d',
            font_family: 'Inter',
            icon_glow_enabled: false,
            icon_glow_color: '#8b5cf6',
            icon_glow_strength: 10,
            avatar_border_enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: newAppearance, error: insertAppearanceError } = await supabase
            .from('profile_appearance')
            .insert([defaultAppearance])
            .select()
            .maybeSingle();

          if (insertAppearanceError) {
            console.error("Error creating appearance settings:", insertAppearanceError);
            throw insertAppearanceError;
          }
          Object.assign(profileData, newAppearance);
        } else {
          Object.assign(profileData, existingAppearance);
        }

        const { data: existingDiscord, error: discordError } = await supabase
          .from('profile_discord')
          .select('*')
          .eq('profile_id', currentUser.id)
          .maybeSingle();

        if (!discordError) {
          if (!existingDiscord) {
            const defaultDiscord = {
              profile_id: currentUser.id,
              discord_connected: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { data: newDiscord } = await supabase
              .from('profile_discord')
              .insert([defaultDiscord])
              .select()
              .maybeSingle();

            if (newDiscord) {
              Object.assign(profileData, newDiscord);
            }
          } else {
            Object.assign(profileData, existingDiscord);
          }
        }

        const { data: existingLastfm, error: lastfmError } = await supabase
          .from('profile_lastfm')
          .select('*')
          .eq('profile_id', currentUser.id)
          .maybeSingle();

        if (!lastfmError) {
          if (!existingLastfm) {
            const defaultLastfm = {
              profile_id: currentUser.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { data: newLastfm } = await supabase
              .from('profile_lastfm')
              .insert([defaultLastfm])
              .select()
              .maybeSingle();

            if (newLastfm) {
              Object.assign(profileData, newLastfm);
            }
          } else {
            Object.assign(profileData, existingLastfm);
          }
        }

        const { data: socialLinksData, error: socialLinksError } = await supabase
          .from('social_links')
          .select('*')
          .eq('profile_id', currentUser.id);

        if (socialLinksError) {
          console.error('Error fetching social links:', socialLinksError);
        }

        if (!socialLinksError && socialLinksData) {
          console.log('Social links data:', socialLinksData);
          const formattedSocialLinks = {};
          const retrievedCustomIcons = {};
          
          socialLinksData.forEach(link => {
            formattedSocialLinks[link.platform] = link.url;
            if (link.is_custom && link.icon_url) {
              retrievedCustomIcons[link.platform] = link.icon_url;
            }
          });
          
          setSocialLinks(formattedSocialLinks);
          setCustomIcons(retrievedCustomIcons);
        }

        const { data: boxes, error: boxesError } = await supabase
          .from('custom_boxes')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('display_order');

        if (boxesError) {
          console.error('Error fetching custom boxes:', boxesError);
        } else {
          console.log('Custom boxes data:', boxes);
          setCustomBoxes(boxes || []);
        }

        setProfile(profileData);
        setUsername(profileData.username || '');
        setEmail(profileData.email || '');
        setBio(profileData.bio || '');
        setAccentColor(profileData.accent_color || '#8b5cf6');
        setBackgroundColor(profileData.bg_color || '#1f1f2c');
        setWidgetBgColor(profileData.widget_bg_color || '#1f1f2c');
        setBackgroundOpacity(profileData.bg_opacity || 0.7);
        setContentOpacity(profileData.content_opacity || 0.7);
        setIconColor(profileData.icon_color || '#ffffff');
        setPrimaryTextColor(profileData.primary_text_color || '#ffffff');
        setSecondaryTextColor(profileData.secondary_text_color || '#b9bbbe');
        setTertiaryTextColor(profileData.tertiary_text_color || '#72767d');
        setFontFamily(profileData.font_family || 'Inter');
        setIconGlowEnabled(profileData.icon_glow_enabled || false);
        setIconGlowColor(profileData.icon_glow_color || '#8b5cf6');
        setIconGlowStrength(profileData.icon_glow_strength || 10);
        setAvatarBorderEnabled(profileData.avatar_border_enabled !== false);

        setLocalBio(profileData.bio || '');
        setLocalBioText1(profileData.bio_typewriter_text1 || '');
        setLocalBioText2(profileData.bio_typewriter_text2 || '');
        setLocalBioText3(profileData.bio_typewriter_text3 || '');

      } catch (error) {
        console.error('Error in fetchProfileData:', error);
        setErrorMessage('Failed to load profile data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const uploadFile = async (file, bucket, oldUrl) => {
    console.log(`[uploadFile] Starting upload to bucket: ${bucket}`);
    console.log(`[uploadFile] File:`, file ? `${file.name} (${file.size} bytes)` : 'No file provided');
    console.log(`[uploadFile] Old URL:`, oldUrl || 'None');
    
    if (!file) {
      console.log('[uploadFile] No file provided, returning old URL');
      return oldUrl;
    }
    
    // File size limits
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    // Check if file exceeds size limit
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit. Please upload a smaller file.`;
      console.error(`[uploadFile] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Map the internal bucket names to the actual db bucket names
    const bucketMap = {
      'profile-images': 'avatars',
      'background-images': 'backgrounds',
      'avatars': 'avatars',
      'backgrounds': 'backgrounds'
    };
    
    const actualBucket = bucketMap[bucket] || bucket;
    console.log(`[uploadFile] Mapped bucket ${bucket} to Supabase bucket: ${actualBucket}`);
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`[uploadFile] Current user ID: ${user.id}`);
    
    // Generate a random UUID for the filename that we'll use consistently
    const fileExt = file.name.split('.').pop();
    const randomId = crypto.randomUUID();
    const fileName = `${randomId}.${fileExt}`;
    
    // For avatars bucket, ensure double slash in the storage path
    const filePath = actualBucket === 'avatars' ? 
      `//${fileName}` : 
      fileName;
    
    console.log(`[uploadFile] Generated file path: ${filePath} in bucket: ${actualBucket}`);
    
    if (oldUrl) {
      try {
        const oldFileName = oldUrl.split('/').pop();
        
        // Check templates table for the old file URL
        const { data: templatesUsingFile, error: templateError } = await supabase
          .from('templates')
          .select('id')
          .or(`profile_image.eq.${oldUrl},background_image.eq.${oldUrl},preview_image.eq.${oldUrl}`);
          
        if (templateError) {
          console.error('[uploadFile] Error checking templates:', templateError);
        } else if (!templatesUsingFile?.length) {
          console.log(`[uploadFile] File ${oldFileName} is not used in any templates, safe to delete`);
          const { error: deleteError } = await supabase.storage
            .from(actualBucket)
            .remove([oldFileName]);
            
          if (deleteError) {
            console.warn(`[uploadFile] Failed to delete old file:`, deleteError);
          } else {
            console.log(`[uploadFile] Successfully deleted old file: ${oldFileName}`);
          }
        } else {
          console.log(`[uploadFile] File ${oldFileName} is used in ${templatesUsingFile.length} templates, keeping it`);
        }
      } catch (error) {
        console.warn(`[uploadFile] Error during file usage check:`, error);
        // Continue with upload even if delete check fails
      }
    }
    
    // Upload the new file
    const { error: uploadError } = await supabase.storage
      .from(actualBucket)
      .upload(filePath, file);
      
    if (uploadError) {
      console.error(`[uploadFile] Upload error:`, uploadError);
      throw uploadError;
    }
    
    const baseUrl = 'https://tfbsquqxtncjafeeltib.supabase.co/storage/v1/object/public';
    const finalUrl = actualBucket === 'avatars' ?
      `${baseUrl}/${actualBucket}//${fileName}` :
      `${baseUrl}/${actualBucket}/${fileName}`;
      
    console.log(`[uploadFile] Final URL: ${finalUrl}`);
    
    return finalUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (bioSaveTimeoutRef.current) {
        clearTimeout(bioSaveTimeoutRef.current);
      }

      // Get current user
      console.log('[handleSubmit] Getting current user');
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('[handleSubmit] Error getting user:', authError);
        throw new Error('Failed to get current user: ' + authError.message);
      }
      
      if (!currentUser) {
        console.error('[handleSubmit] User not authenticated');
        throw new Error('User not authenticated');
      }

      // Save all bio-related fields
      const bioUpdateData = {
        bio: localBio,
        bio_typewriter_text1: localBioText1,
        bio_typewriter_text2: localBioText2,
        bio_typewriter_text3: localBioText3,
        username_typewriter_speed: profile.username_typewriter_speed,
        username_glow_strength: profile.username_glow_strength,
        bio_typewriter_speed: profile.bio_typewriter_speed,
        updated_at: new Date().toISOString()
      };

      // Update the database with all bio fields at once
      const { error: bioError } = await supabase
        .from('profiles_new')
        .update(bioUpdateData)
        .eq('id', currentUser.id);

      if (bioError) throw bioError;

      setHasUnsavedChanges(false);

      console.log('[handleSubmit] Starting form submission');
      console.log('[handleSubmit] Colors being saved:', {
        primaryTextColor,
        secondaryTextColor,
        tertiaryTextColor,
        accentColor,
        backgroundColor,
        backgroundOpacity
      });

      // Get current user
      console.log('[handleSubmit] Getting current user');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('[handleSubmit] Error getting user:', userError);
        throw new Error('Failed to get current user: ' + userError.message);
      }
      
      if (!user) {
        console.error('[handleSubmit] User not authenticated');
        throw new Error('User not authenticated');
      }
      
      console.log(`[handleSubmit] Current user ID: ${user.id}`);
      
      let newAvatarUrl = profile.profile_image;
      let newBackgroundUrl = profile.background_image;
      let appearanceUpdateNeeded = false;
      
      // Handle file uploads if present and changed
      if (avatarFile) {
        console.log('[handleSubmit] Checking if avatar file needs upload');
        // Only upload if the file has actually changed
        if (!profile.profile_image || avatarFile !== lastUploadedAvatar) {
          console.log('[handleSubmit] Uploading new avatar file');
          try {
            newAvatarUrl = await uploadFile(avatarFile, 'profile-images', profile.profile_image);
            console.log(`[handleSubmit] New avatar URL: ${newAvatarUrl}`);
            appearanceUpdateNeeded = true;
            setLastUploadedAvatar(avatarFile);
          } catch (avatarError) {
            console.error('[handleSubmit] Avatar upload error:', avatarError);
            throw new Error('Failed to upload profile picture: ' + avatarError.message);
          }
        } else {
          console.log('[handleSubmit] Avatar file unchanged, skipping upload');
        }
      }
      
      if (backgroundFile) {
        console.log('[handleSubmit] Checking if background file needs upload');
        // Only upload if the file has actually changed
        if (!profile.background_image || backgroundFile !== lastUploadedBackground) {
          console.log('[handleSubmit] Uploading new background file');
          try {
            newBackgroundUrl = await uploadFile(backgroundFile, 'background-images', profile.background_image);
            console.log(`[handleSubmit] New background URL: ${newBackgroundUrl}`);
            appearanceUpdateNeeded = true;
            setLastUploadedBackground(backgroundFile);
          } catch (bgError) {
            console.error('[handleSubmit] Background upload error:', bgError);
            throw new Error('Failed to upload background image: ' + bgError.message);
          }
        } else {
          console.log('[handleSubmit] Background file unchanged, skipping upload');
        }
      }

      if (appearanceUpdateNeeded || 
          accentColor !== profile.accent_color ||
          backgroundColor !== profile.bg_color ||
          widgetBgColor !== profile.widget_bg_color ||
          backgroundOpacity !== profile.bg_opacity ||
          contentOpacity !== profile.content_opacity ||
          iconColor !== profile.icon_color ||
          primaryTextColor !== profile.primary_text_color ||
          secondaryTextColor !== profile.secondary_text_color ||
          tertiaryTextColor !== profile.tertiary_text_color ||
          fontFamily !== profile.font_family ||
          iconGlowEnabled !== profile.icon_glow_enabled ||
          iconGlowColor !== profile.icon_glow_color ||
          iconGlowStrength !== profile.icon_glow_strength ||
          avatarBorderEnabled !== profile.avatar_border_enabled) {
          
        // Update appearance data
        const appearanceUpdate = {
          profile_id: user.id,
          accent_color: accentColor,
          bg_color: backgroundColor,
          widget_bg_color: widgetBgColor,
          bg_opacity: backgroundOpacity,
          content_opacity: contentOpacity,
          icon_color: iconColor,
          primary_text_color: primaryTextColor,
          secondary_text_color: secondaryTextColor,
          tertiary_text_color: tertiaryTextColor,
          font_family: fontFamily,
          icon_glow_enabled: iconGlowEnabled,
          icon_glow_color: iconGlowColor,
          icon_glow_strength: iconGlowStrength,
          avatar_border_enabled: avatarBorderEnabled
        };

        // Only include image URLs if they've changed
        if (newAvatarUrl !== profile.profile_image) {
          appearanceUpdate.profile_image = newAvatarUrl;
        }
        if (newBackgroundUrl !== profile.background_image) {
          appearanceUpdate.background_image = newBackgroundUrl;
        }

        const { error: appearanceError } = await supabase
          .from('profile_appearance')
          .update(appearanceUpdate)
          .eq('profile_id', user.id);

        if (appearanceError) {
          console.error('[handleSubmit] Error updating appearance:', appearanceError);
          throw appearanceError;
        }
      }

      // Update core profile data
      const { error: profileError } = await supabase
        .from('profiles_new')
        .update({
          username,
          email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('[handleSubmit] Error updating profile:', profileError);
        throw profileError;
      }

      // Update lastfm data if username is provided
      if (lastfmUsername) {
        const { error: lastfmError } = await supabase
          .from('profile_lastfm')
          .update({
            lastfm_username: lastfmUsername,
            updated_at: new Date().toISOString()
          })
          .eq('profile_id', user.id);

        if (lastfmError) {
          console.error('[handleSubmit] Error updating LastFM:', lastfmError);
          throw lastfmError;
        }
      }

      // Update social links
      if (Object.keys(socialLinks).length > 0) {
        console.log('[handleSubmit] Updating social links:', socialLinks);
        await updateSocialLinks(user.id, socialLinks);
      }

      // Clear profile cache
      console.log(`[handleSubmit] Clearing profile cache for username: ${username}`);
      await clearProfileCache(username);

      console.log('[handleSubmit] All updates completed successfully');
      setSuccessMessage('Settings saved successfully!');
      
      // setTimeout(() => {
      //   window.location.href = `/${username}`;
      // }, 1000);
      
    } catch (error) {
      console.error('[handleSubmit] Error updating profile:', error);
      setErrorMessage(error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAvatarChange = async (e) => {
    try {
      if (!e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setAvatarFile(file);
      setLoading(true);
      
      const publicUrl = await uploadFile(file, 'profile-images', profile.profile_image);
      console.log('[handleAvatarChange] Received URL from upload:', publicUrl);
      
      // Verify the URL format
      if (!publicUrl) {
        throw new Error('No URL returned from upload');
      }

      // Update the profile_appearance table with the exact same URL
      const { error: updateError } = await supabase
        .from('profile_appearance')
        .update({ 
          profile_image: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', user.id);

      if (updateError) {
        console.error('[handleAvatarChange] Error updating profile appearance:', updateError);
        throw new Error('Failed to update profile appearance');
      }

      console.log('[handleAvatarChange] Successfully updated database with URL:', publicUrl);
      
      // Update the profile state with the exact same URL
      setProfile(prev => ({
        ...prev,
        profile_image: publicUrl
      }));
      
      // Clear the profile cache to ensure the new image is displayed
      await clearProfileCache(username);
      
      setSuccessMessage('Profile picture updated successfully!');
    } catch (error) {
      console.error('[handleAvatarChange] Error:', error);
      setErrorMessage(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundChange = async (e) => {
    try {
      if (!e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      
      // Preview the image locally
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundUrl(e.target.result);
      };
      reader.readAsDataURL(file);
      
      setBackgroundFile(file);
      setLoading(true);
      
      // Upload the image using the helper function
      const publicUrl = await uploadFile(file, 'background-images', profile.background_image);
      
      // Verify the URL format
      if (!publicUrl) {
        throw new Error('No URL returned from upload');
      }

      // Clean up the URL to ensure no unintended double slashes
      const cleanUrl = publicUrl.replace(/([^:])\/+/g, '$1/');
      console.log('[handleBackgroundChange] Clean URL:', cleanUrl);

      try {
        const response = await fetch(cleanUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`URL verification failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('[handleBackgroundChange] URL verification failed:', error);
        throw new Error('Failed to verify uploaded file accessibility');
      }
      
      const { error: updateError } = await supabase
        .from('profile_appearance')
        .update({ 
          background_image: cleanUrl,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', user.id);

      if (updateError) {
        console.error('Error updating profile appearance:', updateError);
        throw new Error('Failed to update profile appearance');
      }
      
      setProfile(prev => ({
        ...prev,
        background_image: cleanUrl
      }));
      
      await clearProfileCache(username);
      
      setSuccessMessage('Background image updated successfully!');
    } catch (error) {
      console.error('Error uploading background:', error);
      setErrorMessage(`Failed to upload background image: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinksUpdate = async (links, orderedPlatforms, customIconsData) => {
    try {
      console.log("Updating social links:", links);
      console.log("Custom icons:", customIconsData);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // First, delete all existing links
      const { error: deleteError } = await supabase
        .from('social_links')
        .delete()
        .eq('profile_id', user.id);

      if (deleteError) throw deleteError;

      const socialLinksToInsert = orderedPlatforms
        .filter(platform => links[platform] !== undefined) // Changed to check for undefined to allow empty strings
        .map((platform, index) => {
          const isCustom = platform.startsWith('custom_');
          return {
            profile_id: user.id,
            platform,
            url: links[platform] || '', // Allow empty strings but convert null/undefined to empty string
            display_order: index,
            is_custom: isCustom,
            icon_url: isCustom && customIconsData[platform] ? customIconsData[platform] : null
          };
        });

      console.log("Inserting social links:", socialLinksToInsert);

      if (socialLinksToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('social_links')
          .insert(socialLinksToInsert);

        if (insertError) {
          console.error("Error inserting social links:", insertError);
          throw insertError;
        }
      }

      setSocialLinks(links);
      
      // Update custom icons state
      if (customIconsData) {
        setCustomIcons(customIconsData);
      }
      
      setSuccessMessage('Social links updated successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      await clearProfileCache(username);
    } catch (error) {
      console.error('Error updating social links:', error);
      setErrorMessage('Failed to update social links: ' + error.message);
    }
  };

  const discordAuthUrl = getDiscordAuthUrl();

  const handleDiscordConnect = () => {
    window.location.href = getDiscordAuthUrl();
  };

  const handleDiscordDisconnect = async () => {
    try {
      setDisconnectingDiscord(true);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('You must be logged in to disconnect Discord');
      }
      
      const { error } = await supabase
        .from('profile_discord')
        .update({
          discord_username: null,
          discord_id: null,
          discord_avatar: null,
          discord_connected: false,
          discord_status: null,
          discord_activity: null,
          discord_token: null,
          discord_refresh_token: null,
          discord_token_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', currentUser.id);
      
      if (error) {
        throw error;
      }
      
      setProfile(prev => ({
        ...prev,
        discord_username: null,
        discord_connected: false,
        discord_status: null,
        discord_activity: null
      }));
      
      setSuccessMessage('Discord disconnected successfully!');
    } catch (error) {
      console.error('Error disconnecting Discord:', error);
      setErrorMessage('Failed to disconnect Discord: ' + error.message);
    } finally {
      setDisconnectingDiscord(false);
    }
  };

  const handleLastFMConnect = () => {
    const authParams = new URLSearchParams({
      api_key: LASTFM_CONFIG.API_KEY,
      cb: LASTFM_CONFIG.CALLBACK_URL
    });
    
    const authUrl = `${LASTFM_CONFIG.AUTH_URL}?${authParams.toString()}`;
    console.log('Debug - Redirecting to LastFM auth URL:', authUrl);
    window.location.href = authUrl;
  };

  const handleLastFMDisconnect = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('You must be logged in to disconnect LastFM');
      }
      
      const { error } = await supabase
        .from('profile_lastfm')
        .update({
          lastfm_username: null,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', currentUser.id);
      
      if (error) {
        throw error;
      }
      
      setProfile(prev => ({
        ...prev,
        lastfm_username: null
      }));
      
      setSuccessMessage('LastFM disconnected successfully!');
    } catch (error) {
      console.error('Error disconnecting LastFM:', error);
      setErrorMessage('Failed to disconnect LastFM: ' + error.message);
    }
  };

  // all of the elemts below are not needed anymore but shit i need them for the website to run, 
  // idk why but i also dont have the time to check where it's referenced

  const handlePresenceColorChange = async (type, color) => {
    console.log(``);
    setSuccessMessage('');
  };

  const handleOpacityChange = async (type, value) => {
    console.log(``);
    setSuccessMessage('');
  };

  const handleBorderRadiusChange = async (value) => {
    console.log('');
    setSuccessMessage('');
  };

  const handlePresenceSettingsSave = async () => {
    console.log('');
    setSuccessMessage('');
  };

  const getRgbValues = (rgba) => {
    const match = rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/); // fuck regex
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
    return { r: 32, g: 82, b: 67 };
  };

  const getColorForPicker = (rgba) => {
    if (!rgba) return { r: 32, g: 82, b: 67 };
    return getRgbValues(rgba);
  };

  const handleProfileImageUpload = async (event) => {
    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profile_appearance')
        .update({ profile_image: publicUrl })
        .eq('profile_id', user.id);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Error uploading profile image:', error);
    }
  };

  const handleBackgroundImageUpload = async (event) => {
    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('background-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('background-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profile_appearance')
        .update({ background_image: publicUrl })
        .eq('profile_id', user.id);

      if (updateError) throw updateError;

    } catch (error) {
      console.error('Error uploading background image:', error);
    }
  };

  const handleBackgroundOpacityChange = (e) => {
    const newOpacity = parseFloat(e.target.value);
    console.log("Setting background opacity to:", newOpacity);
    setBackgroundOpacity(newOpacity);
    // Update the profile state to reflect the change immediately
    setProfile(prev => ({
      ...prev,
      bg_opacity: newOpacity
    }));
  };

  const handleContentOpacityChange = (e) => {
    const newOpacity = parseFloat(e.target.value);
    console.log("Setting content opacity to:", newOpacity);
    setContentOpacity(newOpacity);
    // Update the profile state to reflect the change immediately
    setProfile(prev => ({
      ...prev,
      content_opacity: newOpacity
    }));
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      let profileImageUrl = profile.profile_image;
      let backgroundImageUrl = profile.background_image;
      
      // Upload profile image if changed
      if (avatarFile) {
        profileImageUrl = await uploadFile(avatarFile, 'profile-images', profile.profile_image);
      }
      
      // Upload background image if changed
      if (backgroundFile) {
        backgroundImageUrl = await uploadFile(backgroundFile, 'background-images', profile.background_image);
      }
      
      // Update appearance data
      const { error: appearanceError } = await supabase
        .from('profile_appearance')
        .update({
          profile_image: profileImageUrl,
          background_image: backgroundImageUrl,
          accent_color: accentColor,
          bg_color: backgroundColor,
          widget_bg_color: widgetBgColor,
          bg_opacity: backgroundOpacity,
          content_opacity: contentOpacity,
          icon_color: iconColor,
          icon_glow_enabled: iconGlowEnabled,
          icon_glow_color: iconGlowColor,
          icon_glow_strength: iconGlowStrength,
          primary_text_color: primaryTextColor,
          secondary_text_color: secondaryTextColor,
          tertiary_text_color: tertiaryTextColor,
          font_family: fontFamily,
          updated_at: new Date().toISOString()
        })
        .eq('profile_id', user.id);
        
      if (appearanceError) throw appearanceError;
      
      // Update profile bio
      const { error: profileError } = await supabase
        .from('profiles_new')
        .update({
          bio,
          updated_at: new Date()
        })
        .eq('id', user.id);
        
      if (profileError) throw profileError;
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles_new')
        .select('*')
        .eq('id', currentUser.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Fetch appearance data
      const { data: appearanceData, error: appearanceError } = await supabase
        .from('profile_appearance')
        .select('*')
        .eq('profile_id', currentUser.id)
        .single();
        
      if (appearanceError && appearanceError.code !== 'PGRST116') throw appearanceError;
      
      // Fetch discord data
      const { data: discordData, error: discordError } = await supabase
        .from('profile_discord')
        .select('*')
        .eq('profile_id', currentUser.id)
        .single();
        
      if (discordError && discordError.code !== 'PGRST116') throw discordError;
      
      // Fetch lastfm data
      const { data: lastfmData, error: lastfmError } = await supabase
        .from('profile_lastfm')
        .select('*')
        .eq('profile_id', currentUser.id)
        .single();
        
      if (lastfmError && lastfmError.code !== 'PGRST116') throw lastfmError;
      
      // Fetch social links
      const { data: socialLinksData, error: socialLinksError } = await supabase
        .from('social_links')
        .select('*')
        .eq('profile_id', currentUser.id);
        
      if (socialLinksError) throw socialLinksError;
      
      // Format social links into an object
      const formattedSocialLinks = {};
      const extractedCustomIcons = {};
      
      if (socialLinksData) {
        socialLinksData.forEach(link => {
          formattedSocialLinks[link.platform] = link.url;
          
          // Store custom icons
          if (link.is_custom && link.icon_url) {
            extractedCustomIcons[link.platform] = link.icon_url;
          }
        });
      }
      
      // Update the custom icons state
      setCustomIcons(extractedCustomIcons);
      
      // Combine all data
      const combinedData = {
        ...profileData,
        ...(appearanceData || {}),
        ...(discordData || {}),
        ...(lastfmData || {}),
        social_links: formattedSocialLinks
      };
      
      setProfile(combinedData);
      setSocialLinks(formattedSocialLinks);
      
      // Initialize local bio states
      setLocalBio(profileData.bio || '');
      setLocalBioText1(profileData.bio_typewriter_text1 || '');
      setLocalBioText2(profileData.bio_typewriter_text2 || '');
      setLocalBioText3(profileData.bio_typewriter_text3 || '');
      
      return combinedData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setErrorMessage('Failed to fetch profile data');
      return null;
    }
  };

  const handleRunDiagnostics = async () => {
    try {
      setLoading(true);
      setSuccessMessage('Running diagnostics...');
      setErrorMessage('');
      
      const results = await checkSocialLinksTable();
      console.log('Social links diagnostics results:', results);
      
      if (results.exists) {
        setSuccessMessage('Social links table exists and is configured correctly!');
      } else if (results.error) {
        setErrorMessage(`Social links table error: ${results.error.message || 'Unknown error'}`);
      } else {
        setErrorMessage('Social links table is not properly configured');
      }
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setErrorMessage(`Error running diagnostics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomBoxes = async (userId) => {
    try {
      const { data: boxes, error } = await supabase
        .from('custom_boxes')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');

      if (error) throw error;
      setCustomBoxes(boxes || []);
    } catch (error) {
      console.error('Error fetching custom boxes:', error);
      setErrorMessage('Failed to load custom boxes');
    }
  };

  const handleAddBox = async (e) => {
    e.preventDefault();
    
    try {
      if (customBoxes.length >= 2) {
        setBoxError('You can only add up to 2 custom boxes.');
        return;
      }

      setLoadingBoxInfo(true);
      setBoxError('');

      let boxData = {
        user_id: user.id,
        display_order: customBoxes.length,
        enabled: true
      };

      if (e.type === 'countdown') {
        // Handle countdown box
        boxData = {
          ...boxData,
          type: 'countdown',
          title: e.title,
          description: e.description,
          additional_data: e.additional_data
        };
      } else {
        // Handle other box types
        let fullUrl = '';
        if (selectedCardType === 'discord') {
          fullUrl = `https://discord.gg/${newBoxUrl}`;
        } else if (selectedCardType === 'github-repo' || selectedCardType === 'github-account') {
          fullUrl = `https://github.com/${newBoxUrl}`;
        } else if (selectedCardType === 'youtube') {
          fullUrl = `https://youtube.com/@${newBoxUrl}`;
        } else if (selectedCardType === 'spotify') {
          fullUrl = `https://open.spotify.com/track/${newBoxUrl}`;
        }

        // Get metadata for the URL
        const metadata = await fetchLinkMetadata(fullUrl);
        if (!metadata) throw new Error('Failed to fetch link metadata');

        boxData = {
          ...boxData,
          url: fullUrl,
          type: metadata.type,
          title: metadata.title,
          description: metadata.description,
          image_url: metadata.image_url,
          additional_data: metadata.additional_data,
          metadata: metadata.metadata,
          account_type: metadata.account_type
        };
      }

      const { data: box, error } = await supabase
        .from('custom_boxes')
        .insert([boxData])
        .select()
        .single();

      if (error) throw error;

      setCustomBoxes([...customBoxes, box]);
      setNewBoxUrl('');
      setSuccessMessage('Custom box added successfully!');
    } catch (error) {
      console.error('Error adding custom box:', error);
      setBoxError(error.message);
    } finally {
      setLoadingBoxInfo(false);
    }
  };

  const handleDeleteBox = async (boxId) => {
    try {
      const { error } = await supabase
        .from('custom_boxes')
        .delete()
        .eq('id', boxId);

      if (error) throw error;

      setCustomBoxes(customBoxes.filter(box => box.id !== boxId));
      setSuccessMessage('Custom box deleted successfully!');
    } catch (error) {
      console.error('Error deleting custom box:', error);
      setErrorMessage('Failed to delete custom box: ' + error.message);
    }
  };

  const handleToggleBox = async (boxId, enabled) => {
    try {
      const { error } = await supabase
        .from('custom_boxes')
        .update({ enabled })
        .eq('id', boxId);

      if (error) throw error;

      setCustomBoxes(customBoxes.map(box => 
        box.id === boxId ? { ...box, enabled } : box
      ));
    } catch (error) {
      console.error('Error updating custom box:', error);
      setErrorMessage('Failed to update custom box: ' + error.message);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(customBoxes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update display order for all affected items
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }));
    
    setCustomBoxes(updatedItems);
    
    // Update the database
    try {
      const { error } = await supabase
        .from('custom_boxes')
        .upsert(
          updatedItems.map(({ id, display_order }) => ({
            id,
            display_order,
            updated_at: new Date().toISOString()
          }))
        );
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating box order:', error);
      // Revert the state if the update fails
      setCustomBoxes(customBoxes);
    }
  };

  const handleSettingChange = async (setting, value) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update the profile state
      setProfile(prev => ({
        ...prev,
        [setting]: value
      }));

      // Create update object
      const updateData = {
        [setting]: value,
        updated_at: new Date().toISOString()
      };

      // Update the database
      const { error } = await supabase
        .from('profiles_new')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Clear profile cache after successful update
      await clearProfileCache(username);

      return { success: true };
    } catch (error) {
      console.error('Error updating setting:', error);
      setErrorMessage('Failed to update setting: ' + error.message);
      return { success: false, error };
    }
  };

  const debouncedSaveBio = useCallback((key, value) => {
    if (bioSaveTimeoutRef.current) {
      clearTimeout(bioSaveTimeoutRef.current);
    }

    bioSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await handleSettingChange(key, value);
        if (result.success) {
          setHasUnsavedChanges(false);
          // Update profile state to reflect the change
          setProfile(prev => ({
            ...prev,
            [key]: value
          }));
        }
      } catch (error) {
        console.error('Error saving bio:', error);
        setErrorMessage('Failed to save bio changes');
      }
    }, 3000);
  }, []);

  const handleBioChange = (e, field = 'bio') => {
    const value = e.target.value;
    setHasUnsavedChanges(true);

    // Update local state immediately
    switch (field) {
      case 'bio':
        setLocalBio(value);
        setProfile(prev => ({ ...prev, bio: value }));
        break;
      case 'bio_typewriter_text1':
        setLocalBioText1(value);
        setProfile(prev => ({ ...prev, bio_typewriter_text1: value }));
        break;
      case 'bio_typewriter_text2':
        setLocalBioText2(value);
        setProfile(prev => ({ ...prev, bio_typewriter_text2: value }));
        break;
      case 'bio_typewriter_text3':
        setLocalBioText3(value);
        setProfile(prev => ({ ...prev, bio_typewriter_text3: value }));
        break;
    }

    // Set up debounced save
    debouncedSaveBio(field, value);
  };

  // Add a new function to handle the "Admin" tab in the UI
  const handleStorageCleanup = async () => {
    try {
      setIsCleaningUp(true);
      setCleanupStatus('Starting storage cleanup...');
      
      const result = await cleanupUnusedFiles();
      
      if (result.error) {
        setCleanupStatus(`Error during cleanup: ${result.error.message}`);
        return;
      }
      
      const { stats } = result;
      setCleanupStatus(
        `Cleanup completed successfully!\n` +
        `Total files deleted: ${stats.totalDeleted}\n` +
        `Avatars deleted: ${stats.avatarsDeleted}\n` +
        `Backgrounds deleted: ${stats.backgroundsDeleted}\n` +
        `Errors encountered: ${stats.totalErrors}`
      );
    } catch (error) {
      setCleanupStatus(`Error during cleanup: ${error.message}`);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const renderAdminSection = () => {
    if (!isAdmin) return null;
    
    return (
      <div className="settings-section">
        <h2>Admin Tools</h2>
        
        <div className="settings-card">
          <h3>Badge Management</h3>
          <p>Use this tool to add or remove badges from users.</p>
          <BadgeManager userId={user?.id} isAdmin={isAdmin} />
        </div>

        <div className="settings-card">
          <h3>Storage Cleanup</h3>
          <p>Clean up unused files from storage (avatars and backgrounds not used in any profile or template).</p>
          <button 
            onClick={handleStorageCleanup}
            disabled={isCleaningUp}
            className="btn btn-danger"
            style={{ marginTop: '1rem' }}
          >
            {isCleaningUp ? 'Cleaning up...' : 'Clean Up Storage'}
          </button>
          {cleanupStatus && (
            <pre style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap'
            }}>
              {cleanupStatus}
            </pre>
          )}
        </div>
      </div>
    );
  };

  const handleColorPickerOpen = (pickerType, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setColorPickerPosition({
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX
    });
    setActiveColorPicker(pickerType);
  };

  const handleColorChange = (color, type) => {
    switch(type) {
      case 'accent':
        setAccentColor(color.hex);
        break;
      case 'background':
        setBackgroundColor(color.hex);
        break;
      case 'widget':
        setWidgetBgColor(color.hex);
        break;
      case 'icon':
        setIconColor(color.hex);
        break;
      case 'primaryText':
        setPrimaryTextColor(color.hex);
        break;
      case 'secondaryText':
        setSecondaryTextColor(color.hex);
        break;
      case 'tertiaryText':
        setTertiaryTextColor(color.hex);
        break;
      case 'usernameGlow':
        handleSettingChange('username_glow_color', color.hex);
        break;
      case 'iconGlow':
        setIconGlowColor(color.hex);
        handleSettingChange('icon_glow_color', color.hex);
        break;
    }
  };

  const renderColorPicker = () => {
    if (!activeColorPicker) return null;

    let currentColor;
    switch(activeColorPicker) {
      case 'accent':
        currentColor = accentColor;
        break;
      case 'background':
        currentColor = backgroundColor;
        break;
      case 'widget':
        currentColor = widgetBgColor;
        break;
      case 'icon':
        currentColor = iconColor;
        break;
      case 'primaryText':
        currentColor = primaryTextColor;
        break;
      case 'secondaryText':
        currentColor = secondaryTextColor;
        break;
      case 'tertiaryText':
        currentColor = tertiaryTextColor;
        break;
      case 'usernameGlow':
        currentColor = profile.username_glow_color || '#8b5cf6';
        break;
      case 'iconGlow':
        currentColor = iconGlowColor || '#8b5cf6';
        break;
      default:
        return null;
    }

    return (
      <div 
        className="color-picker-wrapper"
        style={{
          position: 'absolute',
          zIndex: 1000,
          top: colorPickerPosition.top,
          left: colorPickerPosition.left,
        }}
      >
        <div 
          className="color-picker-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
          onClick={() => setActiveColorPicker(null)}
        />
        <div style={{ position: 'relative' }}>
          <SketchPicker 
            color={currentColor}
            onChange={(color) => handleColorChange(color, activeColorPicker)}
            disableAlpha
            styles={{
              default: {
                picker: {
                  background: '#1f1f2c',
                  boxShadow: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                },
                body: {
                  padding: '10px'
                },
                input: {
                  background: 'rgba(0, 0, 0, 0.2)',
                  boxShadow: 'none',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                },
                label: {
                  color: 'rgba(255, 255, 255, 0.8)'
                },
                hash: {
                  color: 'rgba(255, 255, 255, 0.8)'
                },
                hexInput: {
                  color: 'white'
                },
                rgbInput: {
                  color: 'white'
                },
                swatch: {
                  boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)'
                },
                activeColor: {
                  boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)'
                }
              }
            }}
          />
        </div>
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (error) {
      setErrorMessage('Error logging out: ' + error.message);
    }
  };

  // Add mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (!isMobileView) return;
    
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector('.settings-sidebar');
      if (sidebar && !sidebar.contains(event.target) && 
          !event.target.classList.contains('hamburger-menu') &&
          sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileView, sidebarOpen]);

  const handleDeleteTemplate = async (templateId) => {
    try {
      setIsDeleting(true);
      setErrorMessage('');
      
      // Confirm deletion
      const confirmDelete = window.confirm('Are you sure you want to delete this template? This action cannot be undone.');
      if (!confirmDelete) {
        setIsDeleting(false);
        return;
      }
      
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        throw new Error('User not authenticated. Please log in again.');
      }
      
      // First, verify that the template belongs to the current user
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('creator_id')
        .eq('id', templateId)
        .single();
        
      if (templateError) {
        throw new Error(`Error fetching template: ${templateError.message}`);
      }
      
      if (!template || template.creator_id !== currentUser.id) {
        throw new Error('You can only delete your own templates');
      }
      
      // Delete the template
      const { error: deleteError } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);
        
      if (deleteError) {
        throw new Error(`Error deleting template: ${deleteError.message}`);
      }
      
      // Refresh templates lists
      fetchTemplates();
      fetchTemplates(true);
      
      setSuccessMessage('Template deleted successfully!');
    } catch (error) {
      console.error('Error deleting template:', error);
      setErrorMessage(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!profile) {
    return <div className="error">Error loading profile</div>;
  }

  return (
    <div className="settings-layout" style={{ fontFamily: 'Inter, sans-serif' }}>
      <style>
        {`
        .settings-layout {
          display: flex;
          min-height: 100vh;
          background: #121218;
          color: white;
          font-family: 'Inter', sans-serif !important;
        }
        
        .settings-sidebar {
          width: 220px;
          background: #1a1a24;
          padding: 20px;
          flex-shrink: 0;
          height: 100vh;
          position: sticky;
          top: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif !important;
          transition: transform 0.3s ease, opacity 0.3s ease;
          z-index: 100;
        }
        
        .sidebar-links {
          flex: 1;
          margin-bottom: 8px;  /* Reduced from default spacing */
        }
        
        .settings-content {
          flex: 1;
          padding: 40px 0;
          max-width: none;
          margin: 0;
          width: 100%;
          font-family: 'Inter', sans-serif !important;
        }
        
        .sidebar-link {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif !important;
          border: 1px solid #3a3b3f;
        }
        
        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-link.active {
          background: #8b5cf6;
          color: white;
          border: 1px solid #8b5cf6;
        }
        
        .settings-section {
          width: 100%;
          margin-bottom: 40px;
          font-family: 'Inter', sans-serif !important;
          box-sizing: border-box;
          padding: 0 20px;
          border-color:rgba(255, 255, 255, 0);
        }
        
        .settings-section h2 {
          font-size: 24px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 10px;
          font-family: 'Inter', sans-serif !important;
        }
        
        .form-group {
          margin-bottom: 20px;
          font-family: 'Inter', sans-serif !important;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-family: 'Inter', sans-serif !important;
        }
        
        .form-control {
          width: 100%;
          padding: 10px;
          background: #1f1f2c;
          border: 1px solid #333;
          border-radius: 4px;
          color: white;
          font-family: 'Inter', sans-serif !important;
        }

        /* Add select dropdown styling */
        select.form-control {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 40px;
        }

        select.form-control option {
          background-color: #1f1f2c;
          color: white;
          padding: 12px;
        }

        select.form-control option:hover {
                  background: rgb(139, 92, 246);
        }
        
        select.form-control option:focus,
        select.form-control option:active {
          background: rgb(139, 92, 246) !important;
        }
        
        select.form-control option:checked {
          background: rgb(139, 92, 246) !important;
          color: white;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif !important;
        }
        
        .btn-primary {
          background: #8b5cf6;
          color: white;
          border: none;
        }
        
        .btn-primary:hover {
          background: #7c4dff;
        }
        
        .btn-secondary {
          background: transparent;
          border: 1px solid #8b5cf6;
          color: #8b5cf6;
        }
        
        .btn-secondary:hover {
          background: rgba(139, 92, 246, 0.1);
        }
        
        .help-text {
          font-size: 14px;
          opacity: 0.7;
          margin-top: 4px;
          font-family: 'Inter', sans-serif !important;
        }
        
        .settings-card {
          background: #1f1f2c;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          font-family: 'Inter', sans-serif !important;
        }
        
        .save-button {
          width: 100%;
          padding: 12px;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 20px;
          font-weight: 600;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif !important;
        }
        
        .save-button:hover {
          background: #7c4dff;
        }
        
        .save-notification {
          position: fixed;
          bottom: 30px;
          right: 30px;
          background: rgba(34, 197, 94, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-left: 3px solid #22c55e;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 14px;
          color: white;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          animation: fadeInUp 0.3s, fadeOutDown 0.5s 3s forwards;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .save-notification:before {
          content: "✓";
          display: inline-block;
          color: #22c55e;
          font-weight: bold;
          font-size: 16px;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOutDown {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(20px); }
        }
        
        .view-profile-links {
          margin-top: 15px;
          text-align: center;
          font-size: 14px;
          font-family: 'Inter', sans-serif !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .site-link {
          color: #8b5cf6;
          text-decoration: none;
          font-family: 'Inter', sans-serif !important;
        }
        
        .view-page-link {
          color: white;
          text-decoration: none;
          background: rgba(255, 255, 255, 0.1);
          padding: 5px;
          border-radius: 4px;
          font-family: 'Inter', sans-serif !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          transition: background 0.2s;
        }
        
        .view-page-link:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        /* Add to ensure all inputs and other form elements use Inter */
        input, textarea, select, button {
          font-family: 'Inter', sans-serif !important;
        }
        
        /* Add to ensure all labels and text elements use Inter */
        label, p, span, h1, h2, h3, h4, h5, h6, a, div {
          font-family: 'Inter', sans-serif !important;
        }
        
        /* Template card hover effect */
        .template-card {
          transition: box-shadow 0.2s !important;
        }
        
        .template-card:hover {
          box-shadow: 0 15px 25px rgba(0, 0, 0, 0.25) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        
        /* Exception for the font showcase section */
        .font-showcase-item {
          font-family: inherit;
        }
        
        .color-preview-container {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          position: relative;
        }

        .color-preview {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .color-picker-popover {
          position: absolute;
          z-index: 100;
          top: calc(100% + 8px);
          left: 0;
        }

        .color-picker-cover {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
        }

        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 10; /* Increase z-index to ensure it's on top */
        }

        /* Mobile styles */
        .hamburger-menu {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 30px;
          height: 20px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 101;
        }

        .hamburger-menu span {
          display: block;
          height: 3px;
          width: 100%;
          background-color: white;
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .hamburger-menu.open span:nth-child(1) {
          transform: translateY(8.5px) rotate(45deg);
        }

        .hamburger-menu.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger-menu.open span:nth-child(3) {
          transform: translateY(-8.5px) rotate(-45deg);
        }

        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #1a1a24;
          z-index: 50;
          padding: 0 20px;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        /* Media queries for responsive design */
        @media (max-width: 768px) {
          .settings-layout {
            flex-direction: column;
          }
          
          .settings-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 80%;
            max-width: 300px;
            transform: translateX(-100%);
            opacity: 0;
            height: 100%;
            z-index: 100;
          }
          
          .settings-sidebar.open {
            transform: translateX(0);
            opacity: 1;
          }
          
          .settings-content {
            margin-top: 60px;
            padding: 20px 0;
          }
          
          .hamburger-menu {
            display: flex;
          }
          
          .mobile-header {
            display: flex;
          }

          .settings-section > div {
            flex-direction: column !important;
          }
          
          .settings-section > div > div {
            width: 100% !important;
          }

          .settings-grid {
            grid-template-columns: 1fr !important;
          }

          .template-card {
            width: 100% !important;
          }

          .color-preview-container {
            flex-wrap: wrap;
          }

          .integration-boxes {
            flex-direction: column !important;
          }

          .integration-box {
            width: 100% !important;
            margin-bottom: 10px;
          }
          
          .sidebar-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 99;
            display: none;
          }
          
          .sidebar-backdrop.visible {
            display: block;
          }
        }
        `}
      </style>

      {successMessage && <div className="save-notification">{successMessage}</div>}
      
      {/* Mobile Header */}
      <div className="mobile-header">
        <h2>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Settings</h2>
      </div>
      
      {/* Hamburger Menu */}
      <button 
        className={`hamburger-menu ${sidebarOpen ? 'open' : ''}`} 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      {/* Backdrop for mobile sidebar */}
      <div 
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>
      
      <div className={`settings-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-links">
          <div 
            className={`sidebar-link ${activeSection === 'appearance' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('appearance');
              isMobileView && setSidebarOpen(false);
            }}
          >
            Customise
          </div>
          <div 
            className={`sidebar-link ${activeSection === 'integrations' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('integrations');
              isMobileView && setSidebarOpen(false);
            }}
          >
            Links
          </div>
          <div 
            className={`sidebar-link ${activeSection === 'customization' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('customization');
              isMobileView && setSidebarOpen(false);
            }}
          >
            Cards
          </div>
          <div 
            className={`sidebar-link ${activeSection === 'templates' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('templates');
              isMobileView && setSidebarOpen(false);
            }}
          >
            Templates
          </div>
          {isAdmin && (
            <div 
              className={`sidebar-link ${activeSection === 'admin' ? 'active' : ''}`}
              onClick={() => {
                setActiveSection('admin');
                isMobileView && setSidebarOpen(false);
              }}
            >
              Admin
            </div>
          )}
          <div 
            className={`sidebar-link ${activeSection === 'account' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('account');
              isMobileView && setSidebarOpen(false);
            }}
          >
            Account
          </div>
        </div>
        
        <div className="sidebar-actions">
          <a 
            href="https://www.notion.so/reazn/Dajia-lol-Documentation-1ec0893d5194809d807cfcc0c8aed579?pvs=4" 
            className="sidebar-link help-link" 
            target="_blank"
            style={{
              position: 'relative',
              display: 'block',
              textDecoration: 'none',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '8px',  /* Added small margin to help link */
              background: 'rgba(255, 255, 255, 0.0)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <FaBook size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            Need help?
          </a>



          <a 
            href="https://discord.gg/dhNXtEabMZ" 
            className="sidebar-link discord-link" 
            target="_blank"
            style={{
              position: 'relative',
              display: 'block',
              textDecoration: 'none',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: 'px',
              background: 'rgba(255, 255, 255, 0.0)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              transition: 'all 0.2s'
            }}
          >
            <FaDiscord size={19} style= {{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}/>
             Discord Server
          </a>
          <div style={{ height: '1px', background: '#3a3b3f', margin: '20px 0 0px 0' }}></div>
          <button className="save-button" onClick={handleSubmit} style={{ marginBottom: '0px' }}>
            Save Changes
          </button>
          <div className="view-profile-links">
            <a href={`/${username}`} className="site-link" target="_blank">
              dajia.lol/{username}
            </a>
            <a href={`/${username}`} className="view-page-link" target="_blank">
              <FaLink />
            </a>
          </div>
        </div>
      </div>

      <div className="settings-content">
        {activeSection === 'appearance' && (
          <div className="settings-section">
            <div style={{ display: 'flex', gap: '24px' }}>
              {/* Left Side - Assets Uploader */}
              <div style={{ width: '50%' }}>
                <h2 className="settings-title">Assets Uploader</h2>
                
                {/* Background Section */}
                <div className="settings-card" style={{ marginBottom: '24px' }}>
                  <h4>Background</h4>
                  <div className="image-preview background">
                    {backgroundUrl || profile?.background_image ? (
                      <img 
                        src={backgroundUrl || profile.background_image} 
                        alt="Background preview" 
                        className="background-preview"
                      />
                    ) : (
                      <div className="upload-placeholder">Click to upload a file</div>
                    )}
                    <input
                      type="file"
                      accept="video/mp4,image/*"
                      onChange={handleBackgroundChange}
                      className="file-input"
                      style={{ zIndex: 10, cursor: 'pointer' }} /* Add inline style to ensure it works */
                    />
                    {(backgroundUrl || profile?.background_image) && (
                      <button 
                        className="remove-btn"
                        onClick={() => {
                          setBackgroundUrl(null);
                          setBackgroundFile(null);
                          setProfile(prev => ({...prev, background_image: null}));
                        }}
                      >
                        ×
                      </button>
                    )}
                    <div className="file-type">.MP4</div>
                  </div>
                </div>

                {/* Profile Avatar Section */}
                <div className="settings-card">
                  <h4>Profile Avatar</h4>
                  <div className="image-preview">
                    {avatarUrl || profile?.profile_image ? (
                      <img 
                        src={avatarUrl || profile.profile_image || DEFAULT_AVATAR} 
                        alt="Avatar preview" 
                        className="avatar-preview"
                      />
                    ) : (
                      <div className="upload-placeholder">Click to upload a file</div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="file-input"
                      style={{ zIndex: 10, cursor: 'pointer' }} /* Add inline style to ensure it works */
                    />
                    {(avatarUrl || profile?.profile_image) && (
                      <button 
                        className="remove-btn"
                        onClick={() => {
                          setAvatarUrl(null);
                          setAvatarFile(null);
                          setProfile(prev => ({...prev, profile_image: null}));
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                {/* Colors and Opacity Settings */}
                <div className="settings-card" style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    Colors & Opacity
                  </h3>
                  
                  {/* Opacity Settings */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px' }}>
                      {/* Color Pickers on the Left */}
                      <div style={{ flex: 1 }}>
                        {/* Background Color */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Background Color</label>
                          <div className="color-preview-container">
                            <div 
                              className="color-preview"
                              style={{ backgroundColor: backgroundColor }}
                              onClick={(e) => handleColorPickerOpen('background', e)}
                            ></div>
                            <span>{backgroundColor}</span>
                          </div>
                        </div>

                        {/* Content Background Color */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Content Background</label>
                          <div className="color-preview-container">
                            <div 
                              className="color-preview"
                              style={{ backgroundColor: widgetBgColor }}
                              onClick={(e) => handleColorPickerOpen('widget', e)}
                            ></div>
                            <span>{widgetBgColor}</span>
                          </div>
                        </div>

                        {/* Accent Color */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Accent Color</label>
                          <div className="color-preview-container">
                            <div 
                              className="color-preview"
                              style={{ backgroundColor: accentColor }}
                              onClick={(e) => handleColorPickerOpen('accent', e)}
                            ></div>
                            <span>{accentColor}</span>
                          </div>
                        </div>

                        {/* Icon Color */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Icon Color</label>
                          <div className="color-preview-container">
                            <div 
                              className="color-preview"
                              style={{ backgroundColor: iconColor }}
                              onClick={(e) => handleColorPickerOpen('icon', e)}
                            ></div>
                            <span>{iconColor}</span>
                          </div>
                        </div>

                        {/* Icon Glow Toggle */}
                        <div style={{ marginBottom: '16px' }}>
                          <SettingsSwitch
                            checked={iconGlowEnabled}
                            onChange={(e) => {
                              setIconGlowEnabled(e.target.checked);
                              handleSettingChange('icon_glow_enabled', e.target.checked);
                            }}
                            label="Icon Glow"
                            size="large"
                          />
                        </div>
                        
                        {/* Icon Glow Color Picker - only show when enabled */}
                        {iconGlowEnabled && (
                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Icon Glow Color</label>
                            <div className="color-preview-container">
                              <div 
                                className="color-preview"
                                style={{ backgroundColor: iconGlowColor }}
                                onClick={(e) => handleColorPickerOpen('iconGlow', e)}
                              ></div>
                              <span>{iconGlowColor}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Icon Glow Strength Slider - only show when enabled */}
                        {iconGlowEnabled && (
                          <div style={{ marginBottom: '16px' }}>
                            <SettingsSlider
                              label="Icon Glow Strength"
                              value={iconGlowStrength || 10}
                              onChange={(value) => {
                                const roundedValue = Math.round(value / 2) * 2;
                                setIconGlowStrength(roundedValue);
                              }}
                              min={2}
                              max={30}
                              step={2}
                              valueSuffix="px"
                              style={{ width: '140px' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Text Colors in the Middle */}
                      <div style={{ flex: 1 }}>
                        {/* Primary Text Color */}
                        <div style={{ marginBottom: '16px' }}>
                        <label>Text colors</label>
                          <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Primary Text</label>
                          <div className="color-preview-container">
                            <div 
                              className="color-preview"
                              style={{ backgroundColor: primaryTextColor }}
                              onClick={(e) => handleColorPickerOpen('primaryText', e)}
                            ></div>
                            <span>{primaryTextColor}</span>
                          </div>
                        </div>

                        {/* Secondary Text Color */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Secondary Text</label>
                          <div className="color-preview-container">
                            <div 
                              className="color-preview"
                              style={{ backgroundColor: secondaryTextColor }}
                              onClick={(e) => handleColorPickerOpen('secondaryText', e)}
                            ></div>
                            <span>{secondaryTextColor}</span>
                          </div>
                        </div>

                        {/* Tertiary Text Color */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ fontSize: '14px', marginBottom: '4px', display: 'block' }}>Tertiary Text</label>
                          <div className="color-preview-container">
                            <div 
                              className="color-preview"
                              style={{ backgroundColor: tertiaryTextColor }}
                              onClick={(e) => handleColorPickerOpen('tertiaryText', e)}
                            ></div>
                            <span>{tertiaryTextColor}</span>
                          </div>
                        </div>
                      </div>

                      {/* Opacity Sliders on the Right */}
                      <div style={{ width: '200px' }}>
                        <SettingsSlider
                          label="Background"
                          value={backgroundOpacity}
                          onChange={(value) => setBackgroundOpacity(value)}
                          min={0}
                          max={1}
                          step={0.01}
                          isPercentage={true}
                        />
                        <SettingsSlider
                          label="Content"
                          value={contentOpacity}
                          onChange={(value) => setContentOpacity(value)}
                          min={0}
                          max={1}
                          step={0.01}
                          isPercentage={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audio Settings */}
                <div className="settings-card" style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                    Audio Settings
                  </h3>
                  <AudioSettings />
                </div>
              </div>

              {/* Right Side - Bio Settings */}
              <div style={{ width: '50%' }}>
                <h2>Bio Settings</h2>
                <div className="settings-card">
                  {/* Display Name First */}
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                      Display Name Effects
                    </label>
                    <input
                      type="text"
                      value={profile.display_name || ''}
                      onChange={(e) => handleSettingChange('display_name', e.target.value)}
                      placeholder="Enter display name"
                      maxLength={255}
                      style={{ 
                        width: '100%',
                        padding: '10px',
                        fontSize: '14px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        marginBottom: '16px'
                      }}
                    />

                    {/* Username Effects Section */}
                    <div>
                      {/* Typewriter Effect */}
                      <div style={{ marginBottom: '16px' }}>
                        <SettingsSwitch
                          checked={profile.username_typewriter_enabled}
                          onChange={(e) => handleSettingChange('username_typewriter_enabled', e.target.checked)}
                          label="Typewriter Effect"
                          size="large"
                          style={{
                            fontSize: '16px',
                            fontWeight: '500'
                          }}
                        />
                        {profile.username_typewriter_enabled && (
                          <div style={{ marginTop: '12px', marginLeft: '16px' }}>
                            <SettingsSlider
                              label="Typewriter Speed"
                              value={profile.username_typewriter_speed || 100}
                              onChange={(value) => {
                                const roundedValue = Math.round(value / 5) * 5;
                                setProfile(prev => ({
                                  ...prev,
                                  username_typewriter_speed: roundedValue
                                }));
                              }}
                              min={50}
                              max={200}
                              step={5}
                              valueSuffix="ms"
                              style={{ width: '140px' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Glow Effect */}
                      <div style={{ marginBottom: '16px' }}>
                        <SettingsSwitch
                          checked={profile.username_glow_enabled}
                          onChange={(e) => handleSettingChange('username_glow_enabled', e.target.checked)}
                          label="Glow Effect"
                          size="large"
                          style={{
                            fontSize: '16px',
                            fontWeight: '500'
                          }}
                        />
                        {profile.username_glow_enabled && (
                          <div style={{ marginTop: '12px', marginLeft: '16px' }}>
                            <div style={{ marginBottom: '12px' }}>
                              <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Glow Color</label>
                              <div className="color-preview-container">
                                <div 
                                  className="color-preview"
                                  style={{ backgroundColor: profile.username_glow_color || '#8b5cf6' }}
                                  onClick={(e) => handleColorPickerOpen('usernameGlow', e)}
                                ></div>
                                <span>{profile.username_glow_color || '#8b5cf6'}</span>
                              </div>
                            </div>
                            <SettingsSlider
                              label="Glow Strength"
                              value={profile.username_glow_strength || 10}
                              onChange={(value) => {
                                const roundedValue = Math.round(value / 2) * 2;
                                setProfile(prev => ({
                                  ...prev,
                                  username_glow_strength: roundedValue
                                }));
                              }}
                              min={2}
                              max={30}
                              step={2}
                              valueSuffix="px"
                              style={{ width: '140px' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio Typewriter Toggle */}
                  <div style={{ marginBottom: '16px' }}>
                    <SettingsSwitch
                      checked={profile.bio_typewriter_enabled}
                      onChange={(e) => handleSettingChange('bio_typewriter_enabled', e.target.checked)}
                      label="Enable Bio Typewriter Effect"
                      size="large"
                      style={{
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    />
                  </div>

                  {/* Avatar Border Toggle */}
                  <div style={{ marginBottom: '16px' }}>
                    <SettingsSwitch
                      checked={avatarBorderEnabled}
                      onChange={(e) => {
                        setAvatarBorderEnabled(e.target.checked);
                        handleSettingChange('avatar_border_enabled', e.target.checked);
                      }}
                      label="Avatar Border"
                      size="large"
                      style={{
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    />
                  </div>

                  {profile.bio_typewriter_enabled ? (
                    <>
                      <div style={{ marginBottom: '16px' }}>
                        <select
                          value={profile.bio_typewriter_mode || 'simple'}
                          onChange={(e) => handleSettingChange('bio_typewriter_mode', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: '#1a1a24',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            paddingRight: '40px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="simple" style={{ background: '#1a1a24', color: 'white', padding: '8px' }}>Simple</option>
                          <option value="alternating" style={{ background: '#1a1a24', color: 'white', padding: '8px' }}>Alternating</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <SettingsSlider
                          label="Typewriter Speed"
                          value={profile.bio_typewriter_speed || 100}
                          onChange={(value) => {
                            setProfile(prev => ({
                              ...prev,
                              bio_typewriter_speed: value
                            }));
                          }}
                          min={50}
                          max={300}
                          step={1}
                          valueSuffix="ms"
                          style={{ width: '200px' }}
                        />
                      </div>

                      {profile.bio_typewriter_mode === 'simple' ? (
                        <div className="form-group">
                          <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Bio Text</label>
                          <textarea
                            value={localBio}
                            onChange={(e) => handleBioChange(e, 'bio')}
                            placeholder="Enter your bio"
                            maxLength={200}
                            style={{ 
                              width: '100%',
                              minHeight: '100px',
                              padding: '10px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '8px',
                              color: 'white',
                              fontSize: '14px'
                            }}
                          />
                          <div className="character-count">
                            {localBio.length}/200
                          </div>
                        </div>
                      ) : (
                        <div className="alternating-texts">
                          {[1, 2, 3].map((num) => (
                            <div className="form-group" key={num} style={{ marginBottom: '16px' }}>
                              <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
                                Text {num}{num === 3 ? ' (optional)' : ''}
                              </label>
                              <input
                                type="text"
                                value={num === 1 ? localBioText1 : num === 2 ? localBioText2 : localBioText3}
                                onChange={(e) => handleBioChange(e, `bio_typewriter_text${num}`)}
                                maxLength={50}
                                placeholder={`Enter text ${num}`}
                                style={{
                                  width: '100%',
                                  padding: '10px',
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  borderRadius: '8px',
                                  color: 'white',
                                  fontSize: '14px'
                                }}
                              />
                              <div style={{
                                fontSize: '12px',
                                color: (num === 1 ? localBioText1.length : num === 2 ? localBioText2.length : localBioText3.length) > 45 ? '#ed4245' : '#72767d',
                                textAlign: 'right',
                                marginTop: '4px'
                              }}>
                                {(num === 1 ? localBioText1.length : num === 2 ? localBioText2.length : localBioText3.length)}/50
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="form-group">
                      <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Bio Text</label>
                      <textarea
                        value={localBio}
                        onChange={(e) => handleBioChange(e, 'bio')}
                        placeholder="Enter your bio"
                        maxLength={200}
                        style={{ 
                          width: '100%',
                          minHeight: '100px',
                          padding: '10px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px'
                        }}
                      />
                      <div className="character-count">
                        {localBio.length}/200
                      </div>
                    </div>
                  )}
                </div>

                {/* Font Settings */}
                <div style={{ marginTop: '24px' }}>
                  <div className="settings-card">
                    <h4>Font Selection</h4>
                    <FontSettings
                      selectedFont={fontFamily}
                      onFontChange={(font) => setFontFamily(font)}
                      compact={true}
                    />
                  </div>
                </div>

                {/* Custom Cursor Settings */}
                <div style={{ marginTop: '24px' }}>
                  <div className="settings-card">
                    <h4>Custom Cursor</h4>
                    <CursorSettings compact={true} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'integrations' && (
          <div className="settings-section">
            <h2>Links</h2>
            
            <div className="settings-card">
              <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                Service Connections
              </h3>
              
              <div className="integration-boxes">
                <div className="integration-box">
                  <div className="integration-box-icon">
                    <FaLastfm size={28} color={accentColor} />
                  </div>
                  <div className="integration-box-content">
                    <h4>LastFM Account</h4>
                    {profile?.lastfm_username ? (
                      <>
                        <p className="integration-username">{profile.lastfm_username}</p>
                        <button 
                          className="integration-disconnect-btn"
                          onClick={handleLastFMDisconnect}
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button 
                        className="integration-connect-btn"
                        onClick={handleLastFMConnect}
                      >
                        Connect with LastFM
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="integration-box">
                  <div className="integration-box-icon">
                    <FaDiscord size={28} color={accentColor} />
                  </div>
                  <div className="integration-box-content">
                    <h4>Discord Account</h4>
                    {profile?.discord_connected ? (
                      <>
                        <p className="integration-username">{profile.discord_username}</p>
                        <button 
                          className="integration-disconnect-btn"
                          onClick={handleDiscordDisconnect}
                          disabled={disconnectingDiscord}
                        >
                          {disconnectingDiscord ? 'Disconnecting...' : 'Disconnect'}
                        </button>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'rgba(255,255,255,0.6)', 
                          marginTop: '8px',
                          fontStyle: 'italic'
                        }}>
                          Note: You must join our <a href="https://discord.gg/dhNXtEabMZ" target="_blank" style={{ color: accentColor, textDecoration: 'underline' }}>Discord server</a> for your presence to be shown.
                        </p>
                      </>
                    ) : (
                      <>
                        <button 
                          className="integration-connect-btn"
                          onClick={handleDiscordConnect}
                        >
                          Connect with Discord
                        </button>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'rgba(255,255,255,0.6)', 
                          marginTop: '8px',
                          fontStyle: 'italic'
                        }}>
                          Note: You must join our <a href="https://discord.gg/dhNXtEabMZ" target="_blank" style={{ color: accentColor, textDecoration: 'underline' }}>Discord server</a> for your presence to be shown.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                Social Links
              </h3>
              <SocialMediaSettings 
                initialLinks={socialLinks} 
                onSave={handleSocialLinksUpdate} 
                color={accentColor}
                iconColor={iconColor}
                lastfmUsername={profile?.lastfm_username || ''}
                discordUsername={profile?.discord_username || ''}
                customIcons={customIcons}
              />
            </div>
          </div>
        )}

        {activeSection === 'customization' && (
          <div className="space-y-6">
            <div className="settings-card">
              <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                Add Custom Card
              </h3>
              <p className="help-text">
                Add custom boxes to showcase your Discord server, GitHub repositories, YouTube channel, Spotify tracks, or other links on your profile.
              </p>
              
              <div className="boxes-counter" style={{
                marginBottom: '16px',
                fontSize: '14px',
                color: customBoxes.length >= 2 ? '#ef4444' : '#9ca3af'
              }}>
                {customBoxes.length}/2 boxes used
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end',  // Right align the button
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setShowCardTypeSelector(true)}
                  className="btn btn-primary"
                  disabled={customBoxes.length >= 2}
                  style={{ 
                    padding: '10px 16px',
                    background: 'rgba(139, 92, 246, 1.0)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: customBoxes.length >= 2 ? 'not-allowed' : 'pointer',
                    opacity: customBoxes.length >= 2 ? '0.7' : '1',
                    width: 'auto',  // Allow button to size to content
                    minWidth: '150px'  // Set a minimum width
                  }}
                >
                  New Custom Card
                </button>
              </div>

              {showCardTypeSelector && (
                <div style={{ marginBottom: '20px' }}>
                  <select
                    value={selectedCardType}
                    onChange={(e) => {
                      setSelectedCardType(e.target.value);
                      setNewBoxUrl(''); // Reset the URL when changing type
                    }}
                    className="form-control"
                    style={{ 
                      marginBottom: '10px',
                      '& option:hover': {
                        backgroundColor: 'rgb(139, 92, 246)'
                      }
                    }}
                  >
                    <option value="">Select card type...</option>
                    <option value="discord">Discord Server</option>
                    <option value="github-repo">GitHub Repository</option>
                    <option value="github-account">GitHub Account</option>
                    <option value="youtube">YouTube Channel</option>
                    <option value="spotify">Spotify Track</option>
                    <option value="countdown">Countdown</option>
                  </select>

                  {selectedCardType === 'countdown' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        color: 'var(--primary-text-color)',
                        marginBottom: '5px'
                      }}>
                        <FaClock size={20} />
                        <span>Countdown</span>
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        value={newBoxUrl}
                        onChange={(e) => setNewBoxUrl(e.target.value)}
                        placeholder="Event title"
                      />
                      <input
                        type="datetime-local"
                        className="form-control"
                        onChange={(e) => {
                          const date = new Date(e.target.value);
                          setCountdownDate(date.toISOString());
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={countdownDescription}
                        onChange={(e) => setCountdownDescription(e.target.value)}
                        placeholder="Description (optional)"
                      />
                      <button
                        onClick={() => {
                          handleAddBox({
                            preventDefault: () => {},
                            type: 'countdown',
                            title: newBoxUrl,
                            description: countdownDescription,
                            additional_data: {
                              target_date: countdownDate
                            }
                          });
                          setShowCardTypeSelector(false);
                          setSelectedCardType('');
                          setNewBoxUrl('');
                          setCountdownDescription('');
                          setCountdownDate(null);
                        }}
                        className="btn btn-primary"
                        disabled={!newBoxUrl || !countdownDate}
                        style={{ 
                          padding: '10px 16px',
                          background: 'rgb(139, 92, 246)',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: !newBoxUrl || !countdownDate ? 'not-allowed' : 'pointer',
                          opacity: !newBoxUrl || !countdownDate ? '0.7' : '1'
                        }}
                      >
                        Add Countdown
                      </button>
                    </div>
                  ) : selectedCardType ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: '0 0 auto' }}>
                        {selectedCardType === 'discord' && 'discord.gg/'}
                        {selectedCardType === 'github-repo' && 'github.com/'}
                        {selectedCardType === 'github-account' && 'github.com/'}
                        {selectedCardType === 'youtube' && 'youtube.com/@'}
                        {selectedCardType === 'spotify' && 'open.spotify.com/track/'}
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        value={newBoxUrl}
                        onChange={(e) => {
                          const input = e.target.value;
                          const cleanInput = input
                            .replace(/^https?:\/\//i, '')
                            .replace(/^(discord\.gg\/|github\.com\/|youtube\.com\/@|open\.spotify\.com\/track\/)/i, '');
                          setNewBoxUrl(cleanInput);
                        }}
                        placeholder={
                          selectedCardType === 'discord' ? 'Invite code' :
                          selectedCardType === 'github-repo' ? 'username/repository' :
                          selectedCardType === 'github-account' ? 'username' :
                          selectedCardType === 'youtube' ? 'channel-name' :
                          selectedCardType === 'spotify' ? 'track-id' :
                          'Enter identifier'
                        }
                        style={{ flex: '1' }}
                      />
                      <button
                        onClick={() => {
                          handleAddBox({ preventDefault: () => {} });
                          setShowCardTypeSelector(false);
                          setSelectedCardType('');
                          setNewBoxUrl('');
                        }}
                        className="btn btn-primary"
                        disabled={!newBoxUrl}
                        style={{ 
                          padding: '10px 16px',
                          background: 'rgb(139, 92, 246)',
                          border: 'none',
                          borderRadius: '4px',
                          color: 'white',
                          cursor: !newBoxUrl ? 'not-allowed' : 'pointer',
                          opacity: !newBoxUrl ? '0.7' : '1',
                          width: 'auto',
                          minWidth: '150px'
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {boxError && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '14px' }}>{boxError}</p>}
            </div>
            
            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>
                Manage Custom Cards
              </h3>
              
              <div className="custom-boxes-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {customBoxes.length === 0 ? (
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: '8px',
                    color: '#9ca3af'
                  }}>
                    No custom cards added yet
                  </div>
                ) : (
                  customBoxes.map((box) => (
                    <div
                      key={box.id}
                      style={{
                        padding: '16px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        color: iconColor
                      }}>
                        {box.type === 'discord' && <FaDiscord size={20} />}
                        {box.type === 'github' && <FaGithub size={20} />}
                        {box.type === 'youtube' && <FaYoutube size={20} />}
                        {box.type === 'spotify' && <FaSpotify size={20} />}
                        {box.type === 'steam' && <FaSteam size={20} />}
                        {box.type === 'countdown' && <FaClock size={20} />}
                        {box.type === 'other' && <FaLink size={20} />}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{box.title}</div>
                        {box.type === 'countdown' ? (
                          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                            Ends on: {new Date(box.additional_data?.target_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <div style={{ fontSize: '14px', color: '#9ca3af', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{box.url}</div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={box.enabled}
                            onChange={(e) => handleToggleBox(box.id, e.target.checked)}
                          />
                          <span className="slider round"></span>
                        </label>
                        
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={() => handleDeleteBox(box.id)}
                          title="Delete box"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'templates' && (
          <div className="settings-section">
                <h2 className="text-2xl font-bold" style={{ marginBottom: '24px' }}>Templates</h2>
    
    {/* Template tabs and create button */}
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      marginBottom: '24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      paddingBottom: '12px',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => setActiveTemplateTab('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: activeTemplateTab === 'all' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
            color: activeTemplateTab === 'all' ? 'white' : 'rgba(255, 255, 255, 0.7)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTemplateTab === 'all' ? '600' : '400',
            transition: 'all 0.2s',
            width: '130px'
          }}
        >
          All Templates
        </button>
        <button 
          onClick={() => setActiveTemplateTab('my')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            background: activeTemplateTab === 'my' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)',
            color: activeTemplateTab === 'my' ? 'white' : 'rgba(255, 255, 255, 0.7)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTemplateTab === 'my' ? '600' : '400',
            transition: 'all 0.2s',
            width: '130px'
          }}
        >
          My Templates
        </button>
      </div>
              <button
                onClick={() => setShowCreateTemplate(true)}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          background: '#8b5cf6',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'all 0.2s',
          width: '130px'
        }}
              >
                Create Template
              </button>
            </div>

            <div className="settings-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))',
              gap: 30,
              justifyContent: 'center',
              alignItems: 'stretch',
              marginBottom: 40,
              width: '100%',
              maxWidth: '1280px',
              margin: '0 auto',
              padding: 0
            }}>
              {activeTemplateTab === 'all' ? (
                templates.length > 0 ? templates.map((template) => (
                <div key={template.id} className="settings-card template-card" style={{ 
                  position: 'relative', 
                  overflow: 'hidden', 
                  minHeight: 480, 
                  height: 480, 
                  width: '100%',
                  margin: '0', 
                  padding: 0,
                  display: 'flex', 
                  flexDirection: 'column',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                  transition: 'box-shadow 0.2s',
                  borderRadius: '12px',
                  background: '#1f1f2c'
                }}>
                    {/* Template preview and content - same as before */}
                  <div style={{ 
                    position: 'relative', 
                    height: 300, 
                    width: '100%',
                    background: 'rgb(24, 24, 37)', 
                    overflow: 'hidden',
                    margin: 0,
                    padding: 0,
                    borderRadius: '12px 12px 0 0'
                  }}>
                    <div className="w-full h-full overflow-hidden" style={{ 
                      position: 'relative', 
                      width: '100%',
                      height: '100%', 
                      margin: 0,
                      padding: 0
                    }}>
                        <div 
                          className="w-full h-full"
                          style={{
                            transform: 'scale(0.225)',
                            transformOrigin: 'top center',
                            width: '1920px',
                            height: '1080px',
                            position: 'absolute',
                            left: '50%',
                            marginLeft: '-960px'
                          }}
                        >
                          <PublicProfile
                            profile={{
                              username: profile?.username || 'example',
                              display_name: profile?.display_name || 'Example',
                              bio: 'This is how your bio will look',
                              bio_typewriter_enabled: profile?.bio_typewriter_enabled,
                              bio_typewriter_mode: profile?.bio_typewriter_mode,
                              bio_typewriter_text1: 'First alternating text',
                              bio_typewriter_text2: 'Second alternating text',
                              bio_typewriter_text3: 'Third alternating text',
                              bio_typewriter_speed: profile?.bio_typewriter_speed,
                              username_typewriter_enabled: profile?.username_typewriter_enabled,
                              username_typewriter_mode: profile?.username_typewriter_mode,
                              username_typewriter_speed: profile?.username_typewriter_speed,
                              social_links: profile?.social_links || {},
                              custom_boxes: customBoxes || [],
                              accent_color: template.accent_color,
                              bg_color: template.bg_color,
                              widget_bg_color: template.widget_bg_color,
                              bg_opacity: template.bg_opacity,
                              content_opacity: template.content_opacity,
                              icon_color: template.icon_color,
                              primary_text_color: template.primary_text_color,
                              secondary_text_color: template.secondary_text_color,
                              tertiary_text_color: template.tertiary_text_color,
                              font_family: template.font_family,
                              icon_glow_enabled: template.icon_glow_enabled,
                              icon_glow_color: template.icon_glow_color,
                              icon_glow_strength: template.icon_glow_strength,
                              avatar_border_enabled: template.avatar_border_enabled,
                              profile_image: template.profile_image || DEFAULT_AVATAR,
                              background_image: template.background_image || null,
                              presence_border_radius: 12,
                              discord_presence: profile?.discord_presence,
                              lastfm_username: profile?.lastfm_username,
                              spotify_presence: profile?.spotify_presence,
                            }}
                            recentTracks={recentTracks || []}
                            topArtists={topArtists || []}
                            isPreview={true}
                          />
                        </div>
                    </div>
                  </div>
                  <div style={{ 
                    padding: '0 16px 10px 16px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flex: 1,
                    background: 'transparent'
                  }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 16 }}>
                      <img
                        src={template.profile_image || DEFAULT_AVATAR}
                        alt={template.creator?.username}
                        style={{ width: 36, height: 36, borderRadius: '50%', background: '#232336', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 16, color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</div>
                        <div style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 400, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{template.creator?.username}</div>
                      </div>
                    </div>
                    <div style={{ color: '#bdbdbd', fontSize: 13, marginBottom: 12, minHeight: 24, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{template.description}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bdbdbd', fontSize: 13 }}>
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-14a6 6 0 110 12A6 6 0 0110 4zm0 2a4 4 0 100 8 4 4 0 000-8z"/></svg>
                        {template.uses_count || 0} uses
                      </div>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'nowrap', 
                      gap: 6, 
                      marginBottom: 16, 
                      overflowX: 'hidden',
                      whiteSpace: 'nowrap'
                    }}>
                      {(template.tags || []).slice(0, 3).map((tag, idx) => (
                        <span key={idx} style={{ 
                          background: '#232336', 
                          color: '#bdbdbd', 
                          borderRadius: 14, 
                          padding: '5px 12px', 
                          fontSize: 12, 
                          fontWeight: 500,
                          display: 'inline-block'
                        }}>{tag.length > 12 ? tag.substring(0, 12) : tag}</span>
                      ))}
                    </div>
                    
                    {/* Push actions to bottom of card */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      marginTop: 'auto',
                      paddingTop: 10,
                      paddingBottom: 10,
                      borderTop: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          onClick={() => handleUseTemplate(template)}
                          className="btn btn-primary"
                          style={{ flex: 1, fontSize: 14, padding: '8px 0', transition: 'background-color 0.2s' }}
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                )) : (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    textAlign: 'center',
                    padding: '40px 0',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    No templates found
                  </div>
                )
              ) : (
                userTemplates.length > 0 ? userTemplates.map((template) => (
                  <div key={template.id} className="settings-card template-card" style={{ 
                    position: 'relative', 
                    overflow: 'hidden', 
                    minHeight: 480, 
                    height: 480, 
                    width: '100%',
                    margin: '0', 
                    padding: 0,
                    display: 'flex', 
                    flexDirection: 'column',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                    transition: 'box-shadow 0.2s',
                    borderRadius: '12px',
                    background: '#1f1f2c'
                  }}>
                    {/* Template preview and content - same as before */}
                    <div style={{ 
                      position: 'relative', 
                      height: 300, 
                      width: '100%',
                      background: 'rgb(24, 24, 37)', 
                      overflow: 'hidden',
                      margin: 0,
                      padding: 0,
                      borderRadius: '12px 12px 0 0'
                    }}>
                      <div className="w-full h-full overflow-hidden" style={{ 
                        position: 'relative', 
                        width: '100%',
                        height: '100%', 
                        margin: 0,
                        padding: 0
                      }}>
                          <div 
                            className="w-full h-full"
                            style={{
                              transform: 'scale(0.225)',
                              transformOrigin: 'top center',
                              width: '1920px',
                              height: '1080px',
                              position: 'absolute',
                              left: '50%',
                              marginLeft: '-960px'
                            }}
                          >
                            <PublicProfile
                              profile={{
                                username: profile?.username || 'example',
                                display_name: profile?.display_name || 'Example',
                                bio: 'This is how your bio will look',
                                bio_typewriter_enabled: profile?.bio_typewriter_enabled,
                                bio_typewriter_mode: profile?.bio_typewriter_mode,
                                bio_typewriter_text1: 'First alternating text',
                                bio_typewriter_text2: 'Second alternating text',
                                bio_typewriter_text3: 'Third alternating text',
                                bio_typewriter_speed: profile?.bio_typewriter_speed,
                                username_typewriter_enabled: profile?.username_typewriter_enabled,
                                username_typewriter_mode: profile?.username_typewriter_mode,
                                username_typewriter_speed: profile?.username_typewriter_speed,
                                social_links: profile?.social_links || {},
                                custom_boxes: customBoxes || [],
                                accent_color: template.accent_color,
                                bg_color: template.bg_color,
                                widget_bg_color: template.widget_bg_color,
                                bg_opacity: template.bg_opacity,
                                content_opacity: template.content_opacity,
                                icon_color: template.icon_color,
                                primary_text_color: template.primary_text_color,
                                secondary_text_color: template.secondary_text_color,
                                tertiary_text_color: template.tertiary_text_color,
                                font_family: template.font_family,
                                icon_glow_enabled: template.icon_glow_enabled,
                                icon_glow_color: template.icon_glow_color,
                                icon_glow_strength: template.icon_glow_strength,
                                avatar_border_enabled: template.avatar_border_enabled,
                                profile_image: template.profile_image || DEFAULT_AVATAR,
                                background_image: template.background_image || null,
                                presence_border_radius: 12,
                                discord_presence: profile?.discord_presence,
                                lastfm_username: profile?.lastfm_username,
                                spotify_presence: profile?.spotify_presence,
                              }}
                              recentTracks={recentTracks || []}
                              topArtists={topArtists || []}
                              isPreview={true}
                            />
                          </div>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '0 16px 10px 16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      flex: 1,
                      background: 'transparent'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 16 }}>
                        <img
                          src={template.profile_image || DEFAULT_AVATAR}
                          alt={template.creator?.username}
                          style={{ width: 36, height: 36, borderRadius: '50%', background: '#232336', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{template.name}</div>
                          <div style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 400, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{template.creator?.username}</div>
                        </div>
                      </div>
                      <div style={{ color: '#bdbdbd', fontSize: 13, marginBottom: 12, minHeight: 24, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{template.description}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bdbdbd', fontSize: 13 }}>
                          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-14a6 6 0 110 12A6 6 0 0110 4zm0 2a4 4 0 100 8 4 4 0 000-8z"/></svg>
                          {template.uses_count || 0} uses
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'nowrap', 
                        gap: 6, 
                        marginBottom: 16, 
                        overflowX: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>
                        {(template.tags || []).slice(0, 3).map((tag, idx) => (
                          <span key={idx} style={{ 
                            background: '#232336', 
                            color: '#bdbdbd', 
                            borderRadius: 14, 
                            padding: '5px 12px', 
                            fontSize: 12, 
                            fontWeight: 500,
                            display: 'inline-block'
                          }}>{tag.length > 12 ? tag.substring(0, 12) : tag}</span>
                        ))}
                      </div>
                      
                      {/* Push actions to bottom of card */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        marginTop: 'auto',
                        paddingTop: 10,
                        paddingBottom: 10,
                        borderTop: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button
                            onClick={() => handleUseTemplate(template)}
                            className="btn btn-primary"
                            style={{ 
                              width: '100%', 
                              fontSize: 14, 
                              padding: '8px 0', 
                              transition: 'background-color 0.2s',
                              background: '#8b5cf6'
                            }}
                          >
                            Use Template
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="btn btn-danger"
                            disabled={isDeleting}
                            style={{ 
                              width: '100%', 
                              fontSize: 14, 
                              padding: '8px 0', 
                              transition: 'background-color 0.2s',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              cursor: isDeleting ? 'not-allowed' : 'pointer',
                              opacity: isDeleting ? 0.7 : 1,
                              marginTop: '4px'
                            }}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete Template'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ 
                    gridColumn: '1 / -1', 
                    textAlign: 'center',
                    padding: '40px 0',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    You haven't created any templates yet
                  </div>
                )
              )}
            </div>

            {showCreateTemplate && (
              <TemplateModal onClose={() => {
                setShowCreateTemplate(false);
                setTemplateName('');
                setTemplateDescription('');
                setTemplateTags([]);
                setTemplatePreviewImage(null);
                setTemplatePreviewFile(null);
                setPreviewImageUrl('');
                setProcessedTags([]);
                setErrorMessage('');
              }} />
            )}
          </div>
        )}

        {activeSection === 'admin' && isAdmin && renderAdminSection()}

        {activeSection === 'account' && (
          <div className="settings-section">
            <h2>Account Settings</h2>
            {accountSuccessMessage && <div className="success-message">{accountSuccessMessage}</div>}
            {errorMessage && <div className="error-message">{errorMessage}</div>}

            <div style={{ display: 'flex', gap: '24px' }}>
              {/* Left Column - Account Information */}
              <div style={{ width: '40%' }}>
                <div className="settings-card">
                  <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>Account Information</h3>
                  
                  {/* Profile Picture and Username */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    marginBottom: '24px',
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '12px'
                  }}>
                    <img 
                      src={profile?.profile_image || DEFAULT_AVATAR} 
                      alt="Profile" 
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                    <div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: 'var(--primary-text-color)'
                      }}>
                        {profile?.username || 'Username'}
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: 'var(--secondary-text-color)'
                      }}>
                        {user?.email}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--secondary-text-color)' }}>Account #</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--primary-text-color)' }}>{profile?.new_id || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--secondary-text-color)' }}>Created</span>
                      <span style={{ color: 'var(--primary-text-color)' }}>{new Date(user?.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--secondary-text-color)' }}>Last Sign In</span>
                      <span style={{ color: 'var(--primary-text-color)' }}>{new Date(user?.last_sign_in_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--secondary-text-color)' }}>Discord</span>
                      <span style={{ 
                        color: 'var(--primary-text-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <FaDiscord style={{ color: '#5865F2' }} />
                        {profile?.discord_username || 'Not Connected'}
                      </span>
                    </div>
                  </div>

                  {/* Add Logout Button */}
                  <button 
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginTop: '16px'
                    }}
                    onMouseOver={(e) => e.target.style.opacity = '0.8'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {/* Right Column - Account Management */}
              <div style={{ width: '60%' }}>
                <div className="settings-card" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>Change Credentials</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                      onClick={() => {
                        const newPassword = prompt('Enter new password:');
                        if (newPassword) {
                          if (newPassword.length < 6) {
                            setErrorMessage('Password must be at least 6 characters long');
                            return;
                          }
                          
                          supabase.auth.updateUser({
                            password: newPassword
                          }).then(({ data, error }) => {
                            if (error) {
                              setErrorMessage('Error updating password: ' + error.message);
                            } else {
                              setAccountSuccessMessage('Password updated successfully');
                            }
                          });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgb(139, 92, 246)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.opacity = '0.8'}
                      onMouseOut={(e) => e.target.style.opacity = '1'}
                    >
                      Password
                    </button>
                    <button 
                      onClick={() => {
                        const newEmail = prompt('Enter new email address:');
                        if (newEmail) {
                          if (!newEmail.includes('@')) {
                            setErrorMessage('Please enter a valid email address');
                            return;
                          }
                          
                          supabase.auth.updateUser({
                            email: newEmail
                          }).then(({ data, error }) => {
                            if (error) {
                              setErrorMessage('Error updating email: ' + error.message);
                            } else {
                              setAccountSuccessMessage('Email update initiated. Please check your new email for confirmation.');
                            }
                          });
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgb(139, 92, 246)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.opacity = '0.8'}
                      onMouseOut={(e) => e.target.style.opacity = '1'}
                    >
                      Email
                    </button>
                  </div>
                </div>

                <div className="settings-card danger-zone">
                  <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px', color: '#ef4444' }}>Delete Account</h3>
                  <p style={{ fontSize: '14px', color: 'var(--secondary-text-color)', marginBottom: '16px' }}>
                    Warning: This action is irreversible. All your data will be permanently deleted.
                  </p>
                  <button 
                    onClick={async () => {
                      // First confirmation
                      const firstConfirm = window.confirm(
                        'Are you sure you want to delete your account? This action cannot be undone.'
                      );
                      
                      if (firstConfirm) {
                        // Second confirmation with typing "DELETE"
                        const confirmText = prompt(
                          'To confirm account deletion, please type "DELETE" in all caps:'
                        );
                        
                        if (confirmText === 'DELETE') {
                          try {
                            // Final confirmation
                            const finalConfirm = window.confirm(
                              'This is your final warning. Your account will be permanently deleted. Are you absolutely sure?'
                            );
                            
                            if (finalConfirm) {
                              // Delete the profile first (this will cascade to related tables)
                              const { error: profileError } = await supabase
                                .from('profiles_new')
                                .delete()
                                .eq('id', user.id);
                              
                              if (profileError) throw profileError;

                              // Sign out the user
                              await supabase.auth.signOut();
                              
                              // Redirect to home page
                              navigate('/');
                            }
                          } catch (error) {
                            setErrorMessage('Error deleting account: ' + error.message);
                          }
                        } else if (confirmText !== null) {
                          setErrorMessage('Incorrect confirmation text. Account deletion cancelled.');
                        }
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      borderRadius: '8px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#ef4444';
                      e.target.style.color = 'white';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.target.style.color = '#ef4444';
                    }}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {renderColorPicker()}
      <style jsx global>{`
        .settings-card .relative,
        .settings-section .relative,
        .fixed.inset-0 .relative {
          pointer-events: none !important;
        }
        
        /* Keep profile container at original size but clip content */
        .settings-card .profile-container,
        .settings-section .profile-container,
        .fixed.inset-0 .profile-container {
          position: relative !important;
          overflow: visible !important; 
          contain: paint !important;
        }
        
        /* Fix for background spill in preview */
        .settings-card .profile-container .background-container,
        .settings-section .profile-container .background-container,
        .fixed.inset-0 .profile-container .background-container {
          width: 100% !important;
          height: 100% !important;
          left: 0 !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          position: absolute !important;
          overflow: hidden !important;
          border-radius: 8px !important;
          contain: paint !important;
        }

        /* Ensure background image and video stay contained */
        .settings-card .profile-container .background-image,
        .settings-section .profile-container .background-image,
        .fixed.inset-0 .profile-container .background-image,
        .settings-card .profile-container .background-video,
        .settings-section .profile-container .background-video,
        .fixed.inset-0 .profile-container .background-video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        /* Add body lock when mobile sidebar is open */
        body.sidebar-open {
          overflow: hidden;
        }
      `}</style>
      {/* Add global styles to handle the rc-editable-input labels */}
      <style jsx global>{`
        .settings-card .relative,
        .settings-section .relative,
        .fixed.inset-0 .relative {
          pointer-events: none !important;
        }
        
        /* Keep profile container at original size but clip content */
        .settings-card .profile-container,
        .settings-section .profile-container,
        .fixed.inset-0 .profile-container {
          position: relative !important;
          overflow: visible !important; 
          contain: paint !important;
        }
        
        /* Fix for background spill in preview */
        .settings-card .profile-container .background-container,
        .settings-section .profile-container .background-container,
        .fixed.inset-0 .profile-container .background-container {
          width: 100% !important;
          height: 100% !important;
          left: 0 !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          position: absolute !important;
          overflow: hidden !important;
          border-radius: 8px !important;
          contain: paint !important;
        }

        /* Ensure background image and video stay contained */
        .settings-card .profile-container .background-image,
        .settings-section .profile-container .background-image,
        .fixed.inset-0 .profile-container .background-image,
        .settings-card .profile-container .background-video,
        .settings-section .profile-container .background-video,
        .fixed.inset-0 .profile-container .background-video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        /* Add body lock when mobile sidebar is open */
        body.sidebar-open {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Settings; 