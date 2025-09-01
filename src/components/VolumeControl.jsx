import React, { useState, useEffect, useRef } from 'react';
import { FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { supabase } from '../supabaseClient';
import './VolumeControl.css';

const VolumeControl = ({ defaultVolume = 0.5, onVolumeChange }) => {
  const [volume, setVolume] = useState(defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(defaultVolume);
  const [profile, setProfile] = useState(null);
  const controlRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profile_appearance')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (controlRef.current && !controlRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    setIsMuted(false);
    onVolumeChange(newVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      onVolumeChange(previousVolume);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      onVolumeChange(0);
    }
    setIsMuted(!isMuted);
  };

  const hexToRgba = (hex, opacity) => {
    if (!hex) return 'rgba(31, 31, 44, ' + opacity + ')';
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <div 
      ref={controlRef}
      className="volume-control"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        background: profile?.widget_bg_color ? 
          hexToRgba(profile.widget_bg_color, profile.content_opacity) : 
          'rgba(31, 31, 44, 0.7)',
        backdropFilter: 'blur(8px)',
        borderRadius: `${profile?.presence_border_radius || 12}px`,
        padding: '12px',
        transition: 'all 0.2s ease',
        width: isExpanded ? '200px' : '44px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        '--accent-color': profile?.accent_color || '#8b5cf6',
        '--volume-percent-decimal': volume,
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <button
        onClick={toggleMute}
        style={{
          background: 'none',
          border: 'none',
          color: profile?.accent_color || '#8b5cf6',
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '20px',
          height: '20px',
          transition: 'color 0.2s ease',
          flexShrink: 0,
          position: 'relative',
          left: '0'
        }}
      >
        {isMuted || volume === 0 ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
      </button>
      
      <div 
        className="volume-slider-container"
        style={{
          position: 'absolute',
          left: '44px',
          right: '12px',
          opacity: isExpanded ? 1 : 0,
          transition: 'opacity 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          height: '20px'
        }}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          style={{
            '--accent-color': profile?.accent_color || '#8b5cf6'
          }}
        />
      </div>
    </div>
  );
};

export default VolumeControl;