const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  walletBalance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  bankName: { type: String, default: '' },
  accountNumber: { type: String, default: '' },
  accountName: { type: String, default: '' },
  activeMembership: {
    level: { type: String, default: null },
    levelName: { type: String, default: null },
    amountPaid: { type: Number, default: 0 },
    dailyReward: { type: Number, default: 0 },
    totalPayout: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    currentDay: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    lastClaimDate: { type: Date, default: null },
  },
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referralEarnings: { type: Number, default: 0 },
  referralCount: { type: Number, default: 0 },
  monnifyAccountNumber: { type: String, default: null },
  monnifyBankName: { type: String, default: null },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = 'CPN' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
