/**
 * Logger Utility
 * Provides structured logging with environment-aware output
 * @module utils/logger
 */

import env from "../config/env";

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

/**
 * Should log based on environment
 */
const shouldLog = (level) => {
  // Only log warnings and errors in production
  if (env.PROD) {
    return level === LogLevel.WARN || level === LogLevel.ERROR;
  }
  return true;
};

/**
 * Format log message
 */
const formatMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level,
    message,
    data,
  };
};

/**
 * Log debug information (development only)
 */
export const logDebug = (message, data = null) => {
  if (shouldLog(LogLevel.DEBUG)) {
    const formatted = formatMessage(LogLevel.DEBUG, message, data);
    // eslint-disable-next-line no-console
    console.log("🔍 [DEBUG]", formatted.message, data || "");
  }
};

/**
 * Log informational messages (development only)
 */
export const logInfo = (message, data = null) => {
  if (shouldLog(LogLevel.INFO)) {
    const formatted = formatMessage(LogLevel.INFO, message, data);
    // eslint-disable-next-line no-console
    console.log("ℹ️ [INFO]", formatted.message, data || "");
  }
};

/**
 * Log warnings (all environments)
 */
export const logWarning = (message, data = null) => {
  if (shouldLog(LogLevel.WARN)) {
    const formatted = formatMessage(LogLevel.WARN, message, data);
    console.warn("⚠️ [WARN]", formatted.message, data || "");
  }
};

/**
 * Log errors (all environments)
 */
export const logError = (message, error = null) => {
  if (shouldLog(LogLevel.ERROR)) {
    const formatted = formatMessage(LogLevel.ERROR, message, error);
    console.error("❌ [ERROR]", formatted.message);

    if (error) {
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data,
      });
    }
  }
};

/**
 * Log API errors with structured data
 */
export const logApiError = (endpoint, error) => {
  const errorDetails = {
    endpoint,
    status: error?.response?.status,
    statusText: error?.response?.statusText,
    message: error?.response?.data?.message || error?.message,
    data: error?.response?.data,
  };

  logError(`API Error: ${endpoint}`, errorDetails);
};

export default {
  debug: logDebug,
  info: logInfo,
  warn: logWarning,
  error: logError,
  apiError: logApiError,
};
