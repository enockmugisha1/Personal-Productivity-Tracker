# Personal Productivity Tracker 🚀

A full-stack personal productivity tracker application built with React (Frontend) and Node.js/Express (Backend).

## 🌐 Live Deployments

- **Frontend (Vercel)**: https://productivity-tracker-lh89.vercel.app
- **Backend (Render)**: https://personal-productivity-tracker.onrender.com

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + MongoDB
- **Database**: MongoDB Atlas
- **Authentication**: JWT + Passport.js
- **Deployment**: Vercel (Frontend) + Render (Backend)

## 📁 Project Structure

```
Personal-Productivity-Tracker/
├── backend/                 # Node.js/Express API
│   ├── routes/             # API routes
│   ├── models/             # MongoDB models
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── tracker/                # React frontend
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   ├── vercel.json         # Vercel deployment config
│   └── package.json        # Frontend dependencies
├── render.yaml             # Render deployment config
└── package.json            # Root package.json
```

## 🚀 Deployment Guide

### Backend Deployment (Render)

1. **Connect to Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Connect your GitHub repository
   - Create a new Web Service

2. **Configure Render Service**:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node
   - **Plan**: Free

3. **Set Environment Variables in Render**:
   ```bash
   NODE_ENV=production
   MONGO_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_jwt_key_here
   CLIENT_URL=https://productivity-tracker-lh89.vercel.app
   EMAIL_USER=your_gmail@gmail.com  # Optional
   EMAIL_PASS=your_gmail_app_password  # Optional
   ```

4. **MongoDB Atlas Setup**:
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Get connection string and add to MONGO_URI
   - Whitelist Render's IP addresses (0.0.0.0/0 for simplicity)

### Frontend Deployment (Vercel)

1. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Set root directory to `tracker`

2. **Configure Vercel Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `tracker`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Set Environment Variables in Vercel**:
   ```bash
   VITE_API_URL=https://personal-productivity-tracker.onrender.com
   VITE_FIREBASE_API_KEY=your_firebase_key  # If using Firebase
   VITE_FIREBASE_AUTH_DOMAIN=your_domain    # If using Firebase
   VITE_FIREBASE_PROJECT_ID=your_project_id # If using Firebase
   ```

## 🛠️ Local Development

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Git

### Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/your-username/Personal-Productivity-Tracker.git
   cd Personal-Productivity-Tracker
   ```

2. **Install Dependencies**:
   ```bash
   npm run install-all
   ```

3. **Environment Setup**:
   
   **Backend** (`backend/.env`):
   ```bash
   MONGO_URI=mongodb://localhost:27017/productivity-tracker
   JWT_SECRET=your_local_jwt_secret
   CLIENT_URL=http://localhost:5174
   NODE_ENV=development
   PORT=5007
   ```
   
   **Frontend** (`tracker/.env`):
   ```bash
   VITE_API_URL=http://localhost:5007
   ```

4. **Run Development Servers**:
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:5007
   - Frontend: http://localhost:5174

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure your frontend URL is added to `allowedOrigins` in `backend/server.js`
   - Check that `CLIENT_URL` environment variable is set correctly

2. **MongoDB Connection Issues**:
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure network access is configured correctly

3. **Deployment Fails**:
   - Check build logs in Render/Vercel dashboards
   - Verify all environment variables are set
   - Ensure dependencies are correctly listed in package.json

4. **API Not Responding**:
   - Check if backend service is running on Render
   - Verify API URL in frontend environment variables
   - Test API endpoints directly: `https://personal-productivity-tracker.onrender.com/api/health`

### Health Check

Test your deployments:
- **Backend Health**: https://personal-productivity-tracker.onrender.com/api/health
- **Frontend**: https://productivity-tracker-lh89.vercel.app

## 📝 Environment Variables Reference

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `PORT` | Server port (default: 5007) | No |
| `EMAIL_USER` | Gmail for notifications | No |
| `EMAIL_PASS` | Gmail app password | No |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_FIREBASE_API_KEY` | Firebase API key | No |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | No |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Made with ❤️ by Enock Mugishah**
