const walletService = require('../services/walletService');
const currencyService = require('../services/currencyService');
const { AppError } = require('../middleware/errorHandler');


exports.getWalletBalance = async (req, res, next) => {
  try {
    const wallet = await walletService.getUserWallet(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.addFunds = async (req, res, next) => {
  try {
    const { amount, currency } = req.body;
    
    const { transaction, wallet } = await walletService.addFunds(
      req.user.id,
      amount,
      currency || req.user.defaultCurrency
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction,
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.transferFunds = async (req, res, next) => {
  try {
    const { recipientId, amount, currency } = req.body;
    
    const { transaction, senderWallet } = await walletService.transferFunds(
      req.user.id,
      recipientId,
      amount,
      currency || req.user.defaultCurrency
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction,
        wallet: {
          balance: senderWallet.balance,
          currency: senderWallet.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.withdrawFunds = async (req, res, next) => {
  try {
    const { amount, currency } = req.body;
    
    const { transaction, wallet } = await walletService.withdrawFunds(
      req.user.id,
      amount,
      currency || req.user.defaultCurrency
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction,
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.changeWalletCurrency = async (req, res, next) => {
  try {
    const { currency } = req.body;
    
    if (!currency) {
      return next(new AppError('Please provide a currency', 400));
    }
    
 
    const isCurrencySupported = await currencyService.isCurrencySupported(currency);
    if (!isCurrencySupported) {
      return next(new AppError(`Currency ${currency} is not supported`, 400));
    }
    

    const wallet = await walletService.updateWalletCurrency(req.user.id, currency);
    
 
    await User.findByIdAndUpdate(req.user.id, { defaultCurrency: currency });
    
    res.status(200).json({
      status: 'success',
      data: {
        wallet: {
          balance: wallet.balance,
          currency: wallet.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.getWalletDetails = async (req, res, next) => {
  try {
    const wallet = await walletService.getUserWallet(req.user.id);
    
  
    const stats = await walletService.getWalletStats(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        wallet: {
          id: wallet._id,
          balance: wallet.balance,
          currency: wallet.currency,
          isActive: wallet.isActive,
          createdAt: wallet.createdAt,
          stats,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};