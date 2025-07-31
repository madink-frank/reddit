import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// ============================================================================
// Global Test Setup
// ============================================================================

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
});
window.IntersectionObserver = mockIntersectionObserver;
(globalThis as any).IntersectionObserver = mockIntersectionObserver;

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.ResizeObserver = mockResizeObserver;
(globalThis as any).ResizeObserver = mockResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mocked-url'),
});

// Mock URL.revokeObjectURL
Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});

// Mock fetch
(globalThis as any).fetch = vi.fn();

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// ============================================================================
// Custom Test Utilities
// ============================================================================

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_API_URL: 'http://localhost:8000/api/v1',
  VITE_SITE_NAME: 'Test Blog',
  VITE_SITE_DESCRIPTION: 'Test Description',
  VITE_SITE_URL: 'http://localhost:3000',
  MODE: 'test',
  DEV: false,
  PROD: false,
  SSR: false,
}));

// Global test helpers
declare global {
  var mockFetch: any;
  var mockLocalStorage: typeof localStorageMock;
  var mockSessionStorage: typeof sessionStorageMock;
}

(globalThis as any).mockFetch = (globalThis as any).fetch;
(globalThis as any).mockLocalStorage = localStorageMock;
(globalThis as any).mockSessionStorage = sessionStorageMock;