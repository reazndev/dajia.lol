import React from 'react';

const SpotifyPlayer = ({ trackId, height = '80', width = '100%', theme = 'dark', html }) => {
  // If HTML is provided, use it directly (from Spotify oEmbed API)
  if (html) {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }} 
        style={{ 
          width, 
          height,
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      />
    );
  }
  
  // Fallback to direct iframe creation if HTML isn't provided
  return (
    <iframe
      src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=${theme}`}
      width={width}
      height={height}
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      style={{ 
        borderRadius: '12px',
        border: 'none'
      }}
    ></iframe>
  );
};

export default SpotifyPlayer; 