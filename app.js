const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const swaggerSetup = require('./config/swagger');
const { errorHandler } = require('./middleware/errorHandler');



const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const walletRoutes = require('./routes/walletRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();


app.use(express.json());


app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(xss());


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


swaggerSetup(app);


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/wallets', walletRoutes);
app.use('/api/v1/transactions', transactionRoutes);


app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Digital Wallet API' });
});


app.use(errorHandler);

module.exports = app;