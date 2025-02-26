const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');


const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};


const verifyToken = async (token) => {
  try {
    return await promisify(jwt.verify)(token, config.jwtSecret);
  } catch (error) {
    throw new Error('Invalid token or token expired');
  }
};


const extractToken = (req) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  return token;
};

module.exports = {
  generateToken,
  verifyToken,
  extractToken,
};