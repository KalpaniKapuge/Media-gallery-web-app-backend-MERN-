import Media from '../models/Media.js';
import cloudinary from '../utils/cloudinary.js';
import streamifier from 'streamifier';
import archiver from 'archiver';
import axios from 'axios';

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'media_gallery' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });

export const uploadMedia = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    if (!req.file) return res.status(400).json({ error: 'File required' });
    const result = await uploadToCloudinary(req.file.buffer);
    const media = new Media({
      title,
      description,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      url: result.secure_url,
      publicId: result.public_id,
      uploadedBy: req.user.id,
    });
    await media.save();
    res.status(201).json(media);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getGallery = async (req, res) => {
  try {
    const { search, tags } = req.query;
    const filter = { uploadedBy: req.user.id };
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (tags) filter.tags = { $in: tags.split(',').map((t) => t.trim()) };
    const medias = await Media.find(filter).sort({ createdAt: -1 });
    res.json(medias);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ error: 'Not found' });
    if (media.uploadedBy.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    const { title, description, tags } = req.body;
    if (title) media.title = title;
    if (description) media.description = description;
    if (tags) media.tags = tags.split(',').map(t => t.trim());
    await media.save();
    res.json(media);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ error: 'Not found' });
    if (media.uploadedBy.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    // Optionally remove from Cloudinary
    await cloudinary.uploader.destroy(media.publicId);
    await media.deleteOne();
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const downloadZip = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No media selected' });

    const medias = await Media.find({ _id: { $in: ids }, uploadedBy: req.user.id });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=selected_images.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => res.status(500).send({ error: err.message }));
    archive.pipe(res);

    for (const media of medias) {
      const response = await axios.get(media.url, { responseType: 'arraybuffer' });
      archive.append(response.data, { name: `${media.title || 'image'}-${media._id}.jpg` });
    }

    await archive.finalize();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
