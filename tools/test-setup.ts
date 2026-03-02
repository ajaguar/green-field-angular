export function setupPolyfills(): void {
  // Polyfill for ResizeObserver (needed for Siemens IX components)
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class ResizeObserver {
      constructor() {
        // Mock implementation
      }
      observe() {
        // Mock implementation
      }
      unobserve() {
        // Mock implementation
      }
      disconnect() {
        // Mock implementation
      }
    };
  }

  // Mock window.matchMedia (needed for theme detection)
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
}
