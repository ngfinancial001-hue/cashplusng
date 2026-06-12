const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password, referralCode } = req.body;
    if (!fullName || !email || !phone || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const userData = { fullName, email, phone, password };
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) userData.referredBy = referralCode;
    }
    const user = await User.create(userData);
    const token = signToken(user._id);
    res.status(201).json({ success: true, message: 'Registration successful', token,
      user: { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, referralCode: user.referralCode, walletBalance: user.walletBalance }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.isBlocked)
      return res.status(403).json({ success: false, message: 'Account suspended' });
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    const token = signToken(user._id);
    res.json({ success: true, message: 'Login successful', token,
      user: { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, role: user.role, walletBalance: user.walletBalance, referralCode: user.referralCode, activeMembership: user.activeMembership }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { bankName, accountNumber, accountName, phone }, { new: true });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};
