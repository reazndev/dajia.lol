import { supabase } from '../supabaseClient';

// lists all files in a storage bucket
const listBucketFiles = async (bucketName) => {
  const { data, error } = await supabase.storage.from(bucketName).list();
  if (error) {
    console.error(`Error listing files in ${bucketName}:`, error);
    return { error };
  }
  return { files: data };
};

// Extracts filename from a Supabase storage URL

const extractFilename = (url) => {
  if (!url) return null;
  // Try to extract the filename from the URL
  // Handle both full URLs and relative paths
  const matches = url.match(/(?:\/([^/]+))?$/);
  return matches ? matches[1] : null;
};

// Gets all used files from profiles and templates
 
const getUsedFiles = async () => {
  // Get all profile images and background images from profiles
  const { data: profileFiles, error: profileError } = await supabase
    .from('profile_appearance')
    .select('profile_image, background_image');

  if (profileError) {
    console.error('Error fetching profile files:', profileError);
    return { error: profileError };
  }

  // Get all profile images, background images, and preview images from templates
  const { data: templateFiles, error: templateError } = await supabase
    .from('templates')
    .select('profile_image, background_image, preview_image');

  if (templateError) {
    console.error('Error fetching template files:', templateError);
    return { error: templateError };
  }

  // Combine all used files into a Set
  const usedFiles = new Set();

  // Extract filenames from URLs for profiles
  profileFiles.forEach(profile => {
    const profileImage = extractFilename(profile.profile_image);
    const bgImage = extractFilename(profile.background_image);
    
    if (profileImage) usedFiles.add(profileImage);
    if (bgImage) usedFiles.add(bgImage);
  });

  // Extract filenames from URLs for templates
  templateFiles.forEach(template => {
    const profileImage = extractFilename(template.profile_image);
    const bgImage = extractFilename(template.background_image);
    const previewImage = extractFilename(template.preview_image);
    
    if (profileImage) usedFiles.add(profileImage);
    if (bgImage) usedFiles.add(bgImage);
    if (previewImage) usedFiles.add(previewImage);
  });

  console.log('Found used files:', Array.from(usedFiles));
  return { usedFiles: Array.from(usedFiles) };
};

// deletes unused files from storage buckets

export const cleanupUnusedFiles = async () => {
  try {
    // Get all used files
    const { usedFiles, error: usedFilesError } = await getUsedFiles();
    if (usedFilesError) return { error: usedFilesError };

    const usedFilesSet = new Set(usedFiles);
    const deletedFiles = [];
    let errorFiles = [];

    // Clean up avatars bucket
    const { files: avatarFiles, error: avatarError } = await listBucketFiles('avatars');
    if (avatarError) return { error: avatarError };

    // Clean up backgrounds bucket
    const { files: bgFiles, error: bgError } = await listBucketFiles('backgrounds');
    if (bgError) return { error: bgError };

    console.log('Avatar files found:', avatarFiles);
    console.log('Background files found:', bgFiles);

    // Delete unused avatar files
    for (const file of avatarFiles || []) {
      // Supabase storage list returns objects with 'name' property
      const fileName = file.name;
      console.log('Checking avatar file:', fileName, 'Used:', usedFilesSet.has(fileName));
      
      if (!usedFilesSet.has(fileName)) {
        console.log('Attempting to delete avatar file:', fileName);
        const { error } = await supabase.storage
          .from('avatars')
          .remove([fileName]);
        
        if (error) {
          console.error(`Error deleting avatar file ${fileName}:`, error);
          errorFiles.push({ bucket: 'avatars', file: fileName, error });
        } else {
          console.log('Successfully deleted avatar file:', fileName);
          deletedFiles.push({ bucket: 'avatars', file: fileName });
        }
      }
    }

    // Delete unused background files
    for (const file of bgFiles || []) {
      const fileName = file.name;
      console.log('Checking background file:', fileName, 'Used:', usedFilesSet.has(fileName));
      
      if (!usedFilesSet.has(fileName)) {
        console.log('Attempting to delete background file:', fileName);
        const { error } = await supabase.storage
          .from('backgrounds')
          .remove([fileName]);
        
        if (error) {
          console.error(`Error deleting background file ${fileName}:`, error);
          errorFiles.push({ bucket: 'backgrounds', file: fileName, error });
        } else {
          console.log('Successfully deleted background file:', fileName);
          deletedFiles.push({ bucket: 'backgrounds', file: fileName });
        }
      }
    }

    return {
      success: true,
      deletedFiles,
      errorFiles,
      stats: {
        totalDeleted: deletedFiles.length,
        totalErrors: errorFiles.length,
        avatarsDeleted: deletedFiles.filter(f => f.bucket === 'avatars').length,
        backgroundsDeleted: deletedFiles.filter(f => f.bucket === 'backgrounds').length
      }
    };
  } catch (error) {
    console.error('Error in cleanupUnusedFiles:', error);
    return { error };
  }
}; 