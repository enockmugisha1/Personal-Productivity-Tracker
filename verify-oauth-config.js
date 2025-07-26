#!/usr/bin/env node

// Quick verification script for OAuth configuration
console.log('🔍 OAuth Configuration Verification\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- VITE_API_URL:', process.env.VITE_API_URL || 'http://localhost:5007');
console.log('- VITE_FIREBASE_PROJECT_ID:', process.env.VITE_FIREBASE_PROJECT_ID || 'productivity-tracker-f6149');
console.log('- VITE_FIREBASE_AUTH_DOMAIN:', process.env.VITE_FIREBASE_AUTH_DOMAIN || 'productivity-tracker-f6149.firebaseapp.com');

console.log('\n✅ Required URLs for Google Cloud Console OAuth:');
console.log('\n📍 Authorized JavaScript Origins:');
const jsOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000', 
  'http://localhost:5173',
  'http://localhost:5174',
  'https://productivity-tracker-lh89.vercel.app',
  'https://productivity-tracker-lh89-git-main-enock-mugishas-projects.vercel.app',
  'https://productivity-tracker-lh89-alwmbjeom-enock-mugishas-projects.vercel.app',
  'https://productivity-tracker-lh89-jk3rrxjp8-enock-mugishas-projects.vercel.app'
];

jsOrigins.forEach(url => console.log(`   ${url}`));

console.log('\n📍 Authorized Redirect URIs:');
const redirectUris = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173', 
  'http://localhost:5174',
  'https://productivity-tracker-lh89.vercel.app',
  'https://productivity-tracker-lh89-git-main-enock-mugishas-projects.vercel.app',
  'https://productivity-tracker-lh89-alwmbjeom-enock-mugishas-projects.vercel.app',
  'https://productivity-tracker-lh89-jk3rrxjp8-enock-mugishas-projects.vercel.app'
];

redirectUris.forEach(url => console.log(`   ${url}`));

console.log('\n🔥 Firebase Authorized Domains:');
const firebaseDomains = [
  'localhost',
  '127.0.0.1',
  'productivity-tracker-lh89.vercel.app'
];

firebaseDomains.forEach(domain => console.log(`   ${domain}`));

console.log('\n⚡ Next Steps:');
console.log('1. Add all JavaScript Origins to Google Cloud Console');
console.log('2. Add all Redirect URIs to Google Cloud Console');  
console.log('3. Add Firebase domains to Firebase Console (you\'re doing this!)');
console.log('4. Set Vercel environment variables');
console.log('5. Wait 2-3 minutes for changes to propagate');
console.log('6. Test Google sign-in');

console.log('\n🔗 Quick Links:');
console.log('- Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=productivity-tracker-f6149');
console.log('- Firebase Console: https://console.firebase.google.com/project/productivity-tracker-f6149/authentication/settings');
console.log('- Vercel Dashboard: https://vercel.com/dashboard');
