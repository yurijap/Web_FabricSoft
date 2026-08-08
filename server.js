import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

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
connectDb().catch(() => {});

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

const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
const OfficeHour = mongoose.models.OfficeHour || mongoose.model('OfficeHour', OfficeHourSchema);
const PaperRequest = mongoose.models.PaperRequest || mongoose.model('PaperRequest', PaperRequestSchema);
const ReferenciaRequest = mongoose.models.ReferenciaRequest || mongoose.model('ReferenciaRequest', ReferenciaRequestSchema);
const ReferenciaItem = mongoose.models.ReferenciaItem || mongoose.model('ReferenciaItem', ReferenciaItemSchema);
const CalendarSlot = mongoose.models.CalendarSlot || mongoose.model('CalendarSlot', CalendarSlotSchema);
const GeneralMeeting = mongoose.models.GeneralMeeting || mongoose.model('GeneralMeeting', GeneralMeetingSchema);

// Helper para sembrar datos demo iniciales si la BD está vacía
async function seedInitialDataIfEmpty() {
  try {
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
    console.log('🧹 MongoDB Atlas vaciada completamente');
    res.json({ success: true, message: 'Base de datos MongoDB Atlas vaciada completamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= RUTAS API PARA CLIENTES Y EVALUACIONES (LEADS) =================
app.get(['/api/leads/admin', '/api/leads'], async (req, res) => {
  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
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
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/leads/admin/:id', '/api/leads/:id'], async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Lead eliminado' });
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
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put(['/api/referencias/:id', '/api/admin/referencias/items/:id'], async (req, res) => {
  try {
    const updated = await ReferenciaItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete(['/api/referencias/:id', '/api/admin/referencias/items/:id'], async (req, res) => {
  try {
    await ReferenciaItem.findByIdAndDelete(req.params.id);
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

// ================= RUTAS API PARA DISPONIBILIDAD DE CALENDARIO PÚBLICO =================
app.get('/api/office-hours/disponibilidad/mes', async (req, res) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    
    // Todos los registros de OfficeHour en MongoDB
    const allOfficeHours = await OfficeHour.find();

    // Slots abiertos explicitamente por Admin
    const adminOpenSlots = allOfficeHours.filter(item => 
      item.estado === 'disponible' || item.fase === 99 || item.usuario === 'Slot Abierto por Admin'
    );

    // Citas ya reservadas por clientes
    const bookedMeetings = allOfficeHours.filter(item => 
      ['pendiente', 'confirmado', 'reservado'].includes((item.estado || '').toLowerCase()) && item.fase !== 99 && item.usuario !== 'Slot Abierto por Admin'
    );
    const bookedSet = new Set(bookedMeetings.map(b => `${b.fecha} ${b.hora}`));

    const monthData = {};
    const defaultHours = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','02:00 PM','02:30 PM','03:00 PM','04:00 PM'];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
      
      // Excluir fines de semana (Sábado = 6, Domingo = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        monthData[dateStr] = 0;
        continue;
      }
      
      const customDaySlots = adminOpenSlots.filter(s => s.fecha === dateStr);

      if (customDaySlots.length > 0) {
        // Horarios específicos abiertos por el Admin para este día
        const freeCount = customDaySlots.filter(s => !bookedSet.has(`${dateStr} ${s.hora}`)).length;
        monthData[dateStr] = freeCount;
      } else if (adminOpenSlots.length === 0) {
        // Fallback: Si el Super Admin aún no abre slots específicos, habilitar horarios por defecto de L-V
        const dayBookings = bookedMeetings.filter(b => b.fecha === dateStr).map(b => b.hora);
        const freeCount = defaultHours.filter(h => !dayBookings.includes(h)).length;
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
    const defaultHours = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','02:00 PM','02:30 PM','03:00 PM','04:00 PM'];
    
    const allOfficeHours = await OfficeHour.find();

    const adminOpenSlots = allOfficeHours.filter(item => 
      (item.fecha === date) && (item.estado === 'disponible' || item.fase === 99 || item.usuario === 'Slot Abierto por Admin')
    );

    const bookedMeetings = allOfficeHours.filter(item => 
      item.fecha === date && ['pendiente', 'confirmado', 'reservado'].includes((item.estado || '').toLowerCase()) && item.fase !== 99 && item.usuario !== 'Slot Abierto por Admin'
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

    res.json({ success: true, data: slots });
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
      isCreatedByAdmin: item.fase === 99 || item.usuario === 'Slot Abierto por Admin',
      createdAt: item.createdAt || new Date().toISOString()
    }));
    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error("❌ Error en GET /api/office-hours/admin:", err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// Crear nueva reunión o slot (Super Admin / Cliente) en MongoDB
app.post(['/api/office-hours/admin', '/api/office-hours/book'], async (req, res) => {
  try {
    const { fecha, dia, hora, slot, usuario, nombre, correo, email, telefono, cargo, empresa, estado, status, isCreatedByAdmin, revenue, iniciativaOracle, iniciativa, plazo } = req.body;
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
      meetLink: `https://meet.google.com/fabric-${Date.now().toString().slice(-4)}`
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
    const { status, estado, meetLink, codigoReunion } = req.body;
    const newStatus = status || estado || 'pendiente';
    const updateObj = { estado: newStatus };
    if (meetLink) updateObj.meetLink = meetLink;
    if (codigoReunion) updateObj.codigoReunion = codigoReunion;

    const updated = await OfficeHour.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Reunión no encontrada' });
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
      isCreatedByAdmin: updated.fase === 99,
      createdAt: updated.createdAt
    };
    console.log(`✅ Reunión aprobada/actualizada en MongoDB Atlas [id=${updated._id}, estado=${updated.estado}, link=${updated.meetLink}]`);
    res.json({ success: true, data: formatted });
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

// Endpoint Health / Ping
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend Express MongoDB corriendo en http://localhost:${PORT}`);
  });
}

export default app;
