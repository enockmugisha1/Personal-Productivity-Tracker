# Firebase Project ID Mismatch Fix

## Issue
The Firebase ID token has an incorrect "aud" (audience) claim. The backend expects tokens from project `productivity-tracker-f6149` but is receiving tokens from `personal-productivity-tracker`.

## Root Cause
This happens when:
1. The Firebase project configuration was changed
2. Users have cached authentication tokens from the old project
3. Browser localStorage/sessionStorage contains old Firebase data

## Fixes Applied

### 1. Frontend Configuration ✅
- Updated `tracker/src/config/firebase.ts` to use correct project ID
- Updated `tracker/.env` with correct Firebase configuration
- Added automatic cleanup of old Firebase data on app startup

### 2. Authentication Context ✅
- Added project ID validation in `tracker/src/context/AuthContext.tsx`
- Automatic sign-out when token project ID doesn't match expected project
- Enhanced error handling and debugging

### 3. Utilities ✅
- Created `tracker/src/utils/clearFirebaseData.ts` for clearing auth data
- Added debug component `tracker/src/components/DebugAuthReset.tsx`

## User Instructions

### For Users Experiencing the Issue:

1. **Clear Browser Data** (Recommended):
   - Open browser developer tools (F12)
   - Go to Application/Storage tab
   - Clear localStorage and sessionStorage
   - Refresh the page

2. **Sign Out and Sign Back In**:
   - Click the logout button in the app
   - Clear browser cache if needed
   - Sign back in with your credentials

3. **Use Debug Reset** (Development):
   - Add `?debug=auth` to the URL
   - Click the "Reset Auth" button that appears
   - This will clear all auth data and reload the page

### For Developers:

1. **Check Firebase Configuration**:
   ```typescript
   // Verify these match your Firebase project
   const firebaseConfig = {
     projectId: "productivity-tracker-f6149", // Should match backend
     authDomain: "productivity-tracker-f6149.firebaseapp.com",
     // ... other config
   };
   ```

2. **Verify Backend Service Account**:
   ```json
   // backend/config/serviceAccount.json should have:
   {
     "project_id": "productivity-tracker-f6149",
     // ... other fields
   }
   ```

3. **Monitor Console Logs**:
   - Check for "Token project mismatch" warnings
   - Look for automatic cleanup messages
   - Verify Firebase config logging

## Prevention

To prevent this issue in the future:
1. Ensure frontend Firebase config matches backend service account project
2. Update environment variables when changing projects
3. Clear user sessions when changing Firebase projects
4. Use the `clearFirebaseAuthData()` utility during project migrations

## Technical Details

The fix works by:
1. Detecting token project ID mismatches before sending to backend
2. Automatically signing out users with wrong project tokens
3. Clearing cached Firebase authentication data
4. Providing manual reset tools for edge cases

The backend will no longer receive tokens from the wrong project, resolving the audience claim error.
