/**
 * Format Utilities
 * Common formatting functions for currency, dates, numbers, etc.
 * @module utils/format
 */

import { format, parseISO, isValid } from "date-fns";
import { DATE_FORMATS } from "../constants";

/**
 * Format currency value
 * @param {number} value - The value to format
 * @param {string} currency - Currency code (default: KES)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = "KES") => {
  if (value === null || value === undefined || isNaN(value)) {
    return `${currency} 0.00`;
  }

  const formatted = Number(value)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${formatted}`;
};

/**
 * Format date string
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: display format)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = DATE_FORMATS.DISPLAY) => {
  if (!date) {
    return "";
  }

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;

    if (!isValid(dateObj)) {
      return "";
    }

    return format(dateObj, formatStr);
  } catch {
    return "";
  }
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) {
    return "";
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Format as: +254 712 345 678
  if (cleaned.startsWith("254")) {
    return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }

  // Format as: 0712 345 678
  if (cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }

  return phone;
};

/**
 * Format number with thousand separators
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number
 */
export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }

  return Number(value)
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 50)
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return `${text.substring(0, maxLength)}...`;
};

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalizeWords = (text) => {
  if (!text) {
    return "";
  }

  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Format meter reading consumption
 * @param {number} consumption - Water consumption in cubic meters
 * @returns {string} Formatted consumption
 */
export const formatConsumption = (consumption) => {
  if (consumption === null || consumption === undefined || isNaN(consumption)) {
    return "0 m³";
  }

  return `${formatNumber(consumption, 2)} m³`;
};

/**
 * Generate initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) {
    return "";
  }

  const parts = name.trim().split(" ");

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default {
  formatCurrency,
  formatDate,
  formatPhone,
  formatNumber,
  formatFileSize,
  truncateText,
  capitalizeWords,
  formatConsumption,
  getInitials,
};
