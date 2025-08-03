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

router.post('/register/request-otp', requestRegisterOTP);
router.post('/register/verify-otp', verifyRegisterOTP);
router.post('/login', login);
router.post('/forgot-password', requestForgotOTP);
router.post('/reset-password', resetPasswordWithOTP);
router.post('/google-login', googleLogin); // expects { idToken }

export default router;
