// services/requestService.js
import { apiClient } from './apiClient';

export const requestService = {
  // Obtener todas las solicitudes de permiso (con filtros)
  getAllPermissionRequests: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/permission-requests${queryString ? `?${queryString}` : ''}`);
    return response.data.permissionRequests || []; // Extraer el array del objeto de respuesta
  },

  // Obtener solicitudes de permiso para el usuario actual
  getMyPermissionRequests: async () => {
    const response = await apiClient.get('/permission-requests/my-requests');
    return response.data.permissionRequests || []; // Extraer el array del objeto de respuesta
  },

  // Obtener solicitudes pendientes para un sector (jefe de sector)
  getPendingRequestsForSector: async (sectorId) => {
    const params = sectorId ? { sectorId } : {};
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/permission-requests/pending-for-sector${queryString ? `?${queryString}` : ''}`);
    return response.data.permissionRequests || []; // Extraer el array del objeto de respuesta
  },

  // Obtener una solicitud específica
  getPermissionRequestById: async (id) => {
    const response = await apiClient.get(`/permission-requests/${id}`);
    return response.data.permissionRequest || null; // Extraer la solicitud del objeto de respuesta
  },

  // Crear una nueva solicitud de permiso
  createPermissionRequest: async (requestData) => {
    const response = await apiClient.post('/permission-requests', requestData);
    return response.data.permissionRequest || response.data; // Devolver la solicitud creada o la respuesta completa
  },

  // Actualizar una solicitud de permiso (modificar fechas)
  updatePermissionRequest: async (id, updateData) => {
    const response = await apiClient.put(`/permission-requests/${id}`, updateData);
    return response.data.permissionRequest || response.data; // Devolver la solicitud actualizada o la respuesta completa
  },

  // Aprobar una solicitud de permiso
  approvePermissionRequest: async (id) => {
    const response = await apiClient.put(`/permission-requests/${id}/approve`);
    return response.data.permissionRequest || response.data; // Devolver la solicitud actualizada o la respuesta completa
  },

  // Rechazar una solicitud de permiso
  rejectPermissionRequest: async (id, rejectionData) => {
    const response = await apiClient.put(`/permission-requests/${id}/reject`, rejectionData);
    return response.data.permissionRequest || response.data; // Devolver la solicitud actualizada o la respuesta completa
  },

  // Obtener tipos de permiso
  getPermissionTypes: async () => {
    const response = await apiClient.get('/permission-types');
    return response.data.permissionTypes || []; // Extraer el array del objeto de respuesta
  }
};