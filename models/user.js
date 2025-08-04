import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    // Don't make password required since Google users might not have one
    required: function() {
      return !this.googleId; // Only required if no Google ID
    }
  },
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // OTP functionality
  otp: String,
  otpExpires: Date,
  // Google OAuth
  googleId: String,
}, { 
  timestamps: true 
});

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  try {
    // Only hash if password is present and modified
    if (this.isModified('password') && this.password) {
      console.log('Hashing password for user:', this.email);
      const saltRounds = 12; // Increased for better security
      this.password = await bcrypt.hash(this.password, saltRounds);
      console.log('Password hashed successfully');
    }
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('comparePassword called with:', {
      email: this.email,
      hasStoredPassword: !!this.password,
      storedPasswordType: typeof this.password,
      candidatePasswordType: typeof candidatePassword,
      candidatePasswordLength: candidatePassword ? candidatePassword.length : 0
    });
    
    // Check if this user has a password set
    if (!this.password || this.password === null || this.password === undefined) {
      console.log('No password set for user:', this.email);
      throw new Error('No password set for this user - please use Google sign-in');
    }
    
    // Check if candidate password is provided
    if (!candidatePassword || candidatePassword === null || candidatePassword === undefined) {
      console.log('No candidate password provided');
      throw new Error('No password provided for comparison');
    }
    
    // Ensure both are strings
    const storedPassword = String(this.password);
    const candidatePasswordStr = String(candidatePassword);
    
    console.log('About to compare passwords:', {
      storedPasswordLength: storedPassword.length,
      candidateLength: candidatePasswordStr.length,
      storedPasswordStartsWith: storedPassword.substring(0, 7) // $2b$12$ for bcrypt
    });
    
    const isMatch = await bcrypt.compare(candidatePasswordStr, storedPassword);
    console.log('Password comparison result:', isMatch);
    
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', {
      message: error.message,
      stack: error.stack,
      userEmail: this.email
    });
    throw error;
  }
};

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

export default mongoose.model('User', userSchema);