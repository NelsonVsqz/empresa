// services/authService.js

// Obtener la URL base de forma dinámica
let API_BASE_URL;

// Intentar usar la variable de entorno si está disponible
const envBaseURL = import.meta.env.VITE_API_BASE_URL;

if (envBaseURL) {
  // Si la variable de entorno está definida y no es vacía, usarla
  API_BASE_URL = envBaseURL.trim() !== '' ? envBaseURL : `${window.location.origin}/api`;
} else {
  // Si no hay variable de entorno, usar un archivo de configuración o el origen actual
  // Intentamos leer una configuración global en window, que puede ser establecida antes de cargar el bundle
  API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || `${window.location.origin}/api`;
}

console.log('URL base de auth service:', API_BASE_URL);
console.log('Entorno de desarrollo:', import.meta.env.DEV);
console.log('Valor de VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('Origen actual de la página:', window.location.origin);
console.log('Configuración global APP_CONFIG:', window.APP_CONFIG);

// Almacenar y obtener token de sesión
const TOKEN_KEY = 'permission_system_token';

export const setAuthToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// Función para incluir el token en las cabeceras
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Servicio de inicio de sesión
export const login = async (credentials) => {
  console.log('Intentando iniciar sesión con credentials:', credentials);
  console.log('Usando URL base:', API_BASE_URL);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('Respuesta de login:', response);

    const data = await response.json();

    if (response.ok) {
      setAuthToken(data.token);
      return { 
        success: true, 
        token: data.token,
        user: data.user // Asumiendo que el backend devuelve el objeto de usuario en data.user
      };
    } else {
      return { success: false, error: data.error || 'Error en el inicio de sesión' };
    }
  } catch (error) {
    console.error('Error en la solicitud de inicio de sesión:', error);
    return { success: false, error: 'Error de red o servidor' };
  }
};

// Servicio de registro
export const register = async (userData) => {
  console.log('Intentando registrar usuario:', userData);
  console.log('Usando URL base:', API_BASE_URL);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, ...data };
    } else {
      return { success: false, error: data.error || 'Error en el registro' };
    }
  } catch (error) {
    console.error('Error en la solicitud de registro:', error);
    return { success: false, error: 'Error de red o servidor' };
  }
};

// Servicio para obtener perfil de usuario
export const getProfile = async () => {
  console.log('Intentando obtener perfil con URL base:', API_BASE_URL);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, ...data };
    } else {
      removeAuthToken(); // Si hay error de autenticación, eliminar token
      return { success: false, error: data.error || 'Error al obtener perfil' };
    }
  } catch (error) {
    console.error('Error en la solicitud de perfil:', error);
    removeAuthToken(); // Eliminar token en caso de error de red
    return { success: false, error: 'Error de red o servidor' };
  }
};

// Servicio para cierre de sesión
export const logout = () => {
  removeAuthToken();
  console.log('Sesión cerrada');
};

// Servicio para solicitud de recuperación de contraseña
export const forgotPassword = async (email) => {
  console.log('Solicitando recuperación de contraseña para:', email);
  console.log('Usando URL base:', API_BASE_URL);
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, ...data };
    } else {
      return { success: false, error: data.error || 'Error en la solicitud de recuperación' };
    }
  } catch (error) {
    console.error('Error en la solicitud de recuperación de contraseña:', error);
    return { success: false, error: 'Error de red o servidor' };
  }
};