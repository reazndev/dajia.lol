import React, { useState } from 'react';
import '../styles/fonts.css';

const FONT_CATEGORIES = {
  'Sans Serif': [
    { name: 'Inter', class: 'font-inter', sample: 'Clean and modern' },
    { name: 'Poppins', class: 'font-poppins', sample: 'Geometric and friendly' },
    { name: 'Montserrat', class: 'font-montserrat', sample: 'Contemporary classic' },
  ],
  'Serif': [
    { name: 'Playfair Display', class: 'font-playfair', sample: 'Elegant and sophisticated' },
    { name: 'Merriweather', class: 'font-merriweather', sample: 'Traditional and readable' },
    { name: 'Lora', class: 'font-lora', sample: 'Modern yet classic' },
  ],
  'Display': [
    { name: 'Bebas Neue', class: 'font-bebas-neue', sample: 'BOLD AND IMPACTFUL' },
    { name: 'Righteous', class: 'font-righteous', sample: 'Retro and funky' },
    { name: 'Abril Fatface', class: 'font-abril-fatface', sample: 'Bold and dramatic' },
    { name: 'Titan One', class: 'font-titan-one', sample: 'CHUNKY AND BOLD' },
  ],
  'Gothic': [
    { name: 'UnifrakturMaguntia', class: 'font-unifraktur', sample: 'Medieval elegance' },
  ],
  'Tech': [
    { name: 'Orbitron', class: 'font-orbitron', sample: 'FUTURISTIC TECH' },
  ],
  'Handwritten': [
    { name: 'Dancing Script', class: 'font-dancing-script', sample: 'Flowing and graceful' },
    { name: 'Caveat', class: 'font-caveat', sample: 'Casual and natural' },
    { name: 'Pacifico', class: 'font-pacifico', sample: 'Fun and friendly' },
  ],
  'Monospace': [
    { name: 'JetBrains Mono', class: 'font-jetbrains', sample: 'Code-friendly' },
    { name: 'Fira Code', class: 'font-fira-code', sample: 'Modern monospace' },
  ],
  'Creative': [
    { name: 'Comfortaa', class: 'font-comfortaa', sample: 'Rounded and friendly' },
    { name: 'Metal Mania', class: 'font-metal-mania', sample: 'Heavy metal style' },
  ],
};

const FontSettings = ({ selectedFont, onFontChange }) => {
  const [activeCategory, setActiveCategory] = useState('Sans Serif');

  return (
    <div>
      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '12px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {Object.keys(FONT_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: activeCategory === category ? 'var(--accent-color, #8b5cf6)' : 'rgba(255, 255, 255, 0.1)',
              color: activeCategory === category ? '#fff' : 'var(--secondary-text-color)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              fontSize: '12px'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Font Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '8px'
      }}>
        {FONT_CATEGORIES[activeCategory].map((font) => (
          <div
            key={font.name}
            onClick={() => onFontChange(font.name)}
            style={{
              padding: '10px',
              borderRadius: '6px',
              cursor: 'pointer',
              backgroundColor: selectedFont === font.name ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              border: `1px solid ${selectedFont === font.name ? 'var(--accent-color, #8b5cf6)' : 'rgba(255, 255, 255, 0.1)'}`,
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <div style={{
              fontSize: '12px',
              color: 'var(--secondary-text-color, #b9bbbe)',
              marginBottom: '4px'
            }}>
              {font.name}
            </div>
            <div className={font.class} style={{
              fontSize: '14px',
              color: 'var(--primary-text-color, #ffffff)',
              lineHeight: '1.2'
            }}>
              {font.sample}
            </div>
            {selectedFont === font.name && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-color, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FontSettings; 