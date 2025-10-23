import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const PermissionTypesManagement = () => {
  const [permissionTypes, setPermissionTypes] = useState([]);
  const [newType, setNewType] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingType, setEditingType] = useState(null); // Tipo actualmente en edición
  const [isEditing, setIsEditing] = useState(false); // Bandera para modo edición

  // Cargar tipos de permiso existentes
  useEffect(() => {
    const fetchPermissionTypes = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/permission-types');
        setPermissionTypes(response.data.permissionTypes || []);
      } catch (err) {
        setError('Error al cargar los tipos de permiso');
        console.error(err);
        toast.error('Error al cargar los tipos de permiso');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissionTypes();
  }, []);

  // Manejar creación de nuevo tipo de permiso
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/permission-types', newType);
      setPermissionTypes([...permissionTypes, response.data.permissionType]);
      setNewType({ name: '', description: '' });
      toast.success('Tipo de permiso creado exitosamente');
    } catch (err) {
      const errorMessage = 'Error al crear el tipo de permiso: ' + (err.response?.data?.error || err.message);
      setError(errorMessage);
      console.error(err);
      toast.error(errorMessage);
    }
  };

  // Manejar actualización de tipo de permiso
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      if (!editingType || !editingType.id) return;
      
      const response = await apiClient.put(`/permission-types/${editingType.id}`, newType);
      setPermissionTypes(permissionTypes.map(type => 
        type.id === editingType.id ? response.data.permissionType : type
      ));
      
      // Limpiar campos de edición
      setEditingType(null);
      setIsEditing(false);
      setNewType({ name: '', description: '' });
      toast.success('Tipo de permiso actualizado exitosamente');
    } catch (err) {
      const errorMessage = 'Error al actualizar el tipo de permiso: ' + (err.response?.data?.error || err.message);
      setError(errorMessage);
      console.error(err);
      toast.error(errorMessage);
    }
  };

  // Preparar tipo para edición
  const prepareEdit = (type) => {
    setNewType({ name: type.name, description: type.description });
    setEditingType(type);
    setIsEditing(true);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingType(null);
    setIsEditing(false);
    setNewType({ name: '', description: '' });
  };

  // Manejar eliminación de tipo de permiso
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar tipo de permiso?',
      text: '¿Está seguro de que desea eliminar este tipo de permiso? Esta acción no se puede deshacer.',
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
        await apiClient.delete(`/permission-types/${id}`);
        setPermissionTypes(permissionTypes.filter(type => type.id !== id));
        toast.success('Tipo de permiso eliminado exitosamente');
      } catch (err) {
        const errorMessage = 'Error al eliminar el tipo de permiso: ' + (err.response?.data?.error || err.message);
        setError(errorMessage);
        console.error(err);
        toast.error(errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Tipos de Permiso</h2>
        
        {/* Formulario para crear/editar tipo de permiso */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            {isEditing ? 'Editar Tipo de Permiso' : 'Crear Nuevo Tipo de Permiso'}
          </h3>
          <form onSubmit={isEditing ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Tipo
                </label>
                <input
                  type="text"
                  id="name"
                  value={newType.name}
                  onChange={(e) => setNewType({...newType, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ej. Permiso Médico"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  id="description"
                  value={newType.description}
                  onChange={(e) => setNewType({...newType, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Breve descripción del tipo de permiso"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isEditing ? 'Actualizar Tipo de Permiso' : 'Crear Tipo de Permiso'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Botón para carga masiva */}
        <div className="mb-8">
          <a 
            href="/bulk-permission-type-upload" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Carga Masiva de Tipos de Permiso
          </a>
        </div>

        {/* Lista de tipos de permiso */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissionTypes.length > 0 ? (
                permissionTypes.map((type) => (
                  <tr key={type.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{type.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{type.description || 'Sin descripción'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => prepareEdit(type)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                    No se encontraron tipos de permiso
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PermissionTypesManagement;