import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { useNavigate } from 'react-router-dom';

const MyRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const userRequests = await requestService.getMyPermissionRequests();
        setRequests(userRequests);
      } catch (error) {
        console.error('Error al cargar solicitudes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusPill = (status) => {
    const baseClasses = 'px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full';
    switch (status) {
      case 'APPROVED':
        return `${baseClasses} bg-success text-white`;
      case 'REJECTED':
        return `${baseClasses} bg-error text-white`;
      case 'PENDING':
        return `${baseClasses} bg-warning text-white`;
      default:
        return `${baseClasses} bg-neutral-300 text-neutral-800`;
    }
  };

  if (loading) {
    return <div className="text-center py-10">Cargando solicitudes...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-800">Mis Solicitudes</h1>
        <button 
          className="px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary-default hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-default transform transition duration-300 hover:scale-105"
          onClick={() => navigate('/request-permission')}
        >
          Nueva Solicitud
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-soft text-center">
          <h3 className="text-xl font-medium text-neutral-800">No has realizado ninguna solicitud.</h3>
          <p className="mt-2 text-neutral-500">Cuando crees una nueva solicitud de permiso, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-soft">
          <ul className="divide-y divide-neutral-200">
            {requests.map((request) => (
              <li key={request.id} className="py-6 flex justify-between items-center">
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-800">{request.type.name}</h3>
                    <span className={getStatusPill(request.status)}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    Solicitado el {formatDate(request.createdAt)}
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-neutral-600">Desde:</p>
                      <p className="text-neutral-800">{formatDate(request.startDate)}</p>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-600">Hasta:</p>
                      <p className="text-neutral-800">{formatDate(request.endDate)}</p>
                    </div>
                    <div className="md:col-span-3">
                      <p className="font-medium text-neutral-600">Motivo:</p>
                      <p className="text-neutral-800">{request.reason}</p>
                    </div>
                    {request.rejectionReason && (
                      <div className="md:col-span-3">
                        <p className="font-medium text-error">Razón de Rechazo:</p>
                        <p className="text-error">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-6 flex-shrink-0">
                  <button 
                    className="text-sm font-medium text-primary-default hover:text-primary-dark"
                    onClick={() => navigate(`/request-detail/${request.id}`)}
                  >
                    Ver Detalles
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
