import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, RefreshCw, Trash2, Eye, Target, Check, Minus, Filter, ArrowUpRight, AlertTriangle, ChevronRight, X, FileText } from 'lucide-react';
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
  answers?: AnswerItem[] | Record<string, any>;
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
  const [saving, setSaving] = useState(false);

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

  // Lock body scroll when Expediente modal is open
  useEffect(() => {
    if (selectedSubmission) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedSubmission]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este expediente de prospecto?')) return;
    setSaving(true);
    try {
      await adminApi.delete(`/rescue-assessment/submissions/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      if (selectedSubmission?._id === id) setSelectedSubmission(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(i => {
    // Search
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const matchSearch = (
        (i.nombre || '').toLowerCase().includes(term) ||
        (i.empresa || '').toLowerCase().includes(term) ||
        (i.email || '').toLowerCase().includes(term) ||
        (i.cargo || i.job_title || '').toLowerCase().includes(term) ||
        (i.country || '').toLowerCase().includes(term)
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
        <div className="bg-[var(--bg-panel)] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, cargo, empresa, país..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E] transition"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Path Filter */}
              <div className="flex items-center gap-2 bg-[#07192F] border border-[#1E3A5F] px-3 py-1.5 rounded-xl">
                <Filter size={12} className="text-[#94A3B8]" />
                <span className="font-mono text-[10px] text-[#94A3B8] uppercase">Path:</span>
                <select
                  value={pathFilter}
                  onChange={e => setPathFilter(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0E2747]">Todos</option>
                  <option value="OPTIMIZE" className="bg-[#0E2747]">OPTIMIZE</option>
                  <option value="REMEDIATE" className="bg-[#0E2747]">REMEDIATE</option>
                  <option value="RESCUE" className="bg-[#0E2747]">RESCUE</option>
                  <option value="REASSESS" className="bg-[#0E2747]">REASSESS</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-[#07192F] border border-[#1E3A5F] px-3 py-1.5 rounded-xl">
                <span className="font-mono text-[10px] text-[#94A3B8] uppercase">Estado:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0E2747]">Todos</option>
                  <option value="OPTIMIZED" className="bg-[#0E2747]">Optimizado</option>
                  <option value="STABLE" className="bg-[#0E2747]">Estable</option>
                  <option value="AT RISK" className="bg-[#0E2747]">At Risk</option>
                  <option value="CRITICAL" className="bg-[#0E2747]">Critical</option>
                </select>
              </div>

              {/* Timing Filter */}
              <div className="flex items-center gap-2 bg-[#07192F] border border-[#1E3A5F] px-3 py-1.5 rounded-xl">
                <span className="font-mono text-[10px] text-[#94A3B8] uppercase">Timing:</span>
                <select
                  value={timingFilter}
                  onChange={e => setTimingFilter(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0E2747]">Todos</option>
                  <option value="Lo antes posible (Urgente)" className="bg-[#0E2747]">Urgente</option>
                  <option value="En los próximos 3 meses" className="bg-[#0E2747]">3 meses</option>
                  <option value="En los próximos 6 meses" className="bg-[#0E2747]">6 meses</option>
                  <option value="Sólo evaluando opciones" className="bg-[#0E2747]">Evaluando</option>
                </select>
              </div>

              {/* Review Requested Filter */}
              <div className="flex items-center gap-2 bg-[#07192F] border border-[#1E3A5F] px-3 py-1.5 rounded-xl">
                <span className="font-mono text-[10px] text-[#94A3B8] uppercase">¿Revisión?:</span>
                <select
                  value={reviewFilter}
                  onChange={e => setReviewFilter(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0E2747]">Todos</option>
                  <option value="YES" className="bg-[#0E2747]">Sí Solicitó</option>
                  <option value="NO" className="bg-[#0E2747]">Sólo Resultado</option>
                </select>
              </div>

              <button
                onClick={fetchItems}
                className="px-4 py-2 bg-[#07192F] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                <span>Refrescar</span>
              </button>
            </div>
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
                            <button
                              onClick={() => setSelectedSubmission(item)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-mono text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm"
                            >
                              <Eye size={13} />
                              <span>Ver Expediente</span>
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              disabled={saving}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10"
                              title="Eliminar expediente"
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
          onClick={() => setSelectedSubmission(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 md:p-6 overflow-y-auto"
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

              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-9 h-9 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1 custom-scrollbar-gold">
              {/* Resumen Ejecutivo */}
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
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Antigüedad Go-Live:</span>
                      <span className="text-white">{selectedSubmission.go_live_age || '1-2 años'}</span>
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
                onClick={() => setSelectedSubmission(null)}
                className="px-6 py-2.5 border border-[#1E3A5F] text-[#94A3B8] hover:text-white font-mono text-xs rounded-xl cursor-pointer transition"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
