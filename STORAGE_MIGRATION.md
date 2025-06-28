# Storage Migration: AsyncStorage → MMKV

This document outlines the migration from AsyncStorage to MMKV in the Glock Log app, providing a flexible abstraction layer that allows easy switching between storage backends.

## 🚀 Benefits of MMKV

- **30x faster** than AsyncStorage
- **Synchronous operations** (no async/await needed)
- **Better memory management**
- **Encryption support** (optional)
- **JSI-based** (no bridge overhead)

## 📁 File Structure

```
src/services/
├── storage-interface.ts          # Storage interface definition
├── storage-factory.ts            # Factory for creating storage instances
├── storage-config.ts             # Configuration management
├── storage-migration.ts          # Migration utilities
├── storage-init.tsx              # React component for initialization
├── storage-new.ts                # New storage service using abstraction
├── storage-adapters/
│   ├── mmkv-adapter.ts           # MMKV implementation
│   └── asyncstorage-adapter.ts   # AsyncStorage implementation
└── __tests__/
    └── storage-abstraction.test.ts # Comprehensive tests
scripts/
└── migrate-storage.cjs           # Migration script
```

## 🔧 Installation

MMKV is already installed in the project:

```bash
npm install react-native-mmkv
```

## ⚙️ Configuration

### Basic Configuration

Edit `src/services/storage-config.ts`:

```typescript
export const STORAGE_CONFIG: StorageConfig = {
  type: "mmkv", // 'mmkv' or 'asyncstorage'
  id: "glock-log-storage",
  // Optional: Add encryption for sensitive data
  // encryptionKey: 'your-secret-key-here',
};
```

### Environment-Specific Configuration

You can add environment-specific logic in `getStorageConfig()`:

```typescript
export const getStorageConfig = (): StorageConfig => {
  // Use MMKV in production, AsyncStorage in development
  if (process.env.NODE_ENV === "development") {
    return {
      ...STORAGE_CONFIG,
      type: "asyncstorage", // Fallback for development
    };
  }

  return STORAGE_CONFIG;
};
```

## 🔄 Migration Process

### 1. Automatic Migration

The app automatically handles migration when it starts. The `StorageInit` component:

1. Configures the storage factory
2. Checks if migration is needed
3. Migrates data from AsyncStorage to MMKV if required
4. Falls back to AsyncStorage if MMKV fails

### 2. Manual Migration

If you need to manually trigger migration:

```typescript
import { StorageMigration } from "./src/services/storage-migration";

// Check if migration is needed
const needsMigration = await StorageMigration.checkMigrationNeeded();

if (needsMigration) {
  // Perform migration
  await StorageMigration.migrateFromAsyncStorageToMMKV();

  // Optionally clear AsyncStorage after successful migration
  // await StorageMigration.clearAsyncStorage();
}
```

### 3. Migration Script

Use the provided migration script for testing:

```bash
# Migrate from AsyncStorage to MMKV
node scripts/migrate-storage.cjs asyncstorage mmkv

# Migrate from MMKV to AsyncStorage
node scripts/migrate-storage.cjs mmkv asyncstorage
```

## 🏗️ Usage

### 1. Initialize Storage in App

Wrap your app with the `StorageInit` component:

```typescript
import { StorageInit } from "./src/services/storage-init";

export default function App() {
  return (
    <StorageInit>
      <NavigationContainer>{/* Your app content */}</NavigationContainer>
    </StorageInit>
  );
}
```

### 2. Use the Storage Service

The storage service API remains the same:

```typescript
import { storage } from "./src/services/storage-new";

// Save a firearm
await storage.saveFirearm({
  modelName: "Glock 19",
  caliber: "9mm",
  datePurchased: new Date().toISOString(),
  amountPaid: 500,
});

// Get all firearms
const firearms = await storage.getFirearms();

// Delete a firearm
await storage.deleteFirearm("firearm-id");
```

### 3. Switch Storage Backends

To switch between storage backends:

```typescript
import { StorageFactory } from "./src/services/storage-factory";

// Switch to MMKV
StorageFactory.configure({ type: "mmkv" });

// Switch to AsyncStorage
StorageFactory.configure({ type: "asyncstorage" });
```

## 🧪 Testing

Run the storage abstraction tests:

```bash
npx jest src/services/__tests__/storage-abstraction.test.ts
```

The tests cover:

- Storage factory functionality
- MMKV adapter operations
- AsyncStorage adapter operations
- Error handling
- Instance management

## 🔒 Security Features

### Encryption

Enable encryption for sensitive data:

```typescript
export const STORAGE_CONFIG: StorageConfig = {
  type: "mmkv",
  id: "glock-log-storage",
  encryptionKey: "your-secret-key-here", // 16+ characters recommended
};
```

### Multiple Instances

Create separate storage instances for different data types:

```typescript
// User data
const userStorage = new MMKVAdapter({
  id: "user-data",
  encryptionKey: "user-secret-key",
});

// App settings
const settingsStorage = new MMKVAdapter({
  id: "app-settings",
});
```

## 📊 Performance Comparison

| Operation | AsyncStorage | MMKV    | Improvement |
| --------- | ------------ | ------- | ----------- |
| Read      | ~1ms         | ~0.03ms | 30x faster  |
| Write     | ~2ms         | ~0.05ms | 40x faster  |
| Delete    | ~1ms         | ~0.02ms | 50x faster  |
| Clear All | ~10ms        | ~0.1ms  | 100x faster |

## 🚨 Troubleshooting

### Common Issues

1. **MMKV not found error**

   - Ensure MMKV is properly installed
   - Run `cd ios && pod install` for iOS
   - Clean and rebuild the project

2. **Migration fails**

   - Check console logs for specific errors
   - Verify AsyncStorage data integrity
   - Fallback to AsyncStorage if needed

3. **Performance issues**
   - Monitor memory usage with large datasets
   - Consider data pagination for large collections
   - Use appropriate data structures

### Fallback Strategy

The system automatically falls back to AsyncStorage if MMKV fails:

```typescript
try {
  StorageFactory.configure({ type: "mmkv" });
} catch (error) {
  console.error("MMKV failed, falling back to AsyncStorage:", error);
  StorageFactory.configure({ type: "asyncstorage" });
}
```

## 🔄 Rollback Plan

If you need to rollback to AsyncStorage:

1. Update `storage-config.ts`:

   ```typescript
   export const STORAGE_CONFIG: StorageConfig = {
     type: "asyncstorage",
   };
   ```

2. Restart the app

3. Data will be read from AsyncStorage (if it still exists)

## 📝 Migration Checklist

- [x] Install MMKV package
- [x] Create storage abstraction layer
- [x] Implement MMKV and AsyncStorage adapters
- [x] Create storage factory and configuration
- [x] Build migration utilities
- [x] Create initialization component
- [x] Write comprehensive tests
- [x] Update app to use new storage system
- [x] Test migration process
- [x] Document the migration

## 🎯 Next Steps

1. **Gradual Migration**: Start with MMKV in development
2. **Performance Monitoring**: Track storage performance metrics
3. **User Feedback**: Monitor for any issues in production
4. **Optimization**: Fine-tune configuration based on usage patterns

## 📚 Resources

- [MMKV Documentation](https://github.com/mrousavy/react-native-mmkv)
- [React Native Storage Comparison](https://github.com/mrousavy/react-native-mmkv#comparison)
- [JSI Architecture](https://reactnative.dev/docs/the-new-architecture/why)
