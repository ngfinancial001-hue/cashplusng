const User = require('../models/User');
const Transaction = require('../models/Transaction');
const LEVELS = require('../config/levels');

exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const recentTransactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10);
    let timeRemaining = null;
    if (user.activeMembership.isActive && user.activeMembership.endDate) {
      timeRemaining = Math.max(0, new Date(user.activeMembership.endDate) - new Date());
    }
    res.json({
      success: true,
      user: {
        id: user._id, fullName: user.fullName, email: user.email, phone: user.phone,
        walletBalance: user.walletBalance, totalEarned: user.totalEarned, totalWithdrawn: user.totalWithdrawn,
        referralCode: user.referralCode, referralEarnings: user.referralEarnings, referralCount: user.referralCount,
        activeMembership: user.activeMembership, bankName: user.bankName, accountNumber: user.accountNumber,
        accountName: user.accountName, createdAt: user.createdAt,
      },
      transactions: recentTransactions, timeRemaining, levels: LEVELS,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    const total = await Transaction.countDocuments({ user: req.user._id });
    res.json({ success: true, transactions, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load transactions' });
  }
};

exports.getReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const referrals = await User.find({ referredBy: user.referralCode }).select('fullName email createdAt activeMembership');
    res.json({
      success: true, referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.referralCode}`,
      referralEarnings: user.referralEarnings, referralCount: user.referralCount, referrals,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load referrals' });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ role: 'user' });
    const totalDeposits = await Transaction.aggregate([{ $match: { type: 'activation', status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalWithdrawals = await Transaction.aggregate([{ $match: { type: 'withdrawal', status: { $in: ['success', 'processing'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    const completedChallenges = await User.countDocuments({ 'activeMembership.isCompleted': true });
    res.json({ success: true, stats: { totalMembers, totalDeposits: totalDeposits[0]?.total || 0, totalWithdrawals: totalWithdrawals[0]?.total || 0, completedChallenges } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
};
