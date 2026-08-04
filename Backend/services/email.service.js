const { Resend } = require('resend');
const fs   = require('fs');
const path = require('path');

const FROM   = process.env.EMAIL_FROM || 'FABRIC <onboarding@resend.dev>';
let resendClient = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no configurada.');
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

async function sendEmail(payload) {
  const resend = getResendClient();
  const redirect = process.env.DEV_REDIRECT_EMAIL;
  if (redirect) {
    const originalTo = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;
    payload = {
      ...payload,
      to: redirect,
      subject: `[PRUEBA → ${originalTo}] ${payload.subject}`,
    };
  }
  const result = await resend.emails.send(payload);
  if (result.error) {
    throw new Error(result.error.message || 'Error enviando email con Resend');
  }
  return result;
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function wrap(body) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FABRIC</title>
</head>
<body style="margin:0;padding:0;background:#F7F5F2;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F2;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-top:3px solid #C9A96E;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <div style="font-size:22px;font-weight:300;letter-spacing:0.08em;color:#0A0A0A;">FABRIC</div>
              <div style="font-size:9px;letter-spacing:0.26em;text-transform:uppercase;color:#8A8A8A;margin-top:4px;">Oracle Critical Engineering</div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px;background:#E8E4DE;"></div>
            </td>
          </tr>

          <!-- Body -->
          ${body}

          <!-- Footer -->
          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px;background:#E8E4DE;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 48px 40px;">
              <p style="margin:0;font-size:10px;color:#B0A898;letter-spacing:0.06em;line-height:1.7;">
                FABRIC SOFT MEXICO SA DE CV &nbsp;·&nbsp; fabricsoft.com.mx<br/>
                Este correo es una confirmación automática. No es necesario responder.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function label(text) {
  return `<div style="font-size:9px;letter-spacing:0.22em;text-transform:uppercase;color:#8A8A8A;margin-bottom:6px;">${text}</div>`;
}

function dataRow(key, value) {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;">
      <span style="font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#B0A898;">${key}</span>
    </td>
    <td style="padding:10px 0;border-bottom:1px solid #F0EDE8;text-align:right;">
      <span style="font-size:12px;color:#2A2A2A;">${value}</span>
    </td>
  </tr>`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatOfficeHoursDate(dia) {
  const [year, month, day] = String(dia).split('-').map(Number);
  if (!year || !month || !day) return dia;

  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date).replace(',', '');
}

// ── Templates ─────────────────────────────────────────────────────────────────

function templateAplicar({ nombre, empresa, status }) {
  const isWaitlist = status === 'WaitList';

  const body = `
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label('Solicitud recibida')}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        ${nombre},<br/>recibimos<br/>tu solicitud.
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        ${isWaitlist
          ? `Tu perfil de <strong style="color:#2A2A2A;">${empresa}</strong> quedó registrado en nuestra lista de espera para <strong style="color:#2A2A2A;">Q3&ndash;Q4 2026</strong>. Te contactaremos cuando haya disponibilidad que se ajuste a tu proyecto.`
          : `La solicitud de <strong style="color:#2A2A2A;">${empresa}</strong> está en revisión. La evaluamos en las próximas <strong style="color:#2A2A2A;">48 horas hábiles</strong>. Si tu perfil es compatible con nuestra capacidad actual, recibirás una propuesta de agenda para una sesión inicial.`
        }
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dataRow('Empresa', empresa)}
        ${dataRow('Contacto', nombre)}
        ${dataRow('Estado', isWaitlist ? 'Lista de espera' : 'En revisión')}
        ${dataRow('Ventana', 'Q3 2026')}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 40px;">
      <p style="margin:0 0 20px;font-size:12px;color:#8A8A8A;line-height:1.7;">
        FABRIC opera con un máximo de 12 proyectos simultáneos. La selectividad protege la calidad operativa para los clientes que aceptamos.
      </p>
      <a href="https://fabricsoft.com.mx/#s15"
         style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#0A0A0A;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
        Ver estado de admisión →
      </a>
    </td>
  </tr>`;

  return wrap(body);
}

function templateWaitlist({ nombre, empresa }) {
  const body = `
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label('Lista de espera · Q3 2026')}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        Quedaste registrado<br/>en la lista de espera.
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        <strong style="color:#2A2A2A;">${nombre}</strong> de <strong style="color:#2A2A2A;">${empresa}</strong>, te notificaremos cuando haya disponibilidad en Q3 o Q4 2026 que se ajuste a tu tipo de proyecto.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 40px;">
      <p style="margin:0 0 20px;font-size:12px;color:#8A8A8A;line-height:1.7;">
        Si tu situación cambia o tienes urgencia operativa, completa la solicitud de admisión completa para ser evaluado con prioridad.
      </p>
      <a href="https://fabricsoft.com.mx/aplicar"
         style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#0A0A0A;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
        Completar solicitud →
      </a>
    </td>
  </tr>`;

  return wrap(body);
}

function templateReferencia({ nombre, empresa }) {
  const body = `
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label('Información recibida')}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        Recibimos<br/>tu información.
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        <strong style="color:#2A2A2A;">${nombre}</strong> de <strong style="color:#2A2A2A;">${empresa}</strong>, revisaremos tu perfil. Si hay compatibilidad con nuestra capacidad actual, te contactaremos directamente para una conversación inicial.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 40px;">
      <a href="https://fabricsoft.com.mx"
         style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#0A0A0A;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
        Conocer FABRIC →
      </a>
    </td>
  </tr>`;

  return wrap(body);
}

function templateOfficeHoursConfirmacion({ nombre, empresa, dia, slot }) {
  const nombreSafe = escapeHtml(nombre);
  const empresaSafe = escapeHtml(empresa);
  const diaFormateado = escapeHtml(formatOfficeHoursDate(dia));
  const slotSafe = escapeHtml(slot);

  const body = `
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label('Office Hours confirmada')}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        ${nombreSafe},<br/>tu sesi&oacute;n<br/>est&aacute; confirmada.
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        Confirmamos la conversaci&oacute;n de Office Hours para <strong style="color:#2A2A2A;">${empresaSafe}</strong>. La sesi&oacute;n est&aacute; reservada para revisar contexto, urgencia operativa y compatibilidad con la capacidad actual de FABRIC.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dataRow('Empresa', empresaSafe)}
        ${dataRow('Contacto', nombreSafe)}
        ${dataRow('Dia', diaFormateado)}
        ${dataRow('Horario', `${slotSafe} hrs`)}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 40px;">
      <p style="margin:0;font-size:12px;color:#8A8A8A;line-height:1.7;">
        Antes de la llamada, ten a la mano el contexto del sistema Oracle, etapa del proyecto, riesgos visibles y cualquier fecha critica de negocio. Esto permite que la conversaci&oacute;n sea tecnica y accionable desde el primer minuto.
      </p>
    </td>
  </tr>`;

  return wrap(body);
}

function templateNdaPdfAccess({ nombre, empresa, caso, pdfUrl }) {
  const nombreSafe = escapeHtml(nombre);
  const empresaSafe = escapeHtml(empresa);
  const casoSafe = escapeHtml(caso);
  const pdfUrlSafe = escapeHtml(pdfUrl);

  const body = `
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label('Acceso aprobado bajo NDA')}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        ${nombreSafe},<br/>tu acceso<br/>fue aprobado.
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        Aprobamos la solicitud de <strong style="color:#2A2A2A;">${empresaSafe}</strong> para consultar el PDF bajo NDA del caso <strong style="color:#2A2A2A;">${casoSafe}</strong>.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dataRow('Empresa', empresaSafe)}
        ${dataRow('Contacto', nombreSafe)}
        ${dataRow('Caso', casoSafe)}
        ${dataRow('Acceso', 'PDF bajo NDA')}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 40px;">
      <p style="margin:0 0 20px;font-size:12px;color:#8A8A8A;line-height:1.7;">
        Este material es confidencial. No debe reenviarse, publicarse ni compartirse fuera del proceso autorizado.
      </p>
      <a href="${pdfUrlSafe}"
         style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#0A0A0A;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
        Abrir PDF bajo NDA
      </a>
    </td>
  </tr>`;

  return wrap(body);
}

const PAPER_TITLES = {
  '01': 'Por qué fallan los go-live de Oracle Fusion',
  '02': 'IA aplicada a cierre contable en Fusion Cloud',
  '03': 'Modelo de entrega en primer ciclo crítico',
};

function templatePaperEntrega({ empresa, paperId, paperTitle }) {
  const empresaSafe = escapeHtml(empresa);
  const titleSafe   = escapeHtml(paperTitle);

  const body = `
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label(`Research Paper ${paperId} · FABRIC`)}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        Tu paper<br/>est&aacute; adjunto.
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        El material que solicitaste para <strong style="color:#2A2A2A;">${empresaSafe}</strong> est&aacute; adjunto a este correo como archivo PDF.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dataRow('Paper', titleSafe)}
        ${dataRow('N&uacute;mero', paperId)}
        ${dataRow('Empresa', empresaSafe)}
        ${dataRow('Formato', 'PDF adjunto')}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 40px;">
      <p style="margin:0 0 20px;font-size:12px;color:#8A8A8A;line-height:1.7;">
        Este material es para uso interno de tu organizaci&oacute;n. Si tienes preguntas sobre el contenido o quieres profundizar en alg&uacute;n punto, podemos agendarlo en una sesi&oacute;n de Office Hours.
      </p>
      <a href="https://fabricsoft.com.mx/#s11"
         style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#0A0A0A;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
        Agendar Office Hours &rarr;
      </a>
    </td>
  </tr>`;

  return wrap(body);
}

// ── Funciones públicas ────────────────────────────────────────────────────────

exports.sendConfirmacionAplicar = ({ nombre, empresa, email, status }) =>
  sendEmail({
    from:    FROM,
    to:      email,
    subject: status === 'WaitList'
      ? 'Lista de espera Q3 2026 — FABRIC'
      : 'Solicitud recibida — FABRIC Oracle Critical Engineering',
    html: templateAplicar({ nombre, empresa, status }),
  });

exports.sendConfirmacionWaitlist = ({ nombre, empresa, email }) =>
  sendEmail({
    from:    FROM,
    to:      email,
    subject: 'Lista de espera Q3 2026 — FABRIC',
    html: templateWaitlist({ nombre, empresa }),
  });

exports.sendConfirmacionReferencia = ({ nombre, empresa, email }) =>
  sendEmail({
    from:    FROM,
    to:      email,
    subject: 'Información recibida — FABRIC',
    html: templateReferencia({ nombre, empresa }),
  });

exports.sendConfirmacionOfficeHours = ({ nombre, empresa, email, dia, slot }) =>
  sendEmail({
    from:    FROM,
    to:      email,
    subject: 'Office Hours confirmada - FABRIC',
    html: templateOfficeHoursConfirmacion({ nombre, empresa, dia, slot }),
  });

exports.sendNdaPdfAccess = ({ nombre, empresa, email, caso, pdfUrl }) =>
  sendEmail({
    from:    FROM,
    to:      email,
    subject: `Acceso PDF bajo NDA - ${caso}`,
    html: templateNdaPdfAccess({ nombre, empresa, caso, pdfUrl }),
  });

exports.sendResearchLetterConfirmacion = ({ nombre, empresa, email }) =>
  sendEmail({
    from:    FROM,
    to:      email,
    subject: 'Solicitud recibida — FABRIC Research Letters',
    html: wrap(`
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label('Research Letters · FABRIC')}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        Solicitud<br/>recibida.
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        Registramos la solicitud de <strong style="color:#2A2A2A;">${escapeHtml(empresa)}</strong> para acceder a FABRIC Research Letters. Validaremos tu perfil en las pr&oacute;ximas 48 horas y recibirás confirmaci&oacute;n en este correo.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dataRow('Empresa', escapeHtml(empresa))}
        ${dataRow('Contacto', escapeHtml(nombre))}
        ${dataRow('Estado', 'En validaci&oacute;n')}
        ${dataRow('Tiempo de respuesta', '48 horas hábiles')}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 40px;">
      <p style="margin:0;font-size:12px;color:#8A8A8A;line-height:1.7;">
        Research Letters es una membres&iacute;a editorial cerrada con an&aacute;lisis quincenal para CFOs y CTOs en evaluaci&oacute;n Oracle. El acceso requiere validaci&oacute;n de perfil corporativo.
      </p>
    </td>
  </tr>`),
  });

exports.sendResearchLetterBienvenida = ({ nombre, empresa, email }) =>
  sendEmail({
    from:    FROM,
    to:      email,
    subject: 'Acceso aprobado — FABRIC Research Letters',
    html: wrap(`
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label('Research Letters · Acceso aprobado')}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        ${escapeHtml(nombre)},<br/>tu acceso<br/>fue aprobado.
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        Aprobamos la solicitud de <strong style="color:#2A2A2A;">${escapeHtml(empresa)}</strong> para FABRIC Research Letters. Recibirás los análisis quincenales directamente en este correo.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dataRow('Empresa', escapeHtml(empresa))}
        ${dataRow('Contacto', escapeHtml(nombre))}
        ${dataRow('Membres&iacute;a', 'Research Letters · Activa')}
        ${dataRow('Frecuencia', 'Quincenal')}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 40px;">
      <p style="margin:0 0 20px;font-size:12px;color:#8A8A8A;line-height:1.7;">
        El próximo an&aacute;lisis llegar&aacute; a este correo. El contenido est&aacute; restringido a uso interno de tu organizaci&oacute;n.
      </p>
      <a href="https://fabricsoft.com.mx"
         style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#0A0A0A;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
        Conocer FABRIC &rarr;
      </a>
    </td>
  </tr>`),
  });

const SEVERITY_LABELS = {
  'BAJO':     { color: '#4ade80', desc: 'Tu implementación presenta señales de estabilidad. Existen oportunidades de optimización pero no hay crisis activa.', accion: 'Conversa con FABRIC sobre optimización y FABRIC OS.' },
  'MODERADO': { color: '#fbbf24', desc: 'Señales de fricción operativa. Sin intervención, los problemas actuales escalarán hacia el próximo cierre contable.', accion: 'FABRIC recomienda diagnóstico técnico en las próximas 4 semanas.' },
  'ALTO':     { color: '#f97316', desc: 'Tu implementación presenta patrones de abandono post go-live. El riesgo operativo es real y documentado.', accion: 'Rescate FABRIC estimado: 8–12 semanas · Inversión típica: USD 150–300K.' },
  'CRÍTICO':  { color: '#ef4444', desc: 'Situación de crisis operativa activa. Tu implementación Oracle requiere intervención inmediata de ingenieros senior.', accion: 'Rescate de emergencia FABRIC: inicio en 72 horas · Inversión típica: USD 200–500K.' },
};

exports.sendRescueAssessmentResultado = ({ nombre, empresa, email, severity, totalScore }) => {
  const s = SEVERITY_LABELS[severity] || SEVERITY_LABELS['ALTO'];
  const nombreSafe  = escapeHtml(nombre);
  const empresaSafe = escapeHtml(empresa || '');

  return sendEmail({
    from:    FROM,
    to:      email,
    subject: `Resultado Oracle Fusion Rescue Assessment — Severidad ${severity} · FABRIC`,
    html: wrap(`
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label('Oracle Fusion Rescue Assessment')}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        Nivel de Severidad:<br/><span style="color:${s.color};font-weight:700;">${severity}</span>
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        ${empresaSafe ? `<strong style="color:#2A2A2A;">${empresaSafe}</strong> — ` : ''}${escapeHtml(s.desc)}
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dataRow('Puntuaci&oacute;n total', `${totalScore} / 36`)}
        ${dataRow('Nivel de severidad', severity)}
        ${empresaSafe ? dataRow('Empresa', empresaSafe) : ''}
        ${dataRow('Contacto', nombreSafe)}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 20px;">
      <div style="background:#F7F5F2;border-left:3px solid ${s.color};padding:16px 20px;">
        <p style="margin:0;font-size:12px;color:#5A5A5A;line-height:1.7;">
          <strong style="color:#2A2A2A;">Acción recomendada:</strong><br/>${escapeHtml(s.accion)}
        </p>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 40px;">
      <a href="https://fabricsoft.com.mx/aplicar"
         style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#0A0A0A;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
        Solicitar evaluaci&oacute;n detallada &rarr;
      </a>
    </td>
  </tr>`),
  });
};

function templateOciAudit({ empresa, cargo, gastoOci }) {
  const empresaSafe = escapeHtml(empresa);
  const cargoSafe   = escapeHtml(cargo);
  const gastoSafe   = escapeHtml(gastoOci);

  const body = `
  <tr>
    <td style="padding:40px 48px 20px;">
      ${label('FABRIC OCI Cost Audit · Diagnóstico gratuito')}
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:300;color:#0A0A0A;line-height:1.2;">
        Solicitud<br/>recibida.
      </h1>
      <p style="margin:0 0 28px;font-size:14px;color:#5A5A5A;line-height:1.8;">
        Registramos la solicitud de diagnóstico OCI para <strong style="color:#2A2A2A;">${empresaSafe}</strong>. Un senior de FABRIC se pondrá en contacto en las próximas <strong style="color:#2A2A2A;">24 horas hábiles</strong> para coordinar el acceso de solo lectura a tu tenant.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${dataRow('Empresa', empresaSafe)}
        ${dataRow('Cargo', cargoSafe)}
        ${dataRow('Gasto OCI estimado', gastoSafe)}
        ${dataRow('Tipo de acceso requerido', 'Solo lectura · Audit role OCI')}
        ${dataRow('Entrega del reporte', '48 – 72 horas tras coordinar acceso')}
        ${dataRow('Cobertura NDA', 'Mutuo · Desde este contacto')}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 48px 20px;">
      <div style="background:#F7F5F2;border-left:3px solid #C9A96E;padding:20px 24px;">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#8A8A8A;">Qué esperar</p>
        <p style="margin:0;font-size:13px;color:#5A5A5A;line-height:1.75;">
          FABRIC analiza tu tenant OCI con acceso de solo lectura. El reporte incluye hallazgos cuantificados en USD por categoría (compute, storage, networking, database, backups) y el ahorro mensual y anual potencial total.<br/><br/>
          El diagnóstico es gratuito y sin compromiso. La ejecución de las optimizaciones se pacta bajo modelo Fixed-Price o Success-Fee si decides continuar.
        </p>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 48px 40px;">
      <p style="margin:0 0 20px;font-size:12px;color:#8A8A8A;line-height:1.7;">
        Si tienes preguntas antes de coordinar el acceso, puedes responder directamente a este correo.
      </p>
      <a href="https://fabricsoft.com.mx/optimizador-oci"
         style="display:inline-block;padding:12px 28px;background:#C9A96E;color:#0A0A0A;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
        Ver detalles del diagnóstico &rarr;
      </a>
    </td>
  </tr>`;

  return wrap(body);
}

exports.sendConfirmacionOciAudit = ({ empresa, cargo, email, gastoOci }) =>
  sendEmail({
    from:    FROM,
    to:      email,
    subject: 'Solicitud OCI Cost Audit recibida — FABRIC Oracle Critical Engineering',
    html:    templateOciAudit({ empresa, cargo, gastoOci }),
  });

exports.sendPaperEntrega = ({ empresa, email, paperId }) => {
  const paperTitle = PAPER_TITLES[paperId] || `Paper ${paperId}`;
  const { ensureSimulatedPaperPdf } = require('../utils/simulatedPaperPdf');
  const pdfPath    = ensureSimulatedPaperPdf(paperId);

  const content = fs.readFileSync(pdfPath);

  return sendEmail({
    from:    FROM,
    to:      email,
    subject: `Paper ${paperId} — ${paperTitle} · FABRIC`,
    html:    templatePaperEntrega({ empresa, paperId, paperTitle }),
    attachments: [{ filename: `FABRIC-Paper-${paperId}.pdf`, content }],
  });
};
