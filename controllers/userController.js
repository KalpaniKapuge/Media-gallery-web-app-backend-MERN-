export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // assuming you set user on req in authenticate middleware
    const { name, email, profilePic } = req.body;

    // Find user in DB and update
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.profilePic = profilePic || user.profilePic;

    await user.save();

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
