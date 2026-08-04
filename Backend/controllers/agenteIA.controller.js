const AgenteIA = require('../models/model.agenteIA');
const AgenteLead = require('../models/model.agenteLead');
const { parseKnowledgeFile } = require('../utils/agenteIA.fileParser');

const DEFAULT_CONFIG = {
  prompt: `Eres el agente publico de FABRIC.
Respondes en la parte publica del sitio.
Tu trabajo es orientar a CFOs, CTOs y ejecutivos con iniciativas Oracle.
Responde claro, breve y con criterio senior, sin sonar academico.
No prometas resultados sin evaluacion.
Si el caso parece viable, invita a iniciar admision.
Si falta informacion, pregunta industria, revenue, urgencia y sistema actual.
Tu voz debe sonar como consultor senior: sobria, directa, humana y comercialmente util.
Explica con palabras simples que significan algo para negocio: riesgo, cierre, adopcion, costo, tiempo y siguiente paso.`,
  files: [],
  knowledgeFile: null,
  llmChain: [
    { provider: 'openai', model: 'gpt-4o' },
    { provider: 'claude', model: 'claude-3.5-sonnet' },
    { provider: 'grok', model: 'grok-2' },
  ],
  temperature: 32,
  status: 'active',
};

const VALID_PROVIDERS = ['openai', 'claude', 'grok'];
const MAX_CONTEXT_CHARS = 9000;
const MAX_FILE_CHARS = 60000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARS = 2400;
const MAX_LEAD_MESSAGES = 12;
const MIN_SCORE_TO_SAVE = 80;
const REQUEST_TIMEOUT_MS = 10000;
const LEAD_STATUS_ORDER = ['nuevo', 'calificado', 'aplico', 'abandonado', 'descartado'];

function normalizePayload(body) {
  const prompt = String(body.prompt || '').trim();
  const rawFiles = Array.isArray(body.files)
    ? body.files.map((file) => String(file).trim()).filter(Boolean)
    : [];
  const files = rawFiles.slice(0, 1);
  const llmChain = Array.isArray(body.llmChain) ? body.llmChain : [];
  const temperature = Number(body.temperature);
  const rawFile = body.knowledgeFile && typeof body.knowledgeFile === 'object'
    ? body.knowledgeFile
    : null;

  const knowledgeFile = rawFile?.content
    ? {
        name: String(rawFile.name || files[0] || 'archivo.txt').trim(),
        mimeType: String(rawFile.mimeType || 'text/plain').trim(),
        size: Number(rawFile.size || 0),
        content: String(rawFile.content || '').slice(0, MAX_FILE_CHARS),
      }
    : null;

  return {
    prompt,
    rawFilesCount: rawFiles.length,
    files,
    knowledgeFile,
    llmChain,
    temperature: Number.isFinite(temperature) ? temperature : 32,
  };
}

function validatePayload(payload) {
  if (!payload.prompt || payload.prompt.length < 10) {
    return 'El prompt es obligatorio y debe tener al menos 10 caracteres.';
  }

  if (!Array.isArray(payload.llmChain) || payload.llmChain.length !== 3) {
    return 'Debes configurar 3 modelos en la cadena IA.';
  }

  const invalidModel = payload.llmChain.find((item) => {
    return !VALID_PROVIDERS.includes(item.provider) || !String(item.model || '').trim();
  });

  if (invalidModel) {
    return 'Cada IA debe tener proveedor y modelo valido.';
  }

  if (payload.temperature < 0 || payload.temperature > 100) {
    return 'La temperatura debe estar entre 0 y 100.';
  }

  if (payload.rawFilesCount > 1) {
    return 'Solo se permite un archivo de conocimiento.';
  }

  if (payload.knowledgeFile?.size > MAX_FILE_BYTES) {
    return 'El archivo debe pesar menos de 2 MB.';
  }

  if (payload.knowledgeFile?.content?.length > MAX_FILE_CHARS) {
    return 'El contenido del archivo supera el limite permitido.';
  }

  return null;
}

function providerApiKey(provider) {
  if (provider === 'openai') return process.env.OPENAI_API_KEY;
  if (provider === 'claude') return process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (provider === 'grok') return process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  return null;
}

function normalizedTemperature(value) {
  return Math.max(0, Math.min(1, Number(value || 32) / 100));
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  let totalChars = 0;

  return history
    .filter((item) => item && ['user', 'agent'].includes(item.role))
    .slice(-MAX_HISTORY_MESSAGES)
    .reverse()
    .reduce((items, item) => {
      const text = String(item.text || '').trim().slice(0, 700);

      if (!text) return items;
      if (totalChars + text.length > MAX_HISTORY_CHARS) return items;

      totalChars += text.length;
      items.unshift({
        role: item.role,
        text,
      });

      return items;
    }, []);
}

function toOpenAiMessages(systemPrompt, history, message) {
  return [
    { role: 'system', content: systemPrompt },
    ...history.map((item) => ({
      role: item.role === 'agent' ? 'assistant' : 'user',
      content: item.text,
    })),
    { role: 'user', content: message },
  ];
}

function toClaudeMessages(history, message) {
  return [
    ...history.map((item) => ({
      role: item.role === 'agent' ? 'assistant' : 'user',
      content: item.text,
    })),
    { role: 'user', content: message },
  ];
}

function wordsFrom(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);
}

function detectIntent(text) {
  const normalized = wordsFrom(text).join(' ');

  if (/(precio|costo|cotizacion|cuanto|presupuesto|fee|tarifa)/i.test(normalized)) return 'pricing';
  if (/(aplicar|admision|admission|diagnostico|agenda|contactar|llamada)/i.test(normalized)) return 'admision';
  if (/(migracion|migrar|sap|ebs|r12|s4|s\/4)/i.test(normalized)) return 'migracion';
  if (/(greenfield|nuevo|implementar desde cero|arrancar oracle)/i.test(normalized)) return 'greenfield';
  if (/(fallando|rescate|detenida|bloqueado|bloqueada|go live|cierre|manual|incidencia|estabilizacion)/i.test(normalized)) return 'rescate_oracle';
  if (/(soporte|post go live|postgo|adopcion|usuarios|operacion)/i.test(normalized)) return 'soporte_post_go_live';
  if (!/(oracle|fusion|erp|sap|ebs|finanzas|contable|cierre|migracion|implementacion|adopcion|sistema)/i.test(normalized)) return 'fuera_de_tema';

  return 'desconocido';
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function extractFirstMatch(text, patterns, fallback) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().slice(0, 90);
  }

  return fallback;
}

function analyzeLead({ message, history = [], reply = '' }) {
  const transcript = [...history.map((item) => item.text), message].join('\n');
  const text = transcript.toLowerCase();
  const intent = detectIntent(transcript);

  const currentSystem = extractFirstMatch(transcript, [
    /\b(oracle fusion|fusion cloud|oracle ebs|ebs r12|sap s\/4hana|sap s4hana|sap|netsuite|erp legacy)\b/i,
    /sistema actual(?: es|:)?\s*([a-z0-9\s/-]{3,60})/i,
    /usamos\s+([a-z0-9\s/-]{3,60})/i,
  ], 'No detectado');

  const estimatedRevenue = extractFirstMatch(transcript, [
    /\b(?:usd|mxn|us\$)\s?([\d,.]+\s?(?:m|mm|millones|k))\b/i,
    /\brevenue(?: aproximado)?(?: es|:)?\s*([a-z0-9\s$,.]{3,60})/i,
    /\bfactura(?:mos|cion)?(?: es|:)?\s*([a-z0-9\s$,.]{3,60})/i,
  ], 'No detectado');

  const company = extractFirstMatch(transcript, [
    /\bempresa(?: es|:)?\s*([a-z0-9\s.&-]{3,70})/i,
    /\bcompania(?: es|:)?\s*([a-z0-9\s.&-]{3,70})/i,
    /\bsomos\s+([a-z0-9\s.&-]{3,70})/i,
  ], 'No detectada');

  const industry = extractFirstMatch(transcript, [
    /\bindustria(?: es|:)?\s*([a-z0-9\s/-]{3,60})/i,
    /\bsector(?: es|:)?\s*([a-z0-9\s/-]{3,60})/i,
  ], includesAny(text, [/banco|financier|fintech/]) ? 'Financiero'
    : includesAny(text, [/inmobili|real estate/]) ? 'Inmobiliario'
      : includesAny(text, [/logistic|transporte|supply/]) ? 'Logistica'
        : 'No detectada');

  const urgency = includesAny(text, [/urgente|esta semana|este mes|ya|critico|crítico|parado|detenido|board|cierre mensual/])
    ? 'Alta'
    : includesAny(text, [/trimestre|q[1-4]|proximo mes|próximo mes/])
      ? 'Media'
      : 'No detectada';

  const painPoint = includesAny(text, [/cierre|manual|excel|conciliacion|conciliación/])
    ? 'Cierre/operacion manual fuera del ERP'
    : includesAny(text, [/detenido|bloqueado|fallando|incidencia|rescate/])
      ? 'Proyecto bloqueado o inestable'
      : includesAny(text, [/migrar|migracion|migración/])
        ? 'Migracion con control de riesgo'
        : 'No detectado';

  let score = 12;
  if (intent !== 'fuera_de_tema' && intent !== 'desconocido') score += 18;
  if (/(oracle|fusion|ebs|sap|erp)/i.test(text)) score += 18;
  if (currentSystem !== 'No detectado') score += 12;
  if (estimatedRevenue !== 'No detectado') score += 14;
  if (urgency !== 'No detectada') score += 12;
  if (painPoint !== 'No detectado') score += 14;
  if (/(aplicar|admision|diagnostico|agenda|precio|cotizacion|contactar)/i.test(text)) score += 10;
  if (intent === 'fuera_de_tema') score = Math.min(score, 25);

  score = Math.max(0, Math.min(100, score));

  const pendingQuestions = [];
  if (currentSystem === 'No detectado') pendingQuestions.push('Sistema actual');
  if (urgency === 'No detectada') pendingQuestions.push('Urgencia');
  if (estimatedRevenue === 'No detectado') pendingQuestions.push('Revenue aproximado');
  if (industry === 'No detectada') pendingQuestions.push('Industria');

  const fabricFit = score >= 86 ? 'alto' : score >= MIN_SCORE_TO_SAVE ? 'medio' : score >= 40 ? 'bajo' : 'pendiente';
  const ctaType = score >= 86 ? 'apply' : score >= MIN_SCORE_TO_SAVE ? 'schedule' : 'none';
  const nextStep = ctaType === 'apply'
    ? 'Iniciar admision'
    : ctaType === 'schedule'
      ? 'Agendar diagnostico'
      : ctaType === 'send_case'
        ? 'Enviar caso a FABRIC'
        : 'Continuar calificacion';

  return {
    score,
    intent,
    urgency,
    estimatedRevenue,
    company,
    industry,
    currentSystem,
    painPoint,
    fabricFit,
    summary: buildLeadSummary({ intent, currentSystem, estimatedRevenue, urgency, painPoint, industry, reply }),
    nextStep,
    pendingQuestions: pendingQuestions.slice(0, 3),
    ctaType,
  };
}

function buildLeadSummary({ intent, currentSystem, estimatedRevenue, urgency, painPoint, industry, reply }) {
  const parts = [
    `Intencion: ${intent}.`,
    `Sistema: ${currentSystem}.`,
    `Industria: ${industry}.`,
    `Revenue: ${estimatedRevenue}.`,
    `Urgencia: ${urgency}.`,
    `Dolor: ${painPoint}.`,
  ];

  if (reply) parts.push(`Ultima respuesta: ${String(reply).slice(0, 220)}`);

  return parts.join(' ');
}

function shouldPersistLead(analysis) {
  return analysis.score >= MIN_SCORE_TO_SAVE;
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || '';
}

function publicCtaFromAnalysis(analysis) {
  if (analysis.ctaType === 'apply') return { type: 'apply', label: 'Iniciar admision', href: '/aplicar' };
  if (analysis.ctaType === 'schedule') return { type: 'schedule', label: 'Agendar diagnostico', href: '/aplicar' };
  if (analysis.ctaType === 'send_case') return { type: 'send_case', label: 'Enviar caso a FABRIC', href: '/aplicar' };
  return null;
}

function leadStatusFromAnalysis(analysis) {
  if (analysis.ctaType === 'apply') return 'calificado';
  if (analysis.score >= MIN_SCORE_TO_SAVE) return 'nuevo';
  return 'abandonado';
}

function canMoveLeadStatus(currentStatus, nextStatus) {
  const currentIndex = LEAD_STATUS_ORDER.indexOf(currentStatus);
  const nextIndex = LEAD_STATUS_ORDER.indexOf(nextStatus);

  if (currentIndex === -1 || nextIndex === -1) return false;
  return nextIndex >= currentIndex;
}

async function saveQualifiedLead({ req, sessionId, history, message, reply, analysis }) {
  if (!sessionId || !shouldPersistLead(analysis)) return null;

  const conversation = [
    ...history,
    { role: 'user', text: message },
    { role: 'agent', text: reply },
  ]
    .filter((item) => item?.text)
    .slice(-MAX_LEAD_MESSAGES)
    .map((item) => ({
      role: item.role,
      text: String(item.text).slice(0, 1200),
    }));

  return AgenteLead.findOneAndUpdate(
    { sessionId },
    {
      $set: {
        ...analysis,
        status: leadStatusFromAnalysis(analysis),
        conversation,
        lastQuestion: message.slice(0, 800),
        ip: getClientIp(req),
        userAgent: String(req.headers['user-agent'] || '').slice(0, 260),
        lastSeenAt: new Date(),
      },
      $setOnInsert: {
        sessionId,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      runValidators: true,
    }
  ).lean();
}

function relevantKnowledgeContext(message, knowledgeFile) {
  if (!shouldUseKnowledgeFile(message, knowledgeFile)) return '';

  const queryWords = new Set(wordsFrom(message));
  const chunks = String(knowledgeFile.content || '')
    .split(/\n{2,}|(?=Hoja:\s)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => chunk.slice(0, 1600));

  const selected = chunks
    .map((chunk) => {
      const chunkWords = wordsFrom(chunk);
      const score = chunkWords.reduce((sum, word) => sum + (queryWords.has(word) ? 1 : 0), 0);
      return { chunk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.chunk);

  const fallback = chunks.slice(0, 2);
  const context = (selected.length ? selected : fallback).join('\n\n---\n\n').slice(0, MAX_CONTEXT_CHARS);

  return context
    ? `\n\nFragmentos relevantes del archivo "${knowledgeFile.name}":\n${context}`
    : '';
}

function shouldUseKnowledgeFile(message, knowledgeFile) {
  if (!knowledgeFile?.content) return false;

  const text = message.toLowerCase();
  return [
    'archivo',
    'documento',
    'politica',
    'contrato',
    'criterio',
    'admision',
    'precio',
    'caso',
    'oracle',
    'office hours',
    'modelo',
    'engagement',
    'alcance',
    'sow',
    'nda',
    'documentacion',
    'documentación',
  ].some((keyword) => text.includes(keyword));
}

function buildSystemPrompt(agente, message, history = []) {
  const guardrails = `Reglas obligatorias de voz y captacion:
- Habla como un asesor senior de FABRIC, no como robot, chatbot, modelo ni IA.
- Nunca menciones entrenamiento, prompts, archivos internos, modelos, proveedores, API keys ni configuracion tecnica.
- Mantente dentro del contexto FABRIC, Oracle, admision, diagnostico, Office Hours y servicios relacionados.
- Usa la memoria reciente: no repitas preguntas que el usuario ya contesto, continua desde el ultimo dato confirmado y reconoce el contexto sin decir "como mencionaste" demasiadas veces.
- Si el usuario se sale del tema, no lo reganes: reconoce brevemente y vuelve a una pregunta util sobre su iniciativa Oracle o situacion operativa.
- No inventes precios, promesas, resultados, clientes, certificaciones ni garantias.
- No uses formato academico, definiciones largas, listas extensas ni titulares como "Patron detectado", "Escenario" o "Analisis".
- Estructura ideal: 1 frase que entienda el problema, 1 frase que diga por que importa, 1 pregunta concreta para avanzar.
- No abras demasiadas preguntas. Pide solo 1 dato clave por respuesta; maximo 2 si el usuario ya dio buen contexto.
- Prioriza velocidad y claridad: 2 a 4 frases, parrafos cortos, palabras simples.
- Si el caso suena viable, guia hacia admision sin presionar: "vale la pena revisarlo en admision" o "podemos evaluarlo con mas detalle".
- Si el caso esta incompleto, pide el dato que mas falta ahora: industria, revenue aproximado, urgencia, sistema actual o bloqueo principal.
- Si el usuario pregunta precio, explica que depende de alcance y pide sistema actual + urgencia antes de hablar de rangos.
- Si el usuario pide algo fuera de FABRIC, responde con tacto y redirige hacia el objetivo de evaluacion.`;

  const memoryContext = history.length
    ? `\n\nMemoria reciente de la conversacion, usala solo para continuidad y no la repitas literalmente:\n${history
        .map((item) => `${item.role === 'agent' ? 'FABRIC' : 'Usuario'}: ${item.text}`)
        .join('\n')}`
    : '';

  const fileContext = relevantKnowledgeContext(message, agente.knowledgeFile);

  return `${agente.prompt}\n\n${guardrails}${memoryContext}${fileContext}`;
}

function polishReply(reply) {
  const cleaned = String(reply || '')
    .replace(/\bcomo (modelo|ia|inteligencia artificial|asistente virtual)[^,.]*[,.]?\s*/gi, '')
    .replace(/\b(OpenAI|Claude|Grok|GPT[-\w. ]*|Anthropic|xAI)\b/gi, 'FABRIC')
    .replace(/\b(prompt|entrenamiento|training|api key|api|configuracion tecnica|configuración técnica)\b/gi, 'criterio interno')
    .replace(/^\s*(patron detectado|patrÃ³n detectado|escenario|analisis|anÃ¡lisis)\s*:\s*/gim, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return compactHumanReply(cleaned);
}

function compactHumanReply(reply) {
  const lines = String(reply || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 4) {
    return lines.slice(0, 4).join('\n');
  }

  return lines.join('\n');
}

async function postJson(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error?.message || data.error || data.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAI({ model, systemPrompt, message, temperature, history }) {
  const apiKey = providerApiKey('openai');
  if (!apiKey) throw new Error('Falta OPENAI_API_KEY');

  const data = await postJson('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 260,
      messages: toOpenAiMessages(systemPrompt, history, message),
    }),
  });

  return data.choices?.[0]?.message?.content?.trim();
}

async function callGrok({ model, systemPrompt, message, temperature, history }) {
  const apiKey = providerApiKey('grok');
  if (!apiKey) throw new Error('Falta GROK_API_KEY o XAI_API_KEY');

  const data = await postJson('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 260,
      messages: toOpenAiMessages(systemPrompt, history, message),
    }),
  });

  return data.choices?.[0]?.message?.content?.trim();
}

async function callClaude({ model, systemPrompt, message, temperature, history }) {
  const apiKey = providerApiKey('claude');
  if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY o CLAUDE_API_KEY');

  const data = await postJson('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      temperature,
      max_tokens: 260,
      messages: toClaudeMessages(history, message),
    }),
  });

  return data.content?.[0]?.text?.trim();
}

async function callProvider({ provider, model, systemPrompt, message, temperature, history }) {
  if (provider === 'openai') {
    return callOpenAI({ model, systemPrompt, message, temperature, history });
  }

  if (provider === 'claude') {
    return callClaude({ model, systemPrompt, message, temperature, history });
  }

  if (provider === 'grok') {
    return callGrok({ model, systemPrompt, message, temperature, history });
  }

  throw new Error(`Proveedor no soportado: ${provider}`);
}

async function generarRespuestaAgente(agente, message, rawHistory = []) {
  const history = normalizeHistory(rawHistory);
  const systemPrompt = buildSystemPrompt(agente, message, history);
  const temperature = normalizedTemperature(agente.temperature);
  const attempts = [];

  for (const item of agente.llmChain || []) {
    try {
      const reply = await callProvider({
        provider: item.provider,
        model: item.model,
        systemPrompt,
        message,
        temperature,
        history,
      });

      if (reply) {
        return {
          reply: polishReply(reply),
          usedConfig: {
            provider: item.provider,
            model: item.model,
            temperature: agente.temperature,
            usedKnowledgeFile: shouldUseKnowledgeFile(message, agente.knowledgeFile),
            memoryMessages: history.length,
          },
          attempts,
        };
      }

      attempts.push({ provider: item.provider, model: item.model, error: 'Respuesta vacia' });
    } catch (error) {
      attempts.push({ provider: item.provider, model: item.model, error: error.message });
    }
  }

  const error = new Error('Ningun proveedor IA respondio correctamente.');
  error.attempts = attempts;
  throw error;
}

exports.obtenerConfiguracion = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const config = await AgenteIA.findOne({ ownerClerkId }).lean();

    return res.status(200).json({
      success: true,
      agente: config || DEFAULT_CONFIG,
    });
  } catch (error) {
    console.error('Error obteniendo agente IA:', error);
    return res.status(500).json({ error: 'No se pudo obtener la configuracion del agente.' });
  }
};

exports.guardarConfiguracion = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const payload = normalizePayload(req.body);
    const validationError = validatePayload(payload);

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const agente = await AgenteIA.findOneAndUpdate(
      { ownerClerkId },
      {
        $set: {
          ownerClerkId,
          prompt: payload.prompt,
          files: payload.files,
          knowledgeFile: payload.knowledgeFile,
          llmChain: payload.llmChain,
          temperature: payload.temperature,
          status: 'active',
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Agente IA guardado correctamente.',
      agente,
    });
  } catch (error) {
    console.error('Error guardando agente IA:', error);
    return res.status(500).json({ error: 'No se pudo guardar el agente IA.' });
  }
};

exports.subirArchivoConocimiento = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const knowledgeFile = parseKnowledgeFile(req.file);

    return res.status(200).json({
      success: true,
      message: 'Archivo procesado correctamente.',
      knowledgeFile,
      files: [knowledgeFile.name],
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || 'No se pudo procesar el archivo.',
    });
  }
};

exports.probarConfiguracion = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const message = String(req.body.message || '').trim();

    if (!message) {
      return res.status(400).json({ error: 'Escribe un mensaje para probar el agente.' });
    }

    const history = normalizeHistory(req.body.history);
    const config = await AgenteIA.findOne({ ownerClerkId }).lean();
    const agente = config || DEFAULT_CONFIG;
    const result = await generarRespuestaAgente(agente, message, history);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    if (error.attempts) {
      return res.status(502).json({
        error: error.message,
        attempts: error.attempts,
      });
    }

    console.error('Error probando agente IA:', error);
    return res.status(500).json({ error: 'No se pudo probar el agente IA.' });
  }
};

exports.probarPublico = async (req, res) => {
  try {
    const message = String(req.body.message || '').trim();
    const sessionId = String(req.body.sessionId || '').trim().slice(0, 120);

    if (!message) {
      return res.status(400).json({ error: 'Escribe un mensaje para probar el agente.' });
    }

    const history = normalizeHistory(req.body.history);
    const config = await AgenteIA.findOne({ status: 'active' })
      .sort({ updatedAt: -1 })
      .lean();
    const agente = config || DEFAULT_CONFIG;
    const result = await generarRespuestaAgente(agente, message, history);
    const analysis = analyzeLead({
      message,
      history,
      reply: result.reply,
    });

    await saveQualifiedLead({
      req,
      sessionId,
      history,
      message,
      reply: result.reply,
      analysis,
    });

    return res.status(200).json({
      success: true,
      reply: result.reply,
      cta: publicCtaFromAnalysis(analysis),
      score: analysis.score,
      intent: analysis.intent,
    });
  } catch (error) {
    if (error.attempts) {
      return res.status(502).json({
        error: 'El agente no pudo responder en este momento.',
      });
    }

    console.error('Error probando agente IA publico:', error);
    return res.status(500).json({ error: 'El agente no pudo responder en este momento.' });
  }
};

exports.registrarAccionPublica = async (req, res) => {
  try {
    const sessionId = String(req.body.sessionId || '').trim().slice(0, 120);
    const action = String(req.body.action || '').trim();

    if (!sessionId) {
      return res.status(400).json({ error: 'Sesion no disponible.' });
    }

    const status = action === 'apply' ? 'aplico' : 'calificado';

    const lead = await AgenteLead.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          status,
          ctaType: ['apply', 'schedule', 'send_case'].includes(action) ? action : 'none',
          lastSeenAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    ).lean();

    return res.status(200).json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error('Error registrando accion publica IA:', error);
    return res.status(500).json({ error: 'No se pudo registrar la accion.' });
  }
};

exports.obtenerLeadsIA = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 160, 20), 250);
    const leads = await AgenteLead.find({})
      .sort({ lastSeenAt: -1, score: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      leads,
    });
  } catch (error) {
    console.error('Error obteniendo leads IA:', error);
    return res.status(500).json({ error: 'No se pudieron obtener las conversaciones IA.' });
  }
};

exports.actualizarLeadIA = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const status = String(req.body.status || '').trim();
    const allowed = LEAD_STATUS_ORDER;

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Estado invalido.' });
    }

    const currentLead = await AgenteLead.findById(req.params.id).lean();

    if (!currentLead) {
      return res.status(404).json({ error: 'Lead no encontrado.' });
    }

    if (!canMoveLeadStatus(currentLead.status, status)) {
      return res.status(400).json({
        error: 'No se puede regresar la conversacion a un estado anterior.',
      });
    }

    const lead = await AgenteLead.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado.' });
    }

    return res.status(200).json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error('Error actualizando lead IA:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el lead IA.' });
  }
};

exports.eliminarLeadIA = async (req, res) => {
  try {
    const ownerClerkId = req.auth?.userId;

    if (!ownerClerkId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const lead = await AgenteLead.findByIdAndDelete(req.params.id).lean();

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado.' });
    }

    return res.status(200).json({
      success: true,
      deletedId: req.params.id,
    });
  } catch (error) {
    console.error('Error eliminando lead IA:', error);
    return res.status(500).json({ error: 'No se pudo eliminar el lead IA.' });
  }
};
