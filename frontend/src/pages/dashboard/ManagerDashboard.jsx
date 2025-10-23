import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { requestService } from "../../services/requestService";
import { userService } from "../../services/userService";
import { apiClient } from "../../services/apiClient";
import { toast } from "react-toastify";
import Swal from 'sweetalert2';

// Componente para el Dashboard de Jefe de Sector
const ManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    totalUsersInSector: 0,
    sectorName: "Cargando...",
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos reales del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Cargar datos del sector del jefe
        if (user?.managedSectorId) {
          // Obtener información del sector del jefe
          const sectorResponse = await apiClient.get(
            `/sectors/${user.managedSectorId}`
          );
          const sectorName = sectorResponse.data.sector?.name || "Mi Sector";

          // Cargar usuarios del sector
          const usersInSector = await userService.getUsersBySector(
            user.managedSectorId
          );

          // Cargar solicitudes pendientes para calcular estadísticas (las otras se obtienen por separado)
          const pendingRequests =
            await requestService.getPendingRequestsForSector(
              user.managedSectorId
            );

          // Para cargar todas las solicitudes del sector, necesitamos hacer una llamada diferente
          // ya que la función getAllPermissionRequests requiere un rol específico
          let allRequests = [...pendingRequests];

          // Si el usuario es HR, podemos obtener todas las solicitudes
          if (user.role === "HR") {
            allRequests = await requestService.getAllPermissionRequests({
              sectorId: user.managedSectorId,
            });
          } else {
            // Si es manager, obtenemos todas las solicitudes pendientes
            // y luego obtenemos todas las aprobadas y rechazadas en una segunda petición
            const approvedRequests = await apiClient.get(
              `/permission-requests?status=APPROVED&sectorId=${user.managedSectorId}`
            );
            const rejectedRequests = await apiClient.get(
              `/permission-requests?status=REJECTED&sectorId=${user.managedSectorId}`
            );
            const approvedRequestsData = approvedRequests.data.permissionRequests || [];
            const rejectedRequestsData = rejectedRequests.data.permissionRequests || [];
            allRequests = [...pendingRequests, ...approvedRequestsData, ...rejectedRequestsData];
          }

          // Calcular estadísticas
          const totalRequests = allRequests.length;
          const approvedRequests = allRequests.filter(
            (r) => r.status === "APPROVED"
          ).length;
          const pendingRequestsCount = allRequests.filter(
            (r) => r.status === "PENDING"
          ).length;
          const rejectedRequests = allRequests.filter(
            (r) => r.status === "REJECTED"
          ).length;

          // Actualizar estado
          setStats({
            totalRequests,
            approvedRequests,
            pendingRequests: pendingRequestsCount,
            rejectedRequests,
            totalUsersInSector: usersInSector.length,
            sectorName: sectorName,
          });

          // Almacenar todas las solicitudes para cálculos posteriores
          setAllRequests(allRequests);

          // Tomar las 5 solicitudes más recientes para mostrar en la tabla (aumentamos de 3 a 5)
          const sortedRequests = [...allRequests].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setRecentRequests(sortedRequests.slice(0, 5));
        }
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        toast.error("Error al cargar los datos del dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (user?.managedSectorId) {
      loadDashboardData();
    }
  }, [user]);

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES");
  };

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Función para obtener el nombre del estado
  const getStatusName = (status) => {
    switch (status) {
      case "APPROVED":
        return "Aprobado";
      case "REJECTED":
        return "Rechazado";
      case "PENDING":
        return "Pendiente";
      default:
        return status;
    }
  };

  // Función para aprobar una solicitud
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
        await requestService.approvePermissionRequest(requestId);
        // Actualizar el estado local
        setRecentRequests(
          recentRequests.map((request) =>
            request.id === requestId
              ? { ...request, status: "APPROVED" }
              : request
          )
        );

        // Actualizar las estadísticas
        setStats((prev) => ({
          ...prev,
          approvedRequests: prev.approvedRequests + 1,
          pendingRequests: prev.pendingRequests - 1,
        }));

        toast.success("Solicitud aprobada exitosamente");
      } catch (error) {
        console.error("Error al aprobar solicitud:", error);
        toast.error(
          "Error al aprobar la solicitud: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  // Función para rechazar una solicitud
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
        await requestService.rejectPermissionRequest(requestId, {
          rejectionReason: result.value,
        });
        // Actualizar el estado local en lugar de eliminar la solicitud
        setRecentRequests(
          recentRequests.map((request) =>
            request.id === requestId
              ? { ...request, status: "REJECTED" }
              : request
          )
        );

        // Actualizar las estadísticas
        setStats((prev) => ({
          ...prev,
          rejectedRequests: prev.rejectedRequests + 1,
          pendingRequests: prev.pendingRequests - 1,
        }));

        toast.success("Solicitud rechazada exitosamente");
      } catch (error) {
        console.error("Error al rechazar solicitud:", error);
        toast.error(
          "Error al rechazar la solicitud: " +
            (error.response?.data?.error || error.message)
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="bg-white overflow-hidden shadow rounded-lg"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-md"></div>
                          <div className="ml-5 w-0 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Dashboard - Jefe de Sector
              </h2>
              <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg
                    className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Bienvenido, {user?.name}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg
                    className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v6h6v-6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sector: {stats.sectorName}
                </div>
              </div>
            </div>
            <div className="mt-5 flex lg:mt-0 lg:ml-4">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Volver atrás
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3 icon-container">
                    <svg
                      className="h-6 w-6 text-white icon-md"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Solicitudes en Mi Sector
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.totalRequests}
                        </div>
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
                    <svg
                      className="h-6 w-6 text-white icon-md"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Aprobadas
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.approvedRequests}
                        </div>
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
                    <svg
                      className="h-6 w-6 text-white icon-md"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pendientes
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.pendingRequests}
                        </div>
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
                    <svg
                      className="h-6 w-6 text-white icon-md"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Rechazadas
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.rejectedRequests}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-2">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3 icon-container">
                    <svg
                      className="h-6 w-6 text-white icon-md"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Empleados en Mi Sector
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stats.totalUsersInSector}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de distribución de solicitudes */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Distribución de Solicitudes por Tipo en Mi Sector
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="text-md font-medium text-gray-700 mb-2">
                  Solicitudes por Tipo
                </h4>
                <div className="space-y-2">
                  {allRequests.length > 0 ? (
                    // Agrupar solicitudes por tipo para mostrar en el gráfico (de todas las solicitudes)
                    Object.entries(
                      allRequests.reduce((acc, request) => {
                        const typeName = request.type.name;
                        acc[typeName] = (acc[typeName] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([typeName, count], index) => {
                      // Calcular el porcentaje basado en el total de todas las solicitudes
                      const percentage =
                        allRequests.length > 0
                          ? Math.round((count / allRequests.length) * 100)
                          : 0;

                      // Definir colores dinámicos para cada tipo
                      const colors = [
                        "bg-indigo-600",
                        "bg-green-600",
                        "bg-yellow-600",
                        "bg-red-600",
                        "bg-blue-600",
                        "bg-purple-600",
                      ];

                      return (
                        <div key={typeName}>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>{typeName}</span>
                            <span>
                              {count} ({percentage}%)
                            </span>
                          </div>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`${
                                colors[index % colors.length]
                              } h-2 rounded-full`}
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
                <h4 className="text-md font-medium text-gray-700 mb-2">
                  Solicitudes por Estado
                </h4>
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {stats.totalRequests}
                        </div>
                        <div className="text-sm text-gray-500">Total</div>
                      </div>
                    </div>
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Aprobadas - Verde */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="10"
                        strokeDasharray={`${
                          (stats.approvedRequests / stats.totalRequests) *
                            283 || 0
                        } 287.53`}
                        strokeDashoffset="0"
                      ></circle>
                      {/* Pendientes - Amarillo */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="10"
                        strokeDasharray={`${
                          (stats.pendingRequests / stats.totalRequests) * 283 ||
                          0
                        } 287.53`}
                        strokeDashoffset={
                          -(
                            (stats.approvedRequests / stats.totalRequests) *
                              283 || 0
                          )
                        }
                      ></circle>
                      {/* Rechazadas - Rojo */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="10"
                        strokeDasharray={`${
                          (stats.rejectedRequests / stats.totalRequests) *
                            283 || 0
                        } 287.53`}
                        strokeDashoffset={
                          -(
                            ((stats.approvedRequests + stats.pendingRequests) /
                              stats.totalRequests) *
                              283 || 0
                          )
                        }
                      ></circle>
                    </svg>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mb-1"></div>
                    <span className="text-xs text-gray-600">Aprobadas</span>
                    <span className="text-sm font-medium">
                      {stats.approvedRequests}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full mb-1"></div>
                    <span className="text-xs text-gray-600">Pendientes</span>
                    <span className="text-sm font-medium">
                      {stats.pendingRequests}
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mb-1"></div>
                    <span className="text-xs text-gray-600">Rechazadas</span>
                    <span className="text-sm font-medium">
                      {stats.rejectedRequests}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de solicitudes recientes - Mover abajo de los gráficos */}
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Solicitudes Recientes en Mi Sector
              </h3>
              <button
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => (window.location.href = "/pending-requests")}
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
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Empleado
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Tipo de Permiso
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Fechas
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Estado
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentRequests.length > 0 ? (
                          recentRequests.map((request) => (
                            <tr key={request.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {request.user.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {request.user.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {request.type.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(request.startDate)} -{" "}
                                  {formatDate(request.endDate)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                    request.status
                                  )}`}
                                >
                                  {getStatusName(request.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                                  onClick={() => {
                                    // Redirigir a la página de detalles de la solicitud específica
                                    window.location.href = `/permission-request/${request.id}`;
                                  }}
                                >
                                  Ver
                                </button>
                                {request.status === 'PENDING' && (
                                  <>
                                    <button
                                      className="text-green-600 hover:text-green-900 mr-3"
                                      onClick={() => handleApprove(request.id)}
                                    >
                                      Aprobar
                                    </button>
                                    <button
                                      className="text-red-600 hover:text-red-900"
                                      onClick={() => handleReject(request.id)}
                                    >
                                      Rechazar
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-6 py-4 text-center text-sm text-gray-500"
                            >
                              No hay solicitudes recientes en su sector
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

export default ManagerDashboard;
