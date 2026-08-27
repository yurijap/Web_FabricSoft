import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UsersRound, Search, RefreshCw, Trash2, CheckCircle2, ShieldCheck, Mail, Building, User, Calendar, ArrowRight, AlertCircle, Clock, XCircle } from 'lucide-react';
import { useAuthApi } from '../../config/api';

interface LeadItem {
  _id: string;
  nombre: string;
  empresa: string;
  email: string;
  cargo?: string;
  revenue?: string;
  iniciativaOracle?: string;
  servicio?: string;
  estatus?: string;
  tipo?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  Evaluación: '#C9A96E',
  Agendado: '#38bdf8',
  Aprobado: '#4ade80',
  'En Revisión': '#60a5fa',
  Rechazado: '#B85450',
  Declinado: '#f43f5e',
};

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM'
];

export default function AdminLeads() {
  const adminApi = useAuthApi();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<LeadItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Office Hours Scheduling State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleSlot, setScheduleSlot] = useState<string>('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  // Papelera de Reciclaje State
  const [trashLeads, setTrashLeads] = useState<LeadItem[]>([]);
  const [showTrashModal, setShowTrashModal] = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    adminApi.get('/leads')
      .then(res => {
        const data = res.data.data ?? [];
        setLeads(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchTrashLeads = () => {
    adminApi.get('/leads?trash=true')
      .then(res => {
        const data = res.data.data ?? [];
        setTrashLeads(data);
      })
      .catch(() => {});
  };

  const fetchOfficeHoursBookings = async () => {
    try {
      const res = await adminApi.get('/office-hours/admin');
      const data = res?.data?.data || res?.data || [];
      setExistingBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching office hours bookings:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchTrashLeads();
    fetchOfficeHoursBookings();
  }, []);

  const selectedExistingBooking = selected
    ? existingBookings.find((b: any) =>
        b.email &&
        selected.email &&
        b.email.toLowerCase().trim() === selected.email.toLowerCase().trim() &&
        b.status !== 'cancelado' &&
        b.status !== 'rechazado'
      )
    : null;

  const handleStatusChange = async (id: string, newStatus: string) => {
    setSaving(true);
    try {
      await adminApi.patch(`/leads/${id}/status`, { estatus: newStatus }).catch(() => null);
      setLeads(prev => prev.map(l => l._id === id ? { ...l, estatus: newStatus } : l));
      if (selected?._id === id) setSelected(prev => prev ? { ...prev, estatus: newStatus } : null);
    } catch {
      setLeads(prev => prev.map(l => l._id === id ? { ...l, estatus: newStatus } : l));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas mover este prospecto a la Papelera de Reciclaje?')) return;
    setSaving(true);
    try {
      const targetLead = leads.find(l => l._id === id);
      await adminApi.delete(`/leads/${id}`).catch(() => null);
      setLeads(prev => prev.filter(l => l._id !== id));
      if (targetLead) {
        setTrashLeads(prev => [targetLead, ...prev]);
      }
      if (selected?._id === id) setSelected(null);
    } catch {
      setLeads(prev => prev.filter(l => l._id !== id));
      if (selected?._id === id) setSelected(null);
    } finally {
      setSaving(false);
    }
  };
  const [declining, setDeclining] = useState(false);

  const handleDeclineProspect = async (lead: LeadItem) => {
    if (!window.confirm(`¿Confirmas que deseas declinar a ${lead.nombre} (${lead.empresa})?\n\nSe le enviará un correo notificándole que su solicitud no fue seleccionada.`)) {
      return;
    }

    setDeclining(true);
    try {
      await adminApi.patch(`/fusion-rescue/submissions/${lead._id}/decline`, { email: lead.email });
      alert(`Prospecto declinado exitosamente. Se ha enviado la notificación por correo a ${lead.email}.`);

      setLeads(prev => prev.map(l => l._id === lead._id ? { ...l, estatus: 'Declinado' } : l));
      if (selected?._id === lead._id) {
        setSelected(prev => prev ? { ...prev, estatus: 'Declinado' } : null);
      }
    } catch (err: any) {
      console.error('Error declinando prospecto:', err);
      alert('Error al declinar prospecto: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeclining(false);
    }
  };

  const handleRestoreLead = async (id: string) => {
    try {
      const res = await adminApi.patch(`/leads/${id}/restore`);
      const restored = res.data?.data;
      setTrashLeads(prev => prev.filter(l => l._id !== id));
      if (restored) {
        setLeads(prev => [restored, ...prev]);
      } else {
        fetchLeads();
      }
    } catch (err) {
      console.error('Error restaurando lead:', err);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar DEFINITIVAMENTE este prospecto de la BD? Esta acción no se puede deshacer.')) return;
    try {
      await adminApi.delete(`/leads/${id}?permanent=true`);
      setTrashLeads(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      console.error('Error eliminando lead definitivamente:', err);
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('¿Deseas vaciar la Papelera de Reciclaje? Todos los prospectos archivados serán eliminados de la BD.')) return;
    try {
      await adminApi.delete('/leads/trash/empty');
      setTrashLeads([]);
    } catch (err) {
      console.error('Error vaciando papelera:', err);
    }
  };

  // Helper validation for scheduling
  const isWeekend = (dateString: string) => {
    if (!dateString) return false;
    const d = new Date(dateString + 'T12:00:00');
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const isSlotOccupied = (dia: string, slot: string) => {
    if (!dia || !slot) return false;
    return existingBookings.some(b => b.dia === dia && b.slot === slot && b.status !== 'cancelado' && b.status !== 'rechazado' && b._id !== selectedExistingBooking?._id);
  };

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

  const handleOpenScheduleModal = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selected) return;
    setShowScheduleModal(true);
    setScheduleError(null);
    setScheduleSuccess(null);

    // Set default date to tomorrow or next business day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2);
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);

    const defaultDia = tomorrow.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    setScheduleDate(defaultDia);
    setScheduleSlot('');

    fetchOfficeHoursBookings();
  };

  const handleConfirmScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setScheduleError(null);
    setScheduleSuccess(null);

    if (!scheduleDate || !scheduleSlot) {
      setScheduleError('Por favor selecciona la fecha y un horario disponible.');
      return;
    }

    if (isWeekend(scheduleDate)) {
      setScheduleError('Solo se permiten reuniones en días hábiles (Lunes a Viernes).');
      return;
    }

    if (isSlotOccupied(scheduleDate, scheduleSlot)) {
      setScheduleError(`El horario ${scheduleSlot} ya se encuentra reservado para la fecha seleccionada.`);
      return;
    }

    setIsScheduling(true);

    try {
      // If prospect already has a booking, remove or replace old slot to prevent duplicates
      if (selectedExistingBooking && selectedExistingBooking._id) {
        await adminApi.delete(`/office-hours/admin/${selectedExistingBooking._id}`).catch(() => null);
      }

      const newId = `slot_${Date.now()}`;
      const newBooking = {
        _id: newId,
        nombre: selected.nombre,
        empresa: selected.empresa,
        email: selected.email,
        cargo: selected.cargo || 'Ejecutivo',
        revenue: selected.revenue || '—',
        iniciativaOracle: selected.iniciativaOracle || 'Evaluación Principal',
        dia: scheduleDate,
        slot: scheduleSlot,
        status: 'pendiente',
        isCreatedByAdmin: true,
        emailEnviado: false,
        calendarEnviado: false,
        createdAt: new Date().toISOString()
      };

      await adminApi.post('/office-hours/admin', newBooking);
      await fetchOfficeHoursBookings();

      setScheduleSuccess(`¡Tu cita con ${selected.nombre} ha quedado registrada! No olvides ingresar al panel de administración, buscar el apartado de "Fechas y Citas Apartadas por Clientes" y realizar la aprobación definitiva para que se envíe el enlace de la reunión.`);
      handleStatusChange(selected._id, 'Agendado');
      setTimeout(() => {
        setShowScheduleModal(false);
        setScheduleSuccess(null);
      }, 4500);
    } catch (err: any) {
      setScheduleError('Error al agendar la reunión: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsScheduling(false);
    }
  };

  const filteredLeads = leads.filter(l => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (l.nombre || '').toLowerCase().includes(term) ||
      (l.empresa || '').toLowerCase().includes(term) ||
      (l.email || '').toLowerCase().includes(term) ||
      (l.cargo || '').toLowerCase().includes(term) ||
      (l.iniciativaOracle || '').toLowerCase().includes(term) ||
      (l.revenue || '').toLowerCase().includes(term)
    );
  });

  const fmtDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const evaluacionCount = leads.filter(l => (l.estatus || 'Evaluación').toLowerCase() === 'evaluación' || (l.estatus || '').toLowerCase() === 'evaluacion').length;
  const aprobadosCount = leads.filter(l => (l.estatus || '').toLowerCase() === 'aprobado').length;

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white font-sans pb-16">
      {/* Header / Hero */}
      <div className="p-6 md:p-8 bg-[#0B1F3A] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <ShieldCheck size={13} /> FABRIC · SUPER ADMIN · PROSPECTOS EN EVALUACIÓN
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Leads y Evaluaciones Registradas
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Registro guardado en MongoDB Atlas de los ejecutivos que hicieron clic en "Iniciar evaluación →" desde la pantalla principal.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0E2747] border border-[#1E3A5F] px-5 py-2.5 rounded-2xl shadow-md shrink-0">
            <div className="text-center px-2">
              <div className="font-serif text-2xl font-bold leading-none text-white">{leads.length}</div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Total Leads</div>
            </div>
            <div className="text-center px-2">
              <div className="font-serif text-2xl font-bold leading-none text-[#C9A96E]">{evaluacionCount}</div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Evaluación</div>
            </div>
            <div className="text-center px-2">
              <div className="font-serif text-2xl font-bold leading-none text-[#4ade80]">{aprobadosCount}</div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Aprobados</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Buscador */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0E2747] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, empresa, email, cargo o iniciativa..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E] transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => { fetchLeads(); fetchTrashLeads(); }}
              className="px-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar Tabla</span>
            </button>

            <button
              onClick={() => { fetchTrashLeads(); setShowTrashModal(true); }}
              className="px-4 py-2.5 bg-[#07192F] border border-rose-500/40 hover:border-rose-400 text-rose-300 font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer relative"
            >
              <Trash2 size={14} className="text-rose-400" />
              <span>Papelera de Reciclaje</span>
              {trashLeads.length > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold ml-1">
                  {trashLeads.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabla de Leads */}
        <div className="rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] bg-[#07192F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersRound size={16} className="text-[#C9A96E]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Prospectos Registrados desde "Iniciar Evaluación" ({filteredLeads.length})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center font-mono text-xs text-[#94A3B8] tracking-widest">
                Cargando leads y evaluaciones desde la BD...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <UsersRound size={32} className="mx-auto text-[#1E3A5F]" />
                <div className="font-serif text-base font-bold text-white">Sin registros de evaluación todavía</div>
                <p className="text-xs text-[#94A3B8] font-mono max-w-sm mx-auto">
                  {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay prospectos que hayan presionado "Iniciar evaluación" en la página principal aún.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E3A5F] bg-[#07192F]/60 font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Prospecto</th>
                    <th className="py-3.5 px-5">Empresa / Cargo</th>
                    <th className="py-3.5 px-5">Email Corporativo</th>
                    <th className="py-3.5 px-5">Revenue Anual</th>
                    <th className="py-3.5 px-5">Iniciativa Oracle</th>
                    <th className="py-3.5 px-5">Cita Agendada</th>
                    <th className="py-3.5 px-5">Fecha Registro</th>
                    <th className="py-3.5 px-5">Estado</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60 text-xs">
                  {filteredLeads.map(l => {
                    const statusStr = l.estatus || 'Evaluación';
                    const color = STATUS_COLORS[statusStr] ?? '#C9A96E';
                    const leadBooking = existingBookings.find(b =>
                      b.email &&
                      l.email &&
                      b.email.toLowerCase().trim() === l.email.toLowerCase().trim() &&
                      b.status !== 'cancelado' &&
                      b.status !== 'rechazado'
                    );

                    return (
                      <tr
                        key={l._id}
                        onClick={() => setSelected(l)}
                        className="hover:bg-[#123254]/50 transition cursor-pointer group"
                      >
                        <td className="py-4 px-5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-[#C9A96E] shrink-0" />
                            <span className="truncate">{l.nombre}</span>
                            {leadBooking && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-mono font-bold flex items-center gap-1 shrink-0" title="Cita ya agendada en Office Hours">
                                <CheckCircle2 size={11} /> Cita
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-5 text-[#94A3B8]">
                          <div className="font-mono">
                            <span className="text-white font-medium">{l.empresa}</span>
                            {l.cargo && <span className="text-[#94A3B8] block text-[10px]">{l.cargo}</span>}
                          </div>
                        </td>

                        <td className="py-4 px-5 font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Mail size={12} className="text-[#94A3B8] shrink-0" />
                            <span className="truncate">{l.email}</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 font-mono text-white font-semibold">
                          {l.revenue || '—'}
                        </td>

                        <td className="py-4 px-5 font-mono text-[#C9A96E]">
                          <div className="max-w-xs truncate">{l.iniciativaOracle || '—'}</div>
                        </td>

                        <td className="py-4 px-5 font-mono">
                          {leadBooking ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold shadow-xs">
                              <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                              <span>{leadBooking.dia} · {leadBooking.slot}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">— Sin Cita —</span>
                          )}
                        </td>

                        <td className="py-4 px-5 font-mono text-[10px] text-[#94A3B8]">
                          {fmtDate(l.createdAt)}
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className="font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border inline-block"
                            style={{
                              color,
                              borderColor: `${color}44`,
                              backgroundColor: `${color}15`,
                            }}
                          >
                            {statusStr}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelected(l)}
                              className="px-2.5 py-1 rounded border border-[#1E3A5F] bg-[#123254] text-[#C9A96E] hover:text-white font-mono text-[9px] font-bold uppercase transition"
                              title="Ver ficha de prospecto"
                            >
                              Ver Ficha
                            </button>
                            <button
                              onClick={() => handleDelete(l._id)}
                              disabled={saving}
                              className="p-1.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                              title="Eliminar prospecto"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out Lateral de Detalle del Lead */}
      {selected && createPortal(
        <div
          className="fixed inset-0 bg-[#07192F]/80 backdrop-blur-xs z-[99990] flex justify-end"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0E2747] border-l border-[#1E3A5F] shadow-2xl p-6 md:p-8 overflow-y-auto min-h-screen space-y-6 animate-fadeIn"
          >
            <div className="border-b border-[#1E3A5F] pb-5 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-[9px] text-[#C9A96E] tracking-widest uppercase mb-1">
                    Ficha de Evaluación de Prospecto
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

            <div className="bg-[#07192F] border border-[#1E3A5F] rounded-2xl p-5 space-y-3">
              <div className="font-mono text-[9px] font-bold text-[#94A3B8] tracking-widest uppercase">
                Iniciativa Oracle
              </div>
              <div className="font-serif text-lg font-bold text-[#C9A96E]">
                {selected.iniciativaOracle || '—'}
              </div>
              <div className="font-mono text-[10px] text-slate-400">
                Fecha de registro: {fmtDate(selected.createdAt)}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-2">
                Datos Capturados en Formulario de Evaluación
              </div>
              {([
                ['Nombre completo', selected.nombre],
                ['Empresa', selected.empresa],
                ['Email corporativo', selected.email],
                ['Cargo / Puesto', selected.cargo || '—'],
                ['Revenue Anual', selected.revenue || '—'],
                ['Iniciativa Oracle', selected.iniciativaOracle || '—'],
                ['Estado de Evaluación', selected.estatus || 'Evaluación'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2.5 border-b border-[#1E3A5F]/60 text-xs font-mono">
                  <span className="text-[#94A3B8] uppercase text-[9px]">{k}</span>
                  <span className="text-white text-right break-all max-w-[240px] font-semibold">{v}</span>
                </div>
              ))}
            </div>

            {/* Botón Principal: Agendar / Reagendar Reunión Office Hours */}
            <div className="pt-2">
              {selectedExistingBooking ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleOpenScheduleModal}
                    className="w-full py-3.5 bg-blue-950/80 hover:bg-blue-900 border-2 border-blue-400 text-blue-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xl"
                  >
                    <Calendar size={16} />
                    <span>Reagendar Reunión (Office Hours)</span>
                  </button>
                  <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-[11px] font-mono text-blue-300 text-center">
                    📅 Cita actual reservada: <strong>{selectedExistingBooking.dia}</strong> a las <strong>{selectedExistingBooking.slot}</strong> ({selectedExistingBooking.status})
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenScheduleModal}
                  className="w-full py-3.5 bg-[#07192F] hover:bg-[#123254] border-2 border-[#C9A96E] hover:border-[#FFE8A3] text-[#C9A96E] hover:text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xl"
                >
                  <Calendar size={16} />
                  <span>Agendar Reunión (Office Hours)</span>
                </button>
              )}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {(selected.estatus || '').toLowerCase() !== 'declinado' && (
                <button
                  onClick={() => handleDeclineProspect(selected)}
                  className="flex-1 py-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <XCircle size={16} />
                  <span>{declining ? 'Enviando correo...' : 'Declinar Prospecto'}</span>
                </button>
              )}

              <button
                onClick={() => handleDelete(selected._id)}
                disabled={saving || declining}
                className="px-4 py-3 border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Emergente para Agendar / Reagendar Reunión con Office Hours */}
      {showScheduleModal && selected && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0E2747] border border-[#C9A96E]/50 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fadeIn relative"
          >
            <div className="flex justify-between items-start border-b border-[#1E3A5F] pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C9A96E] uppercase tracking-widest block">
                  CONEXIÓN OFFICE HOURS · {selectedExistingBooking ? 'REAGENDAMIENTO DE CITA' : 'NUEVA CITA'}
                </span>
                <h3 className="text-xl font-bold font-serif text-white mt-1">
                  {selectedExistingBooking ? `Reagendar Reunión para ${selected.nombre}` : `Agendar Reunión para ${selected.nombre}`}
                </h3>
                <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                  {selected.empresa} &nbsp;·&nbsp; {selected.email}
                </p>
                {selectedExistingBooking && (
                  <p className="text-[11px] font-mono text-blue-300 mt-1">
                    🗓️ Cita actual reservada: <strong>{selectedExistingBooking.dia}</strong> a las <strong>{selectedExistingBooking.slot}</strong>
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-xl border border-[#1E3A5F] bg-[#07192F] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmScheduleMeeting} className="space-y-5">
              {/* Selección de Fecha */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#C9A96E]" />
                  Selecciona la Fecha (Lunes a Viernes):
                </label>
                <input
                  type="date"
                  required
                  value={scheduleDate}
                  onChange={(e) => {
                    setScheduleDate(e.target.value);
                    setScheduleSlot('');
                    setScheduleError(null);
                  }}
                  className="w-full px-4 py-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#C9A96E] transition cursor-pointer"
                />
                {scheduleDate && isWeekend(scheduleDate) && (
                  <p className="text-[11px] text-rose-400 font-mono mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Los fines de semana no hay disponibilidad. Selecciona de Lunes a Viernes.
                  </p>
                )}
              </div>

              {/* Grid de Horarios Permitidos */}
              <div>
                <label className="block text-xs font-mono font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-[#C9A96E]" />
                  Selecciona el Horario Disponible:
                </label>

                {!scheduleDate ? (
                  <p className="text-xs font-mono text-slate-400 p-4 bg-[#07192F] rounded-xl border border-[#1E3A5F] text-center">
                    Selecciona primero una fecha arriba para consultar la disponibilidad en vivo.
                  </p>
                ) : isWeekend(scheduleDate) ? (
                  <p className="text-xs font-mono text-rose-400 p-4 bg-[#07192F] rounded-xl border border-rose-500/30 text-center">
                    No hay horarios disponibles los fines de semana.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar-gold pr-1">
                    {TIME_SLOTS.map((slot) => {
                      const occupied = isSlotOccupied(scheduleDate, slot);
                      const expired = isSlotExpired(scheduleDate, slot);
                      const isDisabled = occupied || expired;
                      const isSelectedSlot = scheduleSlot === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => {
                            setScheduleSlot(slot);
                            setScheduleError(null);
                          }}
                          className={`p-2.5 rounded-xl text-xs font-mono font-bold transition flex items-center justify-between cursor-pointer border ${
                            isSelectedSlot
                              ? 'bg-[#C9A96E] text-[#050203] border-[#FFE8A3] shadow-md font-extrabold'
                              : isDisabled
                              ? 'bg-[#07192F]/60 text-slate-600 border-slate-800 cursor-not-allowed'
                              : 'bg-[#07192F] text-white border-[#1E3A5F] hover:border-[#C9A96E]'
                          }`}
                        >
                          <span>{slot}</span>
                          {occupied ? (
                            <span className="text-[9px] text-rose-400 font-normal">Ocupado</span>
                          ) : expired ? (
                            <span className="text-[9px] text-slate-500 font-normal">Pasado</span>
                          ) : isSelectedSlot ? (
                            <CheckCircle2 size={13} className="text-[#050203]" />
                          ) : (
                            <span className="text-[9px] text-emerald-400 font-normal">Libre</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mensajes de Estado */}
              {scheduleError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-mono rounded-xl text-center">
                  {scheduleError}
                </div>
              )}

              {scheduleSuccess && (
                <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold rounded-xl text-center animate-fadeIn shadow-lg">
                  {scheduleSuccess}
                </div>
              )}

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-[#1E3A5F] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#07192F] hover:bg-[#123254] text-slate-300 font-mono text-xs cursor-pointer border border-[#1E3A5F]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={!scheduleDate || !scheduleSlot || isWeekend(scheduleDate) || isScheduling}
                  className="px-6 py-2.5 rounded-xl bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-mono text-xs font-bold cursor-pointer transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  <span>{isScheduling ? 'Guardando Cita...' : 'Confirmar y Guardar Cita'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Emergente de Papelera de Reciclaje */}
      {showTrashModal && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999999] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowTrashModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl bg-[#0E2747] border border-rose-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-fadeIn relative max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center border-b border-[#1E3A5F] pb-4 shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest block flex items-center gap-1.5">
                  <Trash2 size={13} /> PAPELERA DE RECICLAJE · PROSPECTOS ELIMINADOS
                </span>
                <h3 className="text-xl font-bold font-serif text-white mt-1">
                  Prospectos Archivados ({trashLeads.length})
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {trashLeads.length > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-400 font-mono text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Vaciar Papelera</span>
                  </button>
                )}
                <button
                  onClick={() => setShowTrashModal(false)}
                  className="w-8 h-8 rounded-xl border border-[#1E3A5F] bg-[#07192F] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar-gold pr-1">
              {trashLeads.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Trash2 size={36} className="mx-auto text-slate-600" />
                  <div className="font-serif text-base font-bold text-white">La papelera está vacía</div>
                  <p className="text-xs text-[#94A3B8] font-mono max-w-sm mx-auto">
                    Los prospectos eliminados aparecerán aquí para que puedas restaurarlos o eliminarlos definitivamente.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1E3A5F] bg-[#07192F]/60 font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
                      <th className="py-3 px-4">Prospecto</th>
                      <th className="py-3 px-4">Empresa / Cargo</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Iniciativa</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A5F]/60 text-xs">
                    {trashLeads.map(item => (
                      <tr key={item._id} className="hover:bg-[#123254]/40 transition font-mono">
                        <td className="py-3.5 px-4 font-bold text-white">
                          {item.nombre}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div>{item.empresa}</div>
                          {item.cargo && <div className="text-[10px] text-slate-400">{item.cargo}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {item.email}
                        </td>
                        <td className="py-3.5 px-4 text-[#C9A96E]">
                          {item.iniciativaOracle || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRestoreLead(item._id)}
                              className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1"
                              title="Restaurar prospecto"
                            >
                              <RefreshCw size={11} /> Restaurar
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(item._id)}
                              className="px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-[10px] font-bold uppercase transition cursor-pointer flex items-center gap-1"
                              title="Eliminar definitivamente de MongoDB"
                            >
                              <Trash2 size={11} /> Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
