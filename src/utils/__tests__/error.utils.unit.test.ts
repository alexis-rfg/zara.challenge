import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorFactory, getErrorMessage, isAppError, logError } from '../error.utils';
import { AppError, ErrorCode } from '@/types/error.types';

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    startSpan: () => ({ finish: vi.fn(), fail: vi.fn() }),
  }),
}));

describe('ErrorFactory', () => {
  it('productsLoadFailed creates AppError with PRODUCTS_LOAD_FAILED code', () => {
    const err = ErrorFactory.productsLoadFailed();
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe(ErrorCode.PRODUCTS_LOAD_FAILED);
  });

  it('productsLoadFailed captures original error', () => {
    const original = new Error('API down');
    const err = ErrorFactory.productsLoadFailed(original);
    expect(err.originalError).toBe(original);
  });

  it('productNotFound creates AppError with PRODUCT_NOT_FOUND code', () => {
    const err = ErrorFactory.productNotFound();
    expect(err.code).toBe(ErrorCode.PRODUCT_NOT_FOUND);
  });

  it('productNotFound includes product ID in message', () => {
    const err = ErrorFactory.productNotFound('APL-IP15');
    expect(err.message).toContain('APL-IP15');
  });

  it('cartLoadFailed creates AppError with CART_LOAD_FAILED code', () => {
    const err = ErrorFactory.cartLoadFailed();
    expect(err.code).toBe(ErrorCode.CART_LOAD_FAILED);
  });

  it('cartSaveFailed creates AppError with CART_SAVE_FAILED code', () => {
    const err = ErrorFactory.cartSaveFailed();
    expect(err.code).toBe(ErrorCode.CART_SAVE_FAILED);
  });

  it('storageError creates AppError with STORAGE_ERROR code', () => {
    const err = ErrorFactory.storageError();
    expect(err.code).toBe(ErrorCode.STORAGE_ERROR);
  });

  it('parseError creates AppError with PARSE_ERROR code', () => {
    const err = ErrorFactory.parseError();
    expect(err.code).toBe(ErrorCode.PARSE_ERROR);
  });

  it('networkError creates AppError with NETWORK_ERROR code', () => {
    const err = ErrorFactory.networkError();
    expect(err.code).toBe(ErrorCode.NETWORK_ERROR);
  });

  it('apiError creates AppError with API_ERROR code', () => {
    const err = ErrorFactory.apiError();
    expect(err.code).toBe(ErrorCode.API_ERROR);
  });

  it('unknownError creates AppError with UNKNOWN_ERROR code', () => {
    const err = ErrorFactory.unknownError();
    expect(err.code).toBe(ErrorCode.UNKNOWN_ERROR);
  });
});

describe('getErrorMessage', () => {
  it('extracts message from AppError', () => {
    const err = new AppError(ErrorCode.NETWORK_ERROR);
    expect(getErrorMessage(err)).toBe(
      'Network connection failed. Please check your internet connection.',
    );
  });

  it('extracts message from standard Error', () => {
    const err = new Error('Something went wrong');
    expect(getErrorMessage(err)).toBe('Something went wrong');
  });

  it('returns string errors directly', () => {
    expect(getErrorMessage('plain string error')).toBe('plain string error');
  });

  it('extracts message from object with message property', () => {
    expect(getErrorMessage({ message: 'object error' })).toBe('object error');
  });

  it('uses fallback message for unknown error types', () => {
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
  });

  it('uses default unknown error message when no fallback provided', () => {
    expect(getErrorMessage(42)).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('isAppError', () => {
  it('returns true for AppError instances', () => {
    expect(isAppError(new AppError(ErrorCode.UNKNOWN_ERROR))).toBe(true);
  });

  it('returns false for standard Error', () => {
    expect(isAppError(new Error('standard'))).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(42)).toBe(false);
  });
});

describe('logError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not throw when logging an AppError', () => {
    const err = new AppError(ErrorCode.NETWORK_ERROR);
    expect(() => logError(err, 'test.context')).not.toThrow();
  });

  it('does not throw when logging a standard Error', () => {
    const err = new Error('standard');
    expect(() => logError(err, 'test.context')).not.toThrow();
  });

  it('does not throw when logging an unknown value', () => {
    expect(() => logError('just a string', 'test.context')).not.toThrow();
    expect(() => logError(null)).not.toThrow();
    expect(() => logError(undefined)).not.toThrow();
  });

  it('does not throw when no context is provided', () => {
    expect(() => logError(new Error('no context'))).not.toThrow();
  });
});
