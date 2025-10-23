import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient";
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [userHistory, setUserHistory] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Cargar usuarios y sectores al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Cargar usuarios
        const usersResponse = await apiClient.get("/users");
        setUsers(usersResponse.data.users || []);

        // Cargar sectores
        const sectorsResponse = await apiClient.get("/sectors");
        setSectors(sectorsResponse.data.sectors || []);
      } catch (err) {
        setError("Error al cargar los datos");
        console.error(err);
        toast.error("Error al cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Función para copiar el ID al portapapeles
  const copyToClipboard = async (id, e) => {
    e.stopPropagation(); // Evitar que se dispare cualquier evento de la fila
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Reiniciar el estado después de 2 segundos
    } catch (err) {
      console.error("Error al copiar el ID: ", err);
      toast.error("Error al copiar el ID al portapapeles");
    }
  };

  // Obtener el nombre del sector por ID
  const getSectorName = (sectorId) => {
    const sector = sectors.find((s) => s.id === sectorId);
    return sector ? sector.name : "N/A";
  };

  // Obtener el nombre del rol traducido
  const getRoleName = (role) => {
    switch (role) {
      case "EMPLOYEE":
        return "Empleado";
      case "MANAGER":
        return "Jefe de Sector";
      case "HR":
        return "Admin";
      default:
        return role;
    }
  };

  // Estados para la edición de usuarios
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    sectorId: "",
    managedSectorId: "",
  });

  // Ver historial de solicitudes de un usuario
  const viewUserHistory = async (userId) => {
    try {
      // Cargar historial real del usuario
      setLoading(true);

      // Llamada real a la API para obtener el historial de solicitudes del usuario
      // Usamos la ruta existente con filtro por userId
      const historyResponse = await apiClient.get(
        `/permission-requests?userId=${userId}`
      );
      setUserHistory(historyResponse.data.permissionRequests || []);

      setSelectedUser(userId);
      setShowHistory(true);
    } catch (err) {
      setError("Error al cargar el historial");
      console.error(err);
      toast.error("Error al cargar el historial de solicitudes");
    } finally {
      setLoading(false);
    }
  };

  // Volver al listado de usuarios
  const backToList = () => {
    setShowHistory(false);
    setSelectedUser(null);
    setUserHistory([]);
  };

  // Abrir modal de edición de usuario
  const openEditUserModal = (user) => {
    setEditForm({
      name: user.name,
      role: user.role,
      sectorId: user.sectorId || "",
      managedSectorId: user.managedSectorId || "",
    });
    setEditingUser(user);
  };

  // Cerrar modal de edición
  const closeEditUserModal = () => {
    setEditingUser(null);
    setEditForm({
      name: "",
      role: "",
      sectorId: "",
      managedSectorId: "",
    });
  };

  // Manejar cambios en el formulario de edición
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Guardar cambios de usuario
  const saveUserChanges = async () => {
    if (!editingUser) return;

    try {
      const response = await apiClient.put(
        `/users/${editingUser.id}`,
        editForm
      );

      // Actualizar la lista de usuarios localmente
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { ...u, ...editForm } : u))
      );

      // Cerrar modal
      closeEditUserModal();
      
      // Mostrar notificación de éxito
      toast.success("Usuario actualizado exitosamente");
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setError(
        "Error al actualizar el usuario: " + errorMessage
      );
      console.error("Error al actualizar usuario:", error);
      
      // Mostrar notificación de error
      toast.error(`Error al actualizar usuario: ${errorMessage}`);
    }
  };

  // Eliminar usuario
  const deleteUser = async (userId) => {
    const userToDelete = users.find(u => u.id === userId);
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `¿Estás seguro de que deseas eliminar al usuario ${userToDelete?.name}? Esta acción no se puede deshacer.`,
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
        await apiClient.delete(`/users/${userId}`);

        // Actualizar la lista de usuarios localmente
        setUsers(users.filter((u) => u.id !== userId));
        
        // Mostrar notificación de éxito
        toast.success("Usuario eliminado exitosamente");
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        setError(
          "Error al eliminar el usuario: " + errorMessage
        );
        console.error("Error al eliminar usuario:", error);
        
        // Mostrar notificación de error
        toast.error(`Error al eliminar usuario: ${errorMessage}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
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

  // Vista del historial de solicitudes
  if (showHistory) {
    const user = users.find((u) => u.id === selectedUser);

    return (
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Historial de Solicitudes - {user?.name}
          </h2>
          <button
            onClick={backToList}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Volver al Listado
          </button>
        </div>

        {userHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Fecha de Solicitud
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userHistory.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.type.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.startDate).toLocaleDateString()} -{" "}
                      {new Date(request.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          request.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : request.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {request.status === "APPROVED"
                          ? "Aprobada"
                          : request.status === "PENDING"
                          ? "Pendiente"
                          : "Rechazada"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin solicitudes
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Este usuario no tiene solicitudes de permiso registradas.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Vista del listado de usuarios
  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Gestión de Usuarios
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href="/bulk-user-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Carga de Usuarios
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Nombre
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Email
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Rol
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Sector
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td 
                    className="px-3 py-0.5 text-center text-sm text-gray-500 max-w-[6rem] min-w-[4rem] h-6 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                    onClick={(e) => copyToClipboard(user.id, e)}
                    title="Haga clic para copiar el ID"
                  >
                    <div className="truncate max-w-full flex items-center">
                      <span className="truncate max-w-full">{user.id}</span>
                      {copiedId === user.id && (
                        <span className="ml-1 text-xs text-green-600">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getRoleName(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role === "HR"
                      ? "N/A"
                      : user.role === "MANAGER"
                      ? `Gestiona: ${getSectorName(user.managedSectorId)}`
                      : getSectorName(user.sectorId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewUserHistory(user.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Ver Historial
                    </button>
                    {user.role !== "HR" && (
                      <button
                        onClick={() => openEditUserModal(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                    )}
                    {user.role !== "HR" && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No se encontraron usuarios
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de edición de usuario */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Editar Usuario
                </h3>
                <button
                  onClick={closeEditUserModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <form className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rol
                  </label>
                  <select
                    name="role"
                    value={editForm.role}
                    onChange={handleEditFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="EMPLOYEE">Empleado</option>
                    <option value="MANAGER">Jefe de Sector</option>
                  </select>
                </div>

                {editForm.role === "EMPLOYEE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sector
                    </label>
                    <select
                      name="sectorId"
                      value={editForm.sectorId}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                      <option value="">Seleccionar sector</option>
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editForm.role === "MANAGER" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sector a cargo
                    </label>
                    <select
                      name="managedSectorId"
                      value={editForm.managedSectorId}
                      onChange={handleEditFormChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                      <option value="">Seleccionar sector</option>
                      {sectors.map((sector) => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </form>

              <div className="items-center gap-2 mt-6 flex justify-end">
                <button
                  onClick={closeEditUserModal}
                  className="px-4 py-2 bg-gray-200 rounded-md text-gray-800 hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveUserChanges}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
