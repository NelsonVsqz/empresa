// __tests__/userService.test.js

// Mock de la API
const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

// Mock del módulo apiClient
jest.mock('../services/apiClient', () => ({
  apiClient: mockApi,
}));

// Importar después de hacer el mock
const { userService } = require('../services/userService');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('debería obtener todos los usuarios', async () => {
      // Preparación
      const mockUsers = [
        { id: '1', name: 'Usuario 1', email: 'user1@example.com' },
        { id: '2', name: 'Usuario 2', email: 'user2@example.com' }
      ];
      
      mockApi.get.mockResolvedValue({ data: { users: mockUsers } });

      // Ejecución
      const result = await userService.getAllUsers();

      // Verificación
      expect(mockApi.get).toHaveBeenCalledWith('/users');
      expect(result).toEqual({ users: mockUsers });
    });
  });

  describe('getUserById', () => {
    it('debería obtener un usuario por ID', async () => {
      // Preparación
      const mockUser = { id: '1', name: 'Usuario 1', email: 'user1@example.com' };
      mockApi.get.mockResolvedValue({ data: mockUser });

      // Ejecución
      const result = await userService.getUserById('1');

      // Verificación
      expect(mockApi.get).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('debería crear un nuevo usuario', async () => {
      // Preparación
      const userData = { name: 'Nuevo Usuario', email: 'nuevo@example.com', password: 'password' };
      const mockResponse = { id: '3', ...userData };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      // Ejecución
      const result = await userService.createUser(userData);

      // Verificación
      expect(mockApi.post).toHaveBeenCalledWith('/users', userData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateUser', () => {
    it('debería actualizar un usuario existente', async () => {
      // Preparación
      const userData = { name: 'Usuario Actualizado', email: 'actualizado@example.com' };
      const mockResponse = { id: '1', ...userData };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      // Ejecución
      const result = await userService.updateUser('1', userData);

      // Verificación
      expect(mockApi.put).toHaveBeenCalledWith('/users/1', userData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteUser', () => {
    it('debería eliminar un usuario', async () => {
      // Preparación
      mockApi.delete.mockResolvedValue({ data: { message: 'Usuario eliminado' } });

      // Ejecución
      const result = await userService.deleteUser('1');

      // Verificación
      expect(mockApi.delete).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual({ message: 'Usuario eliminado' });
    });
  });

  describe('bulkCreateUsers', () => {
    it('debería cargar usuarios en masa', async () => {
      // Preparación
      const mockFile = new File([''], 'users.csv', { type: 'text/csv' });
      const mockResponse = { success: true, message: 'Usuarios creados exitosamente' };
      
      // Mock de FormData
      global.FormData = jest.fn(() => ({
        append: jest.fn(),
      }));

      mockApi.post.mockResolvedValue({ data: mockResponse });

      // Ejecución
      const result = await userService.bulkCreateUsers(mockFile);

      // Verificación
      expect(mockApi.post).toHaveBeenCalledWith('/users/bulk-create', expect.any(FormData), {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: expect.any(Function),
      });
      expect(result).toEqual(mockResponse);
    });
  });
});