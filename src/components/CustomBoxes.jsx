import React, { useState } from 'react';
import { FaDiscord, FaGithub, FaYoutube, FaLink, FaSpotify, FaSteam, FaClock } from 'react-icons/fa';
import { AiOutlineStar } from 'react-icons/ai';
import '../styles/CustomBoxes.css';
import SpotifyPlayer from './SpotifyPlayer';
import SteamProfile from './SteamProfile';
import CountdownBox from './CountdownBox';

const CustomBoxes = ({ boxes = [], accentColor, bgColor, opacity }) => {
  const [showSpotifyPlayer, setShowSpotifyPlayer] = useState({});

  // Helper function to get icon based on type
  const getIcon = (type) => {
    const iconProps = {
      size: 24,
      className: 'box-icon-svg'  // Add class for hover effect
    };

    switch (type) {
      case 'discord':
        return <FaDiscord {...iconProps} />;
      case 'github':
        return <FaGithub {...iconProps} />;
      case 'youtube':
        return <FaYoutube {...iconProps} />;
      case 'spotify':
        return <FaSpotify {...iconProps} />;
      case 'steam':
        return <FaSteam {...iconProps} />;
      case 'countdown':
        return <FaClock {...iconProps} />;
      default:
        return <FaLink {...iconProps} />;
    }
  };

  // Helper function to format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`.replace('.0M', 'M');
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`.replace('.0K', 'K');
    }
    return num.toString();
  };

  // Helper function to render box content based on type
  const renderBoxContent = (box) => {
    switch (box.type) {
      case 'countdown':
        return (
          <CountdownBox
            targetDate={box.additional_data?.target_date}
            title={box.title}
            description={box.description}
          />
        );
      case 'discord':
        return (
          <div className="discord-box-content" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: '2px',
            marginTop: '-10px'
          }}>
            <div className="box-header" style={{
              marginBottom: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaDiscord size={20} className="box-icon-svg" />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0',
                color: 'var(--primary-text-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{box.title || 'Discord Server'}</h3>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginLeft: '28px',
              marginTop: '4px'
            }}>
              {box.image_url && (
                <img 
                  src={box.image_url} 
                  alt={box.title} 
                  style={{
                    width: '47px',
                    height: '47px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    marginLeft: '-30px',
                    marginTop: '-5px'
                  }}
                />
              )}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                marginLeft: '-4px'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0px',
                  fontSize: '14px',
                  color: 'var(--secondary-text-color)',
                  marginTop: '-2px'
                }}>
                  {box.additional_data?.member_count && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      color: 'var(--secondary-text-color)'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#8c8c8c',
                        display: 'inline-block'
                      }}></span>
                      {formatNumber(box.additional_data.member_count)} members
                    </span>
                  )}
                  {box.additional_data?.online_count && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      color: 'var(--secondary-text-color)'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#3ba55c',
                        display: 'inline-block'
                      }}></span>
                      {formatNumber(box.additional_data.online_count)} online
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'github':
        if (box.account_type === 'profile') {
          return (
            <div className="github-box-content" style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              gap: '2px',
              marginTop: '-10px'
            }}>
              <div className="box-header" style={{
                marginBottom: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FaGithub size={20} className="box-icon-svg" />
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0',
                  color: 'var(--primary-text-color)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>{box.title || 'GitHub Profile'}</h3>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginLeft: '28px',
                marginTop: '4px'
              }}>
                {box.image_url && (
                  <img 
                    src={box.image_url} 
                    alt={box.title} 
                    style={{
                      width: '47px',
                      height: '47px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      marginLeft: '-30px',
                      marginTop: '-5px'
                    }}
                  />
                )}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginLeft: '-4px',
                  flex: 1,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    color: 'var(--secondary-text-color)',
                    marginTop: '-2px'
                  }}>
                    {box.additional_data?.followers_count !== undefined && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: 'var(--secondary-text-color)'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#8c8c8c',
                          display: 'inline-block'
                        }}></span>
                        {formatNumber(box.additional_data.followers_count)} followers
                      </span>
                    )}
                    {box.additional_data?.repos_count !== undefined && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        color: 'var(--secondary-text-color)'
                      }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#8c8c8c',
                          display: 'inline-block'
                        }}></span>
                        {formatNumber(box.additional_data.repos_count)} repos
                      </span>
                    )}
                  </div>
                  {box.description && (
                    <p style={{
                      margin: '0',
                      fontSize: '14px',
                      color: 'var(--secondary-text-color)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: '1',
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.2'
                    }}>
                      {box.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="github-box-content" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: '2px',
            marginTop: '-10px'
          }}>
            <div className="box-header" style={{
              marginBottom: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaGithub size={20} className="box-icon-svg" />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0',
                color: 'var(--primary-text-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{box.title || 'Repository'}</h3>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: 'var(--secondary-text-color)',
              marginLeft: '0px',
              marginBottom: '-2px',
              marginTop: '2px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AiOutlineStar style={{ marginTop: '1px' }} className="box-icon-svg" /> {formatNumber(box.metadata?.stars || 0)}
              </span>
              {box.metadata?.language && (
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  opacity: 0.8 
                }}>
                  • {box.metadata.language}
                </span>
              )}
            </div>
            {box.description && (
              <p style={{
              margin: '0',
              fontSize: '15px',
              marginLeft: '-2px',
              color: 'var(--secondary-text-color)',
              lineHeight: '1.8',
              
              overflow: 'visible',  // Changed to 'visible' to allow the text to flow naturally
              textOverflow: 'ellipsis',  // Keep for truncation on overflow, but may need adjustment
              whiteSpace: 'normal',  // Allows wrapping of the text
              wordBreak: 'break-word',  // Ensures long words will break and not overflow the container
              flex: '1 0 auto'  // Ensures that the description takes up available space and doesn't cut off
            }}>
              {box.description}
            </p>
            )}
          </div>
        );

      case 'youtube':
        return (
          <div className="youtube-box-content" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: '2px',
            marginTop: '-10px'
          }}>
            <div className="box-header" style={{
              marginBottom: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaYoutube size={20} className="box-icon-svg" />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0',
                color: 'var(--primary-text-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{box.title || 'YouTube Channel'}</h3>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              marginLeft: '28px',
              marginTop: '4px'
            }}>
              {box.image_url && (
                <img 
                  src={box.image_url} 
                  alt={box.title} 
                  style={{
                    width: '47px',
                    height: '47px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                    marginLeft: '-30px',
                    marginTop: '-5px'
                  }}
                />
              )}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                marginLeft: '-4px',
                flex: 1,
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '14px',
                  color: 'var(--secondary-text-color)',
                  marginTop: '-2px'
                }}>
                  {box.additional_data?.subscriber_count !== undefined && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      color: 'var(--secondary-text-color)'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#8c8c8c',
                        display: 'inline-block'
                      }}></span>
                      {formatNumber(box.additional_data.subscriber_count)} subs
                    </span>
                  )}
                  {box.additional_data?.video_count !== undefined && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      color: 'var(--secondary-text-color)'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#8c8c8c',
                        display: 'inline-block'
                      }}></span>
                      {formatNumber(box.additional_data.video_count)} videos
                    </span>
                  )}
                </div>
                {box.additional_data?.description && (
                  <p style={{
                    margin: '0',
                    fontSize: '14px',
                    color: 'var(--secondary-text-color)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: '1',
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.2'
                  }}>
                    {box.additional_data.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'spotify':
        return (
          <div className="spotify-box-content" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: '2px',
            marginTop: '-10px',
            position: 'relative'
          }}>
            <div className="box-header" style={{
              marginBottom: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaSpotify size={20} className="box-icon-svg" />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0',
                color: 'var(--primary-text-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>Spotify Embed</h3>
            </div>
            {showSpotifyPlayer[box.id] ? (
              <div style={{
                position: 'relative',
                marginTop: '8px',
                height: '80px',
                width: '100%',
                overflow: 'hidden'
              }}>
                <SpotifyPlayer 
                  trackId={box.additional_data.track_id} 
                  height="80"
                  width="100%"
                  theme="dark"
                  html={box.additional_data.html}
                />
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginLeft: '28px',
                marginTop: '4px'
              }}>
                {box.image_url && (
                  <img 
                    src={box.image_url} 
                    alt={box.title} 
                    style={{
                      width: '47px',
                      height: '47px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      marginLeft: '-30px',
                      marginTop: '-5px'
                    }}
                  />
                )}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  marginLeft: '-4px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--primary-text-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {box.title}
                  </div>
                  
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--secondary-text-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {box.additional_data?.author_name}
                  </div>
                  
                  {box.additional_data?.album_name && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--tertiary-text-color, #9ca3af)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px'
                    }}>
                      {box.additional_data.album_name}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'steam':
        return (
          <div className="steam-box-content" style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            gap: '2px',
            marginTop: '-10px'
          }}>
            <div className="box-header" style={{
              marginBottom: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FaSteam size={20} className="box-icon-svg" />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                margin: '0',
                color: 'var(--primary-text-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>{box.title || 'Steam Profile'}</h3>
            </div>
            {box.additional_data?.steam_id ? (
              <SteamProfile steamId={box.additional_data.steam_id} />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginLeft: '28px',
                marginTop: '4px'
              }}>
                {box.image_url && (
                  <img 
                    src={box.image_url} 
                    alt={box.title} 
                    style={{
                      width: '47px',
                      height: '47px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      marginLeft: '-30px',
                      marginTop: '-5px'
                    }}
                  />
                )}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginLeft: '-4px',
                  flex: 1,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--primary-text-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {box.title || 'Steam Profile'}
                  </div>
                  
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--secondary-text-color)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    Steam ID required
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <>
            <div className="box-header">
              <FaLink size={24} />
              <h3>{box.title || 'Link'}</h3>
            </div>
            {box.image_url && (
              <img src={box.image_url} alt={box.title} className="link-image" />
            )}
            {box.description && <p className="description">{box.description}</p>}
          </>
        );
    }
  };

  if (!boxes || boxes.length === 0) return null;

  // Filter enabled boxes first
  const enabledBoxes = boxes.filter(box => box.enabled).sort((a, b) => a.display_order - b.display_order);
  const isSingleBox = enabledBoxes.length === 1;

  return (
    <div className="custom-boxes-container" style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      marginTop: '0px',
      width: '100%',
      fontFamily: 'inherit',
      '& *': {
        fontFamily: 'inherit !important'
      }
    }}>
      {enabledBoxes.map((box) => (
        <a
          key={box.id}
          href={box.type === 'spotify' ? 'javascript:void(0)' : box.url}
          target={box.type === 'spotify' ? '_self' : '_blank'}
          rel="noopener noreferrer"
          className="custom-box"
          style={{
            '--accent-color': accentColor || '#8b5cf6',  // Add CSS variable for accent color
            backgroundColor: opacity === 0 ? 'transparent' : (bgColor ? `rgba(${parseInt(bgColor.slice(1,3), 16)}, ${parseInt(bgColor.slice(3,5), 16)}, ${parseInt(bgColor.slice(5,7), 16)}, ${opacity === undefined ? 0.7 : opacity})` : 'rgba(31, 31, 44, 0.7)'),
            borderRadius: '12px',
            padding: '12px',
            height: (box.type === 'spotify' && showSpotifyPlayer[box.id]) ? '160px' : '90px',
            minWidth: isSingleBox ? '100%' : '300px',
            maxWidth: isSingleBox ? '100%' : 'calc(50% - 10px)',
            flex: isSingleBox ? '0 0 100%' : '1',
            textDecoration: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'transform 0.2s ease, border-color 0.2s ease, height 0.3s ease',
            cursor: 'pointer',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            fontFamily: 'inherit'
          }}
          onClick={(e) => {
            if (box.type === 'spotify') {
              e.preventDefault();
              setShowSpotifyPlayer(prev => ({
                ...prev,
                [box.id]: !prev[box.id]
              }));
            } else if (box.type === 'steam') {
              if (box.additional_data?.steam_id) {
                e.preventDefault();
              }
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accentColor || '#8b5cf6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          {renderBoxContent(box)}
        </a>
      ))}
    </div>
  );
};

export default React.memo(CustomBoxes); 