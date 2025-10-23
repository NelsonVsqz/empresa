// __tests__/setupTests.js
// Este archivo se ejecuta antes de cada prueba

// Configuración global para pruebas
import '@testing-library/jest-dom';

// Mock global para window.location
delete window.location;
window.location = {
  ...window.location,
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Mock global para localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock global para alert
window.alert = jest.fn();