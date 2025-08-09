import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  tags: [{ type: String, trim: true }],
  url: { type: String, required: true },         // secure_url from Cloudinary
  publicId: { type: String, required: true },    // cloudinary public_id
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Media', mediaSchema);
