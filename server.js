import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Cargar variables de .env localmente sin dependencias externas
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        process.env[key.trim()] = vals.join('=').trim();
      }
    });
  }
} catch (e) {
  // Ignorar si falla lectura
}

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://paqiotoelmanquito_db_user:MWi1lmtR6we256eN@testebddelete2.t5uew6o.mongodb.net/fabricsoft?retryWrites=true&w=majority&appName=TESTEBDDELETE2';

app.use(cors());
app.use(express.json());

// Conexión con MongoDB Atlas (Optimizada para Serverless)
let cachedConnection = null;

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedConnection) {
    console.log('🔌 Iniciando nueva conexión a MongoDB...');
    cachedConnection = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // Desactivar buffer para fallar rápido en lugar de colgarse 10s
      serverSelectionTimeoutMS: 5000 // Timeout corto para detectar problemas de IP/red rápido
    }).then((m) => {
      console.log('🟢 Conectado exitosamente a MongoDB Atlas');
      return m;
    }).catch((err) => {
      console.error('❌ Error crítico al conectar a MongoDB:', err.message);
      cachedConnection = null;
      throw err;
    });
  }

  return cachedConnection;
};

// Intentar conectar en frío
connectDb().catch(() => { });

// Middleware para asegurar conexión DB en entornos serverless (Vercel)
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Error de conexión a la base de datos (MongoDB Atlas)',
      details: err.message
    });
  }
});

// Schemas de Mongoose
const LeadSchema = new mongoose.Schema({
  nombre: String,
  empresa: String,
  email: String,
  telefono: String,
  cargo: String,
  revenue: String,
  iniciativaOracle: String,
  servicio: String,
  fecha: String,
  ultimoContacto: { type: String, default: 'Hoy' },
  ejecutivo: { type: String, default: 'Ana' },
  estatus: { type: String, default: 'Evaluación' },
  tipo: { type: String, default: 'evaluacion' },
  isTrash: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

const OfficeHourSchema = new mongoose.Schema({
  fecha: String,
  hora: String,
  usuario: String,
  correo: String,
  telefono: String,
  empresa: String,
  cargo: String,
  revenue: String,
  iniciativaOracle: String,
  plazo: String,
  estado: { type: String, default: 'pendiente' },
  fase: { type: Number, default: 1 },
  meetLink: String,
  codigoReunion: String,
  pinAcceso: String,
  roomId: String,
  createdAt: { type: Date, default: Date.now }
});

const PaperRequestSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  empresa: String,
  cargo: String,
  paperId: String,
  status: { type: String, default: 'Solicitado' },
  createdAt: { type: Date, default: Date.now }
});

const ReferenciaRequestSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  empresa: String,
  cargo: String,
  referencia: { type: String, default: 'Referencia Directa [NDA]' },
  estatus: { type: String, default: 'Pendiente' },
  createdAt: { type: Date, default: Date.now }
});

const DoctrinaRequestSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  empresa: String,
  cargo: String,
  status: { type: String, default: 'Solicitado' },
  createdAt: { type: Date, default: Date.now }
});

const CloudCostRequestSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  empresa: String,
  createdAt: { type: Date, default: Date.now }
});

const ReferenciaItemSchema = new mongoose.Schema({
  titulo: String,
  contexto: String,
  auditId: String,
  status: String,
  tipo: String,
  orden: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const CalendarSlotSchema = new mongoose.Schema({
  slot: String,
  fecha: String,
  hora: String,
  status: { type: String, default: 'Disponible' },
  createdAt: { type: Date, default: Date.now }
});

const GeneralMeetingSchema = new mongoose.Schema({
  fecha: String,
  hora: String,
  titulo: String,
  descripcion: String,
  createdAt: { type: Date, default: Date.now }
});

const WaitlistQuarterSchema = new mongoose.Schema({
  quarter: String,
  status: String,
  label: String,
  description: String,
  deadline: String,
  orden: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const FusionRescueLeadSchema = new mongoose.Schema({
  // Contact
  nombre: String,
  first_name: String,
  last_name: String,
  email: String,
  telefono: String,
  phone: String,
  cargo: String,
  job_title: String,
  role: String,
  country: String,

  // Company / Environment
  empresa: String,
  company_name: String,
  industry: String,
  erp: { type: String, default: 'Oracle Fusion Cloud' },
  fusion_products: String,
  go_live_age: String,
  monto_facturacion: String,
  revenue: String,

  // Assessment Engine Data
  assessment_type: { type: String, default: 'FUSION_RESCUE_MVP' },
  assessment_date: { type: Date, default: Date.now },
  answers: mongoose.Schema.Types.Mixed,
  process_score: Number,
  finance_score: Number,
  data_score: Number,
  integration_score: Number,
  adoption_score: Number,
  governance_score: Number,
  health_score: Number,
  totalScore: Number,
  health_classification: String,
  recommended_path: String,
  critical_flags: [String],
  main_problem: String,
  problem_description: String,
  timing: String,

  // Review request
  review_requested: { type: Boolean, default: false },
  contact_preference: String,

  // Progress Tracking
  status: { type: String, default: 'Incompleto' }, // 'Incompleto', 'Preguntas Respondidas', 'Completado', 'Reunión Agendada', 'Reunión Enviada', 'Declinado'
  questions_answered_count: { type: Number, default: 0 },

  // Meeting scheduling data
  meeting_date: String,
  meeting_time: String,
  meeting_link: String,
  meeting_email_sent: { type: Boolean, default: false },
  meeting_sent_at: Date,

  // UTM Attribution
  utm_source: String,
  utm_medium: String,
  utm_campaign: String,
  utm_content: String,
  utm_term: String,
  landing_page: String,
  referrer: String,
  first_touch_date: String,
  content_id: String,
  session_id: { type: String, index: true }
}, { timestamps: true });

const FusionRescueAnalyticsSchema = new mongoose.Schema({
  ip: { type: String, default: '127.0.0.1' },
  event_type: String, // 'landing_visit', 'assessment_start', 'lead_capture', 'question_answered', 'assessment_complete', 'review_request'
  question_id: String, // e.g. 'q01' .. 'q25'
  user_agent: String,
  path: { type: String, default: '/fusion-rescue' },
  utm_source: String,
  utm_medium: String,
  utm_campaign: String,
  utm_content: String,
  content_id: String
}, { timestamps: true });

const FusionRescueAnalytics = mongoose.models.FusionRescueAnalytics || mongoose.model('FusionRescueAnalytics', FusionRescueAnalyticsSchema, 'fusion_rescue_analytics');

const FusionRescueLead = mongoose.models.FusionRescueLead || mongoose.model('FusionRescueLead', FusionRescueLeadSchema, 'fusion_rescue_leads');

const RescueAssessmentSchema = new mongoose.Schema({
  nombre: String,
  email: String,
  empresa: String,
  totalScore: Number,
  answers: Array,
  escenario: String,
  utm_source: String,
  utm_medium: String,
  utm_campaign: String,
  utm_content: String,
  content_id: String
}, { timestamps: true });

const LogSchema = new mongoose.Schema({
  accion: String,
  categoria: String,
  autor: { type: String, default: 'Sistema' },
  status: { type: String, enum: ['OK', 'WARN', 'ERR'], default: 'OK' },
  detalle: String,
  createdAt: { type: Date, default: Date.now }
});

const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
const OfficeHour = mongoose.models.OfficeHour || mongoose.model('OfficeHour', OfficeHourSchema);
const PaperRequest = mongoose.models.PaperRequest || mongoose.model('PaperRequest', PaperRequestSchema);
const ReferenciaRequest = mongoose.models.ReferenciaRequest || mongoose.model('ReferenciaRequest', ReferenciaRequestSchema);
const DoctrinaRequest = mongoose.models.DoctrinaRequest || mongoose.model('DoctrinaRequest', DoctrinaRequestSchema);
const CloudCostRequest = mongoose.models.CloudCostRequest || mongoose.model('CloudCostRequest', CloudCostRequestSchema);
const ReferenciaItem = mongoose.models.ReferenciaItem || mongoose.model('ReferenciaItem', ReferenciaItemSchema);
const CalendarSlot = mongoose.models.CalendarSlot || mongoose.model('CalendarSlot', CalendarSlotSchema);
const GeneralMeeting = mongoose.models.GeneralMeeting || mongoose.model('GeneralMeeting', GeneralMeetingSchema);
const WaitlistQuarter = mongoose.models.WaitlistQuarter || mongoose.model('WaitlistQuarter', WaitlistQuarterSchema);
const RescueAssessment = mongoose.models.RescueAssessment || mongoose.model('RescueAssessment', RescueAssessmentSchema);
const Log = mongoose.models.Log || mongoose.model('Log', LogSchema);

// Helper para crear logs de auditoría
async function createLog(accion, categoria, autor = 'Sistema', status = 'OK', detalle = '') {
  try {
    const log = new Log({ accion, categoria, autor, status, detalle });
    await log.save();
    console.log(`[AUDIT LOG] [${categoria}] [${status}] ${accion}`);
  } catch (err) {
    console.error('Error guardando audit log:', err.message);
  }
}

// Helper para sembrar datos demo iniciales si la BD está vacía
async function seedInitialDataIfEmpty() {
  try {
    const logCount = await Log.countDocuments();
    if (logCount === 0) {
      await Log.insertMany([
        { accion: 'Conexión inicial a MongoDB Atlas', categoria: 'Sistema', autor: 'Sistema', status: 'OK', detalle: 'Conexión exitosa a cluster Atlas' },
        { accion: 'Servidor Express Inicializado', categoria: 'Sistema', autor: 'Sistema', status: 'OK', detalle: 'Puerto activo: 4000' },
        { accion: 'Sincronización del Pipeline Q3', categoria: 'Capacidad', autor: 'Admin', status: 'OK', detalle: 'Capacidad operativa recalculada' }
      ]);
      console.log('🌱 Se sembraron logs demo en la bitácora');
    }

    const leadCount = await Lead.countDocuments();
    if (leadCount === 0) {
      await Lead.insertMany([
        { nombre: 'Carlos Mendoza', empresa: 'Grupo Bal', email: 'c.mendoza@bal.com.mx', telefono: '+52 55 1234 5678', servicio: 'Migración Oracle Fusion Cloud', fecha: '2026-08-05', estatus: 'Espera', tipo: 'espera' },
        { nombre: 'Sofía Valenzuela', empresa: 'Alsea Corporativo', email: 'svalenzuela@alsea.com.mx', telefono: '+52 55 9876 5432', servicio: 'Optimización OCI & ERP', fecha: '2026-08-06', estatus: 'Espera', tipo: 'espera' }
      ]);
      console.log('🌱 Se sembraron prospectos demo en lista de espera');
    }

    const paperCount = await PaperRequest.countDocuments();
    if (paperCount === 0) {
      await PaperRequest.insertMany([
        { nombre: 'Roberto Garza', email: 'rgarza@femsa.com', empresa: 'FEMSA Comercio', cargo: 'Director de Sistemas', paperId: 'Paper 01 - Fórmulas Oracle Fusion', status: 'Solicitado' }
      ]);
      console.log('🌱 Se sembró solicitud de paper demo');
    }

    // Garantizar creación de Colección rescue_settings y Documento Inicial en MongoDB Atlas
    let settings = await RescueSettings.findOne();
    if (!settings) {
      settings = await RescueSettings.create({
        crm_webhook_url: 'https://api.fabricsoft.com.mx/webhook/crm-fusion',
        notification_emails: ['fabrizio@fabricsoft.com.mx', 'antonio@fabricsoft.com.mx']
      });
      console.log('🌱 Colección "rescue_settings" y registro inicial de notificaciones creados en MongoDB Atlas');
    }

    const refCount = await ReferenciaRequest.countDocuments();
    if (refCount === 0) {
      await ReferenciaRequest.insertMany([
        { nombre: 'Mariana Ríos', email: 'mrios@liverpool.com.mx', empresa: 'El Puerto de Liverpool', cargo: 'VP Finanzas', referencia: 'APE Plazas - Remediación Facturación SAT', estatus: 'Pendiente' }
      ]);
      console.log('🌱 Se sembró solicitud de referencia directas demo');
    }

    const refItemCount = await ReferenciaItem.countDocuments();
    if (refItemCount === 0) {
      await ReferenciaItem.insertMany([
        {
          titulo: 'CFO de operadora de centros comerciales (LATAM)',
          auditId: 'REF-APE-2026',
          status: 'Validado · Abril 2026',
          contexto: 'Conciliaciones complejas y reportabilidad multimoneda en Fusion Cloud.',
          tipo: 'Retail / Inmobiliario',
          orden: 1
        },
        {
          titulo: 'CTO de institución financiera (USD 300M+)',
          auditId: 'REF-CTO-2026',
          status: 'Validado · Marzo 2026',
          contexto: 'Integración de base de datos transaccional con Oracle ERP Cloud.',
          tipo: 'Servicios Financieros',
          orden: 2
        },
        {
          titulo: 'CFO Controller de fintech regulada',
          auditId: 'REF-FIN-2026',
          status: 'Validado · Febrero 2026',
          contexto: 'Auditoría, reportes normativos y remediación contable de Fusion.',
          tipo: 'Fintech / Regulatory',
          orden: 3
        },
        {
          titulo: 'CISO/CTO de fintech de crédito al consumo',
          auditId: 'REF-APZ-2026',
          status: 'Validado · Abril 2026',
          contexto: 'Seguridad transaccional, automatización de cobro e interfaces bancarias.',
          tipo: 'Fintech / Security',
          orden: 4
        },
        {
          titulo: 'Director de Consultoría de Oracle ACS',
          auditId: 'REF-ACS-2026',
          status: 'Validado · Enero 2026',
          contexto: 'Análisis técnico externo y validación de metodología de remediación.',
          tipo: 'Oracle ACS / Audit',
          orden: 5
        }
      ]);
      console.log('🌱 Se sembraron las 5 referencias auditadas de Validación Directa');
    }

    const quarterCount = await WaitlistQuarter.countDocuments();
    if (quarterCount === 0) {
      await WaitlistQuarter.insertMany([
        {
          quarter: 'Q1 2026',
          status: 'closed',
          label: 'Cerrado',
          description: '3 proyectos aceptados',
          deadline: 'Completo',
          orden: 1
        },
        {
          quarter: 'Q2 2026',
          status: 'closed',
          label: 'Cerrado',
          description: '2 proyectos aceptados',
          deadline: 'Completo',
          orden: 2
        },
        {
          quarter: 'Q3 2026',
          status: 'open',
          label: 'Abierto',
          description: 'Evaluando aplicaciones',
          deadline: 'Plazo · 30 julio',
          orden: 3
        },
        {
          quarter: 'Q4 2026',
          status: 'upcoming',
          label: 'Próximo',
          description: 'Aplicaciones desde 01 sept',
          deadline: 'Próximo',
          orden: 4
        }
      ]);
      console.log('🌱 Se sembraron los 4 trimestres iniciales en la Waitlist');
    }
  } catch (err) {
    console.warn('Error al sembrar datos demo:', err.message);
  }
}

// Conectar y sembrar si vacía
mongoose.connection.once('open', seedInitialDataIfEmpty);

// ================= RUTA PARA VACIAR LA BD COMPLETAMENTE =================
app.post('/api/admin/clear-db', async (req, res) => {
  try {
    await Lead.deleteMany({});
    await OfficeHour.deleteMany({});
    await CalendarSlot.deleteMany({});
    await GeneralMeeting.deleteMany({});
    await PaperRequest.deleteMany({});
    await ReferenciaRequest.deleteMany({});
    await WaitlistQuarter.deleteMany({});
    await RescueAssessment.deleteMany({});
    await CloudCostRequest.deleteMany({});
    await Log.deleteMany({});
    createLog('Limpieza completa de BD', 'Sistema', 'Admin', 'WARN', 'Se eliminaron todas las colecciones');
    console.log('🧹 MongoDB Atlas vaciada completamente');
    res.json({ success: true, message: 'Base de datos MongoDB Atlas vaciada completamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.delete('/api/admin/clear-db', async (req, res) => {
  try {
    await Lead.deleteMany({});
    await OfficeHour.deleteMany({});
    await CalendarSlot.deleteMany({});
    await GeneralMeeting.deleteMany({});
    await PaperRequest.deleteMany({});
    await ReferenciaRequest.deleteMany({});
    await WaitlistQuarter.deleteMany({});
    await RescueAssessment.deleteMany({});
    await DoctrinaRequest.deleteMany({});
    await CloudCostRequest.deleteMany({});
    await Log.deleteMany({});
    createLog('Limpieza completa de BD', 'Sistema', 'Admin', 'WARN', 'Se eliminaron todas las colecciones');
    console.log('🧹 MongoDB Atlas vaciada completamente');
    res.json({ success: true, message: 'Base de datos MongoDB Atlas vaciada completamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA LOGS Y SISTEMA =================
app.get('/api/logs/admin', async (req, res) => {
  try {
    const { categoria, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (categoria && categoria !== 'Todas') {
      filter.categoria = categoria;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Log.countDocuments(filter);
    const logs = await Log.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    res.json({ success: true, data: logs, total });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/status/admin', async (req, res) => {
  try {
    const dbConnected = mongoose.connection.readyState === 1;
    res.json({
      success: true,
      dbStatus: dbConnected ? 'CONECTADO' : 'DESCONECTADO',
      apiStatus: 'OPERATIVO',
      authStatus: 'ACTIVO',
      totalLogs: await Log.countDocuments()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// ================= RUTA DE AUTENTICACIÓN CLERK =================
app.get('/api/auth/login', async (req, res) => {
  try {
    console.log('🔑 Validación de sesión Clerk solicitada.');
    res.json({
      success: true,
      status: 'activo',
      rol: 'admin'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA CLIENTES Y EVALUACIONES (LEADS) =================
app.get(['/api/leads/admin', '/api/leads'], async (req, res) => {
  try {
    const isTrash = req.query.trash === 'true';
    const leads = await Lead.find({ isTrash: isTrash ? true : { $ne: true } }).sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/leads/referencia', '/api/leads/solicitar', '/api/leads/waitlist', '/api/leads/admin', '/api/leads'], async (req, res) => {
  try {
    const data = req.body;
    const newLead = new Lead({
      nombre: data.nombre || data.name || 'Cliente en Evaluación',
      email: data.email || data.correo || '',
      empresa: data.empresa || data.company || 'Empresa',
      cargo: data.cargo || data.puesto || 'Ejecutivo',
      revenue: data.revenue || '—',
      iniciativaOracle: data.iniciativaOracle || data.iniciativa || '—',
      telefono: data.telefono || data.phone || '+52 55 0000 0000',
      servicio: data.servicio || 'Evaluación de Proyecto',
      fecha: data.fecha || new Date().toISOString().split('T')[0],
      estatus: data.estatus || data.status || 'Evaluación',
      tipo: 'evaluacion'
    });
    const saved = await newLead.save();
    createLog(`Nuevo Lead registrado: ${saved.nombre}`, 'Leads', 'Cliente', 'OK', `Empresa: ${saved.empresa} · Servicio: ${saved.servicio}`);
    console.log(`📋 Lead de Evaluación guardado en MongoDB Atlas [id=${saved._id}, cliente=${saved.nombre}]`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch(['/api/leads/admin/:id/status', '/api/leads/:id/status'], async (req, res) => {
  try {
    const { status, estatus } = req.body;
    const updated = await Lead.findByIdAndUpdate(req.params.id, { estatus: estatus || status }, { new: true });
    createLog(`Estado de Lead actualizado`, 'Leads', 'Admin', 'OK', `Lead: ${updated.nombre} (${updated.empresa}) -> Nuevo estado: ${updated.estatus}`);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch(['/api/leads/admin/:id/restore', '/api/leads/:id/restore'], async (req, res) => {
  try {
    const restored = await Lead.findByIdAndUpdate(req.params.id, { isTrash: false, deletedAt: null }, { new: true });
    if (restored) {
      createLog('Lead restaurado de la papelera', 'Leads', 'Admin', 'OK', `Nombre: ${restored.nombre} (${restored.empresa})`);
    }
    res.json({ success: true, data: restored });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/leads/admin/trash/empty', '/api/leads/trash/empty'], async (req, res) => {
  try {
    await Lead.deleteMany({ isTrash: true });
    createLog('Papelera de leads vaciada', 'Leads', 'Admin', 'WARN', 'Se eliminaron todos los leads de la papelera');
    res.json({ success: true, message: 'Papelera vaciada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/leads/admin/:id', '/api/leads/:id'], async (req, res) => {
  try {
    const permanent = req.query.permanent === 'true';
    if (permanent) {
      const deleted = await Lead.findByIdAndDelete(req.params.id);
      if (deleted) {
        createLog('Lead eliminado definitivamente', 'Leads', 'Admin', 'WARN', `Nombre: ${deleted.nombre} (${deleted.empresa})`);
      }
      return res.json({ success: true, message: 'Lead eliminado definitivamente' });
    }
    const updated = await Lead.findByIdAndUpdate(req.params.id, { isTrash: true, deletedAt: new Date() }, { new: true });
    if (updated) {
      createLog('Lead movido a la papelera', 'Leads', 'Admin', 'WARN', `Nombre: ${updated.nombre} (${updated.empresa})`);
    }
    res.json({ success: true, message: 'Lead movido a la papelera', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA WAITLIST QUARTERS =================
app.get('/api/waitlist-quarters', async (req, res) => {
  try {
    const quarters = await WaitlistQuarter.find().sort({ orden: 1, createdAt: 1 });
    res.json({ success: true, data: quarters });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/waitlist-quarters', async (req, res) => {
  try {
    const { quarter, status, label, description, deadline } = req.body;
    const count = await WaitlistQuarter.countDocuments();
    const newQuarter = new WaitlistQuarter({
      quarter,
      status: status || 'upcoming',
      label: label || 'Próximo',
      description: description || '',
      deadline: deadline || 'Próximo',
      orden: count + 1
    });
    const saved = await newQuarter.save();
    createLog(`Nuevo Quarter Waitlist: ${saved.quarter}`, 'Capacidad', 'Admin', 'OK', `Status: ${saved.status}`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/waitlist-quarters/:id', async (req, res) => {
  try {
    const updated = await WaitlistQuarter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    createLog(`Quarter Waitlist actualizado: ${updated.quarter}`, 'Capacidad', 'Admin', 'OK', `Status: ${updated.status}`);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/waitlist-quarters/:id', async (req, res) => {
  try {
    const deleted = await WaitlistQuarter.findByIdAndDelete(req.params.id);
    if (deleted) {
      createLog(`Quarter Waitlist eliminado: ${deleted.quarter}`, 'Capacidad', 'Admin', 'WARN');
    }
    res.json({ success: true, message: 'Trimestre de Waitlist eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA VALIDACIÓN DIRECTA (REFERENCIAS AUDITADAS) =================
app.get(['/api/referencias', '/api/admin/referencias/items'], async (req, res) => {
  try {
    const items = await ReferenciaItem.find().sort({ orden: 1, createdAt: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/referencias', '/api/admin/referencias/items'], async (req, res) => {
  try {
    const count = await ReferenciaItem.countDocuments();
    if (count >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Capacidad máxima alcanzada (máximo 5 referencias auditadas permitidas). Elimina una para agregar otra.'
      });
    }

    const { titulo, contexto, auditId, status, tipo } = req.body;
    const newItem = new ReferenciaItem({
      titulo: titulo || 'Nueva Referencia Auditada',
      contexto: contexto || 'Descripción de validación...',
      auditId: auditId || `REF-CUSTOM-${Date.now().toString().slice(-4)}`,
      status: status || 'Validado · 2026',
      tipo: tipo || 'General',
      orden: count + 1,
    });
    const saved = await newItem.save();
    createLog(`Nueva Referencia Auditada`, 'NDA', 'Admin', 'OK', `Título: ${saved.titulo} (${saved.auditId})`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put(['/api/referencias/:id', '/api/admin/referencias/items/:id'], async (req, res) => {
  try {
    const updated = await ReferenciaItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    createLog(`Referencia Auditada modificada`, 'NDA', 'Admin', 'OK', `Título: ${updated.titulo} (${updated.auditId})`);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/referencias/:id', '/api/admin/referencias/items/:id'], async (req, res) => {
  try {
    const deleted = await ReferenciaItem.findByIdAndDelete(req.params.id);
    if (deleted) {
      createLog(`Referencia Auditada eliminada`, 'NDA', 'Admin', 'WARN', `Título: ${deleted.titulo}`);
    }
    res.json({ success: true, message: 'Referencia eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA PAPERS / DOCUMENTOS SOLICITADOS =================
app.get(['/api/admin/papers', '/api/papers/admin', '/api/papers/requests'], async (req, res) => {
  try {
    const papers = await PaperRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, data: papers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/papers/solicitar', '/api/papers/request', '/api/papers/download', '/api/papers/access'], async (req, res) => {
  try {
    const { nombre, email, empresa, cargo, paperId, documento, title } = req.body;
    const newPaper = new PaperRequest({
      nombre: nombre || 'Solicitante',
      email: email || '',
      empresa: empresa || '',
      cargo: cargo || '',
      paperId: paperId || documento || title || 'Paper Técnico',
      status: 'Solicitado'
    });
    const saved = await newPaper.save();
    createLog(`Solicitud de Paper / Documento`, 'Papers', 'Cliente', 'OK', `Documento: ${saved.paperId} por ${saved.nombre} (${saved.empresa})`);
    console.log(`📄 Solicitud de documento guardada en MongoDB Atlas [id=${saved._id}, cliente=${saved.nombre}]`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch(['/api/admin/papers/:id/status', '/api/papers/admin/:id/status'], async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await PaperRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/admin/papers/:id', '/api/papers/admin/:id'], async (req, res) => {
  try {
    await PaperRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Solicitud eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA DOCTRINA SOLICITADA =================
app.get(['/api/admin/doctrina', '/api/doctrina/admin', '/api/doctrina/requests'], async (req, res) => {
  try {
    const requests = await DoctrinaRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/doctrina/solicitar', '/api/doctrina/request'], async (req, res) => {
  try {
    const { nombre, email, empresa, cargo } = req.body;
    const newRequest = new DoctrinaRequest({
      nombre: nombre || 'Solicitante',
      email: email || '',
      empresa: empresa || '',
      cargo: cargo || '',
      status: 'Solicitado'
    });
    const saved = await newRequest.save();
    console.log(`📜 Solicitud de Doctrina guardada en MongoDB Atlas [id=${saved._id}, cliente=${saved.nombre}]`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch(['/api/admin/doctrina/:id/status', '/api/doctrina/admin/:id/status'], async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await DoctrinaRequest.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/admin/doctrina/:id', '/api/doctrina/admin/:id'], async (req, res) => {
  try {
    await DoctrinaRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Solicitud eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA CLOUD COST COMPARISON REGISTRATIONS =================
app.get(['/api/admin/cloud-cost', '/api/cloud-cost'], async (req, res) => {
  try {
    const requests = await CloudCostRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/cloud-cost/solicitar', '/api/cloud-cost'], async (req, res) => {
  try {
    const { nombre, email, empresa } = req.body;
    const newRequest = new CloudCostRequest({
      nombre: nombre || 'Solicitante',
      email: email || '',
      empresa: empresa || ''
    });
    const saved = await newRequest.save();
    createLog(`Nueva solicitud de comparación ID`, 'CloudCost', 'Cliente', 'OK', `Solicitante: ${saved.nombre} (${saved.empresa})`);
    console.log(`☁️ Solicitud de comparación ID guardada en MongoDB Atlas [id=${saved._id}, cliente=${saved.nombre}]`);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/admin/cloud-cost/:id', '/api/cloud-cost/:id'], async (req, res) => {
  try {
    await CloudCostRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Solicitud eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA REFERENCIAS DIRECTAS [NDA] =================
app.get('/api/referencias/admin/solicitudes', async (req, res) => {
  try {
    const solicitudes = await ReferenciaRequest.find().sort({ createdAt: -1 });
    res.json({ success: true, data: solicitudes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/referencias/solicitar', '/api/nda/solicitar', '/api/leads/referencia'], async (req, res) => {
  try {
    const { nombre, email, empresa, cargo, referencia, caso, documento } = req.body;
    const newRef = new ReferenciaRequest({
      nombre: nombre || 'Solicitante',
      email: email || '',
      empresa: empresa || '',
      cargo: cargo || '',
      referencia: referencia || caso || documento || 'Referencia Directa [NDA]',
      estatus: 'Pendiente'
    });
    const saved = await newRef.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helpers para comparación de tiempo de México
const getMexicoCityTime = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }); // YYYY-MM-DD
  const timeStr = now.toLocaleTimeString('es-MX', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false }); // HH:MM
  return { dateStr, timeStr };
};

function convert12hTo24h(time12h) {
  if (!time12h) return "00:00";
  const match = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12h;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

// ================= RUTAS API PARA DISPONIBILIDAD DE CALENDARIO PÚBLICO =================
app.get('/api/office-hours/disponibilidad/mes', async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const daysInMonth = new Date(y, m, 0).getDate();

    const { dateStr: todayStr, timeStr: nowTimeStr } = getMexicoCityTime();

    // Todos los registros de OfficeHour en MongoDB
    const allOfficeHours = await OfficeHour.find();

    // Slots abiertos explicitamente por Admin
    const adminOpenSlots = allOfficeHours.filter(item =>
      item.estado === 'disponible' || item.fase === 99 || item.usuario === 'Slot Abierto por Admin'
    );

    // Citas ya reservadas por clientes (cualquier estado que no sea disponible ni cancelado)
    const bookedMeetings = allOfficeHours.filter(item =>
      !['disponible', 'cancelado'].includes((item.estado || '').toLowerCase()) && item.fase !== 99 && item.usuario !== 'Slot Abierto por Admin'
    );
    const bookedSet = new Set(bookedMeetings.map(b => `${b.fecha} ${b.hora}`));

    const monthData = {};
    const defaultHours = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '04:00 PM'];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      // Excluir fechas del pasado
      if (dateStr < todayStr) {
        monthData[dateStr] = 0;
        continue;
      }

      const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();

      // Excluir fines de semana (Sábado = 6, Domingo = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        monthData[dateStr] = 0;
        continue;
      }

      const customDaySlots = adminOpenSlots.filter(s => s.fecha === dateStr);

      if (customDaySlots.length > 0) {
        // Horarios específicos abiertos por el Admin para este día
        const freeCount = customDaySlots.filter(s => {
          const isBooked = bookedSet.has(`${dateStr} ${s.hora}`);
          const isPast = dateStr === todayStr && convert12hTo24h(s.hora) <= nowTimeStr;
          return !isBooked && !isPast;
        }).length;
        monthData[dateStr] = freeCount;
      } else if (adminOpenSlots.length === 0) {
        // Fallback: Si el Super Admin aún no abre slots específicos, habilitar horarios por defecto de L-V
        const dayBookings = bookedMeetings.filter(b => b.fecha === dateStr).map(b => b.hora);
        const freeCount = defaultHours.filter(h => {
          const isBooked = dayBookings.includes(h);
          const isPast = dateStr === todayStr && convert12hTo24h(h) <= nowTimeStr;
          return !isBooked && !isPast;
        }).length;
        monthData[dateStr] = freeCount;
      } else {
        // Si el admin ha abierto slots en otros días pero en este no, 0 disponibles
        monthData[dateStr] = 0;
      }
    }

    res.json({ success: true, data: monthData, monthFull: false });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/office-hours/disponibilidad/dia', async (req, res) => {
  try {
    const { date } = req.query;
    const defaultHours = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '04:00 PM'];

    const { dateStr: todayStr, timeStr: nowTimeStr } = getMexicoCityTime();

    if (date < todayStr) {
      return res.json({ success: true, data: [] });
    }

    const allOfficeHours = await OfficeHour.find();

    const adminOpenSlots = allOfficeHours.filter(item =>
      (item.fecha === date) && (item.estado === 'disponible' || item.fase === 99 || item.usuario === 'Slot Abierto por Admin')
    );

    const bookedMeetings = allOfficeHours.filter(item =>
      item.fecha === date && !['disponible', 'cancelado'].includes((item.estado || '').toLowerCase()) && item.fase !== 99 && item.usuario !== 'Slot Abierto por Admin'
    );
    const bookedHours = new Set(bookedMeetings.map(b => b.hora));

    let hoursToRender = [];
    if (adminOpenSlots.length > 0) {
      hoursToRender = adminOpenSlots.map(s => s.hora).filter(Boolean);
    } else {
      const anyAdminSlots = allOfficeHours.some(item => item.estado === 'disponible' || item.fase === 99 || item.usuario === 'Slot Abierto por Admin');
      if (!anyAdminSlots) {
        hoursToRender = defaultHours;
      }
    }

    const slots = hoursToRender.map(h => ({
      time: h,
      taken: bookedHours.has(h)
    })).sort((a, b) => a.time.localeCompare(b.time));

    // Filtrar los que ya pasaron
    const filteredSlots = slots.filter(slot => {
      const isPastSlot = date === todayStr && convert12hTo24h(slot.time) <= nowTimeStr;
      return !isPastSlot;
    });

    res.json({ success: true, data: filteredSlots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/office-hours/solicitar', async (req, res) => {
  try {
    const { nombre, email, empresa, cargo } = req.body;
    const newLead = new Lead({
      nombre: nombre || 'Solicitante',
      email: email || 'cliente@email.com',
      empresa: empresa || 'Empresa',
      telefono: '+34 600000000',
      servicio: cargo || 'Office Hours',
      estatus: 'Espera',
      tipo: 'espera'
    });
    const saved = await newLead.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA CALENDARIO Y REUNIONES APARTADAS =================
app.get('/api/office-hours/admin', async (req, res) => {
  try {
    const officeHours = await OfficeHour.find().sort({ createdAt: -1 });
    const mapped = officeHours.map(item => ({
      _id: item._id ? item._id.toString() : '',
      nombre: item.usuario || item.nombre || 'Cliente Agendado',
      empresa: item.empresa || 'Empresa',
      email: item.correo || item.email || '',
      cargo: item.cargo || item.telefono || 'Ejecutivo',
      revenue: item.revenue || '—',
      iniciativaOracle: item.iniciativaOracle || '—',
      plazo: item.plazo || '—',
      dia: item.fecha || '',
      slot: item.hora || '',
      status: (item.estado || 'pendiente').toLowerCase(),
      meetLink: item.meetLink || '',
      codigoReunion: item.codigoReunion || '',
      pinAcceso: item.pinAcceso || item.codigoReunion || '',
      roomId: item.roomId || '',
      isCreatedByAdmin: item.fase === 99 || item.usuario === 'Slot Abierto por Admin',
      createdAt: item.createdAt || new Date().toISOString()
    }));
    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error("❌ Error en GET /api/office-hours/admin:", err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// Endpoint: Obtener información pública de la sala y del cliente agendado
app.get('/api/office-hours/room-info', async (req, res) => {
  try {
    const { roomId } = req.query;
    if (!roomId) return res.status(400).json({ success: false, error: 'roomId requerido' });

    const cleanRoom = (roomId || '').toUpperCase().trim();

    let appointment = await FusionRescueLead.findOne({
      $or: [
        { roomId: cleanRoom },
        { codigoReunion: cleanRoom },
        { meeting_link: { $regex: `/${cleanRoom}$`, $options: 'i' } }
      ]
    }).sort({ updatedAt: -1, _id: -1 });

    if (!appointment) {
      appointment = await OfficeHour.findOne({
        $or: [
          { roomId: cleanRoom },
          { codigoReunion: cleanRoom },
          { meetLink: { $regex: `/${cleanRoom}$`, $options: 'i' } }
        ]
      }).sort({ updatedAt: -1, _id: -1 });
    }

    if (!appointment) {
      return res.json({
        success: false,
        found: false,
        error: 'Sala no registrada'
      });
    }

    res.json({
      success: true,
      found: true,
      nombre: appointment.nombre || appointment.usuario || 'Cliente Agendado',
      empresa: appointment.empresa || '',
      cargo: appointment.cargo || 'Ejecutivo',
      correo: appointment.email || appointment.correo || '',
      roomId: appointment.roomId || cleanRoom
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function getFallbackPinForRoom(doc, cleanRoom) {
  const str = (doc._id || cleanRoom || 'FABRIC').toString();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  let pin = '';
  for (let i = 0; i < 6; i++) {
    const index = Math.abs((hash + i * 37) % chars.length);
    pin += chars.charAt(index);
  }
  return pin;
}

// Endpoint: Verificar PIN de sala para invitados (Coincidencia Exacta de Sala y PIN)
app.get('/api/office-hours/verify-pin', async (req, res) => {
  try {
    const { roomId, pin } = req.query;
    if (!roomId) return res.status(400).json({ success: false, error: 'roomId es requerido' });

    const cleanRoom = (roomId || '').toUpperCase().trim();
    const cleanPin = (pin || '').toUpperCase().trim();

    // 1. Buscar primero en FusionRescueLead (coincidencia exacta por roomId o final de URL)
    let appointment = await FusionRescueLead.findOne({
      $or: [
        { roomId: cleanRoom },
        { codigoReunion: cleanRoom },
        { meeting_link: { $regex: `/${cleanRoom}$`, $options: 'i' } }
      ]
    }).sort({ updatedAt: -1, _id: -1 });

    // 2. Buscar en OfficeHour si no se encontró en FusionRescueLead
    if (!appointment) {
      appointment = await OfficeHour.findOne({
        $or: [
          { roomId: cleanRoom },
          { codigoReunion: cleanRoom },
          { meetLink: { $regex: `/${cleanRoom}$`, $options: 'i' } }
        ]
      }).sort({ updatedAt: -1, _id: -1 });
    }

    // 3. Si la sala no existe en MongoDB, denegar acceso inmediatamente
    if (!appointment) {
      return res.json({
        success: false,
        valid: false,
        error: 'La sala de reunión especificada no existe.'
      });
    }

    // 4. Obtener o auto-generar PIN único permanente para salas antiguas
    let expectedPin = (appointment.pinAcceso || appointment.codigoReunion || '').toString().toUpperCase().trim();
    if (!expectedPin) {
      expectedPin = getFallbackPinForRoom(appointment, cleanRoom);
      if (appointment._id) {
        await FusionRescueLead.findByIdAndUpdate(appointment._id, { pinAcceso: expectedPin, codigoReunion: expectedPin }).catch(() => null);
        await OfficeHour.findByIdAndUpdate(appointment._id, { pinAcceso: expectedPin, codigoReunion: expectedPin }).catch(() => null);
      }
    }

    const isValid = Boolean(cleanPin && cleanPin === expectedPin);

    if (!isValid) {
      return res.json({
        success: false,
        valid: false,
        error: 'Contraseña o PIN de acceso incorrecto para esta sala.'
      });
    }

    res.json({
      success: true,
      valid: true,
      nombre: appointment.nombre || appointment.usuario || 'Cliente Agendado',
      empresa: appointment.empresa || '',
      cargo: appointment.cargo || 'Ejecutivo',
      roomId: appointment.roomId || cleanRoom,
      pinAcceso: expectedPin
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Crear nueva reunión o slot (Super Admin / Cliente) en MongoDB
app.post(['/api/office-hours/admin', '/api/office-hours/book'], async (req, res) => {
  try {
    const { fecha, dia, hora, slot, usuario, nombre, correo, email, telefono, cargo, empresa, estado, status, isCreatedByAdmin, revenue, iniciativaOracle, iniciativa, plazo, pinAcceso, roomId, codigoReunion } = req.body;
    const bookingDate = fecha || dia || new Date().toISOString().split('T')[0];
    const bookingTime = hora || slot || '09:00 AM';
    const clientName = usuario || nombre || 'Cliente Agendado';
    const clientEmail = correo || email || 'admin@fabricsoft.com.mx';

    const newAppointment = new OfficeHour({
      fecha: bookingDate,
      hora: bookingTime,
      usuario: clientName,
      correo: clientEmail,
      telefono: telefono || '+52 55 0000 0000',
      cargo: cargo || 'Ejecutivo',
      empresa: empresa || 'Empresa',
      revenue: revenue || '',
      iniciativaOracle: iniciativaOracle || iniciativa || '',
      plazo: plazo || '',
      estado: estado || status || 'pendiente',
      fase: isCreatedByAdmin ? 99 : 1,
      meetLink: req.body.meetLink || '',
      codigoReunion: codigoReunion || pinAcceso || '',
      pinAcceso: pinAcceso || codigoReunion || '',
      roomId: roomId || ''
    });

    const saved = await newAppointment.save();

    const formattedResponse = {
      _id: saved._id.toString(),
      nombre: saved.usuario,
      empresa: saved.empresa,
      email: saved.correo,
      cargo: saved.cargo || saved.telefono,
      revenue: saved.revenue || '—',
      iniciativaOracle: saved.iniciativaOracle || '—',
      plazo: saved.plazo || '—',
      dia: saved.fecha,
      slot: saved.hora,
      status: saved.estado.toLowerCase(),
      meetLink: saved.meetLink || '',
      codigoReunion: saved.codigoReunion || '',
      pinAcceso: saved.pinAcceso || '',
      roomId: saved.roomId || '',
      isCreatedByAdmin: saved.fase === 99,
      createdAt: saved.createdAt
    };

    console.log(`✅ Cita o slot guardada en MongoDB Atlas [id=${saved._id}, cliente=${saved.usuario}]`);
    res.status(201).json({ success: true, data: formattedResponse });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cambiar estado o aprobar reunión en MongoDB
app.patch(['/api/office-hours/admin/:id/status', '/api/office-hours/admin/:id/approve'], async (req, res) => {
  try {
    const { status, estado, meetLink, codigoReunion, pinAcceso, roomId, dia, slot, fecha, hora } = req.body;
    const newStatus = status || estado || 'pendiente';
    const updateObj = { estado: newStatus };
    if (meetLink) updateObj.meetLink = meetLink;
    if (codigoReunion) updateObj.codigoReunion = codigoReunion;
    if (pinAcceso) updateObj.pinAcceso = pinAcceso;
    if (roomId) updateObj.roomId = roomId;
    if (dia || fecha) updateObj.fecha = dia || fecha;
    if (slot || hora) updateObj.hora = slot || hora;

    const updated = await OfficeHour.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Reunión no encontrada' });
    }

    const freshPin = pinAcceso || codigoReunion || updated.pinAcceso || updated.codigoReunion;
    const freshLink = meetLink || updated.meetLink;
    const mDate = dia || fecha || updated.fecha;
    const mTime = slot || hora || updated.hora;

    let emailResult = null;
    const isApprovedOrConfirmed = ['confirmado', 'aprobada', 'aprobado', 'confirmada', 'reunión agendada', 'reunión enviada'].includes(newStatus.toLowerCase());
    if (isApprovedOrConfirmed) {
      emailResult = await sendMeetingInviteEmailToLead(
        updated,
        mDate,
        mTime,
        freshLink,
        false,
        freshPin
      );
    }

    // Sync with FusionRescueLead if matching email or roomId exists
    try {
      const recipientEmail = updated.correo || updated.email;
      const syncObj = {
        meeting_date: mDate,
        meeting_time: mTime,
        meeting_link: freshLink,
        pinAcceso: freshPin,
        codigoReunion: freshPin
      };
      if (roomId || updated.roomId) syncObj.roomId = roomId || updated.roomId;
      if (recipientEmail) {
        await FusionRescueLead.updateMany({ email: recipientEmail }, { $set: syncObj });
      }
    } catch (syncErr) {
      console.warn('⚠️ Sync fallback warning (OfficeHour -> FusionRescueLead):', syncErr.message);
    }

    const formatted = {
      _id: updated._id.toString(),
      nombre: updated.usuario,
      empresa: updated.empresa,
      email: updated.correo,
      cargo: updated.cargo || updated.telefono,
      revenue: updated.revenue || '—',
      iniciativaOracle: updated.iniciativaOracle || '—',
      plazo: updated.plazo || '—',
      dia: updated.fecha,
      slot: updated.hora,
      status: updated.estado.toLowerCase(),
      meetLink: updated.meetLink || '',
      codigoReunion: updated.codigoReunion || '',
      pinAcceso: updated.pinAcceso || updated.codigoReunion || '',
      roomId: updated.roomId || '',
      isCreatedByAdmin: updated.fase === 99,
      createdAt: updated.createdAt
    };
    console.log(`✅ Reunión aprobada/actualizada en MongoDB Atlas [id=${updated._id}, estado=${updated.estado}, link=${updated.meetLink}, pin=${freshPin}]`);
    res.json({ success: true, data: formatted, emailResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Eliminar reunión o slot de MongoDB
app.delete('/api/office-hours/admin/:id', async (req, res) => {
  try {
    await OfficeHour.findByIdAndDelete(req.params.id);
    console.log(`🗑️ Reunión/slot eliminada de MongoDB Atlas [id=${req.params.id}]`);
    res.json({ success: true, message: 'Reunión eliminada de MongoDB' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA FECHAS DISPONIBLES (SLOTS DEL ADMIN) =================
app.get('/api/office-hours/slots', async (req, res) => {
  try {
    const slots = await CalendarSlot.find().sort({ createdAt: -1 });
    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/office-hours/slots', async (req, res) => {
  try {
    const slotsPayload = req.body;
    const items = Array.isArray(slotsPayload) ? slotsPayload : [slotsPayload];

    const docs = [];
    for (const item of items) {
      const fecha = item.fecha || (item.slot ? item.slot.split(' ')[0] : '');
      const hora = item.hora || (item.slot ? item.slot.split(' ')[1] : '');
      const slotStr = item.slot || `${fecha} ${hora}`;

      if (fecha && hora) {
        const updated = await CalendarSlot.findOneAndUpdate(
          { slot: slotStr },
          { slot: slotStr, fecha, hora, status: 'Disponible' },
          { upsert: true, new: true }
        );
        docs.push(updated);
      }
    }
    res.status(201).json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA FUSION RESCUE =================
app.post(['/api/rescue-assessment/submit', '/rescue-assessment/submit', '/api/rescue-assessment', '/api/fusion-rescue', '/api/fusion-rescue/submit'], async (req, res) => {
  try {
    const data = req.body;
    const submissionId = data.submission_id || data._id || data.id;
    const firstName = data.first_name || (data.nombre ? data.nombre.split(' ')[0] : 'Cliente');
    const lastName = data.last_name || (data.nombre ? data.nombre.split(' ').slice(1).join(' ') : '');
    const fullName = data.nombre || `${firstName} ${lastName}`.trim();
    const email = data.email || '';
    const company = data.company_name || data.empresa || 'Empresa';
    const jobTitle = data.job_title || data.cargo || 'Ejecutivo';
    const role = data.role || data.cargo || 'Usuario';
    const country = data.country || 'México';
    const healthScore = data.health_score ?? data.totalScore ?? 0;
    const classification = data.health_classification || 'AT RISK';
    const recommendedPath = data.recommended_path || 'RESCUE';
    const mainProblem = data.problema_principal || data.main_problem || 'General';
    const problemDescription = data.descripcion_problema || data.problem_description || '';
    const timing = data.timing_prioridad || data.timing || '3 meses';
    const source = data.utm_source || 'direct';
    const contentId = data.content_id || data.utm_content || 'N/A';

    const answersObj = data.answers || {};
    const answeredCount = Object.keys(answersObj).length;
    let computedStatus = data.status || 'Incompleto';
    if (data.is_draft) {
      computedStatus = 'Incompleto';
    } else if (data.status === 'Preguntas Respondidas' || data.status === 'Completado' || answeredCount === 25) {
      computedStatus = 'Completado';
    }

    const payloadObj = {
      nombre: fullName,
      first_name: firstName,
      last_name: lastName,
      email,
      telefono: data.telefono || data.phone || '',
      phone: data.phone || data.telefono || '',
      cargo: jobTitle,
      job_title: jobTitle,
      role,
      country,

      empresa: company,
      company_name: company,
      industry: data.industry || 'General',
      erp: data.erp || 'Oracle Fusion Cloud',
      fusion_products: data.fusion_products || data.solution || 'Oracle Fusion Cloud ERP',
      go_live_age: data.go_live_age || data.antiguedad_golive || '1-2 años',
      monto_facturacion: data.monto_facturacion || data.revenue || '$10M – $50M USD',
      revenue: data.revenue || data.monto_facturacion || '$10M – $50M USD',

      assessment_type: 'FUSION_RESCUE_MVP',
      answers: answersObj,
      questions_answered_count: answeredCount,
      status: computedStatus,

      process_score: data.process_score || data.dimension_results?.procesos?.score || 0,
      finance_score: data.finance_score || data.dimension_results?.finanzas?.score || 0,
      data_score: data.data_score || data.dimension_results?.datos?.score || 0,
      integration_score: data.integration_score || data.dimension_results?.integraciones?.score || 0,
      adoption_score: data.adoption_score || data.dimension_results?.adopcion?.score || 0,
      governance_score: data.governance_score || data.dimension_results?.governance?.score || 0,
      health_score: healthScore,
      totalScore: healthScore,
      health_classification: classification,
      recommended_path: recommendedPath,
      critical_flags: data.critical_flags || [],
      main_problem: mainProblem,
      problema_principal: mainProblem,
      problem_description: problemDescription,
      descripcion_problema: problemDescription,
      timing: timing,
      timing_prioridad: timing,

      review_requested: data.review_requested || false,
      contact_preference: data.contact_preference || '',

      utm_source: data.utm_source || '',
      utm_medium: data.utm_medium || '',
      utm_campaign: data.utm_campaign || '',
      utm_content: data.utm_content || '',
      utm_term: data.utm_term || '',
      landing_page: data.landing_page || '/fusion-rescue',
      referrer: data.referrer || '',
      first_touch_date: data.first_touch_date || new Date().toISOString(),
      content_id: contentId,
      session_id: data.session_id || null
    };

    let saved;
    const sessionId = data.session_id || null;
    if (submissionId && mongoose.Types.ObjectId.isValid(submissionId)) {
      saved = await FusionRescueLead.findByIdAndUpdate(submissionId, payloadObj, { new: true });
    }
    if (!saved && sessionId) {
      saved = await FusionRescueLead.findOneAndUpdate({ session_id: sessionId }, payloadObj, { new: true });
    }
    if (!saved) {
      const newSubmission = new FusionRescueLead({
        ...payloadObj,
        session_id: sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      });
      saved = await newSubmission.save();
    }

    // Internal notification in audit log
    const auditDetail = `FUSION RESCUE LEAD (${saved.status})\nNombre: ${fullName}\nEmpresa: ${company}\nEmail: ${email}\nPreguntas respondidas: ${answeredCount}/25\nHealth Score: ${healthScore}/100\nSolicitó revisión: ${saved.review_requested ? 'Sí' : 'No'}`;

    createLog(`FUSION RESCUE LEAD (${saved.status}): ${fullName}`, 'FusionRescueLead', 'Cliente', 'OK', auditDetail);
    console.log(`📋 Fusion Rescue Lead actualizado en MongoDB Atlas [id=${saved._id}, session=${saved.session_id}, cliente=${saved.nombre}, status=${saved.status}, preguntas=${answeredCount}/25]`);

    // Disparar Alerta de Correo a Destinatarios Internos de Settings siempre que concluya el diagnóstico
    if (!data.is_draft) {
      sendLeadAlertEmail(saved).catch(err => console.error('Error enviando alerta de correo:', err));
    }

    res.status(200).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper Function to Send Email Alerts via Resend API
async function sendLeadAlertEmail(savedLead) {
  try {
    if (!resend) {
      console.warn('⚠️ RESEND_API_KEY no configurada en las variables de entorno. Omite envío de correo.');
      return;
    }
    let settings = await RescueSettings.findOne();
    const recipientEmails = (settings && Array.isArray(settings.notification_emails) && settings.notification_emails.length > 0)
      ? settings.notification_emails
      : ['antonio.salazar@fabricsoft.com.mx'];

    const fullName = `${savedLead.first_name || savedLead.nombre || 'Prospecto'} ${savedLead.last_name || savedLead.apellidos || ''}`.trim();
    const company = savedLead.empresa || savedLead.company_name || 'Empresa';
    const email = savedLead.email || 'N/A';
    const phone = savedLead.phone || savedLead.telefono || 'N/A';
    const jobTitle = savedLead.cargo || savedLead.job_title || 'Ejecutivo';
    const score = savedLead.health_score ?? savedLead.totalScore ?? 0;
    const classification = savedLead.health_classification || 'AT RISK';
    const path = savedLead.recommended_path || 'RESCUE';
    const problem = savedLead.problema_principal || savedLead.main_problem || 'N/A';
    const timing = savedLead.timing_prioridad || savedLead.timing || 'N/A';
    const source = savedLead.utm_source || 'Directo';
    const campaign = savedLead.utm_campaign || 'N/A';
    const isReviewRequest = Boolean(savedLead.review_requested);
    const isStartOnly = Boolean(savedLead.questions_answered_count < 25 && savedLead.status !== 'Completado' && savedLead.status !== 'Preguntas Respondidas' && !isReviewRequest);

    // Subject titles as requested:
    // 1. "Comenzar evaluación": "Un nuevo lead ha comenzado el formulario: [Nombre] ([Empresa])"
    // 2. "Consultar mi Diagnóstico": "Lead Completo el formulario: [Nombre] ([Empresa])"
    // 3. "Solicitar revisión de 30 minutos": "Lead requiere reunion de 30 minutos: [Nombre] ([Empresa])"
    let subjectText = `Lead Completo el formulario: ${fullName} (${company})`;
    let headerBadge = `📋 FORMULARIO DE DIAGNÓSTICO COMPLETO`;
    let descriptionText = `Un prospecto ha respondido todo el formulario de <strong>Fusion Rescue Health Check</strong> y ha hecho clic en <em>Consultar mi Diagnóstico</em>.`;
    let iconHeader = '📋';

    if (isReviewRequest) {
      subjectText = `Lead requiere reunion de 30 minutos: ${fullName} (${company})`;
      headerBadge = `📅 SOLICITUD DE REUNIÓN DE 30 MINUTOS`;
      descriptionText = `Un prospecto ha hecho clic en el botón <strong>Solicitar revisión de 30 minutos</strong> y requiere una sesión directa con el equipo técnico de FABRIC.`;
      iconHeader = '📅';
    } else if (isStartOnly) {
      subjectText = `Un nuevo lead ha comenzado el formulario: ${fullName} (${company})`;
      headerBadge = `🚀 NUEVO LEAD HA COMENZADO EL FORMULARIO`;
      descriptionText = `Un nuevo prospecto ha hecho clic en <strong>Comenzar evaluación (25 preguntas)</strong> y ha ingresado sus datos para iniciar el cuestionario.`;
      iconHeader = '🚀';
    }

    const adminRouteUrl = process.env.APP_URL
      ? `${process.env.APP_URL.replace(/\/$/, '')}/admin/rescue-fusion/leads`
      : (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/admin/rescue-fusion/leads` : 'https://fabricsoft.mx/admin');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #07192F; color: #ffffff; padding: 30px; border-radius: 16px;">
        <div style="border-bottom: 2px solid #C9A96E; padding-bottom: 15px; margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: bold; color: #C9A96E; letter-spacing: 2px; text-transform: uppercase;">
            FABRIC FUSION RESCUE · ${headerBadge}
          </span>
          <h1 style="color: #ffffff; font-size: 22px; margin: 8px 0 0 0;">
            ${iconHeader} ${fullName} (${company})
          </h1>
        </div>

        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          ${descriptionText}
        </p>

        <div style="background-color: #0E2747; border: 1px solid #C9A96E; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #f8fafc;">
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold; width: 150px;">Nombre Lead:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">${fullName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Empresa:</td>
              <td style="padding: 8px 0; color: #ffffff;">${company}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Email:</td>
              <td style="padding: 8px 0; color: #38bdf8; font-weight: bold;"><a href="mailto:${email}" style="color: #38bdf8;">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Teléfono / WA:</td>
              <td style="padding: 8px 0; color: #ffffff;">${phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Cargo:</td>
              <td style="padding: 8px 0; color: #ffffff;">${jobTitle}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Solicitó Reunión 30m:</td>
              <td style="padding: 8px 0; font-weight: bold; color: ${isReviewRequest ? '#34d399' : '#cbd5e1'};">${isReviewRequest ? 'SÍ (Reunión de 30 Minutos solicitada)' : 'NO (Solo consultó diagnóstico)'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Health Score:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #C9A96E;">${score} / 100 (${classification})</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Ruta Recomendada:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #fbbf24;">${path}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Problema Principal:</td>
              <td style="padding: 8px 0; color: #ffffff;">${problem}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Timing Atención:</td>
              <td style="padding: 8px 0; color: #34d399;">${timing}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #94a3b8; font-weight: bold;">Origen Traffic / UTM:</td>
              <td style="padding: 8px 0; color: #a7f3d0;">${source} (Campaña: ${campaign})</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="${adminRouteUrl}" style="display: inline-block; background-color: #C9A96E; color: #050203; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 12px; font-size: 14px;">
            Acceder al Panel Administrador
          </a>
        </div>
      </div>
    `;

    let sendRes = await resend.emails.send({
      from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
      to: recipientEmails,
      subject: subjectText,
      html: htmlContent
    });

    if (sendRes.error && sendRes.error.name === 'validation_error') {
      console.warn('⚠️ Resend en modo pruebas. Reenviando a saalzarantonio@gmail.com...');
      sendRes = await resend.emails.send({
        from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
        to: ['saalzarantonio@gmail.com'],
        subject: `[MODO TEST] ${subjectText}`,
        html: htmlContent
      });
    }

    if (sendRes.error) {
      console.error('❌ Error enviando notificación vía Resend:', sendRes.error);
      createLog('Error envío correo Resend', 'NotificationEmail', 'Sistema', 'ERR', sendRes.error.message || JSON.stringify(sendRes.error));
    } else {
      console.log(`📧 Notificación de correo enviada exitosamente vía Resend [id=${sendRes.data?.id}] a: ${recipientEmails.join(', ')}`);
      createLog(`Alerta de correo enviada (${isReviewRequest ? 'Reunión 30m' : 'Formulario Completo'}): ${fullName}`, 'NotificationEmail', 'Sistema', 'OK', `Enviado a: ${recipientEmails.join(', ')}`);
    }
  } catch (err) {
    console.error('❌ Excepción enviando correo con Resend API:', err.message);
  }
}

// Update Progress on Answer Selection
app.patch(['/api/fusion-rescue/:id/progress', '/api/rescue-assessment/:id/progress'], async (req, res) => {
  try {
    const { answers } = req.body;
    const answersObj = answers || {};
    const answeredCount = Object.keys(answersObj).length;
    const computedStatus = answeredCount === 25 ? 'Preguntas Respondidas' : 'Incompleto';

    const updated = await FusionRescueLead.findByIdAndUpdate(
      req.params.id,
      {
        answers: answersObj,
        questions_answered_count: answeredCount,
        status: computedStatus
      },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Single Lead / Submission by ID (Public for resuming assessment)
app.get(['/api/fusion-rescue/submission/:id', '/api/rescue-assessment/submission/:id'], async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: 'ID de expediente no válido' });
    }
    const lead = await FusionRescueLead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Expediente no encontrado' });
    }
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send Resume Assessment Email to Prospect with Unique Link
app.post(['/api/fusion-rescue/send-resume-email', '/api/admin/fusion-rescue/send-resume-email'], async (req, res) => {
  try {
    const { leadId } = req.body;
    if (!leadId || !mongoose.Types.ObjectId.isValid(leadId)) {
      return res.status(400).json({ success: false, error: 'ID de lead no válido' });
    }

    const lead = await FusionRescueLead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead no encontrado' });
    }

    if (!lead.email) {
      return res.status(400).json({ success: false, error: 'El lead no tiene correo registrado' });
    }

    const origin = req.get('origin') || req.get('referer')?.split('/admin')[0] || 'https://fabricsoft.mx';
    const resumeUrl = `${origin.replace(/\/$/, '')}/fusion-rescue?resumeId=${lead._id}`;
    const answeredCount = lead.questions_answered_count ?? (lead.answers ? Object.keys(lead.answers).length : 0);

    const fullName = `${lead.first_name || lead.nombre || 'Estimado(a)'} ${lead.last_name || lead.apellidos || ''}`.trim();
    const company = lead.empresa || lead.company_name || 'su empresa';

    if (resend) {
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #07192F; color: #ffffff; padding: 35px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1E3A5F;">
          <div style="text-align: center; border-bottom: 2px solid #C9A96E; padding-bottom: 20px; margin-bottom: 25px;">
            <span style="font-size: 11px; font-weight: bold; color: #C9A96E; letter-spacing: 2px; text-transform: uppercase; font-family: monospace;">FABRIC SOFT MÉXICO</span>
            <h1 style="font-size: 20px; margin: 10px 0 0 0; color: #ffffff; font-weight: 800;">Aqui podras concluir la encuesta donde de quedaste la ultima vez!</h1>
          </div>

          <p style="font-size: 15px; color: #e2e8f0; line-height: 1.6;">Hola <strong style="color: #FFE28A;">${fullName}</strong>,</p>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            Aqui podras concluir la encuesta donde de quedaste la ultima vez! Hemos guardado tu avance (${answeredCount} de 25 preguntas respondidas) para que no tengas que volver a llenar tus datos.
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${resumeUrl}" style="display: inline-block; background-color: #C9A96E; color: #050203; padding: 16px 32px; font-weight: 900; text-decoration: none; border-radius: 12px; font-size: 15px; letter-spacing: 1px; text-transform: uppercase; font-family: monospace; border: 2px solid #FFE8A3;">
              ⚡ CONCLUIR ENCUESTA AQUÍ
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; border-top: 1px solid #1E3A5F; padding-top: 20px;">
            Si el botón no abre directamente, copia y pega este enlace en tu navegador:<br/>
            <a href="${resumeUrl}" style="color: #C9A96E; word-break: break-all;">${resumeUrl}</a>
          </p>
        </div>
      `;

      let sendRes = await resend.emails.send({
        from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
        to: [lead.email],
        subject: `Aqui podras concluir la encuesta donde de quedaste la ultima vez!`,
        html: htmlContent
      });

      if (sendRes.error && sendRes.error.name === 'validation_error') {
        console.warn('⚠️ Resend en modo test: reenviando recordatorio a saalzarantonio@gmail.com');
        sendRes = await resend.emails.send({
          from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
          to: ['saalzarantonio@gmail.com'],
          subject: `Aqui podras concluir la encuesta donde de quedaste la ultima vez!`,
          html: htmlContent
        });
      }

      if (sendRes.error) {
        throw new Error(sendRes.error.message || 'Error al enviar correo vía Resend');
      }

      createLog(`Recordatorio enviado a prospecto: ${lead.email}`, 'FusionRescueLead', 'Admin', 'OK', `Lead ID: ${lead._id} · ${answeredCount}/25 preguntas`);
    } else {
      console.log(`📧 Simulation Mode: Recordatorio generado para ${lead.email}: ${resumeUrl}`);
    }

    res.json({ success: true, message: 'Correo con enlace de continuación enviado correctamente', resumeUrl });
  } catch (err) {
    console.error('Error enviando correo de recordatorio:', err);
  }
});

app.patch(['/api/rescue-assessment/:id/review', '/rescue-assessment/:id/review', '/api/fusion-rescue/:id/review'], async (req, res) => {
  try {
    const { review_requested, contact_preference, phone } = req.body;
    const updateObj = { review_requested: review_requested ?? true };
    if (contact_preference) updateObj.contact_preference = contact_preference;
    if (phone) {
      updateObj.phone = phone;
      updateObj.telefono = phone;
    }

    const updated = await FusionRescueLead.findByIdAndUpdate(req.params.id, updateObj, { new: true });
    if (updated) {
      createLog(`Solicitud de Revisión 30 min: ${updated.nombre}`, 'FusionRescueLead', 'Cliente', 'OK', `Empresa: ${updated.empresa} · Método: ${contact_preference || 'Email'}`);
      // Disparar Alerta de Correo con Asunto: "Lead requiere reunion de 30 minutos"
      sendLeadAlertEmail(updated).catch(err => console.error('Error enviando correo de reunión 30 min:', err));
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper Function to Send Meeting Invite Email to Lead via Resend API
async function sendMeetingInviteEmailToLead(lead, meetingDate, meetingTime, meetingLink, isReschedule = false, explicitPin = '') {
  try {
    if (!resend) {
      console.warn('⚠️ RESEND_API_KEY no configurada. Omite envío de correo de reunión.');
      return { success: false, reason: 'resend_not_configured' };
    }
    const recipientEmail = lead ? (lead.email || lead.correo) : null;
    if (!lead || !recipientEmail) {
      console.warn('⚠️ Prospecto no cuenta con email válido.');
      return { success: false, reason: 'no_email' };
    }

    const fullName = `${lead.first_name || lead.nombre || lead.usuario || 'Estimado(a)'} ${lead.last_name || lead.apellidos || ''}`.trim();
    const company = lead.empresa || lead.company_name || 'tu empresa';
    const rawDate = meetingDate || lead.meeting_date || lead.dia || lead.fecha;
    const formattedDate = rawDate || 'Fecha por confirmar';
    const rawTime = meetingTime || lead.meeting_time || lead.slot || lead.hora;
    const formattedTime = rawTime ? (rawTime.includes('hrs') ? rawTime : `${rawTime} hrs`) : 'Horario por confirmar';
    const linkUrl = meetingLink || lead.meeting_link || lead.meetLink || 'https://fabricsoft.mx';

    const headerBadge = isReschedule ? 'FABRIC CONSULTING · REUNIÓN REAGENDADA' : 'FABRIC CONSULTING · CONFIRMACIÓN DE SESIÓN';
    const headerTitle = isReschedule ? '🔄 Reunión Técnica Reagendada' : '📅 Confirmación de Reunión Técnica';
    const emailSubject = isReschedule
      ? `🔄 Reagendación de Reunión Técnica FABRIC: ${formattedDate} (${formattedTime})`
      : `Confirmación de Reunión Técnica FABRIC: ${formattedDate} (${formattedTime})`;

    const bodyMessage = isReschedule
      ? `Te informamos que tu sesión técnica de revisión para <strong>${company}</strong> ha sido <strong>reagendada exitosamente</strong>. A continuación te compartimos los nuevos detalles de fecha y horario:`
      : `Te confirmamos que tu sesión técnica de revisión para <strong>${company}</strong> ha sido agendada exitosamente con nuestro equipo técnico especializado.`;

    const accessPin = explicitPin || lead.pinAcceso || lead.codigoReunion || 'DRAND9';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #07192F; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #C9A96E; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 11px; font-weight: bold; color: #C9A96E; letter-spacing: 2px; text-transform: uppercase; font-family: monospace;">
            ${headerBadge}
          </span>
          <h1 style="color: #ffffff; font-size: 22px; margin: 10px 0 0 0;">
            ${headerTitle}
          </h1>
        </div>

        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          Hola <strong>${fullName}</strong>,
        </p>

        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          ${bodyMessage}
        </p>

        <div style="background-color: #0E2747; border: 1px solid #C9A96E; padding: 24px; border-radius: 14px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #f8fafc;">
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 10px 0; color: #94a3b8; font-weight: bold; width: 140px;">📅 Fecha:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #38bdf8;">${formattedDate}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 10px 0; color: #94a3b8; font-weight: bold;">⏰ Horario:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #34d399;">${formattedTime}</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 10px 0; color: #94a3b8; font-weight: bold;">👤 Participante:</td>
              <td style="padding: 10px 0; color: #ffffff;">${fullName} (${company})</td>
            </tr>
            <tr style="border-bottom: 1px solid #1E3A5F;">
              <td style="padding: 10px 0; color: #94a3b8; font-weight: bold;">🔑 PIN de Acceso:</td>
              <td style="padding: 10px 0; font-weight: bold; color: #fbbf24; font-family: monospace; font-size: 16px;">${accessPin}</td>
            </tr>
            ${linkUrl ? `
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-weight: bold;">💻 Enlace Videollamada:</td>
              <td style="padding: 10px 0; color: #C9A96E; font-weight: bold; word-break: break-all;">
                <a href="${linkUrl}" style="color: #C9A96E; text-decoration: underline;" target="_blank">${linkUrl}</a>
              </td>
            </tr>
            ` : ''}
          </table>
        </div>

        ${linkUrl ? `
        <div style="text-align: center; margin: 28px 0 20px 0;">
          <a href="${linkUrl}" target="_blank" style="display: inline-block; background-color: #C9A96E; color: #050203; padding: 14px 32px; font-weight: bold; text-decoration: none; border-radius: 12px; font-size: 14px; box-shadow: 0 4px 12px rgba(201, 169, 110, 0.3);">
            ${isReschedule ? '💻 Unirme a la Reunión Reagendada' : '💻 Unirme a la Reunión'}
          </a>
        </div>
        ` : ''}

        <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; text-align: center; border-top: 1px solid #1E3A5F; padding-top: 20px; margin-top: 25px;">
          Te sugerimos ingresar 5 minutos antes a la reunión.<br/>
          Si necesitas hacer algún ajuste adicional, responde directamente a este correo.
        </p>
      </div>
    `;

    let sendRes = await resend.emails.send({
      from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
      to: [recipientEmail],
      subject: emailSubject,
      html: htmlContent
    });

    if (sendRes.error && sendRes.error.name === 'validation_error') {
      console.warn('⚠️ Resend en modo test: reenviando correo de reunión a saalzarantonio@gmail.com');
      sendRes = await resend.emails.send({
        from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
        to: ['saalzarantonio@gmail.com'],
        subject: `[PRUEBA] ${emailSubject}`,
        html: htmlContent
      });
    }

    if (sendRes.error) {
      throw new Error(sendRes.error.message || 'Error al enviar invitación de reunión por correo');
    }

    createLog(`Correo de Reunión ${isReschedule ? 'Reagendada' : 'Agendada'} enviado a prospecto: ${lead.email}`, 'FusionRescueLead', 'Admin', 'OK', `Lead ID: ${lead._id} · Fecha: ${formattedDate} ${formattedTime}`);
    return { success: true, resendId: sendRes.data?.id };
  } catch (err) {
    console.error('Error enviando correo de confirmación de reunión:', err);
    return { success: false, error: err.message };
  }
}

// Helper Function to Send Decline / Rejection Email to Lead via Resend API
async function sendDeclineEmailToLead(lead) {
  try {
    if (!resend) {
      console.warn('⚠️ RESEND_API_KEY no configurada. Omite envío de correo de declinación.');
      return { success: false, reason: 'resend_not_configured' };
    }
    if (!lead || !lead.email) {
      console.warn('⚠️ Prospecto no cuenta con email válido.');
      return { success: false, reason: 'no_email' };
    }

    const fullName = `${lead.first_name || lead.nombre || 'Estimado(a)'} ${lead.last_name || lead.apellidos || ''}`.trim();
    const company = lead.empresa || lead.company_name || 'tu empresa';
    const emailSubject = `Actualización sobre tu Solicitud de Evaluación Fusion Rescue™ - FABRIC Consulting`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #07192F; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #C9A96E; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 11px; font-weight: bold; color: #C9A96E; letter-spacing: 2px; text-transform: uppercase; font-family: monospace;">
            FABRIC CONSULTING · ACTUALIZACIÓN DE EVALUACIÓN
          </span>
          <h1 style="color: #ffffff; font-size: 22px; margin: 10px 0 0 0;">
            Agradecemos tu Solicitud
          </h1>
        </div>

        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          Hola <strong>${fullName}</strong>,
        </p>

        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Agradecemos sinceramente el tiempo e interés brindado al completar el diagnóstico técnico <strong>Fusion Rescue™</strong> para <strong>${company}</strong>.
        </p>

        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Tras realizar la revisión detallada de los parámetros de infraestructura e iniciativas tecnológicas capturadas en tu ficha de evaluación, te informamos que en esta ocasión tu perfil no ha sido seleccionado para avanzar a la sesión técnica diagnóstica.
        </p>

        <div style="background-color: #0E2747; padding: 20px; border-radius: 14px; border: 1px solid #1E3A5F; margin: 24px 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
          📌 Guardaremos tu información en nuestros registros corporativos para futuras convocatorias e iniciativas tecnológicas especializadas de FABRIC Consulting.
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #1E3A5F; padding-top: 16px;">
          FABRIC Consulting · Arquitectura y Rescate de Infraestructura Oracle
        </p>
      </div>
    `;

    let sendRes = await resend.emails.send({
      from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
      to: [lead.email],
      subject: emailSubject,
      html: htmlContent
    });

    if (sendRes.error && sendRes.error.name === 'validation_error') {
      console.warn('⚠️ Resend en modo test: reenviando correo de declinación a saalzarantonio@gmail.com');
      sendRes = await resend.emails.send({
        from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
        to: ['saalzarantonio@gmail.com'],
        subject: `[PRUEBA] ${emailSubject}`,
        html: htmlContent
      });
    }

    if (sendRes.error) {
      throw new Error(sendRes.error.message || 'Error al enviar correo de declinación');
    }

    createLog(`Correo de Declinación enviado a prospecto: ${lead.email}`, 'FusionRescueLead', 'Admin', 'OK', `Lead ID: ${lead._id}`);
    return { success: true, resendId: sendRes.data?.id };
  } catch (err) {
    console.error('Error enviando correo de declinación:', err);
    return { success: false, error: err.message };
  }
}

app.patch(['/api/fusion-rescue/submissions/:id/decline', '/api/rescue-assessment/:id/decline'], async (req, res) => {
  try {
    const targetId = req.params.id;
    const { email } = req.body;

    const queryOr = [];
    if (mongoose.Types.ObjectId.isValid(targetId)) queryOr.push({ _id: targetId });
    if (targetId) queryOr.push({ session_id: targetId });
    if (email) queryOr.push({ email: email });

    const updateObj = {
      status: 'Declinado',
      estatus: 'Declinado',
      declined_at: new Date()
    };

    if (queryOr.length > 0) {
      await FusionRescueLead.updateMany({ $or: queryOr }, { $set: updateObj });
    }

    let updated = await FusionRescueLead.findOne({ $or: queryOr }).sort({ updatedAt: -1, _id: -1 });
    if (!updated && targetId) {
      updated = await FusionRescueLead.findById(targetId).catch(() => null);
    }

    let emailResult = null;
    if (updated && updated.email) {
      emailResult = await sendDeclineEmailToLead(updated);
    }

    res.json({ success: true, data: updated, emailResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper Function to Send Meeting Cancellation Email to Lead via Resend API
async function sendCancellationEmailToLead(lead, dia, slot) {
  try {
    if (!resend) {
      console.warn('⚠️ RESEND_API_KEY no configurada. Omite envío de correo de cancelación.');
      return { success: false, reason: 'resend_not_configured' };
    }
    if (!lead || !lead.email) {
      console.warn('⚠️ Prospecto no cuenta con email válido.');
      return { success: false, reason: 'no_email' };
    }

    const fullName = `${lead.first_name || lead.nombre || 'Estimado(a)'} ${lead.last_name || lead.apellidos || ''}`.trim();
    const company = lead.empresa || lead.company_name || 'tu empresa';
    const formattedDate = dia || lead.meeting_date || 'Fecha programada';
    const formattedTime = slot || lead.meeting_time ? `${slot || lead.meeting_time} hrs` : '';
    const emailSubject = `Cancelación de Reunión Técnica FABRIC: ${formattedDate}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #07192F; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
          <span style="font-size: 11px; font-weight: bold; color: #f87171; letter-spacing: 2px; text-transform: uppercase; font-family: monospace;">
            FABRIC CONSULTING · CANCELACIÓN DE CITA
          </span>
          <h1 style="color: #ffffff; font-size: 22px; margin: 10px 0 0 0;">
            ❌ Reunión Cancelada
          </h1>
        </div>

        <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
          Hola <strong>${fullName}</strong>,
        </p>

        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
          Te informamos que tu reunión técnica de diagnóstico <strong>Fusion Rescue™</strong> para <strong>${company}</strong> que estaba agendada para el <strong>${formattedDate} ${formattedTime}</strong> ha sido <strong>cancelada</strong>.
        </p>

        <div style="background-color: #0E2747; padding: 20px; border-radius: 14px; border: 1px solid #1E3A5F; margin: 24px 0; font-size: 13px; color: #94a3b8; line-height: 1.6;">
          📌 Si necesitas agendar un nuevo espacio en la agenda de nuestros especialistas, puedes contactarnos respondiendo directamente a este correo.
        </div>

        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #1E3A5F; padding-top: 16px;">
          FABRIC Consulting · Arquitectura y Rescate de Infraestructura Oracle
        </p>
      </div>
    `;

    let sendRes = await resend.emails.send({
      from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
      to: [lead.email],
      subject: emailSubject,
      html: htmlContent
    });

    if (sendRes.error && sendRes.error.name === 'validation_error') {
      console.warn('⚠️ Resend en modo test: reenviando correo de cancelación a saalzarantonio@gmail.com');
      sendRes = await resend.emails.send({
        from: 'FABRIC Rescue <notificaciones@fabriconsulting.com.mx>',
        to: ['saalzarantonio@gmail.com'],
        subject: `[PRUEBA] ${emailSubject}`,
        html: htmlContent
      });
    }

    if (sendRes.error) {
      throw new Error(sendRes.error.message || 'Error al enviar correo de cancelación');
    }

    createLog(`Correo de Cancelación enviado a prospecto: ${lead.email}`, 'FusionRescueLead', 'Admin', 'OK', `Lead ID: ${lead._id}`);
    return { success: true, resendId: sendRes.data?.id };
  } catch (err) {
    console.error('Error enviando correo de cancelación:', err);
    return { success: false, error: err.message };
  }
}

app.patch(['/api/office-hours/admin/:id/cancel', '/api/fusion-rescue/submissions/:id/cancel'], async (req, res) => {
  try {
    const targetId = req.params.id;
    const { email, dia, slot, nombre, empresa } = req.body;

    const queryOr = [];
    if (mongoose.Types.ObjectId.isValid(targetId)) queryOr.push({ _id: targetId });
    if (targetId) queryOr.push({ session_id: targetId });
    if (email) queryOr.push({ email: email });

    const updateObj = {
      status: 'cancelado',
      estatus: 'Cancelado',
      cancelled_at: new Date()
    };

    // Update FusionRescueLead collection
    if (queryOr.length > 0) {
      await FusionRescueLead.updateMany({ $or: queryOr }, { $set: updateObj });
    }

    // Update OfficeHour collection
    try {
      const ohQuery = [];
      if (mongoose.Types.ObjectId.isValid(targetId)) ohQuery.push({ _id: targetId });
      if (email) ohQuery.push({ correo: email });
      if (ohQuery.length > 0) {
        await OfficeHour.updateMany({ $or: ohQuery }, { $set: { estado: 'cancelado' } });
      }
    } catch (ohErr) {
      console.warn('⚠️ OfficeHour cancellation sync warning:', ohErr.message);
    }

    let updated = await FusionRescueLead.findOne({ $or: queryOr }).sort({ updatedAt: -1, _id: -1 });
    if (!updated && targetId) {
      updated = await FusionRescueLead.findById(targetId).catch(() => null);
    }

    const leadToNotify = updated || { email, nombre, empresa };
    let emailResult = null;
    if (leadToNotify && (leadToNotify.email || leadToNotify.correo)) {
      emailResult = await sendCancellationEmailToLead(leadToNotify, dia, slot);
    }

    console.log(`❌ Cita cancelada de forma permanente en MongoDB Atlas [id=${targetId}, email=${email}]`);
    res.json({ success: true, data: updated, emailResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const handleStatusUpdate = async (req, res) => {
  try {
    const { status, meeting_date, meeting_time, meeting_link, roomId, pinAcceso, codigoReunion, send_meeting_email, email, nombre, empresa, is_reschedule } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'El campo status es requerido' });
    }
    const updateObj = { status };
    if (meeting_date !== undefined) updateObj.meeting_date = meeting_date;
    if (meeting_time !== undefined) updateObj.meeting_time = meeting_time;
    if (meeting_link !== undefined) updateObj.meeting_link = meeting_link;
    if (roomId !== undefined) updateObj.roomId = roomId;
    if (email) updateObj.email = email;
    if (nombre) updateObj.nombre = nombre;
    if (empresa) updateObj.empresa = empresa;
    if (pinAcceso !== undefined || codigoReunion !== undefined) {
      const freshPin = pinAcceso || codigoReunion;
      updateObj.pinAcceso = freshPin;
      updateObj.codigoReunion = freshPin;
    }

    const targetId = req.params.id;
    const queryOr = [];
    if (mongoose.Types.ObjectId.isValid(targetId)) queryOr.push({ _id: targetId });
    if (targetId) queryOr.push({ session_id: targetId });
    if (email) queryOr.push({ email: email });
    if (roomId) queryOr.push({ roomId: roomId });

    if (queryOr.length > 0) {
      await FusionRescueLead.updateMany({ $or: queryOr }, { $set: updateObj });
    }

    let updated = await FusionRescueLead.findOne({ $or: queryOr }).sort({ updatedAt: -1, _id: -1 });

    // Detect if this is a reschedule event
    const wasAlreadyScheduled = Boolean(updated && (updated.meeting_email_sent || updated.meeting_date || updated.status === 'Reunión Agendada' || updated.status === 'Reunión Enviada'));
    const isRescheduleEvent = is_reschedule !== undefined ? Boolean(is_reschedule) : wasAlreadyScheduled;

    // Upsert fallback for demo/legacy leads: create in MongoDB Atlas if missing so it NEVER returns 404!
    if (!updated) {
      const newLeadObj = {
        nombre: nombre || 'Prospecto',
        empresa: empresa || 'Empresa',
        email: email || 'notificaciones@fabriconsulting.com.mx',
        status: status,
        meeting_date: meeting_date || '',
        meeting_time: meeting_time || '',
        meeting_link: meeting_link || '',
        roomId: roomId || '',
        pinAcceso: pinAcceso || codigoReunion || '',
        codigoReunion: codigoReunion || pinAcceso || ''
      };
      if (mongoose.Types.ObjectId.isValid(targetId)) {
        newLeadObj._id = targetId;
      }
      updated = await FusionRescueLead.create(newLeadObj);
    }

    const mDate = meeting_date || updated.meeting_date;
    const mTime = meeting_time || updated.meeting_time;
    const mLink = meeting_link !== undefined ? meeting_link : updated.meeting_link;
    const mPin = pinAcceso || codigoReunion || updated.pinAcceso || updated.codigoReunion;

    const leadToNotify = {
      ...(updated.toObject ? updated.toObject() : updated),
      email: updated.email || email,
      nombre: updated.nombre || nombre,
      empresa: updated.empresa || empresa,
      pinAcceso: mPin,
      codigoReunion: mPin
    };

    // Sync with OfficeHour if matching email exists
    try {
      const targetEmail = leadToNotify.email || email;
      if (targetEmail) {
        await OfficeHour.updateMany({ correo: targetEmail }, {
          $set: {
            estado: status,
            fecha: mDate,
            hora: mTime,
            meetLink: mLink,
            pinAcceso: mPin,
            codigoReunion: mPin,
            roomId: roomId || updated.roomId
          }
        });
      }
    } catch (syncErr) {
      console.warn('⚠️ Sync fallback warning (FusionRescueLead -> OfficeHour):', syncErr.message);
    }

    let emailResult = null;
    if (send_meeting_email !== false && mDate) {
      emailResult = await sendMeetingInviteEmailToLead(leadToNotify, mDate, mTime, mLink, isRescheduleEvent, mPin);
      if (emailResult && emailResult.success) {
        updated = await FusionRescueLead.findByIdAndUpdate(updated._id, {
          status: 'Reunión Enviada',
          meeting_email_sent: true,
          meeting_sent_at: new Date()
        }, { new: true });
      }
    }

    createLog(`Estado de Lead actualizado a (${updated.status}): ${updated.nombre}`, 'FusionRescueLead', 'Admin', 'OK', `ID: ${updated._id} · Email enviado: ${updated.meeting_email_sent ? 'Sí' : 'No'} · Reagendado: ${isRescheduleEvent ? 'Sí' : 'No'}`);
    res.json({ success: true, data: updated, emailResult, isReschedule: isRescheduleEvent });
  } catch (err) {
    console.error('Error al actualizar status de lead:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

app.all(['/api/fusion-rescue/submissions/:id/status', '/fusion-rescue/submissions/:id/status', '/api/rescue-assessment/submissions/:id/status', '/rescue-assessment/submissions/:id/status', '/api/fusion-rescue/:id/status', '/fusion-rescue/:id/status', '/api/rescue-assessment/:id/status', '/rescue-assessment/:id/status'], handleStatusUpdate);

// ── Soft Delete Lead (Move to Trash) ──
const handleSoftDeleteLead = async (req, res) => {
  try {
    const targetId = req.params.id;
    let updated = null;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      updated = await FusionRescueLead.findByIdAndUpdate(targetId, { status: 'trash', deleted_at: new Date() }, { new: true });
    }
    if (!updated && targetId) {
      updated = await FusionRescueLead.findOneAndUpdate({ session_id: targetId }, { status: 'trash', deleted_at: new Date() }, { new: true });
    }
    if (!updated && req.body.email) {
      updated = await FusionRescueLead.findOneAndUpdate({ email: req.body.email }, { status: 'trash', deleted_at: new Date() }, { new: true });
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Lead no encontrado para mover a basurero' });
    }

    createLog(`Lead movido a Basurero: ${updated.nombre}`, 'FusionRescueLead', 'Admin', 'OK', `ID: ${updated._id}`);
    res.json({ success: true, message: 'Prospecto movido al basurero exitosamente', data: updated });
  } catch (err) {
    console.error('Error al mover lead a basurero:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

app.delete('/api/fusion-rescue/submissions/:id', handleSoftDeleteLead);
app.delete('/fusion-rescue/submissions/:id', handleSoftDeleteLead);
app.delete('/api/rescue-assessment/submissions/:id', handleSoftDeleteLead);
app.delete('/rescue-assessment/submissions/:id', handleSoftDeleteLead);

// ── Restore Lead from Trash ──
const handleRestoreLead = async (req, res) => {
  try {
    const targetId = req.params.id;
    let lead = null;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      lead = await FusionRescueLead.findById(targetId);
    }
    if (!lead && targetId) {
      lead = await FusionRescueLead.findOne({ session_id: targetId });
    }
    if (!lead && req.body.email) {
      lead = await FusionRescueLead.findOne({ email: req.body.email });
    }

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead no encontrado en el basurero' });
    }

    const restoredStatus = (lead.questions_answered_count >= 25 || lead.health_score) ? 'Completado' : 'Incompleto';
    const updated = await FusionRescueLead.findByIdAndUpdate(lead._id, {
      status: restoredStatus,
      deleted_at: null
    }, { new: true });

    createLog(`Lead recuperado del Basurero: ${updated.nombre}`, 'FusionRescueLead', 'Admin', 'OK', `ID: ${updated._id}`);
    res.json({ success: true, message: 'Prospecto restaurado exitosamente', data: updated });
  } catch (err) {
    console.error('Error al restaurar lead del basurero:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

app.patch('/api/fusion-rescue/submissions/:id/restore', handleRestoreLead);
app.patch('/fusion-rescue/submissions/:id/restore', handleRestoreLead);
app.patch('/api/rescue-assessment/submissions/:id/restore', handleRestoreLead);
app.patch('/rescue-assessment/submissions/:id/restore', handleRestoreLead);

// ── Permanent Delete Lead ──
const handlePermanentDeleteLead = async (req, res) => {
  try {
    const targetId = req.params.id;
    let deleted = null;
    if (mongoose.Types.ObjectId.isValid(targetId)) {
      deleted = await FusionRescueLead.findByIdAndDelete(targetId);
    }
    if (!deleted && targetId) {
      deleted = await FusionRescueLead.findOneAndDelete({ session_id: targetId });
    }
    if (!deleted && req.body.email) {
      deleted = await FusionRescueLead.findOneAndDelete({ email: req.body.email });
    }

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Lead no encontrado' });
    }

    createLog(`Lead eliminado definitivamente: ${deleted.nombre}`, 'FusionRescueLead', 'Admin', 'WARN', `ID: ${deleted._id}`);
    res.json({ success: true, message: 'Prospecto eliminado definitivamente de la base de datos' });
  } catch (err) {
    console.error('Error al eliminar definitivamente:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

app.delete('/api/fusion-rescue/submissions/:id/permanent', handlePermanentDeleteLead);
app.delete('/fusion-rescue/submissions/:id/permanent', handlePermanentDeleteLead);
app.delete('/api/rescue-assessment/submissions/:id/permanent', handlePermanentDeleteLead);
app.delete('/rescue-assessment/submissions/:id/permanent', handlePermanentDeleteLead);

const recentEventsCache = new Map();

// Tracking Event (IP & Click Counter with 2s Server Deduplication)
app.post(['/api/fusion-rescue/track', '/api/rescue-assessment/track'], async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const { event_type, question_id, path, utm_source, utm_medium, utm_campaign, utm_content, content_id } = req.body;

    const dedupeKey = `${clientIp}_${event_type}_${question_id || ''}_${utm_source || ''}`;
    const now = Date.now();
    const lastSeen = recentEventsCache.get(dedupeKey);

    // Deduplicate identical events from the same IP within 2000ms (prevents React 18 StrictMode double counts)
    if (lastSeen && (now - lastSeen) < 2000) {
      return res.json({ success: true, message: 'Event deduplicated' });
    }

    recentEventsCache.set(dedupeKey, now);
    if (recentEventsCache.size > 2000) {
      for (const [k, v] of recentEventsCache.entries()) {
        if (now - v > 10000) recentEventsCache.delete(k);
      }
    }

    const eventObj = new FusionRescueAnalytics({
      ip: clientIp,
      event_type: event_type || 'landing_visit',
      question_id: question_id || null,
      user_agent: userAgent,
      path: path || '/fusion-rescue',
      utm_source: utm_source || undefined,
      utm_medium: utm_medium || undefined,
      utm_campaign: utm_campaign || undefined,
      utm_content: utm_content || undefined,
      content_id: content_id || utm_content || undefined
    });

    await eventObj.save();
    console.log(`📊 Evento rastreado (+1): ${event_type} [IP: ${clientIp}, source: ${utm_source || 'direct'}, question: ${question_id || 'N/A'}]`);
    res.json({ success: true, message: 'Event tracked' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Campaign Stats Aggregation (UTM Traffic & Social Networks Breakdown with Real Timestamps)
app.get(['/api/fusion-rescue/campaign-stats', '/api/rescue-assessment/campaign-stats'], async (req, res) => {
  try {
    const analyticsVisits = await FusionRescueAnalytics.find({ event_type: 'landing_visit' });
    const leads = await FusionRescueLead.find();

    const campaignMap = {};

    const createDefaultWeekdays = () => [
      { dayName: 'Lunes', visitas: 0, leads: 0 },
      { dayName: 'Martes', visitas: 0, leads: 0 },
      { dayName: 'Miércoles', visitas: 0, leads: 0 },
      { dayName: 'Jueves', visitas: 0, leads: 0 },
      { dayName: 'Viernes', visitas: 0, leads: 0 }
    ];

    const createDefaultHourly = () => [
      { dayName: '08:00', dateStr: '8 AM - 11 AM', visitas: 0, leads: 0 },
      { dayName: '11:00', dateStr: '11 AM - 2 PM', visitas: 0, leads: 0 },
      { dayName: '14:00', dateStr: '2 PM - 5 PM', visitas: 0, leads: 0 },
      { dayName: '17:00', dateStr: '5 PM - 8 PM', visitas: 0, leads: 0 },
      { dayName: '20:00', dateStr: '8 PM - 11 PM', visitas: 0, leads: 0 }
    ];

    const getWeekdayIndex = (dateObj) => {
      const d = new Date(dateObj);
      const day = d.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      if (day === 1) return 0; // Lunes
      if (day === 2) return 1; // Martes
      if (day === 3) return 2; // Miércoles
      if (day === 4) return 3; // Jueves
      if (day === 5) return 4; // Viernes
      return -1;
    };

    const getHourlyIndex = (dateObj) => {
      try {
        const d = new Date(dateObj);
        const hourStr = d.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, timeZone: 'America/Mexico_City' });
        const hour = parseInt(hourStr, 10);
        if (!isNaN(hour)) {
          if (hour >= 7 && hour < 11) return 0;  // 08:00 (8 AM - 11 AM)
          if (hour >= 11 && hour < 14) return 1; // 11:00 (11 AM - 2 PM)
          if (hour >= 14 && hour < 17) return 2; // 14:00 (2 PM - 5 PM)
          if (hour >= 17 && hour < 20) return 3; // 17:00 (5 PM - 8 PM)
          return 4;                              // 20:00 (8 PM - 11 PM)
        }
      } catch (e) {}

      const d = new Date(dateObj);
      const hour = d.getHours();
      if (hour >= 7 && hour < 11) return 0;
      if (hour >= 11 && hour < 14) return 1;
      if (hour >= 14 && hour < 17) return 2;
      if (hour >= 17 && hour < 20) return 3;
      return 4;
    };

    // 1. Group landing visits by content_id or utm_source with real timestamps
    analyticsVisits.forEach(v => {
      const cid = v.content_id || v.utm_content || (v.utm_source ? `${v.utm_source.toUpperCase()}-GENERAL` : 'DIRECT-VISIT');
      const source = v.utm_source || 'direct';
      const medium = v.utm_medium || 'organic';
      const campaign = v.utm_campaign || 'general';

      if (!campaignMap[cid]) {
        campaignMap[cid] = {
          content_id: cid,
          utm_source: source,
          utm_medium: medium,
          utm_campaign: campaign,
          visitas: 0,
          leads_completados: 0,
          total_score: 0,
          revisiones_generadas: 0,
          weekdays_real: createDefaultWeekdays(),
          hourly_real: createDefaultHourly()
        };
      }
      campaignMap[cid].visitas += 1;

      const vDate = v.createdAt || new Date();
      const wd = getWeekdayIndex(vDate);
      if (wd >= 0) campaignMap[cid].weekdays_real[wd].visitas += 1;

      const hr = getHourlyIndex(vDate);
      if (hr >= 0) campaignMap[cid].hourly_real[hr].visitas += 1;
    });

    // 2. Group leads & scores by content_id or utm_source with real timestamps
    leads.forEach(lead => {
      const cid = lead.content_id || lead.utm_content || (lead.utm_source ? `${lead.utm_source.toUpperCase()}-GENERAL` : 'DIRECT-VISIT');
      const source = lead.utm_source || 'direct';
      const medium = lead.utm_medium || 'organic';
      const campaign = lead.utm_campaign || 'general';
      const score = lead.health_score ?? lead.totalScore ?? 0;
      const rev = lead.review_requested ? 1 : 0;

      if (!campaignMap[cid]) {
        campaignMap[cid] = {
          content_id: cid,
          utm_source: source,
          utm_medium: medium,
          utm_campaign: campaign,
          visitas: 1,
          leads_completados: 0,
          total_score: 0,
          revisiones_generadas: 0,
          weekdays_real: createDefaultWeekdays(),
          hourly_real: createDefaultHourly()
        };
      }

      campaignMap[cid].leads_completados += 1;
      campaignMap[cid].total_score += score;
      campaignMap[cid].revisiones_generadas += rev;

      if (campaignMap[cid].visitas < campaignMap[cid].leads_completados) {
        campaignMap[cid].visitas = campaignMap[cid].leads_completados;
      }

      const lDate = lead.createdAt || lead.assessment_date || new Date();
      const wd = getWeekdayIndex(lDate);
      if (wd >= 0) campaignMap[cid].weekdays_real[wd].leads += 1;

      const hr = getHourlyIndex(lDate);
      if (hr >= 0) campaignMap[cid].hourly_real[hr].leads += 1;
    });

    const isNA = (str) => {
      if (!str) return false;
      const s = String(str).trim().toLowerCase();
      return s === 'n/a' || s === 'na' || s === 'none' || s === '(none)';
    };

    const result = Object.values(campaignMap)
      .filter(c => !isNA(c.content_id) && !isNA(c.utm_source) && !isNA(c.utm_campaign))
      .map((c) => {
        const avgScore = c.leads_completados > 0 ? Math.round(c.total_score / c.leads_completados) : 0;
        const convRate = c.visitas > 0 ? ((c.leads_completados / c.visitas) * 100).toFixed(1) + '%' : '0.0%';
        return {
          content_id: c.content_id,
          utm_source: c.utm_source,
          utm_medium: c.utm_medium,
          utm_campaign: c.utm_campaign,
          visitas: c.visitas,
          leads_completados: c.leads_completados,
          score_promedio: avgScore,
          revisiones_generadas: c.revisiones_generadas,
          conversion_rate: convRate,
          weekdays_real: c.weekdays_real,
          hourly_real: c.hourly_real
        };
      });

    res.json({
      success: true,
      data: result,
      total_landing_visits: analyticsVisits.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear Analytics Metrics (Reset counters to 0)
app.delete(['/api/fusion-rescue/analytics/clear', '/api/rescue-assessment/analytics/clear'], async (req, res) => {
  try {
    await FusionRescueAnalytics.deleteMany({});
    createLog('Limpieza de Analítica de Fusion Rescue', 'FusionRescueAnalytics', 'Admin', 'WARNING', 'Se restablecieron a cero todos los eventos de interacción y contadores de la base de datos.');
    console.log('🗑️ Se limpiaron exitosamente todos los registros de analítica en fusion_rescue_analytics');
    res.json({ success: true, message: 'Se han limpiado todos los datos de analítica exitosamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dashboard Stats Aggregation
app.get(['/api/fusion-rescue/dashboard-stats', '/api/rescue-assessment/dashboard-stats'], async (req, res) => {
  try {
    const pathFilter = { $regex: /fusion-rescue/i };
    const landingVisits = await FusionRescueAnalytics.countDocuments({ event_type: 'landing_visit', path: pathFilter });
    const assessmentStarts = await FusionRescueAnalytics.countDocuments({ event_type: 'assessment_start', path: pathFilter });
    const assessmentCompletes = await FusionRescueAnalytics.countDocuments({ event_type: 'assessment_complete', path: pathFilter });
    const leadCaptures = await FusionRescueLead.countDocuments({ landing_page: pathFilter });
    const reviewRequests = await FusionRescueLead.countDocuments({ landing_page: pathFilter, review_requested: true });

    const questionsList = [
      { id: 'q01', label: 'P01 - Procesos principales en Fusion' },
      { id: 'q02', label: 'P02 - Manualidad fuera de Fusion' },
      { id: 'q03', label: 'P03 - Conciliaciones manuales' },
      { id: 'q04', label: 'P04 - Cierre mensual' },
      { id: 'q05', label: 'P05 - Carga de asientos contables' },
      { id: 'q06', label: 'P06 - Variación de saldos' },
      { id: 'q07', label: 'P07 - Calidad de datos maestros' },
      { id: 'q08', label: 'P08 - Datos duplicados o incompletos' },
      { id: 'q09', label: 'P09 - Fallas en integraciones' },
      { id: 'q10', label: 'P10 - Intervención manual en interfaces' },
      { id: 'q11', label: 'P11 - Adopción real de usuarios' },
      { id: 'q12', label: 'P12 - Uso de Excel paralelo' },
      { id: 'q13', label: 'P13 - Backlog de tickets' },
      { id: 'q14', label: 'P14 - Tiempo de respuesta de soporte' },
      { id: 'q15', label: 'P15 - Pruebas de updates trimestrales' },
      { id: 'q16', label: 'P16 - Documentación de procesos' },
      { id: 'q17', label: 'P17 - Reportes de BI/OTBI' },
      { id: 'q18', label: 'P18 - Gobernanza de cambios' },
      { id: 'q19', label: 'P19 - Seguridad y roles de Fusion' },
      { id: 'q20', label: 'P20 - Capacidad del equipo interno' },
      { id: 'q21', label: 'P21 - Dependencia del partner actual' },
      { id: 'q22', label: 'P22 - Visibilidad del roadmap OCI' },
      { id: 'q23', label: 'P23 - Impacto financiero de fallas' },
      { id: 'q24', label: 'P24 - Grado de urgencia del negocio' },
      { id: 'q25', label: 'P25 - Expectativa de resolución' }
    ];

    const questionDropOffs = [];
    for (const q of questionsList) {
      const qCount = await FusionRescueAnalytics.countDocuments({ event_type: 'question_answered', question_id: q.id });
      let rateStr = '0.0%';
      if (assessmentStarts > 0) {
        const dropRatio = Math.max(0, ((assessmentStarts - qCount) / assessmentStarts) * 100);
        rateStr = dropRatio.toFixed(1) + '%';
      }
      questionDropOffs.push({
        question: q.label,
        dropOffRate: rateStr,
        answeredCount: qCount
      });
    }

    res.json({
      success: true,
      data: {
        landing_visits: landingVisits,
        assessment_starts: assessmentStarts,
        assessment_completes: assessmentCompletes,
        lead_captures: leadCaptures,
        review_requests: reviewRequests,
        questionDropOffs
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get(['/api/fusion-rescue/submissions', '/api/rescue-assessment/submissions', '/rescue-assessment/submissions', '/api/rescue-assessments', '/api/admin/rescue-assessments'], async (req, res) => {
  try {
    const submissions = await FusionRescueLead.find().sort({ createdAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/fusion-rescue/submissions/:id', '/api/rescue-assessment/submissions/:id', '/rescue-assessment/submissions/:id', '/api/rescue-assessment/:id'], async (req, res) => {
  try {
    await FusionRescueLead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Registro de Fusion Rescue eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test Email Route (Allows triggering a real test email directly from browser URL)
app.all(['/api/fusion-rescue/test-email', '/fusion-rescue/test-email'], async (req, res) => {
  try {
    let settings = await RescueSettings.findOne();
    const recipientEmails = (settings && Array.isArray(settings.notification_emails) && settings.notification_emails.length > 0)
      ? settings.notification_emails
      : ['antonio.salazar@fabricsoft.com.mx'];

    if (!resend) {
      return res.status(500).json({
        success: false,
        error: 'RESEND_API_KEY no encontrada en las variables de entorno.',
        recipients: recipientEmails
      });
    }

    const testLeadMock = {
      nombre: 'Prueba Externa Directa',
      first_name: 'Prueba Externa',
      last_name: 'FABRIC',
      empresa: 'Empresa Test',
      company_name: 'Empresa Test',
      email: 'test@fabricsoft.com.mx',
      phone: '+52 55 1234 5678',
      job_title: 'Director de TI',
      health_score: 45,
      health_classification: 'HIGH RISK',
      recommended_path: 'RESCUE DIRECT',
      problema_principal: 'Falla en integraciones OIC y discrepancias financieras',
      timing_prioridad: 'Inmediato (1-3 meses)',
      utm_source: 'Prueba URL Directa',
      utm_campaign: 'Test Manual Endpoint',
      review_requested: req.query.review === 'true'
    };

    await sendLeadAlertEmail(testLeadMock);

    return res.json({
      success: true,
      message: `⚡ Correo de prueba enviado exitosamente a los destinatarios configurados en MongoDB Atlas!`,
      subject: testLeadMock.review_requested ? 'Lead requiere reunion de 30 minutos: Prueba Externa (Empresa Test)' : 'Lead Completo el formulario: Prueba Externa (Empresa Test)',
      recipients: recipientEmails,
      testData: testLeadMock
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Settings para Rescue Fusion
const RescueSettingsSchema = new mongoose.Schema({
  crm_webhook_url: { type: String, default: 'https://api.fabricsoft.com.mx/webhook/crm-fusion' },
  webhook_secret: { type: String, default: '' },
  notification_emails: { type: [String], default: ['antonio.salazar@fabricsoft.com.mx'] },
  notify_incomplete_leads: { type: Boolean, default: true },
  risk_threshold_score: { type: Number, default: 50 },
  enable_auto_reengagement: { type: Boolean, default: true }
}, { timestamps: true });
const RescueSettings = mongoose.models.RescueSettings || mongoose.model('RescueSettings', RescueSettingsSchema);

async function handleGetSettings(req, res) {
  try {
    let settings = await RescueSettings.findOne();
    if (!settings) {
      settings = await RescueSettings.create({
        crm_webhook_url: 'https://api.fabricsoft.com.mx/webhook/crm-fusion',
        webhook_secret: '',
        notification_emails: ['antonio.salazar@fabricsoft.com.mx'],
        notify_incomplete_leads: true,
        risk_threshold_score: 50,
        enable_auto_reengagement: true
      });
    }
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handlePostSettings(req, res) {
  try {
    const {
      crm_webhook_url,
      webhook_secret,
      notification_emails,
      notify_incomplete_leads,
      risk_threshold_score,
      enable_auto_reengagement
    } = req.body || {};

    let settings = await RescueSettings.findOne();
    if (!settings) {
      settings = await RescueSettings.create({
        crm_webhook_url: crm_webhook_url || 'https://api.fabricsoft.com.mx/webhook/crm-fusion',
        webhook_secret: webhook_secret || '',
        notification_emails: Array.isArray(notification_emails) ? notification_emails : [],
        notify_incomplete_leads: notify_incomplete_leads !== undefined ? Boolean(notify_incomplete_leads) : true,
        risk_threshold_score: Number(risk_threshold_score) || 50,
        enable_auto_reengagement: enable_auto_reengagement !== undefined ? Boolean(enable_auto_reengagement) : true
      });
    } else {
      if (crm_webhook_url !== undefined) settings.crm_webhook_url = crm_webhook_url;
      if (webhook_secret !== undefined) settings.webhook_secret = webhook_secret;
      if (Array.isArray(notification_emails)) {
        settings.notification_emails = notification_emails;
        settings.markModified('notification_emails');
      }
      if (notify_incomplete_leads !== undefined) settings.notify_incomplete_leads = Boolean(notify_incomplete_leads);
      if (risk_threshold_score !== undefined) settings.risk_threshold_score = Number(risk_threshold_score);
      if (enable_auto_reengagement !== undefined) settings.enable_auto_reengagement = Boolean(enable_auto_reengagement);

      await settings.save();
    }
    createLog(`Configuración del Sistema actualizada`, 'RescueSettings', 'Admin', 'OK', `Emails: ${settings.notification_emails.join(', ')}`);
    return res.json({ success: true, data: settings, message: 'Configuración guardada exitosamente' });
  } catch (err) {
    console.error('Error al guardar settings:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

const settingsPaths = [
  '/api/fusion-rescue/settings',
  '/fusion-rescue/settings',
  '/api/rescue-assessment/settings',
  '/rescue-assessment/settings',
  '/api/settings',
  '/settings'
];

app.all(settingsPaths, (req, res) => {
  if (req.method === 'GET') return handleGetSettings(req, res);
  if (req.method === 'POST') return handlePostSettings(req, res);
  res.status(405).json({ success: false, error: 'Método no permitido' });
});

// Endpoint Health / Ping
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// --- SALA DE VIDEOLLAMADAS Y REUNIONES MULTI-ID EN TIEMPO REAL ---
let roomsData = new Map();

function getOrCreateRoom(roomId) {
  const cleanId = (roomId || 'FABRIC-MEET-8821').toUpperCase();
  if (!roomsData.has(cleanId)) {
    roomsData.set(cleanId, {
      peers: new Map(),
      messages: [
        {
          id: '1',
          sender: 'Sistema FabricSoft',
          role: 'system',
          text: `Sala [${cleanId}] compartida en tiempo real activa.`,
          time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        }
      ],
      activityLogs: []
    });
  }
  return roomsData.get(cleanId);
}

// Limpieza periódica de participantes inactivos por sala (desconectados tras 6s)
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of roomsData.entries()) {
    for (const [peerId, peer] of room.peers.entries()) {
      if (now - peer.lastPing > 6000) {
        room.peers.delete(peerId);
        room.activityLogs.push({
          id: Date.now().toString(),
          type: 'leave',
          name: peer.name,
          role: peer.role,
          time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        });
      }
    }
  }
}, 2500);

// Endpoint: Sincronización de sala específica por roomId
app.post('/api/room/sync', (req, res) => {
  const { roomId, peerId, name, role, isVideoOn, isAudioOn, isScreenSharing, frameData, screenFrameData } = req.body;
  if (!peerId) return res.status(400).json({ error: 'peerId requerido' });

  const room = getOrCreateRoom(roomId);
  const existing = room.peers.get(peerId);
  if (!existing && name) {
    room.activityLogs.push({
      id: Date.now().toString(),
      type: 'join',
      name,
      role: role || 'Participante',
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    });
  }

  room.peers.set(peerId, {
    peerId,
    name: name || existing?.name || 'Participante',
    role: role || existing?.role || 'Invitado',
    isVideoOn: isVideoOn !== undefined ? isVideoOn : (existing?.isVideoOn ?? true),
    isAudioOn: isAudioOn !== undefined ? isAudioOn : (existing?.isAudioOn ?? true),
    isScreenSharing: isScreenSharing !== undefined ? isScreenSharing : (existing?.isScreenSharing ?? false),
    frameData: frameData || existing?.frameData || null,
    screenFrameData: screenFrameData || existing?.screenFrameData || null,
    lastPing: Date.now()
  });

  return res.json({
    roomId: (roomId || 'FABRIC-MEET-8821').toUpperCase(),
    peers: Array.from(room.peers.values()),
    messages: room.messages,
    activityLogs: room.activityLogs
  });
});

// --- SEÑALIZACIÓN WEBRTC PARA VIDEOLLAMADA NATIVA DIRECTA ---
let roomSignals = new Map();

app.post('/api/room/signal', (req, res) => {
  const { roomId, from, to, signal } = req.body;
  if (!roomId || !from || !signal) return res.status(400).json({ error: 'Faltan datos' });

  const cleanId = (roomId || 'FABRIC-MEET-8821').toUpperCase();
  if (!roomSignals.has(cleanId)) {
    roomSignals.set(cleanId, []);
  }

  const list = roomSignals.get(cleanId);
  list.push({ from, to: to || 'all', signal, time: Date.now() });

  const now = Date.now();
  const filtered = list.filter(s => now - s.time < 30000).slice(-150);
  roomSignals.set(cleanId, filtered);

  return res.json({ success: true });
});

app.get('/api/room/signal', (req, res) => {
  const { roomId, peerId } = req.query;
  if (!roomId || !peerId) return res.json({ signals: [] });

  const cleanId = (roomId || 'FABRIC-MEET-8821').toUpperCase();
  const list = roomSignals.get(cleanId) || [];
  
  const mySignals = list.filter(s => (s.to === peerId || s.to === 'all') && s.from !== peerId);
  return res.json({ signals: mySignals });
});

// Endpoint: Enviar mensaje de chat a sala específica
app.post('/api/room/message', (req, res) => {
  const { roomId, sender, role, text } = req.body;
  if (!text) return res.status(400).json({ error: 'Texto requerido' });

  const room = getOrCreateRoom(roomId);
  const chatItem = {
    id: Date.now().toString(),
    sender: sender || 'Usuario',
    role: role || 'client',
    text: text.trim(),
    time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  };

  room.messages.push(chatItem);
  return res.json({ success: true, chatItem, messages: room.messages });
});

// Endpoint: Abandonar sala específica
app.post('/api/room/leave', (req, res) => {
  let roomId, peerId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    roomId = body.roomId;
    peerId = body.peerId;
  } catch {}

  if (roomId && peerId) {
    const room = getOrCreateRoom(roomId);
    if (room && room.peers && room.peers.has(peerId)) {
      const peer = room.peers.get(peerId);
      room.peers.delete(peerId);
      room.activityLogs.push({
        id: Date.now().toString(),
        type: 'leave',
        name: peer.name,
        role: peer.role,
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      });
    }
  }
  return res.json({ success: true });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend Express MongoDB corriendo en http://localhost:${PORT}`);
  });
}

export default app;
