import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/empresa.png';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-neutral-800 shadow-soft">
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/" className="flex items-center">
                  <img 
                    src={logo} 
                    alt="Logo Empresa" 
                    className="h-8 w-auto"
                  />
                  <span className="ml-2 text-white font-bold text-xl hidden sm:block">
                    Sistema de Permisos
                  </span>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {user && user.role === 'HR' && (
                    <>
                      <Link to="/dashboard/hr" className="text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Dashboard RRHH
                      </Link>
                      <Link to="/user-list" className="text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Gestión de Usuarios
                      </Link>
                      <Link to="/bulk-sector-upload" className="text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Gestión de Sectores
                      </Link>
                      <Link to="/permission-types-management" className="text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Tipos de Permiso
                      </Link>
                      <Link to="/reports" className="text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Reportes
                      </Link>
                    </>
                  )}
                  
                  {user && user.role === 'MANAGER' && (
                    <>
                      <Link to="/dashboard/manager" className="text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Dashboard Jefe
                      </Link>
                      <Link to="/pending-requests" className="text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Solicitudes Pendientes
                      </Link>
                    </>
                  )}
                  
                  {(user && user.role !== 'HR') && (
                    <Link to="/requests" className="text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Mis Solicitudes
                    </Link>
                  )}
                  
                  {(user && (user.role === 'EMPLOYEE' || user.role === 'MANAGER')) && (
                    <Link to="/request-permission" className="text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                      Solicitar Permiso
                    </Link>
                  )}
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <p className="text-sm text-white mr-3">{user ? `${user.name}${user.role === 'HR' ? ' (Admin)' : ''}` : 'Invitado'}</p>
                    {user && (
                      <button
                        onClick={logout}
                        className="text-sm text-white bg-error hover:bg-red-700 px-3 py-1 rounded-md"
                      >
                        Cerrar sesión
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;