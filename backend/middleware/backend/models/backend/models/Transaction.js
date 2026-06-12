const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'reward', 'referral', 'activation'],
    required: true,
  },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'processing'],
    default: 'pending',
  },
  reference: { type: String, unique: true },
  gateway: { type: String, enum: ['paystack', 'monnify', 'system'], default: 'system' },
  description: { type: String, default: '' },
  metadata: { type: Object, default: {} },
  bankName: { type: String },
  accountNumber: { type: String },
  accountName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.reference) {
    this.reference = 'TXN' + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Transaction
