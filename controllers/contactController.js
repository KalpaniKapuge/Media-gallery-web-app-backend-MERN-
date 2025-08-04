import Contact from '../models/contact.js';

// User submits a message
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
    res.status(201).json({ success: true, data: contact });
  } catch (e) {
    console.error('submitMessage error:', e);
    res.status(500).json({ error: 'Failed to submit message', message: e.message });
  }
};

// User gets their own messages
export const getMyMessages = async (req, res) => {
  try {
    const messages = await Contact.find({ userId: req.user.id, isDeleted: false })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (e) {
    console.error('getMyMessages error:', e);
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
    res.json({ success: true, data: contact });
  } catch (e) {
    console.error('updateMessage error:', e);
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
    res.status(204).send();
  } catch (e) {
    console.error('deleteMessage error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
};

// Admin: list all (with optional search & pagination)
export const getAllMessages = async (req, res) => {
  try {
    const { search, page = 1, limit = 25 } = req.query;
    const filter = { isDeleted: false };
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
    console.error('getAllMessages error:', e);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};

// Admin: hard/soft delete any
export const adminDelete = async (req, res) => {
  try {
    const { id } = req.params;
    await Contact.findByIdAndUpdate(id, { isDeleted: true });
    res.status(204).send();
  } catch (e) {
    console.error('adminDelete error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
};
