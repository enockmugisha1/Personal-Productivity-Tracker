# Google OAuth Redirect URI Mismatch Fix

## 🚨 Issue
**Error 400: redirect_uri_mismatch** - Your app cannot sign in with Google because the redirect URI doesn't match what's configured in Google Cloud Console.

## 🔍 Current Setup
- **Frontend runs on**: `http://localhost:3000` (changed from 5174)
- **Firebase Auth Domain**: `productivity-tracker-f6149.firebaseapp.com`
- **Firebase Project**: `productivity-tracker-f6149`

## 🛠️ **SOLUTION: Update Google Cloud Console**

### Step 1: Access Google Cloud Console
1. Go to: https://console.cloud.google.com/
2. Select project: **productivity-tracker-f6149**

### Step 2: Navigate to OAuth Settings
1. Go to **APIs & Services** → **Credentials**
2. Look for "OAuth 2.0 Client IDs" section
3. Find the client ID that starts with your project number (640819888037)
4. Click the **pencil icon** to edit

### Step 3: Add Authorized Redirect URIs
In the "Authorized redirect URIs" section, add these URLs:

```
http://localhost:3000
http://127.0.0.1:3000
http://localhost:5173
http://localhost:5174
https://productivity-tracker-f6149.firebaseapp.com/__/auth/handler
https://productivity-tracker-f6149.web.app/__/auth/handler
```

### Step 4: Add Authorized JavaScript Origins
In the "Authorized JavaScript origins" section, add:

```
http://localhost:3000
http://127.0.0.1:3000
http://localhost:5173
http://localhost:5174
https://productivity-tracker-f6149.firebaseapp.com
https://productivity-tracker-f6149.web.app
```

### Step 5: Save Changes
Click **Save** at the bottom of the form.

## 🚦 **Alternative: Quick Fix (If you can't access Google Console)**

If you don't have access to the Google Cloud Console, try these standard ports that are commonly pre-configured:

1. **Change your dev server port to 3000:**
   ```bash
   cd tracker
   npm run dev
   # Should now run on http://localhost:3000
   ```

2. **Or try port 5173 (Vite default):**
   Update `tracker/vite.config.mts`:
   ```typescript
   server: {
     port: 5173, // Vite default port
   }
   ```

## 🧪 **Testing the Fix**

1. **Restart your development server:**
   ```bash
   cd tracker
   npm run dev
   ```

2. **Clear browser cache:**
   - Open DevTools (F12)
   - Right-click refresh button → "Empty Cache and Hard Reload"

3. **Try Google Sign-in again**

## 📝 **Common Redirect URIs to Configure**

For a complete setup, your Google OAuth should include:

**Development:**
```
http://localhost:3000
http://localhost:5173
http://localhost:5174
http://127.0.0.1:3000
http://127.0.0.1:5173
http://127.0.0.1:5174
```

**Production:**
```
https://productivity-tracker-f6149.firebaseapp.com/__/auth/handler
https://productivity-tracker-f6149.web.app/__/auth/handler
https://your-custom-domain.com (if applicable)
```

## ⚠️ **Important Notes**

1. **Changes take a few minutes to propagate** - Wait 2-3 minutes after saving
2. **Use exact URLs** - No trailing slashes unless specified
3. **HTTPS required for production** - Only HTTP allowed for localhost
4. **Case sensitive** - Make sure URLs match exactly

## 🔧 **If Still Not Working**

1. **Check Firebase Console:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Verify Google sign-in is enabled
   - Check authorized domains

2. **Verify API Key:**
   - Ensure your Firebase API key is correct in `.env`
   - Check that the project ID matches everywhere

3. **Browser Issues:**
   - Try incognito/private browsing mode
   - Clear all cookies for localhost and Firebase domains
   - Try a different browser

The error should resolve once the redirect URIs are properly configured in Google Cloud Console.
