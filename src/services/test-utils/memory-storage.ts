import { StorageInterface } from "../storage-interface";

/**
 * In-memory implementation of StorageInterface backed by a Map.
 * Used by service tests so they can observe raw storage keys
 * (e.g. for migration tests) while behaving like the MMKV adapter.
 */
export type MemoryStorage = StorageInterface & {
  map: Map<string, string>;
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
  getAllKeys: jest.Mock;
};

export const createMemoryStorage = (): MemoryStorage => {
  const map = new Map<string, string>();

  return {
    map,
    getItem: jest.fn(async (key: string) => map.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      map.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      map.delete(key);
    }),
    clear: jest.fn(async () => {
      map.clear();
    }),
    getAllKeys: jest.fn(async () => Array.from(map.keys())),
  };
};
