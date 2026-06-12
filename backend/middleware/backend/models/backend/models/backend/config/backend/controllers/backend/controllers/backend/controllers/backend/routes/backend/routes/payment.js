const express = require('express');
const router = express.Router();
const { initPaystack, verifyPaystack, paystackWebhook, getMonnifyAccount, monnifyWebhook, claimDailyReward, requestWithdrawal } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/paystack/initialize', protect, initPaystack);
router.get('/paystack/verify/:reference', protect, verifyPaystack);
router.post('/paystack/webhook', paystackWebhook);
router.post('/monnify/virtual-account', protect, getMonnifyAccount);
router.post('/monnify/webhook', monnifyWebhook);
router.post('/claim-reward', protect, claimDailyReward);
router.post('/withdraw', protect, requestWithdrawal);

module.exports = router;
