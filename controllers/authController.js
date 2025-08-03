import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import { generateOTP } from '../utils/otp.js';
import { sendOTP } from '../utils/email.js';
import fetch from 'node-fetch'; // install node-fetch@3
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
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    const user = new User({ name, email, password, otp, otpExpires });
    await user.save();
    await sendOTP(email, otp);
    res.json({ message: 'OTP sent to email' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Verify registration OTP
export const verifyRegisterOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'No registration found' });
    if (user.otp !== otp || user.otpExpires < Date.now()) return res.status(400).json({ error: 'Invalid or expired OTP' });
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Forgot password request OTP
export const requestForgotOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'No such user' });
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendOTP(email, otp, 'reset');
    res.json({ message: 'OTP sent for password reset' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'No such user' });
    if (user.otp !== otp || user.otpExpires < Date.now()) return res.status(400).json({ error: 'Invalid or expired OTP' });
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Standard login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ error: 'Deactivated' });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Google login via ID token
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body; // frontend sends Google ID token
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

    // Verify with Google
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    const payload = await response.json();
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) return res.status(400).json({ error: 'Invalid token audience' });

    // Upsert user
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = new User({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        role: 'user',
      });
      await user.save();
    }
    if (!user.isActive) return res.status(403).json({ error: 'Deactivated' });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
