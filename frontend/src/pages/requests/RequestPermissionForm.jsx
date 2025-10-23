import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { apiClient } from '../../services/apiClient';
import { toast } from 'react-toastify';

const RequestPermissionForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    typeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [permissionTypes, setPermissionTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Función para subir archivos a Cloudflare R2 usando URLs presignadas
  const uploadFilesToR2 = async (files) => {
    const uploadPromises = files.map(async (file) => {
      try {
        // 1. Obtener URL presignada del backend (quitamos '/api' de VITE_API_BASE_URL para obtener la URL base)
        const baseApiUrl = import.meta.env.VITE_API_BASE_URL;
        const baseUrl = baseApiUrl.replace('/api', '');
        const response = await fetch(
          `${baseUrl}/api/uploads/presigned-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`
        );
        
        if (!response.ok) {
          throw new Error('Error al obtener la URL presignada');
        }
        
        const { uploadUrl } = await response.json();

        // 2. Subir archivo directamente a Cloudflare R2 usando la URL presignada
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type
          }
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir archivo a Cloudflare R2');
        }

        // 3. Devolver la URL pública del archivo
        const publicUrl = uploadUrl.split('?')[0];
        return publicUrl;
      } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
      }
    });

    try {
      const urls = await Promise.all(uploadPromises);
      return urls;
    } catch (error) {
      console.error('Error al subir archivos:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchPermissionTypes = async () => {
      try {
        const types = await requestService.getPermissionTypes();
        setPermissionTypes(types);
      } catch (error) {
        console.error('Error al cargar tipos de permiso:', error);
        toast.error('Error al cargar los tipos de permiso');
        const fallbackTypes = [
          { id: '1', name: 'Permiso Médico', description: 'Permiso por razones médicas' },
          { id: '2', name: 'Permiso Personal', description: 'Permiso por asuntos personales' },
          { id: '3', name: 'Licencia por Maternidad/Paternidad', description: 'Permiso por nacimiento de hijo/a' },
          { id: '4', name: 'Otro', description: 'Otro tipo de permiso' }
        ];
        setPermissionTypes(fallbackTypes);
      }
    };

    fetchPermissionTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let attachmentUrls = [];
      
      // Subir archivos si hay adjuntos
      if (attachments.length > 0) {
        attachmentUrls = await uploadFilesToR2(attachments);
      }

      // Enviar la solicitud con las URLs de los archivos adjuntos
      const requestData = {
        ...formData,
        attachmentUrls: attachmentUrls
      };

      await apiClient.post('/permission-requests', requestData, {
        headers: { 
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Solicitud de permiso creada exitosamente');
      setFormData({ typeId: '', startDate: '', endDate: '', reason: '' });
      setAttachments([]);
      navigate('/my-requests');
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      if (error.message.includes('presignada') || error.message.includes('R2')) {
        toast.error('Error al subir adjuntos. Inténtalo de nuevo.');
      } else {
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        toast.error(`Error al crear la solicitud: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-soft">
      <h1 className="text-3xl font-bold text-neutral-800 mb-2">Solicitar Nuevo Permiso</h1>
      <p className="text-neutral-500 mb-8">Completa el formulario para enviar tu solicitud.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tipo de Permiso */}
          <div>
            <label htmlFor="typeId" className="block text-sm font-medium text-neutral-700 mb-1">
              Tipo de Permiso
            </label>
            <select
              id="typeId"
              name="typeId"
              value={formData.typeId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-default focus:border-transparent"
            >
              <option value="">Selecciona un tipo</option>
              {permissionTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          {/* Fecha de Inicio */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-neutral-700 mb-1">
              Fecha de Inicio
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-default focus:border-transparent"
            />
          </div>
          
          {/* Fecha de Fin */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-neutral-700 mb-1">
              Fecha de Fin
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-default focus:border-transparent"
            />
          </div>
        </div>

        {/* Razón */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-neutral-700 mb-1">
            Motivo de la Solicitud
          </label>
          <textarea
            id="reason"
            name="reason"
            rows="4"
            value={formData.reason}
            onChange={handleChange}
            required
            placeholder="Describe brevemente el motivo de tu solicitud..."
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-default focus:border-transparent"
          />
        </div>

        {/* Adjuntos */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Archivos Adjuntos
          </label>
          <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-lg">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-neutral-600">
                <label
                  htmlFor="attachments"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary-default hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-default"
                >
                  <span>Sube tus archivos</span>
                  <input id="attachments" name="attachments" type="file" multiple onChange={handleFileChange} className="sr-only" />
                </label>
                <p className="pl-1">o arrástralos aquí</p>
              </div>
              <p className="text-xs text-neutral-500">PNG, JPG, PDF hasta 10MB</p>
            </div>
          </div>
          {attachments.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-neutral-700">Archivos seleccionados:</p>
              <ul className="mt-2 list-disc list-inside text-sm text-neutral-600">
                {attachments.map((file, index) => <li key={index}>{file.name}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="pt-5">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-neutral-300 text-sm font-medium rounded-lg text-neutral-700 bg-white hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-default"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-default hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-default disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RequestPermissionForm;
