# Sistema de Gestión de Permisos Empresa

Este es un sistema completo de gestión de permisos para la Empresa, construido con React en el frontend y Express.js con Prisma en el backend.

## Estructura del Proyecto

- `backend/` - API REST construida con Express.js y Prisma
- `frontend/` - Aplicación React con Vite y Tailwind CSS

## Despliegue en Railway

Este proyecto está configurado para desplegarse en Railway usando el builder Nixpacks.

### Variables de Entorno Requeridas

#### Backend

##### Base de Datos
- `DATABASE_URL` - URL de conexión a PostgreSQL (ej. `postgresql://user:password@host:port/database`)

##### JWT
- `JWT_SECRET` - Secreto para firmar los tokens JWT

##### Cloudflare R2 (para adjuntos)
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_ACCOUNT_ID`

##### Configuración de Correo (Brevo)
- `BREVO_API_KEY` - API Key de Brevo para autenticación con la API HTTP (reemplaza las variables SMTP anteriores)
- `FROM_EMAIL` - Correo electrónico para envíos (ej. `notificaciones@tuempresa.com`)
- `FROM_NAME` - Nombre del remitente para los correos (opcional, por defecto es "Sistema de Gestión de Permisos")
- `BREVO_EMAIL` - Correo electrónico de Brevo para autenticación (opcional, se puede usar con BREVO_API_KEY)

##### Usuario Admin Inicial
- `ADMIN_EMAIL` - Email para el usuario admin inicial
- `ADMIN_NAME` - Nombre para el usuario admin inicial
- `ADMIN_PASSWORD` - Contraseña para el usuario admin inicial

##### Configuración de CORS
- `CORS_ALLOWED_ORIGINS` - Orígenes permitidos para CORS separados por coma (ej. `https://tu-frontend.vercel.app,https://www.tu-dominio.com`)

#### Frontend
- `VITE_API_BASE_URL` - URL del backend API (ej. `https://tu-backend-app-production.up.railway.app/api`)

### Configuración del Despliegue

#### Opción 1: Backend API solo (recomendado para Railway)
1. **Conecta tu repositorio a Railway**:
   - Crea un nuevo proyecto en Railway
   - Conecta la carpeta `backend` o este repositorio (el backend se desplegará por defecto)

2. **Configura las variables de entorno**:
   - En la sección de Variables de Entorno en Railway, agrega todas las variables mencionadas arriba

3. **Configuración de la base de datos**:
   - Agrega un addon de PostgreSQL en Railway
   - Usa la URL proporcionada en la variable `DATABASE_URL`

4. **La API se encontrará disponible en la URL proporcionada por Railway**

#### Opción 2: Frontend y Backend separados
1. **Despliega el backend** siguiendo los pasos anteriores

2. **Despliega el frontend en un servicio separado** (como Vercel, Netlify o un segundo proyecto en Railway):
   - Configura la variable `VITE_API_BASE_URL` con la URL completa del backend desplegado

#### Opción 3: Aplicación completa con proxy (para Railway)
Si deseas desplegar ambos en un solo proyecto Railway:
1. Despliega el backend como se indica arriba
2. Para servir el frontend, puedes crear una rama o proyecto separado y configurar el proxy para que las solicitudes a `/api` se redirijan al backend

### Migraciones de Prisma

Cuando se despliega por primera vez, Prisma generará el cliente y migrará la base de datos según sea necesario.

### Consideraciones Adicionales

- El backend se ejecutará en el puerto definido por Railway (variable `PORT`)
- La URL del backend debe configurarse correctamente en el frontend para que las API requests funcionen
- Asegúrate de tener una cuenta activa en Cloudflare R2 y Brevo para las funcionalidades de adjuntos y notificaciones por correo
- Cuando se despliega en Railway, la variable `PORT` será automáticamente configurada por Railway

### Solución de Problemas Comunes

#### Problema con Prisma y Alpine Linux

Si se encuentra con errores de Prisma relacionados con OpenSSL (como `libssl.so.1.1 not found`) al usar imágenes basadas en Alpine Linux, el sistema ha sido configurado para usar `node:18-bullseye-slim` en lugar de Alpine para evitar este tipo de problemas. Esta imagen incluye OpenSSL 1.1 y no requiere instalación adicional de dependencias para Prisma.

Además, se han especificado los `binaryTargets` correctos en el archivo `schema.prisma` para asegurar compatibilidad entre diferentes sistemas operativos:

```
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl", "debian-openssl-3.0.x"]
}
```

#### Problema con la Base de Datos y Migraciones

Si se encuentra con errores como `The table 'public.User' does not exist in the current database`, esto indica que las migraciones de Prisma no han sido aplicadas a la base de datos. 

Para resolver este problema:

1. Asegúrese de tener una migración inicial en el directorio `prisma/migrations/`
2. Durante el despliegue en Railway, Prisma automáticamente ejecutará `prisma migrate deploy` para aplicar todas las migraciones pendientes

Para aplicar migraciones manualmente en su entorno local:
```
npx prisma migrate deploy
```

También puede verificar el estado de las migraciones con:
```
npx prisma migrate status
```

Para crear una nueva migración cuando realice cambios en el schema.prisma:
```
npx prisma migrate dev --name nombre_de_la_migracion
```

#### Problema con Migraciones Fallidas en Producción (Error P3009)

Si se encuentra con el error `P3009` en Railway indicando "migrate found failed migrations in the target database", esto significa que una migración previa falló y Prisma no aplicará nuevas migraciones hasta que se resuelva.

Este error típicamente se ve así:
```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20251014154243_init` migration started at 2025-10-19 19:00:17.412634 UTC failed
```

Para resolver este problema:

1. **Solución temporal para Railway**: Cambia temporalmente el start command en Railway para que solo inicie la aplicación sin migraciones:
   - Cambia el start command a: `cd backend && npm start`
   - Esto permitirá verificar si las tablas ya existen en la base de datos

2. **Solución definitiva**: Desde tu entorno local, conecta Prisma a la base de datos de Railway y resuelve la migración fallida:
   ```bash
   # Establece la URL de la base de datos de Railway en una variable de entorno
   DATABASE_URL="tu-url-de-railway" npx prisma migrate resolve --applied 20251014154243_init
   ```

3. **Prevenir este problema en el futuro**:
   - Asegúrate de probar las migraciones en entornos de prueba antes de desplegar a producción
   - Considera usar `prisma migrate deploy` en lugar de `prisma migrate dev` en entornos de producción
   - Mantén una copia de seguridad de tu base de datos antes de aplicar migraciones

#### Problema de Conexión entre Frontend y Backend (CORS y URLs)

Si estás experimentando problemas como `net::ERR_CONNECTION_REFUSED` al intentar hacer solicitudes desde el frontend al backend:

1. **Configura correctamente CORS en el backend**:
   - Asegúrate de que la variable de entorno `CORS_ALLOWED_ORIGINS` en Railway contenga la URL exacta de tu frontend
   - Separa múltiples URLs con comas si es necesario
   - Ejemplo: `https://tu-frontend.vercel.app,https://www.tu-dominio.com`

2. **Verifica la URL del backend en el frontend**:
   - Asegúrate de que la variable `VITE_API_BASE_URL` en tu servicio de frontend apunte a la URL completa de tu backend en Railway
   - Ejemplo: `https://tu-backend-app-production.up.railway.app/api`

3. **Verifica que el backend esté corriendo**:
   - Revisa los logs de Railway para asegurarte de que el backend no tenga errores y esté corriendo correctamente
   - Verifica que las rutas de la API estén disponibles

## Características del Sistema

- Gestión de usuarios, sectores y tipos de permiso
- Solicitud de permisos con adjuntos
- Aprobación/rechazo de solicitudes por jefes de sector
- Panel de reportes con gráficos
- Notificaciones por correo electrónico
- Dashboard con estadísticas

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js, Prisma, PostgreSQL
- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **Base de Datos**: PostgreSQL
- **Almacenamiento**: Cloudflare R2
- **Correo**: Brevo