import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { StorageFactory } from "./storage-factory";
import { getStorageConfig } from "./storage-config";
import { StorageMigration } from "./storage-migration";

interface StorageInitProps {
  children: React.ReactNode;
}

export const StorageInit: React.FC<StorageInitProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Configure storage factory
        StorageFactory.configure(getStorageConfig());

        // Check if migration is needed
        const needsMigration = await StorageMigration.checkMigrationNeeded();

        if (needsMigration) {
          setIsMigrating(true);
          await StorageMigration.migrateFromAsyncStorageToMMKV();
          // Optionally clear AsyncStorage after successful migration
          // await StorageMigration.clearAsyncStorage();
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Storage initialization failed:", error);
        // Fallback to AsyncStorage if MMKV fails
        StorageFactory.configure({ type: "asyncstorage" });
        setIsInitialized(true);
      }
    };

    initializeStorage();
  }, []);

  if (!isInitialized) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#00ff00" />
        <Text className="text-green-500 mt-2 font-mono">
          {isMigrating ? "Migrating data..." : "Initializing storage..."}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};
