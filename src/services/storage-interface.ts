export interface StorageInterface {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

export interface StorageConfig {
  type: "asyncstorage" | "mmkv";
  encryptionKey?: string;
  id?: string;
}
