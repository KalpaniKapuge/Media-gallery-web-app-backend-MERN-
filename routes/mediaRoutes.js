import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../utils/upload.js';
import {
  getMediaById,
  uploadMedia,
  getGallery,
  updateMedia,
  deleteMedia,
  downloadZip,
} from '../controllers/mediaController.js';

const router = express.Router();

router.use((req, res, next) => {
  console.log(`🔥 Incoming media route: ${req.method} ${req.originalUrl}`);
  next();
});

// Upload & gallery endpoints
router.post('/upload', authenticate, upload.single('file'), uploadMedia);
router.get('/gallery', authenticate, getGallery);

// Download multiple files as ZIP
router.post('/download-zip', authenticate, downloadZip);

// Fallbacks (placed last to avoid conflicts)
router.get('/', authenticate, getGallery);
router.post('/', authenticate, upload.single('file'), uploadMedia);

// Specific media item endpoints
router.get('/:id', authenticate, getMediaById);
router.put('/:id', authenticate, updateMedia);
router.delete('/:id', authenticate, deleteMedia);

export default router;
