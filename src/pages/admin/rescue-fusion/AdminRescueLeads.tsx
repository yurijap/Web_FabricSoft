import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, RefreshCw, Trash2, Eye, Target, Check, CheckCircle2, Minus, Filter, ArrowUpRight, AlertTriangle, ChevronRight, X, FileText, Printer, Download, Mail, Calendar, XCircle, Clock, Link, Send, RotateCcw } from 'lucide-react';
import { useAuthApi } from '../../../config/api';
import { QUESTIONS, ANSWER_OPTIONS, calculateAssessmentResult } from '../../../utils/fusionRescueEngine';

interface AnswerItem {
  questionId: string;
  questionText: string;
  selectedOptionLabel: string;
  score: number;
}

interface SubmissionItem {
  _id: string;
  nombre: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  telefono?: string;
  cargo?: string;
  job_title?: string;
  empresa: string;
  company_name?: string;
  country?: string;
  monto_facturacion?: string;
  revenue?: string;
  escenario?: string;
  health_score?: number;
  totalScore?: number;
  health_classification?: 'OPTIMIZED' | 'STABLE' | 'AT RISK' | 'CRITICAL';
  recommended_path?: 'OPTIMIZE' | 'REMEDIATE' | 'RESCUE' | 'REASSESS';
  review_requested?: boolean;
  contact_preference?: string;
  main_problem?: string;
  problem_description?: string;
  timing?: string;
  process_score?: number;
  finance_score?: number;
  data_score?: number;
  integration_score?: number;
  adoption_score?: number;
  governance_score?: number;
  critical_flags?: string[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  content_id?: string;
  questions_answered_count?: number;
  status?: string;
  answers?: AnswerItem[] | Record<string, any>;
  meeting_date?: string;
  meeting_time?: string;
  meeting_link?: string;
  created_at?: string;
  createdAt: string;
}

export default function AdminRescueLeads() {
  const adminApi = useAuthApi();
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Quick Filters
  const [pathFilter, setPathFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [timingFilter, setTimingFilter] = useState<string>('ALL');
  const [reviewFilter, setReviewFilter] = useState<string>('ALL');

  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [pdfReportSubmission, setPdfReportSubmission] = useState<SubmissionItem | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [showTrashModal, setShowTrashModal] = useState(false);

  const [toast, setToast] = useState<{ title: string; message: string; type: 'emerald' | 'amber' | 'rose' | 'blue' } | null>(null);

  const showToast = (title: string, message: string, type: 'emerald' | 'amber' | 'rose' | 'blue' = 'rose') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    type: 'danger' | 'warning';
    onConfirm: () => void;
  } | null>(null);

  const closeAllModals = () => {
    setSelectedSubmission(null);
    setPdfReportSubmission(null);
    setShowTrashModal(false);
  };

  const handleSendResumeEmail = async (item: SubmissionItem) => {
    if (!item.email) {
      showToast('Sin Correo', 'Este prospecto no cuenta con un correo electrónico registrado.', 'amber');
      return;
    }
    setSendingEmailId(item._id);
    try {
      const res = await adminApi.post('/fusion-rescue/send-resume-email', { leadId: item._id });
      if (res.data && res.data.success) {
        showToast('¡Correo Enviado Exitosamente!', `Se envió el enlace de continuación a ${item.email}.`, 'blue');
      } else {
        showToast('Error de Envío', res.data?.error || 'Desconocido', 'rose');
      }
    } catch (err: any) {
      showToast('Error de Envío', err.response?.data?.error || err.message, 'rose');
    } finally {
      setSendingEmailId(null);
    }
  };

  const getFullDocumentCss = () => {
    let css = '';
    try {
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          Array.from(sheet.cssRules || []).forEach((rule) => {
            css += rule.cssText + '\n';
          });
        } catch (e) {}
      });
    } catch (e) {}
    return css;
  };

  const handlePrintPdf = () => {
    const element = document.getElementById('pdf-report-document');
    if (!element) return;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) return;

    const fullCss = getFullDocumentCss();

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte Fusion Rescue</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: "JetBrains Mono", "Inter", system-ui, -apple-system, sans-serif !important;
              margin: 0;
              padding: 0;
              width: 100%;
            }
            * { box-sizing: border-box; }
            ${fullCss}
            #pdf-report-document {
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              background: #ffffff !important;
              color: #000000 !important;
              padding: 16px !important;
              margin: 0 !important;
            }
          </style>
        </head>
        <body style="background: white !important; color: black !important;">
          <div id="pdf-report-document" style="background: white !important; color: black !important; padding: 16px;">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 1000);
    }, 400);
  };

  const handleDirectPdfDownload = (submission: SubmissionItem) => {
    const element = document.getElementById('pdf-report-document');
    if (!element) return;
    setIsDownloadingPdf(true);

    const cleanName = (submission.empresa || submission.nombre || 'Lead').replace(/[^a-zA-Z0-9_-]/g, '_');
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Reporte-Fusion-Rescue-${cleanName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const executeDownload = () => {
      try {
        (window as any).html2pdf().set(opt).from(element).save().then(() => {
          setIsDownloadingPdf(false);
        }).catch((err: any) => {
          console.error('Error generating PDF:', err);
          setIsDownloadingPdf(false);
          handlePrintPdf();
        });
      } catch (err) {
        console.error(err);
        setIsDownloadingPdf(false);
        handlePrintPdf();
      }
    };

    if ((window as any).html2pdf) {
      executeDownload();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => executeDownload();
      script.onerror = () => {
        setIsDownloadingPdf(false);
        handlePrintPdf();
      };
      document.body.appendChild(script);
    }
  };

  const fetchItems = () => {
    setLoading(true);
    adminApi.get('/fusion-rescue/submissions')
      .then(res => {
        const data = res.data.data ?? [];
        setItems(data);
      })
      .catch((err) => {
        console.error('Error fetching submissions', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Lock body scroll when Expediente or PDF Report modal is open
  useEffect(() => {
    if (selectedSubmission || pdfReportSubmission) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedSubmission, pdfReportSubmission]);

  const [scheduleModalSubmission, setScheduleModalSubmission] = useState<SubmissionItem | null>(null);
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [meetingTime, setMeetingTime] = useState<string>('10:00');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [meetingPin, setMeetingPin] = useState<string>('');
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);

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

  const openScheduleModal = (submission: SubmissionItem) => {
    setScheduleModalSubmission(submission);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMeetingDate(submission.meeting_date || tomorrow.toISOString().split('T')[0]);
    setMeetingTime(submission.meeting_time || '10:00');

    const roomId = submission.roomId || generateAlphaRoomId();
    const pin = submission.pinAcceso || submission.codigoReunion || generateAlphaPin();
    setMeetingPin(pin);
    const guestLink = `${window.location.origin}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${roomId}`;
    setMeetingLink(guestLink);
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

      const roomId = scheduleModalSubmission.roomId || generateAlphaRoomId();
      // MANTENER EL MISMO PIN ORIGINAL AL REAGENDAR
      const originalPin = scheduleModalSubmission.pinAcceso || scheduleModalSubmission.codigoReunion;
      const generatedPin = originalPin || meetingPin || generateAlphaPin();
      const guestLink = `${window.location.origin}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${roomId}`;

      const payload = {
        status: 'Reunión Agendada',
        meeting_date: meetingDate,
        meeting_time: meetingTime,
        meeting_link: guestLink,
        roomId: roomId,
        pinAcceso: generatedPin,
        codigoReunion: generatedPin,
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
        meeting_link: guestLink,
        roomId: roomId,
        pinAcceso: generatedPin,
        codigoReunion: generatedPin,
        meeting_email_sent: true
      } : i));

      if (selectedSubmission?._id === scheduleModalSubmission._id) {
        setSelectedSubmission(prev => prev ? {
          ...prev,
          status: finalStatus,
          meeting_date: meetingDate,
          meeting_time: meetingTime,
          meeting_link: meetingLink,
          meeting_email_sent: true
        } : null);
      }

      const actionWord = isReschedule ? 'Reagendada' : 'Agendada';
      showToast(`¡Reunión ${actionWord}!`, `Se agendó la sesión para ${scheduleModalSubmission.nombre} (${meetingDate} a las ${meetingTime} hrs) y se envió el correo con PIN.`, 'emerald');
      setScheduleModalSubmission(null);
    } catch (err: any) {
      showToast('Error de Agendamiento', err.response?.data?.error || err.message, 'rose');
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const handleDeclineLead = (submission: SubmissionItem) => {
    setConfirmModal({
      isOpen: true,
      title: '🚫 Declinar Solicitud',
      message: `¿Estás seguro de declinar la solicitud de ${submission.nombre} (${submission.empresa})? Se marcará como declinado.`,
      confirmText: 'Sí, Declinar Prospecto',
      type: 'warning',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await adminApi.patch(`/fusion-rescue/submissions/${submission._id}/status`, {
            status: 'Declinado',
            email: submission.email,
            send_meeting_email: false
          });
          setItems(prev => prev.map(i => i._id === submission._id ? { ...i, status: 'Declinado' } : i));
          if (selectedSubmission?._id === submission._id) {
            setSelectedSubmission(prev => prev ? { ...prev, status: 'Declinado' } : null);
          }
          showToast('Prospecto Declinado', `El prospecto ${submission.nombre} (${submission.empresa}) ha sido marcado como Declinado.`, 'amber');
        } catch (err: any) {
          showToast('Error al Declinar', err.response?.data?.error || err.message, 'rose');
        }
      }
    });
  };

  const handleSoftDelete = (submission: SubmissionItem) => {
    setConfirmModal({
      isOpen: true,
      title: '🗑️ Mover al Basurero',
      message: `¿Estás seguro de mover a ${submission.nombre} (${submission.empresa}) al basurero? Podrás recuperarlo en cualquier momento desde el botón Basurero.`,
      confirmText: 'Mover al Basurero',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        setSaving(true);
        try {
          await adminApi.delete(`/fusion-rescue/submissions/${submission._id}`, { data: { email: submission.email } });
          setItems(prev => prev.map(i => i._id === submission._id ? { ...i, status: 'trash' } : i));
          if (selectedSubmission?._id === submission._id) {
            setSelectedSubmission(null);
          }
          showToast('Movido al Basurero 🗑️', `El prospecto ${submission.nombre} (${submission.empresa}) ha sido movido a la Papelera.`, 'rose');
        } catch (err: any) {
          showToast('Error al Eliminar', err.response?.data?.error || err.message, 'rose');
        } finally {
          setSaving(false);
        }
      }
    });
  };

  const handleRestoreFromTrash = async (submission: SubmissionItem) => {
    try {
      const res = await adminApi.patch(`/fusion-rescue/submissions/${submission._id}/restore`, { email: submission.email });
      const updatedData = res.data?.data;
      const restoredStatus = updatedData?.status || ((submission.questions_answered_count !== undefined && submission.questions_answered_count >= 25) ? 'Completado' : 'Incompleto');
      
      setItems(prev => prev.map(i => i._id === submission._id ? { ...i, status: restoredStatus } : i));
      showToast('⚡ Prospecto Restaurado', `El prospecto ${submission.nombre} (${submission.empresa}) fue recuperado exitosamente del basurero.`, 'emerald');
    } catch (err: any) {
      showToast('Error al Restaurar', err.response?.data?.error || err.message, 'rose');
    }
  };

  const handlePermanentDelete = (submission: SubmissionItem) => {
    setConfirmModal({
      isOpen: true,
      title: '⚠️ Eliminar Definitivamente',
      message: `ATENCIÓN: ¿Deseas eliminar DEFINITIVAMENTE a ${submission.nombre} (${submission.empresa}) de la base de datos MongoDB Atlas? Esta acción NO se puede deshacer.`,
      confirmText: 'Sí, Eliminar Definitivamente',
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await adminApi.delete(`/fusion-rescue/submissions/${submission._id}/permanent`, { data: { email: submission.email } });
          setItems(prev => prev.filter(i => i._id !== submission._id));
          showToast('❌ Eliminación Permanente', `El prospecto ${submission.nombre} fue eliminado definitivamente de la base de datos.`, 'rose');
        } catch (err: any) {
          showToast('Error al Eliminar', err.response?.data?.error || err.message, 'rose');
        }
      }
    });
  };

  const activeItems = items.filter(i => i.status !== 'trash' && i.status !== 'Basurero');
  const trashItems = items.filter(i => i.status === 'trash' || i.status === 'Basurero');

  const filteredItems = activeItems.filter(i => {
    // Search
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchSearch = (
        (i.nombre || '').toLowerCase().includes(term) ||
        (i.empresa || '').toLowerCase().includes(term) ||
        (i.email || '').toLowerCase().includes(term) ||
        (i.cargo || i.job_title || '').toLowerCase().includes(term) ||
        (i.country || '').toLowerCase().includes(term) ||
        (i.monto_facturacion || i.revenue || '').toLowerCase().includes(term)
      );
      if (!matchSearch) return false;
    }

    // Path Filter
    if (pathFilter !== 'ALL' && i.recommended_path !== pathFilter) {
      return false;
    }

    // Status / Classification Filter
    if (statusFilter !== 'ALL' && i.health_classification !== statusFilter) {
      return false;
    }

    // Timing Filter
    if (timingFilter !== 'ALL' && i.timing !== timingFilter) {
      return false;
    }

    // Review Requested Filter
    if (reviewFilter === 'YES' && !i.review_requested) return false;
    if (reviewFilter === 'NO' && i.review_requested) return false;

    return true;
  });

  const getScoreBadge = (score: number, classification?: string) => {
    const cls = classification || (score >= 85 ? 'OPTIMIZED' : score >= 70 ? 'STABLE' : score >= 50 ? 'AT RISK' : 'CRITICAL');
    if (cls === 'OPTIMIZED') {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {score}/100 · Optimizado
        </span>
      );
    }
    if (cls === 'STABLE') {
      return (
        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          {score}/100 · Estable
        </span>
      );
    }
    if (cls === 'AT RISK') {
      return (
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {score}/100 · At Risk
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
        {score}/100 · Critical
      </span>
    );
  };

  const getPathBadge = (path?: string) => {
    const p = path || 'RESCUE';
    const colorMap: Record<string, string> = {
      OPTIMIZE: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
      REMEDIATE: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
      RESCUE: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
      REASSESS: 'bg-red-950/60 border-red-500/40 text-red-300',
    };
    return (
      <span className={`px-2.5 py-1 border text-[10px] font-mono font-extrabold uppercase tracking-wider rounded-md ${colorMap[p] || colorMap.RESCUE}`}>
        {p}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white font-sans pb-16">
      {/* Header */}
      <div className="p-6 md:p-8 bg-[var(--bg-base)] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <Target size={13} /> FABRIC · CONTENT-TO-PIPELINE ENGINE · LEADS
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Leads Fusion Rescue
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Bandeja de entrada principal de prospectos ejecutivos evaluados en el Fusion Health Check™.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[var(--bg-panel)] border border-[#1E3A5F] px-5 py-2.5 rounded-2xl shadow-md shrink-0">
            <div className="text-center px-3 border-r border-[#1E3A5F]">
              <div className="font-serif text-2xl font-bold leading-none text-[#C9A96E]">
                {items.length}
              </div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Leads Totales</div>
            </div>
            <div className="text-center px-3">
              <div className="font-serif text-2xl font-bold leading-none text-emerald-400">
                {items.filter(i => i.review_requested).length}
              </div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Revisiones 30m</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Quick Filters Bar */}
        <div className="bg-[#0E2747] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg space-y-3">
          {/* Row 1: Search Input (Full Width - Zero Truncation) */}
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, cargo, empresa, país..."
              className="w-full pl-10 pr-8 py-2.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E] transition shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Row 2: 6 Filter Controls in Equal Aligned Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {/* Path Filter */}
            <div className="flex items-center justify-between gap-2 bg-[#07192F] border border-[#1E3A5F] px-3 py-2 rounded-xl hover:border-[#C9A96E]/50 transition">
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter size={12} className="text-[#C9A96E]" />
                <span className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold">Path</span>
              </div>
              <select
                value={pathFilter}
                onChange={e => setPathFilter(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer text-right min-w-0 flex-1"
              >
                <option value="ALL" className="bg-[#0E2747]">Todos</option>
                <option value="OPTIMIZE" className="bg-[#0E2747]">OPTIMIZE</option>
                <option value="REMEDIATE" className="bg-[#0E2747]">REMEDIATE</option>
                <option value="RESCUE" className="bg-[#0E2747]">RESCUE</option>
                <option value="REASSESS" className="bg-[#0E2747]">REASSESS</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center justify-between gap-2 bg-[#07192F] border border-[#1E3A5F] px-3 py-2 rounded-xl hover:border-[#C9A96E]/50 transition">
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold shrink-0">Estado</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer text-right min-w-0 flex-1"
              >
                <option value="ALL" className="bg-[#0E2747]">Todos</option>
                <option value="OPTIMIZED" className="bg-[#0E2747]">Optimizado</option>
                <option value="STABLE" className="bg-[#0E2747]">Estable</option>
                <option value="AT RISK" className="bg-[#0E2747]">At Risk</option>
                <option value="CRITICAL" className="bg-[#0E2747]">Critical</option>
              </select>
            </div>

            {/* Timing Filter */}
            <div className="flex items-center justify-between gap-2 bg-[#07192F] border border-[#1E3A5F] px-3 py-2 rounded-xl hover:border-[#C9A96E]/50 transition">
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold shrink-0">Timing</span>
              <select
                value={timingFilter}
                onChange={e => setTimingFilter(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer text-right min-w-0 flex-1"
              >
                <option value="ALL" className="bg-[#0E2747]">Todos</option>
                <option value="Lo antes posible (Urgente)" className="bg-[#0E2747]">Urgente</option>
                <option value="En los próximos 3 meses" className="bg-[#0E2747]">3 meses</option>
                <option value="En los próximos 6 meses" className="bg-[#0E2747]">6 meses</option>
                <option value="Sólo evaluando opciones" className="bg-[#0E2747]">Evaluando</option>
              </select>
            </div>

            {/* Review Requested Filter */}
            <div className="flex items-center justify-between gap-2 bg-[#07192F] border border-[#1E3A5F] px-3 py-2 rounded-xl hover:border-[#C9A96E]/50 transition">
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold shrink-0">¿Revisión?</span>
              <select
                value={reviewFilter}
                onChange={e => setReviewFilter(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer text-right min-w-0 flex-1"
              >
                <option value="ALL" className="bg-[#0E2747]">Todos</option>
                <option value="YES" className="bg-[#0E2747]">Sí Solicitó</option>
                <option value="NO" className="bg-[#0E2747]">Sólo Resultado</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchItems}
              className="w-full h-full min-h-[38px] px-3 py-2 bg-[#07192F] hover:bg-[#123254] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] hover:text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refrescar</span>
            </button>

            {/* Trash / Basurero Button */}
            <button
              onClick={() => setShowTrashModal(true)}
              className="w-full h-full min-h-[38px] px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 hover:border-rose-400 text-rose-300 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Ver prospectos eliminados en el basurero y recuperarlos"
            >
              <Trash2 size={13} />
              <span>Basurero ({trashItems.length})</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-2xl border border-[#1E3A5F] bg-[var(--bg-panel)] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] bg-[#07192F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#C9A96E]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Bandeja de Prospectos ({filteredItems.length})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px] overflow-y-auto custom-scrollbar-gold">
            {loading ? (
              <div className="p-12 text-center font-mono text-xs text-[#94A3B8] tracking-widest">
                Cargando leads desde MongoDB Atlas...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Target size={32} className="mx-auto text-[#1E3A5F]" />
                <div className="font-serif text-base font-bold text-white">Sin prospectos con los filtros actuales</div>
                <p className="text-xs text-[#94A3B8] font-mono max-w-sm mx-auto">
                  Ajusta la búsqueda o los filtros superiores para ver otros registros.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#07192F] z-10 border-b border-[#1E3A5F]">
                  <tr className="font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Fecha / Hora</th>
                    <th className="py-3.5 px-5">Nombre y Cargo</th>
                    <th className="py-3.5 px-5">Facturación</th>
                    <th className="py-3.5 px-5">Empresa y País</th>
                    <th className="py-3.5 px-5">Estado / Progreso</th>
                    <th className="py-3.5 px-5">Health Score</th>
                    <th className="py-3.5 px-5">Recommended Path</th>
                    <th className="py-3.5 px-5 text-center">¿Solicitó Revisión?</th>
                    <th className="py-3.5 px-5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60 text-xs">
                  {filteredItems.map(item => {
                    const dateStr = new Date(item.createdAt).toLocaleString('es-MX', {
                      timeZone: 'America/Mexico_City',
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    });
                    const score = item.health_score ?? item.totalScore ?? 0;
                    const cargo = item.cargo || item.job_title || 'Ejecutivo';
                    const pais = item.country || 'México';
                    const facturacion = item.monto_facturacion || item.revenue || 'No especificado';
                    const answered = item.questions_answered_count ?? (item.answers ? Object.keys(item.answers).length : 0);
                    const isDone = item.status === 'Preguntas Respondidas' || item.status === 'Completado' || answered === 25;

                    return (
                      <tr
                        key={item._id}
                        onClick={() => setSelectedSubmission(item)}
                        className="hover:bg-[var(--bg-elevated)] transition cursor-pointer group"
                      >
                        <td className="py-4 px-5 font-mono text-[#94A3B8]">
                          {dateStr}
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-bold text-white group-hover:text-blue-300 transition-colors">
                            {item.nombre}
                          </div>
                          <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                            {cargo}
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-xs font-bold text-[#C9A96E]">
                          {facturacion}
                        </td>
                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-200">
                            {item.empresa}
                          </div>
                          <div className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                            {pais}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {isDone ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold rounded-md inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Respondidas ({answered}/25)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold rounded-md inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Incompleto ({answered}/25)
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          {getScoreBadge(score, item.health_classification)}
                        </td>
                        <td className="py-4 px-5">
                          {getPathBadge(item.recommended_path)}
                        </td>
                        <td className="py-4 px-5 text-center">
                          {item.review_requested ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400" title="Solicitó sesión de revisión de 30 min">
                              <Check size={14} strokeWidth={2.5} />
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold" title="Sólo visualizó/descargó el resultado">
                              -
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {((item.questions_answered_count !== undefined && item.questions_answered_count < 25) || (item.status !== 'Completado' && item.status !== 'Preguntas Respondidas')) && (
                              <button
                                onClick={() => handleSendResumeEmail(item)}
                                disabled={sendingEmailId === item._id}
                                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400 font-mono text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                                title="Enviar correo con el link personalizado para continuar el formulario en donde se quedó"
                              >
                                <Mail size={13} className={sendingEmailId === item._id ? 'animate-bounce' : ''} />
                                <span>{sendingEmailId === item._id ? 'Enviando...' : 'Enviar Link'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => setPdfReportSubmission(item)}
                              className="px-3 py-1.5 bg-[#07192F] hover:bg-[#0E2747] text-[#C9A96E] hover:text-white border border-[#C9A96E]/40 hover:border-[#FFE8A3] font-mono text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                              title="Generar Vista Previa del Reporte PDF"
                            >
                              <Printer size={13} />
                              <span>Generar Reporte</span>
                            </button>
                            <button
                              onClick={() => setSelectedSubmission(item)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>Ver Expediente</span>
                            </button>
                            <button
                               onClick={() => handleSoftDelete(item)}
                               disabled={saving}
                               className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10 cursor-pointer"
                               title="Mover expediente al basurero"
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

      {/* Expediente Modal / Drawer (Rendered via React Portal at document.body for absolute viewport centering) */}
      {selectedSubmission && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAllModals();
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999999] flex items-center justify-center p-4 md:p-6 overflow-y-auto"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[82vh] bg-[#0E2747] border border-[#C9A96E]/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn shrink-0"
          >
            {/* Header Expediente */}
            <div className="p-5 md:p-6 border-b border-[#1E3A5F] flex justify-between items-center bg-[#07192F] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono">
                  FR
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#C9A96E] font-bold uppercase tracking-widest block">
                    EXPEDIENTE ÚNICO DE DIAGNÓSTICO
                  </span>
                  <h3 className="text-lg font-bold text-white font-serif">
                    {selectedSubmission.nombre} — {selectedSubmission.empresa}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const sub = selectedSubmission;
                    setSelectedSubmission(null);
                    setPdfReportSubmission(sub);
                  }}
                  className="px-3.5 py-2 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Printer size={14} />
                  <span>Generar Reporte PDF</span>
                </button>
                <button
                  onClick={closeAllModals}
                  className="w-9 h-9 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar-gold">
              {/* Action Banner for scheduled meetings or 30-min review requests */}
              {selectedSubmission.meeting_date || selectedSubmission.status === 'Reunión Enviada' || selectedSubmission.status === 'Reunión Agendada' ? (
                <div className="p-5 rounded-2xl bg-[#07192F] border border-emerald-500/50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      <Check size={24} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                          Reunión Técnica Agendada & Enviada por Correo
                        </h4>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-500/40">
                          {selectedSubmission.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono">
                        📅 <strong>Fecha:</strong> {selectedSubmission.meeting_date} &nbsp;·&nbsp; ⏰ <strong>Hora:</strong> {selectedSubmission.meeting_time} hrs
                      </p>
                      {selectedSubmission.meeting_link && (
                        <p className="text-xs font-mono text-emerald-400 truncate">
                          💻 <strong>Enlace:</strong> <a href={selectedSubmission.meeting_link} target="_blank" rel="noreferrer" className="underline hover:text-emerald-300">{selectedSubmission.meeting_link}</a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedSubmission.review_requested ? (
                <div className="p-4 rounded-2xl bg-[#07192F] border border-[#C9A96E]/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                        Solicitud de Revisión de 30 Minutos Activa
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        El prospecto {selectedSubmission.nombre} solicitó una sesión ejecutiva directa con el equipo técnico.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                    <button
                      onClick={() => openScheduleModal(selectedSubmission)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
                    >
                      <Calendar size={14} />
                      <span>Agendar y Enviar Correo</span>
                    </button>
                    <button
                      onClick={() => handleDeclineLead(selectedSubmission)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg"
                    >
                      <XCircle size={14} />
                      <span>Declinar</span>
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#07192F] border border-[#1E3A5F] p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Health Score</span>
                  <div className="mt-1">
                    {getScoreBadge(selectedSubmission.health_score ?? selectedSubmission.totalScore ?? 0, selectedSubmission.health_classification)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Path Recomendado</span>
                  <div className="mt-1">
                    {getPathBadge(selectedSubmission.recommended_path)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">¿Solicitó Revisión?</span>
                  <div className="mt-1 font-mono text-sm font-bold text-white">
                    {selectedSubmission.review_requested ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Check size={16} /> Sí (30 min)
                      </span>
                    ) : (
                      <span className="text-slate-400">Sólo resultado</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">Timing Indicado</span>
                  <div className="mt-1 font-mono text-sm font-bold text-amber-400">
                    {selectedSubmission.timing || 'No especificado'}
                  </div>
                </div>
              </div>

              {/* Datos de Contacto y Atribución */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prospect Contact */}
                <div className="p-6 rounded-2xl bg-[#07192F] border border-[#1E3A5F] space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider">
                    Información del Prospecto
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">Nombre:</span>
                      <span className="text-white font-bold">{selectedSubmission.nombre}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">Email:</span>
                      <span className="text-blue-300 font-bold">{selectedSubmission.email}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">Teléfono:</span>
                      <span className="text-white">{selectedSubmission.phone || selectedSubmission.telefono || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">Cargo:</span>
                      <span className="text-white">{selectedSubmission.cargo || selectedSubmission.job_title}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">Empresa:</span>
                      <span className="text-white">{selectedSubmission.empresa}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">País:</span>
                      <span className="text-white">{selectedSubmission.country || 'México'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">Solución Oracle:</span>
                      <span className="text-blue-300">{selectedSubmission.fusion_products || selectedSubmission.solution || 'Oracle Fusion Cloud ERP'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">Antigüedad Go-Live:</span>
                      <span className="text-white">{selectedSubmission.go_live_age || '1-2 años'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Monto de Facturación:</span>
                      <span className="text-[#C9A96E] font-bold">{selectedSubmission.monto_facturacion || selectedSubmission.revenue || 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                {/* Attribution & Marketing UTMs */}
                <div className="p-6 rounded-2xl bg-[#07192F] border border-[#1E3A5F] space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider">
                    Atribución & Marketing (UTMs)
                  </h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">utm_source:</span>
                      <span className="text-amber-400 font-bold">{selectedSubmission.utm_source || 'direct'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">utm_medium:</span>
                      <span className="text-white">{selectedSubmission.utm_medium || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">utm_campaign:</span>
                      <span className="text-white">{selectedSubmission.utm_campaign || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#1E3A5F]/60 pb-1.5">
                      <span className="text-[#94A3B8]">Content ID:</span>
                      <span className="text-blue-400 font-bold">{selectedSubmission.content_id || selectedSubmission.utm_content || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Preferencia Contacto:</span>
                      <span className="text-white">{selectedSubmission.contact_preference || 'Email'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preguntas Complementarias: Problema Principal & Timing */}
              <div className="p-6 rounded-2xl bg-[#07192F] border border-[#C9A96E]/30 space-y-3">
                <h4 className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider">
                  Preguntas Complementarias (Problema & Prioridad)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3.5 bg-[#0E2747] border border-[#1E3A5F] rounded-xl">
                    <span className="text-[10px] text-[#94A3B8] uppercase block mb-1">Problema Principal a Resolver</span>
                    <span className="text-sm font-bold text-amber-400 block">
                      {selectedSubmission.problema_principal || selectedSubmission.main_problem || 'No especificado'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-[#0E2747] border border-[#1E3A5F] rounded-xl">
                    <span className="text-[10px] text-[#94A3B8] uppercase block mb-1">Timing / Prioridad de Atención</span>
                    <span className="text-sm font-bold text-emerald-400 block">
                      {selectedSubmission.timing_prioridad || selectedSubmission.timing || 'No especificado'}
                    </span>
                  </div>
                </div>
                {(selectedSubmission.descripcion_problema || selectedSubmission.problem_description) && (
                  <div className="p-3.5 bg-[#0E2747] border border-[#1E3A5F] rounded-xl text-xs font-mono">
                    <span className="text-[10px] text-[#94A3B8] uppercase block mb-1">Descripción del Problema (Detalle)</span>
                    <p className="text-slate-200 font-sans leading-relaxed text-xs">
                      {selectedSubmission.descripcion_problema || selectedSubmission.problem_description}
                    </p>
                  </div>
                )}
              </div>

              {/* Scores por 6 Dimensiones */}
              {(() => {
                const answersMap = (selectedSubmission.answers && typeof selectedSubmission.answers === 'object' && !Array.isArray(selectedSubmission.answers))
                  ? selectedSubmission.answers
                  : {};
                const hasAnswers = Object.keys(answersMap).length > 0;
                const computed = hasAnswers ? calculateAssessmentResult(answersMap as any) : null;
                const dims = computed?.dimensionResults;

                const pScore = hasAnswers ? ((selectedSubmission.process_score && selectedSubmission.process_score > 0) ? selectedSubmission.process_score : (dims?.procesos?.score ?? 0)) : 0;
                const fScore = hasAnswers ? ((selectedSubmission.finance_score && selectedSubmission.finance_score > 0) ? selectedSubmission.finance_score : (dims?.finanzas?.score ?? 0)) : 0;
                const dScore = hasAnswers ? ((selectedSubmission.data_score && selectedSubmission.data_score > 0) ? selectedSubmission.data_score : (dims?.datos?.score ?? 0)) : 0;
                const iScore = hasAnswers ? ((selectedSubmission.integration_score && selectedSubmission.integration_score > 0) ? selectedSubmission.integration_score : (dims?.integraciones?.score ?? 0)) : 0;
                const aScore = hasAnswers ? ((selectedSubmission.adoption_score && selectedSubmission.adoption_score > 0) ? selectedSubmission.adoption_score : (dims?.adopcion?.score ?? 0)) : 0;
                const gScore = hasAnswers ? ((selectedSubmission.governance_score && selectedSubmission.governance_score > 0) ? selectedSubmission.governance_score : (dims?.governance?.score ?? 0)) : 0;

                return (
                  <div className="p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[#1E3A5F] space-y-4">
                    <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      Resultados por 6 Dimensiones
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
                      <div className="p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl">
                        <span className="text-[10px] text-[#94A3B8] block">1. Procesos</span>
                        <span className="text-base font-bold text-blue-400">{pScore} pts</span>
                      </div>
                      <div className="p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl">
                        <span className="text-[10px] text-[#94A3B8] block">2. Finanzas</span>
                        <span className="text-base font-bold text-emerald-400">{fScore} pts</span>
                      </div>
                      <div className="p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl">
                        <span className="text-[10px] text-[#94A3B8] block">3. Datos</span>
                        <span className="text-base font-bold text-indigo-400">{dScore} pts</span>
                      </div>
                      <div className="p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl">
                        <span className="text-[10px] text-[#94A3B8] block">4. Integraciones</span>
                        <span className="text-base font-bold text-purple-400">{iScore} pts</span>
                      </div>
                      <div className="p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl">
                        <span className="text-[10px] text-[#94A3B8] block">5. Adopción</span>
                        <span className="text-base font-bold text-amber-400">{aScore} pts</span>
                      </div>
                      <div className="p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl">
                        <span className="text-[10px] text-[#94A3B8] block">6. Governance</span>
                        <span className="text-base font-bold text-rose-400">{gScore} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Causa Raíz & Problema Declarado */}
              {selectedSubmission.problem_description && (
                <div className="p-6 rounded-2xl bg-[#07192F] border border-[#1E3A5F] space-y-2">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    Problema Declarado por el Prospecto
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{selectedSubmission.problem_description}"
                  </p>
                </div>
              )}

              {/* Critical Flags */}
              {selectedSubmission.critical_flags && selectedSubmission.critical_flags.length > 0 && (
                <div className="p-6 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-3">
                  <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={15} /> Banderas Críticas Detectadas ({selectedSubmission.critical_flags.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubmission.critical_flags.map((flag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono rounded-lg">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalle de Preguntas & Respuestas (Progreso Detallado) */}
              <div className="p-6 rounded-2xl bg-[#07192F] border border-[#1E3A5F] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
                  <h4 className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider flex items-center gap-2">
                    <FileText size={15} /> Detalle de Preguntas & Respuestas ({selectedSubmission.questions_answered_count ?? (selectedSubmission.answers ? Object.keys(selectedSubmission.answers).length : 0)} / 25)
                  </h4>
                  <span className="text-xs font-mono font-bold text-[#94A3B8] px-3 py-1 bg-[#123254] border border-[#1E3A5F] rounded-lg">
                    {selectedSubmission.status || 'Incompleto'}
                  </span>
                </div>

                <div className="space-y-4 font-mono text-xs max-h-96 overflow-y-auto pr-2 custom-scrollbar-gold">
                  {QUESTIONS.map((q) => {
                    const userAnsVal = selectedSubmission.answers ? selectedSubmission.answers[q.id] : undefined;
                    const optionObj = ANSWER_OPTIONS.find((opt) => opt.value === userAnsVal);
                    const isAnswered = !!userAnsVal;

                    return (
                      <div 
                        key={q.id} 
                        className={`p-4 rounded-xl border transition-all ${
                          isAnswered 
                            ? 'bg-[#0E2747]/90 border-[#1E3A5F]' 
                            : 'bg-slate-950/30 border-slate-900/50 opacity-50'
                        }`}
                      >
                        {/* Pregunta */}
                        <div className="text-slate-200 font-sans font-semibold text-xs leading-relaxed flex items-start gap-2.5 mb-2">
                          <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 font-mono text-[10px] font-bold shrink-0 mt-0.5 border border-blue-500/30">
                            P{q.number < 10 ? `0${q.number}` : q.number}
                          </span>
                          <span className="flex-1">{q.text}</span>
                        </div>

                        {/* Respuesta */}
                        <div className="pl-9 pt-1.5 border-t border-[#1E3A5F]/50 flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider">Respuesta:</span>
                          {isAnswered ? (
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold font-mono ${
                              userAnsVal === 'no' || userAnsVal === 'mayormente_no' 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                                : userAnsVal === 'si' || userAnsVal === 'mayormente_si'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {optionObj ? optionObj.label : userAnsVal}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-mono italic text-[11px]">
                              (Sin responder aún)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#1E3A5F] bg-[#07192F] flex justify-end gap-3 shrink-0">
              <button
                onClick={closeAllModals}
                className="px-6 py-2.5 border border-[#1E3A5F] text-[#94A3B8] hover:text-white font-mono text-xs rounded-xl cursor-pointer transition"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PDF Report Preview Modal (Rendered via React Portal at document.body for print-ready vector PDF view) */}
      {pdfReportSubmission && createPortal(
        <div 
          onClick={closeAllModals}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[999999] flex flex-col items-center justify-start p-2 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static"
        >
          {/* Floating Action Header Bar (Hidden during print) */}
          <div 
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl bg-[#0E2747] border border-[#C9A96E]/50 rounded-2xl p-4 mb-4 flex justify-between items-center shadow-2xl print:hidden shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#C9A96E]/20 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center font-bold font-mono">
                <Printer size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#C9A96E] font-bold uppercase tracking-widest block">
                  VISTA PREVIA DEL REPORTE PDF
                </span>
                <h3 className="text-sm font-bold text-white font-serif">
                  {pdfReportSubmission.nombre} — {pdfReportSubmission.empresa}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDirectPdfDownload(pdfReportSubmission)}
                disabled={isDownloadingPdf}
                className="px-5 py-2.5 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-mono text-xs font-extrabold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Download size={15} className={isDownloadingPdf ? 'animate-bounce' : ''} />
                <span>{isDownloadingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
              </button>
              <button
                onClick={closeAllModals}
                className="w-9 h-9 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Printable White PDF Document Sheet */}
          <div
            onClick={e => e.stopPropagation()}
            id="pdf-report-document"
            className="w-full max-w-4xl bg-white text-black rounded-lg shadow-2xl p-8 sm:p-12 space-y-8 font-sans print:max-w-none print:w-full print:p-0 print:shadow-none print:rounded-none shrink-0"
          >
            {/* Header Document Banner */}
            <div className="border-b-2 border-black pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-black text-black uppercase tracking-widest mb-1">
                  <span>FABRIC SOFT MÉXICO</span>
                  <span>•</span>
                  <span>PREMIUM DIAGNOSTIC SERVICES</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight" style={{ color: '#000000', fontWeight: 900 }}>
                  REPORTE DE DIAGNÓSTICO FUSION RESCUE™
                </h1>
                <p className="text-xs text-black font-mono font-bold mt-1">
                  Evaluación de Salud Operativa, Técnica y Financiera de Entorno Oracle Fusion
                </p>
              </div>

              <div className="text-left sm:text-right font-mono text-xs text-black bg-slate-100 border border-black p-3 rounded-lg">
                <div><strong className="text-black">FECHA:</strong> {new Date(pdfReportSubmission.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div><strong className="text-black">EXPEDIENTE ID:</strong> #{pdfReportSubmission._id.slice(-8).toUpperCase()}</div>
                <div><strong className="text-black">ESTADO:</strong> {pdfReportSubmission.status || 'Completado'}</div>
              </div>
            </div>

            {/* SECCIÓN 1: DATOS DEL USUARIO / PROSPECTO */}
            <div className="bg-slate-50 border border-black rounded-xl p-6 space-y-4">
              <h2 className="text-xs font-mono font-black text-black uppercase tracking-wider border-b border-black pb-2">
                1. Datos del Usuario & Información de Contacto
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">Nombre Completo</span>
                  <span className="font-black text-black text-sm">{pdfReportSubmission.nombre} {pdfReportSubmission.last_name || ''}</span>
                </div>
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">Correo Corporativo</span>
                  <span className="font-black text-black">{pdfReportSubmission.email}</span>
                </div>
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">Teléfono</span>
                  <span className="font-black text-black">{pdfReportSubmission.telefono || pdfReportSubmission.phone || 'No especificado'}</span>
                </div>
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">Cargo / Rol</span>
                  <span className="font-black text-black">{pdfReportSubmission.cargo || pdfReportSubmission.job_title || 'No especificado'}</span>
                </div>
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">Empresa</span>
                  <span className="font-black text-black">{pdfReportSubmission.empresa}</span>
                </div>
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">País</span>
                  <span className="font-black text-black">{pdfReportSubmission.country || 'México'}</span>
                </div>
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">Solución Oracle</span>
                  <span className="font-black text-black">{pdfReportSubmission.fusion_products || 'Oracle Fusion Cloud ERP'}</span>
                </div>
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">Antigüedad Go-Live</span>
                  <span className="font-black text-black">{pdfReportSubmission.go_live_age || '1-2 años'}</span>
                </div>
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">Monto de Facturación</span>
                  <span className="font-black text-black">{pdfReportSubmission.monto_facturacion || pdfReportSubmission.revenue || 'No especificado'}</span>
                </div>
                <div>
                  <span className="text-black block text-[10px] uppercase font-bold">Origen Traffic (UTM)</span>
                  <span className="font-black text-black">{pdfReportSubmission.utm_source || 'direct'}</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: RESUMEN EJECUTIVO DE RESULTADOS */}
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-black text-black uppercase tracking-wider border-b border-black pb-2">
                2. Resumen Ejecutivo de Diagnóstico
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-100 border-2 border-black text-black rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-black uppercase font-bold">Fusion Health Score</span>
                  <div className="text-3xl font-black font-mono text-black my-1">
                    {pdfReportSubmission.health_score ?? pdfReportSubmission.totalScore ?? 0} / 100
                  </div>
                  <span className="text-xs font-mono font-black text-black">
                    Clasificación: {pdfReportSubmission.health_classification || 'AT RISK'}
                  </span>
                </div>

                <div className="p-4 bg-slate-100 border-2 border-black text-black rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-black uppercase font-bold">Ruta Recomendada</span>
                  <div className="text-xl font-black font-mono text-black my-1">
                    {pdfReportSubmission.recommended_path || 'RESCUE'}
                  </div>
                  <span className="text-xs font-sans font-bold text-black">
                    Intervención recomendada
                  </span>
                </div>

                <div className="p-4 bg-slate-100 border-2 border-black text-black rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-black uppercase font-bold">Urgencia / Prioridad</span>
                  <div className="text-sm font-black font-mono text-black my-1">
                    {pdfReportSubmission.timing_prioridad || pdfReportSubmission.timing || 'En 3 meses'}
                  </div>
                  <span className="text-xs font-sans font-bold text-black">
                    Ventana de atención sugerida
                  </span>
                </div>
              </div>

              {(pdfReportSubmission.problema_principal || pdfReportSubmission.main_problem) && (
                <div className="p-4 bg-slate-50 border border-black rounded-xl text-xs font-mono space-y-1">
                  <span className="text-black font-black uppercase text-[10px]">Problema Principal Declarado:</span>
                  <div className="font-black text-black text-sm">
                    {pdfReportSubmission.problema_principal || pdfReportSubmission.main_problem}
                  </div>
                  {(pdfReportSubmission.descripcion_problema || pdfReportSubmission.problem_description) && (
                    <p className="text-black font-sans font-medium mt-2 text-xs leading-relaxed italic">
                      "{pdfReportSubmission.descripcion_problema || pdfReportSubmission.problem_description}"
                    </p>
                  )}
                </div>
              )}

              {/* Scores por 6 Dimensiones Table */}
              {(() => {
                const answersMap = (pdfReportSubmission.answers && typeof pdfReportSubmission.answers === 'object' && !Array.isArray(pdfReportSubmission.answers))
                  ? pdfReportSubmission.answers
                  : {};
                const hasAnswers = Object.keys(answersMap).length > 0;
                const computed = hasAnswers ? calculateAssessmentResult(answersMap as any) : null;
                const dims = computed?.dimensionResults;

                const pScore = hasAnswers ? ((pdfReportSubmission.process_score && pdfReportSubmission.process_score > 0) ? pdfReportSubmission.process_score : (dims?.procesos?.score ?? 0)) : 0;
                const fScore = hasAnswers ? ((pdfReportSubmission.finance_score && pdfReportSubmission.finance_score > 0) ? pdfReportSubmission.finance_score : (dims?.finanzas?.score ?? 0)) : 0;
                const dScore = hasAnswers ? ((pdfReportSubmission.data_score && pdfReportSubmission.data_score > 0) ? pdfReportSubmission.data_score : (dims?.datos?.score ?? 0)) : 0;
                const iScore = hasAnswers ? ((pdfReportSubmission.integration_score && pdfReportSubmission.integration_score > 0) ? pdfReportSubmission.integration_score : (dims?.integraciones?.score ?? 0)) : 0;
                const aScore = hasAnswers ? ((pdfReportSubmission.adoption_score && pdfReportSubmission.adoption_score > 0) ? pdfReportSubmission.adoption_score : (dims?.adopcion?.score ?? 0)) : 0;
                const gScore = hasAnswers ? ((pdfReportSubmission.governance_score && pdfReportSubmission.governance_score > 0) ? pdfReportSubmission.governance_score : (dims?.governance?.score ?? 0)) : 0;

                return (
                  <div className="border border-black rounded-xl overflow-hidden text-xs">
                    <div className="bg-slate-200 px-4 py-2 font-mono font-black text-black uppercase tracking-wider text-[11px] border-b border-black">
                      Puntajes Obtenidos por 6 Dimensiones
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-black font-mono text-center">
                      <div className="p-3">
                        <span className="text-[10px] text-black font-bold block">PROCESOS</span>
                        <span className="font-black text-black text-sm">{pScore} pts</span>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] text-black font-bold block">FINANZAS</span>
                        <span className="font-black text-black text-sm">{fScore} pts</span>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] text-black font-bold block">DATOS</span>
                        <span className="font-black text-black text-sm">{dScore} pts</span>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] text-black font-bold block">INTEGRACIONES</span>
                        <span className="font-black text-black text-sm">{iScore} pts</span>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] text-black font-bold block">ADOPCIÓN</span>
                        <span className="font-black text-black text-sm">{aScore} pts</span>
                      </div>
                      <div className="p-3">
                        <span className="text-[10px] text-black font-bold block">GOVERNANCE</span>
                        <span className="font-black text-black text-sm">{gScore} pts</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* SECCIÓN 3: DETALLE DE PREGUNTAS Y RESPUESTAS RESPONDIDAS */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center border-b border-black pb-2">
                <h2 className="text-xs font-mono font-black text-black uppercase tracking-wider">
                  3. Detalle Completo de Preguntas & Respuestas ({pdfReportSubmission.questions_answered_count ?? (pdfReportSubmission.answers ? Object.keys(pdfReportSubmission.answers).length : 0)} / 25)
                </h2>
                <span className="text-[10px] font-mono font-black text-black uppercase bg-slate-100 px-2.5 py-1 rounded border border-black">
                  Cuestionario Completo
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {QUESTIONS.map((q) => {
                  const userAnsVal = pdfReportSubmission.answers ? pdfReportSubmission.answers[q.id] : undefined;
                  const optionObj = ANSWER_OPTIONS.find((opt) => opt.value === userAnsVal);
                  const isAnswered = !!userAnsVal;

                  return (
                    <div 
                      key={q.id} 
                      className={`p-3.5 rounded-lg border text-xs ${
                        isAnswered ? 'bg-white border-slate-400' : 'bg-slate-100 border-slate-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <div className="font-sans font-black text-black text-xs flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded bg-black text-white font-mono text-[10px] font-bold shrink-0 mt-0.5">
                            P{q.number < 10 ? `0${q.number}` : q.number}
                          </span>
                          <span>{q.text}</span>
                        </div>
                        <span className="text-[9px] font-mono text-black font-bold uppercase bg-slate-200 px-2 py-0.5 rounded border border-black shrink-0">
                          {q.dimensionId}
                        </span>
                      </div>

                      <div className="pl-8 pt-1.5 border-t border-slate-200 flex items-center justify-between font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-black font-bold text-[10px] uppercase">Respuesta:</span>
                          {isAnswered ? (
                            <span className="font-black text-black font-sans">
                              {optionObj ? optionObj.label : String(userAnsVal)}
                            </span>
                          ) : (
                            <span className="italic text-slate-600 font-sans text-xs">
                              (Sin responder)
                            </span>
                          )}
                        </div>
                        {optionObj && (
                          <span className="font-black text-black bg-slate-100 border border-black px-2 py-0.5 rounded text-[10px]">
                            +{optionObj.points} pts
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Document Footer Disclaimer */}
            <div className="border-t-2 border-black pt-4 font-mono text-[10px] text-black font-bold flex justify-between items-center">
              <div>
                FABRIC SOFT MÉXICO © {new Date().getFullYear()} — Confidential & Proprietary Report
              </div>
              <div>
                Reporte de Diagnóstico Fusion Rescue™
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para Agendar Reunión (Día, Hora y Enlace) */}
      {scheduleModalSubmission && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setScheduleModalSubmission(null);
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999999] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#0E2747] border border-[#C9A96E]/50 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn"
          >
            {/* Header Modal */}
            <div className="p-6 border-b border-[#1E3A5F] bg-[#07192F] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white font-serif">
                    Agendar Sesión Técnica
                  </h3>
                  <p className="text-xs text-slate-300">
                    {scheduleModalSubmission.nombre} — {scheduleModalSubmission.empresa}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalSubmission(null)}
                className="w-8 h-8 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleConfirmScheduleMeeting} className="p-6 space-y-5">
              <div className="p-3.5 bg-[#07192F] border border-[#1E3A5F] rounded-2xl space-y-1.5 font-mono text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Prospecto:</span>
                  <span className="text-white font-bold">{scheduleModalSubmission.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Email:</span>
                  <span className="text-blue-300 font-bold">{scheduleModalSubmission.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Teléfono:</span>
                  <span className="text-white">{scheduleModalSubmission.phone || scheduleModalSubmission.telefono || 'N/A'}</span>
                </div>
              </div>

              {/* Picker Día y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Calendar size={13} />
                    Día de la Reunión *
                  </label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full bg-[#07192F] border border-[#1E3A5F] focus:border-[#C9A96E] text-white text-xs font-mono rounded-xl p-3 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock size={13} />
                    Hora de la Reunión *
                  </label>
                  <input
                    type="time"
                    required
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full bg-[#07192F] border border-[#1E3A5F] focus:border-[#C9A96E] text-white text-xs font-mono rounded-xl p-3 outline-none transition"
                  />
                </div>
              </div>

              {/* PIN / Contraseña de la Sala (Bloqueado y Protegido - No Modificable) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key size={13} />
                    Contraseña / PIN de Acceso a la Sala:
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">🔒 Protegido</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={meetingPin}
                  className="w-full bg-[#030712]/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold rounded-xl p-3 outline-none opacity-90 cursor-not-allowed select-all tracking-widest shadow-inner"
                />
              </div>

              {/* Input Enlace Generado (Bloqueado y Protegido - No Modificable) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Link size={13} />
                    Enlace Generado de la Reunión:
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">🔒 Protegido</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={meetingLink || `${window.location.origin}/X7mP2-9KqW4-8vR1t-5YzB3-6FnL0-4JdH8-2XcK9-1WpQ5/${scheduleModalSubmission?.roomId || 'MEET-8821'}`}
                  className="w-full bg-[#030712]/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold rounded-xl p-3 outline-none opacity-90 cursor-not-allowed select-all tracking-wide shadow-inner"
                />
                <p className="text-[11px] text-slate-400 font-mono">
                  🔒 Enlace único generado automáticamente para el cliente con ID de sala y contraseña de acceso segura.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#1E3A5F] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleModalSubmission(null)}
                  className="px-5 py-2.5 border border-[#1E3A5F] text-[#94A3B8] hover:text-white font-mono text-xs rounded-xl cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingMeeting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSavingMeeting ? 'Guardando...' : 'Confirmar y Agendar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: BASURERO DE PROSPECTOS (Recuperación) ── */}
      {showTrashModal && createPortal(
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-[#07192F] border border-rose-500/40 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-content-in">
            {/* Modal Header */}
            <div className="p-6 bg-[#0E2747] border-b border-[#1E3A5F] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                    Basurero de Prospectos Eliminados ({trashItems.length})
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    Prospectos movidos a la papelera. Puedes recuperarlos para devolverlos a la bandeja principal o borrarlos definitivamente.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTrashModal(false)}
                className="w-9 h-9 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content List */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-4 flex-1 custom-scrollbar-gold">
              {trashItems.length === 0 ? (
                <div className="p-12 text-center bg-[#0E2747] border border-[#1E3A5F] rounded-2xl space-y-3">
                  <Trash2 size={36} className="text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white font-mono">El basurero está vacío</h4>
                  <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto">
                    Los prospectos que elimines de la bandeja de entrada se guardarán temporalmente aquí y podrás recuperarlos cuando desees.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trashItems.map(item => (
                    <div
                      key={item._id}
                      className="bg-[#0E2747] border border-[#1E3A5F] hover:border-rose-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white font-mono">{item.nombre}</h4>
                          <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px] font-bold rounded-md">
                            En Basurero
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-mono">
                          🏢 <strong>{item.empresa}</strong> &nbsp;·&nbsp; 📧 {item.email}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRestoreFromTrash(item)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md"
                          title="Restaurar prospecto a la bandeja principal"
                        >
                          <RotateCcw size={14} />
                          <span>Recuperar Prospecto</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item)}
                          className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md"
                          title="Eliminar definitivamente de MongoDB Atlas"
                        >
                          <Trash2 size={14} />
                          <span>Eliminar Definitivamente</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Alertas Notificación Flotante Personalizada FABRIC */}
      {toast && createPortal(
        <div className="fixed bottom-6 right-6 z-[999999] animate-fadeIn">
          <div className={`flex items-start gap-3.5 p-4 rounded-2xl border shadow-2xl backdrop-blur-md max-w-sm ${
            toast.type === 'emerald'
              ? 'bg-[#07192F]/95 border-emerald-500/60 text-emerald-300 shadow-emerald-950/80 ring-1 ring-emerald-500/30'
              : toast.type === 'rose'
              ? 'bg-[#07192F]/95 border-rose-500/60 text-rose-300 shadow-rose-950/80 ring-1 ring-rose-500/30'
              : toast.type === 'blue'
              ? 'bg-[#07192F]/95 border-sky-500/60 text-sky-300 shadow-sky-950/80 ring-1 ring-sky-500/30'
              : 'bg-[#07192F]/95 border-[#C9A96E]/60 text-amber-200 shadow-amber-950/80 ring-1 ring-[#C9A96E]/30'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              toast.type === 'emerald'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : toast.type === 'rose'
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                : toast.type === 'blue'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                : 'bg-[#C9A96E]/20 border-[#C9A96E]/40 text-[#C9A96E]'
            }`}>
              {toast.type === 'emerald' ? <CheckCircle2 size={20} /> : toast.type === 'rose' ? <Trash2 size={20} /> : toast.type === 'blue' ? <Mail size={20} /> : <AlertTriangle size={20} />}
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

      {/* Modal de Confirmación Personalizado FABRIC */}
      {confirmModal && createPortal(
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999999] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setConfirmModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-[#0E2747] border border-rose-500/50 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 relative overflow-hidden"
          >
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                confirmModal.type === 'danger'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              }`}>
                {confirmModal.type === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-bold font-serif text-white tracking-tight">
                  {confirmModal.title}
                </h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mt-0.5">
                  Confirmación requerida
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-200 font-mono leading-relaxed bg-[#07192F] p-4 rounded-2xl border border-[#1E3A5F]">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E3A5F]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 border border-[#1E3A5F] bg-[#07192F] hover:bg-[#123254] text-slate-300 font-mono text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-5 py-2.5 font-mono text-xs font-bold rounded-xl transition cursor-pointer shadow-lg flex items-center gap-2 ${
                  confirmModal.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
                }`}
              >
                <Trash2 size={15} />
                <span>{confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
