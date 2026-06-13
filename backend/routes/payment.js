const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.post('/initialize', protect, async (req, res) => {
  const ctrl = require('../controllers/paymentController');
  return ctrl.initialize(req, res);
});

router.get('/verify/:reference', protect, async (req, res) => {
  const ctrl = require('../controllers/paymentController');
  return ctrl.verifyPaystack(req, res);
});

router.get('/history', protect, async (req, res) => {
  const ctrl = require('../controllers/paymentController');
  return ctrl.getHistory(req, res);
});

router.post('/webhook/paystack', async (req, res) => {
  const ctrl = require('../controllers/paymentController');
  return ctrl.paystackWebhook(req, res);
});

router.post('/webhook/monnify', async (req, res) => {
  const ctrl = require('../controllers/paymentController');
  return ctrl.monnifyWebhook(req, res);
});

module.exports = router
