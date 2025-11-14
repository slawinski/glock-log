import React, { useEffect, useState, useCallback } from "react";
import { View, Text } from "react-native";
import { StorageFactory } from "./storage-factory";
import { STORAGE_CONFIG } from "./storage-config";
import { handleError } from "./error-handler";
import { ErrorDisplay } from "../components";

type Props = {
  children: React.ReactNode;
};

export const StorageInit = ({ children }: Props) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeStorage = useCallback(async () => {
    try {
      // Configure storage factory
      StorageFactory.configure(STORAGE_CONFIG);

      // Test storage by getting an instance
      StorageFactory.getStorage();

      setIsInitialized(true);
    } catch (err) {
      handleError(err, "StorageInit.initializeStorage", { isUserFacing: true, userMessage: "Failed to initialize storage." });
      setError("Failed to initialize storage.");
    }
  }, []);

  useEffect(() => {
    initializeStorage();
  }, [initializeStorage]);
  if (error) {
    return <ErrorDisplay errorMessage={error} onRetry={initializeStorage} />;
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text testID="loading-storage-text">Initializing storage...</Text>
      </View>
    );
  }

  return <>{children}</>;
};
