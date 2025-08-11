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
  console.log(`Incoming media route: ${req.method} ${req.originalUrl}`);
  next();
});

router.post('/upload-profile', authenticate, upload.single('profilePic'), uploadProfilePic);
router.post('/upload', authenticate, upload.single('file'), uploadMedia);
router.get('/gallery', authenticate, getGallery);
router.post('/download-zip', authenticate, downloadZip);
router.get('/', authenticate, getGallery);
router.post('/', authenticate, upload.single('file'), uploadMedia);
router.get('/:id', authenticate, getMediaById);
router.put('/:id', authenticate, updateMedia);
router.delete('/:id', authenticate, deleteMedia);

export default router;
