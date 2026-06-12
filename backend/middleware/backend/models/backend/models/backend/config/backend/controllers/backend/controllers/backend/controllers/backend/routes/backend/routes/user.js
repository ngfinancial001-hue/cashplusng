const express = require('express');
const router = express.Router();
const { getDashboard, getTransactions, getReferrals, getPlatformStats } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, getDashboard);
router.get('/transactions', protect, getTransactions);
router.get('/referrals', protect, getReferrals);
router.get('/stats', getPlatformStats);

module.exports = router;
