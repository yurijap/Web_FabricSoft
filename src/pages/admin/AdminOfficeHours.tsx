import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Trash2, UserCheck, ShieldCheck, History, ArrowRight, XCircle, Link, Video, ExternalLink, X } from 'lucide-react';
import { useAuthApi } from '../../config/api';

interface Booking {
  _id: string;
  nombre: string;
  cargo?: string;
  empresa: string;
  email: string;
  revenue?: string;
  iniciativaOracle?: string;
  plazo?: string;
  dia: string;
  slot: string;
  status: 'disponible' | 'pendiente' | 'confirmado' | 'cancelado' | 'aprobada' | 'rechazado' | string;
  meetLink?: string;
  codigoReunion?: string;
  pinAcceso?: string;
  roomId?: string;
  isCreatedByAdmin?: boolean;
  emailEnviado?: boolean;
  calendarEnviado?: boolean;
  calendarEventId?: string;
  notas?: string;
  tracking?: { sourceSection?: string; interactionType?: string; pagePath?: string };
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  disponible: '#38bdf8',
  pendiente:  '#C9A96E',
  confirmado: '#4ade80',
  cancelado:  '#B85450',
  rechazado:  '#EF4444',
};

// Horarios permitidos de 9:00 AM a 6:00 PM en intervalos de 30 min
const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM'
];

export default function AdminOfficeHours() {
  const adminApi = useAuthApi();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [saving, setSaving]     = useState(false);

  // Formulario para Generar Reunión (Derecha)
  const [assignProspect, setAssignProspect] = useState(false); // false = Slot Libre, true = Asignar Prospecto
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    email: '',
    cargo: '',
    dia: '',
    slot: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [confirmingApproveId, setConfirmingApproveId] = useState<string | null>(null);
  const [approvingLoading, setApprovingLoading] = useState(false);

  const [toast, setToast] = useState<{ title: string; message: string; type: 'emerald' | 'amber' } | null>(null);

  const showToast = (title: string, message: string, type: 'emerald' | 'amber' = 'emerald') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBookings = () => {
    setLoading(true);
    adminApi.get('/office-hours/admin')
      .then(res => {
        const data = res.data.data ?? [];
        setBookings(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []); // eslint-disable-line

  const handleConfirmApproval = async (b: Booking) => {
    setApprovingLoading(true);
    const alphaChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randPin = '';
    for (let i = 0; i < 6; i++) randPin += alphaChars.charAt(Math.floor(Math.random() * alphaChars.length));
    let randRoomCode = '';
    for (let i = 0; i < 5; i++) randRoomCode += alphaChars.charAt(Math.floor(Math.random() * alphaChars.length));

    const generatedPin = b.pinAcceso || b.codigoReunion || randPin;
    const generatedRoomId = b.roomId || `MEET-${randRoomCode}`;
    const baseUrl = window.location.origin;
    const generatedLink = b.meetLink || `${baseUrl}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${generatedRoomId}`;

    try {
      const res = await adminApi.patch(`/office-hours/admin/${b._id}/approve`, {
        status: 'confirmado',
        estado: 'Aprobada',
        meetLink: generatedLink,
        codigoReunion: generatedPin,
        pinAcceso: generatedPin,
        roomId: generatedRoomId,
      });

      const updatedData = (res.data.data ?? {
        ...b,
        status: 'confirmado',
        meetLink: generatedLink,
        codigoReunion: generatedPin,
        pinAcceso: generatedPin,
        roomId: generatedRoomId,
      }) as Booking;

      setBookings(prev => prev.map(item => item._id === b._id ? { ...item, ...updatedData } : item));
      if (selected?._id === b._id) {
        setSelected({ ...selected, ...updatedData });
      }
      setConfirmingApproveId(null);
    } catch {
      const updatedLocal: Booking = {
        ...b,
        status: 'confirmado',
        meetLink: generatedLink,
        codigoReunion: generatedPin,
        pinAcceso: generatedPin,
        roomId: generatedRoomId,
      };
      setBookings(prev => prev.map(item => item._id === b._id ? updatedLocal : item));
      if (selected?._id === b._id) {
        setSelected(updatedLocal);
      }
      setConfirmingApproveId(null);
    } finally {
      setApprovingLoading(false);
    }
  };

  const handleRejectMeeting = async (b: Booking) => {
    setSaving(true);
    try {
      await adminApi.patch(`/office-hours/admin/${b._id}/status`, { status: 'rechazado' });
      setBookings(prev => prev.map(item => item._id === b._id ? { ...item, status: 'rechazado' } : item));
      if (selected?._id === b._id) {
        setSelected(null);
      }
    } catch {
      setBookings(prev => prev.map(item => item._id === b._id ? { ...item, status: 'rechazado' } : item));
      if (selected?._id === b._id) {
        setSelected(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [rescheduleModalBooking, setRescheduleModalBooking] = useState<Booking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');
  const [isRescheduling, setIsRescheduling] = useState(false);

  const handleCancelMeeting = async (b: Booking) => {
    if (!window.confirm(`¿Confirmas que deseas cancelar la cita de ${b.nombre} (${b.empresa}) para el ${b.dia} a las ${b.slot}?\n\nSe le enviará un correo notificándole la cancelación.`)) {
      return;
    }

    setCancelingId(b._id);
    try {
      await adminApi.patch(`/office-hours/admin/${b._id}/cancel`, {
        email: b.email,
        nombre: b.nombre,
        empresa: b.empresa,
        dia: b.dia,
        slot: b.slot
      });
      alert(`La cita de ${b.nombre} ha sido cancelada y se envió la notificación por correo a ${b.email}.`);

      setBookings(prev => prev.map(item => item._id === b._id ? { ...item, status: 'cancelado' } : item));
      if (selected?._id === b._id) {
        setSelected(prev => prev ? { ...prev, status: 'cancelado' } : null);
      }
    } catch (err: any) {
      console.error('Error cancelando cita:', err);
      setBookings(prev => prev.map(item => item._id === b._id ? { ...item, status: 'cancelado' } : item));
      alert(`La cita se marcó como cancelada.`);
    } finally {
      setCancelingId(null);
    }
  };

  const openRescheduleModal = (b: Booking) => {
    setRescheduleModalBooking(b);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRescheduleDate(b.dia || tomorrow.toISOString().split('T')[0]);
    setRescheduleTime('10:00');
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalBooking) return;
    if (!rescheduleDate) {
      alert('Por favor selecciona la nueva fecha de la reunión.');
      return;
    }

    setIsRescheduling(true);
    try {
      const generateAlphaPin = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let p = '';
        for (let i = 0; i < 6; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
        return p;
      };

      const generateAlphaRoomId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return `MEET-${code}`;
      };

      const roomId = rescheduleModalBooking.roomId || generateAlphaRoomId();
      const existingPin = rescheduleModalBooking.pinAcceso || rescheduleModalBooking.codigoReunion;
      const newPin = existingPin || generateAlphaPin();
      const guestLink = `${window.location.origin}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${roomId}`;

      const payload = {
        status: 'confirmado',
        meeting_date: rescheduleDate,
        meeting_time: rescheduleTime,
        meeting_link: guestLink,
        roomId: roomId,
        pinAcceso: newPin,
        codigoReunion: newPin,
        email: rescheduleModalBooking.email,
        nombre: rescheduleModalBooking.nombre,
        empresa: rescheduleModalBooking.empresa,
        send_meeting_email: true,
        is_reschedule: true
      };

      await adminApi.patch(`/fusion-rescue/submissions/${rescheduleModalBooking._id}/status`, payload).catch(() => null);
      await adminApi.patch(`/office-hours/admin/${rescheduleModalBooking._id}/status`, {
        status: 'confirmado',
        dia: rescheduleDate,
        slot: rescheduleTime,
        meetLink: guestLink,
        roomId: roomId,
        pinAcceso: newPin,
        codigoReunion: newPin
      }).catch(() => null);

      alert(`¡Cita reagendada exitosamente! Se envió la notificación con el nuevo horario (${rescheduleDate} a las ${rescheduleTime}) y PIN (${newPin}) a ${rescheduleModalBooking.email}.`);

      const updatedBooking: Booking = {
        ...rescheduleModalBooking,
        dia: rescheduleDate,
        slot: rescheduleTime,
        status: 'confirmado',
        meetLink: guestLink,
        roomId: roomId,
        pinAcceso: newPin,
        codigoReunion: newPin
      };

      setBookings(prev => prev.map(item => item._id === rescheduleModalBooking._id ? updatedBooking : item));
      if (selected?._id === rescheduleModalBooking._id) {
        setSelected(updatedBooking);
      }
      setRescheduleModalBooking(null);
    } catch (err: any) {
      console.error('Error reagendando cita:', err);
      alert('Error al reagendar cita: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleStatus = async (id: string, status: Booking['status']) => {
    setSaving(true);
    try {
      const res = await adminApi.patch(`/office-hours/admin/${id}/status`, { status });
      const updated = res.data.data as Booking;
      setBookings(prev => prev.map(b => b._id === id ? { ...b, ...updated } : b));
      if (selected?._id === id) {
        if (status === 'rechazado' || status === 'cancelado') {
          setSelected(null);
        } else {
          setSelected({ ...selected, ...updated });
        }
      }
    } catch { 
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      if (selected?._id === id) {
        if (status === 'rechazado' || status === 'cancelado') {
          setSelected(null);
        } else {
          setSelected({ ...selected, status });
        }
      }
    } finally { 
      setSaving(false); 
    }
  };

  const handleDeleteSlot = async (id: string) => {
    setSaving(true);
    try {
      await adminApi.delete(`/office-hours/admin/${id}`).catch(() => null);
      setBookings(prev => prev.filter(b => b._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch {
      setBookings(prev => prev.filter(b => b._id !== id));
      if (selected?._id === id) setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  // Comprobar si una fecha es fin de semana (Sábado = 6, Domingo = 0)
  const isWeekend = (dateString: string) => {
    if (!dateString) return false;
    const d = new Date(dateString + 'T12:00:00');
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  // Comprobar si un día u hora ya pasaron
  const isSlotExpired = (dia: string, slotTime: string) => {
    if (!dia) return true;
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    if (dia < todayStr) return true;

    if (dia === todayStr && slotTime) {
      const now = new Date();
      const nowStr = now.toLocaleTimeString('en-US', { timeZone: 'America/Mexico_City', hour12: true });

      const parseTimeToMinutes = (t: string) => {
        const parts = t.trim().split(' ');
        if (parts.length < 2) return 0;
        const [hm, period] = parts;
        let [h, m] = hm.split(':').map(Number);
        if (period === 'PM' && h < 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      };

      const slotMinutes = parseTimeToMinutes(slotTime);
      const nowMinutes = parseTimeToMinutes(nowStr);

      if (slotMinutes <= nowMinutes) {
        return true;
      }
    }

    return false;
  };

  // Comprobar si una hora ya está ocupada o abierta para esa fecha
  const isSlotOccupied = (dia: string, slot: string) => {
    if (!dia || !slot) return false;
    return bookings.some(b => b.dia === dia && b.slot === slot && b.status !== 'cancelado' && b.status !== 'rechazado');
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.dia || !formData.slot) {
      setFormError('Por favor selecciona la fecha y el horario.');
      return;
    }

    if (isWeekend(formData.dia)) {
      setFormError('Solo se permiten horarios en días hábiles (Lunes a Viernes).');
      return;
    }

    if (isSlotOccupied(formData.dia, formData.slot)) {
      setFormError(`El horario ${formData.slot} ya se encuentra reservado u abierto para la fecha seleccionada.`);
      return;
    }

    if (assignProspect && (!formData.nombre.trim() || !formData.empresa.trim() || !formData.email.trim())) {
      setFormError('Completa Nombre, Empresa y Email para asignar al prospecto.');
      return;
    }

    setSaving(true);
    const newId = `slot_${Date.now()}`;
    const newBooking: Booking = {
      _id: newId,
      nombre: assignProspect ? formData.nombre.trim() : 'Slot Abierto por Admin',
      empresa: assignProspect ? formData.empresa.trim() : 'Disponible',
      email: assignProspect ? formData.email.trim() : 'admin@fabricsoft.com.mx',
      cargo: assignProspect ? (formData.cargo.trim() || 'Ejecutivo') : 'Super Admin',
      dia: formData.dia,
      slot: formData.slot,
      status: assignProspect ? 'pendiente' : 'disponible',
      isCreatedByAdmin: true,
      emailEnviado: false,
      calendarEnviado: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await adminApi.post('/office-hours/admin', newBooking).catch(() => null);
      const savedBooking = res?.data?.data ? (res.data.data as Booking) : newBooking;
      
      setBookings(prev => [savedBooking, ...prev]);
      setFormSuccess(assignProspect ? '¡Cita asignada y agendada exitosamente!' : '¡Horario abierto correctamente por el Super Admin!');
      setFormData({ nombre: '', empresa: '', email: '', cargo: '', dia: '', slot: '' });
      setTimeout(() => setFormSuccess(null), 3000);
    } catch {
      setBookings(prev => [newBooking, ...prev]);
      setFormData({ nombre: '', empresa: '', email: '', cargo: '', dia: '', slot: '' });
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' }).toUpperCase();

  const fmtCreated = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });

  // 1. Historial de Horarios Libres Abiertos por Super Admin (Izquierda)
  // Regla: No deben aparecer citas apartadas por clientes, ni horarios cuyo día u hora ya pasaron
  const adminSlotsHistory = bookings.filter(b => {
    const isAvailableSlot = b.status === 'disponible' || b.empresa === 'Disponible' || b.nombre === 'Slot Abierto por Admin';
    const isNotBooked = b.status !== 'pendiente' && b.status !== 'confirmado' && b.status !== 'aprobada';
    const expired = isSlotExpired(b.dia, b.slot);
    return isAvailableSlot && isNotBooked && !expired;
  });

  const isPastSession = (b: Booking): boolean => {
    if (!b.dia) return false;
    let dateStr = b.dia;
    let timeStr = b.slot || '23:59';
    let hours = 0;
    let minutes = 0;

    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const isPM = timeStr.includes('PM');
      const cleanTime = timeStr.replace(/AM|PM/g, '').trim();
      const parts = cleanTime.split(':');
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    } else {
      const parts = timeStr.split(':');
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
    }

    const meetingDateTime = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    const now = new Date();
    return meetingDateTime.getTime() < now.getTime() || b.status === 'completada' || b.status === 'finalizada' || b.status === 'pasada';
  };

  const getTimeAgoText = (b: Booking) => {
    if (!b.dia) return 'Sin fecha';
    let dateStr = b.dia;
    let timeStr = b.slot || '23:59';
    let hours = 0;
    let minutes = 0;

    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      const isPM = timeStr.includes('PM');
      const cleanTime = timeStr.replace(/AM|PM/g, '').trim();
      const parts = cleanTime.split(':');
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    } else {
      const parts = timeStr.split(':');
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
    }

    const meetingDateTime = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    const now = new Date();
    const diffMs = now.getTime() - meetingDateTime.getTime();

    if (diffMs <= 0) return 'Próxima';
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hrs`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 30) return `Hace ${diffDays} días`;
    if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
    return `Hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
  };

  // 2. Citas Canceladas / Eliminadas (Abajo - Derecha Superior)
  const cancelledBookedSessions = bookings.filter(b => 
    b.status === 'cancelado' || 
    b.status === 'rechazado' || 
    b.status === 'declinado' || 
    b.status === 'Cancelado' ||
    b.status === 'Rechazado' ||
    b.status === 'Declinado'
  );

  // 3. Sesiones Pasadas (Abajo - Derecha Inferior)
  const pastSessions = bookings.filter(b => 
    b.status !== 'disponible' && 
    b.status !== 'cancelado' && 
    b.status !== 'rechazado' && 
    b.status !== 'declinado' && 
    b.status !== 'Cancelado' &&
    isPastSession(b)
  );

  // 4. Citas Activas / Futuras (Abajo - Izquierda)
  const activeBookedSessions = bookings.filter(b => 
    b.status !== 'disponible' && 
    b.status !== 'cancelado' && 
    b.status !== 'rechazado' && 
    b.status !== 'declinado' && 
    b.status !== 'Cancelado' &&
    !isPastSession(b)
  );

  const disponiblesCount = bookings.filter(b => b.status === 'disponible').length;
  const pendientesCount  = bookings.filter(b => b.status === 'pendiente').length;
  const confirmadosCount = bookings.filter(b => b.status === 'confirmado' || b.status === 'aprobada').length;

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white font-sans pb-16">
      {/* Header / Hero */}
      <div className="p-6 md:p-8 bg-[#0B1F3A] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <ShieldCheck size={13} /> FABRIC · SUPER ADMIN · OFFICE HOURS
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">Gestionar Reuniones y Disponibilidad</h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Habilita sesiones de Lunes a Viernes (9:00 AM - 6:00 PM), revisa el historial abierto y consulta las fechas apartadas por clientes.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-[#0E2747] border border-[#1E3A5F] px-5 py-2.5 rounded-2xl shadow-md shrink-0">
            {[
              { label: 'Disponibles', val: disponiblesCount, color: '#38bdf8' },
              { label: 'Pendientes',  val: pendientesCount,  color: '#C9A96E' },
              { label: 'Confirmadas', val: confirmadosCount, color: '#4ade80' },
            ].map(({ label, val, color }) => (
              <div key={label} className="text-center px-2">
                <div className="font-serif text-2xl font-bold leading-none" style={{ color }}>{val}</div>
                <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banda Informativa */}
      <div className="flex items-center gap-2.5 px-6 md:px-8 py-3 bg-[#07192F] border-b border-[#1E3A5F]">
        <span className="w-2 h-2 rounded-full bg-[#C9A96E] shrink-0 animate-pulse" />
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#C9A96E] uppercase">
          Horarios oficiales: Lunes a Viernes (09:00 AM - 06:00 PM) · Duración de sesión: 30 Minutos
        </span>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* ── SECCIÓN SUPERIOR EN 2 COLUMNAS ── */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          
          {/* 👈 IZQUIERDA: HISTORIAL DE HORARIOS ABIERTOS POR SUPER ADMIN */}
          <div className="lg:col-span-7 rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-xl overflow-hidden flex flex-col min-h-[510px]">
            <div className="p-5 border-b border-[#1E3A5F] bg-[#07192F] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History size={16} className="text-[#C9A96E]" />
                <div>
                  <h2 className="font-serif text-lg font-bold text-white">Historial de Horarios Abiertos</h2>
                  <p className="text-[10px] font-mono text-[#94A3B8]">Reuniones y slots habilitados por el Super Admin ({adminSlotsHistory.length})</p>
                </div>
              </div>
              <span className="font-mono text-[9px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-3 py-1 rounded-full uppercase">
                Panel Izquierdo
              </span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto max-h-[440px]">
              {loading ? (
                <div className="font-mono text-xs text-[#94A3B8] tracking-widest py-12 text-center">Cargando historial...</div>
              ) : adminSlotsHistory.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-10 h-10 rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/10 flex items-center justify-center text-[#C9A96E] mx-auto">
                    <CalendarIcon size={18} />
                  </div>
                  <h3 className="font-serif text-base font-bold text-white">Sin horarios abiertos todavía.</h3>
                  <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
                    Usa el formulario de la derecha para habilitar fechas y horas de Lunes a Viernes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {adminSlotsHistory.map(b => {
                    const isSel = selected?._id === b._id;
                    const isAvailable = b.status === 'disponible';

                    return (
                      <div
                        key={b._id}
                        onClick={() => setSelected(b)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer gap-3 ${
                          isSel
                            ? 'bg-[#123254] border-[#C9A96E] shadow-md'
                            : 'bg-[#07192F] border-[#1E3A5F] hover:bg-[#123254]/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#0E2747] border border-[#1E3A5F] flex flex-col items-center justify-center shrink-0">
                            <Clock size={14} className="text-[#C9A96E]" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-mono text-[10px] text-[#94A3B8] uppercase">
                              {b.dia ? fmtDate(b.dia) : 'Sin fecha'} · <strong className="text-white">{b.slot}</strong>
                            </div>
                            <div className="font-bold text-xs text-white truncate mt-0.5">
                              {b.nombre} {b.empresa !== 'Disponible' ? `(${b.empresa})` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isAvailable ? (
                            <span className="font-mono text-[8px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-sky-400/40 text-sky-300 bg-sky-500/10">
                              Disponible
                            </span>
                          ) : (
                            <span className="font-mono text-[8px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border border-amber-400/40 text-amber-300 bg-amber-500/10">
                              {b.status}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSlot(b._id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                            title="Eliminar slot"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 👉 DERECHA: SECCIÓN DE GENERAR / ABRIR NUEVA REUNIÓN */}
          <div className="lg:col-span-5 rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-xl p-5 md:p-6 space-y-4">
            <div className="border-b border-[#1E3A5F] pb-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-[9px] font-bold tracking-widest text-[#C9A96E] uppercase mb-0.5">
                  GENERAR Y HABILITAR
                </div>
                <h2 className="font-serif text-xl font-bold text-white">Abrir Nueva Reunión</h2>
              </div>
              <span className="font-mono text-[9px] font-bold text-[#C9A96E] bg-[#C9A96E]/10 border border-[#C9A96E]/30 px-3 py-1 rounded-full uppercase">
                Panel Derecha
              </span>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-mono">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl font-mono">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
              {/* Opción Tipo de Apertura */}
              <div className="bg-[#07192F] p-1 rounded-xl border border-[#1E3A5F] grid grid-cols-2 gap-1 font-mono text-[9px] font-bold">
                <button
                  type="button"
                  onClick={() => setAssignProspect(false)}
                  className={`py-2 px-2.5 rounded-lg uppercase transition text-center ${
                    !assignProspect
                      ? 'bg-[#C9A96E] text-[#0B1F3A]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Slot Libre (Disponible)
                </button>

                <button
                  type="button"
                  onClick={() => setAssignProspect(true)}
                  className={`py-2 px-2.5 rounded-lg uppercase transition text-center ${
                    assignProspect
                      ? 'bg-[#C9A96E] text-[#0B1F3A]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  Asignar a Prospecto
                </button>
              </div>

              {/* Si es asignado a prospecto */}
              {assignProspect && (
                <div className="space-y-3 bg-[#07192F] p-3.5 rounded-xl border border-[#1E3A5F]">
                  <div>
                    <label className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                      Nombre del Prospecto *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Ing. Roberto Valdez"
                      value={formData.nombre}
                      onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full bg-[#0E2747] border border-[#1E3A5F] text-white p-2.5 rounded-xl outline-none focus:border-[#C9A96E]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                        Empresa *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. APE Plazas"
                        value={formData.empresa}
                        onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                        className="w-full bg-[#0E2747] border border-[#1E3A5F] text-white p-2.5 rounded-xl outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-1">
                        Correo Corporativo *
                      </label>
                      <input
                        type="email"
                        placeholder="r.valdez@apeplazas.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#0E2747] border border-[#1E3A5F] text-white p-2.5 rounded-xl outline-none focus:border-[#C9A96E]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Selección de Fecha (Lunes a Viernes) con apertura de Calendario */}
              <div>
                <label className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center justify-between mb-1">
                  <span>Seleccionar Fecha (Lunes a Viernes) *</span>
                  <span className="text-[#C9A96E]">Solo días hábiles</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={formData.dia}
                    onClick={e => {
                      try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {}
                    }}
                    onChange={e => {
                      const newDate = e.target.value;
                      if (isWeekend(newDate)) {
                        setFormError('Has seleccionado un fin de semana. Elige un día hábil (Lunes a Viernes).');
                      } else {
                        setFormError(null);
                      }
                      setFormData({ ...formData, dia: newDate });
                    }}
                    className="w-full bg-[#07192F] border border-[#1E3A5F] text-white p-3 rounded-xl outline-none focus:border-[#C9A96E] font-mono text-xs cursor-pointer [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Selección de Horario (Select desplegable de sesiones cada 30 minutos) */}
              <div>
                <label className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center justify-between mb-1.5">
                  <span>Seleccionar Horario (9:00 AM - 6:00 PM) *</span>
                  <span>{formData.dia ? (isWeekend(formData.dia) ? 'Día no hábil' : 'Sesiones 30 min') : 'Elige fecha'}</span>
                </label>

                <div className="relative">
                  <select
                    required
                    disabled={!formData.dia || isWeekend(formData.dia)}
                    value={formData.slot}
                    onChange={e => {
                      setFormData({ ...formData, slot: e.target.value });
                      setFormError(null);
                    }}
                    className="w-full bg-[#07192F] border border-[#1E3A5F] text-white p-3 rounded-xl outline-none focus:border-[#C9A96E] font-mono text-xs cursor-pointer appearance-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>-- Seleccionar Horario (Sesión 30 min) --</option>
                    {TIME_SLOTS.map(slot => {
                      const occupied = isSlotOccupied(formData.dia, slot);
                      return (
                        <option
                          key={slot}
                          value={slot}
                          disabled={occupied}
                          className={occupied ? 'bg-[#07192F] text-slate-500 font-sans' : 'bg-[#0E2747] text-white font-mono'}
                        >
                          {slot} {occupied ? '(Ocupado / Ya abierto)' : ' — Disponible'}
                        </option>
                      );
                    })}
                  </select>
                  <Clock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C9A96E] pointer-events-none" size={16} />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !formData.dia || !formData.slot || isWeekend(formData.dia) || isSlotOccupied(formData.dia, formData.slot)}
                className="w-full py-3 rounded-xl bg-[#C9A96E] hover:bg-[#e6cf9c] text-[#0B1F3A] font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                <span>{saving ? 'Procesando...' : assignProspect ? 'Asignar Cita a Prospecto' : 'Habilitar Horario en la Consola'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── SECCIÓN INFERIOR: CITAS ACTIVAS Y TABLA DE ELIMINADOS EN 2 COLUMNAS ── */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">

          {/* 👈 IZQUIERDA: FECHAS Y CITAS APARTADAS POR CLIENTES (ACTIVAS / PENDIENTES) */}
          <div className="lg:col-span-8 rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-xl overflow-hidden flex flex-col min-h-[480px]">
            <div className="p-5 md:p-6 border-b border-[#1E3A5F] bg-[#07192F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl border border-[#C9A96E]/40 bg-[#C9A96E]/10 flex items-center justify-center text-[#C9A96E]">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="font-mono text-[9px] font-bold tracking-widest text-[#C9A96E] uppercase mb-0.5">
                    SECCIÓN INFERIOR · REGISTRO APARTADO
                  </div>
                  <h2 className="font-serif text-xl font-bold text-white">Fechas y Citas Apartadas por Clientes</h2>
                </div>
              </div>

              <span className="font-mono text-xs font-bold text-white bg-[#0E2747] border border-[#1E3A5F] px-4 py-2 rounded-xl shadow-md w-fit">
                {activeBookedSessions.length} cita{activeBookedSessions.length !== 1 ? 's' : ''} en total
              </span>
            </div>

            <div className="p-6 md:p-8 flex-1">
              {loading ? (
                <div className="font-mono text-xs text-[#94A3B8] tracking-widest py-16 text-center">Cargando citas apartadas...</div>
              ) : activeBookedSessions.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <h3 className="font-serif text-base font-bold text-white">Sin reservas activas todavía.</h3>
                  <p className="text-xs text-[#94A3B8] max-w-sm mx-auto font-mono">
                    No hay prospectos con citas activas actualmente. Abre un horario en la sección superior para habilitar disponibilidad.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {activeBookedSessions.map(b => {
                    const isSel = selected?._id === b._id;
                    return (
                      <div
                        key={b._id}
                        onClick={() => setSelected(b)}
                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer space-y-3 ${
                          isSel
                            ? 'bg-[#123254] border-[#C9A96E] shadow-lg'
                            : 'bg-[#07192F] border-[#1E3A5F] hover:bg-[#123254]/80 hover:border-[#1E3A5F]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-[10px] text-[#C9A96E] font-bold uppercase mb-1">
                              {b.dia ? fmtDate(b.dia) : 'Sin fecha'} · <span className="text-white">{b.slot || 'Por asignar'}</span>
                            </div>
                            <div className="font-bold text-sm text-white truncate">{b.nombre}</div>
                            <div className="font-mono text-xs text-[#94A3B8] truncate mt-0.5">
                              {b.empresa}{b.cargo ? ` · ${b.cargo}` : ''}
                            </div>
                            {b.email && <div className="font-mono text-[10px] text-slate-400 truncate mt-0.5">{b.email}</div>}
                          </div>

                          <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border shrink-0" style={{
                            color: STATUS_COLOR[b.status] ?? '#C9A96E',
                            borderColor: `${STATUS_COLOR[b.status] ?? '#C9A96E'}44`,
                            backgroundColor: `${STATUS_COLOR[b.status] ?? '#C9A96E'}15`,
                          }}>
                            {b.status}
                          </span>
                        </div>

                        {/* Detalles extras registrados de la página principal */}
                        {(b.revenue !== '—' || b.iniciativaOracle !== '—' || b.plazo !== '—') && (
                          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#1E3A5F]/60 text-[10px] font-mono">
                            {b.revenue && b.revenue !== '—' && (
                              <div>
                                <span className="text-[#94A3B8] block text-[8px] uppercase">Revenue</span>
                                <span className="text-white font-semibold">{b.revenue}</span>
                              </div>
                            )}
                            {b.plazo && b.plazo !== '—' && (
                              <div>
                                <span className="text-[#94A3B8] block text-[8px] uppercase">Plazo</span>
                                <span className="text-white">{b.plazo}</span>
                              </div>
                            )}
                            {b.iniciativaOracle && b.iniciativaOracle !== '—' && (
                              <div className="col-span-2">
                                <span className="text-[#94A3B8] block text-[8px] uppercase">Iniciativa</span>
                                <span className="text-slate-300 truncate block">{b.iniciativaOracle}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Botones de Acción (Aceptar / Rechazar) y Vista de Reunión Aprobada */}
                        {(b.status === 'confirmado' || b.status === 'aprobada') && b.status !== 'pendiente' ? (() => {
                          const getFallbackPin = (idStr: string, roomStr?: string) => {
                            const str = (idStr || roomStr || 'FABRIC').toString();
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
                          };

                          const effectiveRoomId = b.roomId || (b.meetLink || '').split('/').pop() || 'MEET-8821';
                          const effectivePin = b.pinAcceso || b.codigoReunion || getFallbackPin(b._id, effectiveRoomId);
                          const guestUrl = `${window.location.origin}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${effectiveRoomId}`;
                          const hostUrl = `${window.location.origin}/reunion/${effectiveRoomId}`;

                          return (
                          <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 font-mono text-[10px] text-emerald-300" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between text-emerald-400 font-bold uppercase text-[9px] border-b border-emerald-500/20 pb-1.5">
                              <span className="flex items-center gap-1.5"><CheckCircle2 size={13} /> ✓ Reunión Aprobada</span>
                              <span className="text-[#C9A96E] font-bold">PIN GENERADO</span>
                            </div>

                            <div className="flex items-center justify-between bg-[#07192F] p-2 rounded-lg border border-[#1E3A5F]">
                              <span className="text-slate-400 font-bold">PIN de Acceso:</span>
                              <strong className="text-[#C9A96E] text-xs font-bold font-mono tracking-widest bg-[#0E2747] px-2.5 py-0.5 rounded border border-[#C9A96E]/40">
                                {effectivePin}
                              </strong>
                            </div>

                            <div className="flex items-center justify-between text-slate-300 font-mono text-[9px]">
                              <span className="text-slate-400 font-bold">ID de Sala Compartida:</span>
                              <span className="text-emerald-300 font-bold bg-[#07192F] px-2 py-0.5 rounded border border-emerald-500/30">{effectiveRoomId}</span>
                            </div>

                            <div className="space-y-2.5 pt-2 border-t border-emerald-500/20">
                              {/* Enlace para el Cliente / Invitado */}
                              <div>
                                <span className="text-emerald-400 block text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Link size={10} /> Enlace enviado al Cliente (Invitado):
                                </span>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={guestUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-300 hover:underline font-bold truncate text-[9px] flex-1 bg-[#07192F] p-1.5 rounded border border-emerald-500/30"
                                  >
                                    {guestUrl}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const fullInvite = `💻 Enlace de la Reunión: ${guestUrl}\n🔑 PIN de Acceso: ${effectivePin}`;
                                      navigator.clipboard.writeText(fullInvite);
                                      showToast('¡Invitación de Cliente Copiada!', `Se copió el enlace y PIN de acceso (${effectivePin}) de ${b.nombre} al portapapeles.`, 'emerald');
                                    }}
                                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-[#0B1F3A] font-bold rounded transition text-[9px] shrink-0 cursor-pointer shadow-md"
                                  >
                                    Copiar Cliente
                                  </button>
                                </div>
                              </div>

                              {/* Enlace para el Anfitrión / Host */}
                              <div>
                                <span className="text-[#C9A96E] block text-[9px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Video size={10} /> Enlace para Anfitrión (/reunion):
                                </span>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={hostUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-amber-200 hover:underline font-bold truncate text-[9px] flex-1 bg-[#07192F] p-1.5 rounded border border-[#1E3A5F]"
                                  >
                                    {hostUrl}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(hostUrl);
                                      showToast('¡Enlace de Anfitrión Copiado!', `El enlace de anfitrión (/reunion) de ${b.nombre} ha sido copiado al portapapeles.`, 'amber');
                                    }}
                                    className="px-2.5 py-1 bg-[#C9A96E] text-[#0B1F3A] font-bold rounded hover:bg-[#e6cf9c] transition text-[9px] shrink-0 cursor-pointer shadow-md"
                                  >
                                    Copiar Anfitrión
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Botones de Reagendar y Cancelar Cita */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20 font-mono text-[10px]">
                              <button
                                type="button"
                                onClick={() => openRescheduleModal(b)}
                                className="py-2 px-2.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-300 hover:text-white font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CalendarIcon size={12} /> Reagendar Cita
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelMeeting(b)}
                                disabled={cancelingId === b._id}
                                className="py-2 px-2.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white font-bold uppercase transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <XCircle size={12} /> {cancelingId === b._id ? 'Cancelando...' : 'Cancelar Cita'}
                              </button>
                            </div>
                          </div>
                          );
                        })() : (
                          <div onClick={e => e.stopPropagation()} className="space-y-2">
                            {confirmingApproveId !== b._id ? (
                              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                                <button
                                  type="button"
                                  disabled={saving || approvingLoading}
                                  onClick={() => setConfirmingApproveId(b._id)}
                                  className="py-2.5 px-3 rounded-xl bg-[#C9A96E] hover:bg-[#d8b87d] text-[#0B1F3A] font-bold uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <CheckCircle2 size={14} />
                                  <span>Aceptar</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={saving || approvingLoading || cancelingId === b._id}
                                  onClick={() => handleCancelMeeting(b)}
                                  className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <XCircle size={14} />
                                  <span>{cancelingId === b._id ? 'Cancelando...' : 'Cancelar Cita'}</span>
                                </button>
                              </div>
                            ) : (
                              <div className="bg-[#07192F] p-3 rounded-xl border border-[#1E3A5F] space-y-2.5 font-mono text-xs">
                                <div className="text-[10px] text-[#C9A96E] font-bold uppercase">Aprobar y Generar Enlace Meet</div>
                                <div className="flex items-center gap-2 w-full">
                                  <button
                                    type="button"
                                    disabled={approvingLoading}
                                    onClick={() => handleConfirmApproval(b)}
                                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0B1F3A] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow-md disabled:opacity-50 text-[11px]"
                                  >
                                    <CheckCircle2 size={13} />
                                    <span>{approvingLoading ? 'Guardando...' : 'Aceptar y Generar Link'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingApproveId(null)}
                                    className="py-2 px-3 rounded-lg border border-slate-600 bg-slate-800 text-slate-300 hover:text-white font-bold uppercase tracking-wider transition cursor-pointer text-[11px]"
                                  >
                                    Regresar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-[#1E3A5F] pt-2.5 text-[10px] font-mono text-[#94A3B8]">
                          <span>Registrado: {fmtCreated(b.createdAt)}</span>
                          <span className="text-[#C9A96E] font-bold flex items-center gap-1">Ver Todos los Datos <ArrowRight size={12} /></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 👉 COLUMNA DERECHA: 1) CANCELADAS/ELIMINADAS Y 2) SESIONES PASADAS */}
          <div className="lg:col-span-4 space-y-6">

            {/* TABLA 1: CITAS CANCELADAS / ELIMINADAS (EN ROJO) */}
            <div className="rounded-2xl border border-rose-500/40 bg-[#0E2747] shadow-xl overflow-hidden flex flex-col min-h-[320px]">
              <div className="p-5 border-b border-rose-500/30 bg-[#07192F] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl border border-rose-500/40 bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <XCircle size={16} />
                  </div>
                  <div>
                    <h2 className="font-serif text-base font-bold text-rose-300">Citas Canceladas / Eliminadas</h2>
                    <p className="text-[10px] font-mono text-rose-200/70">Registro de reuniones canceladas ({cancelledBookedSessions.length})</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-full uppercase">
                  Eliminados
                </span>
              </div>

              <div className="p-4 flex-1 overflow-y-auto max-h-[320px] space-y-3 custom-scrollbar">
                {cancelledBookedSessions.length === 0 ? (
                  <div className="text-center py-10 px-4 space-y-2">
                    <XCircle size={28} className="text-rose-500/40 mx-auto" />
                    <h3 className="font-serif text-sm font-bold text-rose-200">No hay citas canceladas</h3>
                    <p className="text-xs text-rose-300/60 font-mono">
                      Las citas canceladas o rechazadas permanecerán guardadas aquí en color rojo.
                    </p>
                  </div>
                ) : (
                  cancelledBookedSessions.map(b => (
                    <div
                      key={b._id}
                      onClick={() => setSelected(b)}
                      className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/40 transition cursor-pointer space-y-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] text-rose-400 font-bold uppercase">
                            🗓️ {b.dia ? fmtDate(b.dia) : 'Sin fecha'} · <span className="text-white">{b.slot || 'Horario'}</span>
                          </div>
                          <div className="font-bold text-xs text-white truncate mt-0.5">{b.nombre}</div>
                          <div className="font-mono text-[11px] text-rose-300/80 truncate">{b.empresa}</div>
                          {b.email && <div className="font-mono text-[10px] text-slate-400 truncate">{b.email}</div>}
                        </div>

                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-rose-500/50 bg-rose-500/20 text-rose-300 shrink-0">
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* TABLA 2: SESIONES PASADAS (EN BLANCO / HISTORIAL DE REUNIONES CONCLUIDAS) */}
            <div className="rounded-2xl border border-white/20 bg-[#0E2747] shadow-xl overflow-hidden flex flex-col min-h-[320px]">
              <div className="p-5 border-b border-white/15 bg-[#07192F] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl border border-white/30 bg-white/10 flex items-center justify-center text-white">
                    <History size={16} />
                  </div>
                  <div>
                    <h2 className="font-serif text-base font-bold text-white">Sesiones Pasadas</h2>
                    <p className="text-[10px] font-mono text-slate-300">Reuniones concluidas o anteriores ({pastSessions.length})</p>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold text-white bg-white/10 border border-white/20 px-2.5 py-1 rounded-full uppercase">
                  Pasadas
                </span>
              </div>

              <div className="p-4 flex-1 overflow-y-auto max-h-[360px] space-y-3 custom-scrollbar">
                {pastSessions.length === 0 ? (
                  <div className="text-center py-10 px-4 space-y-2">
                    <History size={28} className="text-slate-400 mx-auto" />
                    <h3 className="font-serif text-sm font-bold text-white">Sin sesiones pasadas aún</h3>
                    <p className="text-xs text-slate-300 font-mono">
                      Las reuniones agendadas que hayan superado su fecha u hora (desde 1 minuto atrás hasta meses/años pasados) aparecerán en este apartado.
                    </p>
                  </div>
                ) : (
                  pastSessions.map(b => (
                    <div
                      key={b._id}
                      onClick={() => setSelected(b)}
                      className="p-3.5 rounded-xl border border-white/20 bg-slate-900/60 hover:bg-slate-800/80 transition cursor-pointer space-y-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-[10px] text-slate-200 font-bold uppercase flex items-center gap-1">
                            <span>🗓️ {b.dia ? fmtDate(b.dia) : 'Sin fecha'}</span>
                            <span>·</span>
                            <span className="text-white">{b.slot || 'Horario'}</span>
                          </div>
                          <div className="font-bold text-xs text-white truncate mt-0.5">{b.nombre}</div>
                          <div className="font-mono text-[11px] text-slate-300 truncate">{b.empresa}</div>
                          {b.email && <div className="font-mono text-[10px] text-slate-400 truncate">{b.email}</div>}
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <span className="font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/30 bg-white/10 text-white block">
                            {getTimeAgoText(b)}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 block uppercase">Concluida</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Panel lateral de detalle para gestionar la cita seleccionada */}
      {selected && (
        <div
          className="fixed inset-0 bg-[#07192F]/80 backdrop-blur-xs z-50 flex justify-end"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0E2747] border-l border-[#1E3A5F] shadow-2xl p-6 md:p-8 overflow-y-auto min-h-screen space-y-6"
          >
            <div className="border-b border-[#1E3A5F] pb-6 relative">
              <div className="absolute top-0 left-0 w-1 h-full rounded-full" style={{ backgroundColor: STATUS_COLOR[selected.status] ?? '#38bdf8' }} />
              <div className="flex justify-between items-start pl-4">
                <div>
                  <div className="font-mono text-[9px] text-[#94A3B8] tracking-widest uppercase mb-1">
                    Office Hours · {fmtCreated(selected.createdAt)}
                  </div>
                  <div className="font-serif text-2xl font-bold text-white">{selected.nombre}</div>
                  <div className="font-mono text-xs text-[#94A3B8] mt-0.5">{selected.empresa}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center text-lg cursor-pointer transition"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="bg-[#07192F] border border-[#1E3A5F] rounded-2xl p-5">
              <div className="font-mono text-[9px] font-bold text-[#94A3B8] tracking-widest uppercase mb-3">Sesión reservada</div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-serif text-3xl font-bold text-white">{selected.slot || '—'}</div>
                  <div className="font-mono text-xs text-[#C9A96E] mt-1">
                    {selected.dia ? fmtDate(selected.dia) : 'Sin fecha asignada'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color: STATUS_COLOR[selected.status] ?? '#38bdf8' }}>
                    {selected.status}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3" style={{ gridTemplateColumns: selected.status === 'pendiente' ? '1fr 1fr' : '1fr' }}>
                {selected.status !== 'confirmado' && selected.status !== 'disponible' && (
                  <button
                    onClick={() => handleStatus(selected._id, 'confirmado')}
                    disabled={saving}
                    className="py-3 px-4 bg-[#C9A96E] text-[#0B1F3A] font-mono text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#e6cf9c] transition cursor-pointer"
                  >
                    {saving ? '...' : 'Confirmar Cita'}
                  </button>
                )}
                {selected.status !== 'cancelado' && (
                  <button
                    onClick={() => handleStatus(selected._id, 'cancelado')}
                    disabled={saving}
                    className="py-3 px-4 border border-rose-500/40 bg-rose-500/10 text-rose-400 font-mono text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-rose-500/20 transition cursor-pointer"
                  >
                    Cancelar Cita
                  </button>
                )}
                <button
                  onClick={() => handleDeleteSlot(selected._id)}
                  disabled={saving}
                  className="py-3 px-4 border border-slate-700 bg-slate-800 text-slate-300 font-mono text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-rose-900/40 hover:text-rose-300 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Eliminar Registro
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#1E3A5F]">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-2">Datos completos registrados desde la web principal</div>
              {([
                ['Nombre completo', selected.nombre],
                ['Empresa',         selected.empresa],
                ['Email',           selected.email],
                ['Cargo / Puesto',  selected.cargo      || '—'],
                ['Revenue Anual',   selected.revenue     || '—'],
                ['Plazo Estimado',  selected.plazo       || '—'],
                ['Iniciativa Oracle', selected.iniciativaOracle || '—'],
                ['Fecha Cita',      selected.dia ? fmtDate(selected.dia) : '—'],
                ['Hora Cita',       selected.slot       || '—'],
                ['Estado Cita',     selected.status.toUpperCase()],
                ['Código Acceso',   selected.codigoReunion || '—'],
                ['Enlace Meet',     selected.meetLink || '—'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2 border-b border-[#1E3A5F]/60 text-xs">
                  <span className="font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">{k}</span>
                  <span className="font-mono text-white text-right break-all max-w-[260px]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Reagendar Cita de Office Hours */}
      {rescheduleModalBooking && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setRescheduleModalBooking(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0E2747] border border-[#C9A96E]/50 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fadeIn relative"
          >
            <div className="flex justify-between items-start border-b border-[#1E3A5F] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C9A96E] uppercase tracking-widest block">
                  OFFICE HOURS · REAGENDAR CITA
                </span>
                <h3 className="text-xl font-bold font-serif text-white mt-1">
                  Reagendar Cita de {rescheduleModalBooking.nombre}
                </h3>
                <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                  {rescheduleModalBooking.empresa} &nbsp;·&nbsp; {rescheduleModalBooking.email}
                </p>
                <p className="text-[11px] font-mono text-blue-300 mt-1">
                  🗓️ Cita actual: <strong>{rescheduleModalBooking.dia}</strong> a las <strong>{rescheduleModalBooking.slot}</strong>
                </p>
              </div>
              <button
                onClick={() => setRescheduleModalBooking(null)}
                className="w-8 h-8 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center text-lg cursor-pointer transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CalendarIcon size={13} /> Nueva Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={e => setRescheduleDate(e.target.value)}
                    className="w-full bg-[#07192F] border border-[#1E3A5F] focus:border-[#C9A96E] text-white text-xs font-mono rounded-xl p-3 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock size={13} /> Nuevo Horario *
                  </label>
                  <select
                    value={rescheduleTime}
                    onChange={e => setRescheduleTime(e.target.value)}
                    className="w-full bg-[#07192F] border border-[#1E3A5F] focus:border-[#C9A96E] text-white text-xs font-mono rounded-xl p-3 outline-none transition cursor-pointer"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Input Enlace Generado Protegido */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Link size={13} /> Enlace de la Reunión:</span>
                  <span className="text-[10px] text-slate-400 font-normal">🔒 Protegido</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${window.location.origin}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${rescheduleModalBooking.roomId || 'MEET-8821'}`}
                  className="w-full bg-[#030712]/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold rounded-xl p-3 outline-none opacity-90 cursor-not-allowed select-all tracking-wide shadow-inner"
                />
                <p className="text-[11px] text-slate-400 font-mono">
                  🔑 Al reagendar se generará automáticamente una nueva contraseña de acceso y se notificará por correo.
                </p>
              </div>

              <div className="pt-4 border-t border-[#1E3A5F] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRescheduleModalBooking(null)}
                  className="px-5 py-2.5 border border-[#1E3A5F] text-[#94A3B8] hover:text-white font-mono text-xs rounded-xl cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRescheduling}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <CalendarIcon size={14} />
                  <span>{isRescheduling ? 'Reagendando...' : 'Confirmar Reagendamiento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Alerta de Notificación Flotante Personalizada FABRIC */}
      {toast && createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] animate-fadeIn">
          <div className={`flex items-start gap-3.5 p-4 rounded-2xl border shadow-2xl backdrop-blur-md max-w-sm ${
            toast.type === 'emerald'
              ? 'bg-[#07192F]/95 border-emerald-500/60 text-emerald-300 shadow-emerald-950/80 ring-1 ring-emerald-500/30'
              : 'bg-[#07192F]/95 border-[#C9A96E]/60 text-amber-200 shadow-amber-950/80 ring-1 ring-[#C9A96E]/30'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              toast.type === 'emerald'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-[#C9A96E]/20 border-[#C9A96E]/40 text-[#C9A96E]'
            }`}>
              {toast.type === 'emerald' ? <CheckCircle2 size={20} /> : <Video size={20} />}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5 font-mono">
              <div className="text-xs font-bold text-white uppercase tracking-wider">{toast.title}</div>
              <div className="text-[11px] text-slate-300 leading-snug">{toast.message}</div>
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
