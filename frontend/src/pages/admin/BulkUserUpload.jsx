import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { toast } from 'react-toastify';

const BulkUserUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [showIndividualForm, setShowIndividualForm] = useState(true);
  const [allSectors, setAllSectors] = useState([]);

  // Estados para el formulario individual
  const [individualUser, setIndividualUser] = useState({
    email: '',
    name: '',
    password: '',
    role: 'EMPLOYEE',
    sectorId: '',
    managedSectorId: ''
  });

  // Cargar sectores al montar el componente
  useEffect(() => {
    const loadSectors = async () => {
      try {
        const sectorsResponse = await apiClient.get('/sectors');
        setAllSectors(sectorsResponse.data.sectors || []);
      } catch (error) {
        console.error('Error al cargar sectores:', error);
        toast.error('Error al cargar sectores');
        setAllSectors([]);
      }
    };

    loadSectors();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setUploadStatus('Por favor seleccione un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus('Subiendo archivo...');
    
    try {
      const response = await apiClient.post('/users/bulk-create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadResult({
        success: true,
        usersCreated: response.data.successCount || 0,
        usersFailed: response.data.errorCount || 0,
        errors: response.data.errors || []
      });
      setUploadStatus('Archivo subido exitosamente.');
    } catch (error) {
      setUploadStatus('Error al subir el archivo.');
      setUploadResult({
        success: false,
        usersCreated: 0,
        usersFailed: error.response?.data?.errorCount || 5,
        errors: [error.response?.data?.error || error.message]
      });
    }
  };

  // Manejar el envío del formulario individual
  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    
    setUploadStatus('Creando usuario individual...');
    
    try {
      // Preparar los datos para enviar
      const userData = {
        ...individualUser
      };
      
      // Si el rol es MANAGER y no hay managedSectorId, mandar un error
      if (individualUser.role === 'MANAGER' && !individualUser.managedSectorId) {
        throw new Error('Los jefes de sector deben tener un sector asignado para gestionar');
      }
      
      const response = await apiClient.post('/users', userData);
      
      setUploadResult({
        success: true,
        usersCreated: 1,
        usersFailed: 0,
        errors: []
      });
      setUploadStatus('Usuario creado exitosamente.');
      
      // Limpiar formulario
      setIndividualUser({
        email: '',
        name: '',
        password: '',
        role: 'EMPLOYEE',
        sectorId: '',
        managedSectorId: ''
      });
    } catch (error) {
      setUploadStatus('Error al crear usuario: ' + (error.message || error.response?.data?.error || error.message));
      setUploadResult({
        success: false,
        usersCreated: 0,
        usersFailed: 1,
        errors: [error.message || error.response?.data?.error || error.message]
      });
    }
  };

  const handleIndividualChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'role') {
      // Si cambia el rol a MANAGER, mover el sectorId al managedSectorId
      // Si cambia el rol a EMPLOYEE, mover el managedSectorId al sectorId
      // Si cambia el rol a HR, limpiar ambos sectores
      setIndividualUser(prev => {
        if (value === 'MANAGER') {
          // Si se cambia a MANAGER, el sector seleccionado será el que gestiona
          return {
            ...prev,
            role: value,
            managedSectorId: prev.sectorId, // El sector que seleccionó ahora lo va a gestionar
            sectorId: '' // Dejar vacío ya que como MANAGER no pertenece a un sector como empleado
          };
        } else if (prev.role === 'MANAGER' && value === 'EMPLOYEE') {
          // Si se cambia de MANAGER a EMPLOYEE, mover managedSectorId a sectorId
          return {
            ...prev,
            role: value,
            sectorId: prev.managedSectorId, // El sector que gestionaba ahora será su sector como empleado
            managedSectorId: ''
          };
        } else {
          return {
            ...prev,
            role: value
          };
        }
      });
    } else if (name === 'sectorId') {
      // Si se selecciona un sector y el rol es MANAGER, este será el sector que gestiona
      // Si se selecciona un sector y el rol es EMPLOYEE, este será su sector como empleado
      setIndividualUser(prev => {
        if (prev.role === 'MANAGER') {
          // Si es MANAGER, el sector seleccionado es el que va a gestionar
          return {
            ...prev,
            managedSectorId: value,
            sectorId: '' // Los managers no pertenecen a un sector como empleados
          };
        } else {
          // Si es EMPLOYEE, establecer sectorId
          return {
            ...prev,
            sectorId: value
          };
        }
      });
    } else {
      setIndividualUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Carga de Usuarios</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.href = '/user-list'}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Ver Listado de Usuarios
          </button>
        </div>
      </div>
      
      {/* Opciones de carga */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setShowIndividualForm(false)}
            className={`${
              !showIndividualForm
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Carga Masiva
          </button>
          <button
            onClick={() => setShowIndividualForm(true)}
            className={`${
              showIndividualForm
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Carga Individual
          </button>
        </nav>
      </div>
      
      {/* Formulario de carga masiva */}
      {!showIndividualForm && (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo de usuarios (CSV o Excel)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Subir archivo</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">o arrastrar y soltar</p>
                </div>
                <p className="text-xs text-gray-500">
                  CSV, XLSX, XLS hasta 10MB
                </p>
                {file && (
                  <p className="text-sm text-gray-600">
                    Archivo seleccionado: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Subir Archivo
            </button>
          </div>
        </form>
      )}
      
      {/* Formulario de carga individual */}
      {showIndividualForm && (
        <form onSubmit={handleIndividualSubmit}>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={individualUser.name}
                onChange={handleIndividualChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={individualUser.email}
                onChange={handleIndividualChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={individualUser.password}
                onChange={handleIndividualChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            <div className="sm:col-span-3">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={individualUser.role}
                onChange={handleIndividualChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="EMPLOYEE">Empleado</option>
                <option value="MANAGER">Jefe de Sector</option>
              </select>
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="sectorId" className="block text-sm font-medium text-gray-700">
                {individualUser.role === 'MANAGER' ? 'Sector a Gestionar' : 'Sector'}
              </label>
              <select
                id="sectorId"
                name="sectorId"
                value={
                  individualUser.role === 'MANAGER' ? individualUser.managedSectorId : 
                  individualUser.sectorId
                }
                onChange={handleIndividualChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Ninguno</option>
                {allSectors.map(sector => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500">
                {individualUser.role === 'MANAGER' 
                  ? 'Seleccione el sector que este usuario gestionará' 
                  : 'Opcional - Dejar vacío si no pertenece a un sector'}
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      )}
      
      {uploadStatus && (
        <div className="mt-4 p-4 rounded-md bg-blue-50">
          <p className="text-sm text-blue-700">{uploadStatus}</p>
        </div>
      )}
      
      {uploadResult && (
        <div className={`mt-4 p-4 rounded-md ${uploadResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3 className="text-sm font-medium">
            {uploadResult.success ? 'Operación exitosa' : 'Errores en la operación'}
          </h3>
          <div className="mt-2 text-sm text-gray-700">
            <p>Usuarios creados: {uploadResult.usersCreated}</p>
            <p>Usuarios fallidos: {uploadResult.usersFailed}</p>
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="mt-2">
                <p>Errores:</p>
                <ul className="list-disc pl-5 mt-1">
                  {uploadResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Mostrar instrucciones según el modo */}
      {!showIndividualForm && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Formato del archivo (CSV o Excel)</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="font-mono text-sm">email,name,password,role,sectorId</p>
            <p className="font-mono text-sm mt-2">juan@empresa.com,Juan Pérez,password123,EMPLOYEE,abc123</p>
            <p className="font-mono text-sm mt-2">ana@empresa.com,Ana Gómez,password123,MANAGER,def456</p>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Los roles válidos son: EMPLOYEE, MANAGER. El sectorId debe ser un ID válido de un sector existente. 
            El archivo puede ser CSV o Excel (XLSX/XLS).
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkUserUpload;