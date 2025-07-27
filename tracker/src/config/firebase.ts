
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { clearFirebaseAuthData } from '../utils/clearFirebaseData';

// Firebase configuration - matching the productive-30143 project
// Based on the configuration shown in Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCfiBMivwTrpwgIPxgpXtByjaJjhO2XBtQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "productive-30143.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "productive-30143",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "productive-30143.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "712240515591",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:712240515591:web:084ce1cc16cbf3193438a2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-RM3XHK5BFS"
};

// Debug: Log the Firebase configuration being used
console.log('🔥 Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...'
});

// Clear any old authentication data from previous project configurations
const expectedProjectId = 'productive-30143';
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
