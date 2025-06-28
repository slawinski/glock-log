#!/usr/bin/env node

/**
 * Storage Migration Script
 *
 * This script helps migrate data between AsyncStorage and MMKV
 * Usage: node scripts/migrate-storage.js [from] [to]
 *
 * Examples:
 *   node scripts/migrate-storage.js asyncstorage mmkv
 *   node scripts/migrate-storage.js mmkv asyncstorage
 */

const fs = require("fs");
const path = require("path");

// Storage keys used in the app
const STORAGE_KEYS = {
  FIREARMS: "@glock-log:firearms",
  AMMUNITION: "@glock-log:ammunition",
  RANGE_VISITS: "@glock-log:range-visits",
};

// Mock storage implementations for the script
class MockAsyncStorage {
  constructor() {
    this.data = {};
  }

  async getItem(key) {
    return this.data[key] || null;
  }

  async setItem(key, value) {
    this.data[key] = value;
  }

  async removeItem(key) {
    delete this.data[key];
  }

  async clear() {
    this.data = {};
  }

  async getAllKeys() {
    return Object.keys(this.data);
  }
}

class MockMMKV {
  constructor() {
    this.data = {};
  }

  getString(key) {
    return this.data[key] || null;
  }

  set(key, value) {
    this.data[key] = value;
  }

  delete(key) {
    delete this.data[key];
  }

  clearAll() {
    this.data = {};
  }

  getAllKeys() {
    return Object.keys(this.data);
  }
}

// Migration function
async function migrateData(fromStorage, toStorage, keys) {
  console.log(
    `\n🔄 Starting migration from ${fromStorage.constructor.name} to ${toStorage.constructor.name}...`
  );

  let migratedCount = 0;
  let errorCount = 0;

  for (const key of keys) {
    try {
      // Get data from source storage
      let data;
      if (fromStorage instanceof MockAsyncStorage) {
        data = await fromStorage.getItem(key);
      } else {
        data = fromStorage.getString(key);
      }

      if (data) {
        // Save data to target storage
        if (toStorage instanceof MockAsyncStorage) {
          await toStorage.setItem(key, data);
        } else {
          toStorage.set(key, data);
        }

        console.log(`✅ Migrated: ${key}`);
        migratedCount++;
      } else {
        console.log(`⏭️  Skipped: ${key} (no data)`);
      }
    } catch (error) {
      console.error(`❌ Failed to migrate ${key}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successfully migrated: ${migratedCount} keys`);
  console.log(`   ❌ Failed migrations: ${errorCount} keys`);
  console.log(
    `   ⏭️  Skipped (no data): ${keys.length - migratedCount - errorCount} keys`
  );

  return { migratedCount, errorCount };
}

// Validation function
function validateStorageData(storage, keys) {
  console.log(`\n🔍 Validating storage data...`);

  let validCount = 0;
  let invalidCount = 0;

  for (const key of keys) {
    try {
      let data;
      if (storage instanceof MockAsyncStorage) {
        data = storage.data[key];
      } else {
        data = storage.data[key];
      }

      if (data) {
        // Try to parse JSON to validate data integrity
        JSON.parse(data);
        console.log(`✅ Valid: ${key}`);
        validCount++;
      } else {
        console.log(`⏭️  Empty: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Invalid JSON in ${key}:`, error.message);
      invalidCount++;
    }
  }

  console.log(`\n📊 Validation Summary:`);
  console.log(`   ✅ Valid data: ${validCount} keys`);
  console.log(`   ❌ Invalid data: ${invalidCount} keys`);
  console.log(
    `   ⏭️  Empty keys: ${keys.length - validCount - invalidCount} keys`
  );

  return { validCount, invalidCount };
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log(`
🚀 Storage Migration Script

Usage: node scripts/migrate-storage.js [from] [to]

Arguments:
  from    Source storage type (asyncstorage|mmkv)
  to      Target storage type (asyncstorage|mmkv)

Examples:
  node scripts/migrate-storage.js asyncstorage mmkv
  node scripts/migrate-storage.js mmkv asyncstorage

This script will:
1. Create mock storage instances
2. Migrate data between them
3. Validate data integrity
4. Show migration summary
    `);
    process.exit(1);
  }

  const [fromType, toType] = args;

  // Validate arguments
  if (
    !["asyncstorage", "mmkv"].includes(fromType) ||
    !["asyncstorage", "mmkv"].includes(toType)
  ) {
    console.error('❌ Invalid storage type. Use "asyncstorage" or "mmkv"');
    process.exit(1);
  }

  if (fromType === toType) {
    console.error("❌ Source and target storage types must be different");
    process.exit(1);
  }

  console.log(`\n🚀 Starting storage migration: ${fromType} → ${toType}`);

  // Create storage instances
  const fromStorage =
    fromType === "asyncstorage" ? new MockAsyncStorage() : new MockMMKV();
  const toStorage =
    toType === "asyncstorage" ? new MockAsyncStorage() : new MockMMKV();

  // Simulate some data in source storage (for demo purposes)
  if (fromType === "asyncstorage") {
    await fromStorage.setItem(
      STORAGE_KEYS.FIREARMS,
      JSON.stringify([
        { id: "firearm-1", modelName: "Glock 19", caliber: "9mm" },
      ])
    );
    await fromStorage.setItem(
      STORAGE_KEYS.AMMUNITION,
      JSON.stringify([
        { id: "ammo-1", caliber: "9mm", brand: "Federal", quantity: 100 },
      ])
    );
  } else {
    fromStorage.set(
      STORAGE_KEYS.FIREARMS,
      JSON.stringify([
        { id: "firearm-1", modelName: "Glock 19", caliber: "9mm" },
      ])
    );
    fromStorage.set(
      STORAGE_KEYS.AMMUNITION,
      JSON.stringify([
        { id: "ammo-1", caliber: "9mm", brand: "Federal", quantity: 100 },
      ])
    );
  }

  // Get all storage keys
  const keys = Object.values(STORAGE_KEYS);

  // Validate source data
  validateStorageData(fromStorage, keys);

  // Perform migration
  const migrationResult = await migrateData(fromStorage, toStorage, keys);

  // Validate target data
  validateStorageData(toStorage, keys);

  // Show final summary
  console.log(`\n🎉 Migration completed!`);
  console.log(`   From: ${fromType}`);
  console.log(`   To: ${toType}`);
  console.log(
    `   Success rate: ${(
      (migrationResult.migratedCount / keys.length) *
      100
    ).toFixed(1)}%`
  );

  if (migrationResult.errorCount > 0) {
    console.log(
      `\n⚠️  Some migrations failed. Check the logs above for details.`
    );
    process.exit(1);
  } else {
    console.log(`\n✅ All migrations completed successfully!`);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  });
}

module.exports = {
  migrateData,
  validateStorageData,
  MockAsyncStorage,
  MockMMKV,
};
