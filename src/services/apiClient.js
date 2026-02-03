/**
 * Centralized Axios API Client
 * Provides consistent error handling, interceptors, and request/response transformation
 * @module services/apiClient
 */

import axios from "axios";
import { toast } from "react-toastify";
import env from "../config/env";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: env.BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Return successful response data
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          toast.error(data?.message || "Bad request");
          break;
        case 401:
          toast.error("Session expired. Please login again.");
          // Clear auth and redirect to login
          localStorage.removeItem("token");
          localStorage.removeItem("currentUser");
          // Force page reload to reset app state
          setTimeout(() => {
            window.location.href = "/login";
          }, 1000);
          break;
        case 403:
          toast.error("Access denied");
          break;
        case 404:
          toast.error(data?.message || "Resource not found");
          break;
        case 422:
          toast.error(data?.message || "Validation error");
          break;
        case 500:
          toast.error("Server error. Please try again later.");
          break;
        default:
          toast.error(data?.message || "An error occurred");
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error("Network error. Please check your connection.");
    } else {
      // Something else happened
      toast.error("An unexpected error occurred");
    }

    return Promise.reject(error);
  },
);

/**
 * Generic GET request
 */
export const get = async (url, config = {}) => {
  const response = await apiClient.get(url, config);
  return response.data;
};

/**
 * Generic POST request
 */
export const post = async (url, data, config = {}) => {
  const response = await apiClient.post(url, data, config);
  return response.data;
};

/**
 * Generic PUT request
 */
export const put = async (url, data, config = {}) => {
  const response = await apiClient.put(url, data, config);
  return response.data;
};

/**
 * Generic PATCH request
 */
export const patch = async (url, data, config = {}) => {
  const response = await apiClient.patch(url, data, config);
  return response.data;
};

/**
 * Generic DELETE request
 */
export const deleteRequest = async (url, config = {}) => {
  const response = await apiClient.delete(url, config);
  return response.data;
};

export default apiClient;
