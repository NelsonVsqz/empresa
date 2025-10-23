import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const BulkSectorUpload = () => {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [showIndividualForm, setShowIndividualForm] = useState(true);
  const [allManagers, setAllManagers] = useState([]); // Lista de usuarios con rol MANAGER
  const [allSectors, setAllSectors] = useState([]); // Lista de todos los sectores con información de managers
  const [allUsers, setAllUsers] = useState([]); // Lista de todos los usuarios para encontrar jefes
  const [editingSector, setEditingSector] = useState(null); // Sector actualmente en edición
  const [isEditing, setIsEditing] = useState(false); // Bandera para modo edición

  // Estados para el formulario individual de sector
  const [individualSector, setIndividualSector] = useState({
    name: '',
    description: '',
    managerId: '' // ID del usuario que será el jefe de este sector
  });

  // Cargar usuarios con rol MANAGER, todos los usuarios y todos los sectores al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // Llamada real a la API para obtener usuarios con rol MANAGER
        const managersResponse = await apiClient.get('/users?role=MANAGER');
        setAllManagers(managersResponse.data.users || []);
        
        // Cargar todos los usuarios para mostrar información de managers
        const usersResponse = await apiClient.get('/users');
        setAllUsers(usersResponse.data.users || []);
        
        // Cargar todos los sectores
        const sectorsResponse = await apiClient.get('/sectors');
        setAllSectors(sectorsResponse.data.sectors || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setAllManagers([]);
        setAllUsers([]);
        setAllSectors([]);
        toast.error("Error al cargar los datos");
      }
    };

    loadData();
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

    setUploadStatus('Subiendo archivo de sectores...');
    
    try {
      const response = await apiClient.post('/sectors/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadResult({
        success: true,
        sectorsCreated: response.data.successCount || 0,
        sectorsFailed: response.data.errorCount || 0,
        errors: response.data.errors || []
      });
      setUploadStatus('Archivo de sectores subido exitosamente.');
    } catch (error) {
      setUploadStatus('Error al subir el archivo de sectores.');
      setUploadResult({
        success: false,
        sectorsCreated: 0,
        sectorsFailed: error.response?.data?.errorCount || 5,
        errors: [error.response?.data?.error || error.message]
      });
    }
  };

  // Manejar el envío del formulario individual de sector
  const handleIndividualSubmit = async (e) => {
    e.preventDefault();
    
    setUploadStatus('Procesando sector...');
    
    try {
      let response;
      if (isEditing) {
        // Actualizar sector existente
        response = await apiClient.put(`/sectors/${editingSector.id}`, individualSector);
        setUploadStatus('Sector actualizado exitosamente.');
      } else {
        // Crear nuevo sector
        response = await apiClient.post('/sectors', individualSector);
        setUploadStatus('Sector creado exitosamente.');
      }
      
      // Actualizar la lista de sectores
      if (isEditing) {
        setAllSectors(prevSectors => 
          prevSectors.map(s => s.id === editingSector.id ? response.data.sector : s)
        );
      } else {
        setAllSectors(prevSectors => [...prevSectors, response.data.sector]);
      }
      
      setUploadResult({
        success: true,
        sectorsCreated: 1,
        sectorsFailed: 0,
        errors: []
      });
      
      // Limpiar formulario
      setIndividualSector({
        name: '',
        description: '',
        managerId: ''
      });
      setIsEditing(false);
      setEditingSector(null);
    } catch (error) {
      setUploadStatus('Error al procesar sector: ' + (error.response?.data?.error || error.message));
      setUploadResult({
        success: false,
        sectorsCreated: 0,
        sectorsFailed: 1,
        errors: [error.response?.data?.error || error.message]
      });
    }
  };

  const handleIndividualChange = (e) => {
    const { name, value } = e.target;
    setIndividualSector(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para editar un sector
  const handleEditSector = (sector) => {
    // Encontrar al usuario manager para este sector
    const manager = allUsers.find(user => 
      user.id === sector.managedByUserId || 
      user.id === sector.managerId || 
      user.managedSectorId === sector.id
    );
    
    setIndividualSector({
      name: sector.name,
      description: sector.description || '',
      managerId: manager ? manager.id : ''
    });
    setEditingSector(sector);
    setIsEditing(true);
  };

  // Función para eliminar un sector
  const handleDeleteSector = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar sector?',
      text: '¿Está seguro de que desea eliminar este sector? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded',
        cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded'
      }
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/sectors/${id}`);
        setAllSectors(prevSectors => prevSectors.filter(s => s.id !== id));
        setUploadStatus('Sector eliminado exitosamente.');
        toast.success('Sector eliminado exitosamente.');
      } catch (error) {
        setUploadStatus('Error al eliminar sector: ' + (error.response?.data?.error || error.message));
        toast.error('Error al eliminar sector: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  // Estado para mostrar confirmación de copiado
  const [copiedId, setCopiedId] = useState(null);

  // Función para copiar el ID al portapapeles
  const copyToClipboard = async (id, e) => {
    e.stopPropagation(); // Evitar que se dispare cualquier evento de la fila
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Reiniciar el estado después de 2 segundos
    } catch (err) {
      console.error("Error al copiar el ID: ", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Carga de Sectores</h2>
      
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
              Archivo de sectores (CSV o Excel)
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
            <div className="sm:col-span-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre del Sector
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={individualSector.name}
                onChange={handleIndividualChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Nombre del sector"
              />
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                name="description"
                id="description"
                value={individualSector.description}
                onChange={handleIndividualChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Descripción del sector (opcional)"
              />
            </div>
            
            <div className="sm:col-span-6">
              <label htmlFor="managerId" className="block text-sm font-medium text-gray-700">
                Jefe de Sector
              </label>
              <select
                id="managerId"
                name="managerId"
                value={individualSector.managerId}
                onChange={handleIndividualChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Sin jefe de sector asignado</option>
                {allManagers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Opcional - Seleccione un usuario que será el jefe de este sector
              </p>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isEditing ? 'Actualizar Sector' : 'Crear Sector'}
            </button>
          </div>
        </form>
      )}
      
      {/* Mostrar lista de sectores actuales cuando se muestra el formulario individual */}
      {showIndividualForm && (
        <div className="mt-10">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sectores Actuales</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jefe de Sector
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allSectors.length > 0 ? (
                  allSectors.map((sector) => {
                    // Encontrar al usuario manager para este sector
                    // Verificar diferentes posibles propiedades que podrían contener al manager
                    const manager = allUsers.find(user => 
                      user.id === sector.managedByUserId || 
                      user.id === sector.managerId || 
                      user.managedSectorId === sector.id
                    );
                    return (
                      <tr key={sector.id} className="hover:bg-gray-50">
                        <td 
                          className="px-3 py-0.5 text-center text-sm text-gray-500 max-w-[6rem] min-w-[4rem] h-6 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                          onClick={(e) => copyToClipboard(sector.id, e)}
                          title="Haga clic para copiar el ID"
                        >
                          <div className="truncate max-w-full flex items-center">
                            <span className="truncate max-w-full">{sector.id}</span>
                            {copiedId === sector.id && (
                              <span className="ml-1 text-xs text-green-600">✓</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900 max-w-xs">
                          {sector.name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 max-w-xs">
                          {sector.description || '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 max-w-xs">
                          {manager ? `${manager.id} - ${manager.name}` : 'Sin asignar'}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-center text-sm font-medium">
                          <button
                            onClick={() => handleEditSector(sector)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteSector(sector.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay sectores registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {uploadStatus && (
        <div className="mt-4 p-4 rounded-md bg-blue-50">
          <p className="text-sm text-blue-700">{uploadStatus}</p>
        </div>
      )}
      
      {uploadResult && (
        <div className={`mt-4 p-4 rounded-md ${uploadResult.success ? 'bg-green-50' : 'bg-red-500'}`}>
          <h3 className="text-sm font-medium">
            {uploadResult.success ? 'Operación exitosa' : 'Errores en la operación'}
          </h3>
          <div className="mt-2 text-sm text-gray-700">
            <p>Sectores creados: {uploadResult.sectorsCreated}</p>
            <p>Sectores fallidos: {uploadResult.sectorsFailed}</p>
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Formato del archivo CSV</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="font-mono text-sm">name,description,managerId</p>
            <p className="font-mono text-sm mt-2">Ventas,Departamento de Ventas,abc123</p>
            <p className="font-mono text-sm mt-2">Marketing,Departamento de Marketing,def456</p>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            El managerId debe ser un ID válido de un usuario existente con rol MANAGER.
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkSectorUpload;