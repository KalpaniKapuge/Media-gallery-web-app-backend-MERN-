import express from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/auth.js';
import {
  getAllMessages,
  adminDelete,
} from '../controllers/contactController.js';
import User from '../models/user.js';

const router = express.Router();

// Admin: all contact messages
router.get('/contact', authenticate, authorizeAdmin, getAllMessages);
router.delete('/contact/:id', authenticate, authorizeAdmin, adminDelete);

// Admin: list users
router.get('/users', authenticate, authorizeAdmin, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Admin: update user (e.g., soft-delete)
router.put('/user/:id', authenticate, authorizeAdmin, async (req, res) => {
  const { name, role, isActive } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, role, isActive },
    { new: true }
  );
  res.json(user);
});

export default router;
