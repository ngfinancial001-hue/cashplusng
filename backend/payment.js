const express = require('express');
const router  = express.Router();
const {
  initialize,
  verifyPaystack,
  paystackWebhook,
  monnifyWebhook,
  getHistory,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/initialize',       protect, initialize);
router.get('/verify/:reference', protect, verifyPaystack);
router.get('/history',           protect, getHistory);
router.post('/webhook/paystack', paystackWebhook);
router.post('/webhook/monnify',  monnifyWebhook);

module.exports = router;
