import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/empresa.png';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-neutral-50">
      {/* Hero Section */}
      <div className="relative bg-neutral-800 text-white text-center py-20">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1533090161767-e6ffed986c88?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&fm=jpg&q=60&w=3000')" }}
        ></div>
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        <div className="relative z-20">
          <div className="flex flex-col items-center">
            <img 
              src={logo} 
              alt="Logo Empresa" 
              className="h-24 w-auto mb-4"
            />
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
              Sistema de Gestión de Permisos
            </h1>
          </div>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-neutral-300">
            Una forma moderna y eficiente de gestionar las solicitudes de permisos laborales.
          </p>
          <div className="mt-10">
            {!isAuthenticated ? (
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-default hover:bg-primary-dark transform transition duration-300 hover:scale-105 shadow-lg"
                >
                  Iniciar Sesión
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-2xl text-neutral-200">
                  Bienvenido, <span className="font-bold text-white">{user?.name}</span>
                </p>
                <p className="mt-2 text-lg text-neutral-300">
                  Rol: <span className="font-semibold text-white">{user?.role}</span>
                </p>
                <div className="mt-8 flex justify-center flex-wrap gap-4">
                  {user?.role === 'HR' && (
                    <button
                      onClick={() => navigate('/dashboard/hr')}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-default hover:bg-primary-dark transform transition duration-300 hover:scale-105 shadow-lg"
                    >
                      Dashboard de RRHH
                    </button>
                  )}
                  {user?.role === 'MANAGER' && (
                    <button
                      onClick={() => navigate('/dashboard/manager')}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-default hover:bg-primary-dark transform transition duration-300 hover:scale-105 shadow-lg"
                    >
                      Dashboard de Jefe
                    </button>
                  )}
                  {user?.role !== 'HR' && (
                    <button
                      onClick={() => navigate('/requests')}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-dark bg-primary-light hover:bg-primary-default transform transition duration-300 hover:scale-105 shadow-lg"
                    >
                      Mis Solicitudes
                    </button>
                  )}
                  {(user?.role === 'EMPLOYEE' || user?.role === 'MANAGER') && (
                    <button
                      onClick={() => navigate('/request-permission')}
                      className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-success hover:bg-green-700 transform transition duration-300 hover:scale-105 shadow-lg"
                    >
                      Solicitar Permiso
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-primary-default font-semibold tracking-wide uppercase">Características</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-neutral-800 sm:text-4xl">
              Todo lo que necesitas en un solo lugar
            </p>
            <p className="mt-4 max-w-2xl text-xl text-neutral-500 mx-auto">
              Nuestro sistema ofrece una solución completa para la gestión de permisos, desde la solicitud hasta la aprobación y el seguimiento.
            </p>
          </div>

          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-8 bg-neutral-50 rounded-2xl shadow-soft transform transition duration-300 hover:scale-105 hover:shadow-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-default text-white mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-800 text-center">Solicitudes Simplificadas</h3>
              <p className="mt-4 text-base text-neutral-500 text-center">
                Crea y envía solicitudes de permiso en segundos con nuestro formulario intuitivo.
              </p>
            </div>

            <div className="p-8 bg-neutral-50 rounded-2xl shadow-soft transform transition duration-300 hover:scale-105 hover:shadow-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-default text-white mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-800 text-center">Flujos de Aprobación Claros</h3>
              <p className="mt-4 text-base text-neutral-500 text-center">
                Gestiona las solicitudes de tu equipo con un sistema de aprobación claro y personalizable.
              </p>
            </div>

            <div className="p-8 bg-neutral-50 rounded-2xl shadow-soft transform transition duration-300 hover:scale-105 hover:shadow-lg">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-default text-white mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-neutral-800 text-center">Dashboard y Reportes</h3>
              <p className="mt-4 text-base text-neutral-500 text-center">
                Obtén una visión clara del estado de los permisos en tu organización con nuestros dashboards y reportes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
