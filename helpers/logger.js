const fs = require("fs");
const path = require("path");

// Check if the logs directory exists, if not, create it
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf } = format;

// Define log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

// Create the logger
const logger = createLogger({
  level: "error",
  format: combine(timestamp(), logFormat),
  transports: [
    new transports.File({ filename: path.join(logDir, "error.log"), level: "error" }) // Log errors to file
  ]
});

module.exports = logger;
