import React, { useState, useEffect } from 'react';

const TypewriterText = ({ 
  text, 
  speed = 100, 
  className = '', 
  style = {}, 
  enabled = false,
  mode = 'simple',
  alternatingTexts = []
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [index, setIndex] = useState(0);
  const [showCaret, setShowCaret] = useState(true);

  // Set full text immediately if not using typewriter
  useEffect(() => {
    if (!enabled) {
      setDisplayText(text);
    } else {
      setDisplayText('');
      setIsTyping(true);
      setIsDeleting(false);
      setLoopNum(0);
      setIndex(0);
    }
  }, [enabled, text, mode]);

  // Caret blinking
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      setShowCaret(prev => !prev);
    }, 530);
    
    return () => clearInterval(interval);
  }, [enabled]);

  // Typewriter effect
  useEffect(() => {
    if (!enabled) return;
    
    // Get the text to work with based on mode
    let currentText = text;
    if (mode === 'alternating' && alternatingTexts.length > 0) {
      const textIndex = loopNum % alternatingTexts.length;
      currentText = alternatingTexts[textIndex] || text;
    }
    
    // Typing logic
    const handleTyping = () => {
      if (isTyping) {
        if (index < currentText.length) {
          setDisplayText(currentText.substring(0, index + 1));
          setIndex(index + 1);
        } else {
          // Done typing
          setTimeout(() => {
            setIsTyping(false);
            setIsDeleting(true);
          }, 2000);
        }
      } else if (isDeleting) {
        if (index > 0) {
          setDisplayText(currentText.substring(0, index - 1));
          setIndex(index - 1);
        } else {
          // Done deleting
          setIsDeleting(false);
          setIsTyping(true);
          if (mode === 'alternating' && alternatingTexts.length > 0) {
            setLoopNum(loopNum + 1);
          }
        }
      }
    };
    
    const timeoutId = setTimeout(() => {
      handleTyping();
    }, isDeleting ? speed / 2 : speed);
    
    return () => clearTimeout(timeoutId);
  }, [enabled, text, index, isTyping, isDeleting, speed, mode, loopNum, alternatingTexts]);

  // Caret style
  const caretStyle = {
    opacity: showCaret ? 1 : 0,
    transition: 'opacity 0.1s ease',
    borderRight: `2px solid ${style.color || 'currentColor'}`,
    marginLeft: '1px',
    height: '1.1em',
    display: 'inline-block',
    verticalAlign: 'text-bottom',
    position: 'relative',
    top: '-3px'
  };

  return (
    <span className={className} style={style}>
      {displayText}
      {enabled && <span style={caretStyle}></span>}
    </span>
  );
};

export default TypewriterText; 