import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const ParticleCursor = ({ profileId }) => {
  const [particles, setParticles] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorEffects, setCursorEffects] = useState(['particles']);
  const [lastSpawnTime, setLastSpawnTime] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [accentColor, setAccentColor] = useState('#8b5cf6');
  const MAX_PARTICLES = 35;

  const createParticle = useCallback((x, y) => {
    const now = Date.now();
    return {
      id: now + '-' + Math.random().toString(36).substr(2, 9),
      x,
      y,
      size: Math.random() * 4 + 3,
      speedX: (Math.random() - 0.5) * 0.6, // Initial spread
      speedY: Math.random() * 2.0 + 1.2, 
      life: 1.2,
      age: 0, // Track particle age for spread reduction
      createdAt: now, // Add timestamp for sorting
    };
  }, []);

  const addParticle = useCallback((x, y) => {
    setParticles(prev => {
      const newParticle = createParticle(x, y);
      let updatedParticles = [...prev, newParticle];
      
      // If we exceed the maximum, remove the oldest particles
      if (updatedParticles.length > MAX_PARTICLES) {
        updatedParticles.sort((a, b) => a.createdAt - b.createdAt);
        updatedParticles = updatedParticles.slice(-MAX_PARTICLES);
      }
      
      return updatedParticles;
    });
  }, [createParticle]);

  useEffect(() => {
    const fetchProfileAppearance = async () => {
      try {
        const { data, error } = await supabase
          .from('profile_appearance')
          .select('cursor_effects, accent_color')
          .eq('profile_id', profileId)
          .single();

        if (error) throw error;
        if (data) {
          if (data.cursor_effects) {
            setCursorEffects(data.cursor_effects);
          }
          if (data.accent_color) {
            setAccentColor(data.accent_color);
          }
        }
      } catch (error) {
        console.error('Error fetching profile appearance:', error);
      }
    };

    if (profileId) {
      fetchProfileAppearance();
    }
  }, [profileId]);

  useEffect(() => {
    let animationFrameId;
    let particleInterval;
    let movementTimeout;

    const handleMouseMove = (e) => {
      const currentTime = Date.now();
      
      if (currentTime - lastSpawnTime > 100) {
        addParticle(e.clientX, e.clientY);
        setLastSpawnTime(currentTime);
      }

      setMousePos({ x: e.clientX, y: e.clientY });
      setIsMoving(true);
      
      setLastMousePos({ x: e.clientX, y: e.clientY });

      if (movementTimeout) {
        clearTimeout(movementTimeout);
      }
      movementTimeout = setTimeout(() => {
        setIsMoving(false);
      }, 100);
    };

    const spawnParticle = () => {
      if (!isMoving) {
        const now = Date.now();
        if (now - lastSpawnTime > 500) {
          addParticle(mousePos.x, mousePos.y);
          setLastSpawnTime(now);
        }
      }
    };

    const updateParticles = () => {
      setParticles(prev => 
        prev
          .map(particle => {
            const age = particle.age + 0.016; // Approximately one frame at 60fps
            return {
              ...particle,
              x: particle.x + (particle.speedX * Math.max(0, 1 - age * 2)), // Reduce spread over time
              y: particle.y + particle.speedY,
              life: particle.life - 0.002,
              age,
            };
          })
          .filter(particle => particle.life > 0)
      );
      animationFrameId = requestAnimationFrame(updateParticles);
    };

    if (cursorEffects.includes('particles')) {
      window.addEventListener('mousemove', handleMouseMove);
      particleInterval = setInterval(spawnParticle, 100);
      animationFrameId = requestAnimationFrame(updateParticles);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (particleInterval) {
        clearInterval(particleInterval);
      }
      if (movementTimeout) {
        clearTimeout(movementTimeout);
      }
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cursorEffects, lastSpawnTime, mousePos.x, mousePos.y, createParticle, isMoving, addParticle]);

  if (!cursorEffects.includes('particles')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 9999
    }}>
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.x,
            top: particle.y,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: accentColor,
            borderRadius: '50%',
            opacity: particle.life * 0.7,
            transform: 'translate(-50%, -50%)',
            transition: 'opacity 0.2s ease',
            boxShadow: `0 0 4px ${accentColor}`,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleCursor; 