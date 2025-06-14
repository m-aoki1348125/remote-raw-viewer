// Mock import.meta for Jest
global.importMeta = {
  env: {
    VITE_API_URL: 'http://localhost:8000'
  }
};

// Make import.meta available globally
Object.defineProperty(global, 'import', {
  value: {
    meta: global.importMeta
  },
  writable: true,
  configurable: true
});