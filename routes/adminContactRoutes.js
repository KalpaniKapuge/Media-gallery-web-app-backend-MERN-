import express from 'express';
import {
  getAllMessages,
  adminDelete,
} from '../controllers/contactController.js';
import { authenticate, authorizeAdmin } from '../middlewares/auth.js';

const router = express.Router();

router.get('/contact-messages', authenticate, authorizeAdmin, getAllMessages);
router.delete('/contact-messages/:id', authenticate, authorizeAdmin, adminDelete);

export default router;
