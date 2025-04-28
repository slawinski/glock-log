// Polyfill for setImmediate
(global as any).setImmediate = (
  callback: (...args: any[]) => void,
  ...args: any[]
) => {
  return setTimeout(callback, 0, ...args);
};

// Polyfill for clearImmediate
(global as any).clearImmediate = (id: number) => {
  clearTimeout(id);
};
