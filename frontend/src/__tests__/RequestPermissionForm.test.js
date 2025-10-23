// __tests__/RequestPermissionForm.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import RequestPermissionForm from '../pages/requests/RequestPermissionForm';

// Mock del contexto de autenticación
const mockAuthContext = {
  user: { id: '1', name: 'Test User', role: 'EMPLOYEE' },
  isAuthenticated: true,
  isLoading: false,
};

// Mock del servicio de solicitudes
jest.mock('../services/requestService', () => ({
  requestService: {
    getPermissionTypes: jest.fn(),
    createPermissionRequest: jest.fn(),
  }
}));

const { requestService } = require('../services/requestService');

// Mock del hook useAuth
jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('RequestPermissionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería renderizar el formulario correctamente', () => {
    render(<RequestPermissionForm />);
    
    expect(screen.getByText('Solicitar Nuevo Permiso')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo de Permiso *')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de Inicio *')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha de Fin *')).toBeInTheDocument();
    expect(screen.getByLabelText('Razón *')).toBeInTheDocument();
    expect(screen.getByText('Subir archivos')).toBeInTheDocument();
  });

  it('debería cargar los tipos de permiso al montar el componente', async () => {
    const mockTypes = [
      { id: '1', name: 'Permiso Médico', description: 'Permiso por razones médicas' },
      { id: '2', name: 'Permiso Personal', description: 'Permiso por asuntos personales' }
    ];
    
    requestService.getPermissionTypes.mockResolvedValue(mockTypes);

    await act(async () => {
      render(<RequestPermissionForm />);
    });

    await waitFor(() => {
      expect(screen.getByText('Permiso Médico - Permiso por razones médicas')).toBeInTheDocument();
      expect(screen.getByText('Permiso Personal - Permiso por asuntos personales')).toBeInTheDocument();
    });
  });

  it('debería crear una solicitud de permiso cuando se envía el formulario', async () => {
    const mockTypes = [
      { id: '1', name: 'Permiso Médico', description: 'Permiso por razones médicas' }
    ];
    
    requestService.getPermissionTypes.mockResolvedValue(mockTypes);
    requestService.createPermissionRequest.mockResolvedValue({
      id: '1',
      typeId: '1',
      startDate: '2023-10-15',
      endDate: '2023-10-17',
      reason: 'Consulta médica',
      status: 'PENDING'
    });

    await act(async () => {
      render(<RequestPermissionForm />);
    });

    // Esperar a que se carguen los tipos de permiso
    await waitFor(() => {
      expect(screen.getByText('Permiso Médico - Permiso por razones médicas')).toBeInTheDocument();
    });

    // Seleccionar tipo de permiso
    fireEvent.change(screen.getByLabelText('Tipo de Permiso *'), { target: { value: '1' } });

    // Rellenar fechas
    fireEvent.change(screen.getByLabelText('Fecha de Inicio *'), { target: { value: '2023-10-15' } });
    fireEvent.change(screen.getByLabelText('Fecha de Fin *'), { target: { value: '2023-10-17' } });

    // Rellenar razón
    fireEvent.change(screen.getByLabelText('Razón *'), { target: { value: 'Consulta médica' } });

    // Enviar formulario
    fireEvent.click(screen.getByText('Solicitar Permiso'));

    await waitFor(() => {
      expect(requestService.createPermissionRequest).toHaveBeenCalledWith({
        typeId: '1',
        startDate: '2023-10-15',
        endDate: '2023-10-17',
        reason: 'Consulta médica'
      });
    });
  });

  it('debería mostrar un mensaje de error si falla la creación de la solicitud', async () => {
    const mockTypes = [
      { id: '1', name: 'Permiso Médico', description: 'Permiso por razones médicas' }
    ];
    
    requestService.getPermissionTypes.mockResolvedValue(mockTypes);
    requestService.createPermissionRequest.mockRejectedValue(
      new Error('Error al crear la solicitud')
    );

    await act(async () => {
      render(<RequestPermissionForm />);
    });

    // Esperar a que se carguen los tipos de permiso
    await waitFor(() => {
      expect(screen.getByText('Permiso Médico - Permiso por razones médicas')).toBeInTheDocument();
    });

    // Seleccionar tipo de permiso
    fireEvent.change(screen.getByLabelText('Tipo de Permiso *'), { target: { value: '1' } });

    // Rellenar fechas
    fireEvent.change(screen.getByLabelText('Fecha de Inicio *'), { target: { value: '2023-10-15' } });
    fireEvent.change(screen.getByLabelText('Fecha de Fin *'), { target: { value: '2023-10-17' } });

    // Rellenar razón
    fireEvent.change(screen.getByLabelText('Razón *'), { target: { value: 'Consulta médica' } });

    // Enviar formulario
    fireEvent.click(screen.getByText('Solicitar Permiso'));

    await waitFor(() => {
      expect(screen.getByText('Error al crear la solicitud de permiso: Error al crear la solicitud')).toBeInTheDocument();
    });
  });
});