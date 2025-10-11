import {
  createAppError,
  handleStorageError,
  handleImageError,
  handleError,
  ERROR_MESSAGES,
} from "./error-handler";
import { Alert } from "react-native";

// Mock console.error to test logging
const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

jest.spyOn(Alert, "alert").mockImplementation(() => {});

describe("error-handler", () => {
  beforeEach(() => {
    mockConsoleError.mockClear();
    (Alert.alert as jest.Mock).mockClear(); // Clear mock for Alert.alert
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    (Alert.alert as jest.Mock).mockRestore(); // Restore mock for Alert.alert
  });

  describe("createAppError", () => {
    it("creates app error from Error instance", () => {
      const originalError = new Error("Test error");
      const result = createAppError(originalError, "User message", "TEST_CODE");

      expect(result).toEqual({
        message: "Test error",
        userMessage: "User message",
        code: "TEST_CODE",
        originalError,
      });
    });

    it("creates app error from string", () => {
      const result = createAppError("String error", "User message");

      expect(result).toEqual({
        message: "String error",
        userMessage: "User message",
        code: undefined,
        originalError: undefined,
      });
    });

    it("creates app error from non-Error object", () => {
      const errorObj = { type: "custom", details: "Something went wrong" };
      const result = createAppError(errorObj, "User message", "CUSTOM_CODE");

      expect(result).toEqual({
        message: "[object Object]",
        userMessage: "User message",
        code: "CUSTOM_CODE",
        originalError: undefined,
      });
    });

    it("handles null error", () => {
      const result = createAppError(null, "User message");

      expect(result).toEqual({
        message: "null",
        userMessage: "User message",
        code: undefined,
        originalError: undefined,
      });
    });

    it("handles undefined error", () => {
      const result = createAppError(undefined, "User message");

      expect(result).toEqual({
        message: "undefined",
        userMessage: "User message",
        code: undefined,
        originalError: undefined,
      });
    });
  });

  describe("ERROR_MESSAGES", () => {
    it("contains all expected error messages", () => {
      expect(ERROR_MESSAGES.NETWORK).toBe(
        "Network connection failed. Please check your internet connection."
      );
      expect(ERROR_MESSAGES.STORAGE).toBe(
        "Failed to save data. Please try again."
      );
      expect(ERROR_MESSAGES.VALIDATION).toBe(
        "Please check your input and try again."
      );
      expect(ERROR_MESSAGES.NOT_FOUND).toBe(
        "The requested item was not found."
      );
      expect(ERROR_MESSAGES.DELETE_FAILED).toBe(
        "Failed to delete item. Please try again."
      );
      expect(ERROR_MESSAGES.LOAD_FAILED).toBe(
        "Failed to load data. Please try again."
      );
      expect(ERROR_MESSAGES.IMAGE_SAVE_FAILED).toBe(
        "Failed to save image. Please try again."
      );
      expect(ERROR_MESSAGES.PERMISSION_DENIED).toBe(
        "Permission denied. Please check app permissions."
      );
    });
  });

  describe("handleStorageError", () => {
    it("handles validation errors", () => {
      const error = new Error("validation failed");
      const result = handleStorageError(error, "save");

      expect(result).toEqual({
        message: "validation failed",
        userMessage: ERROR_MESSAGES.VALIDATION,
        code: "VALIDATION_ERROR",
        originalError: error,
      });
    });

    it("handles not found errors", () => {
      const error = new Error("item not found");
      const result = handleStorageError(error, "delete");

      expect(result).toEqual({
        message: "item not found",
        userMessage: ERROR_MESSAGES.NOT_FOUND,
        code: "NOT_FOUND",
        originalError: error,
      });
    });

    it("handles generic storage errors", () => {
      const error = new Error("generic error");
      const result = handleStorageError(error, "update");

      expect(result).toEqual({
        message: "generic error",
        userMessage: `${ERROR_MESSAGES.STORAGE} (update)`,
        code: "STORAGE_ERROR",
        originalError: error,
      });
    });

    it("handles non-Error objects", () => {
      const error = "string error";
      const result = handleStorageError(error, "save");

      expect(result).toEqual({
        message: "string error",
        userMessage: `${ERROR_MESSAGES.STORAGE} (save)`,
        code: "STORAGE_ERROR",
        originalError: undefined,
      });
    });

    it("handles validation error with case sensitivity", () => {
      const error = new Error("validation error occurred");
      const result = handleStorageError(error, "create");

      expect(result).toEqual({
        message: "validation error occurred",
        userMessage: ERROR_MESSAGES.VALIDATION,
        code: "VALIDATION_ERROR",
        originalError: error,
      });
    });

    it("handles not found error with case sensitivity", () => {
      const error = new Error("record not found");
      const result = handleStorageError(error, "fetch");

      expect(result).toEqual({
        message: "record not found",
        userMessage: ERROR_MESSAGES.NOT_FOUND,
        code: "NOT_FOUND",
        originalError: error,
      });
    });
  });

  describe("handleImageError", () => {
    it("handles permission errors", () => {
      const error = new Error("permission denied");
      const result = handleImageError(error, "save");

      expect(result).toEqual({
        message: "permission denied",
        userMessage: ERROR_MESSAGES.PERMISSION_DENIED,
        code: "PERMISSION_ERROR",
        originalError: error,
      });
    });

    it("handles generic image errors", () => {
      const error = new Error("image processing failed");
      const result = handleImageError(error, "resize");

      expect(result).toEqual({
        message: "image processing failed",
        userMessage: `${ERROR_MESSAGES.IMAGE_SAVE_FAILED} (resize)`,
        code: "IMAGE_ERROR",
        originalError: error,
      });
    });

    it("handles non-Error objects", () => {
      const error = "image error";
      const result = handleImageError(error, "upload");

      expect(result).toEqual({
        message: "image error",
        userMessage: `${ERROR_MESSAGES.IMAGE_SAVE_FAILED} (upload)`,
        code: "IMAGE_ERROR",
        originalError: undefined,
      });
    });

    it("handles permission error with case sensitivity", () => {
      const error = new Error("permission required");
      const result = handleImageError(error, "access");

      expect(result).toEqual({
        message: "permission required",
        userMessage: ERROR_MESSAGES.PERMISSION_DENIED,
        code: "PERMISSION_ERROR",
        originalError: error,
      });
    });
  });

  describe("handleError", () => {
    it("logs Error instance and does not show alert by default", () => {
      const error = new Error("Technical error");
      handleError(error, "TestContext", { userMessage: "User friendly message" });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] Technical error",
        error
      );
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("logs Error instance and shows alert when isUserFacing is true", () => {
      const error = new Error("Technical error");
      handleError(error, "TestContext", { userMessage: "User friendly message", isUserFacing: true });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] Technical error",
        error
      );
      expect(Alert.alert).toHaveBeenCalledWith("Error", "User friendly message");
    });

    it("logs string error and does not show alert by default", () => {
      const error = "String error";
      handleError(error, "TestContext", { userMessage: "User friendly message" });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] String error",
        error
      );
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("logs string error and shows alert when isUserFacing is true", () => {
      const error = "String error";
      handleError(error, "TestContext", { userMessage: "User friendly message", isUserFacing: true });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] String error",
        error
      );
      expect(Alert.alert).toHaveBeenCalledWith("Error", "User friendly message");
    });

    it("logs non-Error object and does not show alert by default", () => {
      const error = { type: "custom" };
      handleError(error, "TestContext", { userMessage: "User friendly message" });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] [object Object]",
        error
      );
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("logs non-Error object and shows alert when isUserFacing is true", () => {
      const error = { type: "custom" };
      handleError(error, "TestContext", { userMessage: "User friendly message", isUserFacing: true });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] [object Object]",
        error
      );
      expect(Alert.alert).toHaveBeenCalledWith("Error", "User friendly message");
    });

    it("logs null error and does not show alert by default", () => {
      const error = null;
      handleError(error, "TestContext", { userMessage: "User friendly message" });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] null",
        error
      );
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("logs null error and shows alert when isUserFacing is true", () => {
      const error = null;
      handleError(error, "TestContext", { userMessage: "User friendly message", isUserFacing: true });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] null",
        error
      );
      expect(Alert.alert).toHaveBeenCalledWith("Error", "User friendly message");
    });

    it("logs undefined error and does not show alert by default", () => {
      const error = undefined;
      handleError(error, "TestContext", { userMessage: "User friendly message" });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[TestContext] undefined",
        error
      );
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("handles complex error contexts and does not show alert by default", () => {
      const error = new Error("Database connection timeout");
      const context = "UserService.getUserById";
      const userMessage = "Unable to load user profile";

      handleError(error, context, { userMessage: userMessage });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[UserService.getUserById] Database connection timeout",
        error
      );
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("handles complex error contexts and shows alert when isUserFacing is true", () => {
      const error = new Error("Database connection timeout");
      const context = "UserService.getUserById";
      const userMessage = "Unable to load user profile";

      handleError(error, context, { userMessage: userMessage, isUserFacing: true, alertTitle: "Custom Error Title" });

      expect(mockConsoleError).toHaveBeenCalledWith(
        "[UserService.getUserById] Database connection timeout",
        error
      );
      expect(Alert.alert).toHaveBeenCalledWith("Custom Error Title", userMessage);
    });
  });
});
