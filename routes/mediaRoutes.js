import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../uploads/upload.js';
import {
  getMediaById,
  uploadProfilePic,
  uploadMedia,
  getGallery,
  updateMedia,
  deleteMedia,
  downloadZip,
} from '../controllers/mediaController.js';

const router = express.Router();

// Debug log
router.use((req, res, next) => {
  console.log(`🔥 Incoming media route: ${req.method} ${req.originalUrl}`);
  next();
});

// Profile picture upload endpoint with authentication
router.post('/upload-profile', authenticate, upload.single('profilePic'), uploadProfilePic);

// Upload & gallery endpoints
router.post('/upload', authenticate, upload.single('file'), uploadMedia);
router.get('/gallery', authenticate, getGallery);

// Download multiple files as ZIP
router.post('/download-zip', authenticate, downloadZip);

// Default gallery routes
router.get('/', authenticate, getGallery);
router.post('/', authenticate, upload.single('file'), uploadMedia);

// Specific media item endpoints
router.get('/:id', authenticate, getMediaById);
router.put('/:id', authenticate, updateMedia);
router.delete('/:id', authenticate, deleteMedia);

export default router;