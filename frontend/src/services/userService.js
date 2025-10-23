// services/userService.js
import { apiClient } from './apiClient';

export const userService = {
  // Obtener todos los usuarios (con filtros) (x3)
  getAllUsers: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/users${queryString ? `?${queryString}` : ''}`);
    return response.data.users || []; // Extraer el array del objeto de respuesta
  },

  // Obtener un usuario específico
  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data.user || null; // Extraer el usuario del objeto de respuesta
  },

  // Crear un nuevo usuario
  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data.user || response.data; // Devolver el usuario creado o la respuesta completa
  },

  // Actualizar un usuario
  updateUser: async (id, updateData) => {
    const response = await apiClient.put(`/users/${id}`, updateData);
    return response.data.user || response.data; // Devolver el usuario actualizado o la respuesta completa
  },

  // Eliminar un usuario
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data; // Devolver la respuesta completa
  },

  // Obtener usuarios de un sector específico
  getUsersBySector: async (sectorId) => {
    const response = await apiClient.get(`/users/by-sector?sectorId=${sectorId}`);
    return response.data.users || []; // Extraer el array del objeto de respuesta
  }
};