import React, { useState } from 'react';
import { 
  addBadgeToUser, 
  removeBadgeFromUser, 
  getUserBadges,
  addEarlySupporterBadges
} from '../utils/createBadgesTable';
import { findUserByUsernameOrEmail } from '../utils/badgeTools';

const BADGE_TYPES = [
  { value: 'Owner', label: 'Owner' },
  { value: 'Early Supporter', label: 'Early Supporter' },
  { value: 'Developer', label: 'Developer' },
  { value: 'Team Member', label: 'Team Member' },
  { value: 'Liked by team', label: 'Liked by team' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Premium', label: 'Premium' },
  { value: 'Server Booster', label: 'Server Booster' },
  { value: 'Bug Hunter', label: 'Bug Hunter' }
];

const BadgeManager = ({ userId, isAdmin = false }) => {
  const [selectedBadge, setSelectedBadge] = useState('');
  const [userInput, setUserInput] = useState(userId || '');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBadges, setCurrentBadges] = useState([]);
  const [resolvedUserId, setResolvedUserId] = useState(userId || '');

  // Load current badges for a user
  const loadBadges = async (input) => {
    if (!input) {
      setStatus('Please enter a valid username or user ID');
      return;
    }

    setLoading(true);
    try {
      let targetUserId = input;
      if (!input.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { userId: resolvedId, error: findError } = await findUserByUsernameOrEmail(input);
        if (findError) {
          setStatus(`Error finding user: ${findError.message}`);
          setLoading(false);
          return;
        }
        targetUserId = resolvedId;
        setResolvedUserId(resolvedId);
      }

      const { success, badges, error } = await getUserBadges(targetUserId);
      if (success) {
        setCurrentBadges(badges);
        setStatus(`Loaded ${badges.length} badges`);
      } else {
        setStatus(`Error loading badges: ${error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add badge to user
  const handleAddBadge = async () => {
    if (!userInput) {
      setStatus('Please enter a valid username or user ID');
      return;
    }
    
    if (!selectedBadge) {
      setStatus('Please select a badge');
      return;
    }

    setLoading(true);
    try {
      let targetUserId = userInput;
      if (!userInput.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { userId: resolvedId, error: findError } = await findUserByUsernameOrEmail(userInput);
        if (findError) {
          setStatus(`Error finding user: ${findError.message}`);
          setLoading(false);
          return;
        }
        targetUserId = resolvedId;
        setResolvedUserId(resolvedId);
      }

      const { success, error, message } = await addBadgeToUser(targetUserId, selectedBadge);
      if (success) {
        setStatus(message || 'Badge added successfully');
        // Refresh the badge list
        await loadBadges(userInput);
      } else {
        setStatus(`Error adding badge: ${error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Remove badge from user
  const handleRemoveBadge = async (badgeType) => {
    if (!userInput) {
      setStatus('Please enter a valid username or user ID');
      return;
    }

    setLoading(true);
    try {
      let targetUserId = userInput;
      if (!userInput.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { userId: resolvedId, error: findError } = await findUserByUsernameOrEmail(userInput);
        if (findError) {
          setStatus(`Error finding user: ${findError.message}`);
          setLoading(false);
          return;
        }
        targetUserId = resolvedId;
        setResolvedUserId(resolvedId);
      }

      const { success, error } = await removeBadgeFromUser(targetUserId, badgeType);
      if (success) {
        setStatus('Badge removed successfully');
        // Refresh the badge list
        await loadBadges(userInput);
      } else {
        setStatus(`Error removing badge: ${error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add early supporter badges
  const handleAddEarlySupporters = async () => {
    if (!isAdmin) {
      setStatus('Only admins can perform this action');
      return;
    }

    setLoading(true);
    try {
      const { success, error } = await addEarlySupporterBadges();
      if (success) {
        setStatus('Early supporter badges added successfully');
      } else {
        setStatus(`Error adding early supporter badges: ${error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="badge-manager">
      <h3>Badge Manager</h3>
      
      <div className="input-group">
        <label htmlFor="user-input">Username or User ID:</label>
        <input
          id="user-input"
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter username or user ID"
        />
        <button 
          onClick={() => loadBadges(userInput)} 
          disabled={loading || !userInput}
        >
          Load Badges
        </button>
      </div>

      {resolvedUserId && (
        <div className="resolved-id">
          Resolved User ID: {resolvedUserId}
        </div>
      )}

      <div className="badge-list">
        <h4>Current Badges:</h4>
        {currentBadges.length === 0 ? (
          <p>No badges found for this user</p>
        ) : (
          <ul>
            {currentBadges.map((badge) => (
              <li key={badge.id}>
                {BADGE_TYPES.find(b => b.value === badge.badge_type)?.label || badge.badge_type}
                <button 
                  onClick={() => handleRemoveBadge(badge.badge_type)}
                  disabled={loading}
                  className="remove-button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="add-badge">
        <h4>Add Badge:</h4>
        <div className="input-group">
          <select
            value={selectedBadge}
            onChange={(e) => setSelectedBadge(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a badge</option>
            {BADGE_TYPES.map((badge) => (
              <option key={badge.value} value={badge.value}>
                {badge.label}
              </option>
            ))}
          </select>
          <button 
            onClick={handleAddBadge}
            disabled={loading || !selectedBadge || !userInput}
          >
            Add Badge
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="admin-actions">
          <h4>Admin Actions:</h4>
          <button 
            onClick={handleAddEarlySupporters}
            disabled={loading}
          >
            Add Early Supporter Badges to First 100 Users
          </button>
        </div>
      )}

      {status && (
        <div className="status-message">
          {status}
        </div>
      )}

      <style jsx>{`
        .badge-manager {
          background: #1f1f2c;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .input-group {
          display: flex;
          margin-bottom: 15px;
          gap: 10px;
          align-items: center;
        }
        input, select {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #444;
          background: #2a2a3a;
          color: white;
        }
        button {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          background: #8b5cf6;
          color: white;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .remove-button {
          background: #ef4444;
          margin-left: 10px;
          padding: 4px 8px;
          font-size: 12px;
        }
        .badge-list ul {
          list-style: none;
          padding: 0;
        }
        .badge-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #333;
        }
        .status-message {
          margin-top: 15px;
          padding: 10px;
          background: #27272f;
          border-radius: 4px;
        }
        .resolved-id {
          font-size: 12px;
          color: #666;
          margin-bottom: 10px;
          padding: 4px 8px;
          background: #27272f;
          border-radius: 4px;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default BadgeManager; 