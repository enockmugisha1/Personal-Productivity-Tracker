
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace these with your actual Firebase config values
// To get these values:
// 1. Go to Firebase Console (https://console.firebase.google.com/)
// 2. Select your project
// 3. Click the gear icon next to "Project Overview"
// 4. Click "Project settings"
// 5. Scroll down to "Your apps" section
// 6. Click the web icon (</>)
// 7. Register your app if you haven't already
// 8. Copy the firebaseConfig object
const firebaseConfig = {
        apiKey: "AIzaSyC0EADqph6RwvG_SBMrlRct3UeAVcSSemM",
        authDomain: "personal-productivity-tracker.firebaseapp.com",
        projectId: "personal-productivity-tracker",
        storageBucket: "personal-productivity-tracker.firebasestorage.app",
        messagingSenderId: "640819888037",
        appId: "1:640819888037:web:c7b086dad47424086e724c",
        measurementId: "G-PFFGHFZB7B"
      };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 
