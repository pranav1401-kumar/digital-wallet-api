const axios = require('axios');
const Currency = require('../models/Currency');
const config = require('../config/config');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');


const initializeCurrencies = async () => {
  try {

    const count = await Currency.countDocuments();
    
    if (count === 0) {
     
      const baseCurrencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
      ];
      
      await Currency.insertMany(baseCurrencies);
      logger.info('Base currencies initialized');
      
   
      await updateExchangeRates();
    }
  } catch (error) {
    logger.error(`Error initializing currencies: ${error.message}`);
  }
};


const updateExchangeRates = async () => {
  try {
  
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/USD`,
      {
        params: {
          apiKey: config.exchangeRateApiKey,
        },
      }
    );
    
    const rates = response.data.rates;
    
  
    const currencies = await Currency.find();
    
    for (const currency of currencies) {
      currency.rates = new Map();
      
      for (const [code, rate] of Object.entries(rates)) {
      
        const targetCurrency = currencies.find(c => c.code === code);
        if (targetCurrency) {
   
          const baseRate = rates[currency.code];
          currency.rates.set(code, rate / baseRate);
        }
      }
      
      currency.lastUpdated = new Date();
      await currency.save();
    }
    
    logger.info('Exchange rates updated successfully');
  } catch (error) {
    logger.error(`Error updating exchange rates: ${error.message}`);
    throw new AppError('Failed to update exchange rates', 500);
  }
};

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
  
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    const currency = await Currency.findOne({ code: fromCurrency });
    
    if (!currency) {
      throw new AppError(`Currency ${fromCurrency} not found`, 404);
    }
    
    
    if (!currency.rates.has(toCurrency)) {
      throw new AppError(`Exchange rate for ${toCurrency} not available`, 400);
    }
    
    const rate = currency.rates.get(toCurrency);
    return amount * rate;
  } catch (error) {
    logger.error(`Error converting currency: ${error.message}`);
    throw error;
  }
  
};

const updateCurrencyRates = async () => {
    try {
      
      const currencies = await Currency.find();
      
    
      const usdRates = {
        'USD': 1,
        'EUR': 0.85,
        'GBP': 0.73,
        'JPY': 110.25,
        'INR': 82.75
      };
      
    
      for (const currency of currencies) {
    
        const baseRate = usdRates[currency.code] || 1;
        
       
        const rates = new Map();
        for (const [code, rate] of Object.entries(usdRates)) {
          rates.set(code, rate / baseRate);
        }
        
       
        currency.rates = rates;
        currency.lastUpdated = new Date();
        await currency.save();
      }
      
      logger.info('Currency rates updated successfully');
    } catch (error) {
      logger.error(`Error updating currency rates: ${error.message}`);
      throw error;
    }
  };
  const isCurrencySupported = async (code) => {
    try {
      const currency = await Currency.findOne({ code: code.toUpperCase() });
      return !!currency; 
    } catch (error) {
      logger.error(`Error checking if currency is supported: ${error.message}`);
      return false;
    }
  };

module.exports = {
  initializeCurrencies,
  updateExchangeRates,
  convertCurrency,
  updateCurrencyRates,
  isCurrencySupported,
};