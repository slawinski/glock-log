/**
 * Centralized error handling utilities
 */

export interface AppError {
  message: string;
  userMessage: string;
  code?: string;
  originalError?: Error;
}

/**
 * Create a user-friendly error from any error type
 */
export function createAppError(
  error: unknown,
  userMessage: string,
  code?: string
): AppError {
  const message = error instanceof Error ? error.message : String(error);
  
  return {
    message,
    userMessage,
    code,
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Common error messages for different operations
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Network connection failed. Please check your internet connection.',
  STORAGE: 'Failed to save data. Please try again.',
  VALIDATION: 'Please check your input and try again.',
  NOT_FOUND: 'The requested item was not found.',
  DELETE_FAILED: 'Failed to delete item. Please try again.',
  LOAD_FAILED: 'Failed to load data. Please try again.',
  IMAGE_SAVE_FAILED: 'Failed to save image. Please try again.',
  PERMISSION_DENIED: 'Permission denied. Please check app permissions.',
} as const;

/**
 * Handle storage operation errors
 */
export function handleStorageError(error: unknown, operation: string): AppError {
  if (error instanceof Error) {
    if (error.message.includes('validation')) {
      return createAppError(error, ERROR_MESSAGES.VALIDATION, 'VALIDATION_ERROR');
    }
    if (error.message.includes('not found')) {
      return createAppError(error, ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND');
    }
  }
  
  return createAppError(
    error,
    `${ERROR_MESSAGES.STORAGE} (${operation})`,
    'STORAGE_ERROR'
  );
}

/**
 * Handle image operation errors
 */
export function handleImageError(error: unknown, operation: string): AppError {
  if (error instanceof Error) {
    if (error.message.includes('permission')) {
      return createAppError(error, ERROR_MESSAGES.PERMISSION_DENIED, 'PERMISSION_ERROR');
    }
  }
  
  return createAppError(
    error,
    `${ERROR_MESSAGES.IMAGE_SAVE_FAILED} (${operation})`,
    'IMAGE_ERROR'
  );
}

/**
 * Log error for debugging while showing user-friendly message
 */
export function logAndGetUserError(
  error: unknown,
  context: string,
  userMessage: string
): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Log the technical error for debugging
  console.error(`[${context}] ${errorMessage}`, error);
  
  // Return user-friendly message
  return userMessage;
}