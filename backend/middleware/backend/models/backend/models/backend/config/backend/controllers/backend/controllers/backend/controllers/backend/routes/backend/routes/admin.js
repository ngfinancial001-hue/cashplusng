const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

router.use(protect, adminOnly);

router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20).select('-password');
    const total = await User.countDocuments({ role: 'user' });
    res.json({ success: true, users, total, page });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to fetch users' }); }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const transactions = await Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, user, transactions });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to fetch user' }); }
});

router.put('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}` });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to update user' }); }
});

router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    const transactions = await Transaction.find(filter).populate('user', 'fullName email phone').sort({ createdAt: -1 }).skip((page - 1) * 20).limit(20);
    const total = await Transaction.countDocuments(filter);
    res.json({ success: true, transactions, total, page });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to fetch transactions' }); }
});

router.put('/transactions/:id/process', async (req, res) => {
  try {
    const txn = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status || 'success' }, { new: true });
    res.json({ success: true, transaction: txn });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to update transaction' }); }
});

router.get('/overview', async (req, res) => {
  try {
    const [totalUsers, activeUsers, pendingWithdrawals, totalRevenue] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ 'activeMembership.isActive': true }),
      Transaction.countDocuments({ type: 'withdrawal', status: 'processing' }),
      Transaction.aggregate([{ $match: { type: 'activation', status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    res.json({ success: true, stats: { totalUsers, activeUsers, pendingWithdrawals, totalRevenue: totalRevenue[0]?.total || 0 } });
  } catch (err) { res.status(500).json({ success: false, message: 'Failed to fetch overview' }); }
});

router.post('/credit-wallet', async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId || !amount) return res.status(400).json({ success: false, message: 'userId and amount required' });
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amount, totalEarned: amount } });
    await Transaction.create({ user: userId, type: 'reward', amount, status: 'success', gateway: 'system', description: description || 'Admin manual credit' });
    res.json({ success: true, message: `₦${amount} credited successfully` });
  } catch (err) { res.status(500).json({ success: false, message: 'Credit failed' }); }
});

module.exports = router;
