const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Wallet balance cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    dailyTransactionAmount: {
      type: Number,
      default: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);


walletSchema.methods.exceedsDailyLimit = function (amount, maxDailyAmount) {
  const today = new Date().setHours(0, 0, 0, 0);
  const lastReset = new Date(this.lastResetDate).setHours(0, 0, 0, 0);
  
  if (today > lastReset) {
    this.dailyTransactionAmount = 0;
    this.lastResetDate = new Date();
  }

  return this.dailyTransactionAmount + amount > maxDailyAmount;
};


walletSchema.methods.updateDailyAmount = function (amount) {
  this.dailyTransactionAmount += amount;
  return this.save();
};

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;