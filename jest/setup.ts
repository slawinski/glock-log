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
