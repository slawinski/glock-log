// Polyfill for setImmediate
(global as any).setImmediate = (callback: () => void) => {
  return setTimeout(callback, 0);
};

// Polyfill for clearImmediate
(global as any).clearImmediate = (id: number) => {
  clearTimeout(id);
};

jest.mock("@shopify/react-native-skia", () => ({
  Canvas: "Canvas",
  Rect: "Rect",
  Shader: "Shader",
  Skia: {
    Point: (x: number, y: number) => ({ x, y }),
    Color: (color: string) => color,
    RuntimeShaderBuilder: jest.fn().mockImplementation(() => ({
      setUniform: jest.fn(),
    })),
    RuntimeEffect: {
      Make: jest.fn(),
    },
  },
  useFont: jest.fn().mockReturnValue({}),
  useValue: jest.fn(),
  useComputedValue: jest.fn(),
  vec: jest.fn(),
}));

jest.mock("expo-blur", () => ({
  BlurView: "BlurView",
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("react-native-zip-archive", () => ({
  zip: jest.fn().mockResolvedValue("zip-path"),
  unzip: jest.fn().mockResolvedValue("unzip-path"),
  subscribe: jest.fn(),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue({}),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("expo-file-system", () => ({
  documentDirectory: "file:///test-docs/",
  cacheDirectory: "file:///test-cache/",
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue("{}"),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  setInfoAsync: jest.fn().mockResolvedValue(undefined),
  EncodingType: {
    UTF8: "utf8",
  },
}));

// Mock console.error globally to prevent test logs from cluttering output
const originalConsoleError = console.error;
console.error = (..._args) => {
  // You can add logic here to filter specific, expected errors if you want,
  // or just suppress all of them during tests.
  // For now, we'll suppress all of them.
  // If you need to see specific errors during debugging, you can temporarily
  // comment out this line or add a condition.
};

// Restore original console.error after all tests are done (optional, but good practice)
afterAll(() => {
  console.error = originalConsoleError;
});
