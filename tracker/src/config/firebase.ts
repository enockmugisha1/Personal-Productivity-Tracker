
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { clearFirebaseAuthData } from '../utils/clearFirebaseData';

// Firebase configuration - matching the personal-productivity-tracker project
// Based on the configuration shown in Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC0EADqph6RwvG_SBMrlRct3UeAVcSSemM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "personal-productivity-tracker.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "personal-productivity-tracker",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "personal-productivity-tracker.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "640819888037",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:640819888037:web:cc700860d47424086e724c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PFFGHFZB7B"
};

// Debug: Log the Firebase configuration being used
console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...'
});

// Clear any old authentication data from previous project configurations
const expectedProjectId = 'personal-productivity-tracker';
if (firebaseConfig.projectId === expectedProjectId) {
  // Use utility function to clear old Firebase data
  const cleared = clearFirebaseAuthData();
  if (cleared.localStorageCleared > 0 || cleared.sessionStorageCleared > 0) {
    console.log('🧹 Cleared old Firebase authentication data for project migration');
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
