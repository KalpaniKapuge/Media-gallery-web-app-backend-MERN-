import express from 'express';
import {
  requestRegisterOTP,
  verifyRegisterOTP,
  requestForgotOTP,
  resetPasswordWithOTP,
  login,
  googleLogin,
} from '../controllers/authController.js';

const router = express.Router();

// Middleware to log requests (helpful for debugging)
router.use((req, res, next) => {
  console.log(`🌐 Auth route: ${req.method} ${req.originalUrl}`);
  console.log(`📦 Body:`, req.body);
  console.log(`🎯 Headers:`, {
    'content-type': req.headers['content-type'],
    'authorization': req.headers['authorization'] ? 'Bearer ***' : 'none'
  });
  next();
});

// Registration routes
router.post('/register/request-otp', requestRegisterOTP);
router.post('/register/verify-otp', verifyRegisterOTP);

// Login routes
router.post('/login', login);
router.post('/google-login', googleLogin);

// Password reset routes
router.post('/forgot-password', requestForgotOTP);
router.post('/reset-password', resetPasswordWithOTP);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'POST /auth/register/request-otp',
      'POST /auth/register/verify-otp', 
      'POST /auth/login',
      'POST /auth/google-login',
      'POST /auth/forgot-password',
      'POST /auth/reset-password'
    ]
  });
});

// Catch-all for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({ 
    error: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'POST /api/auth/register/request-otp',
      'POST /api/auth/register/verify-otp', 
      'POST /api/auth/login',
      'POST /api/auth/google-login',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password'
    ]
  });
});

export default router;