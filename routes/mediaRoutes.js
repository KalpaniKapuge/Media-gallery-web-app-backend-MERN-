import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { upload } from '../utils/upload.js';
import {
  uploadMedia,
  getGallery,
  updateMedia,
  deleteMedia,
  downloadZip,
} from '../controllers/mediaController.js';

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), uploadMedia);
router.get('/gallery', authenticate, getGallery);
router.put('/:id', authenticate, updateMedia);
router.delete('/:id', authenticate, deleteMedia);
router.post('/download-zip', authenticate, downloadZip);

export default router;
