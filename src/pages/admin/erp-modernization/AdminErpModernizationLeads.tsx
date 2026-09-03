import { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, Target, CheckCircle2, Filter, Building2, User, Mail, Phone, Calendar, Clock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthApi } from '../../../config/api';

interface ErpLeadItem {
  _id: string;
  first_name: string;
  last_name: string;
  company: string;
  job_title: string;
  work_email: string;
  country: string;
  phone?: string;
  current_erp: string;
  erp_version?: string;
  current_modules: string[];
  main_need: string;
  business_impact: string;
  problem_description?: string;
  authority_role: string;
  budget_status: string;
  timing: string;
  bant_prequalification: 'HIGH' | 'MEDIUM' | 'NURTURE';
  assigned_sdr: 'Ximena' | 'Fabrizio';
  validation_status: string;
  qualified_lead: boolean;
  meeting_booked: boolean;
  booking_time?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  source_erp?: string;
  createdAt: string;
}

export default function AdminErpModernizationLeads() {
  const adminApi = useAuthApi();
  const [items, setItems] = useState<ErpLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bantFilter, setBantFilter] = useState<string>('ALL');
  const [sdrFilter, setSdrFilter] = useState<string>('ALL');
  const [erpFilter, setErpFilter] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<ErpLeadItem | null>(null);

  const fetchLeads = () => {
    setLoading(true);
    adminApi.get('/erp-modernization/leads')
      .then((res) => {
        setItems(res.data.data || []);
      })
      .catch((err) => console.error('Error al cargar leads ERP Modernization:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      const match =
        (item.first_name || '').toLowerCase().includes(term) ||
        (item.last_name || '').toLowerCase().includes(term) ||
        (item.company || '').toLowerCase().includes(term) ||
        (item.work_email || '').toLowerCase().includes(term) ||
        (item.current_erp || '').toLowerCase().includes(term);
      if (!match) return false;
    }

    if (bantFilter !== 'ALL' && item.bant_prequalification !== bantFilter) return false;
    if (sdrFilter !== 'ALL' && item.assigned_sdr !== sdrFilter) return false;
    if (erpFilter !== 'ALL' && !(item.current_erp || '').toLowerCase().includes(erpFilter.toLowerCase())) return false;

    return true;
  });

  const getBantBadge = (bant: string) => {
    if (bant === 'HIGH') {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          HIGH · Prioridad Alta
        </span>
      );
    }
    if (bant === 'MEDIUM') {
      return (
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-400 font-mono text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          MEDIUM · Media
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold rounded-lg inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        NURTURE
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
              <ShieldCheck size={13} /> FABRIC · ERP MODERNIZATION ROADMAP™
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Leads ERP Modernization
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Bandeja de precalificación BANT y asignación balanceada de SDRs (Ximena / Fabrizio).
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[var(--bg-panel)] border border-[#1E3A5F] px-5 py-2.5 rounded-2xl shadow-md shrink-0">
            <div className="text-center px-3 border-r border-[#1E3A5F]">
              <div className="font-serif text-2xl font-bold leading-none text-[#C9A96E]">
                {items.length}
              </div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Total Leads</div>
            </div>
            <div className="text-center px-3">
              <div className="font-serif text-2xl font-bold leading-none text-emerald-400">
                {items.filter((i) => i.bant_prequalification === 'HIGH').length}
              </div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Prioridad Alta</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Barra de Filtros */}
        <div className="bg-[#0E2747] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg space-y-3">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, empresa, email o ERP actual..."
              className="w-full pl-10 pr-8 py-2.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex items-center justify-between bg-[#07192F] border border-[#1E3A5F] px-3 py-2 rounded-xl">
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold">BANT</span>
              <select
                value={bantFilter}
                onChange={(e) => setBantFilter(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0E2747]">Todos</option>
                <option value="HIGH" className="bg-[#0E2747]">HIGH (Alta)</option>
                <option value="MEDIUM" className="bg-[#0E2747]">MEDIUM (Media)</option>
                <option value="NURTURE" className="bg-[#0E2747]">NURTURE</option>
              </select>
            </div>

            <div className="flex items-center justify-between bg-[#07192F] border border-[#1E3A5F] px-3 py-2 rounded-xl">
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold">SDR Asignado</span>
              <select
                value={sdrFilter}
                onChange={(e) => setSdrFilter(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0E2747]">Todos</option>
                <option value="Ximena" className="bg-[#0E2747]">Ximena</option>
                <option value="Fabrizio" className="bg-[#0E2747]">Fabrizio</option>
              </select>
            </div>

            <div className="flex items-center justify-between bg-[#07192F] border border-[#1E3A5F] px-3 py-2 rounded-xl">
              <span className="font-mono text-[10px] text-[#94A3B8] uppercase font-bold">ERP Origen</span>
              <select
                value={erpFilter}
                onChange={(e) => setErpFilter(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#0E2747]">Todos</option>
                <option value="EBS" className="bg-[#0E2747]">Oracle EBS</option>
                <option value="JDE" className="bg-[#0E2747]">JD Edwards</option>
                <option value="PeopleSoft" className="bg-[#0E2747]">PeopleSoft</option>
                <option value="SAP" className="bg-[#0E2747]">SAP</option>
              </select>
            </div>

            <button
              onClick={fetchLeads}
              className="w-full py-2 bg-[#07192F] hover:bg-[#123254] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refrescar</span>
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-2xl border border-[#1E3A5F] bg-[var(--bg-panel)] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] bg-[#07192F] flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Prospectos Registrados ({filteredItems.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center font-mono text-xs text-[#94A3B8]">
                Cargando prospectos...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#94A3B8] font-mono">
                No se encontraron leads registrados con los filtros seleccionados.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-[#07192F] border-b border-[#1E3A5F] font-mono text-[10px] text-[#94A3B8] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-[140px]">Fecha</th>
                    <th className="py-3.5 px-4">Contacto & Empresa</th>
                    <th className="py-3.5 px-4 w-[160px]">ERP Actual</th>
                    <th className="py-3.5 px-4 w-[120px]">BANT</th>
                    <th className="py-3.5 px-4 w-[120px]">SDR Asignado</th>
                    <th className="py-3.5 px-4 w-[160px]">¿Cita Agendada?</th>
                    <th className="py-3.5 px-4 text-right w-[110px]">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60 text-xs">
                  {filteredItems.map((item) => {
                    const dateStr = new Date(item.createdAt).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    });

                    return (
                      <tr
                        key={item._id}
                        onClick={() => setSelectedLead(item)}
                        className="hover:bg-[#123254]/50 transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono text-[#94A3B8] text-[11px] whitespace-nowrap">{dateStr}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-xs">{item.first_name} {item.last_name}</div>
                          <div className="text-[11px] text-[#94A3B8] truncate max-w-[240px]">
                            {item.job_title} · <strong className="text-slate-200">{item.company}</strong>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#C9A96E] whitespace-nowrap">
                          {item.current_erp}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{getBantBadge(item.bant_prequalification)}</td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-blue-300 whitespace-nowrap">
                          {item.assigned_sdr}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.meeting_booked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md font-mono text-[10px] font-bold">
                              ✓ Sí ({item.booking_time || 'Agendada'})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 bg-slate-800/80 text-slate-400 border border-slate-700 rounded-md font-mono text-[10px]">
                              No agendada
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-[#C9A96E] font-bold whitespace-nowrap">
                          Ver →
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

      {/* Expediente Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E2747] border border-[#C9A96E]/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start border-b border-[#C9A96E]/20 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase">
                  EXPEDIENTE ERP MODERNIZATION
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedLead.first_name} {selectedLead.last_name}
                </h3>
                <p className="text-xs text-slate-300">
                  {selectedLead.job_title} · {selectedLead.company} ({selectedLead.country})
                </p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white font-mono text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#07192F] rounded-xl border border-slate-700">
                <span className="text-[#94A3B8] font-mono block text-[10px]">EMAIL</span>
                <span className="font-bold text-white">{selectedLead.work_email}</span>
              </div>

              <div className="p-3 bg-[#07192F] rounded-xl border border-slate-700">
                <span className="text-[#94A3B8] font-mono block text-[10px]">TELÉFONO</span>
                <span className="font-bold text-white">{selectedLead.phone || 'No especificado'}</span>
              </div>

              <div className="p-3 bg-[#07192F] rounded-xl border border-slate-700">
                <span className="text-[#94A3B8] font-mono block text-[10px]">ERP ACTUAL & VERSIÓN</span>
                <span className="font-bold text-[#C9A96E]">{selectedLead.current_erp} {selectedLead.erp_version ? `(${selectedLead.erp_version})` : ''}</span>
              </div>

              <div className="p-3 bg-[#07192F] rounded-xl border border-slate-700">
                <span className="text-[#94A3B8] font-mono block text-[10px]">SDR ASIGNADO</span>
                <span className="font-bold text-blue-300">{selectedLead.assigned_sdr}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-mono font-bold text-[#C9A96E] uppercase">PRECALIFICACIÓN BANT</h4>
              <div className="p-4 bg-[#07192F] rounded-xl border border-slate-700 space-y-2 text-xs">
                <div><strong className="text-slate-300">Need:</strong> {selectedLead.main_need}</div>
                <div><strong className="text-slate-300">Impacto:</strong> {selectedLead.business_impact}</div>
                {selectedLead.problem_description && (
                  <div><strong className="text-slate-300">Detalle Abierto:</strong> {selectedLead.problem_description}</div>
                )}
                <div><strong className="text-slate-300">Authority:</strong> {selectedLead.authority_role}</div>
                <div><strong className="text-slate-300">Budget:</strong> {selectedLead.budget_status}</div>
                <div><strong className="text-slate-300">Timing:</strong> {selectedLead.timing}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#C9A96E]/20 flex justify-end">
              <button
                onClick={() => setSelectedLead(null)}
                className="px-6 py-2.5 bg-[#C9A96E] text-[#050203] font-black rounded-xl text-xs uppercase cursor-pointer"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
