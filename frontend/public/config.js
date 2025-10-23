// Archivo de configuración dinámica para la URL base de la API
// Este archivo puede ser modificado durante el despliegue para configurar dinámicamente la URL base

// Configuración por defecto
window.APP_CONFIG = window.APP_CONFIG || {};

// Si no se ha definido la URL base de la API, se puede definir aquí o sobreescribirse antes de cargar este script
if (!window.APP_CONFIG.API_BASE_URL) {
  // En producción, esto normalmente se establecería antes de incluir este script
  // Por defecto, usamos el origen actual con el path /api
  window.APP_CONFIG.API_BASE_URL = `${window.location.origin}/api`;
}

console.log('Configuración de aplicación cargada:', window.APP_CONFIG);