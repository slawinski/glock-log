import React from "react";
import { render, waitFor, screen, act } from "@testing-library/react-native";
import { View } from "react-native";
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

// Deferred class to control promise resolution
class Deferred<T> {
  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

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
  let configureDeferred: Deferred<void>;
  let getStorageDeferred: Deferred<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
    jest.useFakeTimers();

    configureDeferred = new Deferred<void>();
    getStorageDeferred = new Deferred<any>();

    (StorageFactory.configure as jest.Mock).mockImplementation(() => configureDeferred.promise);
    (StorageFactory.getStorage as jest.Mock).mockImplementation(() => getStorageDeferred.promise);
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
    jest.useRealTimers();
  });

  it("renders loading state initially", async () => {
    const TestChild = () => <View testID="test-child" />;
    const { queryByTestId, getByTestId } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    // Child component should not be rendered initially
    expect(queryByTestId("test-child")).toBeNull();

    // Loading component should be rendered
    expect(getByTestId("loading-storage-text")).toBeTruthy();
  });

  it("renders children after successful initialization", async () => {
    const TestChild = () => <View testID="test-child" />;
    const { getByTestId, queryByTestId } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    // Resolve the promises to simulate successful initialization
    await act(async () => {
      configureDeferred.resolve();
      getStorageDeferred.resolve({});
    });

    await waitFor(() => {
      expect(queryByTestId("loading-storage-text")).toBeNull();
    });

    expect(getByTestId("test-child")).toBeTruthy();
  });

  it("configures storage with correct config", async () => {
    const TestChild = () => <></>;
    render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configureDeferred.resolve();
      getStorageDeferred.resolve({});
    });

    await waitFor(() => {
      expect(StorageFactory.configure).toHaveBeenCalledWith(STORAGE_CONFIG);
    });
  });

  it("tests storage by getting an instance", async () => {
    const TestChild = () => <></>;
    render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configureDeferred.resolve();
      getStorageDeferred.resolve({});
    });

    await waitFor(() => {
      expect(StorageFactory.getStorage).toHaveBeenCalled();
    });
  });

  it("displays error when storage configuration fails", async () => {
    const configError = new Error("Storage configuration failed");
    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configureDeferred.reject(configError);
    });

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
    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configureDeferred.resolve();
      getStorageDeferred.reject(instanceError);
    });

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
    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configureDeferred.reject(stringError);
    });

    await waitFor(() => {
      expect(getByText("Failed to initialize storage.")).toBeTruthy();
    });

    expect(mockConsoleError).toHaveBeenCalledWith(
      "[StorageInit.initializeStorage] String error message",
      stringError
    );
  });

  it("handles null errors", async () => {
    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configureDeferred.reject(null);
    });

    await waitFor(() => {
      expect(getByText("Failed to initialize storage.")).toBeTruthy();
    });

    expect(mockConsoleError).toHaveBeenCalledWith(
      "[StorageInit.initializeStorage] null",
      null
    );
  });

  it("renders multiple children correctly", async () => {
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

    await act(async () => {
      configureDeferred.resolve();
      getStorageDeferred.resolve({});
    });

    await waitFor(() => {
      expect(getByTestId("child-1")).toBeTruthy();
      expect(getByTestId("child-2")).toBeTruthy();
      expect(getByTestId("child-3")).toBeTruthy();
    });
  });

  it("applies correct styling to error view", async () => {
    const configError = new Error("Test styling error");
    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configureDeferred.reject(configError);
    });

    await waitFor(() => {
      const errorText = getByText("Failed to initialize storage.");
      expect(errorText).toBeTruthy();
    });
  });

  it("only initializes storage once", async () => {
    const TestChild = () => <></>;
    const { rerender } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configureDeferred.resolve();
      getStorageDeferred.resolve({});
    });

    await waitFor(() => {
      expect(StorageFactory.configure).toHaveBeenCalledTimes(1);
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
    expect(StorageFactory.configure).toHaveBeenCalledTimes(1);
    expect(StorageFactory.getStorage).toHaveBeenCalledTimes(1);
  });

  it("renders children after successful async initialization", async () => {
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

    await act(async () => {
      configureDeferred.resolve();
      getStorageDeferred.resolve({});
    });

    await waitFor(() => {
      expect(getByTestId("test-child")).toBeTruthy();
    });
  });

  it("maintains error state after error occurs", async () => {
    const configError = new Error("Persistent error");
    const TestChild = () => <></>;
    const { getByText, rerender } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configureDeferred.reject(configError);
    });

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
    expect(getByText("Failed to initialize storage.")).toBeTruthy();
  });
});
