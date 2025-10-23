// emailUtils.js - Utilidades para el envío de correos electrónicos

import brevo from '@getbrevo/brevo';

// Función para enviar un correo electrónico
export const sendEmail = async (to, subject, html) => {
  try {
    // Validar que haya configuración de API key
    if (!process.env.BREVO_API_KEY) {
      console.warn('Advertencia: No se ha configurado BREVO_API_KEY. El correo electrónico no se enviará.');
      return { success: true, message: 'BREVO_API_KEY no encontrada, correo no enviado (modo desarrollo)' };
    }

    // Crear instancia de la API de correos electrónicos transaccionales
    const apiInstance = new brevo.TransactionalEmailsApi();

    // Asignar el API Key correctamente (método actualizado para la versión actual del SDK)
    apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

    // Preparar el correo electrónico
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { 
      email: process.env.FROM_EMAIL || process.env.BREVO_EMAIL || 'no-reply@cliniq.com',
      name: process.env.FROM_NAME || 'Sistema de Gestión de Permisos'
    };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Correo electrónico enviado:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error al enviar correo electrónico:', error);
    return { success: false, error: error.message };
  }
};

// Función para enviar notificación de creación de solicitud de permiso
export const sendPermissionRequestCreatedNotification = async (userEmail, userName, requestDetails) => {
  const subject = 'Confirmación de Solicitud de Permiso';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmación de Solicitud de Permiso</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
        .content { padding: 30px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .highlight { background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .status-pending { background-color: #ffedd5; color: #c2410c; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .status-approved { background-color: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .status-rejected { background-color: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #374151; display: inline-block; width: 150px; }
        .detail-value { color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Sistema de Gestión de Permisos</h1>
        </div>
        <div class="content">
          <h2>Confirmación de Solicitud de Permiso</h2>
          <p>Estimado(a) <strong>${userName}</strong>,</p>
          <p>Su solicitud de permiso ha sido creada exitosamente con los siguientes detalles:</p>
          
          <div class="highlight">
            <div class="detail-row">
              <span class="detail-label">Tipo de Permiso:</span>
              <span class="detail-value">${requestDetails.type?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha de Inicio:</span>
              <span class="detail-value">${new Date(requestDetails.startDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha de Fin:</span>
              <span class="detail-value">${new Date(requestDetails.endDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Razón:</span>
              <span class="detail-value">${requestDetails.reason}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estado:</span>
              <span class="detail-value status-${requestDetails.status.toLowerCase()}">${requestDetails.status}</span>
            </div>
          </div>
          
          <p><strong>Número de seguimiento:</strong> ${requestDetails.id}</p>
          
          <p>Por favor ingrese al sistema para más detalles sobre su solicitud.</p>
        </div>
        <div class="footer">
          <p>Este correo fue enviado automáticamente por el Sistema de Gestión de Permisos.</p>
          <p>No responda a este correo electrónico.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(userEmail, subject, html);
};

// Función para enviar notificación de aprobación/rechazo de solicitud
export const sendPermissionRequestStatusNotification = async (userEmail, userName, requestDetails) => {
  const statusText = requestDetails.status === 'APPROVED' ? 'APROBADA' : 'RECHAZADA';
  const statusColor = requestDetails.status === 'APPROVED' ? '#10B981' : '#EF4444';
  const subject = `Solicitud de Permiso ${statusText}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Solicitud de Permiso ${statusText}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${statusColor}; padding: 20px; text-align: center; color: white; }
        .content { padding: 30px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .highlight { background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .status-pending { background-color: #ffedd5; color: #c2410c; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .status-approved { background-color: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .status-rejected { background-color: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #374151; display: inline-block; width: 150px; }
        .detail-value { color: #6b7280; }
        .message-box { padding: 15px; border-radius: 6px; margin: 15px 0; }
        .approved-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .rejected-box { background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Sistema de Gestión de Permisos</h1>
        </div>
        <div class="content">
          <h2>Solicitud de Permiso ${statusText}</h2>
          <p>Estimado(a) <strong>${userName}</strong>,</p>
          
          <div class="message-box ${requestDetails.status === 'APPROVED' ? 'approved-box' : 'rejected-box'}">
            Su solicitud de permiso ha sido <strong>${statusText}</strong>
          </div>
          
          <p>Detalles de la solicitud:</p>
          
          <div class="highlight">
            <div class="detail-row">
              <span class="detail-label">Tipo de Permiso:</span>
              <span class="detail-value">${requestDetails.type?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha de Inicio:</span>
              <span class="detail-value">${new Date(requestDetails.startDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha de Fin:</span>
              <span class="detail-value">${new Date(requestDetails.endDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Razón:</span>
              <span class="detail-value">${requestDetails.reason}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estado:</span>
              <span class="detail-value status-${requestDetails.status.toLowerCase()}">${requestDetails.status}</span>
            </div>
            ${requestDetails.rejectionReason ? `
            <div class="detail-row">
              <span class="detail-label">Razón de Rechazo:</span>
              <span class="detail-value">${requestDetails.rejectionReason}</span>
            </div>
            ` : ''}
          </div>
          
          <p><strong>Número de seguimiento:</strong> ${requestDetails.id}</p>
          
          <p>Por favor ingrese al sistema para más detalles sobre su solicitud.</p>
        </div>
        <div class="footer">
          <p>Este correo fue enviado automáticamente por el Sistema de Gestión de Permisos.</p>
          <p>No responda a este correo electrónico.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(userEmail, subject, html);
};

// Función para enviar notificación específica a RRHH sobre aprobación/rechazo de solicitud
export const sendHRNotification = async (hrEmail, hrName, requestDetails, approverDetails) => {
  const statusText = requestDetails.status === 'APPROVED' ? 'APROBADA' : 'RECHAZADA';
  const statusColor = requestDetails.status === 'APPROVED' ? '#10B981' : '#EF4444';
  const subject = `[RRHH] Solicitud de Permiso ${statusText} por ${approverDetails.name}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>[RRHH] Solicitud de Permiso ${statusText} por ${approverDetails.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${statusColor}; padding: 20px; text-align: center; color: white; }
        .content { padding: 30px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .highlight { background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .status-pending { background-color: #ffedd5; color: #c2410c; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .status-approved { background-color: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .status-rejected { background-color: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #374151; display: inline-block; width: 180px; }
        .detail-value { color: #6b7280; }
        .message-box { padding: 15px; border-radius: 6px; margin: 15px 0; }
        .approved-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .rejected-box { background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .info-box { background-color: #eff6ff; border: 1px solid #c7d2fe; color: #312e81; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Sistema de Gestión de Permisos</h1>
        </div>
        <div class="content">
          <h2>Solicitud de Permiso ${statusText}</h2>
          <p>Estimado(a) <strong>${hrName}</strong> (RRHH),</p>
          
          <div class="info-box">
            <strong>Notificación para RRHH:</strong> Esta solicitud ha sido ${statusText.toLowerCase()} por ${approverDetails.role === 'MANAGER' ? 'el Jefe de Sector' : 'un usuario con permisos'} ${approverDetails.name}.
          </div>
          
          <p>Detalles de la solicitud de <strong>${requestDetails.user.name}</strong>:</p>
          
          <div class="highlight">
            <div class="detail-row">
              <span class="detail-label">Tipo de Permiso:</span>
              <span class="detail-value">${requestDetails.type?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha de Inicio:</span>
              <span class="detail-value">${new Date(requestDetails.startDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha de Fin:</span>
              <span class="detail-value">${new Date(requestDetails.endDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Razón:</span>
              <span class="detail-value">${requestDetails.reason}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Sector:</span>
              <span class="detail-value">${requestDetails.sector?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estado:</span>
              <span class="detail-value status-${requestDetails.status.toLowerCase()}">${requestDetails.status}</span>
            </div>
            ${requestDetails.rejectionReason ? `
            <div class="detail-row">
              <span class="detail-label">Razón de Rechazo:</span>
              <span class="detail-value">${requestDetails.rejectionReason}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="highlight">
            <div class="detail-row">
              <span class="detail-label">Empleado:</span>
              <span class="detail-value">${requestDetails.user.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Rol del Empleado:</span>
              <span class="detail-value">Empleado</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Correo del Empleado:</span>
              <span class="detail-value">${requestDetails.user.email}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Jefe de Sector:</span>
              <span class="detail-value">${approverDetails.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Rol del Jefe:</span>
              <span class="detail-value">${approverDetails.role === 'MANAGER' ? 'Jefe de Sector' : 'Otro rol'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Correo del Jefe:</span>
              <span class="detail-value">${approverDetails.email || 'N/A'}</span>
            </div>
          </div>
          
          <p><strong>Número de seguimiento:</strong> ${requestDetails.id}</p>
          
          <p>Este correo es informativo para el departamento de RRHH. No se requiere acción adicional.</p>
        </div>
        <div class="footer">
          <p>Este correo fue enviado automáticamente por el Sistema de Gestión de Permisos.</p>
          <p>No responda a este correo electrónico.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(hrEmail, subject, html);
};

// Función para notificar a jefes de sector sobre nuevas solicitudes
export const sendManagerNotification = async (managerEmail, managerName, requestDetails) => {
  const subject = 'Nueva Solicitud de Permiso para Revisar';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Nueva Solicitud de Permiso para Revisar</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
        .content { padding: 30px; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
        .highlight { background-color: #f0f9ff; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; }
        .status-pending { background-color: #ffedd5; color: #c2410c; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .status-approved { background-color: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .status-rejected { background-color: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .detail-row { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #374151; display: inline-block; width: 150px; }
        .detail-value { color: #6b7280; }
        .action-required { background-color: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">Sistema de Gestión de Permisos</h1>
        </div>
        <div class="content">
          <h2>Nueva Solicitud de Permiso para Revisar</h2>
          <p>Estimado(a) <strong>${managerName}</strong>,</p>
          
          <div class="action-required">
            <strong>Acción Requerida</strong><br>
            Hay una nueva solicitud de permiso pendiente de revisión
          </div>
          
          <p>Detalles de la solicitud de ${requestDetails.user.name}:</p>
          
          <div class="highlight">
            <div class="detail-row">
              <span class="detail-label">Tipo de Permiso:</span>
              <span class="detail-value">${requestDetails.type?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha de Inicio:</span>
              <span class="detail-value">${new Date(requestDetails.startDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Fecha de Fin:</span>
              <span class="detail-value">${new Date(requestDetails.endDate).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Razón:</span>
              <span class="detail-value">${requestDetails.reason}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Sector:</span>
              <span class="detail-value">${requestDetails.sector?.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estado:</span>
              <span class="detail-value status-pending">${requestDetails.status}</span>
            </div>
          </div>
          
          <p><strong>Número de seguimiento:</strong> ${requestDetails.id}</p>
          
          <p>Por favor ingrese al sistema para revisar y tomar acción sobre esta solicitud.</p>
        </div>
        <div class="footer">
          <p>Este correo fue enviado automáticamente por el Sistema de Gestión de Permisos.</p>
          <p>No responda a este correo electrónico.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(managerEmail, subject, html);
};