/**
 * Enhanced error handling utilities for CityScope
 */

import { log } from './logger';

export interface ErrorWithContext extends Error {
  context?: Record<string, unknown>;
  code?: string;
  statusCode?: number;
  retryable?: boolean;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public retryable: boolean = false,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Network error
export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', 0, true, context);
    this.name = 'NetworkError';
  }
}

// API error
export class APIError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    public response?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', statusCode, statusCode >= 500, context);
    this.name = 'APIError';
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(message: string, public field?: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, false, { ...context, field });
    this.name = 'ValidationError';
  }
}

// Authentication error
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed', context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', 401, false, context);
    this.name = 'AuthError';
  }
}

// Permission error
export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied', context?: Record<string, unknown>) {
    super(message, 'PERMISSION_ERROR', 403, false, context);
    this.name = 'PermissionError';
  }
}

/**
 * Handle errors with proper logging and user-friendly messages
 */
export function handleError(error: unknown, context?: Record<string, unknown>): {
  message: string;
  code: string;
  retryable: boolean;
  originalError: unknown;
} {
  let errorMessage = 'An unexpected error occurred';
  let errorCode = 'UNKNOWN_ERROR';
  let retryable = false;

  if (error instanceof AppError) {
    errorMessage = error.message;
    errorCode = error.code;
    retryable = error.retryable;
    
    log.error(`App Error: ${errorMessage}`, error, { ...context, ...error.context });
  } else if (error instanceof Error) {
    errorMessage = error.message;
    errorCode = 'ERROR';
    
    log.error(`Error: ${errorMessage}`, error, context);
  } else if (typeof error === 'string') {
    errorMessage = error;
    log.error(`String error: ${errorMessage}`, undefined, context);
  } else {
    errorMessage = 'An unexpected error occurred';
    log.error('Unknown error type', undefined, { error, ...context });
  }

  return {
    message: errorMessage,
    code: errorCode,
    retryable,
    originalError: error,
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryable?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryable = () => true,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!retryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);

      log.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, { error, delay });
    }
  }

  throw lastError;
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    onError?: (error: unknown, context?: Record<string, unknown>) => void;
    defaultReturn?: any;
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const handled = handleError(error, { function: fn.name, args });
      
      if (options.onError) {
        options.onError(error, { function: fn.name, args });
      }

      if (options.defaultReturn !== undefined) {
        return options.defaultReturn;
      }

      throw error;
    }
  }) as T;
}

/**
 * Safe async wrapper that never throws
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  defaultValue: T,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    return defaultValue;
  }
}

