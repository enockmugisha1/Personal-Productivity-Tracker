const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const morgan = require('morgan');
const colors = require('colors');
const helmet = require('helmet');
// const xss = require('xss-clean'); // Commented out - incompatible with Express 5
const rateLimit = require('express-rate-limit');
// const hpp = require('hpp'); // Commented out - incompatible with Express 5
const path = require('path');
const securityMiddleware = require('./middleware/security');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

console.log('🚀 Starting server...'.yellow.bold);

// Initialize express
const app = express();

// Security Middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false, //  May also be needed if you embed cross-origin resources
})); // Security headers
// app.use(xss()); // Prevent XSS attacks - commented out for Express 5 compatibility
// app.use(hpp()); // Prevent HTTP Parameter Pollution - commented out for Express 5 compatibility

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5001',
  'http://localhost:3000',
  'http://localhost:3002',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  // Production Vercel URLs
  'https://productivity-tracker-lh89.vercel.app',
  'https://productivity-tracker-lh89-git-main-enock-mugishas-projects.vercel.app',
  'https://productivity-tracker-lh89-alwmbjeom-enock-mugishas-projects.vercel.app',
  'https://productivity-tracker-lh89-jk3rrxjp8-enock-mugishas-projects.vercel.app',
  // Render URL (for internal health checks)
  'https://personal-productivity-tracker.onrender.com',
  // Environment variable
  process.env.CLIENT_URL
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('✅ CORS allowed localhost origin:', origin);
      return callback(null, true);
    }
    
    // Check if origin is in allowed origins list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed origin:', origin);
      return callback(null, true);
    }
    
    // Allow all Vercel preview URLs for your project
    if (origin && origin.includes('productivity-tracker-lh89') && origin.includes('vercel.app')) {
      console.log('✅ CORS allowed Vercel origin:', origin);
      return callback(null, true);
    }
    
    console.log('🚫 CORS rejected origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
console.log(`🌐 CORS enabled for origins: ${allowedOrigins.join(', ')}`.green);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('📁 Static file serving enabled for uploads'.green);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log('📝 Morgan logger enabled for development'.cyan);
}

// Passport middleware
app.use(passport.initialize());
require('./config/passport');
console.log('✅ Passport configured'.green);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/notifications', require('./routes/notifications'));

console.log('🛣️  Routes registered:'.cyan);
console.log('   - /api/auth'.gray);
console.log('   - /api/goals'.gray);
console.log('   - /api/tasks'.gray);
console.log('   - /api/habits'.gray);
console.log('   - /api/notes'.gray);
console.log('   - /api/ai'.gray);
console.log('   - /api/stats'.gray);
console.log('   - /api/notifications'.gray);

// Apply security middleware - temporarily disabled for Express 5 compatibility
// securityMiddleware(app);
console.log('🔒 Basic security middleware applied'.green);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running!' });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    console.log('📡 Connecting to MongoDB...'.yellow);
    await mongoose.connect(process.env.MONGO_URI, {
      // useNewUrlParser: true, // Deprecated
      // useUnifiedTopology: true // Deprecated
    });
    console.log('✅ MongoDB connected successfully!'.green.bold);
  } catch (err) {
    console.error('❌ MongoDB connection error:'.red, err.message);
    // Retry connection after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...'.yellow);
    setTimeout(connectDB, 5000);
  }
};

// Start server
const PORT = process.env.PORT || 5007;

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:'.red.bold);
    missingEnvVars.forEach(envVar => {
      console.error(`   - ${envVar}`.red);
    });
    console.error('Please set these variables in your deployment platform.'.red);
    process.exit(1);
  }
}
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n=======================================================\n🚀 Server is running on port ${PORT}\n🌐 API URL: http://localhost:${PORT}\n🔒 Environment: ${process.env.NODE_ENV}\n=======================================================\n`.green.bold);
    });
  } catch (error) {
    console.error('❌ Failed to start server:'.red, error.message);
    process.exit(1);
  }
};

startServer();

// Schedule reminders
const scheduleReminders = require('./utils/reminderJob');
scheduleReminders();
console.log('⏰ Reminder scheduler initialized'.green);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:'.red.bold, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:'.red.bold, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});