import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { StorageFactory } from "./storage-factory";
import { STORAGE_CONFIG } from "./storage-config";

interface StorageInitProps {
  children: React.ReactNode;
}

export const StorageInit: React.FC<StorageInitProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Configure storage factory
        StorageFactory.configure(STORAGE_CONFIG);

        // Test storage by getting an instance
        StorageFactory.getStorage();

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize storage:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      }
    };

    initializeStorage();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Failed to initialize storage: {error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Initializing storage...</Text>
      </View>
    );
  }

  return <>{children}</>;
};
