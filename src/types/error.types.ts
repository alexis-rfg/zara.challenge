/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // API errors
  API_ERROR = 'API_ERROR',
  FETCH_FAILED = 'FETCH_FAILED',

  // Product errors
  PRODUCTS_LOAD_FAILED = 'PRODUCTS_LOAD_FAILED',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',

  // Cart errors
  CART_LOAD_FAILED = 'CART_LOAD_FAILED',
  CART_SAVE_FAILED = 'CART_SAVE_FAILED',

  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',

  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * User-friendly error messages mapped to error codes
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ErrorCode.TIMEOUT]: 'Request timed out. Please try again.',
  [ErrorCode.API_ERROR]: 'Server error. Please try again later.',
  [ErrorCode.FETCH_FAILED]: 'Failed to fetch data. Please try again.',
  [ErrorCode.PRODUCTS_LOAD_FAILED]: 'Failed to load products. Please try again.',
  [ErrorCode.PRODUCT_NOT_FOUND]: 'Product not found.',
  [ErrorCode.CART_LOAD_FAILED]: 'Failed to load cart. Please refresh the page.',
  [ErrorCode.CART_SAVE_FAILED]: 'Failed to save cart. Please try again.',
  [ErrorCode.STORAGE_ERROR]: 'Storage error. Please check your browser settings.',
  [ErrorCode.PARSE_ERROR]: 'Failed to parse data. Please try again.',
  [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Application error class with error code support
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public originalError?: unknown,
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.name = 'AppError';
  }
}
