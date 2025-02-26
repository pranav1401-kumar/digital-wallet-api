const { v4: uuidv4 } = require('uuid');

const generateTransactionReference = () => {
  return `TXN-${uuidv4()}`;
};

module.exports = {
  generateTransactionReference
};