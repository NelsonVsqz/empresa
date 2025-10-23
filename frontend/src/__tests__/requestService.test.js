// __tests__/requestService.test.js

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
const { requestService } = require('../services/requestService');

describe('RequestService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPermissionRequests', () => {
    it('debería obtener todas las solicitudes de permiso con filtros', async () => {
      // Preparación
      const filters = { status: 'PENDING', sectorId: '1' };
      const mockRequests = [
        { id: '1', status: 'PENDING', userId: '1' },
        { id: '2', status: 'APPROVED', userId: '2' }
      ];
      
      mockApi.get.mockResolvedValue({ data: { permissionRequests: mockRequests } });

      // Ejecución
      const result = await requestService.getAllPermissionRequests(filters);

      // Verificación
      expect(mockApi.get).toHaveBeenCalledWith('/permission-requests?status=PENDING&sectorId=1');
      expect(result).toEqual({ permissionRequests: mockRequests });
    });

    it('debería obtener todas las solicitudes sin filtros', async () => {
      // Preparación
      const mockRequests = [
        { id: '1', status: 'PENDING', userId: '1' },
        { id: '2', status: 'APPROVED', userId: '2' }
      ];
      
      mockApi.get.mockResolvedValue({ data: { permissionRequests: mockRequests } });

      // Ejecución
      const result = await requestService.getAllPermissionRequests();

      // Verificación
      expect(mockApi.get).toHaveBeenCalledWith('/permission-requests');
      expect(result).toEqual({ permissionRequests: mockRequests });
    });
  });

  describe('getMyPermissionRequests', () => {
    it('debería obtener las solicitudes del usuario actual', async () => {
      // Preparación
      const mockRequests = [
        { id: '1', userId: 'current-user', status: 'PENDING' },
        { id: '2', userId: 'current-user', status: 'APPROVED' }
      ];
      
      mockApi.get.mockResolvedValue({ data: { permissionRequests: mockRequests } });

      // Ejecución
      const result = await requestService.getMyPermissionRequests();

      // Verificación
      expect(mockApi.get).toHaveBeenCalledWith('/permission-requests/my-requests');
      expect(result).toEqual({ permissionRequests: mockRequests });
    });
  });

  describe('getPendingRequestsForSector', () => {
    it('debería obtener solicitudes pendientes para un sector', async () => {
      // Preparación
      const mockRequests = [
        { id: '1', status: 'PENDING', sectorId: '1' },
        { id: '2', status: 'PENDING', sectorId: '1' }
      ];
      
      mockApi.get.mockResolvedValue({ data: { permissionRequests: mockRequests } });

      // Ejecución
      const result = await requestService.getPendingRequestsForSector('1');

      // Verificación
      expect(mockApi.get).toHaveBeenCalledWith('/permission-requests/pending-for-sector?sectorId=1');
      expect(result).toEqual({ permissionRequests: mockRequests });
    });

    it('debería obtener solicitudes pendientes sin especificar sector', async () => {
      // Preparación
      const mockRequests = [
        { id: '1', status: 'PENDING', sectorId: '1' },
        { id: '2', status: 'PENDING', sectorId: '2' }
      ];
      
      mockApi.get.mockResolvedValue({ data: { permissionRequests: mockRequests } });

      // Ejecución
      const result = await requestService.getPendingRequestsForSector();

      // Verificación
      expect(mockApi.get).toHaveBeenCalledWith('/permission-requests/pending-for-sector');
      expect(result).toEqual({ permissionRequests: mockRequests });
    });
  });

  describe('getPermissionRequestById', () => {
    it('debería obtener una solicitud específica por ID', async () => {
      // Preparación
      const mockRequest = { id: '1', userId: 'user1', status: 'PENDING' };
      
      mockApi.get.mockResolvedValue({ data: { permissionRequest: mockRequest } });

      // Ejecución
      const result = await requestService.getPermissionRequestById('1');

      // Verificación
      expect(mockApi.get).toHaveBeenCalledWith('/permission-requests/1');
      expect(result).toEqual({ permissionRequest: mockRequest });
    });
  });

  describe('createPermissionRequest', () => {
    it('debería crear una nueva solicitud de permiso', async () => {
      // Preparación
      const requestData = {
        typeId: '1',
        startDate: '2023-10-15',
        endDate: '2023-10-17',
        reason: 'Consulta médica'
      };
      
      const mockResponse = { id: '3', ...requestData, status: 'PENDING' };
      mockApi.post.mockResolvedValue({ data: mockResponse });

      // Ejecución
      const result = await requestService.createPermissionRequest(requestData);

      // Verificación
      expect(mockApi.post).toHaveBeenCalledWith('/permission-requests', requestData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updatePermissionRequest', () => {
    it('debería actualizar una solicitud de permiso', async () => {
      // Preparación
      const updateData = {
        startDate: '2023-10-20',
        endDate: '2023-10-22',
        status: 'APPROVED'
      };
      
      const mockResponse = { id: '1', ...updateData };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      // Ejecución
      const result = await requestService.updatePermissionRequest('1', updateData);

      // Verificación
      expect(mockApi.put).toHaveBeenCalledWith('/permission-requests/1', updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('approvePermissionRequest', () => {
    it('debería aprobar una solicitud de permiso', async () => {
      // Preparación
      const mockResponse = { id: '1', status: 'APPROVED' };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      // Ejecución
      const result = await requestService.approvePermissionRequest('1');

      // Verificación
      expect(mockApi.put).toHaveBeenCalledWith('/permission-requests/1/approve');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('rejectPermissionRequest', () => {
    it('debería rechazar una solicitud de permiso', async () => {
      // Preparación
      const rejectionData = { rejectionReason: 'Documentación incompleta' };
      const mockResponse = { id: '1', status: 'REJECTED', ...rejectionData };
      mockApi.put.mockResolvedValue({ data: mockResponse });

      // Ejecución
      const result = await requestService.rejectPermissionRequest('1', rejectionData);

      // Verificación
      expect(mockApi.put).toHaveBeenCalledWith('/permission-requests/1/reject', rejectionData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPermissionTypes', () => {
    it('debería obtener los tipos de permiso', async () => {
      // Preparación
      const mockTypes = [
        { id: '1', name: 'Permiso Médico' },
        { id: '2', name: 'Permiso Personal' }
      ];
      
      mockApi.get.mockResolvedValue({ data: { types: mockTypes } });

      // Ejecución
      const result = await requestService.getPermissionTypes();

      // Verificación
      expect(mockApi.get).toHaveBeenCalledWith('/permission-types');
      expect(result).toEqual({ types: mockTypes });
    });
  });
});