import axios from 'axios';

// Obtener la URL base de forma dinámica
let baseURL;

// Intentar usar la variable de entorno si está disponible
const envBaseURL = import.meta.env.VITE_API_BASE_URL;

if (envBaseURL) {
  // Si la variable de entorno está definida y no es vacía, usarla
  baseURL = envBaseURL.trim() !== '' ? envBaseURL : `${window.location.origin}/api`;
} else {
  // Si no hay variable de entorno, usar un archivo de configuración o el origen actual
  // Intentamos leer una configuración global en window, que puede ser establecida antes de cargar el bundle
  baseURL = window.APP_CONFIG?.API_BASE_URL || `${window.location.origin}/api`;
}

console.log('URL base configurada:', baseURL);
console.log('Entorno de desarrollo:', import.meta.env.DEV);
console.log('Valor de VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Origen actual de la página:', window.location.origin);
console.log('Configuración global APP_CONFIG:', window.APP_CONFIG);

// Crear una instancia de axios con la configuración base
export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir el token en las cabeceras
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('permission_system_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Solicitud saliente a:', config.baseURL + config.url, 'con headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Error en la solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    console.log('Respuesta recibida:', response);
    return response;
  },
  (error) => {
    console.error('Error en la respuesta:', error);
    if (error.response?.status === 401) {
      // Manejar la expiración del token
      localStorage.removeItem('permission_system_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);