import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Video,
  User,
  Building2,
  Mail,
  Phone,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  CalendarClock,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { api as adminApi } from '../../../config/api';
import { createPortal } from 'react-dom';

export interface MeetingItem {
  _id: string;
  nombre: string;
  first_name?: string;
  last_name?: string;
  email: string;
  telefono?: string;
  phone?: string;
  cargo?: string;
  job_title?: string;
  empresa: string;
  company_name?: string;
  country?: string;
  health_score?: number;
  totalScore?: number;
  health_classification?: string;
  recommended_path?: string;
  review_requested?: boolean;
  contact_preference?: string;
  status?: string;
  meeting_date?: string;
  meeting_time?: string;
  meeting_link?: string;
  meeting_email_sent?: boolean;
  meeting_sent_at?: string;
  createdAt: string;
}

export default function AdminRescueMeetings() {
  const [items, setItems] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [now, setNow] = useState<Date>(new Date());

  // Modal State for Rescheduling & Viewing Details
  const [scheduleModalSubmission, setScheduleModalSubmission] = useState<MeetingItem | null>(null);
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [meetingTime, setMeetingTime] = useState<string>('10:00');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [isSavingMeeting, setIsSavingMeeting] = useState<boolean>(false);

  const [selectedSubmission, setSelectedSubmission] = useState<MeetingItem | null>(null);

  // Update `now` every minute for real-time countdown precision
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: MeetingItem[] = [];
      try {
        const res = await adminApi.get('/fusion-rescue/submissions');
        data = res.data?.data || res.data || [];
      } catch {
        const res2 = await adminApi.get('/rescue-assessment/submissions');
        data = res2.data?.data || res2.data || [];
      }

      // Filter items that have meeting date or status 'Reunión Agendada' / 'Reunión Enviada'
      const meetingsOnly = data.filter(item => 
        Boolean(item.meeting_date) || 
        item.status === 'Reunión Agendada' || 
        item.status === 'Reunión Enviada' ||
        Boolean(item.meeting_email_sent)
      );

      setItems(meetingsOnly);
    } catch (err: any) {
      console.error('Error cargando reuniones:', err);
      setError(err.response?.data?.error || err.message || 'Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Helper to construct exact JavaScript Date object for a meeting
  const getMeetingDateTime = (item: MeetingItem): Date | null => {
    if (!item.meeting_date) return null;
    const dateStr = item.meeting_date.trim();
    const timeStr = item.meeting_time ? item.meeting_time.trim() : '10:00';

    // Parse YYYY-MM-DD and HH:mm
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(item.meeting_date);

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0] || '10', 10);
    const minutes = parseInt(timeParts[1] || '00', 10);

    return new Date(year, month, day, hours, minutes, 0);
  };

  // Helper to format countdown / elapsed time text
  const getTimeDiffText = (meetingDateObj: Date | null) => {
    if (!meetingDateObj || isNaN(meetingDateObj.getTime())) return 'Fecha por confirmar';

    const diffMs = meetingDateObj.getTime() - now.getTime();
    const diffMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const isFuture = diffMs >= 0;

    if (isFuture) {
      if (diffMinutes < 5) return '⚡ ¡Comienza Ahora!';
      if (diffMinutes < 60) return `⏱️ En ${diffMinutes} minutos`;
      if (diffHours < 24) return `⏱️ En ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
      if (diffDays === 1) return `📅 Mañana a las ${meetingDateObj.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
      return `📅 En ${diffDays} días`;
    } else {
      if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
      if (diffHours < 24) return `Hace ${diffHours} hr${diffHours > 1 ? 's' : ''}`;
      if (diffDays === 1) return `Ayer`;
      return `Hace ${diffDays} días`;
    }
  };

  // Filter and Sort Meetings
  const { upcomingMeetings, pastMeetings, completedMeetings } = useMemo(() => {
    const filtered = items.filter(item => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.nombre.toLowerCase().includes(term) ||
        item.empresa.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        (item.meeting_date && item.meeting_date.includes(term))
      );
    });

    const upcoming: MeetingItem[] = [];
    const past: MeetingItem[] = [];
    const completed: MeetingItem[] = [];

    filtered.forEach(item => {
      if (item.status === 'Completado') {
        completed.push(item);
        return;
      }

      const dt = getMeetingDateTime(item);
      if (!dt) {
        upcoming.push(item);
        return;
      }
      if (dt.getTime() >= now.getTime() - 1000 * 60 * 30) { 
        upcoming.push(item);
      } else {
        past.push(item);
      }
    });

    // Sort upcoming: Closest in time FIRST (ascending order)
    upcoming.sort((a, b) => {
      const dtA = getMeetingDateTime(a)?.getTime() ?? Infinity;
      const dtB = getMeetingDateTime(b)?.getTime() ?? Infinity;
      return dtA - dtB;
    });

    // Sort past: Most recent past meeting FIRST (descending order)
    past.sort((a, b) => {
      const dtA = getMeetingDateTime(a)?.getTime() ?? 0;
      const dtB = getMeetingDateTime(b)?.getTime() ?? 0;
      return dtB - dtA;
    });

    // Sort completed: Most recent FIRST (descending order)
    completed.sort((a, b) => {
      const dtA = getMeetingDateTime(a)?.getTime() ?? 0;
      const dtB = getMeetingDateTime(b)?.getTime() ?? 0;
      return dtB - dtA;
    });

    return { upcomingMeetings: upcoming, pastMeetings: past, completedMeetings: completed };
  }, [items, searchTerm, now]);

  const openScheduleModal = (submission: MeetingItem) => {
    setScheduleModalSubmission(submission);
    setMeetingDate(submission.meeting_date || new Date().toISOString().split('T')[0]);
    setMeetingTime(submission.meeting_time || '10:00');
    setMeetingLink(submission.meeting_link || '');
  };

  const handleConfirmScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalSubmission) return;
    if (!meetingDate) {
      alert('Por favor selecciona la fecha de la reunión.');
      return;
    }

    setIsSavingMeeting(true);
    try {
      const isReschedule = Boolean(
        scheduleModalSubmission.meeting_date || 
        scheduleModalSubmission.meeting_email_sent || 
        scheduleModalSubmission.status === 'Reunión Agendada' || 
        scheduleModalSubmission.status === 'Reunión Enviada'
      );

      const payload = {
        status: 'Reunión Agendada',
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        meeting_link: meetingLink,
        email: scheduleModalSubmission.email,
        nombre: scheduleModalSubmission.nombre,
        empresa: scheduleModalSubmission.empresa,
        send_meeting_email: true,
        is_reschedule: isReschedule
      };

      const res = await adminApi.patch(`/fusion-rescue/submissions/${scheduleModalSubmission._id}/status`, payload);
      const updatedData = res.data?.data;
      const finalStatus = updatedData?.status || 'Reunión Enviada';

      setItems(prev => prev.map(i => i._id === scheduleModalSubmission._id ? {
        ...i,
        status: finalStatus,
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        meeting_link: meetingLink,
        meeting_email_sent: true
      } : i));

      const actionWord = isReschedule ? 'Reagendada' : 'Agendada';
      alert(`⚡ ¡Reunión ${actionWord} y Notificada por Correo!\n\nProspecto: ${scheduleModalSubmission.nombre}\nEmail: ${scheduleModalSubmission.email}\nFecha: ${meetingDate} a las ${meetingTime} hrs`);
      setScheduleModalSubmission(null);
    } catch (err: any) {
      alert('Error al agendar reunión: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const handleMarkCompleted = async (submission: MeetingItem) => {
    if (!window.confirm(`¿Marcar la reunión con ${submission.nombre} (${submission.empresa}) como Completada?`)) return;
    try {
      await adminApi.patch(`/fusion-rescue/submissions/${submission._id}/status`, {
        status: 'Completado',
        email: submission.email,
        send_meeting_email: false
      });
      setItems(prev => prev.map(i => i._id === submission._id ? { ...i, status: 'Completado' } : i));
      alert(`La reunión con ${submission.nombre} ha sido marcada como Completada.`);
    } catch (err: any) {
      alert('Error al actualizar estatus: ' + (err.response?.data?.error || err.message));
    }
  };

  const getScoreBadge = (score: number, classification?: string) => {
    let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    let label = classification || 'OPTIMAL';
    if (score < 40) {
      colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    } else if (score < 70) {
      colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }

    return (
      <span className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border inline-flex items-center gap-1.5 ${colorClass}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {score} / 100 · {label}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8 text-slate-100 font-sans">
      {/* ── Header Principal ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0E2747] p-6 md:p-8 rounded-3xl border border-[#1E3A5F] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-[#C9A96E]/10 to-transparent pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-full">
            <CalendarClock size={14} className="text-[#C9A96E]" />
            <span className="font-mono text-xs font-bold text-[#C9A96E] uppercase tracking-wider">
              Control Ejecutivo de Citas
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
            Reuniones Agendadas
          </h1>
          <p className="text-sm text-slate-300 font-mono max-w-2xl">
            Monitoreo en tiempo real de las sesiones técnicas agendadas con prospectos del diagnóstico Fusion Rescue™. Las citas se ordenan automáticamente comenzando por la más cercana.
          </p>
        </div>

        {/* Action Buttons & Counters */}
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={fetchMeetings}
            disabled={loading}
            className="px-4 py-2.5 bg-[#123254] hover:bg-[#1A3D68] text-slate-200 border border-[#1E3A5F] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* ── Bar de Búsqueda y Filtros ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#07192F] p-4 rounded-2xl border border-[#1E3A5F]">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, empresa o fecha..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0E2747] border border-[#1E3A5F] rounded-xl text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-[#C9A96E] transition"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Próximas ({upcomingMeetings.length})</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Pasadas ({pastMeetings.length})</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold">
            <CheckCircle2 size={13} />
            <span>Completadas ({completedMeetings.length})</span>
          </div>
        </div>
      </div>

      {/* ── Main Layout Grid (Left: Upcoming Cards / Right: Historical Column) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── LEFT COLUMN (2 Columns Wide): REUNIONES PRÓXIMAS (Cards Grid) ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="text-emerald-400" size={18} />
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Próximas Sesiones Técnicas (En Orden Cronológico)
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {upcomingMeetings.length} {upcomingMeetings.length === 1 ? 'Cita' : 'Citas'} Pendientes
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center bg-[#07192F] border border-[#1E3A5F] rounded-3xl space-y-3">
              <RefreshCw size={28} className="animate-spin text-[#C9A96E] mx-auto" />
              <p className="font-mono text-xs text-slate-400">Cargando reuniones agendadas...</p>
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="p-12 text-center bg-[#07192F] border border-[#1E3A5F] rounded-3xl space-y-3">
              <CalendarClock size={36} className="text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white font-mono">No hay reuniones próximas en este momento</h3>
              <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto">
                Las nuevas citas agendadas desde los expedientes de prospectos aparecerán automáticamente ordenadas en este espacio.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingMeetings.map((item, idx) => {
                const meetingDateObj = getMeetingDateTime(item);
                const timeDiffStr = getTimeDiffText(meetingDateObj);
                const isFirst = idx === 0;

                return (
                  <div
                    key={item._id}
                    className={`bg-[#07192F] border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-xl hover:border-[#C9A96E]/60 ${
                      isFirst 
                        ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-gradient-to-br from-[#07192F] to-[#0E2747]' 
                        : 'border-[#1E3A5F]'
                    }`}
                  >
                    {/* Badge Top Banner */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold rounded-full inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {item.status || 'Reunión Agendada'}
                      </span>
                      <span className="px-3 py-1 bg-[#123254] text-[#C9A96E] border border-[#C9A96E]/30 text-[10px] font-mono font-bold rounded-full">
                        {timeDiffStr}
                      </span>
                    </div>

                    {/* Prospect Details */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-serif font-bold text-white group-hover:text-blue-300 transition">
                            {item.nombre}
                          </h3>
                        </div>
                        <p className="text-xs text-[#94A3B8] font-mono mt-0.5 flex items-center gap-1.5">
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <strong className="text-slate-200">{item.empresa}</strong>
                          {item.cargo && <span>· {item.cargo}</span>}
                        </p>
                      </div>

                      {/* Meeting Time Highlight Box */}
                      <div className="p-4 rounded-2xl bg-[#0E2747] border border-[#1E3A5F] space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Calendar size={14} className="text-sky-400" /> Fecha:
                          </span>
                          <span className="font-bold text-sky-300">{item.meeting_date || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Clock size={14} className="text-emerald-400" /> Horario:
                          </span>
                          <span className="font-bold text-emerald-300">{item.meeting_time ? `${item.meeting_time} hrs` : '10:00 hrs'}</span>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1.5 text-xs font-mono text-slate-300">
                        <div className="flex items-center gap-2 truncate">
                          <Mail size={13} className="text-slate-500 shrink-0" />
                          <a href={`mailto:${item.email}`} className="hover:text-sky-300 truncate">{item.email}</a>
                        </div>
                        {(item.telefono || item.phone) && (
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-slate-500 shrink-0" />
                            <span>{item.telefono || item.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Videocall Link button */}
                      {item.meeting_link ? (
                        <a
                          href={item.meeting_link.startsWith('http') ? item.meeting_link : `https://${item.meeting_link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 px-4 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                        >
                          <Video size={15} />
                          <span>Unirme a Videollamada</span>
                          <ExternalLink size={13} />
                        </a>
                      ) : (
                        <button
                          onClick={() => openScheduleModal(item)}
                          className="w-full py-2.5 px-4 bg-[#123254] hover:bg-[#1A3D68] text-amber-300 border border-amber-500/30 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <Video size={15} />
                          <span>Agregar Enlace Videollamada</span>
                        </button>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-6 pt-4 border-t border-[#1E3A5F] flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedSubmission(item)}
                        className="px-3 py-1.5 bg-[#0E2747] hover:bg-[#123254] text-slate-300 text-[11px] font-mono font-bold rounded-lg border border-[#1E3A5F] flex items-center gap-1 transition cursor-pointer"
                      >
                        <FileText size={12} />
                        <span>Expediente</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openScheduleModal(item)}
                          className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold rounded-lg border border-amber-500/30 flex items-center gap-1 transition cursor-pointer"
                        >
                          <RefreshCw size={12} />
                          <span>Re-agendar</span>
                        </button>
                        <button
                          onClick={() => handleMarkCompleted(item)}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold rounded-lg border border-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
                          title="Marcar como realizada"
                        >
                          <CheckCircle2 size={12} />
                          <span>Completada</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (1 Column Wide): REUNIONES PASADAS & REUNIONES COMPLETADAS ── */}
        <div className="space-y-8">
          
          {/* 1. REUNIONES PASADAS (Pendientes) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="text-amber-400" size={18} />
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                  Reuniones Pasadas
                </h2>
              </div>
              <span className="text-xs font-mono text-amber-400 font-bold">
                {pastMeetings.length} Históricas
              </span>
            </div>

            {pastMeetings.length === 0 ? (
              <div className="p-6 text-center bg-[#07192F] border border-[#1E3A5F] rounded-2xl space-y-1">
                <Clock size={24} className="text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">No hay reuniones pasadas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1.5 custom-scrollbar-gold">
                {pastMeetings.map(item => {
                  const meetingDateObj = getMeetingDateTime(item);
                  const timeDiffStr = getTimeDiffText(meetingDateObj);

                  return (
                    <div
                      key={item._id}
                      className="bg-[#07192F] border border-[#1E3A5F] hover:border-slate-600 p-4 rounded-2xl space-y-2.5 transition shadow-lg opacity-85 hover:opacity-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold rounded-md">
                          {timeDiffStr}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                          {item.meeting_date} · {item.meeting_time || '10:00'} hrs
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white font-mono">{item.nombre}</h4>
                        <p className="text-xs text-slate-400 font-mono">{item.empresa}</p>
                      </div>

                      <div className="pt-2 border-t border-[#1E3A5F]/60 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedSubmission(item)}
                          className="text-[11px] font-mono text-sky-400 hover:text-sky-300 underline cursor-pointer"
                        >
                          Ver Expediente
                        </button>
                        <button
                          onClick={() => handleMarkCompleted(item)}
                          className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer flex items-center gap-1 font-bold"
                        >
                          <CheckCircle2 size={12} />
                          Completada
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. REUNIONES COMPLETADAS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-500/40 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" size={18} />
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                  Reuniones Completadas
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {completedMeetings.length} Realizadas
              </span>
            </div>

            {completedMeetings.length === 0 ? (
              <div className="p-6 text-center bg-[#07192F] border border-[#1E3A5F] rounded-2xl space-y-1">
                <CheckCircle2 size={24} className="text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">No hay reuniones marcadas como completadas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1.5 custom-scrollbar-gold">
                {completedMeetings.map(item => (
                  <div
                    key={item._id}
                    className="bg-[#07192F] border border-emerald-500/30 p-4 rounded-2xl space-y-2.5 transition shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold rounded-md inline-flex items-center gap-1">
                        <CheckCircle2 size={10} />
                        Completada
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {item.meeting_date || 'Fecha N/A'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">{item.nombre}</h4>
                      <p className="text-xs text-slate-400 font-mono">{item.empresa}</p>
                    </div>

                    <div className="pt-2 border-t border-[#1E3A5F]/60 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedSubmission(item)}
                        className="text-[11px] font-mono text-sky-400 hover:text-sky-300 underline cursor-pointer"
                      >
                        Ver Expediente
                      </button>
                      <button
                        onClick={() => openScheduleModal(item)}
                        className="text-[11px] font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        Re-agendar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── MODAL: AGENDAR / REAGENDAR REUNIÓN ── */}
      {scheduleModalSubmission && createPortal(
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#07192F] border border-[#C9A96E]/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-content-in">
            {/* Header */}
            <div className="p-6 bg-[#0E2747] border-b border-[#1E3A5F] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Agendar / Re-agendar Sesión
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    {scheduleModalSubmission.nombre} — {scheduleModalSubmission.empresa}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalSubmission(null)}
                className="w-8 h-8 rounded-lg border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmScheduleMeeting} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold uppercase mb-1.5">
                    📅 Fecha de la Reunión
                  </label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={e => setMeetingDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0E2747] border border-[#1E3A5F] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold uppercase mb-1.5">
                    ⏰ Horario de la Cita
                  </label>
                  <input
                    type="time"
                    required
                    value={meetingTime}
                    onChange={e => setMeetingTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0E2747] border border-[#1E3A5F] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold uppercase mb-1.5">
                    💻 Enlace de la Videollamada (Meet / Teams / Zoom)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/abc-def-ghi"
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0E2747] border border-[#1E3A5F] rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0E2747] border border-[#1E3A5F] space-y-1 text-xs font-mono text-slate-300">
                <p>📧 <strong>Correo Destinatario:</strong> {scheduleModalSubmission.email}</p>
                <p className="text-[11px] text-amber-300 mt-1">
                  ⚡ Al confirmar, se notificará inmediatamente por correo al prospecto con los detalles actualizados.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleModalSubmission(null)}
                  className="flex-1 py-2.5 bg-[#123254] hover:bg-[#1A3D68] text-slate-300 font-mono text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingMeeting}
                  className="flex-1 py-2.5 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-mono text-xs font-bold rounded-xl transition cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {isSavingMeeting ? 'Enviando Correo...' : 'Confirmar y Notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: VER EXPEDIENTE ÚNICO DE DIAGNÓSTICO ── */}
      {selectedSubmission && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-[#07192F] border border-[#1E3A5F] rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 bg-[#0E2747] border-b border-[#1E3A5F] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono text-[#C9A96E] font-bold uppercase tracking-widest block">
                  EXPEDIENTE ÚNICO DE DIAGNÓSTICO
                </span>
                <h3 className="text-lg font-bold text-white font-serif">
                  {selectedSubmission.nombre} — {selectedSubmission.empresa}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-9 h-9 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar-gold">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#0E2747] p-4 rounded-2xl border border-[#1E3A5F]">
                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Health Score</span>
                  <div className="mt-1">
                    {getScoreBadge(selectedSubmission.health_score ?? selectedSubmission.totalScore ?? 0, selectedSubmission.health_classification)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Path Recomendado</span>
                  <span className="text-xs font-mono font-bold text-amber-300 mt-1 block">
                    {selectedSubmission.recommended_path || 'RESCUE'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Email</span>
                  <span className="text-xs font-mono text-slate-200 mt-1 block truncate">{selectedSubmission.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Teléfono</span>
                  <span className="text-xs font-mono text-slate-200 mt-1 block">{selectedSubmission.telefono || selectedSubmission.phone || 'N/A'}</span>
                </div>
              </div>

              {selectedSubmission.meeting_date && (
                <div className="p-4 rounded-2xl bg-[#0E2747] border border-emerald-500/40 space-y-1">
                  <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase">
                    📅 Datos de la Reunión Agendada
                  </h4>
                  <p className="text-xs font-mono text-slate-200">
                    Fecha: <strong>{selectedSubmission.meeting_date}</strong> &nbsp;·&nbsp; Hora: <strong>{selectedSubmission.meeting_time} hrs</strong>
                  </p>
                  {selectedSubmission.meeting_link && (
                    <p className="text-xs font-mono text-sky-300">
                      Enlace: <a href={selectedSubmission.meeting_link} target="_blank" rel="noreferrer" className="underline">{selectedSubmission.meeting_link}</a>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
