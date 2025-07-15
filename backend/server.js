const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const morgan = require('morgan');
const colors = require('colors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
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
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

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
  'http://localhost:5173', // local dev
  'http://localhost:5174', // local dev (as fallback)
  'https://productivity-tracker-enock-mugishas-projects.vercel.app' // preview domain
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
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

console.log('🛣️  Routes registered:'.cyan);
console.log('   - /api/auth'.gray);
console.log('   - /api/goals'.gray);
console.log('   - /api/tasks'.gray);
console.log('   - /api/habits'.gray);
console.log('   - /api/notes'.gray);
console.log('   - /api/ai'.gray);
console.log('   - /api/stats'.gray);

// Apply security middleware
securityMiddleware(app);
console.log('🔒 Security middleware applied'.green);

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
const startServer = async () => {
  try {
    await connectDB();
    const PORT = 5007; // For testing, trying a new port. Was: 5001;
    app.listen(PORT, () => {
      console.log(`
=======================================================
🚀 Server is running on port ${PORT}
🌐 API URL: http://localhost:${PORT}
🔒 Environment: ${process.env.NODE_ENV}
=======================================================
      `.green.bold);
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