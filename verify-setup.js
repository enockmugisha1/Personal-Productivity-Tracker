#!/usr/bin/env node

console.log('🔍 Personal Productivity Tracker Setup Verification\n');

// Check if we're in the right directory
const fs = require('fs');
const path = require('path');

console.log('📋 Current Setup Status:\n');

// Check frontend Firebase config
try {
  const envPath = path.join(__dirname, 'tracker', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const projectId = envContent.match(/VITE_FIREBASE_PROJECT_ID=(.+)/)?.[1]?.trim();
    const authDomain = envContent.match(/VITE_FIREBASE_AUTH_DOMAIN=(.+)/)?.[1]?.trim();
    
    console.log('✅ Frontend Configuration:');
    console.log(`   - Project ID: ${projectId || 'Not found'}`);
    console.log(`   - Auth Domain: ${authDomain || 'Not found'}`);
    
    if (projectId === 'personal-productivity-tracker') {
      console.log('   ✅ Frontend project ID is correct!');
    } else {
      console.log('   ❌ Frontend project ID should be "personal-productivity-tracker"');
    }
  } else {
    console.log('❌ Frontend .env file not found');
  }
} catch (error) {
  console.log('❌ Error reading frontend config:', error.message);
}

console.log();

// Check backend service account
try {
  const serviceAccountPath = path.join(__dirname, 'backend', 'config', 'serviceAccount.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    console.log('🔧 Backend Configuration:');
    console.log(`   - Project ID: ${serviceAccount.project_id || 'Not found'}`);
    console.log(`   - Client Email: ${serviceAccount.client_email || 'Not found'}`);
    
    if (serviceAccount.project_id === 'personal-productivity-tracker') {
      console.log('   ✅ Backend project ID is correct!');
    } else {
      console.log('   ❌ Backend project ID should be "personal-productivity-tracker"');
      console.log('   📝 You need to download a new service account from:');
      console.log('      https://console.firebase.google.com/project/personal-productivity-tracker/settings/serviceaccounts/adminsdk');
    }
  } else {
    console.log('❌ Backend service account file not found');
  }
} catch (error) {
  console.log('❌ Error reading backend config:', error.message);
}

console.log();

// Check if projects match
console.log('🔄 Project Alignment Check:');
try {
  const envPath = path.join(__dirname, 'tracker', '.env');
  const serviceAccountPath = path.join(__dirname, 'backend', 'config', 'serviceAccount.json');
  
  if (fs.existsSync(envPath) && fs.existsSync(serviceAccountPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const frontendProjectId = envContent.match(/VITE_FIREBASE_PROJECT_ID=(.+)/)?.[1]?.trim();
    
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    const backendProjectId = serviceAccount.project_id;
    
    if (frontendProjectId === backendProjectId && frontendProjectId === 'personal-productivity-tracker') {
      console.log('   ✅ Frontend and Backend are aligned on "personal-productivity-tracker"!');
    } else {
      console.log('   ❌ Project mismatch detected:');
      console.log(`      Frontend: ${frontendProjectId}`);
      console.log(`      Backend: ${backendProjectId}`);
      console.log('      Both should be: "personal-productivity-tracker"');
    }
  }
} catch (error) {
  console.log('❌ Error checking project alignment:', error.message);
}

console.log();

console.log('📝 Next Steps:');
if (fs.existsSync(path.join(__dirname, 'backend', 'config', 'serviceAccount.json'))) {
  const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'backend', 'config', 'serviceAccount.json'), 'utf8'));
  if (serviceAccount.project_id !== 'personal-productivity-tracker') {
    console.log('1. ❗ Download new service account from Firebase Console');
    console.log('2. 🔧 Configure Google Cloud Console OAuth settings');
    console.log('3. 🔥 Add authorized domains to Firebase Console');
    console.log('4. 🚀 Update Vercel environment variables');
  } else {
    console.log('1. ✅ Service account is correct');
    console.log('2. 🔧 Configure Google Cloud Console OAuth settings');
    console.log('3. 🔥 Add authorized domains to Firebase Console');
    console.log('4. 🚀 Update Vercel environment variables');
  }
} else {
  console.log('1. ❗ Download service account from Firebase Console');
  console.log('2. 🔧 Configure Google Cloud Console OAuth settings');
  console.log('3. 🔥 Add authorized domains to Firebase Console');
  console.log('4. 🚀 Update Vercel environment variables');
}

console.log();
console.log('🔗 Quick Links:');
console.log('- Firebase Console: https://console.firebase.google.com/project/personal-productivity-tracker');
console.log('- Service Account: https://console.firebase.google.com/project/personal-productivity-tracker/settings/serviceaccounts/adminsdk');
console.log('- Google Cloud OAuth: https://console.cloud.google.com/apis/credentials?project=personal-productivity-tracker');
console.log('- Firebase Auth Settings: https://console.firebase.google.com/project/personal-productivity-tracker/authentication/settings');
