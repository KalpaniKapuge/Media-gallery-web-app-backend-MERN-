import express from 'express';
import { uploadProfilePic } from '../controllers/mediaController.js';
import { updateUserProfile } from '../controllers/userController.js';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../uploads/upload.js';

const router = express.Router();

// Add authentication middleware to profile upload
router.post('/upload-profile', authenticate, upload.single('profilePic'), uploadProfilePic);
router.put('/profile', authenticate, updateUserProfile);

export default router;