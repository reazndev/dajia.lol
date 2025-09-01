import React, { useEffect, useState } from 'react';
import CustomCursor from './CustomCursor';
import { supabase } from '../supabaseClient';
import '../pages/PublicProfile.css';
import '../styles/fonts.css';

const PublicProfile = ({ id }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const DISCORD_API_URL = import.meta.env.VITE_DISCORD_API_URL || 'http://localhost:3005';

  useEffect(() => {
    async function fetchProfileData() {
      try {
        if (!id) return;
        
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles_new')
          .select('*')
          .eq('id', id)
          .single();
          
        if (profileError) throw profileError;
        
        // Fetch appearance data
        const { data: appearanceData, error: appearanceError } = await supabase
          .from('profile_appearance')
          .select('*')
          .eq('profile_id', id)
          .single();
          
        if (appearanceError && appearanceError.code !== 'PGRST116') throw appearanceError;
        
        // Fetch user badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('user_badges')
          .select('badge_type')
          .eq('profile_id', id);
          
        if (badgesError) throw badgesError;
        
        // Fetch Discord data to check booster status
        const { data: discordData, error: discordError } = await supabase
          .from('profile_discord')
          .select('is_server_booster')
          .eq('profile_id', id)
          .single();
          
        // Combine badges from user_badges table and Discord booster status
        const allBadges = [...(badgesData || [])];
        
        // Add Server Booster badge if user is a booster
        if (discordData?.is_server_booster) {
          allBadges.push({ badge_type: 'Server Booster' });
        }
        
        // Set badges state
        setBadges(allBadges);
        
        // Combine the profile data
        const completeProfile = {
          ...profileData,
          ...appearanceData
        };
        
        setProfile(completeProfile);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setLoading(false);
      }
    }
    
    fetchProfileData();
  }, [id]);
  
  // Helper function for font class names
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

  if (loading) {
    return <div>Loading profile data...</div>;
  }

  const fontClassName = getFontClassName(profile?.font_family || 'Inter');

  return (
    <div 
      className={`public-profile-container ${fontClassName}`}
      data-font={profile?.font_family || 'Inter'}
      style={{
        '--font-family': `var(--font-${(profile?.font_family || 'Inter').toLowerCase().replace(/\s+/g, '-')})`
      }}
    >
      <CustomCursor profileId={id} />
      <style>
        {`
          .public-profile-container[data-font="${profile?.font_family || 'Inter'}"] * {
            font-family: var(--font-family), sans-serif !important;
          }
        `}
      </style>
      {/* Add UserBadges component with badges */}
      {badges.length > 0 && (
        <UserBadges 
          badges={badges}
          iconColor={profile?.badge_color || '#ffffff'}
          iconGlowEnabled={profile?.badge_glow_enabled}
          iconGlowColor={profile?.badge_glow_color}
          iconGlowStrength={profile?.badge_glow_strength || 4}
          profile={profile}
        />
      )}
    </div>
  );
};

export default PublicProfile; 