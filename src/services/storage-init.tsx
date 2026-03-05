import React, { useEffect, useState, useCallback } from "react";
import { View, Text } from "react-native";
import { StorageFactory } from "./storage-factory";
import { getSecureStorageConfig } from "./storage-config";
import { initializeImageStorage } from "./image-storage";
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
      // 1. Initialize image storage (directory and no-backup flag)
      await initializeImageStorage();

      // 2. Configure storage factory with secure encryption key
      const secureConfig = await getSecureStorageConfig();
      await StorageFactory.configure(secureConfig);

      // 3. Test storage by getting an instance
      await StorageFactory.getStorage();

      setIsInitialized(true);
    } catch (err) {
      handleError(err, "StorageInit.initializeStorage", { isUserFacing: true, userMessage: "Failed to initialize storage. Please check device security settings." });
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
