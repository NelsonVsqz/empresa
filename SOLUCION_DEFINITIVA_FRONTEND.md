# Solución permanente para variables de entorno en frontend React

## Problema
Las variables de entorno en React con Vite se resuelven en tiempo de compilación, no en tiempo de ejecución.
Esto significa que si la variable `VITE_API_BASE_URL` no estaba configurada cuando se construyó el frontend, la URL de desarrollo queda "quemada" en los archivos JS.

## Solución 1: Configuración correcta del despliegue
1. Asegúrate de que la variable `VITE_API_BASE_URL` esté configurada en el servicio de despliegue del frontend (antes de la compilación)
2. Vuelve a construir y desplegar el frontend

## Solución 2: Solución de tiempo de ejecución (recomendada para mayor flexibilidad)
Para evitar este problema en el futuro, puedes implementar una solución de tiempo de ejecución:

### En el archivo `src/services/apiClient.js`:

```javascript
// Obtener la URL base de forma dinámica
let baseURL;

// Si estamos en desarrollo, usar la variable de entorno
if (import.meta.env.DEV) {
  baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
} else {
  // En producción, usar la URL del dominio actual o una URL configurada
  // Esto permite cambiar la URL sin reconstruir la aplicación
  const currentDomain = window.location.origin;
  // Puedes establecer un patrón para determinar la URL correcta del backend
  // Ejemplo: si frontend está en https://mi-frontend.vercel.app, 
  // el backend podría estar en https://mi-backend.up.railway.app
  baseURL = import.meta.env.VITE_API_BASE_URL || `${currentDomain}/api`;
}

export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Otra alternativa: Archivo de configuración dinámico
Crearías un archivo `config.js` que se genere dinámicamente durante el despliegue:

1. Crear un script que genere `public/config.js` con la URL correcta
2. Cargar este archivo en el index.html
3. Usar la configuración desde ese archivo en lugar de variables de entorno

## Solución 3: Uso de un proxy (si frontend y backend están en el mismo dominio)
Puedes configurar nginx para que las rutas `/api` se redirijan al backend:

```nginx
location /api/ {
    proxy_pass http://tu-backend-en-railway.up.railway.app/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

En este caso, `VITE_API_BASE_URL` podría ser simplemente `/api`.

## Recomendación
La opción 1 es la más simple si estás usando servicios como Vercel o Netlify.
La opción 3 es ideal si estás desplegando frontend y backend bajo el mismo dominio o subdominios.
La opción 2 da la máxima flexibilidad pero requiere más configuración.