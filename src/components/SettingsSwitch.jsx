import React from 'react';

const SettingsSwitch = ({ 
  checked, 
  onChange, 
  label,
  size = 'small' // 'small' or 'normal'
}) => {
  return (
    <div className="settings-switch-container" style={{ 
      display: 'flex', 
      alignItems: 'center',
      gap: '10px',
      marginBottom: '6px'
    }}>
      <label className={`switch ${size}`} style={{
        position: 'relative',
        display: 'inline-block',
        width: size === 'small' ? '32px' : '40px',
        height: size === 'small' ? '18px' : '22px',
        flexShrink: 0
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ 
            opacity: 0,
            width: 0,
            height: 0
          }}
        />
        <span className="slider" style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: checked ? 'var(--accent-color, #8b5cf6)' : 'rgba(255, 255, 255, 0.1)',
          transition: '0.3s',
          borderRadius: '34px'
        }}></span>
        <style>
          {`
            .switch .slider:before {
              position: absolute;
              content: "";
              height: ${size === 'small' ? '14px' : '18px'};
              width: ${size === 'small' ? '14px' : '18px'};
              left: ${size === 'small' ? '2px' : '2px'};
              bottom: ${size === 'small' ? '2px' : '2px'};
              background-color: white;
              transition: 0.3s;
              border-radius: 50%;
            }

            .switch input:checked + .slider:before {
              transform: translateX(${size === 'small' ? '14px' : '18px'});
            }

            .switch input:focus + .slider {
              box-shadow: 0 0 1px var(--accent-color, #8b5cf6);
            }
          `}
        </style>
      </label>
      <span style={{ 
        color: 'var(--primary-text-color)',
        fontSize: '14px'
      }}>{label}</span>
    </div>
  );
};

export default SettingsSwitch; 