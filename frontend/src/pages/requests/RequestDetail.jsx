import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { toast } from 'react-toastify';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/permission-requests/${id}`);
        setRequest(response.data.permissionRequest);
        setError(null);
      } catch (err) {
        setError('Error al cargar los detalles de la solicitud: ' + (err.response?.data?.error || err.message));
        console.error('Error al cargar solicitud:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      case 'PENDING':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const handleDownloadAttachment = async (e, attachmentId) => {
    e.preventDefault();
    try {
      const response = await apiClient.get(`/attachments/${attachmentId}/signed-url`);
      const { signedUrl } = response.data;
      
      // Abrir el archivo en una nueva pestaña
      window.open(signedUrl, '_blank');
    } catch (err) {
      console.error('Error al obtener URL firmada para adjunto:', err);
      toast.error('Error al descargar el archivo adjunto: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando detalles de la solicitud...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-red-500 text-center">
            <p className="font-medium">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Volver atrás
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se encontraron detalles para esta solicitud.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Volver atrás
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Detalles de la Solicitud</h2>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                {getStatusName(request.status)}
              </span>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Información completa de la solicitud de permiso
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Empleado</label>
                    <p className="mt-1 text-sm text-gray-900">{request.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{request.user?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Detalles del Permiso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Permiso</label>
                    <p className="mt-1 text-sm text-gray-900">{request.type?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sector</label>
                    <p className="mt-1 text-sm text-gray-900">{request.sector?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fechas</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Razón</label>
                    <p className="mt-1 text-sm text-gray-900">{request.reason}</p>
                  </div>
                </div>
              </div>

              {/* Sección de adjuntos si existen */}
              {request.attachments && request.attachments.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Archivos Adjuntos</h3>
                  <div className="space-y-2">
                    {request.attachments.map((attachment, index) => (
                      <div key={attachment.id} className="flex items-center p-3 bg-white rounded-md shadow-sm">
                        <svg className="h-5 w-5 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        <a 
                          href="#"
                          onClick={(e) => handleDownloadAttachment(e, attachment.id)}
                          className="text-indigo-600 hover:text-indigo-900 truncate max-w-xs"
                        >
                          Adjunto {index + 1}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Estado y Progreso</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado Actual</label>
                    <p className={`mt-1 text-sm font-medium ${getStatusColor(request.status).split(' ')[0]}`}>
                      {getStatusName(request.status)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Solicitud</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(request.createdAt)}</p>
                  </div>
                  {request.status === 'REJECTED' && request.rejectionReason && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Razón del Rechazo</label>
                      <p className="mt-1 text-sm text-gray-900">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;