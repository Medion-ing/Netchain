// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ 
      filename: 'transactions.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

module.exports = logger;
