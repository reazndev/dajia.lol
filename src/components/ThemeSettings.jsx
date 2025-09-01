import React, { useState } from 'react';
import { FaPalette, FaFont, FaImage, FaAdjust } from 'react-icons/fa';
import './ThemeSettings.css';

const ThemeSettings = ({ initialTheme = {}, onSave, accentColor }) => {
  const [theme, setTheme] = useState({
    fontFamily: initialTheme.fontFamily || 'Inter',
    backgroundCardOpacity: initialTheme.backgroundCardOpacity || 0.7,
    contentCardOpacity: initialTheme.contentCardOpacity || 0.7,
    textShadow: initialTheme.textShadow || false,
    borderRadius: initialTheme.borderRadius || 'medium',
    ...initialTheme
  });

  const handleChange = (name, value) => {
    setTheme(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Saving theme settings:', theme);
    onSave(theme);
    alert('Theme settings saved! Click "Save Profile" to update your profile.');
  };

  const iconStyle = {
    color: accentColor,
    fontSize: '20px',
    marginRight: '10px'
  };

  return (
    <div className="theme-settings">
      <h3>Theme Settings</h3>
      <p>Customize how your profile looks to visitors</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <FaFont style={iconStyle} />
            Font Family
          </label>
          <select 
            value={theme.fontFamily} 
            onChange={(e) => handleChange('fontFamily', e.target.value)}
            className="theme-select"
          >
            <option value="Inter">Inter (Default)</option>
            <option value="Roboto">Roboto</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Poppins">Poppins</option>
            <option value="Open Sans">Open Sans</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <FaAdjust style={iconStyle} />
            Background Card Opacity
          </label>
          <div className="range-with-value">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={theme.backgroundCardOpacity}
              onChange={(e) => handleChange('backgroundCardOpacity', parseFloat(e.target.value))}
              className="range-slider"
            />
            <span className="range-value">{theme.backgroundCardOpacity}</span>
          </div>
        </div>

        <div className="form-group">
          <label>
            <FaAdjust style={iconStyle} />
            Content Cards Opacity (Bio, LastFM, Discord, etc.)
          </label>
          <div className="range-with-value">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={theme.contentCardOpacity}
              onChange={(e) => handleChange('contentCardOpacity', parseFloat(e.target.value))}
              className="range-slider"
            />
            <span className="range-value">{theme.contentCardOpacity}</span>
          </div>
        </div>

        <div className="form-group">
          <label>
            <FaImage style={iconStyle} />
            Border Radius
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="borderRadius"
                value="none"
                checked={theme.borderRadius === 'none'}
                onChange={() => handleChange('borderRadius', 'none')}
              />
              None
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="borderRadius"
                value="small"
                checked={theme.borderRadius === 'small'}
                onChange={() => handleChange('borderRadius', 'small')}
              />
              Small
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="borderRadius"
                value="medium"
                checked={theme.borderRadius === 'medium'}
                onChange={() => handleChange('borderRadius', 'medium')}
              />
              Medium
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="borderRadius"
                value="large"
                checked={theme.borderRadius === 'large'}
                onChange={() => handleChange('borderRadius', 'large')}
              />
              Large
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={theme.textShadow}
              onChange={(e) => handleChange('textShadow', e.target.checked)}
            />
            <span>Enable Text Shadow Effect</span>
          </label>
        </div>

        <button type="submit" className="btn btn-primary">
          Save Theme Settings
        </button>
      </form>
    </div>
  );
};

export default ThemeSettings; 