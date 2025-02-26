const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config/config');


const signToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};


exports.register = async (req, res, next) => {
  try {
    const { name, email, password, defaultCurrency } = req.body;
    
 
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }
    

    const user = await User.create({
      name,
      email,
      password,
      defaultCurrency: defaultCurrency || 'USD',
    });
    

    await Wallet.create({
      user: user._id,
      currency: user.defaultCurrency,
    });
    
    const token = signToken(user._id);
    
    user.password = undefined;
    
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};



exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
    
    
    const token = signToken(user._id);
    
   
    user.password = undefined;
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};


exports.getMe = async (req, res, next) => {
  try {
 
    const user = await User.findById(req.user._id).populate('wallet');
    
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


exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    

    const user = await User.findById(req.user.id).select('+password');
    
 
    if (!(await user.correctPassword(currentPassword, user.password))) {
      return next(new AppError('Your current password is incorrect', 401));
    }

    user.password = newPassword;
    await user.save();
    
 
    const token = signToken(user._id);
    
    res.status(200).json({
      status: 'success',
      token,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};