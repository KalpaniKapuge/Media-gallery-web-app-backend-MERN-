import Contact from '../models/Contact.js';

export const submitMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });
    const contact = new Contact({
      name,
      email,
      message,
      userId: req.user?.id,
    });
    await contact.save();
    res.status(201).json(contact);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getMyMessages = async (req, res) => {
  const messages = await Contact.find({ userId: req.user.id, isDeleted: false }).sort({ createdAt: -1 });
  res.json(messages);
};

export const updateMessage = async (req, res) => {
  const { id } = req.params;
  const contact = await Contact.findById(id);
  if (!contact || contact.isDeleted) return res.status(404).json({ error: 'Not found' });
  if (contact.userId?.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  contact.message = req.body.message || contact.message;
  await contact.save();
  res.json(contact);
};

export const deleteMessage = async (req, res) => {
  const { id } = req.params;
  const contact = await Contact.findById(id);
  if (!contact || contact.isDeleted) return res.status(404).json({ error: 'Not found' });
  if (contact.userId?.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  contact.isDeleted = true;
  await contact.save();
  res.status(204).send();
};

export const getAllMessages = async (req, res) => {
  const messages = await Contact.find({ isDeleted: false }).populate('userId', 'name email').sort({ createdAt: -1 });
  res.json(messages);
};

export const adminDelete = async (req, res) => {
  const { id } = req.params;
  await Contact.findByIdAndUpdate(id, { isDeleted: true });
  res.status(204).send();
};
