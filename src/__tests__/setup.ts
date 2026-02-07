/**
 * Test Setup
 *
 * Global setup for Jest tests with Next.js.
 * Run: npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom
 */
import "@testing-library/jest-dom";

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock console methods to reduce noise
jest.spyOn(console, "debug").mockImplementation(() => {});
jest.spyOn(console, "log").mockImplementation(() => {});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// Reset fetch mock after each test
afterEach(() => {
  (global.fetch as jest.Mock).mockReset();
});
