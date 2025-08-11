import User from "../models/user.js";

export const updateUserProfile = async (req, res) => {
  try {
    console.log('👤 Updating user profile');
    console.log('User ID:', req.user?.id);
    console.log('Request body:', req.body);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id;
    const { name, email, profilePic } = req.body;

    // Find user in DB and update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update only provided fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (profilePic !== undefined) user.profilePic = profilePic;

    await user.save();

    // Return user with consistent format
    const responseUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      role: user.role
    };

    console.log(' User profile updated successfully');

    res.json({ 
      success: true,
      user: responseUser 
    });

  } catch (error) {
    console.error(' Update user profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};