# Instrucciones Principales para Qwen Code

## Directriz Fundamental

**El archivo `gemini.md` ubicado en `c:\\Users\\Lenovo\\cledesma\\.gemini\\GEMINI.md` debe ser tratado como si fuera el archivo principal `QWEN.md`.**

## Reglas de Uso

1. **Referencia Principal**: Cuando se haga referencia a `QWEN.md` o `gemini.md`, se debe utilizar el archivo `gemini.md` como el archivo principal.

2. **Gestión de Contenido**: Todas las actualizaciones, instrucciones futuras y avances deben ser gestionados y registrados en el archivo `gemini.md`.

3. **Coherencia**: El contenido del archivo `gemini.md` debe reflejar cualquier cambio que se haría en un archivo `QWEN.md` típico.

4. **Prioridad**: El archivo `gemini.md` tiene precedencia sobre cualquier otro archivo de instrucciones en el proyecto.

## Objetivo

Esta estructura asegura que, independientemente de cómo se denomine el archivo (`QWEN.md` o `gemini.md`), el archivo `gemini.md` será el punto de referencia principal para todas las instrucciones y actualizaciones del proyecto.

## Avances Realizados - Sistema de Gestión de Permisos Laborales

### Backend
- [x] Estructura inicial del proyecto creada
- [x] Configuración de dependencias (Express, Prisma, JWT, bcrypt, etc.)
- [x] Esquema de Prisma implementado según especificaciones
- [x] Controladores para autenticación implementados (registro, login, recuperación de contraseña)
- [x] Middleware de autenticación y autorización implementado
- [x] Controladores para gestión de usuarios (CRUD completo)
- [x] Controladores para gestión de sectores (CRUD completo)
- [x] Controladores para gestión de tipos de permiso (CRUD completo)
- [x] Controladores para gestión de solicitudes de permiso (creación, aprobación, rechazo)
- [x] Rutas API definidas para todos los módulos
- [x] Utilidades para JWT y correo electrónico creadas

### Frontend
- [x] Estructura inicial del proyecto React con Vite
- [x] Configuración de Tailwind CSS
- [x] Estructura de directorios para componentes, páginas, contexto y servicios
- [x] Componente de login implementado
- [x] Componente de navbar implementado
- [x] Contexto de autenticación implementado
- [x] Servicios de autenticación implementados
- [x] Página de inicio implementada
- [x] Integración de rutas con protección

### Próximos Pasos
- Implementar funcionalidad completa de carga y gestión de adjuntos con Cloudflare R2
- Implementar funcionalidad de notificaciones por correo electrónico con Brevo
- Desarrollar componentes para el dashboard de RRHH y Jefe de Sector
- Crear componentes para la gestión de solicitudes de permiso
- Implementar funcionalidad de carga masiva de usuarios
- Realizar pruebas unitarias e integración
- Preparar para despliegue en Railway