/**
 * Application Constants
 * Central location for all application-wide constants
 * @module constants
 */

// Customer Status
export const CUSTOMER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
};

// Invoice/Bill Status
export const INVOICE_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
  CANCELLED: "cancelled",
  PARTIALLY_PAID: "partially_paid",
};

// Payment Status
export const PAYMENT_STATUS = {
  COMPLETED: "completed",
  PENDING: "pending",
  FAILED: "failed",
  REVERSED: "reversed",
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: "cash",
  MPESA: "mpesa",
  BANK: "bank",
  CHEQUE: "cheque",
  CARD: "card",
};

// Connection Status
export const CONNECTION_STATUS = {
  ACTIVE: "active",
  DISCONNECTED: "disconnected",
  PENDING: "pending",
  SUSPENDED: "suspended",
};

// Meter Reading Status
export const READING_STATUS = {
  NORMAL: "normal",
  ABNORMAL: "abnormal",
  ESTIMATED: "estimated",
};

// Task Status
export const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Task Priority
export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

// User Status
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  DATETIME: "MMM dd, yyyy HH:mm",
  TIME: "HH:mm:ss",
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100],
};

// API Endpoints (relative to BASE_URL)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  LOGOUT: "/auth/logout",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  VERIFY_OTP: "/auth/verify-otp",

  // Customers
  CUSTOMERS: "/customers",
  CUSTOMER_DETAILS: (id) => `/customers/${id}`,

  // Invoices
  INVOICES: "/invoices/all",
  INVOICE_DETAILS: (id) => `/invoices/${id}`,
  CREATE_INVOICE: "/invoices",

  // Payments
  PAYMENTS: "/payments",
  PAYMENT_DETAILS: (id) => `/payments/${id}`,

  // Receipts
  RECEIPTS: "/receipts",
  RECEIPT_DETAILS: (id) => `/receipts/${id}`,

  // Meter Readings
  METER_READINGS: "/meter-readings",
  ABNORMAL_READINGS: "/meter-readings/abnormal",

  // Connections
  CONNECTIONS: "/connections",
  CONNECTION_DETAILS: (id) => `/connections/${id}`,

  // Users
  USERS: "/users",
  USER_DETAILS: (id) => `/users/${id}`,

  // Settings
  SCHEMES: "/schemes",
  ZONES: "/zones",
  ROUTES: "/routes",
  BILL_TYPES: "/bill-types",

  // SMS
  SMS: "/sms",
  SMS_BALANCE: "/sms/balance",
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  THEME: "theme",
  ORGANIZATION: "organization",
};

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  ACCOUNTANT: "accountant",
  METER_READER: "meter_reader",
  CUSTOMER_SERVICE: "customer_service",
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Please check your input and try again.",
  NOT_FOUND: "The requested resource was not found.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: "Saved successfully",
  UPDATE_SUCCESS: "Updated successfully",
  DELETE_SUCCESS: "Deleted successfully",
  CREATE_SUCCESS: "Created successfully",
};

export default {
  CUSTOMER_STATUS,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  CONNECTION_STATUS,
  READING_STATUS,
  TASK_STATUS,
  TASK_PRIORITY,
  USER_STATUS,
  DATE_FORMATS,
  PAGINATION,
  API_ENDPOINTS,
  STORAGE_KEYS,
  USER_ROLES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
