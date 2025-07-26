# 🔑 Get Service Account for personal-productivity-tracker

## Step 1: Get the Service Account JSON

1. **Go to**: https://console.firebase.google.com/project/personal-productivity-tracker/settings/serviceaccounts/adminsdk

2. **Click "Generate new private key"**

3. **Download the JSON file**

4. **Replace the content of `backend/config/serviceAccount.json` with the downloaded content**

## Step 2: Verify the JSON Structure

The downloaded file should look like this:

```json
{
  "type": "service_account",
  "project_id": "personal-productivity-tracker",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@personal-productivity-tracker.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40personal-productivity-tracker.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## Step 3: Update Vercel Environment Variables

Set these in your Vercel dashboard:

```
VITE_API_URL=https://personal-productivity-tracker.onrender.com
NODE_ENV=production
VITE_FIREBASE_API_KEY=AIzaSyC0EADqph6RwvG_SBMrlRct3UeAVcSSemM
VITE_FIREBASE_AUTH_DOMAIN=personal-productivity-tracker.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=personal-productivity-tracker
VITE_FIREBASE_STORAGE_BUCKET=personal-productivity-tracker.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=640819888037
VITE_FIREBASE_APP_ID=1:640819888037:web:cc700860d47424086e724c
VITE_FIREBASE_MEASUREMENT_ID=G-PFFGHFZB7B
```

## Step 4: Configure Google OAuth

1. **Go to**: https://console.cloud.google.com/apis/credentials?project=personal-productivity-tracker

2. **Find your OAuth 2.0 Client ID**

3. **Add these URLs to "Authorized JavaScript origins":**
   - http://localhost:3000
   - http://127.0.0.1:3000
   - http://localhost:5173
   - http://localhost:5174
   - https://productivity-tracker-lh89.vercel.app
   - All your Vercel preview URLs

4. **Add the same URLs to "Authorized redirect URIs"**

## Step 5: Configure Firebase Authorized Domains

1. **Go to**: https://console.firebase.google.com/project/personal-productivity-tracker/authentication/settings

2. **Add these domains:**
   - localhost
   - 127.0.0.1
   - productivity-tracker-lh89.vercel.app

Once you complete these steps, everything should be aligned!
