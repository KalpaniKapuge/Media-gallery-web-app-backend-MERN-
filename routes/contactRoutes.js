import express from 'express';
import {
  submitMessage,
  getMyMessages,
  updateMessage,
  deleteMessage,
  getAllMessages,
  adminDelete,
} from '../controllers/contactController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// User routes
router.post('/contact', authenticate, submitMessage);
router.get('/contact/my-messages', authenticate, getMyMessages);
router.put('/contact/:id', authenticate, updateMessage);
router.delete('/contact/:id', authenticate, deleteMessage);

// Admin routes
router.get('/admin/contact', authenticate, getAllMessages);
router.delete('/admin/contact/:id', authenticate, adminDelete);

export default router;