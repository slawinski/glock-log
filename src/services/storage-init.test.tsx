import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { View } from "react-native";
import { StorageInit } from "./storage-init";
import { StorageFactory } from "./storage-factory";
import { getSecureStorageConfig } from "./storage-config";
import { initializeImageStorage } from "./image-storage";
import { handleError } from "./error-handler";

jest.mock("../components", () => {
  const { View, Text, TouchableOpacity } = require("react-native");
  return {
    ErrorDisplay: ({ errorMessage, onRetry }: any) => {
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
    TerminalText: ({ children, testID }: any) => (
      <Text testID={testID}>{children}</Text>
    ),
  };
});

// Mock error-handler
jest.mock("./error-handler", () => ({
  handleError: jest.fn(),
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
  getSecureStorageConfig: jest.fn(),
  STORAGE_CONFIG: { type: "mmkv", id: "test" }
}));

jest.mock("./image-storage", () => ({
  initializeImageStorage: jest.fn().mockResolvedValue(undefined),
  setNoBackupFlag: jest.fn().mockResolvedValue(undefined),
}));

const MOCK_SECURE_CONFIG = {
  type: "mmkv",
  id: "test-storage",
  encryptionKey: "test-key",
};

describe("StorageInit", () => {
  let configDeferred: Deferred<any>;
  let configureDeferred: Deferred<void>;
  let getStorageDeferred: Deferred<any>;

  beforeEach(() => {
    jest.clearAllMocks();

    configDeferred = new Deferred<any>();
    configureDeferred = new Deferred<void>();
    getStorageDeferred = new Deferred<any>();

    (getSecureStorageConfig as jest.Mock).mockImplementation(() => configDeferred.promise);
    (StorageFactory.configure as jest.Mock).mockImplementation(() => configureDeferred.promise);
    (StorageFactory.getStorage as jest.Mock).mockImplementation(() => getStorageDeferred.promise);
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
      configDeferred.resolve(MOCK_SECURE_CONFIG);
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
      configDeferred.resolve(MOCK_SECURE_CONFIG);
      configureDeferred.resolve();
      getStorageDeferred.resolve({});
    });

    await waitFor(() => {
      expect(StorageFactory.configure).toHaveBeenCalledWith(MOCK_SECURE_CONFIG);
    });
  });

  it("displays error when secure configuration retrieval fails", async () => {
    const configError = new Error("Secure config failed");
    const TestChild = () => <></>;
    const { getByText } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configDeferred.reject(configError);
    });

    await waitFor(() => {
      expect(getByText("Failed to initialize storage.")).toBeTruthy();
    });

    expect(handleError).toHaveBeenCalledWith(
      configError,
      "StorageInit.initializeStorage",
      { isUserFacing: true, userMessage: "Failed to initialize storage. Please check device security settings." }
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
      configDeferred.resolve(MOCK_SECURE_CONFIG);
      configureDeferred.resolve();
      getStorageDeferred.reject(instanceError);
    });

    await waitFor(() => {
      expect(getByText("Failed to initialize storage.")).toBeTruthy();
    });

    expect(handleError).toHaveBeenCalledWith(
      instanceError,
      "StorageInit.initializeStorage",
      { isUserFacing: true, userMessage: "Failed to initialize storage. Please check device security settings." }
    );
  });

  it("only initializes storage once", async () => {
    const TestChild = () => <></>;
    const { rerender } = render(
      <StorageInit>
        <TestChild />
      </StorageInit>
    );

    await act(async () => {
      configDeferred.resolve(MOCK_SECURE_CONFIG);
      configureDeferred.resolve();
      getStorageDeferred.resolve({});
    });

    await waitFor(() => {
      expect(StorageFactory.configure).toHaveBeenCalledTimes(1);
    });

    // Re-render the component
    rerender(
      <StorageInit>
        <View testID="new-child" />
      </StorageInit>
    );

    // Should not call configure again
    expect(StorageFactory.configure).toHaveBeenCalledTimes(1);
  });
});
