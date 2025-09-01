import React, { useRef } from 'react';
// Remove react-tooltip imports
// import { Tooltip } from 'react-tooltip';
// import 'react-tooltip/dist/react-tooltip.css';

// Import badge SVGs
const EarlySupporterSvg = '/assets/badges/early_supporter.svg';
const DeveloperSvg = '/assets/badges/developer.svg';
const VerifiedSvg = '/assets/badges/verified.svg';
const DiscordBoosterSvg = '/assets/badges/discord_booster.svg';
const PremiumSvg = '/assets/badges/premium.svg';
const OwnerSvg = '/assets/badges/crown.svg';
const Liked_by_teamSvg = '/assets/badges/star.svg';
const Team_MemberSvg = '/assets/badges/team_member.svg';
const Bug_hunter = '/assets/badges/bug_hunter.svg';

 

// Map badge types to their assets and descriptions
const BADGE_CONFIG = {
  'Early Supporter': {
    icon: EarlySupporterSvg,
    description: 'Early Supporter'
  },
  'Verified': {
    icon: VerifiedSvg,
    description: 'Verified'
  },
  'Server Booster': {
    icon: DiscordBoosterSvg,
    description: 'Discord Server Booster'
  },
  'Developer': {
    icon: DeveloperSvg,
    description: 'Developer'
  },
  'Team Member': {
    icon: Team_MemberSvg,
    description: 'Team Member'
  },
  'Liked by team': {
    icon: Liked_by_teamSvg,
    description: 'Liked by team'
  },
  'Owner': {
    icon: OwnerSvg,
    description: 'Owner'
  },
  'Premium': {
    icon: PremiumSvg,
    description: 'Premium'
  },
  'Bug Hunter': {
    icon: Bug_hunter,
    description: 'Bug Hunter'
  }
};

// Helper function to convert hex to rgba
const hexToRgba = (hex, opacity) => {
  if (!hex) return `rgba(15, 15, 19, ${opacity || 0.4})`;
  
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Return rgba value
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const UserBadges = ({ badges, iconColor, iconGlowEnabled, iconGlowColor, iconGlowStrength, profile }) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  // Calculate new badge size (1.2x larger)
  const badgeSize = 28; // 22px * 1.2 ≈ 26px

  // Handle mouse enter for tooltip
  const handleShowTooltip = (badgeType, e) => {
    const badgeConfig = BADGE_CONFIG[badgeType];
    
    if (!badgeConfig) return;
    
    // Get position of the badge element
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Get the global tooltip element
    const tooltip = document.getElementById('badge-tooltip');
    const tooltipContent = document.getElementById('badge-tooltip-content');
    
    if (tooltip && tooltipContent) {
      // Set the content
      tooltipContent.textContent = badgeConfig.description;
      
      // Position the tooltip
      tooltip.style.top = `${rect.bottom + window.scrollY + 10}px`;
      tooltip.style.left = `${rect.left}px`;
      
      // Show the tooltip with animation
      tooltip.style.opacity = '1';
      tooltip.style.transform = 'translateY(0)';
      tooltip.style.WebkitTransform = 'translateY(0)';
      tooltip.style.msTransform = 'translateY(0)';
    }
  };

  // Handle mouse leave for tooltip
  const handleHideTooltip = () => {
    const tooltip = document.getElementById('badge-tooltip');
    
    if (tooltip) {
      // Hide the tooltip with animation
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateY(-10px)';
      tooltip.style.WebkitTransform = 'translateY(-10px)';
      tooltip.style.msTransform = 'translateY(-10px)';
    }
  };

  // Create the glow style if enabled
  const glowStyle = iconGlowEnabled ? {
    filter: `drop-shadow(0 0 ${iconGlowStrength / 2}px ${iconGlowColor}) drop-shadow(0 0 ${iconGlowStrength}px ${iconGlowColor})`
  } : {};

  return (
    <div className="user-badges" style={{ 
      display: 'inline-flex', 
      marginLeft: '16px',
      alignItems: 'center',
      position: 'relative',
    }}>
      {badges.map((badge, index) => {
        // Look up badge type from the badge_type field in database
        const badgeType = badge.badge_type;
        const badgeConfig = BADGE_CONFIG[badgeType];
        
        if (!badgeConfig) return null;

        return (
          <div 
            key={`badge-${index}`}
            style={{ 
              marginRight: '6px',
              display: 'inline-flex',
            }}
            onMouseEnter={(e) => handleShowTooltip(badgeType, e)}
            onMouseLeave={handleHideTooltip}
          >
            <div
              style={{
                width: `${badgeSize}px`,
                height: `${badgeSize}px`,
                WebkitMaskImage: `url(${badgeConfig.icon})`,
                maskImage: `url(${badgeConfig.icon})`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                backgroundColor: iconColor || '#ffffff',
                ...(iconGlowEnabled ? glowStyle : {})
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default UserBadges; 