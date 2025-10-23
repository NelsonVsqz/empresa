import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { apiClient } from '../../services/apiClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Componente para ver todas las solicitudes en el dashboard de HR con filtros
const AllHRRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [originalRequests, setOriginalRequests] = useState([]); // Datos originales sin filtrar
  const [filteredRequests, setFilteredRequests] = useState([]); // Datos filtrados
  const [allSectors, setAllSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Funciones auxiliares para formatear fechas y estados
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

  // Cargar datos iniciales
  useEffect(() => {
    const loadRequestsData = async () => {
      try {
        setLoading(true);
        
        // Cargar solicitudes
        const allRequestsData = await requestService.getAllPermissionRequests();
        
        // Cargar sectores
        const sectorsResponse = await apiClient.get('/sectors');
        const sectors = sectorsResponse.data.sectors || [];
        setAllSectors(sectors);
        
        // Guardar todas las solicitudes sin filtrar
        setOriginalRequests(allRequestsData);
        setFilteredRequests(allRequestsData);
      } catch (error) {
        console.error('Error al cargar datos de solicitudes:', error);
        toast.error('Error al cargar los datos de solicitudes');
      } finally {
        setLoading(false);
      }
    };

    loadRequestsData();
  }, []);

  // Aplicar filtros cuando cambian
  useEffect(() => {
    if (originalRequests.length === 0) {
      return; // Aún no se han cargado los datos
    }

    // Filtrar solicitudes según los filtros seleccionados
    let filtered = [...originalRequests];
    
    // Aplicar filtro de estado
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    
    // Aplicar filtro de sector
    if (sectorFilter !== 'ALL') {
      filtered = filtered.filter(req => req.sectorId === sectorFilter);
    }
    
    // Aplicar filtro de fecha
    if (dateFilter !== 'ALL') {
      const currentDate = new Date();
      filtered = filtered.filter(req => {
        const requestDate = new Date(req.createdAt);
        switch (dateFilter) {
          case 'TODAY':
            return requestDate.toDateString() === currentDate.toDateString();
          case 'WEEK':
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return requestDate >= oneWeekAgo;
          case 'MONTH':
            return requestDate.getMonth() === currentDate.getMonth() && 
                   requestDate.getFullYear() === currentDate.getFullYear();
          case 'YEAR':
            return requestDate.getFullYear() === currentDate.getFullYear();
          default:
            return true;
        }
      });
    }
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(req => 
        req.user.name.toLowerCase().includes(term) ||
        req.user.email.toLowerCase().includes(term) ||
        req.type.name.toLowerCase().includes(term) ||
        req.sector.name.toLowerCase().includes(term) ||
        req.status.toLowerCase().includes(term)
      );
    }
    
    // Actualizar solicitudes filtradas
    setFilteredRequests(filtered);
  }, [statusFilter, sectorFilter, dateFilter, originalRequests, searchTerm]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando solicitudes...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Todas las Solicitudes
              </h2>
              <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Bienvenido, {user?.name}
                </div>
              </div>
            </div>
          </div>
          
          {/* Filtros */}
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-7">
            <div className="sm:col-span-2">
              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">
                Buscar
              </label>
              <input
                type="text"
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por empleado, sector, tipo..."
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              />
            </div>
            
            <div className="sm:col-span-1">
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendientes</option>
                <option value="APPROVED">Aprobadas</option>
                <option value="REJECTED">Rechazadas</option>
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="sectorFilter" className="block text-sm font-medium text-gray-700">
                Sector
              </label>
              <select
                id="sectorFilter"
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="ALL">Todos</option>
                {allSectors.map(sector => (
                  <option key={sector.id} value={sector.id}>{sector.name}</option>
                ))}
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-700">
                Periodo
              </label>
              <select
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="ALL">Todos</option>
                <option value="TODAY">Hoy</option>
                <option value="WEEK">Esta semana</option>
                <option value="MONTH">Este mes</option>
                <option value="YEAR">Este año</option>
              </select>
            </div>
          </div>

          {/* Contador de solicitudes */}
          <div className="mt-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Solicitudes ({filteredRequests.length})
            </h3>
            <button
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => navigate(-1)}
            >
              Volver
            </button>
          </div>

          {/* Tabla de solicitudes */}
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Empleado
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sector
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo de Permiso
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fechas
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRequests.length > 0 ? (
                          filteredRequests
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map((request) => (
                              <tr key={request.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{request.user.name}</div>
                                      <div className="text-sm text-gray-500">{request.user.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{request.sector.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{request.type.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{formatDate(request.startDate)} - {formatDate(request.endDate)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                    {getStatusName(request.status)}
                                  </span>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                              No hay solicitudes para mostrar
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllHRRequests;