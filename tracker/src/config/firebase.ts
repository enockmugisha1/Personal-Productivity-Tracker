
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
   
        apiKey: "AIzaSyC_9TZryjw29yXhd9-7d6jVA3qbfbiZrJA",
        authDomain: "productivity-tracker-f6149.firebaseapp.com",
        projectId: "productivity-tracker-f6149",
        storageBucket: "productivity-tracker-f6149.firebasestorage.app",
        messagingSenderId: "215567624556",
        appId: "1:215567624556:web:fd0a07d35ae022cfad6b49",
        measurementId: "G-C2WT3LZF5E"
    
      
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app; 
