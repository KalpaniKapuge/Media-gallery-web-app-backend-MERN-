import express from 'express';
import { updateUserProfile } from '../controllers/userController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.put('/profile', authenticate, updateUserProfile);

export default router;
