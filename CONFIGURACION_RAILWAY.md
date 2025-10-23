# Configuración de Railway

## Variables de entorno requeridas

### Backend
- `DATABASE_URL` - URL de conexión a PostgreSQL
- `JWT_SECRET` - Secreto para firmar los tokens JWT
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_ACCOUNT_ID`
- `BREVO_API_KEY` - API Key de Brevo para autenticación con la API HTTP (reemplaza las variables SMTP anteriores)
- `FROM_EMAIL` - Correo electrónico para envíos (ej. `notificaciones@tuempresa.com`)
- `FROM_NAME` - Nombre del remitente para los correos (opcional, por defecto es "Sistema de Gestión de Permisos")
- `BREVO_EMAIL` - Correo electrónico de Brevo para autenticación (opcional, se puede usar con BREVO_API_KEY)
- `ADMIN_EMAIL` - Email para el usuario admin inicial
- `ADMIN_NAME` - Nombre para el usuario admin inicial
- `ADMIN_PASSWORD` - Contraseña para el usuario admin inicial
- `CORS_ALLOWED_ORIGINS` - Orígenes permitidos para CORS (ej. `https://tu-frontend.up.railway.app,https://www.tu-dominio.com`)

## Configuración específica para Frontend en Railway

### Opción 1 (Recomendada): Configuración estática en variables de entorno
- En las variables de entorno del proyecto de frontend en Railway, configura `VITE_API_BASE_URL` con la URL completa de tu backend en Railway (ej. `https://tu-backend-app-production.up.railway.app/api`)

### Opción 2 (Alternativa): Configuración dinámica con archivo de configuración
- Si la variable `VITE_API_BASE_URL` no se establece durante la construcción, puedes personalizar el archivo `public/config.js` antes de cada despliegue para establecer la URL base de la API.
- Puedes usar un script de build en Railway para modificar el archivo antes de construir:
  ```
  sed -i 's|window.APP_CONFIG.API_BASE_URL =.*|window.APP_CONFIG.API_BASE_URL = \"https://tu-backend-app-production.up.railway.app/api\"|' public/config.js
  ```

### Opción 3 (Opción avanzada): Inyección de variables en tiempo de build con Docker
- Puedes configurar el Dockerfile del frontend para aceptar variables de entorno como argumentos de build
- En el Dockerfile, define ARG y ENV para las variables que necesitas pasar al build
- Ejemplo de configuración en el Dockerfile:
  ```dockerfile
  # Define build arguments that will be available during build time
  ARG VITE_API_BASE_URL
  ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
  ```
- Luego, en Railway, puedes pasar estas variables como argumentos de build

### Si usas un dominio personalizado
- Coloca en `CORS_ALLOWED_ORIGINS`: `https://www.tu-dominio.com`
- Asegúrate de que `VITE_API_BASE_URL` apunte a la URL de tu backend en Railway

## Pasos para desplegar correctamente

### 1. Backend en Railway
1. Conecta tu repositorio a Railway
2. Configura todas las variables de entorno mencionadas arriba
3. Asegúrate de incluir la URL de tu frontend en `CORS_ALLOWED_ORIGINS` (separadas por comas si hay más de una)
4. Asegúrate de que `PORT` esté configurado (Railway lo configura automáticamente)

### 2. Frontend en Railway (proyecto separado)
1. En las variables de entorno del proyecto de frontend en Railway, configura:
   - `VITE_API_BASE_URL` con la URL completa de tu backend en Railway (ej. `https://tu-backend-app-production.up.railway.app/api`)
2. O bien, configura el archivo `public/config.js` antes de la construcción si prefieres la estrategia dinámica
3. O usa la opción de Docker para inyectar variables durante el build

## Problemas comunes y soluciones

### Error de CORS
- Asegúrate de que la URL de tu frontend esté incluida en `CORS_ALLOWED_ORIGINS` del backend
- Verifica que las URLs estén exactamente igual (incluso con o sin www)

### Error de conexión con la API
- Verifica que `VITE_API_BASE_URL` en el frontend sea la URL correcta de tu backend
- Asegúrate de que el backend esté corriendo correctamente en Railway
- Verifica que las rutas de la API estén bien configuradas

### Error de migraciones
- Si ves errores relacionados con migraciones, revisa los logs de Railway
- Asegúrate de que la base de datos esté correctamente conectada
- Las migraciones se aplican automáticamente en el start command de Railway