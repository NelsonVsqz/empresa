# Solución para problema de conexión entre frontend y backend

El error `net::ERR_CONNECTION_REFUSED` al intentar acceder a `localhost:3000/api/auth/login` indica que el frontend está usando la URL de desarrollo en lugar de la URL de producción.

## Causa del problema

Las variables de entorno en aplicaciones Vite (como esta aplicación React) se resuelven en tiempo de compilación, no en tiempo de ejecución. Esto significa que si la variable `VITE_API_BASE_URL` no estaba configurada correctamente cuando se construyó el frontend, seguirá usando el valor por defecto.

## Solución

### Para frontend desplegado en Vercel o Netlify:

1. En el panel de Vercel o Netlify:
   - Ve a Settings → Environment Variables
   - Asegúrate de que `VITE_API_BASE_URL` esté configurado con la URL completa de tu backend en Railway
   - Ejemplo: `https://tu-backend-app-production.up.railway.app/api`

2. Desencadena un nuevo despliegue para que se reconstruya la aplicación con la variable correcta

### Para frontend desplegado en Railway (si aplica):

1. En el panel de Railway:
   - En el proyecto del frontend, ve a Settings → Variables
   - Asegúrate de que `VITE_API_BASE_URL` esté configurado con la URL completa de tu backend en Railway
   - Ejemplo: `https://tu-backend-app-production.up.railway.app/api`

2. Redeploy el proyecto para que se reconstruya con la variable correcta

### Verificación

Después de configurar la variable y redeployar:

1. Abre las herramientas de desarrollo del navegador (F12)
2. Ve a la pestaña Network
3. Intenta hacer login nuevamente
4. Verifica que las solicitudes ahora vayan a la URL correcta de tu backend

## Importante

- Recuerda que el frontend debe estar desplegado para que las nuevas variables de entorno tengan efecto
- Las variables de entorno solo se aplican a nuevas construcciones del frontend, no a versiones ya desplegadas