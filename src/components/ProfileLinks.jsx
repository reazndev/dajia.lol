import React from 'react';
import { FaGlobe, FaGithub, FaXTwitter, FaInstagram, FaLinkedin, FaYoutube, FaTwitch, FaDiscord } from 'react-icons/fa6';

const ProfileLinks = ({ links, color }) => {
  if (!links || Object.values(links).every(link => !link)) {
    return null;
  }
  
  const iconStyle = {
    color: color || 'white',
    fontSize: '20px'
  };
  
  return (
    <div className="profile-links">
      {links.website && (
        <a href={links.website} target="_blank" rel="noopener noreferrer" className="profile-link" title="Website">
          <FaGlobe style={iconStyle} />
        </a>
      )}
      
      {links.github && (
        <a href={links.github} target="_blank" rel="noopener noreferrer" className="profile-link" title="GitHub">
          <FaGithub style={iconStyle} />
        </a>
      )}
      
      {links.twitter && (
        <a href={links.twitter.startsWith('http') ? links.twitter : `https://x.com/${links.twitter}`} target="_blank" rel="noopener noreferrer" className="profile-link" title="X (Twitter)">
          <FaXTwitter style={iconStyle} />
        </a>
      )}
      
      {links.instagram && (
        <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="profile-link" title="Instagram">
          <FaInstagram style={iconStyle} />
        </a>
      )}
      
      {links.linkedin && (
        <a href={links.linkedin} target="_blank" rel="noopener noreferrer" className="profile-link" title="LinkedIn">
          <FaLinkedin style={iconStyle} />
        </a>
      )}
      
      {links.youtube && (
        <a href={links.youtube} target="_blank" rel="noopener noreferrer" className="profile-link" title="YouTube">
          <FaYoutube style={iconStyle} />
        </a>
      )}
      
      {links.twitch && (
        <a href={links.twitch} target="_blank" rel="noopener noreferrer" className="profile-link" title="Twitch">
          <FaTwitch style={iconStyle} />
        </a>
      )}
      
      {links.discord && (
        <a href={links.discord.startsWith('http') ? links.discord : `https://discord.com/users/${links.discord}`} 
           target="_blank" 
           rel="noopener noreferrer" 
           className="profile-link" 
           title="Discord">
          <FaDiscord style={iconStyle} />
        </a>
      )}
    </div>
  );
};

export default ProfileLinks; 