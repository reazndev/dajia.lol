import React, { useState, useRef } from 'react';
import { uploadImage } from '../utils/storageHelpers';
import './ImageUploader.css';

/**
 * A reusable image uploader component
 * @param {Object} props - Component props
 * @param {string} props.bucketName - The Supabase storage bucket name ('avatars' or 'backgrounds')
 * @param {string} props.userId - The user's ID for generating file paths
 * @param {function} props.onUploadSuccess - Callback that receives the public URL after successful upload
 * @param {function} props.onUploadError - Callback that receives the error after failed upload
 * @param {string} props.acceptedFileTypes - File input accept attribute (e.g., "image/*")
 * @param {number} props.maxSizeMB - Maximum file size in MB
 * @param {string} props.buttonText - Text for the upload button
 * @param {string} props.initialPreview - Initial preview image URL
 */
const ImageUploader = ({
  bucketName,
  userId,
  onUploadSuccess,
  onUploadError,
  acceptedFileTypes = "image/*",
  maxSizeMB = 5,
  buttonText = "Upload Icon",
  initialPreview = null
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialPreview);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  const handleFileChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Validate file type
      if (!file.type.match(acceptedFileTypes.replace('*', ''))) {
        throw new Error(`Only ${acceptedFileTypes} files are allowed`);
      }
      
      // Validate file size
      if (file.size > maxSizeBytes) {
        throw new Error(`File size must be less than ${maxSizeMB}MB`);
      }
      
      // Create local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
      
      setSelectedFile(file);
      setErrorMessage(null);
    } catch (error) {
      console.error('File selection error:', error);
      setErrorMessage(error.message);
      
      if (onUploadError) {
        onUploadError(error);
      }
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Upload to Supabase
      const publicUrl = await uploadImage(bucketName, selectedFile, userId);
      
      // Call success callback with URL
      if (onUploadSuccess) {
        onUploadSuccess(publicUrl);
      }
      
      // Clear selected file after successful upload
      setSelectedFile(null);
    } catch (error) {
      console.error('Image upload error:', error);
      setErrorMessage(error.message);
      
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="image-uploader">
      <div className="image-upload-container">
        {previewUrl && (
          <div className="image-preview">
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '200px', 
                objectFit: 'contain'
              }} 
            />
          </div>
        )}
        
        <div className="upload-controls">
          <input
            type="file"
            ref={fileInputRef}
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            disabled={isLoading}
            id="file-input"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0,
              pointerEvents: 'none',
              height: 0,
              width: 0
            }}
          />
          <label 
            htmlFor="file-input" 
            className="btn-primary"
            onClick={handleButtonClick}
            style={{ cursor: 'pointer' }}
          >
            {buttonText}
          </label>
          
          <div className="file-info">
            Max size: {maxSizeMB}MB | Accepted formats: {acceptedFileTypes.replace('*', 'all')}
          </div>
          
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
          
          {selectedFile && (
            <button
              onClick={handleSave}
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader; 