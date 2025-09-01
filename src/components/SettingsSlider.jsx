import React from 'react';

const SettingsSlider = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  label,
  isPercentage = false,
  showValue = true,
  valuePrefix = '',
  valueSuffix = ''
}) => {
  // Convert value to percentage if needed
  const displayValue = isPercentage ? `${Math.round(value * 100)}%` : `${valuePrefix}${value}${valueSuffix}`;
  
  // Calculate the gradient percentage for the track
  const percentage = isPercentage ? (value * 100) : ((value - min) / (max - min) * 100);
  
  // Handle value change
  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(isPercentage ? newValue / 100 : newValue);
  };

  return (
    <div className="settings-slider-container" style={{ marginBottom: '16px' }}>
      <div className="settings-slider-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <label style={{ 
          color: 'rgb(236, 233, 233)',
          fontSize: '14px'
        }}>{label}</label>
        {showValue && (
          <span style={{ 
            color: 'var(--primary-text-color)',
            fontSize: '14px',
            fontVariantNumeric: 'tabular-nums',
            fontWeight: '500'
          }}>{displayValue}</span>
        )}
      </div>
      <div className="settings-slider-input" style={{
        position: 'relative',
        height: '16px',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Track background */}
        <div style={{
          position: 'absolute',
          left: '20px',
          right: '40px',
          height: '4px',
          background: 'transparent',
          borderRadius: '20px',
          pointerEvents: 'none'
        }} />
        
        {/* Filled portion */}
        <div style={{
          position: 'absolute',
          left: '20px',
          right: '40px',
          width: `calc((100% - 50px) * ${percentage / 100})`,
          height: '4px',
          background: '#905cf4',
          borderRadius: '20px',
          pointerEvents: 'none',
          boxShadow: '0 0 6px 2px rgba(144, 92, 244, 0.6)',
        }} />
        
        <input
          type="range"
          min={isPercentage ? 0 : min}
          max={isPercentage ? 100 : max}
          step={isPercentage ? 0.01 : step}
          value={isPercentage ? value * 100 : value}
          onChange={handleChange}
          style={{
            width: '100%',
            height: '4px',
            WebkitAppearance: 'none',
            background: 'transparent',
            position: 'relative',
            cursor: 'pointer',
            zIndex: 2
          }}
        />
        <style>
          {`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 12px;
              height: 12px;
              background: rgb(255, 255, 255);
              border-radius: 50%;
              cursor: pointer;
              transition: all 0.2s ease;
              margin-top: -4px;
            }
            
            input[type="range"]::-webkit-slider-thumb:hover {
              transform: scale(1.1);
              box-shadow: 0 2px 6px rgb(255, 255, 255);
            }
            
            input[type="range"]::-webkit-slider-thumb:active {
              transform: scale(0.95);
            }
            
            input[type="range"]::-moz-range-thumb {
              width: 12px;
              height: 12px;
              background: white;
              border: none;
              border-radius: 50%;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            
            input[type="range"]::-moz-range-thumb:hover {
              transform: scale(1.1);
            }
            
            input[type="range"]::-moz-range-thumb:active {
              transform: scale(0.95);
            }

            input[type="range"]::-webkit-slider-runnable-track {
              height: 4px;
              border-radius: 20px;
              background: transparent;
            }

            input[type="range"]::-moz-range-track {
              height: 4px;
              border-radius: 20px;
              background: transparent;
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default SettingsSlider; 