const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const config = require('../config/config');

exports.protect = async (req, res, next) => {
  try {
 
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }


    const decoded = await promisify(jwt.verify)(token, config.jwtSecret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }


    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};