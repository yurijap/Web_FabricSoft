const Booking         = require('../models/model.officeHoursBooking');
const calendarService = require('../services/calendar.service');
const { sendConfirmacionOfficeHours } = require('../services/email.service');
const { log } = require('../services/log.service');
const { sanitizeTracking } = require('../utils/tracking');

const PUBLIC_DOMAINS = ['gmail','hotmail','yahoo','outlook','icloud','live','msn','me','proton'];

function isPublicEmail(email) {
  const domain = (email.split('@')[1] || '').split('.')[0].toLowerCase();
  return PUBLIC_DOMAINS.includes(domain);
}

exports.book = async (req, res) => {
  try {
    const { nombre, cargo, empresa, email, revenue, iniciativaOracle, plazo, dia, slot, tracking } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido.' });
    if (!empresa?.trim()) return res.status(400).json({ error: 'Empresa requerida.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido.' });
    if (isPublicEmail(email)) return res.status(400).json({ error: 'Usa tu correo corporativo.' });
    if (!dia) return res.status(400).json({ error: 'Selecciona un día.' });
    if (!slot) return res.status(400).json({ error: 'Selecciona un horario.' });

    // Límite de 4 sesiones por mes (brief)
    const monthPrefix = dia.slice(0, 7); // "YYYY-MM"
    const monthCount = await Booking.countDocuments({
      dia: { $regex: `^${monthPrefix}` },
      status: { $ne: 'cancelado' },
    });
    if (monthCount >= MONTHLY_LIMIT) {
      return res.status(409).json({ error: 'Las 4 sesiones de este mes ya están reservadas. Consulta el próximo mes.' });
    }

    // Anti-duplicate: same slot same day
    const existing = await Booking.findOne({ dia, slot, status: { $ne: 'cancelado' } });
    if (existing) return res.status(409).json({ error: 'Ese horario ya fue reservado. Elige otro.' });

    const booking = await Booking.create({
      nombre:    nombre.trim(),
      cargo:     cargo?.trim() || '',
      empresa:   empresa.trim(),
      email:     email.trim().toLowerCase(),
      revenue:   revenue?.trim() || '',
      iniciativaOracle: iniciativaOracle?.trim() || '',
      plazo:     plazo?.trim() || '',
      dia,
      slot,
      ipAddress: req.ip || '',
      tracking:  sanitizeTracking(tracking),
    });

    log({
      accion:    `CREATE · Office Hours · ${booking.empresa}`,
      categoria: 'Office Hours',
      autor:     'system',
      detalle:   `${booking.dia} ${booking.slot} · ${booking.nombre}`,
    });

    res.status(201).json({ ok: true, data: booking });
  } catch (err) {
    console.error('officeHours.book error:', err);
    res.status(500).json({ error: 'Error interno al guardar la reserva.' });
  }
};

exports.solicitar = async (req, res) => {
  try {
    const { nombre, cargo, empresa, email, revenue, iniciativaOracle, plazo, tracking } = req.body;

    if (!nombre?.trim()) return res.status(400).json({ error: 'Nombre requerido.' });
    if (!empresa?.trim()) return res.status(400).json({ error: 'Empresa requerida.' });
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Email inválido.' });
    if (isPublicEmail(email)) return res.status(400).json({ error: 'Usa tu correo corporativo.' });

    const booking = await Booking.create({
      nombre:    nombre.trim(),
      cargo:     cargo?.trim() || '',
      empresa:   empresa.trim(),
      email:     email.trim().toLowerCase(),
      revenue:   revenue?.trim() || '',
      iniciativaOracle: iniciativaOracle?.trim() || '',
      plazo:     plazo?.trim() || '',
      dia:       '',
      slot:      '',
      ipAddress: req.ip || '',
      tracking:  sanitizeTracking(tracking),
    });

    log({
      accion:    `SOLICITUD · Office Hours · ${booking.empresa}`,
      categoria: 'Office Hours',
      autor:     'system',
      detalle:   `Sin slot · ${booking.nombre}`,
    });

    res.status(201).json({ ok: true, data: booking });
  } catch (err) {
    console.error('officeHours.solicitar error:', err);
    res.status(500).json({ error: 'Error interno al guardar la solicitud.' });
  }
};

exports.listar = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'Todos') filter.status = status;

    const [data, total] = await Promise.all([
      Booking.find(filter).sort({ createdAt: -1 }),
      Booking.countDocuments(filter),
    ]);

    res.json({ ok: true, data, total });
  } catch (err) {
    console.error('officeHours.listar error:', err);
    res.status(500).json({ error: 'Error listando reservas.' });
  }
};

exports.actualizarStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const VALID = ['pendiente', 'confirmado', 'cancelado'];

    if (!VALID.includes(status)) return res.status(400).json({ error: 'Status inválido.' });

    const update = { status };
    if (status === 'confirmado') update.emailEnviado = false;

    const booking = await Booking.findByIdAndUpdate(id, update, { new: true });
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada.' });

    log({
      accion:    `${status.toUpperCase()} · Office Hours · ${booking.empresa}`,
      categoria: 'Office Hours',
      autor:     'admin',
      status:    status === 'cancelado' ? 'WARN' : 'OK',
      detalle:   `${booking.dia} ${booking.slot}`,
    });

    res.json({ ok: true, data: booking });

    if (status === 'confirmado') {
      if (!booking.calendarEventId) {
        calendarService.createOfficeHoursEvent(booking)
          .then(event => Booking.findByIdAndUpdate(id, {
            calendarEnviado: true,
            calendarEventId: event.id || '',
          }))
          .catch(err => {
            console.error('Calendar OH fallo:', err.message);
          });
      }

      sendConfirmacionOfficeHours(booking)
        .then(() => Booking.findByIdAndUpdate(id, { emailEnviado: true }))
        .catch(err => {
          console.error('Email confirmacion OH fallo:', err.message);
        });
    }

    if (status === 'cancelado' && booking.calendarEventId) {
      calendarService.deleteOfficeHoursEvent(booking.calendarEventId)
        .then(() => Booking.findByIdAndUpdate(id, {
          calendarEnviado: false,
          calendarEventId: '',
        }))
        .catch(err => {
          console.error('Calendar OH delete fallo:', err.message);
        });
    }
  } catch (err) {
    console.error('officeHours.actualizarStatus error:', err);
    res.status(500).json({ error: 'Error actualizando status.' });
  }
};

exports.reintentarEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada.' });
    if (booking.status !== 'confirmado') return res.status(400).json({ error: 'Solo se puede enviar email de reservas confirmadas.' });

    await Booking.findByIdAndUpdate(id, { emailEnviado: false });
    await sendConfirmacionOfficeHours(booking);
    const updated = await Booking.findByIdAndUpdate(id, { emailEnviado: true }, { new: true });

    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('officeHours.reintentarEmail error:', err);
    res.status(500).json({ error: err.message || 'Error reintentando email.' });
  }
};

exports.reintentarCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Reserva no encontrada.' });
    if (booking.status !== 'confirmado') return res.status(400).json({ error: 'Solo se puede crear evento de reservas confirmadas.' });

    if (booking.calendarEventId) {
      const alreadyUpdated = await Booking.findByIdAndUpdate(id, { calendarEnviado: true }, { new: true });
      return res.json({ ok: true, data: alreadyUpdated, message: 'Evento ya existia en Calendar.' });
    }

    const event = await calendarService.createOfficeHoursEvent(booking);
    const updated = await Booking.findByIdAndUpdate(id, {
      calendarEnviado: true,
      calendarEventId: event.id || '',
    }, { new: true });

    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error('officeHours.reintentarCalendar error:', err);
    res.status(500).json({ error: err.message || 'Error creando evento en Calendar.' });
  }
};

const DEFAULT_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','16:00'];
const MONTHLY_LIMIT = 4;

// GET /office-hours/disponibilidad/mes?year=2026&month=7
exports.disponibilidadMes = async (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;

  const monthBookings = await Booking.find(
    { dia: { $regex: `^${prefix}` }, status: { $ne: 'cancelado' } }, 'dia slot'
  ).catch(() => []);

  // Si el mes ya alcanzó el límite, no hay días disponibles
  if (monthBookings.length >= MONTHLY_LIMIT) {
    return res.json({ ok: true, data: {}, monthFull: true, booked: monthBookings.length, limit: MONTHLY_LIMIT });
  }

  const remaining = MONTHLY_LIMIT - monthBookings.length;

  const dbByDay = {};
  monthBookings.forEach(b => {
    if (!dbByDay[b.dia]) dbByDay[b.dia] = new Set();
    dbByDay[b.dia].add(b.slot);
  });

  try {
    const rawData = await calendarService.getMonthAvailability(year, month, dbByDay);
    // Normalizar: cada día con slots disponibles muestra remaining (cupos mensuales restantes)
    const data = {};
    Object.keys(rawData).forEach(dateStr => {
      if (rawData[dateStr] > 0) data[dateStr] = remaining;
    });
    res.json({ ok: true, data, booked: monthBookings.length, limit: MONTHLY_LIMIT });
  } catch (err) {
    console.error('officeHours.disponibilidadMes error:', err.message);
    try {
      const today = new Date().toISOString().split('T')[0];
      const daysInMonth = new Date(year, month, 0).getDate();
      const data = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${prefix}${String(d).padStart(2, '0')}`;
        if (dateStr <= today) continue; // excluir hoy y días pasados — solo desde mañana
        const dow = new Date(dateStr + 'T12:00:00').getDay();
        if (dow === 0 || dow === 6) continue;
        const taken = dbByDay[dateStr] ? dbByDay[dateStr].size : 0;
        if (DEFAULT_SLOTS.length - taken > 0) data[dateStr] = remaining;
      }
      res.json({ ok: true, data, booked: monthBookings.length, limit: MONTHLY_LIMIT, error: 'calendar_unavailable' });
    } catch {
      res.json({ ok: true, data: {}, error: 'calendar_unavailable' });
    }
  }
};

// GET /office-hours/disponibilidad/dia?date=2026-07-05
exports.disponibilidadDia = async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Parámetro date requerido (YYYY-MM-DD).' });

  // DB siempre se consulta primero — independiente de Calendar
  const dbBookings = await Booking.find({ dia: date, status: { $ne: 'cancelado' } }, 'slot').catch(() => []);
  const dbTaken    = dbBookings.map(b => b.slot);

  const isToday = date === new Date().toISOString().split('T')[0];
  const nowHHMM = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City' });

  function filterSlots(raw) {
    return raw.map(s => ({
      ...s,
      taken: s.taken || (isToday && s.time <= nowHHMM),
    }));
  }

  try {
    const slots = await calendarService.getDaySlots(date, dbTaken);
    res.json({ ok: true, data: filterSlots(slots) });
  } catch (err) {
    console.error('officeHours.disponibilidadDia error:', err.message);
    const data = DEFAULT_SLOTS.map(time => ({ time, taken: dbTaken.includes(time) || (isToday && time <= nowHHMM) }));
    res.json({ ok: true, data, error: 'calendar_unavailable' });
  }
};

// Devuelve qué slots están tomados para un día dado
exports.slotsOcupados = async (req, res) => {
  try {
    const { dia } = req.query;
    if (!dia) return res.status(400).json({ error: 'Parámetro dia requerido.' });

    const bookings = await Booking.find({ dia, status: { $ne: 'cancelado' } }, 'slot');
    const ocupados = bookings.map(b => b.slot);

    res.json({ ok: true, ocupados });
  } catch (err) {
    console.error('officeHours.slotsOcupados error:', err);
    res.status(500).json({ error: 'Error consultando slots.' });
  }
};
