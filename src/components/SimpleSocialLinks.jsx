import React, { useState } from 'react';
import { FaGithub, FaTwitter } from 'react-icons/fa';

const SimpleSocialLinks = ({ initialLinks = {}, onSave }) => {
  const [github, setGithub] = useState(initialLinks.github || '');
  const [twitter, setTwitter] = useState(initialLinks.twitter || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Preserve all existing links and only update github and twitter
    const links = { 
      ...initialLinks,
      github, 
      twitter 
    };
    console.log('Saving links:', links);
    onSave(links);
    alert('Links saved! Remember to click Save Profile to update your profile.');
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px' }}>
      <h3>Simple Social Links Test</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            <FaGithub /> GitHub:
            <input 
              type="text" 
              value={github} 
              onChange={(e) => setGithub(e.target.value)} 
              style={{ display: 'block', width: '100%', padding: '8px', margin: '5px 0 15px' }}
            />
          </label>
        </div>
        <div>
          <label>
            <FaTwitter /> Twitter:
            <input 
              type="text" 
              value={twitter} 
              onChange={(e) => setTwitter(e.target.value)} 
              style={{ display: 'block', width: '100%', padding: '8px', margin: '5px 0 15px' }}
            />
          </label>
        </div>
        <button 
          type="submit" 
          style={{ 
            background: '#8b5cf6', 
            color: 'white', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer' 
          }}
        >
          Save Test Links
        </button>
      </form>
    </div>
  );
};

export default SimpleSocialLinks; 