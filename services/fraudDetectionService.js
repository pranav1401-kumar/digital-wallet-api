
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const logger = require('../utils/logger');
const config = require('../config/config');




const detectSuspiciousActivity = async (userId, transactionType, amount) => {
  try {

    const dailyLimitExceeded = await checkDailyLimit(userId, amount);
    
 
    const highVelocity = await checkTransactionVelocity(userId);
    
  
    const unusualPattern = await checkUnusualPatterns(userId, transactionType, amount);
    
   
    const isHighRiskAmount = amount > 10000; // Flag transactions over $5000
    

    const timingAnomaly = await detectTimingAnomalies(userId);
   
    if (dailyLimitExceeded || highVelocity || unusualPattern || isHighRiskAmount || timingAnomaly) {
      logger.warn(`Suspicious activity detected for user ${userId}:`, {
        userId,
        transactionType,
        amount,
        flags: {
          dailyLimitExceeded,
          highVelocity,
          unusualPattern,
          isHighRiskAmount,
          timingAnomaly
        },
      });
    }
    
   
    return dailyLimitExceeded || highVelocity || unusualPattern || isHighRiskAmount || timingAnomaly;
  } catch (error) {
    logger.error(`Error detecting suspicious activity: ${error.message}`);
    return false; 
  }
};


const checkDailyLimit = async (userId, amount) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
   
    const result = await Transaction.aggregate([
      {
        $match: {
          sender: userId,
          createdAt: { $gte: today },
          status: { $in: ['COMPLETED', 'PENDING', 'FLAGGED'] },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$convertedAmount' },
        },
      },
    ]);
    
    const dailyTotal = result.length > 0 ? result[0].totalAmount : 0;
    
 
    return dailyTotal + amount > config.maxDailyTransactionAmount;
  } catch (error) {
    logger.error(`Error checking daily limit: ${error.message}`);
    return false;
  }
};


const checkTransactionVelocity = async (userId) => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
   
    const recentTransactions = await Transaction.countDocuments({
      sender: userId,
      createdAt: { $gte: oneHourAgo },
    });
    

    return recentTransactions >= 5;
  } catch (error) {
    logger.error(`Error checking transaction velocity: ${error.message}`);
    return false;
  }
};


const checkUnusualPatterns = async (userId, transactionType, amount) => {
  try {
 
    const transactions = await Transaction.find({ sender: userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    if (transactions.length < 3) {
      
      return false;
    }
    

    const avgAmount = transactions.reduce((sum, txn) => sum + txn.convertedAmount, 0) / transactions.length;
    
  
    const isUnusualAmount = amount > avgAmount * 3;
    

    const typeCount = transactions.filter(txn => txn.type === transactionType).length;
    const isUnusualType = typeCount === 0; 
    
    return isUnusualAmount || isUnusualType;
  } catch (error) {
    logger.error(`Error checking unusual patterns: ${error.message}`);
    return false;
  }
};

const detectTimingAnomalies = async (userId) => {
  try {
    const transactions = await Transaction.find({ sender: userId })
      .sort({ createdAt: 1 })
      .limit(20);
    
    if (transactions.length < 5) {
      return false;
    }
    
    const timeDiffs = [];
    for (let i = 1; i < transactions.length; i++) {
      const diff = transactions[i].createdAt - transactions[i - 1].createdAt;
      timeDiffs.push(diff);
    }
    
    const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    const stdDeviation = Math.sqrt(
      timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgTimeDiff, 2), 0) / timeDiffs.length
    );
    
    const mostRecentDiff = Date.now() - transactions[transactions.length - 1].createdAt;
    
    return mostRecentDiff < avgTimeDiff - 2 * stdDeviation;
  } catch (error) {
    logger.error(`Error detecting timing anomalies: ${error.message}`);
    return false;
  }
};


const detectLocationAnomaly = async (userId, ipAddress, userAgent, location) => {
  try {
   
    const previousTransactions = await Transaction.find({
      sender: userId,
      'meta.ipAddress': { $exists: true },
    })
      .sort({ createdAt: -1 })
      .limit(5);
    
    if (previousTransactions.length === 0) {
      return false; 
    }
    

    const ipChanged = !previousTransactions.some(txn => txn.meta.ipAddress === ipAddress);
    

    const agentChanged = !previousTransactions.some(txn => txn.meta.userAgent === userAgent);
    
 
    let locationChanged = false;
    if (location && location.coordinates && previousTransactions[0].meta.location) {
      const prevLocation = previousTransactions[0].meta.location.coordinates;
      
   
      const distance = Math.sqrt(
        Math.pow(location.coordinates.lat - prevLocation.lat, 2) +
        Math.pow(location.coordinates.lng - prevLocation.lng, 2)
      );
      
      locationChanged = distance > 0.1; 
    }
    
    return ipChanged && (agentChanged || locationChanged);
  } catch (error) {
    logger.error(`Error detecting location anomaly: ${error.message}`);
    return false;
  }
};


const logSuspiciousActivity = async (userId, transactionId) => {
  try {
    logger.warn(`Suspicious activity detected for user ${userId} on transaction ${transactionId}`);
    

    const user = await User.findById(userId);
    

    const transaction = await Transaction.findById(transactionId);
    
    logger.warn({
      message: 'Suspicious activity details',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      transaction: {
        id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt,
      },
    });
    
 
    await Transaction.findByIdAndUpdate(transactionId, { status: 'FLAGGED' });
  } catch (error) {
    logger.error(`Error logging suspicious activity: ${error.message}`);
  }
};


const calculateRiskScore = async (userId, transactionType, amount, meta = {}) => {
  try {
    let riskScore = 0;
    const typeScores = {
      DEPOSIT: 1,
      WITHDRAWAL: 3,
      TRANSFER: 2,
    };
    

    riskScore += typeScores[transactionType] || 0;
    
    riskScore += Math.floor(amount / 1000);
    
    const user = await User.findById(userId);
    const accountAge = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24); 
    
   
    if (accountAge < 7) {
      riskScore += 5;
    } else if (accountAge < 30) {
      riskScore += 2;
    }
    
 
    const transactionCount = await Transaction.countDocuments({ sender: userId });
    
  
    if (transactionCount < 5) {
      riskScore += 3;
    }

    if (await checkDailyLimit(userId, amount)) {
      riskScore += 5;
    }
    

    if (await checkUnusualPatterns(userId, transactionType, amount)) {
      riskScore += 4;
    }
    

    if (await checkTransactionVelocity(userId)) {
      riskScore += 3;
    }
    
  
    if (meta.ipAddress && meta.userAgent) {
      if (await detectLocationAnomaly(userId, meta.ipAddress, meta.userAgent, meta.location)) {
        riskScore += 7;
      }
    }
    
    return {
      score: riskScore,
      level: riskScore < 5 ? 'LOW' : riskScore < 10 ? 'MEDIUM' : 'HIGH',
    };
  } catch (error) {
    logger.error(`Error calculating risk score: ${error.message}`);
    return {
      score: 0,
      level: 'UNKNOWN',
    };
  }
};


const handleHighRiskTransaction = async (transaction, riskScore) => {
  try {
   
    transaction.meta = {
      ...transaction.meta,
      riskScore,
      flaggedAt: new Date(),
    };
    
    
    if (riskScore.level === 'HIGH') {
     
      transaction.status = 'FLAGGED';
      
     
      logger.warn(`High risk transaction detected: ${transaction._id}`, {
        transaction,
        riskScore,
      });
      
      
    }
    
  
    else if (riskScore.level === 'MEDIUM') {
      
      logger.info(`Medium risk transaction detected: ${transaction._id}`, {
        transaction,
        riskScore,
      });
      
    
    }
    
    await transaction.save();
    
    return transaction;
  } catch (error) {
    logger.error(`Error handling high-risk transaction: ${error.message}`);
    return transaction;
  }
};

module.exports = {
  detectSuspiciousActivity,
  logSuspiciousActivity,
  checkDailyLimit,
  checkTransactionVelocity,
  checkUnusualPatterns,
  detectTimingAnomalies,
  detectLocationAnomaly,
  calculateRiskScore,
  handleHighRiskTransaction,
};