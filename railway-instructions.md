# Instrucciones para Despliegue en Railway

## Preparación del Proyecto

Este proyecto está configurado para desplegarse en Railway con los siguientes componentes:

1. Backend API construido con Node.js/Express
2. Base de datos PostgreSQL
3. Almacenamiento en Cloudflare R2
4. Servicio de correo electrónico (Brevo)

## Variables de Entorno Requeridas

### Backend
#### Base de Datos
- `DATABASE_URL` - URL de conexión a PostgreSQL proporcionada por el addon de Railway

#### Seguridad
- `JWT_SECRET` - Secreto para firmar tokens JWT

#### Almacenamiento de Archivos
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_ACCOUNT_ID`

#### Servicio de Correo
- `SMTP_HOST` - Host del servidor SMTP (por ejemplo, smtp-relay.brevo.com)
- `SMTP_PORT` - Puerto del servidor SMTP (por ejemplo, 587)
- `SMTP_USER` - Usuario SMTP
- `SMTP_PASS` - Contraseña o clave API SMTP
- `FROM_EMAIL` - Dirección de correo electrónico desde la que se enviarán notificaciones

#### Usuario Admin Inicial
- `ADMIN_EMAIL` - Correo electrónico para el usuario admin inicial
- `ADMIN_NAME` - Nombre para el usuario admin inicial
- `ADMIN_PASSWORD` - Contraseña para el usuario admin inicial

#### Configuración CORS
- `CORS_ALLOWED_ORIGINS` - Orígenes permitidos separados por coma (ej. `https://tu-frontend.vercel.app,https://otro-origen.com`)

### Frontend
- `VITE_API_BASE_URL` - URL del backend API (ej. `https://tu-backend-app-production.up.railway.app/api`)

## Pasos para Desplegar

### Opción 1: Backend API solo (recomendado para Railway)
1. Conecta tu repositorio a Railway
2. Asegúrate de que el archivo `railway.json` esté correctamente configurado para usar Nixpacks
3. Agrega todas las variables de entorno del backend mencionadas anteriormente
4. Agrega un addon de PostgreSQL para la base de datos
5. Despliega el proyecto

### Opción 2: Frontend y Backend separados
1. Despliega el backend siguiendo los pasos anteriores
2. Despliega el frontend en un servicio separado (como Vercel, Netlify u otro proyecto en Railway)
3. En el servicio de frontend, configura la variable `VITE_API_BASE_URL` con la URL completa del backend desplegado

### Opción 3: Aplicación completa en Railway
Si deseas desplegar ambos en un solo proyecto Railway:
1. Despliega el backend como se indica en la Opción 1
2. Para servir el frontend, puedes crear una rama o proyecto separado y configurar el proxy para que las solicitudes a `/api` se redirijan al backend

## Consideraciones sobre URLs

- La aplicación backend se ejecutará en el puerto definido por la variable `PORT` de Railway
- La URL del backend debe configurarse correctamente en el frontend para que las API requests funcionen
- Cuando se despliega en Railway, la variable `PORT` será automáticamente configurada por Railway
- Las variables CORS_ALLOWED_ORIGINS deben incluir la URL del frontend para permitir solicitudes desde el cliente
- Las migraciones de Prisma se ejecutan automáticamente durante el despliegue
- El usuario admin inicial se creará la primera vez que se inicie la aplicación

## Proceso de Despliegue y Migraciones

Cuando despliegas en Railway:

1. Se instalan las dependencias (`npm install`)
2. Se genera el cliente de Prisma (`prisma generate`, definido en el script `postinstall`)
3. Se ejecutan las migraciones pendientes de Prisma (`prisma migrate deploy`)
4. Se inicia la aplicación (`npm start`)

Este proceso asegura que la base de datos esté siempre actualizada con el esquema definido en `schema.prisma`.

Para crear nuevas migraciones en el futuro cuando se realicen cambios en el schema:
```
npx prisma migrate dev --name nombre_descriptivo_migracion
```

Esto creará una nueva migración en el directorio `prisma/migrations/` que será aplicada automáticamente en el próximo despliegue.