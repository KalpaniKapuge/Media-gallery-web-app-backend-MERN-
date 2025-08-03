import express from 'express';
import {
  submitMessage,
  getMyMessages,
  updateMessage,
  deleteMessage,
} from '../controllers/contactController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.post('/contact', authenticate, submitMessage);
router.get('/contact/my-messages', authenticate, getMyMessages);
router.put('/contact/:id', authenticate, updateMessage);
router.delete('/contact/:id', authenticate, deleteMessage);

export default router;
