### **Visión General del Proyecto**

Crearemos una aplicación web completa para la gestión de solicitudes de permisos laborales. El sistema manejará diferentes roles de usuario (Empleado, Jefe de Sector, Recursos Humanos), un flujo de aprobación claro y un dashboard de reportería para la toma de decisiones.

### **Tecnologías Seleccionadas**

- **Frontend:** React con Vite (usando las versiones más recientes y compatibles) y Tailwind CSS para un diseño moderno y responsivo.
- **Backend:** Node.js con el framework Express.js para construir una API RESTful robusta.
- **Base de Datos:** PostgreSQL, un sistema de base de datos relacional potente y de código abierto.
- **ORM:** Prisma, para interactuar con la base de datos de una manera segura y eficiente desde Node.js.
- **Autenticación:** Se implementará un sistema basado en JSON Web Tokens (JWT). Las sesiones de usuario expirarán después de una hora de inactividad.
- **Almacenamiento de Archivos:** Cloudflare R2 para guardar los archivos adjuntos de forma segura y escalable.
- **Envío de Correos:** Usaremos Nodemailer conectado a Brevo (antes Sendinblue) para gestionar todas las notificaciones por correo electrónico.
- **Despliegue:** Railway, que nos permitirá desplegar tanto el backend (Node.js), la base de datos (PostgreSQL) y el frontend (como sitio estático).

### **Funcionalidades Clave (Desglose)**

#### **Módulo 1: Autenticación y Gestión de Usuarios**

1.  **Login:** Página de inicio de sesión con correo y contraseña.
2.  **Recuperación de Contraseña:** Flujo de "Olvidé mi contraseña" que enviará un enlace seguro por correo para el restablecimiento.
3.  **Gestión de Sesiones:** Las sesiones de usuario durarán 1 hora y se cerrarán automáticamente.
4.  **Roles y Permisos:**
    - **Empleado:** Puede crear y ver sus propias solicitudes de permiso.
    - **Jefe de Sector:** Puede gestionar las solicitudes de su sector y ver el dashboard de su área.
    - **Recursos Humanos (RRHH):** Acceso total. Gestiona usuarios, áreas, tipos de permiso y ve el dashboard global.

#### **Módulo 2: Panel de Administración (RRHH)**

1.  **Gestión de Usuarios:**
    - Crear, editar y eliminar usuarios de forma individual.
    - **Carga Masiva:** Funcionalidad para subir un archivo (CSV o Excel) con `Nombre y Apellido`, `Área`, `Correo` y `Rol` (Jefe/Empleado) para crear múltiples usuarios. Las contraseñas se generarán automáticamente y se basarán en un secreto del sistema.
2.  **Gestión de Áreas/Sectores:** CRUD (Crear, Leer, Actualizar, Eliminar) para las áreas de la clínica.
3.  **Gestión de Tipos de Permiso:** CRUD para los tipos de solicitudes de permiso y sus descripciones.

#### **Módulo 3: Flujo de Solicitud de Permisos (Empleado)**

1.  **Formulario de Creación:**
    - Campos estandarizados: Nombre completo, Área.
    - Campos seleccionables: Tipo de solicitud.
    - Campos de fecha: "Desde" y "Hasta".
    - Campo de texto libre para el "Motivo".
    - Opción para adjuntar múltiples archivos (subida a Cloudflare R2).
2.  **Notificaciones por Corre:** Al enviar la solicitud, se enviará un correo de confirmación al empleado y una notificación al jefe de su sector.

#### **Módulo 4: Flujo de Aprobación (Jefe de Sector)**

1.  **Bandeja de Entrada:** Vista con todas las solicitudes pendientes de su sector.
2.  **Acciones sobre la Solicitud:**
    - **Aprobar:** Cambia el estado a "Aprobado".
    - **Rechazar:** Cambia el estado a "Rechazado" y exige un motivo.
    - **Modificar y Aprobar:** Permite cambiar solo las fechas "Desde" y "Hasta" y luego la aprueba.
3.  **Notificaciones por Correo:** Al realizar una acción, se notificará por correo al empleado, al propio jefe y a todos los usuarios de RRHH.

#### **Módulo 5: Dashboard y Reportería**

1.  **Vista RRHH:** Dashboard global con estadísticas y visualizaciones de datos:
    - Permisos por área.
    - Permisos por tipo de solicitud.
    - Permisos por mes/año.
    - Filtros avanzados.
2.  **Vista Jefe de Sector:** Dashboard restringido a los datos de su propio sector, con las mismas estadísticas.

### **Modelo de Datos (Esquema Prisma Propuesto)**

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  password    String
  role        Role     @default(EMPLOYEE)
  sector      Sector?  @relation(fields: [sectorId], references: [id])
  sectorId    String?
  requests    PermissionRequest[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Sector {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  users       User[]
  requests    PermissionRequest[]
  createdAt   DateTime @default(now())
}

model PermissionType {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  requests    PermissionRequest[]
  createdAt   DateTime @default(now())
}

model PermissionRequest {
  id               String         @id @default(cuid())
  user             User           @relation(fields: [userId], references: [id])
  userId           String
  sector           Sector         @relation(fields: [sectorId], references: [id])
  sectorId         String
  type             PermissionType @relation(fields: [typeId], references: [id])
  typeId           String
  startDate        DateTime
  endDate          DateTime
  reason           String
  status           Status         @default(PENDING)
  rejectionReason  String?
  attachments      Attachment[]
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}

model Attachment {
  id                  String            @id @default(cuid())
  url                 String
  permissionRequest   PermissionRequest @relation(fields: [permissionRequestId], references: [id])
  permissionRequestId String
  createdAt           DateTime          @default(now())
}

enum Role {
  EMPLOYEE
  MANAGER
  HR
}

enum Status {
  PENDING
  APPROVED
  REJECTED
}
```

### **Avances Realizados**

#### **Backend**

- [x] Estructura inicial del proyecto creada
- [x] Configuración de dependencias (Express, Prisma, JWT, bcrypt, etc.)
- [x] Esquema de Prisma implementado según especificaciones
- [x] Controladores para autenticación implementados (registro, login, recuperación de contraseña)
- [x] Middleware de autenticación y autorización implementado
- [x] Controladores para gestión de usuarios (CRUD completo)
- [x] Controladores para gestión de sectores (CRUD completo)
- [x] Controladores para gestión de tipos de permiso (CRUD completo)
- [x] Controladores para gestión de solicitudes de permiso (creación, aprobación, rechazo)
- [x] Controladores para gestión de adjuntos (subida, obtención, eliminación)
- [x] Rutas API definidas para todos los módulos
- [x] Utilidades para JWT, correo electrónico y carga de archivos a Cloudflare R2 creadas

#### **Frontend**

- [x] Estructura inicial del proyecto React con Vite
- [x] Configuración de Tailwind CSS
- [x] Estructura de directorios para componentes, páginas, contexto y servicios
- [x] Componente de login implementado
- [x] Componente de navbar implementado
- [x] Contexto de autenticación implementado
- [x] Servicios de autenticación implementados
- [x] Página de inicio implementada
- [x] Integración de rutas con protección

### **Próximos Pasos**

1. **Implementar funcionalidad de notificaciones por correo electrónico con Brevo**
2. **Desarrollar componentes para el dashboard de RRHH y Jefe de Sector**
3. **Crear componentes para la gestión de solicitudes de permiso**
4. **Implementar funcionalidad de carga masiva de usuarios**
5. **Realizar pruebas unitarias e integración**
6. **Preparar para despliegue en Railway**
