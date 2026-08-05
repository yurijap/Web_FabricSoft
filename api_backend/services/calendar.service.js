const { google }   = require('googleapis');
const { DateTime } = require('luxon');

const TZ = process.env.GOOGLE_CALENDAR_TIMEZONE || 'America/Mexico_City';

// Todos los slots posibles de Office Hours (hora local MX)
const ALL_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '16:00'];

function getAuth() {
  // Normaliza la clave sin importar cómo dotenv manejó los saltos de línea
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
  const privateKey = rawKey.includes('\\n')
    ? rawKey.replace(/\\n/g, '\n')
    : rawKey;

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
}

function getCalendarClient() {
  const auth = getAuth();
  return google.calendar({ version: 'v3', auth });
}

// Devuelve los slots que un evento bloquea en un día dado
// event.start / event.end son ISO strings UTC
function slotsBlockedByEvent(dateStr, eventStart, eventEnd) {
  const blocked = [];
  for (const slot of ALL_SLOTS) {
    const [h, m] = slot.split(':').map(Number);
    const slotStart = DateTime.fromISO(`${dateStr}T${slot}:00`, { zone: TZ });
    const slotEnd   = slotStart.plus({ minutes: 30 });
    const evStart   = DateTime.fromISO(eventStart).setZone(TZ);
    const evEnd     = DateTime.fromISO(eventEnd).setZone(TZ);

    // Overlap: evento empieza antes de que el slot termine y termina después de que empieza
    if (evStart < slotEnd && evEnd > slotStart) blocked.push(slot);
  }
  return blocked;
}

/**
 * Retorna slots ocupados por Google Calendar para un rango.
 * Resultado: { 'YYYY-MM-DD': Set<'HH:MM'> }
 */
async function getCalendarBusy(startISO, endISO) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) return {};

  const calendar = getCalendarClient();

  const freebusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin:  startISO,
      timeMax:  endISO,
      timeZone: TZ,
      items:    [{ id: calendarId }],
    },
  });

  const busyPeriods = freebusyRes.data.calendars?.[calendarId]?.busy ?? [];

  // Agrupar slots bloqueados por fecha (hora local MX)
  const byDate = {};
  for (const period of busyPeriods) {
    const start = DateTime.fromISO(period.start).setZone(TZ);
    const end   = DateTime.fromISO(period.end).setZone(TZ);

    // El evento puede cruzar medianoche — iteramos por días afectados
    let cursor = start.startOf('day');
    while (cursor <= end.startOf('day')) {
      const dateStr = cursor.toISODate();
      if (!byDate[dateStr]) byDate[dateStr] = new Set();
      slotsBlockedByEvent(dateStr, period.start, period.end).forEach(s => byDate[dateStr].add(s));
      cursor = cursor.plus({ days: 1 });
    }
  }

  return byDate;
}

/**
 * Disponibilidad de un mes completo.
 * Retorna { 'YYYY-MM-DD': availableCount }  (solo días con al menos 1 slot)
 */
exports.getMonthAvailability = async (year, month, dbByDay = {}) => {
  const start = DateTime.fromObject({ year, month, day: 1 }, { zone: TZ });
  const end   = start.endOf('month');

  const calendarBusy = await getCalendarBusy(start.toISO(), end.toISO());

  const result = {};
  let cursor = start;
  while (cursor <= end) {
    const dateStr = cursor.toISODate();
    const dow = cursor.weekday; // 1=Lun … 7=Dom
    if (dow < 6) { // solo lun-vie
      const gcalBlocked = calendarBusy[dateStr] ?? new Set();
      const dbTaken     = dbByDay[dateStr]       ?? new Set();
      const available = ALL_SLOTS.filter(s => !gcalBlocked.has(s) && !dbTaken.has(s));
      if (available.length > 0) result[dateStr] = available.length;
    }
    cursor = cursor.plus({ days: 1 });
  }
  return result;
};

/**
 * Disponibilidad de un día específico.
 * Retorna [{ time, taken }] — toma en cuenta calendar + reservas DB.
 */
exports.getDaySlots = async (dateStr, dbTakenSlots) => {
  const dt = DateTime.fromISO(dateStr, { zone: TZ });
  const startISO = dt.startOf('day').toISO();
  const endISO   = dt.endOf('day').toISO();

  const calendarBusy = await getCalendarBusy(startISO, endISO);
  const gcalBlocked  = calendarBusy[dateStr] ?? new Set();

  return ALL_SLOTS.map(slot => ({
    time:  slot,
    taken: gcalBlocked.has(slot) || dbTakenSlots.includes(slot),
  }));
};

exports.createOfficeHoursEvent = async (booking) => {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID no esta definido.');

  const [hour, minute] = booking.slot.split(':').map(Number);
  const start = DateTime.fromISO(booking.dia, { zone: TZ }).set({ hour, minute, second: 0, millisecond: 0 });
  const end = start.plus({ minutes: 30 });
  const calendar = getCalendarClient();

  const event = {
    summary: `Office Hours - ${booking.nombre} (no confirmado por cliente)`,
    description: [
      'Reserva confirmada desde el panel admin de FABRIC.',
      '',
      `Aviso: no confirmado por ${booking.nombre}.`,
      `Cliente: ${booking.nombre}`,
      `Empresa: ${booking.empresa}`,
      `Email: ${booking.email}`,
      `Booking ID: ${booking._id}`,
    ].join('\n'),
    start: {
      dateTime: start.toISO(),
      timeZone: TZ,
    },
    end: {
      dateTime: end.toISO(),
      timeZone: TZ,
    },
    extendedProperties: {
      private: {
        source: 'fabric-office-hours',
        bookingId: booking._id.toString(),
        clientConfirmed: 'false',
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return response.data;
};

exports.deleteOfficeHoursEvent = async (eventId) => {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID no esta definido.');
  if (!eventId) return null;

  const calendar = getCalendarClient();
  await calendar.events.delete({
    calendarId,
    eventId,
  });

  return true;
};
