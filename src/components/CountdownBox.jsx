import React, { useState, useEffect } from 'react';
import { FaClock } from 'react-icons/fa';

const CountdownBox = ({ targetDate, title, description }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num) => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className="countdown-box-content" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: '2px',
      marginTop: '-20px'
    }}>
      <div className="box-header" style={{
        marginBottom: '0',
        marginTop: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginLeft: '4px'
      }}>
        <FaClock size={18} className="box-icon-svg" />
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          margin: '0',
          color: 'var(--primary-text-color)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>{title || 'Countdown'}</h3>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '12px',
        marginTop: '-4px',
        marginLeft: '4px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-text-color)' }}>
            {formatNumber(timeLeft.days)}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--secondary-text-color)',
            marginTop: '-2px'
          }}>Days</div>
        </div>
        <div style={{ fontSize: '18px', color: 'var(--primary-text-color)', marginTop: '-14px' }}>:</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-text-color)' }}>
            {formatNumber(timeLeft.hours)}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--secondary-text-color)',
            marginTop: '-2px'
          }}>Hours</div>
        </div>
        <div style={{ fontSize: '18px', color: 'var(--primary-text-color)', marginTop: '-14px' }}>:</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-text-color)' }}>
            {formatNumber(timeLeft.minutes)}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--secondary-text-color)',
            marginTop: '-2px'
          }}>Mins</div>
        </div>
        <div style={{ fontSize: '18px', color: 'var(--primary-text-color)', marginTop: '-14px' }}>:</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--primary-text-color)' }}>
            {formatNumber(timeLeft.seconds)}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--secondary-text-color)',
            marginTop: '-2px'
          }}>Secs</div>
        </div>
      </div>
      
      {description && (
        <div style={{
          fontSize: '14px',
          color: 'var(--secondary-text-color)',
          marginTop: '8px',
          marginLeft: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'left'
        }}>
          {description}
        </div>
      )}
    </div>
  );
};

export default CountdownBox;
