const DiagnosticoOracle = require('../models/model.diagnosticoOracle');
const { log } = require('../services/log.service');

const STATUS_FLOW = ['nuevo', 'en_revision', 'contactado', 'aprobado', 'descartado'];

const QUESTIONS = [
  { id: 1, text: 'Hace cuanto esta implementado tu Oracle Fusion?', options: ['Menos de 3 meses', '3-6 meses', '6-12 meses', 'Mas de 1 ano'] },
  { id: 2, text: 'Cuantos dias toma tu cierre contable mensual actualmente?', options: ['Menos de 5 dias', '5-10 dias', '10-15 dias', 'Mas de 15 dias'] },
  { id: 3, text: 'Cuantos reportes ejecutivos se generan fuera del ERP actualmente?', options: ['0', '1-3', '4-7', 'Mas de 7'] },
  { id: 4, text: 'Cual es el porcentaje aproximado de usuarios clave que realmente usan el sistema?', options: ['>90%', '70-90%', '50-70%', '<50%'] },
  { id: 5, text: 'Cuantas incidencias criticas tienes abiertas?', options: ['0', '1-3', '4-7', 'Mas de 7'] },
  { id: 6, text: 'Cual es el estado de la consultora que implemento?', options: ['Sigue activa', 'Soporte limitado', 'No responde', 'No aplica'] },
  { id: 7, text: 'Tienes patrocinio ejecutivo activo del proyecto?', options: ['CFO + CTO', 'CFO o CTO', 'Solo IT', 'Sin patrocinio'] },
  { id: 8, text: 'Cual es el modulo con mas problemas?', options: ['Financials', 'Procurement', 'SCM', 'HCM', 'Reporting'] },
  { id: 9, text: 'En que industria opera tu empresa?', options: ['Servicios Financieros', 'Inmobiliario', 'Logistica', 'Otro'] },
  { id: 10, text: 'Cual es el revenue anual aproximado de tu empresa?', options: ['< USD 50M', 'USD 50-250M', 'USD 250-500M', '> USD 500M'] },
  { id: 11, text: 'En que plazo deseas remediar la situacion?', options: ['Inmediato (< 3 meses)', 'Corto (3-6 meses)', 'Medio (6-12 meses)', 'No definido'] },
];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[¿?]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, ' ')
    .trim();
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || '';
}

function answerScore(questionId, answer) {
  const question = QUESTIONS.find((item) => item.id === questionId);
  if (!question) return 0;

  const normalizedAnswer = normalizeText(answer);
  const index = question.options.findIndex((option) => normalizeText(option) === normalizedAnswer);

  if (questionId === 8 || questionId === 9) return 0;
  if (questionId === 10) return index === 0 ? 0 : 1;

  return Math.max(index, 0);
}

function canonicalAnswer(question, answer) {
  const normalizedAnswer = normalizeText(answer);
  return question.options.find((option) => normalizeText(option) === normalizedAnswer) || null;
}

function buildResult(answers) {
  const answerMap = answers.reduce((map, item) => {
    map[item.questionId] = item.answer;
    return map;
  }, {});

  const totalScore = answers.reduce((sum, item) => sum + item.score, 0);
  const closing = normalizeText(answerMap[2]);
  const reports = normalizeText(answerMap[3]);
  const adoption = normalizeText(answerMap[4]);
  const incidents = normalizeText(answerMap[5]);
  const consultant = normalizeText(answerMap[6]);

  const patterns = [
    ['4-7', 'mas de 7'].includes(reports) && 'Reportes manuales paralelos',
    ['10-15 dias', 'mas de 15 dias'].includes(closing) && 'Cierre contable >10 dias',
    ['50-70%', '<50%'].includes(adoption) && 'Baja adopcion de usuarios clave',
    ['4-7', 'mas de 7'].includes(incidents) && 'Incidencias criticas abiertas',
    ['soporte limitado', 'no responde'].includes(consultant) && 'Riesgo por consultora anterior',
  ].filter(Boolean);

  if (totalScore >= 20) {
    return {
      totalScore,
      level: 'CRITICO',
      description: 'La implementacion presenta senales de crisis operativa activa.',
      action: 'Rescate FABRIC prioritario en 6-10 semanas.',
      investment: 'USD 200K-500K',
      roi: '6-9 meses',
      pattern: patterns.length ? patterns.join(' + ') : 'Riesgo operativo acumulado',
    };
  }

  if (totalScore >= 13) {
    return {
      totalScore,
      level: 'ALTO',
      description: 'La implementacion presenta senales de abandono post go-live.',
      action: 'Rescate FABRIC en 8-12 semanas.',
      investment: 'USD 150K-300K',
      roi: '6-9 meses',
      pattern: patterns.length ? patterns.join(' + ') : 'Friccion operativa post go-live',
    };
  }

  if (totalScore >= 7) {
    return {
      totalScore,
      level: 'MEDIO',
      description: 'La implementacion muestra friccion operativa que puede escalar en el siguiente cierre.',
      action: 'Diagnostico tecnico senior en las proximas 4 semanas.',
      investment: 'Por definir tras evaluacion',
      roi: 'Variable segun alcance',
      pattern: patterns.length ? patterns.join(' + ') : 'Senales tempranas de friccion',
    };
  }

  return {
    totalScore,
    level: 'BAJO',
    description: 'La implementacion no muestra senales criticas de rescate inmediato.',
    action: 'Optimizacion puntual o revision de estabilidad.',
    investment: 'No aplica a rescate urgente',
    roi: 'No aplica',
    pattern: patterns.length ? patterns.join(' + ') : 'Operacion aparentemente estable',
  };
}

function normalizeAnswers(rawAnswers) {
  if (!rawAnswers || typeof rawAnswers !== 'object' || Array.isArray(rawAnswers)) {
    throw new Error('Las respuestas del diagnostico son obligatorias.');
  }

  return QUESTIONS.map((question) => {
    const rawAnswer = rawAnswers[question.id] || rawAnswers[String(question.id)];
    const answer = canonicalAnswer(question, rawAnswer);

    if (!answer) {
      throw new Error(`Respuesta invalida o faltante en la pregunta ${question.id}.`);
    }

    return {
      questionId: question.id,
      question: question.text,
      answer,
      score: answerScore(question.id, answer),
    };
  });
}

function validateContact(contact = {}) {
  const name = String(contact.name || '').trim();
  const role = String(contact.role || '').trim();
  const email = String(contact.email || '').trim().toLowerCase();
  const company = String(contact.company || '').trim();
  const phone = String(contact.phone || '').trim();
  const publicEmail = /(gmail|hotmail|outlook|yahoo|icloud|live)\./i.test(email);
  const cLevelRole = /(cfo|cio|cto|ceo|director|vp|presidente|finanzas|tecnolog|operaciones|coo)/i.test(role);

  if (!name || !role || !email || !company) {
    throw new Error('Completa nombre, cargo, empresa y email corporativo.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || publicEmail) {
    throw new Error('Usa un email corporativo valido.');
  }

  if (!cLevelRole) {
    throw new Error('El diagnostico esta reservado para direccion ejecutiva o liderazgo equivalente.');
  }

  return {
    name: name.slice(0, 120),
    role: role.slice(0, 120),
    email: email.slice(0, 180),
    company: company.slice(0, 160),
    phone: phone.slice(0, 60),
  };
}

function validateCaptcha(body) {
  const captchaA = Number(body.captcha?.a);
  const captchaB = Number(body.captcha?.b);
  const captchaAnswer = Number(body.captchaAnswer);

  if (!Number.isInteger(captchaA) || !Number.isInteger(captchaB) || captchaA < 2 || captchaB < 2) {
    throw new Error('La validacion de seguridad no es valida.');
  }

  if (captchaA + captchaB !== captchaAnswer) {
    throw new Error('La validacion de seguridad no coincide.');
  }
}

function canMoveStatus(currentStatus, nextStatus) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const nextIndex = STATUS_FLOW.indexOf(nextStatus);

  if (currentIndex === -1 || nextIndex === -1) return false;
  return nextIndex >= currentIndex;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDiagnosticEmail(diagnostico) {
  const contact = diagnostico.contact || {};
  const result = diagnostico.result || {};
  const answers = Array.isArray(diagnostico.answers) ? diagnostico.answers : [];
  const subject = `Diagnostico Oracle FABRIC - ${contact.company || 'Solicitud'}`;
  const answerLines = answers
    .map((item) => `- ${item.question}: ${item.answer}`)
    .join('\n');

  const text = [
    `Hola ${contact.name || ''},`,
    '',
    'Gracias por completar el diagnostico ejecutivo de FABRIC.',
    '',
    `Nivel detectado: ${result.level || 'Por revisar'}`,
    `Score tecnico: ${result.totalScore ?? 0}`,
    `Patron principal: ${result.pattern || 'No detectado'}`,
    `Accion recomendada: ${result.action || 'Revision senior'}`,
    `Inversion tipica: ${result.investment || 'Por definir'}`,
    `ROI esperado: ${result.roi || 'Por definir'}`,
    '',
    'Resumen:',
    result.description || 'El caso requiere evaluacion senior para confirmar alcance y viabilidad.',
    '',
    'Respuestas capturadas:',
    answerLines,
    '',
    'Este diagnostico es orientativo y no sustituye una evaluacion tecnica formal, un SOW ni una propuesta comercial.',
    '',
    'FABRIC',
  ].join('\n');

  const htmlAnswers = answers
    .map((item) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#a1a1aa;">${escapeHtml(item.question)}</td>
        <td style="padding:10px;border-bottom:1px solid #2a2a2a;color:#f4f4f5;font-weight:600;">${escapeHtml(item.answer)}</td>
      </tr>
    `)
    .join('');

  const html = `
    <div style="margin:0;padding:0;background:#050505;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:720px;margin:0 auto;padding:32px 20px;">
        <div style="border:1px solid #2a2a2a;background:#0a0a0a;padding:28px;">
          <p style="margin:0 0 10px;color:#c9a96e;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">FABRIC Rescue Diagnostic</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">Diagnostico Oracle</h1>
          <p style="margin:0 0 24px;color:#a1a1aa;line-height:1.6;">Hola ${escapeHtml(contact.name)}, gracias por completar el diagnostico ejecutivo de FABRIC.</p>

          <div style="border:1px solid #2a2a2a;background:#111214;padding:18px;margin-bottom:18px;">
            <div style="font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.14em;">Nivel detectado</div>
            <div style="font-size:34px;line-height:1;color:#c9a96e;margin-top:8px;">${escapeHtml(result.level)}</div>
            <div style="font-size:13px;color:#a1a1aa;margin-top:10px;">Score tecnico: ${Number(result.totalScore || 0)}</div>
          </div>

          <table style="width:100%;border-collapse:collapse;border:1px solid #2a2a2a;margin-bottom:20px;">
            <tr>
              <td style="padding:12px;color:#71717a;border-bottom:1px solid #2a2a2a;">Patron principal</td>
              <td style="padding:12px;color:#f4f4f5;border-bottom:1px solid #2a2a2a;">${escapeHtml(result.pattern)}</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#71717a;border-bottom:1px solid #2a2a2a;">Accion recomendada</td>
              <td style="padding:12px;color:#f4f4f5;border-bottom:1px solid #2a2a2a;">${escapeHtml(result.action)}</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#71717a;border-bottom:1px solid #2a2a2a;">Inversion tipica</td>
              <td style="padding:12px;color:#c9a96e;border-bottom:1px solid #2a2a2a;">${escapeHtml(result.investment)}</td>
            </tr>
            <tr>
              <td style="padding:12px;color:#71717a;">ROI esperado</td>
              <td style="padding:12px;color:#f4f4f5;">${escapeHtml(result.roi)}</td>
            </tr>
          </table>

          <p style="color:#a1a1aa;line-height:1.6;">${escapeHtml(result.description)}</p>

          <h2 style="font-size:16px;margin:24px 0 12px;">Respuestas capturadas</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #2a2a2a;">${htmlAnswers}</table>

          <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.6;">Este diagnostico es orientativo y no sustituye una evaluacion tecnica formal, un SOW ni una propuesta comercial.</p>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html };
}

function diagnosticFileName(diagnostico) {
  const company = String(diagnostico.contact?.company || 'prospecto')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `diagnostico-oracle-${company || 'prospecto'}.doc`;
}

function buildDiagnosticWordDocument(diagnostico) {
  const contact = diagnostico.contact || {};
  const result = diagnostico.result || {};
  const answers = Array.isArray(diagnostico.answers) ? diagnostico.answers : [];
  const answerRows = answers
    .map((item) => `
      <tr>
        <td style="border:1px solid #d9d9d9;padding:8px;">${escapeHtml(item.question)}</td>
        <td style="border:1px solid #d9d9d9;padding:8px;"><strong>${escapeHtml(item.answer)}</strong></td>
        <td style="border:1px solid #d9d9d9;padding:8px;text-align:center;">+${Number(item.score || 0)}</td>
      </tr>
    `)
    .join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>Diagnostico Oracle FABRIC</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111111; line-height: 1.45; }
          h1 { color: #111111; font-size: 28px; margin-bottom: 4px; }
          h2 { color: #222222; font-size: 18px; margin-top: 24px; border-bottom: 1px solid #cccccc; padding-bottom: 6px; }
          .muted { color: #666666; font-size: 12px; }
          .summary { border: 1px solid #d9d9d9; padding: 14px; margin: 18px 0; background: #f7f7f7; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th { border: 1px solid #d9d9d9; padding: 8px; background: #eeeeee; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Diagnostico Oracle FABRIC</h1>
        <p class="muted">Documento ejecutivo generado desde el panel administrativo FABRIC.</p>

        <h2>Prospecto</h2>
        <p><strong>Empresa:</strong> ${escapeHtml(contact.company)}</p>
        <p><strong>Contacto:</strong> ${escapeHtml(contact.name)}</p>
        <p><strong>Cargo:</strong> ${escapeHtml(contact.role)}</p>
        <p><strong>Email:</strong> ${escapeHtml(contact.email)}</p>
        <p><strong>Telefono:</strong> ${escapeHtml(contact.phone || 'No capturado')}</p>

        <h2>Resultado tecnico</h2>
        <div class="summary">
          <p><strong>Nivel:</strong> ${escapeHtml(result.level)}</p>
          <p><strong>Score tecnico:</strong> ${Number(result.totalScore || 0)}</p>
          <p><strong>Patron principal:</strong> ${escapeHtml(result.pattern)}</p>
          <p><strong>Accion recomendada:</strong> ${escapeHtml(result.action)}</p>
          <p><strong>Inversion tipica:</strong> ${escapeHtml(result.investment)}</p>
          <p><strong>ROI esperado:</strong> ${escapeHtml(result.roi)}</p>
        </div>
        <p>${escapeHtml(result.description)}</p>

        <h2>Preguntas y respuestas</h2>
        <table>
          <thead>
            <tr>
              <th>Pregunta</th>
              <th>Respuesta</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>${answerRows}</tbody>
        </table>

        <p class="muted">Este diagnostico es orientativo y no sustituye una evaluacion tecnica formal, un SOW ni una propuesta comercial.</p>
      </body>
    </html>
  `;
}

async function sendDiagnosticEmail(diagnostico, options = {}) {
  const defaultEmail = buildDiagnosticEmail(diagnostico);
  const subject = String(options.subject || defaultEmail.subject).trim().slice(0, 180);
  const text = String(options.message || defaultEmail.text).trim().slice(0, 5000);
  const html = options.message
    ? `<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111111;white-space:pre-wrap;">${escapeHtml(text)}</div>`
    : defaultEmail.html;
  const intendedTo = diagnostico.contact?.email;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DIAGNOSTIC_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'FABRIC <onboarding@resend.dev>';
  const wordContent = buildDiagnosticWordDocument(diagnostico);

  // Sin dominio verificado, Resend solo entrega al email dueño de la cuenta.
  // DEV_REDIRECT_EMAIL activa la redirección; en producción (dominio verificado) se deja vacío.
  const redirectTo = process.env.DEV_REDIRECT_EMAIL || '';
  const to = redirectTo || intendedTo;
  const finalSubject = redirectTo && redirectTo !== intendedTo
    ? `[PRUEBA → ${intendedTo}] ${subject}`
    : subject;

  if (!apiKey) {
    throw new Error('Falta RESEND_API_KEY para enviar correos automaticos con documento Word.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: finalSubject,
      html,
      text,
      attachments: [
        {
          filename: diagnosticFileName(diagnostico),
          content: Buffer.from(wordContent, 'utf8').toString('base64'),
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || data.error || `Email HTTP ${response.status}`;
    throw new Error(message);
  }

  return {
    emailStatus: 'sent',
    providerId: data.id || '',
    subject,
    text,
  };
}

exports.crearDiagnostico = async (req, res) => {
  try {
    if (String(req.body.honeypot || '').trim()) {
      return res.status(200).json({ success: true, ignored: true });
    }

    if (!req.body.authorized) {
      return res.status(400).json({ error: 'Se requiere autorizacion para procesar los datos.' });
    }

    validateCaptcha(req.body);

    const contact = validateContact(req.body.contact);
    const answers = normalizeAnswers(req.body.answers);
    const result = buildResult(answers);

    const diagnostico = await DiagnosticoOracle.create({
      contact,
      answers,
      result,
      authorized: true,
      status: 'nuevo',
      ip: getClientIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 260),
    });

    log({
      accion: `CREATE - Diagnostico Oracle - ${diagnostico.contact?.company}`,
      categoria: 'Sistema',
      autor: 'system',
      status: 'OK',
      detalle: `${diagnostico.contact?.name} - Score: ${result.totalScore}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Diagnostico recibido correctamente.',
      id: diagnostico._id,
      result,
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || 'No se pudo guardar el diagnostico.',
    });
  }
};

exports.obtenerDiagnosticos = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 160, 20), 250);
    const diagnosticos = await DiagnosticoOracle.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      diagnosticos,
    });
  } catch (error) {
    console.error('Error obteniendo diagnosticos Oracle:', error);
    return res.status(500).json({ error: 'No se pudieron obtener los diagnosticos.' });
  }
};

exports.actualizarDiagnostico = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const status = String(req.body.status || '').trim();
    const allowed = STATUS_FLOW;

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Estado invalido.' });
    }

    const current = await DiagnosticoOracle.findById(req.params.id).lean();

    if (!current) {
      return res.status(404).json({ error: 'Diagnostico no encontrado.' });
    }

    if (!canMoveStatus(current.status, status)) {
      return res.status(400).json({
        error: 'No se puede regresar el diagnostico a un estado anterior.',
      });
    }

    const diagnostico = await DiagnosticoOracle.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnostico no encontrado.' });
    }

    log({
      accion: `UPDATE - Diagnostico Oracle - ${diagnostico.contact?.company}`,
      categoria: 'Sistema',
      autor: req.auth?.claims?.email || 'admin',
      status: 'OK',
      detalle: `Estado cambiado a: ${status}`,
    });

    return res.status(200).json({
      success: true,
      diagnostico,
    });
  } catch (error) {
    console.error('Error actualizando diagnostico Oracle:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el diagnostico.' });
  }
};

exports.enviarDiagnostico = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const current = await DiagnosticoOracle.findById(req.params.id).lean();

    if (!current) {
      return res.status(404).json({ error: 'Diagnostico no encontrado.' });
    }

    if (!['en_revision', 'contactado', 'aprobado'].includes(current.status)) {
      return res.status(400).json({
        error: 'Primero marca el diagnostico como En revision, Contactado o Aprobado.',
      });
    }

    const emailResult = await sendDiagnosticEmail(current, {
      subject: req.body?.subject,
      message: req.body?.message,
    });
    const sentAt = emailResult.emailStatus === 'sent' ? new Date() : current.emailSentAt || null;
    const nextStatus = emailResult.emailStatus === 'sent' && current.status === 'en_revision'
      ? 'contactado'
      : current.status;

    const diagnostico = await DiagnosticoOracle.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: nextStatus,
          emailStatus: emailResult.emailStatus,
          emailSentAt: sentAt,
          emailError: '',
        },
      },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    log({
      accion: `SEND - Diagnostico Oracle - ${diagnostico.contact?.company}`,
      categoria: 'Sistema',
      autor: req.auth?.claims?.email || 'admin',
      status: 'OK',
      detalle: `Correo enviado a ${diagnostico.contact?.email}`,
    });

    return res.status(200).json({
      success: true,
      diagnostico,
      emailStatus: emailResult.emailStatus,
    });
  } catch (error) {
    console.error('Error enviando diagnostico Oracle:', error);

    const diagnostico = await DiagnosticoOracle.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          emailStatus: 'failed',
          emailError: String(error.message || 'No se pudo enviar el diagnostico.').slice(0, 260),
        },
      },
      { returnDocument: 'after', runValidators: true }
    ).lean().catch(() => null);

    return res.status(502).json({
      error: 'No se pudo enviar el diagnostico al correo.',
      diagnostico,
    });
  }
};

exports.eliminarDiagnostico = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const diagnostico = await DiagnosticoOracle.findByIdAndDelete(req.params.id).lean();

    if (!diagnostico) {
      return res.status(404).json({ error: 'Diagnostico no encontrado.' });
    }

    log({
      accion: `DELETE - Diagnostico Oracle - ${diagnostico.contact?.company}`,
      categoria: 'Sistema',
      autor: req.auth?.claims?.email || 'admin',
      status: 'WARN',
      detalle: `Diagnostico de ${diagnostico.contact?.name} eliminado`,
    });

    return res.status(200).json({
      success: true,
      deletedId: req.params.id,
    });
  } catch (error) {
    console.error('Error eliminando diagnostico Oracle:', error);
    return res.status(500).json({ error: 'No se pudo eliminar el diagnostico.' });
  }
};
