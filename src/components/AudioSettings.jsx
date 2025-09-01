import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaGripVertical, FaTrash, FaPlay, FaPause } from 'react-icons/fa';
import SettingsSwitch from './SettingsSwitch';
import SettingsSlider from './SettingsSlider';
import './AudioSettings.css';

const MAX_TRACKS = 3; // Maximum number of tracks allowed per user

const UploadModal = ({ onClose, onUpload, uploading, error }) => {
  const [audioName, setAudioName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpload(audioName, selectedFile);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onError('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('audio/')) {
        onError('Please upload a valid audio file');
        return;
      }
      setSelectedFile(file);
      if (!audioName) {
        // Auto-generate a name from the file name if no name is set
        const fileName = file.name.split('.')[0];
        setAudioName(fileName);
      }
    }
  };

  return createPortal(
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Upload New Audio Track</h3>
          <button 
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Track Name</label>
            <input
              type="text"
              placeholder="Enter track name"
              value={audioName}
              onChange={(e) => setAudioName(e.target.value)}
              className="track-name-input"
            />
          </div>

          <div className="form-group">
            <label>Audio File</label>
            <div className="file-upload-container">
              <input
                type="file"
                onChange={handleFileSelect}
                accept="audio/*"
                className="file-input"
                id="audio-file-input"
              />
              <label htmlFor="audio-file-input" className="file-input-label">
                {selectedFile ? selectedFile.name : 'Choose a file'}
              </label>
            </div>
            <small className="help-text">Max file size: 5MB</small>
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
              disabled={uploading || !selectedFile || !audioName.trim()}
              className="upload-button"
            >
              {uploading ? 'Uploading...' : 'Save Track'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const AudioSettings = () => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [defaultVolume, setDefaultVolume] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchAudioSettings();
  }, []);

  const fetchAudioSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch audio settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('audio_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      if (settingsData) {
        setAudioEnabled(settingsData.audio_enabled);
        setDefaultVolume(settingsData.default_volume);
      } else {
        // Create default settings if none exist
        const { error: createError } = await supabase
          .from('audio_settings')
          .insert([{
            user_id: user.id,
            audio_enabled: true,
            default_volume: 0.5
          }]);

        if (createError) throw createError;
      }

      // Fetch audio tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('profile_audio_tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order');

      if (tracksError) throw tracksError;

      setAudioTracks(tracksData || []);
    } catch (err) {
      console.error('Error fetching audio settings:', err);
      setError('Error loading audio settings');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!audioFile || !audioName.trim()) {
        setError('Please provide both an audio name and file');
        return;
      }

      if (audioTracks.length >= MAX_TRACKS) {
        setError(`You can only have up to ${MAX_TRACKS} tracks`);
        return;
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload new audio file
      const fileName = `${user.id}/${Date.now()}-${audioFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile_audio')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_audio')
        .getPublicUrl(fileName);

      // Insert new audio track
      const { data: trackData, error: trackError } = await supabase
        .from('profile_audio_tracks')
        .insert([{
          user_id: user.id,
          name: audioName,
          url: publicUrl,
          display_order: audioTracks.length,
          is_active: audioTracks.length === 0 // Make active if it's the first track
        }])
        .select()
        .single();

      if (trackError) throw trackError;

      setAudioTracks([...audioTracks, trackData]);
      setAudioFile(null);
      setSelectedFileName('');
      setShowUploadForm(false);
      setAudioName('');
    } catch (err) {
      console.error('Error updating audio settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrack = async (trackId) => {
    try {
      const track = audioTracks.find(t => t.id === trackId);
      if (!track) return;

      // Get the file path from the URL
      const fileUrl = new URL(track.url);
      const filePath = fileUrl.pathname.split('/').pop();
      const { data: { user } } = await supabase.auth.getUser();

      // Delete the file from storage first
      const { error: storageError } = await supabase.storage
        .from('profile_audio')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with deletion even if storage deletion fails
      }

      // Delete the track from the database
      const { error: dbError } = await supabase
        .from('profile_audio_tracks')
        .delete()
        .eq('id', trackId);

      if (dbError) throw dbError;

      // Update local state
      setAudioTracks(audioTracks.filter(t => t.id !== trackId));

      // If we deleted the active track and there are other tracks, make the first one active
      if (track.is_active && audioTracks.length > 1) {
        const firstTrack = audioTracks.find(t => t.id !== trackId);
        if (firstTrack) {
          await handleSetActive(firstTrack.id);
        }
      }
    } catch (err) {
      console.error('Error deleting track:', err);
      setError('Failed to delete track');
    }
  };

  const handleSetActive = async (trackId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update all tracks to be inactive
      await supabase
        .from('profile_audio_tracks')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Set the selected track as active
      const { error } = await supabase
        .from('profile_audio_tracks')
        .update({ is_active: true })
        .eq('id', trackId);

      if (error) throw error;

      // Update local state
      setAudioTracks(audioTracks.map(track => ({
        ...track,
        is_active: track.id === trackId
      })));
    } catch (err) {
      console.error('Error setting active track:', err);
      setError('Failed to update active track');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(audioTracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display order for all tracks
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index
    }));

    setAudioTracks(updatedItems);

    try {
      // Update each track's display order individually to avoid conflicts
      for (const item of updatedItems) {
        const { error } = await supabase
          .from('profile_audio_tracks')
          .update({ display_order: item.display_order })
          .eq('id', item.id);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error updating track order:', err);
      setError('Failed to update track order');
      // Revert to original order
      setAudioTracks(audioTracks);
    }
  };

  const handleAudioSettingsChange = async (enabled = audioEnabled, volume = defaultVolume) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First check if settings exist for this user
      const { data: existingSettings } = await supabase
        .from('audio_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingSettings) {
        // Update existing settings
        const { error: updateError } = await supabase
          .from('audio_settings')
          .update({
            audio_enabled: enabled,
            default_volume: volume,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Insert new settings
        const { error: insertError } = await supabase
          .from('audio_settings')
          .insert([{
            user_id: user.id,
            audio_enabled: enabled,
            default_volume: volume
          }]);
        error = insertError;
      }

      if (error) throw error;

      setAudioEnabled(enabled);
      setDefaultVolume(volume);
    } catch (err) {
      console.error('Error updating audio settings:', err);
      setError('Failed to update audio settings');
    }
  };

  const togglePlay = (trackId) => {
    if (currentlyPlaying === trackId) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    } else {
      const track = audioTracks.find(t => t.id === trackId);
      if (track) {
        if (audioRef.current) {
          audioRef.current.src = track.url;
          audioRef.current.volume = defaultVolume;
          audioRef.current.play();
        }
        setCurrentlyPlaying(trackId);
      }
    }
  };

  const handleUpload = async (audioName, audioFile) => {
    try {
      if (!audioFile || !audioName.trim()) {
        setError('Please provide both an audio name and file');
        return;
      }

      if (audioTracks.length >= MAX_TRACKS) {
        setError(`You can only have up to ${MAX_TRACKS} tracks`);
        return;
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload new audio file
      const fileName = `${user.id}/${Date.now()}-${audioFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile_audio')
        .upload(fileName, audioFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_audio')
        .getPublicUrl(fileName);

      // Insert new audio track
      const { data: trackData, error: trackError } = await supabase
        .from('profile_audio_tracks')
        .insert([{
          user_id: user.id,
          name: audioName,
          url: publicUrl,
          display_order: audioTracks.length,
          is_active: audioTracks.length === 0 // Make active if it's the first track
        }])
        .select()
        .single();

      if (trackError) throw trackError;

      setAudioTracks([...audioTracks, trackData]);
      setShowUploadForm(false);
    } catch (err) {
      console.error('Error updating audio settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ 
        marginBottom: '0px',
        padding: '0px',
      }}>
        <SettingsSwitch
          checked={audioEnabled}
          onChange={(e) => {
            setAudioEnabled(e.target.checked);
            handleAudioSettingsChange(e.target.checked, defaultVolume);
          }}
          label="Enable Profile Audio"
          size="large"
          style={{
            fontSize: '16px',
            fontWeight: '500'
          }}
        />
      </div>

      {audioEnabled && (
        <>
          <div className="form-group">
            <SettingsSlider
              label="Default Volume"
              value={defaultVolume}
              onChange={(value) => setDefaultVolume(value)}
              min={0}
              max={1}
              step={0.01}
              isPercentage={true}
            />
          </div>

          <div className="audio-tracks-section">
            <h4>Audio Tracks ({audioTracks.length}/{MAX_TRACKS})</h4>
            <button 
              className="btn-primary"
              onClick={() => setShowUploadForm(true)}
              disabled={audioTracks.length >= MAX_TRACKS}
            >
              Add New Track
            </button>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="audio-tracks">
                {(provided) => (
                  <div
                    className="audio-tracks-list"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {audioTracks.map((track, index) => (
                      <Draggable
                        key={track.id}
                        draggableId={track.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            className={`audio-track-item ${track.is_active ? 'active' : ''}`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <button
                              className="play-button"
                              onClick={() => togglePlay(track.id)}
                            >
                              {currentlyPlaying === track.id ? <FaPause /> : <FaPlay />}
                            </button>
                            
                            <div className="track-info">
                              <div className="track-name">{track.name}</div>
                            </div>
                            
                            <div className="track-actions">
                              <button
                                className={`set-active-button ${track.is_active ? 'active' : ''}`}
                                onClick={() => handleSetActive(track.id)}
                                disabled={track.is_active}
                              >
                                {track.is_active ? 'Active' : 'Set Active'}
                              </button>
                              
                              <button
                                className="delete-button"
                                onClick={() => handleDeleteTrack(track.id)}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </>
      )}

      {showUploadForm && (
        <UploadModal
          onClose={() => {
            setShowUploadForm(false);
            setError('');
          }}
          onUpload={handleUpload}
          uploading={loading}
          error={error}
        />
      )}

      <audio ref={audioRef} onEnded={() => setCurrentlyPlaying(null)} />
    </div>
  );
};

export default AudioSettings; 