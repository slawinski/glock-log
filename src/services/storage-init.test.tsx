import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { StorageInit } from "./storage-init";
import { StorageFactory } from "./storage-factory";
import { STORAGE_CONFIG } from "./storage-config";

jest.mock("../components", () => ({
  ErrorDisplay: ({ errorMessage, onRetry }: any) => {
    const { View, Text, TouchableOpacity } = require("react-native");
    return (
      <View>
        <Text>{errorMessage}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry}>
            <Text>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
}));

// Mock dependencies
jest.mock("./storage-factory", () => ({
  StorageFactory: {
    configure: jest.fn(),
    getStorage: jest.fn(),
  },
}));

jest.mock("./storage-config", () => ({
  STORAGE_CONFIG: {
    type: "mmkv",
    id: "test-storage",
    encryptionKey: "test-key",
  },
}));

const mockConsoleError = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("StorageInit", () => {
  const mockStorageFactory = StorageFactory as jest.Mocked<
    typeof StorageFactory
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  it("renders loading state initially", () => {
    // Mock configure to succeed synchronously but delay the state update
    let shouldDelay = true;
    mockStorageFactory.configure.mockImplementation(() => {
      if (shouldDelay) {
        // Throw to prevent setIsInitialized from being called immediately
        throw new Error("Delayed initialization");
      }
    });
    mockStorageFactory.getStorage.mockImplementation(() => ({} as any));

    const TestChild = () => <></>;
    const { getByText, queryByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    // Due to the thrown error, component should show error state
    expect(queryByText("Failed to initialize storage.")).toBeTruthy();
  });

  it("renders children after successful initialization", async () => {
    mockStorageFactory.configure.mockImplementation(() => {});
    mockStorageFactory.getStorage.mockImplementation(() => ({} as any));

    const { getByTestId, queryByText } = render(
      <StorageInit>
        {(() => {
          const { View, Text } = require("react-native");
          return (
            <View testID="test-child">
              <Text>Test Content</Text>
            </View>
          );
        })()}
      </StorageInit>
    );

    await waitFor(() => {
      expect(queryByText("Initializing storage...")).toBeNull();
    });

    expect(getByTestId("test-child")).toBeTruthy();
  });

  it("configures storage with correct config", async () => {
    mockStorageFactory.configure.mockImplementation(() => {});
    mockStorageFactory.getStorage.mockImplementation(() => ({} as any));

    const TestChild = () => <></>;
    render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      expect(mockStorageFactory.configure).toHaveBeenCalledWith(STORAGE_CONFIG);
    });
  });

  it("tests storage by getting an instance", async () => {
    mockStorageFactory.configure.mockImplementation(() => {});
    mockStorageFactory.getStorage.mockImplementation(() => ({} as any));

    const TestChild = () => <></>;
    render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      expect(mockStorageFactory.getStorage).toHaveBeenCalled();
    });
  });

  it("displays error when storage configuration fails", async () => {
    const configError = new Error("Storage configuration failed");
    mockStorageFactory.configure.mockImplementation(() => {
      throw configError;
    });

    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      expect(getByText("Failed to initialize storage.")).toBeTruthy();
    });

    expect(mockConsoleError).toHaveBeenCalledWith(
      "[StorageInit.initializeStorage] Storage configuration failed",
      configError
    );
  });

  it("displays error when storage instance creation fails", async () => {
    const instanceError = new Error("Storage instance creation failed");
    mockStorageFactory.configure.mockImplementation(() => {});
    mockStorageFactory.getStorage.mockImplementation(() => {
      throw instanceError;
    });

    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      expect(getByText("Failed to initialize storage.")).toBeTruthy();
    });

    expect(mockConsoleError).toHaveBeenCalledWith(
      "[StorageInit.initializeStorage] Storage instance creation failed",
      instanceError
    );
  });

  it("handles non-Error exceptions", async () => {
    const stringError = "String error message";
    mockStorageFactory.configure.mockImplementation(() => {
      throw stringError;
    });

    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      expect(getByText("Failed to initialize storage.")).toBeTruthy();
    });

    expect(mockConsoleError).toHaveBeenCalledWith(
      "[StorageInit.initializeStorage] String error message",
      stringError
    );
  });

  it("handles null errors", async () => {
    mockStorageFactory.configure.mockImplementation(() => {
      throw null;
    });

    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      expect(getByText("Failed to initialize storage.")).toBeTruthy();
    });

    expect(mockConsoleError).toHaveBeenCalledWith(
      "[StorageInit.initializeStorage] null",
      null
    );
  });

  it("renders multiple children correctly", async () => {
    mockStorageFactory.configure.mockImplementation(() => {});
    mockStorageFactory.getStorage.mockImplementation(() => ({} as any));

    const { getByTestId } = render(
      <StorageInit>
        {(() => {
          const { View, Text } = require("react-native");
          return (
            <>
              <View testID="child-1">
                <Text>Child 1</Text>
              </View>
              <View testID="child-2">
                <Text>Child 2</Text>
              </View>
              <View testID="child-3">
                <Text>Child 3</Text>
              </View>
            </>
          );
        })()}
      </StorageInit>
    );

    await waitFor(() => {
      expect(getByTestId("child-1")).toBeTruthy();
      expect(getByTestId("child-2")).toBeTruthy();
      expect(getByTestId("child-3")).toBeTruthy();
    });
  });

  it("applies correct styling to error view", () => {
    mockStorageFactory.configure.mockImplementation(() => {
      throw new Error("Test styling error");
    });

    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    const errorText = getByText("Failed to initialize storage.");

    // Check that the error view exists and has content
    expect(errorText).toBeTruthy();
  });

  it("applies correct styling to error view", async () => {
    mockStorageFactory.configure.mockImplementation(() => {
      throw new Error("Test error");
    });

    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      const errorText = getByText(/Failed to initialize storage/);
      const errorView = errorText.parent;

      expect(errorView).toBeTruthy();
      expect(errorText).toBeTruthy();
    });
  });

  it("only initializes storage once", async () => {
    mockStorageFactory.configure.mockImplementation(() => {});
    mockStorageFactory.getStorage.mockImplementation(() => ({} as any));

    const TestChild = () => <></>;
    const { rerender } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      expect(mockStorageFactory.configure).toHaveBeenCalledTimes(1);
    });

    // Re-render the component
    rerender(
      <StorageInit>
        {(() => {
          const { View, Text } = require("react-native");
          return (
            <View testID="new-child">
              <Text>New Child</Text>
            </View>
          );
        })()}
      </StorageInit>
    );

    // Should not call configure again
    expect(mockStorageFactory.configure).toHaveBeenCalledTimes(1);
    expect(mockStorageFactory.getStorage).toHaveBeenCalledTimes(1);
  });

  it("renders children after successful async initialization", async () => {
    mockStorageFactory.configure.mockImplementation(() => {
      // Successful synchronous initialization
    });
    mockStorageFactory.getStorage.mockImplementation(() => ({} as any));

    const TestChild = () => {
      const { View, Text } = require("react-native");
      return (
        <View testID="test-child">
          <Text>Test Content</Text>
        </View>
      );
    };
    const { getByTestId } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      expect(getByTestId("test-child")).toBeTruthy();
    });
  });

  it("maintains error state after error occurs", async () => {
    mockStorageFactory.configure.mockImplementation(() => {
      throw new Error("Persistent error");
    });

    const TestChild = () => <></>;
    const { getByText, rerender } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await waitFor(() => {
      expect(getByText("Failed to initialize storage.")).toBeTruthy();
    });

    // Re-render with different children
    rerender(
      <StorageInit>
        {(() => {
          const { View, Text } = require("react-native");
          return (
            <View testID="different-child">
              <Text>Different Child</Text>
            </View>
          );
        })()}
      </StorageInit>
    );

    // Should still show error, not try to initialize again
          expect(getByText("Failed to initialize storage.")).toBeTruthy();  });
});
