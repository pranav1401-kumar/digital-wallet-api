const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const currencyService = require('./currencyService');
const { generateTransactionReference } = require('../utils/helpers');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config/config');
const fraudDetectionService = require('./fraudDetectionService');


const getUserWallet = async (userId) => {
  const wallet = await Wallet.findOne({ user: userId });
  
  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }
  
  return wallet;
};

const addFunds = async (userId, amount, currency) => {
  const wallet = await Wallet.findOne({ user: userId });
  
  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }
  

  const convertedAmount = await currencyService.convertCurrency(
    amount,
    currency,
    wallet.currency
  );
  
 
  if (wallet.exceedsDailyLimit(convertedAmount, config.maxDailyTransactionAmount)) {
    throw new AppError('Transaction exceeds daily limit', 400);
  }
  

  const isSuspicious = await fraudDetectionService.detectSuspiciousActivity(
    userId,
    'DEPOSIT',
    convertedAmount
  );
  

  const transactionRef = generateTransactionReference();
  

  const transaction = new Transaction({
    transactionReference: transactionRef,
    type: 'DEPOSIT',
    amount,
    currency,
    convertedAmount,
    sender: userId,
    recipient: userId,
    status: isSuspicious ? 'FLAGGED' : 'COMPLETED',
    description: `Deposit of ${amount} ${currency}`,
  });
  

  if (isSuspicious) {
    await fraudDetectionService.logSuspiciousActivity(userId, transaction._id);
  } else {
 
    wallet.balance += convertedAmount;
    await wallet.updateDailyAmount(convertedAmount);
  }
  

  await transaction.save();
  await wallet.save();
  
  return { transaction, wallet };
};


const transferFunds = async (senderId, recipientId, amount, currency) => {

  const senderWallet = await Wallet.findOne({ user: senderId });
  
  if (!senderWallet) {
    throw new AppError('Sender wallet not found', 404);
  }
  

  const recipientWallet = await Wallet.findOne({ user: recipientId });
  
  if (!recipientWallet) {
    throw new AppError('Recipient wallet not found', 404);
  }
  
 
  const amountInSenderCurrency = await currencyService.convertCurrency(
    amount,
    currency,
    senderWallet.currency
  );
  
  if (senderWallet.balance < amountInSenderCurrency) {
    throw new AppError('Insufficient funds', 400);
  }
  

  if (senderWallet.exceedsDailyLimit(amountInSenderCurrency, config.maxDailyTransactionAmount)) {
    throw new AppError('Transaction exceeds daily limit', 400);
  }
  

  const amountInRecipientCurrency = await currencyService.convertCurrency(
    amount,
    currency,
    recipientWallet.currency
  );
  

  const isSuspicious = await fraudDetectionService.detectSuspiciousActivity(
    senderId,
    'TRANSFER',
    amountInSenderCurrency
  );
  

  const transactionRef = generateTransactionReference();
  
  
  const transaction = new Transaction({
    transactionReference: transactionRef,
    type: 'TRANSFER',
    amount,
    currency,
    convertedAmount: amountInSenderCurrency,
    sender: senderId,
    recipient: recipientId,
    status: isSuspicious ? 'FLAGGED' : 'COMPLETED',
    description: `Transfer of ${amount} ${currency} to ${recipientId}`,
  });
  

  if (isSuspicious) {
    await fraudDetectionService.logSuspiciousActivity(senderId, transaction._id);
  } else {

    senderWallet.balance -= amountInSenderCurrency;
    await senderWallet.updateDailyAmount(amountInSenderCurrency);
    
 
    recipientWallet.balance += amountInRecipientCurrency;
  }
  

  await transaction.save();
  await senderWallet.save();
  await recipientWallet.save();
  
  return { transaction, senderWallet };
};


const withdrawFunds = async (userId, amount, currency) => {
  const wallet = await Wallet.findOne({ user: userId });
  
  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }
  

  const convertedAmount = await currencyService.convertCurrency(
    amount,
    currency,
    wallet.currency
  );
  

  if (wallet.balance < convertedAmount) {
    throw new AppError('Insufficient funds', 400);
  }
  
 
  if (wallet.exceedsDailyLimit(convertedAmount, config.maxDailyTransactionAmount)) {
    throw new AppError('Transaction exceeds daily limit', 400);
  }
  
 
  const isSuspicious = await fraudDetectionService.detectSuspiciousActivity(
    userId,
    'WITHDRAWAL',
    convertedAmount
  );
  

  const transactionRef = generateTransactionReference();
  
 
  const transaction = new Transaction({
    transactionReference: transactionRef,
    type: 'WITHDRAWAL',
    amount,
    currency,
    convertedAmount,
    sender: userId,
    status: isSuspicious ? 'FLAGGED' : 'COMPLETED',
    description: `Withdrawal of ${amount} ${currency}`,
  });
  
 
  if (isSuspicious) {
    await fraudDetectionService.logSuspiciousActivity(userId, transaction._id);
  } else {
 
    wallet.balance -= convertedAmount;
    await wallet.updateDailyAmount(convertedAmount);
  }
  

  await transaction.save();
  await wallet.save();
  
  return { transaction, wallet };
};


const getTransactionHistory = async (userId, filter = {}) => {
  const transactions = await Transaction.find({
    $or: [{ sender: userId }, { recipient: userId }],
    ...filter,
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name email')
    .populate('recipient', 'name email');
  
  return transactions;
};

const getWalletStats = async (userId) => {
    try {

      const transactions = await Transaction.find({
        $or: [{ sender: userId }, { recipient: userId }],
      }).sort({ createdAt: -1 });
      
  
      const stats = {
        totalTransactions: transactions.length,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalSent: 0,
        totalReceived: 0,
        recentActivity: transactions.slice(0, 5) 
      };
      

      transactions.forEach(transaction => {
        if (transaction.type === 'DEPOSIT') {
          stats.totalDeposits += transaction.convertedAmount;
        } else if (transaction.type === 'WITHDRAWAL') {
          stats.totalWithdrawals += transaction.convertedAmount;
        } else if (transaction.type === 'TRANSFER') {
          if (transaction.sender.toString() === userId.toString()) {
            stats.totalSent += transaction.convertedAmount;
          }
          if (transaction.recipient && transaction.recipient.toString() === userId.toString()) {
            stats.totalReceived += transaction.convertedAmount;
          }
        }
      });
      
      return stats;
    } catch (error) {
      logger.error(`Error getting wallet stats: ${error.message}`);
      throw error;
    }
  };


const updateWalletCurrency = async (userId, newCurrency) => {
  const wallet = await Wallet.findOne({ user: userId });
  
  if (!wallet) {
    throw new AppError('Wallet not found', 404);
  }
  
 
  const newBalance = await currencyService.convertCurrency(
    wallet.balance,
    wallet.currency,
    newCurrency
  );
  

  wallet.currency = newCurrency;
  wallet.balance = newBalance;
  
  await wallet.save();
  
  return wallet;
};

module.exports = {
  getUserWallet,
  addFunds,
  transferFunds,
  withdrawFunds,
  getTransactionHistory,
  updateWalletCurrency,
  getWalletStats
};