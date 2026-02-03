/**
 * Common API Response Types
 * @module types/api
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

// Customer Types
export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive" | "suspended";
  tariffCategory?: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice/Bill Types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  billType?: string;
  createdAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  amount: number;
  paymentMethod: "cash" | "mpesa" | "bank" | "cheque";
  status: "completed" | "pending" | "failed";
  transactionRef?: string;
  paymentDate: string;
  createdAt: string;
}

// Receipt Types
export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  customerId: string;
  amount: number;
  issuedDate: string;
  createdAt: string;
}

// Meter Reading Types
export interface MeterReading {
  id: string;
  meterId: string;
  customerId: string;
  previousReading: number;
  currentReading: number;
  consumption: number;
  readingDate: string;
  status: "normal" | "abnormal";
  createdAt: string;
}

// Connection Types
export interface Connection {
  id: string;
  customerId: string;
  connectionNumber: string;
  meterId?: string;
  status: "active" | "disconnected" | "pending";
  connectionDate?: string;
  createdAt: string;
}

// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  status: "active" | "inactive";
  createdAt: string;
}

// Task Types
export interface Task {
  id: string;
  taskType: string;
  assignedTo?: string;
  customerId?: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  description?: string;
  createdAt: string;
}

// Organization/Scheme Types
export interface Scheme {
  id: string;
  name: string;
  code?: string;
  location?: string;
  status: "active" | "inactive";
}

export interface Zone {
  id: string;
  schemeId: string;
  name: string;
  code?: string;
}

export interface Route {
  id: string;
  zoneId: string;
  name: string;
  code?: string;
}
