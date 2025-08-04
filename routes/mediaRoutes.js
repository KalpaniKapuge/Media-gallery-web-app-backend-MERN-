import express from 'express';
import { authenticate } from '../middlewares/auth.js';  // check your folder name: middleware or middlewares?
import { upload } from '../utils/upload.js';
import {
  uploadMedia,
  getGallery,
  updateMedia,
  deleteMedia,
  downloadZip,
} from '../controllers/mediaController.js';

const router = express.Router();

// Logging middleware for debugging
router.use((req, res, next) => {
  console.log(`🎬 Media route: ${req.method} ${req.originalUrl}`);
  next();
});

router.post('/upload', authenticate, upload.single('file'), uploadMedia);
router.get('/gallery', authenticate, getGallery);
router.put('/:id', authenticate, updateMedia);
router.delete('/:id', authenticate, deleteMedia);
router.post('/download-zip', authenticate, downloadZip);

// Legacy routes (optional)
router.post('/', authenticate, upload.single('file'), uploadMedia);
router.get('/', authenticate, getGallery);

export default router;
