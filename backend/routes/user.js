const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, async (req, res) => {
  const ctrl = require('../controllers/userController');
  return ctrl.getDashboard(req, res);
});

router.get('/profile', protect, async (req, res) => {
  const ctrl = require('../controllers/userController');
  return ctrl.getProfile(req, res);
});

router.put('/profile', protect, async (req, res) => {
  const ctrl = require('../controllers/userController');
  return ctrl.updateProfile(req, res);
});

router.post('/withdraw', protect, async (req, res) => {
  const ctrl = require('../controllers/userController');
  return ctrl.requestWithdrawal(req, res);
});

module.exports = router;
