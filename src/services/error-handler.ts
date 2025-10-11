import { Alert } from "react-native";

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
 * Logs a technical error for debugging purposes.
 * @param error The error object or message.
 * @param context A string indicating where the error occurred.
 * @param userMessage A user-friendly message associated with the error.
 */
const logError = (error: unknown, context: string, userMessage: string): void => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${context}] ${errorMessage}`, error);
};

/**
 * Reports an error to a centralized error monitoring service.
 * (Placeholder for future integration with services like Sentry, Crashlytics, etc.)
 * @param error The error object or message.
 * @param context A string indicating where the error occurred.
 * @param userMessage A user-friendly message associated with the error.
 */
const reportError = (error: unknown, context: string, userMessage: string): void => {
  // TODO: Implement actual error reporting to a service like Sentry or Firebase Crashlytics
  // console.log(`Reporting error: [${context}] ${userMessage}`);
};

/**
 * Displays a user-friendly alert.
 * @param title The title of the alert.
 * @param message The message to display in the alert.
 */
const showAlert = (title: string, message: string): void => {
  Alert.alert(title, message);
};

/**
 * Centralized error handling function.
 * Logs the error, optionally reports it, and displays a user-facing alert if specified.
 * @param error The error object or message.
 * @param context A string indicating where the error occurred (e.g., "ComponentName.methodName").
 * @param options Optional configuration for handling the error.
 * @param options.userMessage A user-friendly message to display. Defaults to "An unexpected error occurred.".
 * @param options.isUserFacing If true, an Alert.alert will be shown to the user. Defaults to false.
 * @param options.alertTitle The title for the Alert.alert. Defaults to "Error".
 */
export const handleError = (
  error: unknown,
  context: string = "Unknown Context",
  options?: {
    userMessage?: string;
    isUserFacing?: boolean;
    alertTitle?: string;
  }
): void => {
  const defaultUserMessage = options?.userMessage || "An unexpected error occurred.";
  const alertTitle = options?.alertTitle || "Error";

  logError(error, context, defaultUserMessage);
  reportError(error, context, defaultUserMessage);

  if (options?.isUserFacing) {
    showAlert(alertTitle, defaultUserMessage);
  }
};