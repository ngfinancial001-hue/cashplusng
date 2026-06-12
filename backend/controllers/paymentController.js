const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const LEVELS = require('../config/levels');
const { initializePayment, verifyPayment } = require('../config/paystack');
const { createVirtualAccount, verifyMonnifyWebhook } = require('../config/monnify');

exports.initPaystack = async (req, res) => {
  try {
    const { levelId } = req.body;
    const level = LEVELS[levelId];
    if (!level) return res.status(400).json({ success: false, message: 'Invalid level' });
    const reference = 'CPN_PS_' + Date.now() + '_' + req.user._id.toString().slice(-6);
    const result = await initializePayment({ email: req.user.email, amount: level.price, reference, callbackUrl: `${process.env.APP_URL}/api/payment/paystack/callback`, metadata: { userId: req.user._id, levelId } });
    await Transaction.create({ user: req.user._id, type: 'activation', amount: level.price, status: 'pending', reference, gateway: 'paystack', description: `${level.name} level activation`, metadata: { levelId } });
    res.json({ success: true, authorizationUrl: result.data.authorization_url, reference });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Payment initialization failed' });
  }
};

exports.verifyPaystack = async (req, res) => {
  try {
    const { reference } = req.params;
    const result = await verifyPayment(reference);
    if (result.data.status !== 'success') {
      await Transaction.findOneAndUpdate({ reference }, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment not successful' });
    }
    const txn = await Transaction.findOneAndUpdate({ reference, status: 'pending' }, { status: 'success' }, { new: true });
    if (!txn) return res.json({ success: true, message: 'Already processed' });
    await activateLevel(txn.user, txn.metadata.levelId);
    res.json({ success: true, message: 'Payment verified and level activated!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

exports.paystackWebhook = async (req, res) => {
  try {
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) return res.status(400).send('Invalid signature');
    if (req.body.event === 'charge.success') {
      const { reference, metadata } = req.body.data;
      const txn = await Transaction.findOneAndUpdate({ reference, status: 'pending' }, { status: 'success' }, { new: true });
      if (txn && metadata?.levelId) await activateLevel(txn.user, metadata.levelId);
    }
    res.sendStatus(200);
  } catch (err) { res.sendStatus(500); }
};

exports.getMonnifyAccount = async (req, res) => {
  try {
    const { levelId } = req.body;
    const level = LEVELS[levelId];
    if (!level) return res.status(400).json({ success: false, message: 'Invalid level' });
    const user = await User.findById(req.user._id);
    const accountReference = `CPN_${user._id}_${levelId}_${Date.now()}`;
    const result = await createVirtualAccount({ accountReference, accountName: `CashplusNG - ${user.fullName}`, customerEmail: user.email, customerName: user.fullName });
    if (!result.requestSuccessful) return res.status(500).json({ success: false, message: 'Failed to create virtual account' });
    const primaryAccount = result.responseBody.accounts[0];
    await Transaction.create({ user: user._id, type: 'activation', amount: level.price, status: 'pending', reference: accountReference, gateway: 'monnify', description: `${level.name} activation`, metadata: { levelId, accountReference } });
    res.json({ success: true, primaryAccount: { bankName: primaryAccount.bankName, accountNumber: primaryAccount.accountNumber, accountName: `CashplusNG - ${user.fullName}`, amount: level.price }, reference: accountReference });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Monnify virtual account creation failed' });
  }
};

exports.monnifyWebhook = async (req, res) => {
  try {
    const isValid = verifyMonnifyWebhook(req.body, req.headers['monnify-signature']);
    if (!isValid) return res.status(400).json({ message: 'Invalid signature' });
    if (req.body.eventType === 'SUCCESSFUL_TRANSACTION') {
      const txn = await Transaction.findOneAndUpdate({ reference: req.body.eventData?.metaData?.accountReference, status: 'pending' }, { status: 'success' }, { new: true });
      if (txn && txn.metadata?.levelId) await activateLevel(txn.user, txn.metadata.levelId);
    }
    res.sendStatus(200);
  } catch (err) { res.sendStatus(500); }
};

exports.claimDailyReward = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const mem = user.activeMembership;
    if (!mem.isActive) return res.status(400).json({ success: false, message: 'No active membership' });
    const today = new Date(); today.setHours(0,0,0,0);
    if (mem.lastClaimDate) {
      const last = new Date(mem.lastClaimDate); last.setHours(0,0,0,0);
      if (last.getTime() === today.getTime())
        return res.status(400).json({ success: false, message: 'Already claimed today. Come back tomorrow!' });
    }
    const reward = mem.dailyReward;
    user.activeMembership.currentDay += 1;
    user.activeMembership.lastClaimDate = new Date();
    user.walletBalance += reward;
    user.totalEarned += reward;
    if (user.activeMembership.currentDay >= 7) {
      user.activeMembership.isCompleted = true;
      user.activeMembership.isActive = false;
    }
    await user.save();
    await Transaction.create({ user: user._id, type: 'reward', amount: reward, status: 'success', gateway: 'system', description: `Day ${user.activeMembership.currentDay} reward - ${mem.levelName}` });
    res.json({ success: true, message: `Day ${user.activeMembership.currentDay} reward of ₦${reward.toLocaleString()} credited!`, walletBalance: user.walletBalance, currentDay: user.activeMembership.currentDay });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to claim reward' });
  }
};
