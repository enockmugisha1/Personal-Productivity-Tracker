# 🚀 Deployment Checklist

## ✅ Pre-Deployment Setup

### MongoDB Atlas
- [ ] Create MongoDB Atlas account
- [ ] Create a new cluster (free tier)
- [ ] Create database user with read/write permissions
- [ ] Get connection string
- [ ] Whitelist IP addresses (0.0.0.0/0 for all IPs)

### GitHub Repository
- [ ] Code is pushed to main branch
- [ ] All files are committed
- [ ] Repository is public or accessible to deployment services

## 🎯 Backend Deployment (Render)

### 1. Create Render Service
- [ ] Go to https://dashboard.render.com/
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select your repository

### 2. Configure Service Settings
```
Service Name: personal-productivity-tracker-backend
Region: Oregon (US West) - or closest to you
Branch: main
Root Directory: (leave empty)
Runtime: Node
Build Command: cd backend && npm install
Start Command: cd backend && npm start
Plan: Free
```

### 3. Environment Variables
Add these in Render dashboard:
```
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here_minimum_32_characters
CLIENT_URL=https://productivity-tracker-lh89.vercel.app
PORT=10000
```

Optional (for email notifications):
```
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### 4. Deploy & Test
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (first deploy takes 5-10 minutes)
- [ ] Test health endpoint: `https://your-render-url.onrender.com/api/health`
- [ ] Should return: `{"status":"ok","message":"Backend is running!"}`

## 🎨 Frontend Deployment (Vercel)

### 1. Create Vercel Project
- [ ] Go to https://vercel.com/dashboard
- [ ] Click "New Project"
- [ ] Import from GitHub
- [ ] Select your repository

### 2. Configure Project Settings
```
Framework Preset: Vite
Root Directory: tracker
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3. Environment Variables
Add these in Vercel dashboard:
```
VITE_API_URL=https://your-render-service-url.onrender.com
```

Optional (if using Firebase):
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

### 4. Deploy & Test
- [ ] Click "Deploy"
- [ ] Wait for deployment (2-5 minutes)
- [ ] Test your frontend URL
- [ ] Verify it can connect to backend API

## 🔄 Post-Deployment

### Update CORS Settings
- [ ] Get your Vercel deployment URL
- [ ] Update `CLIENT_URL` environment variable in Render
- [ ] Redeploy backend service if needed

### Test Full Integration
- [ ] Frontend loads successfully
- [ ] Can register/login
- [ ] API calls work
- [ ] No CORS errors in browser console

### Domain Configuration (Optional)
- [ ] Set up custom domain in Vercel
- [ ] Update CLIENT_URL in Render
- [ ] Update VITE_API_URL if needed

## 🚨 Troubleshooting

### Common Issues & Solutions

1. **Backend Health Check Fails**
   - Check Render logs: Dashboard → Service → Logs
   - Verify MongoDB connection string
   - Ensure all required environment variables are set

2. **CORS Errors**
   - Verify CLIENT_URL matches exact Vercel URL
   - Check if backend service is running
   - Look for typos in URLs

3. **Frontend Build Fails**
   - Check Vercel build logs
   - Verify all dependencies in package.json
   - Ensure TypeScript errors are fixed

4. **API Calls Fail**
   - Verify VITE_API_URL is correct
   - Check if backend is deployed and running
   - Test API endpoints directly in browser

### Useful URLs for Testing
- Backend Health: `https://your-render-url.onrender.com/api/health`
- Frontend: `https://your-vercel-url.vercel.app`
- Backend Logs: Render Dashboard → Your Service → Logs
- Frontend Logs: Vercel Dashboard → Your Project → Functions

## 📞 Support

If you encounter issues:
1. Check the logs in respective dashboards
2. Verify all environment variables are set correctly
3. Test API endpoints individually
4. Check this repository's README.md for detailed instructions

## ✨ Success Criteria

Your deployment is successful when:
- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads without errors
- [ ] User can register/login
- [ ] All features work as expected
- [ ] No CORS or API errors in browser console

---

**Happy Deploying! 🎉**
