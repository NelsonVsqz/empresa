import React, { useState } from 'react';
import { createPermissionRequest } from '../services/permissionRequestService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PermissionRequestForm = () => {
  const [formData, setFormData] = useState({
    typeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    attachments: []
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    try {
      let attachmentUrls = [];
      
      if (selectedFiles.length > 0) {
        attachmentUrls = await uploadFilesToR2(selectedFiles);
      }

      const requestData = {
        ...formData,
        attachmentUrls: attachmentUrls
      };

      await createPermissionRequest(requestData);
      
      setMessage('Solicitud de permiso creada exitosamente');
      setFormData({
        typeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        attachments: []
      });
      setSelectedFiles([]);
      
      // Redirigir después de un breve tiempo
      setTimeout(() => {
        navigate('/my-requests');
      }, 2000);
    } catch (error) {
      console.error('Error al crear la solicitud:', error);
      setMessage('Error al crear la solicitud. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Solicitar Permiso</h2>
      
      {message && (
        <div className={`p-4 rounded mb-6 ${message.includes('exitosamente') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Permiso</label>
          <select
            name="typeId"
            value={formData.typeId}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleccionar tipo</option>
            <option value="1">Personal</option>
            <option value="2">Médico</option>
            <option value="3">Familiar</option>
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              required
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Razón</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            required
            rows="3"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntos (Opcional)</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">Puedes subir múltiples archivos (PDF, JPG, PNG)</p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className={`px-4 py-2 rounded-md text-white ${
              uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {uploading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PermissionRequestForm;