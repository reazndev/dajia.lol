import { createBadgesTable, addEarlySupporterBadges } from './createBadgesTable';
import { createAdminsTable } from './createAdminsTable';
import { setupFirstAdmin } from './setupFirstAdmin';

// dont run this anymore, only needs to be run once !!


export const initBadgesAndAdmins = async () => {
  try {
    console.log('Initializing badges and admin system...');
    
    // Step 1: Create badges table
    console.log('Step 1: Creating badges table');
    const badgesTableResult = await createBadgesTable();
    if (!badgesTableResult.success) {
      console.error('Error creating badges table:', badgesTableResult.error);
      return { error: badgesTableResult.error, step: 'create_badges_table' };
    }
    
    // Step 2: Create admins table
    console.log('Step 2: Creating admins table');
    const adminsTableResult = await createAdminsTable();
    if (!adminsTableResult.success) {
      console.error('Error creating admins table:', adminsTableResult.error);
      return { error: adminsTableResult.error, step: 'create_admins_table' };
    }
    
    // Step 3: Set up first admin
    console.log('Step 3: Setting up first admin');
    const adminSetupResult = await setupFirstAdmin();
    if (!adminSetupResult.success) {
      console.error('Error setting up first admin:', adminSetupResult.error);
      return { error: adminSetupResult.error, step: 'setup_first_admin' };
    }
    
    // Step 4: Award early supporter badges
    console.log('Step 4: Awarding early supporter badges');
    const earlySupporterResult = await addEarlySupporterBadges();
    if (!earlySupporterResult.success) {
      console.error('Error awarding early supporter badges:', earlySupporterResult.error);
      return { error: earlySupporterResult.error, step: 'award_early_supporters' };
    }
    
    console.log('Badges and admin initialization complete!');
    return { 
      success: true, 
      message: 'Badges and admin initialization complete!',
      results: {
        badgesTable: badgesTableResult,
        adminsTable: adminsTableResult,
        firstAdmin: adminSetupResult,
        earlySupporters: earlySupporterResult
      }
    };
  } catch (error) {
    console.error('Error in initBadgesAndAdmins:', error);
    return { error, step: 'general' };
  }
};

// Add to window for browser console use
window.initBadgesAndAdmins = async () => {
  console.log('Starting badges and admin initialization...');
  const result = await initBadgesAndAdmins();
  console.log('Badges and Admin Init Result:', result);
  return result;
}; 