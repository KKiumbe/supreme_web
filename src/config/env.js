/**
 * Environment Configuration Validator
 * Ensures all required environment variables are present and valid
 * @module config/env
 */

/**
 * Validates and retrieves environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateEnv() {
  const baseUrl = import.meta.env.VITE_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      "❌ VITE_BASE_URL is not defined in environment variables. " +
        "Please check your .env file.",
    );
  }

  // Validate URL format
  try {
    new URL(baseUrl);
  } catch {
    throw new Error(
      `❌ VITE_BASE_URL is not a valid URL: "${baseUrl}". ` +
        "Please provide a valid URL (e.g., http://localhost:5000/api)",
    );
  }

  return {
    BASE_URL: baseUrl,
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
  };
}

// Validate on module load
const env = validateEnv();

// Log environment info in development only (disabled for production)
if (env.DEV && typeof console !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("🌍 Environment:", env.MODE);
  // eslint-disable-next-line no-console
  console.log("🔗 API Base URL:", env.BASE_URL);
}

export default env;
