import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    let token = null;
    if (header && header.startsWith('Bearer ')) token = header.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
