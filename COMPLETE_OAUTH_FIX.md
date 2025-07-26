# Complete Google OAuth Fix for Your Deployment Setup

## 🔍 **Your Current Deployment Architecture**

Based on your screenshots, you have:
- **Backend**: `https://personal-productivity-tracker.onrender.com` (Render)
- **Frontend**: `https://productivity-tracker-lh89.vercel.app` (Vercel)
- **Firebase Project**: `productivity-tracker-f6149`

## 🚨 **The OAuth Issue**

Google OAuth requires **EXACT URL matching** between:
1. Your deployed frontend URLs
2. Your Firebase project authorized domains
3. Your Google Cloud Console OAuth configuration

## 🛠️ **SOLUTION: Configure Google Cloud Console**

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Select project: **productivity-tracker-f6149**
3. Go to **APIs & Services** → **Credentials**

### Step 2: Find Your OAuth 2.0 Client ID
Look for a client ID that starts with: `640819888037`
(This matches your Firebase `messagingSenderId`)

### Step 3: Add ALL Your URLs

#### **Authorized JavaScript Origins:**
```
http://localhost:3000
http://127.0.0.1:3000
http://localhost:5173
http://localhost:5174
https://productivity-tracker-lh89.vercel.app
https://productivity-tracker-lh89-git-main-enock-mugishas-projects.vercel.app
https://productivity-tracker-lh89-alwmbjeom-enock-mugishas-projects.vercel.app
https://productivity-tracker-lh89-jk3rrxjp8-enock-mugishas-projects.vercel.app
https://productivity-tracker-f6149.firebaseapp.com
https://productivity-tracker-f6149.web.app
```

#### **Authorized Redirect URIs:**
```
http://localhost:3000
http://127.0.0.1:3000
http://localhost:5173
http://localhost:5174
https://productivity-tracker-lh89.vercel.app
https://productivity-tracker-lh89-git-main-enock-mugishas-projects.vercel.app
https://productivity-tracker-lh89-alwmbjeom-enock-mugishas-projects.vercel.app
https://productivity-tracker-lh89-jk3rrxjp8-enock-mugishas-projects.vercel.app
https://productivity-tracker-f6149.firebaseapp.com/__/auth/handler
https://productivity-tracker-f6149.web.app/__/auth/handler
```

### Step 4: Configure Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select: **productivity-tracker-f6149**
3. Go to **Authentication** → **Sign-in method** → **Google**
4. Add these domains to **Authorized domains**:
```
productivity-tracker-lh89.vercel.app
localhost
127.0.0.1
```

## 🔧 **Configure Your Vercel Environment Variables**

In your Vercel dashboard, set these environment variables:

```
VITE_API_URL=https://personal-productivity-tracker.onrender.com
NODE_ENV=production
VITE_FIREBASE_API_KEY=AIzaSyC0EADqph6RwvG_SBMrlRct3UeAVcSSemM
VITE_FIREBASE_AUTH_DOMAIN=productivity-tracker-f6149.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=productivity-tracker-f6149
VITE_FIREBASE_STORAGE_BUCKET=productivity-tracker-f6149.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=640819888037
VITE_FIREBASE_APP_ID=1:640819888037:web:c7b086dad47424086e724c
VITE_FIREBASE_MEASUREMENT_ID=G-PFFGHFZB7B
```

## 🚀 **Alternative: Deploy to Firebase Hosting (Recommended)**

Since you're using Firebase for auth, deploying to Firebase Hosting eliminates domain mismatch issues:

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Deploy your frontend
```bash
cd tracker
npm run build
firebase deploy
```

Your app will be available at:
- `https://productivity-tracker-f6149.web.app`
- `https://productivity-tracker-f6149.firebaseapp.com`

These domains are automatically authorized in your Firebase project!

## 📋 **Deployment Script Updates**

I've updated your build scripts. For Vercel:

### Frontend (`tracker/package.json`):
```json
{
  "scripts": {
    "build:vercel": "vite build",
    "build:firebase": "vite build && firebase deploy"
  }
}
```

## 🧪 **Testing Steps**

1. **Deploy with new configuration**
2. **Wait 2-3 minutes** for Google OAuth settings to propagate
3. **Clear browser cache** completely
4. **Try Google sign-in** on your deployed app

## ⚠️ **Common Issues & Solutions**

### Issue: "redirect_uri_mismatch" still appears
**Solution**: Double-check that your Vercel deployment URL exactly matches what you entered in Google Cloud Console

### Issue: CORS errors
**Solution**: Your backend CORS is already configured correctly for your Vercel URLs

### Issue: Firebase project mismatch
**Solution**: Ensure all three places use the same project ID:
- `tracker/.env.production` → `productivity-tracker-f6149`
- `backend/config/serviceAccount.json` → `productivity-tracker-f6149`
- Google Cloud Console → `productivity-tracker-f6149`

## 🎯 **Recommended Architecture**

For the cleanest setup, I recommend:

1. **Frontend**: Firebase Hosting (`productivity-tracker-f6149.web.app`)
2. **Backend**: Keep on Render (`personal-productivity-tracker.onrender.com`)
3. **Auth**: Firebase Auth (automatically configured for Firebase Hosting)

This eliminates all domain mismatch issues and provides the best integration with Firebase services.

## 📞 **Quick Fix Checklist**

- [ ] Add all Vercel URLs to Google Cloud Console OAuth settings
- [ ] Add Vercel domain to Firebase authorized domains
- [ ] Set correct environment variables in Vercel
- [ ] Wait 2-3 minutes for changes to propagate
- [ ] Clear browser cache and test

The OAuth error should be resolved once all domains are properly authorized!
