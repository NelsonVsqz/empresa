import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { userService } from '../../services/userService';
import { apiClient } from '../../services/apiClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// Componente para el Dashboard de Recursos Humanos
const HRDashboard = () => {
  const { user } = useAuth();
  const [originalRequests, setOriginalRequests] = useState([]); // Datos originales sin filtrar
  const [filteredRequests, setFilteredRequests] = useState([]); // Datos filtrados
  const [allSectors, setAllSectors] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    totalUsers: 0,
    totalSectors: 0
  });
  const [loading, setLoading] = useState(true);
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');

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
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Cargar solicitudes
        const allRequestsData = await requestService.getAllPermissionRequests();
        
        // Cargar sectores
        const sectorsResponse = await apiClient.get('/sectors');
        const sectors = sectorsResponse.data.sectors || [];
        setAllSectors(sectors);
        
        // Cargar usuarios
        const usersData = await userService.getAllUsers();
        
        // Guardar todas las solicitudes sin filtrar
        setOriginalRequests(allRequestsData);
        setFilteredRequests(allRequestsData);
        
        // Calcular estadísticas iniciales con todos los datos
        const totalRequests = allRequestsData.length;
        const approvedRequests = allRequestsData.filter(r => r.status === 'APPROVED').length;
        const pendingRequests = allRequestsData.filter(r => r.status === 'PENDING').length;
        const rejectedRequests = allRequestsData.filter(r => r.status === 'REJECTED').length;
        
        setStats({
          totalRequests,
          approvedRequests,
          pendingRequests,
          rejectedRequests,
          totalUsers: usersData.length,
          totalSectors: sectors.length
        });
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        toast.error('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
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
    
    // Actualizar solicitudes filtradas
    setFilteredRequests(filtered);
    
    // Calcular estadísticas con los datos filtrados
    const totalRequests = filtered.length;
    const approvedRequests = filtered.filter(r => r.status === 'APPROVED').length;
    const pendingRequests = filtered.filter(r => r.status === 'PENDING').length;
    const rejectedRequests = filtered.filter(r => r.status === 'REJECTED').length;
    
    setStats(prevStats => ({
      ...prevStats,
      totalRequests,
      approvedRequests,
      pendingRequests,
      rejectedRequests
    }));
  }, [statusFilter, sectorFilter, dateFilter, originalRequests]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Dashboard - Recursos Humanos
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
          <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
                Filtrar por estado
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
                Filtrar por sector
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
                Filtrar por periodo
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

          {/* Estadísticas */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 icon-container">
                    <svg className="h-6 w-6 text-white icon-md" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Solicitudes Totales</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.totalRequests}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3 icon-container">
                    <svg className="h-6 w-6 text-white icon-md" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Aprobadas</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.approvedRequests}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3 icon-container">
                    <svg className="h-6 w-6 text-white icon-md" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pendientes</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.pendingRequests}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-red-500 rounded-md p-3 icon-container">
                    <svg className="h-6 w-6 text-white icon-md" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Rechazadas</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.rejectedRequests}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3 icon-container">
                    <svg className="h-6 w-6 text-white icon-md" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Usuarios</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3 icon-container">
                    <svg className="h-6 w-6 text-white icon-md" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Sectores</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{stats.totalSectors}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos y contenido adicional */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Distribución de Solicitudes por Sector</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-md font-medium text-gray-700 mb-2">Solicitudes por Tipo</h4>
                <div className="space-y-2">
                  {filteredRequests.length > 0 ? (
                    // Agrupar solicitudes por tipo para mostrar en el gráfico
                    Object.entries(
                      filteredRequests.reduce((acc, request) => {
                        const typeName = request.type.name;
                        acc[typeName] = (acc[typeName] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([typeName, count], index) => {
                      const percentage = filteredRequests.length > 0 ? Math.round((count / filteredRequests.length) * 100) : 0;
                      
                      // Definir colores dinámicos para cada tipo
                      const colors = [
                        'bg-indigo-600', 'bg-green-600', 'bg-yellow-600', 
                        'bg-red-600', 'bg-blue-600', 'bg-purple-600'
                      ];
                      
                      return (
                        <div key={typeName}>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{typeName}</span>
                            <span>{count} ({percentage}%)</span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`${colors[index % colors.length]} h-2 rounded-full`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No hay solicitudes para mostrar
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-md font-medium text-gray-700 mb-2">Solicitudes por Estado</h4>
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{stats.totalRequests}</div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Aprobadas - Verde */}
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#10B981" strokeWidth="10" strokeDasharray={`${(stats.approvedRequests/stats.totalRequests)*283 || 0} 287.53`} strokeDashoffset="0"></circle>
                      {/* Pendientes - Amarillo */}
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#F59E0B" strokeWidth="10" strokeDasharray={`${(stats.pendingRequests/stats.totalRequests)*283 || 0} 287.53`} strokeDashoffset={-((stats.approvedRequests/stats.totalRequests)*283 || 0)}></circle>
                      {/* Rechazadas - Rojo */}
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#EF4444" strokeWidth="10" strokeDasharray={`${(stats.rejectedRequests/stats.totalRequests)*283 || 0} 287.53`} strokeDashoffset={-(((stats.approvedRequests+stats.pendingRequests)/stats.totalRequests)*283 || 0)}></circle>
                    </svg>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mb-1"></div>
                    <span className="text-xs text-gray-600">Aprobadas</span>
                    <span className="text-sm font-medium">{stats.approvedRequests}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full mb-1"></div>
                    <span className="text-xs text-gray-600">Pendientes</span>
                    <span className="text-sm font-medium">{stats.pendingRequests}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mb-1"></div>
                    <span className="text-xs text-gray-600">Rechazadas</span>
                    <span className="text-sm font-medium">{stats.rejectedRequests}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de solicitudes recientes - Mover abajo de los gráficos */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Solicitudes Recientes</h3>
              <button
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => navigate('/hr-all-requests')}
              >
                Ver Todas
              </button>
            </div>
            
            {/* Lista de solicitudes recientes */}
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
                          // Tomar las 5 solicitudes más recientes para mostrar en la tabla
                          filteredRequests
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 5)
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

export default HRDashboard;