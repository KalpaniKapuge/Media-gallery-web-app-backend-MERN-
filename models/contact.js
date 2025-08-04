import Contact from '../models/contact.js';

export const submitMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const newMsg = new Contact({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      userId: req.user?.id || null,  // save userId if logged in, else null
    });

    await newMsg.save();
    res.status(201).json({ success: true, data: newMsg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit message' });
  }
};

// To get logged-in user's messages
export const getMyMessages = async (req, res) => {
  try {
    const messages = await Contact.find({ userId: req.user.id, isDeleted: false }).sort({ createdAt: -1 });
    res.json({ success: true, data: messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};
