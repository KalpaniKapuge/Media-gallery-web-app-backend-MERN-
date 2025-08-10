import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import userRoutes from './routes/userRoutes.js'
import authRoutes from './routes/authRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminContactRoutes from './routes/adminContactRoutes.js';

dotenv.config();

const app = express();

// Required env vars
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'FRONTEND_URL', 'CLOUDINARY_URL'];
for (const v of requiredEnvVars) {
  if (!process.env[v]) {
    console.error(` Missing required environment variable: ${v}`);
    process.exit(1);
  }
}

console.log('Environment check passed');
console.log('Frontend URL:', process.env.FRONTEND_URL);

// CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = [process.env.FRONTEND_URL];
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsers & cookies
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  if (req.body && Object.keys(req.body).length) {
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '***';
    if (logBody.newPassword) logBody.newPassword = '***';
    console.log(' Body:', logBody);
  }
  next();
});



// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/users', userRoutes);
app.use('/api', contactRoutes);
app.use('/api/upload', mediaRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminContactRoutes);

// 404 fallback
app.use('*', (req, res) => {
  console.log(' 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'POST /api/media/upload',
      'GET /api/media/gallery',
      'GET /api/media/:id',
      'POST /api/media/zip',
      'POST /api/media/download-zip'
    ],
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(' Unhandled error:', err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy violation', origin: req.headers.origin });
  }
  if (err.name === 'MongooseError' || err.name === 'MongoError') {
    return res.status(503).json({ error: 'Database connection error', message: 'Please try again later' });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field' });
  }
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Startup
const start = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected successfully');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
      console.log(` API URL: http://localhost:${PORT}`);
      console.log(` Frontend URL: ${process.env.FRONTEND_URL}`);
    });

    process.on('SIGTERM', () => {
      console.log(' SIGTERM received');
      server.close(() => {
        console.log(' Server closed');
        mongoose.connection.close();
      });
    });
  } catch (error) {
    console.error(' Startup failed:', error.message);
    process.exit(1);
  }
};

start();
