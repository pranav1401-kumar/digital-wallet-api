
const mongoose = require('mongoose');
const axios = require('axios');
const Currency = require('./models/Currency');
const config = require('./config/config');


mongoose.connect(config.mongoURI)
  .then(() => console.log('MongoDB connected for fixing currencies'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });


const fixCurrencyRates = async () => {
  try {

    let rates = {};
    try {
      const response = await axios.get('https://open.er-api.com/v6/latest/USD');
      if (response.data && response.data.rates) {
        rates = response.data.rates;
        console.log('Successfully fetched rates from API');
      }
    } catch (error) {
      console.warn('Failed to fetch from API, using fallback rates');
     
      rates = {
        'USD': 1,
        'EUR': 0.92,
        'GBP': 0.79,
        'JPY': 150.59,
        'INR': 83.24,
        'CAD': 1.35,
        'AUD': 1.52,
        'CNY': 7.21,
        'CHF': 0.88
      };
    }
    
   
    await Currency.deleteMany({});
    console.log('Deleted existing currencies');
   
    const currencies = [];
    
   
    for (const [code, baseRate] of Object.entries(rates)) {
      
      if (!['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CNY', 'CHF'].includes(code)) {
        continue;
      }
      
      const currencyRates = new Map();
     
      for (const [targetCode, targetRate] of Object.entries(rates)) {
        if (['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CNY', 'CHF'].includes(targetCode)) {
          currencyRates.set(targetCode, targetRate / baseRate);
        }
      }
   
      let symbol = '';
      switch(code) {
        case 'USD': symbol = '$'; break;
        case 'EUR': symbol = '€'; break;
        case 'GBP': symbol = '£'; break;
        case 'JPY': symbol = '¥'; break;
        case 'INR': symbol = '₹'; break;
        case 'CAD': symbol = 'C$'; break;
        case 'AUD': symbol = 'A$'; break;
        case 'CNY': symbol = '¥'; break;
        case 'CHF': symbol = 'CHF'; break;
        default: symbol = code;
      }
      
    
      currencies.push({
        code,
        name: `${code} Currency`, 
        symbol,
        rates: currencyRates,
        lastUpdated: new Date()
      });
    }
    

    await Currency.insertMany(currencies);
    console.log(`Created ${currencies.length} currencies with exchange rates`);
    
 
    const usd = await Currency.findOne({ code: 'USD' });
    if (usd) {
      console.log('USD to INR rate:', usd.rates.get('INR'));
      console.log('USD to EUR rate:', usd.rates.get('EUR'));
    }
    
    const inr = await Currency.findOne({ code: 'INR' });
    if (inr) {
      console.log('INR to USD rate:', inr.rates.get('USD'));
      console.log('INR to EUR rate:', inr.rates.get('EUR'));
    }
    
    console.log('Currency rates fixed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing currency rates:', error);
    process.exit(1);
  }
};

fixCurrencyRates();