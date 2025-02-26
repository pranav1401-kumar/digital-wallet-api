const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const walletService = require('../services/walletService');


exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('wallet');
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.updateMe = async (req, res, next) => {
  try {
    
    if (req.body.password) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updatePassword.',
          400
        )
      );
    }
    
   
    const filteredBody = filterObj(req.body, 'name', 'defaultCurrency');
    
    
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });
    
    
    if (req.body.defaultCurrency) {
      await walletService.updateWalletCurrency(
        req.user.id,
        req.body.defaultCurrency
      );
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.deleteMe = async (req, res, next) => {
  try {
    
    await User.findByIdAndUpdate(req.user.id, { active: false });
    
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};


const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};