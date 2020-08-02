import winston from 'winston'

const { combine, timestamp, prettyPrint, colorize, printf } = winston.format;

const Logger = winston.createLogger({
  format: combine(timestamp(), prettyPrint(), colorize(), printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`)),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' }),
  ],
});

export default Logger