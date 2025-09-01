const handleSocialLinksUpdate = async (links, orderedPlatforms) => {
  try {
    console.log("Updating social links:", links);
    console.log("Ordered platforms:", orderedPlatforms);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // First, delete all existing links
    const { error: deleteError } = await supabase
      .from('social_links')
      .delete()
      .eq('profile_id', user.id);

    if (deleteError) throw deleteError;

    // Then insert all links with their order
    const socialLinksToInsert = orderedPlatforms
      .filter(platform => links[platform])
      .map((platform, index) => {
        const isCustom = platform.startsWith('custom_');
        return {
          profile_id: user.id,
          platform: platform,
          url: links[platform],
          display_order: index,
          is_custom: isCustom,
          icon_url: isCustom && customIcons[platform] ? customIcons[platform] : null
        };
      });

    console.log("Inserting social links:", socialLinksToInsert);

    if (socialLinksToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('social_links')
        .insert(socialLinksToInsert);

      if (insertError) {
        console.error("Error inserting social links:", insertError);
        throw insertError;
      }
    }

    // Update the social links state
    setSocialLinks(links);
    
    // Update custom icons state if there are any custom platforms
    const newCustomIcons = {};
    orderedPlatforms
      .filter(platform => platform.startsWith('custom_'))
      .forEach(platform => {
        if (customIcons[platform]) {
          newCustomIcons[platform] = customIcons[platform];
        }
      });
    setCustomIcons(newCustomIcons);
    
    // Show success message
    setSuccessMessage('Social links updated successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);

    // Clear profile cache to ensure changes are reflected
    await clearProfileCache(username);
  } catch (error) {
    console.error('Error updating social links:', error);
    setErrorMessage('Failed to update social links: ' + error.message);
  }
}; 