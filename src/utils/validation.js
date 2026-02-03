/**
 * Validation Utilities
 * Common validation functions for forms and user input
 * @module utils/validation
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Kenyan format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone) {
    return false;
  }

  // Remove spaces and special characters
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Check if it matches Kenyan phone patterns
  // 07xx xxx xxx or 01xx xxx xxx or +2547xx xxx xxx or 2547xx xxx xxx
  const phoneRegex = /^(\+?254|0)[17]\d{8}$/;
  return phoneRegex.test(cleaned);
};

/**
 * Validate meter number
 * @param {string} meterNumber - Meter number to validate
 * @returns {boolean} True if valid
 */
export const isValidMeterNumber = (meterNumber) => {
  if (!meterNumber) {
    return false;
  }

  // Alphanumeric, 4-20 characters
  const meterRegex = /^[A-Za-z0-9]{4,20}$/;
  return meterRegex.test(meterNumber);
};

/**
 * Validate customer number
 * @param {string} customerNumber - Customer number to validate
 * @returns {boolean} True if valid
 */
export const isValidCustomerNumber = (customerNumber) => {
  if (!customerNumber) {
    return false;
  }

  // Alphanumeric, 3-15 characters
  const customerRegex = /^[A-Za-z0-9]{3,15}$/;
  return customerRegex.test(customerNumber);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  return { valid: true, message: "Password is strong" };
};

/**
 * Validate amount/currency value
 * @param {string|number} amount - Amount to validate
 * @returns {boolean} True if valid
 */
export const isValidAmount = (amount) => {
  if (amount === null || amount === undefined || amount === "") {
    return false;
  }

  const numAmount = Number(amount);
  return !isNaN(numAmount) && numAmount >= 0;
};

/**
 * Validate meter reading
 * @param {number} previousReading - Previous meter reading
 * @param {number} currentReading - Current meter reading
 * @returns {object} Validation result
 */
export const validateMeterReading = (previousReading, currentReading) => {
  if (!isValidAmount(previousReading) || !isValidAmount(currentReading)) {
    return { valid: false, message: "Invalid reading values" };
  }

  if (Number(currentReading) < Number(previousReading)) {
    return {
      valid: false,
      message: "Current reading cannot be less than previous reading",
    };
  }

  const consumption = Number(currentReading) - Number(previousReading);

  // Flag unusually high consumption (> 1000 m³) as potentially abnormal
  if (consumption > 1000) {
    return {
      valid: true,
      message: "Warning: High consumption detected",
      warning: true,
    };
  }

  return { valid: true, message: "Valid reading" };
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if not empty
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
};

/**
 * Validate date is not in the future
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if not in future
 */
export const isNotFutureDate = (date) => {
  if (!date) {
    return false;
  }

  const dateObj = new Date(date);
  const now = new Date();

  return dateObj <= now;
};

/**
 * Validate ID number (Kenyan format)
 * @param {string} idNumber - ID number to validate
 * @returns {boolean} True if valid
 */
export const isValidIDNumber = (idNumber) => {
  if (!idNumber) {
    return false;
  }

  // Kenyan ID: 7-8 digits
  const idRegex = /^\d{7,8}$/;
  return idRegex.test(idNumber);
};

export default {
  isValidEmail,
  isValidPhone,
  isValidMeterNumber,
  isValidCustomerNumber,
  validatePassword,
  isValidAmount,
  validateMeterReading,
  isRequired,
  isNotFutureDate,
  isValidIDNumber,
};
