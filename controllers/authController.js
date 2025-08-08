import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { generateOTP } from '../utils/otp.js';
import { sendOTP } from '../utils/email.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const signToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('Missing JWT_SECRET');
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Manual register + OTP request
export const requestRegisterOTP = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    const user = new User({
      name,
      email,
      password,
      otp,
      otpExpires,
    });

    await user.save();
    await sendOTP(email, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Register OTP error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Verify registration OTP
export const verifyRegisterOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'No registration found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Forgot password request OTP
export const requestForgotOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'No user found with this email' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendOTP(email, otp, 'reset');
    res.json({ message: 'OTP sent for password reset' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'No user found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// Standard login - FIXED logic
export const login = async (req, res) => {
  try {
    console.log('=== LOGIN ATTEMPT START ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);

    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing credentials:', { hasEmail: !!email, hasPassword: !!password });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailStr = String(email).trim().toLowerCase();
    const passwordStr = String(password);

    console.log('Processed credentials:', {
      email: emailStr,
      passwordLength: passwordStr.length,
    });

    const user = await User.findOne({ email: emailStr });

    if (!user) {
      console.log('No user found with email:', emailStr);
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    console.log('User found:', {
      id: user._id,
      email: user.email,
      hasPassword: !!user.password,
      passwordType: typeof user.password,
      passwordLength: user.password ? user.password.length : 0,
      hasGoogleId: !!user.googleId,
      isActive: user.isActive,
    });

    // New check: if no password but has googleId, require Google sign-in
    if ((!user.password || user.password === null || user.password === undefined) && user.googleId) {
      console.log('User has no password but has Google ID - ask to use Google sign-in');
      return res.status(400).json({ error: 'Please use Google sign-in for this account' });
    }

    // If no password and no googleId - treat as invalid login
    if (!user.password) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    let isPasswordValid = false;
    try {
      console.log('About to compare passwords...');
      isPasswordValid = await user.comparePassword(passwordStr);
      console.log('Password comparison completed:', isPasswordValid);
    } catch (compareError) {
      console.error('Password comparison failed:', {
        message: compareError.message,
        stack: compareError.stack,
      });
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!isPasswordValid) {
      console.log('Password comparison returned false');
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      console.log('User account is not active');
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    console.log('Generating JWT token...');
    const token = signToken(user);

    const responseData = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    console.log('Login successful for user:', user.email);
    console.log('=== LOGIN ATTEMPT END ===');

    res.json(responseData);
  } catch (error) {
    console.error('=== LOGIN ERROR ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    console.error('=== LOGIN ERROR END ===');

    res.status(500).json({ error: 'Internal server error during login' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    // Verify with Google
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

    if (!response.ok) {
      return res.status(400).json({ error: 'Failed to verify Google token' });
    }

    const payload = await response.json();
    console.log('Google tokeninfo payload:', payload);

    if (payload.error_description || payload.error) {
      return res.status(400).json({
        error: 'Invalid Google token',
        details: payload.error_description || payload.error,
      });
    }

    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({
        error: 'Token audience mismatch',
        expected: process.env.GOOGLE_CLIENT_ID,
        received: payload.aud,
      });
    }

    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      // Link or create user
      const existingUser = await User.findOne({ email: payload.email });
      if (existingUser) {
        existingUser.googleId = payload.sub;
        await existingUser.save();
        user = existingUser;
      } else {
        user = new User({
          name: payload.name,
          email: payload.email,
          googleId: payload.sub,
          role: 'user',
          isActive: true,
        });
        await user.save();
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated' });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Internal server error during Google login' });
  }
};
