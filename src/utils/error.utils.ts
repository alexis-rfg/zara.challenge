import { AppError, ErrorCode, ERROR_MESSAGES } from '@/types/error.types';
import { createLogger } from '@/utils/logger';

const errorLogger = createLogger({
  scope: 'app.error',
  tags: ['error'],
});

/**
 * Error factory for creating standardized application errors
 */
export class ErrorFactory {
  /**
   * Creates a products load error
   */
  static productsLoadFailed(originalError?: unknown): AppError {
    return new AppError(ErrorCode.PRODUCTS_LOAD_FAILED, undefined, originalError);
  }

  /**
   * Creates a product not found error
   */
  static productNotFound(productId?: string): AppError {
    const message = productId
      ? `Product with ID ${productId} not found.`
      : ERROR_MESSAGES[ErrorCode.PRODUCT_NOT_FOUND];
    return new AppError(ErrorCode.PRODUCT_NOT_FOUND, message);
  }

  /**
   * Creates a cart load error
   */
  static cartLoadFailed(originalError?: unknown): AppError {
    return new AppError(ErrorCode.CART_LOAD_FAILED, undefined, originalError);
  }

  /**
   * Creates a cart save error
   */
  static cartSaveFailed(originalError?: unknown): AppError {
    return new AppError(ErrorCode.CART_SAVE_FAILED, undefined, originalError);
  }

  /**
   * Creates a storage error
   */
  static storageError(originalError?: unknown): AppError {
    return new AppError(ErrorCode.STORAGE_ERROR, undefined, originalError);
  }

  /**
   * Creates a parse error
   */
  static parseError(originalError?: unknown): AppError {
    return new AppError(ErrorCode.PARSE_ERROR, undefined, originalError);
  }

  /**
   * Creates a network error
   */
  static networkError(originalError?: unknown): AppError {
    return new AppError(ErrorCode.NETWORK_ERROR, undefined, originalError);
  }

  /**
   * Creates a timeout error.
   */
  static timeoutError(originalError?: unknown): AppError {
    return new AppError(ErrorCode.TIMEOUT, undefined, originalError);
  }

  /**
   * Creates an API error
   */
  static apiError(originalError?: unknown): AppError {
    return new AppError(ErrorCode.API_ERROR, undefined, originalError);
  }

  /**
   * Creates an unknown error
   */
  static unknownError(originalError?: unknown): AppError {
    return new AppError(ErrorCode.UNKNOWN_ERROR, undefined, originalError);
  }
}

/**
 * Extracts a user-friendly error message from any error type
 *
 * @param error - The error to extract message from
 * @param fallbackMessage - Optional fallback message if error cannot be parsed
 * @returns User-friendly error message
 *
 * @example
 * ```ts
 * try {
 *   await fetchProducts();
 * } catch (err) {
 *   const message = getErrorMessage(err, 'Failed to load products');
 *   setError(message);
 * }
 * ```
 */
export const getErrorMessage = (error: unknown, fallbackMessage?: string): string => {
  // AppError with code
  if (error instanceof AppError) {
    return error.message;
  }

  // Standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // String error
  if (typeof error === 'string') {
    return error;
  }

  // Object with message property
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  // Fallback
  return fallbackMessage || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
};

/**
 * Type guard to check if an error is an AppError
 */
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

/**
 * Logs error with additional context for debugging
 *
 * @param error - The error to log
 * @param context - Additional context about where the error occurred
 *
 * @example
 * ```ts
 * try {
 *   await fetchProducts();
 * } catch (err) {
 *   logError(err, 'useProducts.loadProducts');
 * }
 * ```
 */
export const logError = (error: unknown, context?: string): void => {
  const contextTag = context ? [context] : [];

  if (error instanceof AppError) {
    errorLogger.error('handled_error', {
      tags: contextTag,
      context: {
        code: error.code,
        message: error.message,
        source: context,
      },
      error: error.originalError ?? error,
    });
  } else if (error instanceof Error) {
    errorLogger.error('unhandled_error', {
      tags: contextTag,
      context: {
        source: context,
      },
      error,
    });
  } else {
    errorLogger.error('unknown_error', {
      tags: contextTag,
      context: {
        source: context,
        payload: error,
      },
      error,
    });
  }
};
