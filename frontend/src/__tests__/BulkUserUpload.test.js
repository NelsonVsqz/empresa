// __tests__/BulkUserUpload.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import BulkUserUpload from '../pages/admin/BulkUserUpload';

// Mock del contexto de autenticación
const mockAuthContext = {
  user: { id: '1', name: 'Test User', role: 'HR' },
  isAuthenticated: true,
  isLoading: false,
};

// Mock del servicio de usuarios
jest.mock('../services/userService', () => ({
  userService: {
    bulkCreateUsers: jest.fn(),
  }
}));

const { userService } = require('../services/userService');

// Mock del hook useAuth
jest.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

describe('BulkUserUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería renderizar el componente correctamente', () => {
    render(<BulkUserUpload />);
    
    expect(screen.getByText('Carga Masiva de Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Subir archivo CSV o Excel')).toBeInTheDocument();
    expect(screen.getByText('Subir Usuarios')).toBeInTheDocument();
  });

  it('debería simular la selección de un archivo', () => {
    render(<BulkUserUpload />);
    
    // Crear un archivo de prueba
    const file = new File(['test content'], 'users.csv', { type: 'text/csv' });
    
    // Simular la selección del archivo
    const fileInput = screen.getByLabelText('Subir archivo CSV o Excel');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Verificar que el nombre del archivo se muestre
    expect(screen.getByText('Archivo seleccionado: users.csv')).toBeInTheDocument();
  });

  it('debería cargar usuarios en masa cuando se envía el formulario', async () => {
    // Mockear la función bulkCreateUsers para resolver con éxito
    userService.bulkCreateUsers.mockResolvedValue({
      success: true,
      message: 'Usuarios creados exitosamente'
    });

    render(<BulkUserUpload />);
    
    // Crear un archivo de prueba
    const file = new File(['test content'], 'users.csv', { type: 'text/csv' });
    
    // Simular la selección del archivo
    const fileInput = screen.getByLabelText('Subir archivo CSV o Excel');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Simular el clic en el botón de subida
    const uploadButton = screen.getByText('Subir Usuarios');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(userService.bulkCreateUsers).toHaveBeenCalledWith(file);
    });
  });

  it('debería mostrar un mensaje de error si falla la carga de usuarios', async () => {
    // Mockear la función bulkCreateUsers para lanzar un error
    userService.bulkCreateUsers.mockRejectedValue(
      new Error('Error al subir usuarios')
    );

    render(<BulkUserUpload />);
    
    // Crear un archivo de prueba
    const file = new File(['test content'], 'users.csv', { type: 'text/csv' });
    
    // Simular la selección del archivo
    const fileInput = screen.getByLabelText('Subir archivo CSV o Excel');
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Simular el clic en el botón de subida
    const uploadButton = screen.getByText('Subir Usuarios');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Error al subir usuarios: Error al subir usuarios')).toBeInTheDocument();
    });
  });

  it('debería validar que el archivo tenga extensión válida', () => {
    // Mockear alert para evitar que se muestre durante las pruebas
    window.alert = jest.fn();

    render(<BulkUserUpload />);
    
    // Crear un archivo con extensión no válida
    const invalidFile = new File(['test content'], 'users.txt', { type: 'text/plain' });
    
    // Simular la selección del archivo
    const fileInput = screen.getByLabelText('Subir archivo CSV o Excel');
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    // Verificar que se haya mostrado la alerta
    expect(window.alert).toHaveBeenCalledWith('Por favor, seleccione un archivo CSV o Excel válido.');
  });
});