const Transaction = require('../models/Transaction');
const walletService = require('../services/walletService');
const { AppError } = require('../middleware/errorHandler');


exports.getTransactionHistory = async (req, res, next) => {
  try {
  
    const { type, status, startDate, endDate } = req.query;
    
 
    const filter = {};
    
    if (type) filter.type = type.toUpperCase();
    if (status) filter.status = status.toUpperCase();
    

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const transactions = await walletService.getTransactionHistory(req.user.id, filter);
    
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('sender', 'name email')
      .populate('recipient', 'name email');
    
    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }
    

    if (
      transaction.sender._id.toString() !== req.user.id &&
      (transaction.recipient && transaction.recipient._id.toString() !== req.user.id)
    ) {
      return next(
        new AppError('You do not have permission to view this transaction', 403)
      );
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactionSummary = async (req, res, next) => {
  try {
    const { period } = req.query; 
   
    const endDate = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(endDate);
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(endDate);
        startDate.setMonth(endDate.getMonth() - 1); 
    }
    
    
    const filter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };
    
    const transactions = await walletService.getTransactionHistory(req.user.id, filter);
    
    
    const summary = {
      period,
      startDate,
      endDate,
      totalCount: transactions.length,
      deposits: {
        count: 0,
        total: 0,
      },
      withdrawals: {
        count: 0,
        total: 0,
      },
      transfers: {
        sent: {
          count: 0,
          total: 0,
        },
        received: {
          count: 0,
          total: 0,
        },
      },
    };
    
    
    transactions.forEach((txn) => {
      if (txn.type === 'DEPOSIT') {
        summary.deposits.count++;
        summary.deposits.total += txn.convertedAmount;
      } else if (txn.type === 'WITHDRAWAL') {
        summary.withdrawals.count++;
        summary.withdrawals.total += txn.convertedAmount;
      } else if (txn.type === 'TRANSFER') {
        
        if (txn.sender._id.toString() === req.user.id) {
          summary.transfers.sent.count++;
          summary.transfers.sent.total += txn.convertedAmount;
        } else if (txn.recipient && txn.recipient._id.toString() === req.user.id) {
          summary.transfers.received.count++;
          summary.transfers.received.total += txn.convertedAmount;
        }
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactionReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return next(new AppError('Please provide start and end dates', 400));
    }
    
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next(new AppError('Invalid date format', 400));
    }
    
   
    const filter = {
      createdAt: {
        $gte: start,
        $lte: end,
      },
    };
    
    
    const transactions = await walletService.getTransactionHistory(req.user.id, filter);
    
    
    const summary = {
      totalTransactions: transactions.length,
      deposits: {
        count: 0,
        amount: 0,
      },
      withdrawals: {
        count: 0,
        amount: 0,
      },
      transfers: {
        sent: {
          count: 0,
          amount: 0,
        },
        received: {
          count: 0,
          amount: 0,
        },
      },
    };
    
    
    transactions.forEach((transaction) => {
      switch (transaction.type) {
        case 'DEPOSIT':
          summary.deposits.count++;
          summary.deposits.amount += transaction.convertedAmount;
          break;
        case 'WITHDRAWAL':
          summary.withdrawals.count++;
          summary.withdrawals.amount += transaction.convertedAmount;
          break;
        case 'TRANSFER':
          
          if (transaction.sender._id.toString() === req.user.id) {
            summary.transfers.sent.count++;
            summary.transfers.sent.amount += transaction.convertedAmount;
          } else if (transaction.recipient && transaction.recipient._id.toString() === req.user.id) {
            summary.transfers.received.count++;
            summary.transfers.received.amount += transaction.convertedAmount;
          }
          break;
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        startDate,
        endDate,
        summary,
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};