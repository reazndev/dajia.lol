import { supabase } from '../supabaseClient';

/**
 * Upload an image to Supabase Storage
 * @param {string} bucketName - Name of the bucket ('avatars', 'backgrounds', or 'custom-icons')
 * @param {File} file - The file object to upload
 * @param {string} userId - The user's ID for creating a unique file path
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export const uploadImage = async (bucketName, file, userId) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Validate file type is an image
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }
    
    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }
    
    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}.${fileExt}`;
    
    // Ensure clean path with no double slashes and consistent format
    const filePath = (bucketName === 'custom-icons' ? `${userId}/${fileName}` : fileName).replace(/\/+/g, '/');

    console.log(`[uploadImage] Uploading file to path: ${filePath}`);

    // Upload file to the specified bucket
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Clean up the public URL to ensure no double slashes except after protocol
    const cleanUrl = publicUrl.replace(/([^:])\/+/g, '$1/');
    console.log(`[uploadImage] Generated clean URL: ${cleanUrl}`);

    // Verify the URL is accessible
    try {
      const response = await fetch(cleanUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`URL verification failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[uploadImage] URL verification failed:', error);
      throw new Error('Failed to verify uploaded file accessibility');
    }

    return cleanUrl;
  } catch (error) {
    console.error(`Error in uploadImage (${bucketName}):`, error);
    throw error;
  }
};

/**
 * Upload a custom icon for social links
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} - Public URL of the uploaded custom icon
 */
export const uploadCustomIcon = async (file, userId) => {
  try {
    // Upload to the custom-icons bucket
    const publicUrl = await uploadImage('custom-icons', file, userId);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadCustomIcon:', error);
    throw error;
  }
};

/**
 * Upload a profile image and update the user's profile
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} - Public URL of the uploaded profile image
 */
export const uploadProfileImage = async (file, userId) => {
  try {
    const publicUrl = await uploadImage('avatars', file, userId);
    
    // Update the user's profile with the new image URL
    const { error: updateError } = await supabase
      .from('profile_appearance')
      .update({ 
        profile_image: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', userId);

    if (updateError) {
      console.error('Error updating profile with new image:', updateError);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadProfileImage:', error);
    throw error;
  }
};

/**
 * Upload a background image and update the user's profile
 * @param {File} file - The image file to upload
 * @param {string} userId - The user's ID
 * @returns {Promise<string>} - Public URL of the uploaded background image
 */
export const uploadBackgroundImage = async (file, userId) => {
  try {
    const publicUrl = await uploadImage('backgrounds', file, userId);
    
    // Update the user's profile with the new background URL
    const { error: updateError } = await supabase
      .from('profile_appearance')
      .update({ 
        background_image: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('profile_id', userId);

    if (updateError) {
      console.error('Error updating profile with new background:', updateError);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadBackgroundImage:', error);
    throw error;
  }
};

/**
 * Delete an image from Supabase Storage
 * @param {string} bucketName - Name of the bucket
 * @param {string} url - The public URL of the image to delete
 * @returns {Promise<void>}
 */
export const deleteImage = async (bucketName, url) => {
  try {
    if (!url) return;
    
    // Extract the file path from the URL
    const urlParts = url.split('/');
    const filePath = urlParts[urlParts.length - 1];
    
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error in deleteImage (${bucketName}):`, error);
    throw error;
  }
}; 