import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import logo from '../assets/empresa.png';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  // Obtener el token de los parámetros de la URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      // Validar el token con el backend
      validateToken(tokenFromUrl);
    } else {
      setError('Token de restablecimiento no válido o ausente');
    }
  }, [searchParams]);

  // Validar el token con el backend
  const validateToken = async (token) => {
    try {
      const response = await apiClient.post('/auth/validate-reset-token', { token });
      if (response.data.success) {
        setTokenValid(true);
      } else {
        setError(response.data.error || 'Token de restablecimiento inválido o expirado');
      }
    } catch (err) {
      setError('Error al validar el token de restablecimiento');
      console.error('Error validando token:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!token) {
      setError('Token de restablecimiento no válido');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiClient.post('/auth/reset-password', {
        token,
        newPassword: password
      });
      
      if (response.data.success) {
        setMessage('Contraseña restablecida con éxito. Redirigiendo al inicio de sesión...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.error || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setError('Error en el servidor. Intente nuevamente.');
      console.error('Error en restablecimiento de contraseña:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1533090161767-e6ffed986c88?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&fm=jpg&q=60&w=3000"
          alt=""
        />
      </div>
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex justify-center">
              <img 
                src={logo} 
                alt="Logo Empresa" 
                className="h-16 w-auto"
              />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-neutral-800">Restablecer Contraseña</h2>
            <p className="mt-2 text-sm text-neutral-600">
              {tokenValid 
                ? 'Ingrese su nueva contraseña'
                : 'Token inválido o expirado'}
            </p>
          </div>

          <div className="mt-8">
            {error && (
              <div className="rounded-md bg-error p-4 mb-4">
                <div className="text-sm text-white">{error}</div>
              </div>
            )}
            
            {message && (
              <div className="rounded-md bg-success p-4 mb-4">
                <div className="text-sm text-white">{message}</div>
              </div>
            )}

            {tokenValid ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                    Nueva contraseña
                  </label>
                  <div className="mt-1">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-default focus:border-primary-default sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
                    Confirmar contraseña
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-primary-default focus:border-primary-default sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-primary-default hover:bg-primary-dark focus:ring-primary-default'
                    }`}
                  >
                    {loading ? 'Restableciendo...' : 'Restablecer contraseña'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="font-medium text-primary-default hover:text-primary-dark"
                >
                  Solicitar un nuevo enlace de recuperación
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;