import React, { useState } from 'react';
import { forgotPassword } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/empresa.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor ingrese su correo electrónico');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await forgotPassword(email);
      
      if (response.success) {
        setMessage('Se ha enviado un enlace de recuperación a su correo electrónico. Por favor revise su bandeja de entrada.');
        setEmail('');
      } else {
        setError(response.error || 'Error al enviar el correo de recuperación');
      }
    } catch (err) {
      setError('Error en el servidor. Intente nuevamente.');
      console.error('Error en solicitud de recuperación:', err);
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
            <h2 className="mt-6 text-3xl font-extrabold text-neutral-800">Recuperar Contraseña</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Ingrese su correo electrónico y le enviaremos un enlace para restablecer su contraseña.
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

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                  Correo electrónico
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </div>
              
              <div className="text-sm text-neutral-600 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-medium text-primary-default hover:text-primary-dark"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;