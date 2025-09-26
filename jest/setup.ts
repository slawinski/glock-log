/* globals global */

// Polyfill for setImmediate
(global as any).setImmediate = (
  callback: (...args: any[]) => void
) => {
  return setTimeout(callback, 0);
};

// Polyfill for clearImmediate
(global as any).clearImmediate = (id: number) => {
  clearTimeout(id);
};
