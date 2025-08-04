import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log(' File filter check:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Allow images and zip files
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedMimes.includes(file.mimetype) && !allowedExtensions.includes(ext)) {
    console.log(' File type not allowed:', file.mimetype, ext);
    return cb(new Error('Only images (JPG, PNG, GIF, WebP) and ZIP files are allowed'), false);
  }
  
  console.log(' File type allowed');
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
});

// Error handler for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Only one file allowed.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field. Use "file" as field name.' });
    }
  }
  
  if (err.message.includes('Only images')) {
    return res.status(400).json({ error: err.message });
  }
  
  next(err);
};