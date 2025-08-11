import Media from '../models/media.js';
import User from '../models/user.js';
import cloudinary from '../utils/cloudinary.js';
import streamifier from 'streamifier';
import archiver from 'archiver';
import fetch from 'node-fetch';
import mongoose from 'mongoose';

// Helper for uploading any buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'media_gallery',
      resource_type: 'auto',
      ...options,
    };

    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(stream);
  });

export const getMediaById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid media ID' });
    }

    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({ message: 'Media not found' });
    }

    res.json(media);
  } catch (error) {
    console.error('getMediaById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { title, description, tags } = req.body;
    const mediaTitle = title || req.file.originalname.split('.')[0];
    const result = await uploadToCloudinary(req.file.buffer);

    const media = new Media({
      title: mediaTitle,
      description: description || '',
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      url: result.secure_url,
      publicId: result.public_id,
      uploadedBy: req.user.id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });

    await media.save();
    res.status(201).json({
      success: true,
      message: 'Upload successful',
      media,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed', message: error.message });
  }
};

export const getGallery = async (req, res) => {
  try {
    const { search, tags, page = 1, limit = 20 } = req.query;
    const filter = { uploadedBy: req.user.id, isActive: true };

    if (search) filter.$text = { $search: search };
    if (tags) filter.tags = { $in: tags.split(',').map((t) => t.trim()) };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [medias, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Media.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: medias,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Gallery error:', error);
    res.status(500).json({ success: false, error: 'Failed to load gallery', message: error.message });
  }
};

export const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ success: false, error: 'Media not found' });
    if (media.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { title, description, tags } = req.body;
    if (title) media.title = title;
    if (description) media.description = description;
    if (tags) media.tags = tags.split(',').map((t) => t.trim());

    await media.save();
    res.json({ success: true, message: 'Media updated successfully', media });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: 'Update failed', message: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ success: false, error: 'Media not found' });
    if (media.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    try {
      await cloudinary.uploader.destroy(media.publicId);
    } catch (cloudinaryError) {
      console.warn('Cloudinary deletion failed:', cloudinaryError.message);
    }

    await Media.findByIdAndDelete(id);
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, error: 'Delete failed', message: error.message });
  }
};

export const downloadZip = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, error: 'No media selected for download' });
    }

    const medias = await Media.find({ _id: { $in: ids }, uploadedBy: req.user.id, isActive: true });
    if (medias.length === 0) return res.status(404).json({ success: false, error: 'No accessible media found' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="media-${Date.now()}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      throw err;
    });
    archive.pipe(res);

    for (const media of medias) {
      const response = await fetch(media.url);
      if (!response.ok) continue;
      const buffer = await response.buffer();
      archive.append(buffer, { name: `${media.title || 'file'}.${media.url.split('.').pop()}` });
    }

    await archive.finalize();
  } catch (error) {
    console.error('ZIP download error:', error);
    res.status(500).json({ success: false, error: 'ZIP download failed', message: error.message });
  }
};

// ✅ Fixed: Profile picture upload, ESM safe, consistent naming
export const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, { folder: 'profile_pics' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.profilePic = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile picture updated',
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error('Profile upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed', message: error.message });
  }
};
