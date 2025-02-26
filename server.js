const app = require('./app');
const config = require('./config/config');
const connectDB = require('./config/db');
const logger = require('./utils/logger');


connectDB();

const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});


process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err.message}`);
 
  server.close(() => process.exit(1));
});