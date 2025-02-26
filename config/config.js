require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  mongoURI: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY,
  nodeEnv: process.env.NODE_ENV,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX),
  maxDailyTransactionAmount: parseFloat(process.env.MAX_DAILY_TRANSACTION_AMOUNT)
};
