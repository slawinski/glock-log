import { StorageFactory } from './storage-factory';
import { STORAGE_CONFIG } from './storage-config';
import { MMKVAdapter } from './storage-adapters/mmkv-adapter';

jest.mock('./storage-adapters/mmkv-adapter');

describe('StorageFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('configures the factory with the provided config', () => {
    StorageFactory.configure(STORAGE_CONFIG);
    expect(StorageFactory['config']).toEqual(STORAGE_CONFIG);
  });

  it('throws an error if getStorage is called before configure', () => {
    // Reset config to ensure it's not configured
    StorageFactory['config'] = undefined;
    expect(() => StorageFactory.getStorage()).toThrow('Storage not configured. Call configure() first.');
  });

  it('returns an MMKVAdapter instance when type is mmkv', () => {
    StorageFactory.configure(STORAGE_CONFIG);
    const storageInstance = StorageFactory.getStorage();
    expect(MMKVAdapter).toHaveBeenCalledWith(STORAGE_CONFIG);
    expect(storageInstance).toBeInstanceOf(MMKVAdapter);
  });

  it('returns the same instance on subsequent calls', () => {
    StorageFactory.configure(STORAGE_CONFIG);
    const instance1 = StorageFactory.getStorage();
    const instance2 = StorageFactory.getStorage();
    expect(instance1).toBe(instance2);
  });
});
