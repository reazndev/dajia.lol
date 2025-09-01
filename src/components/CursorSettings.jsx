import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import '../styles/CursorSettings.css';
import SettingsSwitch from './SettingsSwitch';
import { FaTrash } from 'react-icons/fa';

const UploadModal = ({ onClose, onUpload, uploading, error }) => {
  const [cursorName, setCursorName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpload(cursorName, selectedFile);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        onError('File size must be less than 2MB');
        return;
      }
      setSelectedFile(file);
      if (!cursorName) {
        // Auto-generate a name from the file name if no name is set
        const fileName = file.name.split('.')[0];
        setCursorName(fileName);
      }
    }
  };

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Upload New Cursor</h3>
          <button 
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Cursor Name</label>
            <input
              type="text"
              placeholder="Enter cursor name"
              value={cursorName}
              onChange={(e) => setCursorName(e.target.value)}
              className="cursor-name-input"
            />
          </div>

          <div className="form-group">
            <label>Cursor Image</label>
            <div className="file-upload-container">
              <input
                type="file"
                onChange={handleFileSelect}
                accept="image/*"
                className="file-input"
                id="cursor-file-input"
              />
              <label htmlFor="cursor-file-input" className="file-input-label">
                {selectedFile ? selectedFile.name : 'Choose a file'}
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <div className="modal-footer">
            <button 
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={uploading || !selectedFile || !cursorName.trim()}
              className="upload-button"
            >
              {uploading ? 'Uploading...' : 'Save Cursor'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const CursorSettings = ({ compact = false }) => {
  const [cursors, setCursors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [cursorEffects, setCursorEffects] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    fetchCursors();
    fetchCursorEffects();
  }, []);

  const fetchCursorEffects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profile_appearance')
        .select('cursor_effects')
        .eq('profile_id', user.id)
        .single();

      if (error) throw error;
      setCursorEffects(data?.cursor_effects || []);
    } catch (error) {
      console.error('Error fetching cursor effects:', error);
      setError('Failed to load cursor effects');
    }
  };

  const toggleCursorEffect = async (effect) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newEffects = cursorEffects.includes(effect)
        ? cursorEffects.filter(e => e !== effect)
        : [...cursorEffects, effect];

      const { error } = await supabase
        .from('profile_appearance')
        .update({ cursor_effects: newEffects })
        .eq('profile_id', user.id);

      if (error) throw error;
      setCursorEffects(newEffects);
    } catch (error) {
      console.error('Error updating cursor effects:', error);
      setError('Failed to update cursor effects');
    }
  };

  const fetchCursors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cursors')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCursors(data || []);
    } catch (error) {
      console.error('Error fetching cursors:', error);
      setError('Failed to load cursors');
    }
  };

  const handleUpload = async (cursorName, selectedFile) => {
    setError('');
    
    try {
      if (!cursorName.trim()) {
        setError('Please enter a cursor name');
        return;
      }

      if (!selectedFile) {
        setError('Please select a file');
        return;
      }

      if (!selectedFile.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `cursors/${user.id}/${fileName}`;

      // Upload the file
      const { error: uploadError, data } = await supabase.storage
        .from('cursors')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please contact support.');
        }
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      if (!data?.path) {
        throw new Error('Upload succeeded but no file path returned');
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('cursors')
        .getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error('Failed to generate public URL for uploaded file');
      }

      // Save to database
      const { error: dbError } = await supabase
        .from('cursors')
        .insert({
          profile_id: user.id,
          cursor_name: cursorName,
          cursor_url: publicUrl,
          file_path: filePath
        });

      if (dbError) {
        // Clean up the uploaded file if database insert fails
        await supabase.storage
          .from('cursors')
          .remove([filePath]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      await fetchCursors();
      setShowUploadForm(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Failed to upload cursor');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const setActiveCursor = async (cursorId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the current cursor to check if we're clicking on an already active one
      const { data: currentCursor } = await supabase
        .from('cursors')
        .select('is_active')
        .eq('id', cursorId)
        .single();

      // If the cursor is already active, deactivate it
      if (currentCursor?.is_active) {
        await supabase
          .from('cursors')
          .update({ is_active: false })
          .eq('id', cursorId);
      } else {
        // First, set all cursors to inactive
        await supabase
          .from('cursors')
          .update({ is_active: false })
          .eq('profile_id', user.id);

        // Then set the selected cursor to active
        await supabase
          .from('cursors')
          .update({ is_active: true })
          .eq('id', cursorId);
      }

      await fetchCursors();
    } catch (error) {
      console.error('Error setting active cursor:', error);
      setError('Failed to set active cursor');
    }
  };

  const deleteCursor = async (cursorId, cursorUrl) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the cursor data to get the file path
      const { data: cursor, error: fetchError } = await supabase
        .from('cursors')
        .select('file_path')
        .eq('id', cursorId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage if we have a file path
      if (cursor?.file_path) {
        try {
          await supabase.storage
            .from('cursors')
            .remove([cursor.file_path]);
        } catch (storageError) {
          console.warn('Could not delete cursor from storage:', storageError);
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('cursors')
        .delete()
        .eq('id', cursorId);

      if (deleteError) throw deleteError;

      await fetchCursors();
    } catch (error) {
      console.error('Error deleting cursor:', error);
      setError('Failed to delete cursor');
    }
  };

  return (
    <div className={`cursor-settings ${compact ? 'compact' : ''}`}>
      {!compact && <h2>Cursor Settings</h2>}
      
      <SettingsSwitch
        checked={cursorEffects.includes('particles')}
        onChange={() => toggleCursorEffect('particles')}
        label="Particle Trail"
        size="large"
      />

      <div className="custom-cursor-section">
        {!compact && <h3>Custom Cursors</h3>}
        
        <button 
          onClick={() => setShowUploadForm(true)}
          className="upload-button"
        >
          Upload New Cursor
        </button>

        {error && <div className="error-message">{error}</div>}

        <div className="cursors-list">
          {cursors.map(cursor => (
            <div 
              key={cursor.id} 
              className={`cursor-item ${cursor.is_active ? 'active' : ''}`}
            >
              <img 
                src={cursor.cursor_url} 
                alt={cursor.cursor_name}
                className="cursor-preview"
              />
              <span className="cursor-name">{cursor.cursor_name}</span>
              <div className="cursor-actions">
                <button
                  onClick={() => setActiveCursor(cursor.id)}
                  className={`set-active-button ${cursor.is_active ? 'active' : ''}`}
                >
                  {cursor.is_active ? 'Active' : 'Set Active'}
                </button>
                <button
                  onClick={() => deleteCursor(cursor.id, cursor.cursor_url)}
                  className="delete-button"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showUploadForm && (
        <UploadModal
          onClose={() => {
            setShowUploadForm(false);
            setError('');
          }}
          onUpload={handleUpload}
          uploading={uploading}
          error={error}
        />
      )}
    </div>
  );
};


export default CursorSettings; 