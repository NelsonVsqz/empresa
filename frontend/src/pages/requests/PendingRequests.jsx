import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const PendingRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let allRequests;
      if (statusFilter === 'PENDING') {
        allRequests = await requestService.getPendingRequestsForSector(user.managedSectorId);
      } else {
        allRequests = await requestService.getAllPermissionRequests({ sectorId: user.managedSectorId });
        if (statusFilter !== 'ALL') {
          allRequests = allRequests.filter(req => req.status === statusFilter);
        }
      }
      setRequests(allRequests);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.managedSectorId) {
      fetchRequests();
    }
  }, [user, statusFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleApprove = async (requestId) => {
    const result = await Swal.fire({
      title: '¿Aprobar solicitud?',
      text: '¿Está seguro de que desea aprobar esta solicitud?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        confirmButton: 'bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded',
        cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded'
      }
    });

    if (result.isConfirmed) {
      try {
        // Actualizar el estado de la solicitud localmente antes de hacer la llamada
        setRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === requestId 
              ? { ...request, status: 'APPROVED' } 
              : request
          )
        );

        const response = await requestService.approvePermissionRequest(requestId);
        if (response.permissionRequest) {
          // Cambiar temporalmente el filtro a 'ALL' para que se muestre la solicitud actualizada
          setStatusFilter('ALL');
          toast.success('Solicitud aprobada exitosamente');
        }
      } catch (error) {
        console.error('Error al aprobar solicitud:', error);
        // Si hubo un error, revertir el estado local
        setRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === requestId 
              ? { ...request, status: 'PENDING' } 
              : request
          )
        );
        toast.error('Error al aprobar la solicitud: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleReject = async (requestId) => {
    const result = await Swal.fire({
      title: '¿Rechazar solicitud?',
      text: 'Por favor, ingrese la razón del rechazo:',
      input: 'textarea',
      inputPlaceholder: 'Ingrese la razón detallada del rechazo...',
      inputAttributes: {
        'aria-label': 'Razón del rechazo'
      },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      inputValidator: (value) => {
        if (!value) {
          return 'Debe ingresar una razón para el rechazo';
        }
      },
      customClass: {
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded',
        cancelButton: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded'
      }
    });

    if (result.isConfirmed) {
      try {
        // Actualizar el estado de la solicitud localmente antes de hacer la llamada
        setRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === requestId 
              ? { ...request, status: 'REJECTED' } 
              : request
          )
        );

        const response = await requestService.rejectPermissionRequest(requestId, { 
          rejectionReason: result.value 
        });
        if (response.permissionRequest) {
          // Cambiar temporalmente el filtro a 'ALL' para que se muestre la solicitud actualizada
          setStatusFilter('ALL');
          toast.success('Solicitud rechazada exitosamente');
        }
      } catch (error) {
        console.error('Error al rechazar solicitud:', error);
        // Si hubo un error, revertir el estado local
        setRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === requestId 
              ? { ...request, status: 'PENDING' } 
              : request
          )
        );
        toast.error('Error al rechazar la solicitud: ' + (error.response?.data?.error || error.message));
      }
    }
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
        <h1 className="text-3xl font-bold text-neutral-800">Solicitudes Pendientes</h1>
        <div className="flex items-center space-x-4">
          <label htmlFor="statusFilter" className="text-sm font-medium text-neutral-800">Filtrar por:</label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default"
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
          </select>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-soft text-center">
          <h3 className="text-xl font-medium text-neutral-800">No hay solicitudes pendientes.</h3>
          <p className="mt-2 text-neutral-500">Actualmente no hay solicitudes que requieran tu atención.</p>
        </div>
      ) : (
        <div className="bg-white shadow-soft rounded-2xl overflow-hidden">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Empleado</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Tipo de Permiso</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Fechas</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-neutral-800">{request.user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{request.type.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusPill(request.status)}>{request.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button 
                      className="text-primary-default hover:text-primary-dark"
                      onClick={() => navigate(`/request-detail/${request.id}`)}
                    >
                      Ver
                    </button>
                    {request.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleApprove(request.id)} className="text-success hover:text-green-700">Aprobar</button>
                        <button onClick={() => handleReject(request.id)} className="text-error hover:text-red-700">Rechazar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
