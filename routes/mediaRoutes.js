import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../utils/upload.js';
import {
  uploadMedia,
  getGallery,
  getMediaById,
  updateMedia,
  deleteMedia,
  downloadZip,
} from '../controllers/mediaController.js';

const router = express.Router();

router.use((req, res, next) => {
  console.log(`🎬 Media route: ${req.method} ${req.originalUrl}`);
  next();
});

// Upload & gallery endpoints
router.post('/upload', authenticate, upload.single('file'), uploadMedia);
router.get('/gallery', authenticate, getGallery);
router.get('/', authenticate, getGallery); // Fallback for gallery

// Specific item endpoints
router.get('/:id', authenticate, getMediaById);
router.put('/:id', authenticate, updateMedia);
router.delete('/:id', authenticate, deleteMedia);

router.post('/download-zip', authenticate, downloadZip);



router.post('/', authenticate, upload.single('file'), uploadMedia); // Fallback for upload

export default router;