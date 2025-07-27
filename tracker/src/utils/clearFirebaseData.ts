/**
 * Utility to clear Firebase authentication data from localStorage
 * This helps resolve project ID mismatches by clearing cached tokens
 */

export const clearFirebaseAuthData = () => {
  const keysToRemove: string[] = [];
  
  // Find all localStorage keys related to Firebase
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.includes('firebase') ||
      key.includes('personal-productivity-tracker') ||
      key.includes('productivity-tracker') ||
      key.includes('productive-30143') ||
      key.startsWith('CookieConsentPolicy') ||
      key.startsWith('firebase:') ||
      key.includes('authUser')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all Firebase-related keys
  keysToRemove.forEach(key => {
    console.log(`🧹 Clearing Firebase data: ${key}`);
    localStorage.removeItem(key);
  });
  
  // Also clear sessionStorage
  const sessionKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.includes('firebase') ||
      key.includes('personal-productivity-tracker') ||
      key.includes('productivity-tracker') ||
      key.includes('productive-30143')
    )) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    console.log(`🧹 Clearing Firebase session data: ${key}`);
    sessionStorage.removeItem(key);
  });
  
  console.log(`✅ Cleared ${keysToRemove.length} localStorage items and ${sessionKeysToRemove.length} sessionStorage items`);
  
  return {
    localStorageCleared: keysToRemove.length,
    sessionStorageCleared: sessionKeysToRemove.length
  };
};

/**
 * Force clear all authentication state and reload the page
 */
export const forceResetAuth = async() => {
  try {
    // Clear Firebase data
    clearFirebaseAuthData();
    
    // Clear any other auth-related data
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    console.log('🔄 Reloading page to complete auth reset...');
    
    // Force reload the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } catch (error) {
    console.error('Error during force auth reset:', error);
  }
};
