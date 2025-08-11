import Contact from '../models/contact.js';
import nodemailer from 'nodemailer'; 

// User submits a message
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

export const submitMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!message || !name || !email) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const contact = new Contact({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      userId: req.user?.id,
    });

    await contact.save();
    console.log(' Message saved successfully:', contact);

    // Send confirmation email to the provided email address
    await transporter.sendMail({
      from: `"Your Company" <${process.env.EMAIL_USER}>`, 
      to: email.trim(), 
      subject: 'Your message has been received',
      text: `Hi ${name.trim()},\n\nThank you for contacting us. We received your message:\n\n"${message.trim()}"\n\nWe will get back to you shortly.\n\nBest regards,\nYour Company Team`,
      
    });

    res.status(201).json({ success: true, data: contact });
  } catch (e) {
    console.error(' submitMessage error:', e);
    res.status(500).json({ error: 'Failed to submit message', message: e.message });
  }
};
// User gets their own messages
export const getMyMessages = async (req, res) => {
  try {
    console.log(' Getting messages for user:', req.user.id);
    const messages = await Contact.find({ 
      userId: req.user.id, 
      isDeleted: { $ne: true } 
    }).sort({ createdAt: -1 });
    
    console.log(' Found messages:', messages.length);
    res.json({ success: true, data: messages });
  } catch (e) {
    console.error(' getMyMessages error:', e);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

// User updates own message
export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact || contact.isDeleted) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (contact.userId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.body.message !== undefined) {
      contact.message = req.body.message.trim() || contact.message;
    }
    await contact.save();

    // Send email with updated message
    try {
      await transporter.sendMail({
        from: `"Your Company" <${process.env.EMAIL_USER}>`,
        to: contact.email, 
        subject: 'Your message has been updated',
        text: `Hi ${contact.name},\n\nYour message has been updated to:\n\n"${contact.message}"\n\nThank you.\nYour Company Team`,
      });
      console.log('Email with updated message sent successfully');
    } catch (emailErr) {
      console.error('Failed to send update email:', emailErr);
    }

    res.json({ success: true, data: contact });
  } catch (e) {
    console.error(' updateMessage error:', e);
    res.status(500).json({ error: 'Update failed' });
  }
};

// User soft-deletes own message
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    if (!contact || contact.isDeleted) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (contact.userId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    contact.isDeleted = true;
    await contact.save();
    console.log(' Message soft-deleted:', id);
    res.status(204).send();
  } catch (e) {
    console.error(' deleteMessage error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
};

// Admin: list all (with optional search & pagination)
export const getAllMessages = async (req, res) => {
  try {
    const { search, page = 1, limit = 25 } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { message: regex },
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [messages, total] = await Promise.all([
      Contact.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Contact.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
        hasNext: skip + messages.length < total,
        hasPrev: parseInt(page, 10) > 1,
      },
    });
  } catch (e) {
    console.error(' getAllMessages error:', e);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

// Admin: hard/soft delete any
export const adminDelete = async (req, res) => {
  try {
    const { id } = req.params;
    await Contact.findByIdAndUpdate(id, { isDeleted: true });
    console.log(' Admin deleted message:', id);
    res.status(204).send();
  } catch (e) {
    console.error(' adminDelete error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
};