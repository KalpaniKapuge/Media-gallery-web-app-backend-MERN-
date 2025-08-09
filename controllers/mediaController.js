import Media from '../models/media.js';
import cloudinary from '../utils/cloudinary.js';
import streamifier from 'streamifier';
import archiver from 'archiver';
import fetch from 'node-fetch';
import {
  getMediaById
} from '../controllers/mediaController.js';
import { authenticate } from '../middlewares/auth.js';
import { router } from '../routes/mediaRoutes.js';

const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'media_gallery',
      resource_type: 'auto', // Auto-detect file type
      ...options
    };
    
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result.public_id);
          resolve(result);
        }
      }
    );
    
    streamifier.createReadStream(buffer).pipe(stream);
  });



exports.getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    res.json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


export const uploadMedia = async (req, res) => {
  try {
    console.log(' Upload request received');
    console.log('User:', req.user);
    console.log('File:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description, tags } = req.body;
    
    // Use filename as title if not provided
    const mediaTitle = title || req.file.originalname.split('.')[0];
    
    console.log(' Uploading to Cloudinary...');
    const result = await uploadToCloudinary(req.file.buffer);
    
    console.log(' Saving to database...');
    const media = new Media({
      title: mediaTitle,
      description: description || '',
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(t => t) : [],
      url: result.secure_url,
      publicId: result.public_id,
      uploadedBy: req.user.id,
      fileType: req.file.mimetype,
      fileSize: req.file.size
    });
    
    await media.save();
    console.log(' Media saved successfully:', media._id);
    
    res.status(201).json({
      success: true,
      message: 'Upload successful',
      media: {
        id: media._id,
        title: media.title,
        description: media.description,
        tags: media.tags,
        url: media.url,
        createdAt: media.createdAt
      }
    });
    
  } catch (error) {
    console.error(' Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message 
    });
  }
};

export const getGallery = async (req, res) => {
  try {
    console.log(' Gallery request for user:', req.user.id);
    
    const { search, tags, page = 1, limit = 20 } = req.query;
    const filter = { 
      uploadedBy: req.user.id,
      isActive: true 
    };
    
    // Add search filter
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Add tags filter
    if (tags) {
      filter.tags = { $in: tags.split(',').map((t) => t.trim()) };
    }
    
    console.log(' Query filter:', filter);
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [medias, total] = await Promise.all([
      Media.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Media.countDocuments(filter)
    ]);
    
    console.log(` Found ${medias.length} media items (${total} total)`);
    
    res.json({
      success: true,
      data: medias,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + medias.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error(' Gallery error:', error);
    res.status(500).json({ 
      error: 'Failed to load gallery',
      message: error.message 
    });
  }
};

export const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(' Update request for media:', id);
    
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    if (media.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const { title, description, tags } = req.body;
    
    if (title !== undefined) media.title = title;
    if (description !== undefined) media.description = description;
    if (tags !== undefined) {
      media.tags = tags.split(',').map(t => t.trim()).filter(t => t);
    }
    
    await media.save();
    console.log(' Media updated successfully');
    
    res.json({
      success: true,
      message: 'Media updated successfully',
      media
    });
    
  } catch (error) {
    console.error(' Update error:', error);
    res.status(500).json({ 
      error: 'Update failed',
      message: error.message 
    });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(' Delete request for media:', id);
    
    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    if (media.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(media.publicId);
      console.log(' Deleted from Cloudinary:', media.publicId);
    } catch (cloudinaryError) {
      console.warn('Cloudinary deletion failed:', cloudinaryError.message);
      // Continue with database deletion even if Cloudinary fails
    }
    
    // Delete from database
    await Media.findByIdAndDelete(id);
    console.log('Media deleted successfully');
    
    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
    
  } catch (error) {
    console.error(' Delete error:', error);
    res.status(500).json({ 
      error: 'Delete failed',
      message: error.message 
    });
  }
};




exports.getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }
    res.json(media);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};





export const downloadZip = async (req, res) => {
  try {
    const { ids } = req.body;
    console.log('ZIP download request for:', ids);
    
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'No media selected for download' });
    }
    
    if (ids.length > 50) {
      return res.status(400).json({ error: 'Too many files selected (max 50)' });
    }
    
    const medias = await Media.find({ 
      _id: { $in: ids }, 
      uploadedBy: req.user.id,
      isActive: true 
    });
    
    if (medias.length === 0) {
      return res.status(404).json({ error: 'No accessible media found' });
    }
    
    console.log(` Creating ZIP with ${medias.length} files`);
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="media-${Date.now()}.zip"`);
    
    const archive = archiver('zip', { 
      zlib: { level: 9 } 
    });
    
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Archive creation failed' });
      }
    });
    
    archive.on('warning', (err) => {
      console.warn('Archive warning:', err);
    });
    
    archive.pipe(res);
    
    // Add files to archive
    let addedCount = 0;
    for (const media of medias) {
      try {
        console.log(` Downloading: ${media.url}`);
        const response = await fetch(media.url);
        
        if (!response.ok) {
          console.warn(`Failed to download ${media.title}: ${response.status}`);
          continue;
        }
        
        const buffer = await response.buffer();
        const fileExtension = media.url.split('.').pop() || 'jpg';
        const filename = `${media.title.replace(/[^a-z0-9]/gi, '_')}_${media._id}.${fileExtension}`;
        
        archive.append(buffer, { name: filename });
        addedCount++;
        
      } catch (downloadError) {
        console.warn(`Failed to add ${media.title} to archive:`, downloadError.message);
      }
    }
    
    if (addedCount === 0) {
      archive.append('No files could be downloaded', { name: 'error.txt' });
    }
    
    console.log(` Added ${addedCount}/${medias.length} files to archive`);
    await archive.finalize();
    
  } catch (error) {
    console.error(' ZIP download error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'ZIP download failed',
        message: error.message 
      });
    }
  }
};
router.get('/:id', authenticate, getMediaById);
