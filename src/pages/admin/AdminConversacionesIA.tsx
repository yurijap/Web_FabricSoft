import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';
import {
  Bot,
  Download,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  Database,
  Terminal,
  Activity,
  Copy,
  CheckCheck,
  Zap
} from 'lucide-react';
import { api } from '../../config/api';

// ─── TIPOS ───
type AgentLead = {
  _id: string;
  sessionId: string;
  score: number;
  intent: string;
  urgency: string;
  estimatedRevenue: string;
  company: string;
  industry: string;
  currentSystem: string;
  painPoint: string;
  fabricFit: string;
  summary: string;
  nextStep: string;
  pendingQuestions: string[];
  status: string;
  ctaType: string;
  lastQuestion: string;
  ip: string;
  userAgent: string;
  lastSeenAt: string;
  conversation: Array<{ role: 'user' | 'agent'; text: string }>;
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

// ─── UTILS ───
const formatDateTime = (value?: string) => {
  if (!value) return 'FECHA DESCONOCIDA';
  try {
    const d = new Date(value);
    return d.toLocaleString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: false 
    }).toUpperCase();
  } catch {
    return 'FECHA INVÁLIDA';
  }
};

const safeFileName = (value?: string) => String(value || 'dataset')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/gi, '_')
  .replace(/^_+|_+$/g, '')
  .toLowerCase();

const downloadConversationAsTxt = (lead: AgentLead) => {
  // Formato estructurado para Fine-Tuning
  const metadata = `--- METADATA ---\nID: ${lead._id || 'N/A'}\nEmpresa: ${lead.company || 'N/A'}\nIndustria: ${lead.industry || 'N/A'}\nIntencion: ${lead.intent || 'N/A'}\nScore: ${lead.score || 0}\nSistema: ${lead.currentSystem || 'N/A'}\n\n`;
  const textContent = (lead.conversation || [])
    .map((msg) => `${msg.role === 'user' ? 'USER_INPUT' : 'SYSTEM_RESPONSE'}:\n${msg.text}\n`)
    .join('\n');

  const blob = new Blob([metadata + '--- TRANSCRIPT ---\n' + textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `fabric_dataset_${safeFileName(lead.company)}_${lead._id?.slice(-6) || 'out'}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const estimateTokens = (conversation?: AgentLead['conversation']) => {
  if (!conversation || !Array.isArray(conversation)) return 0;
  const text = conversation.map(c => c.text).join(' ');
  return Math.round(text.length / 4);
};

// ─── COMPONENTE PRINCIPAL ───
export default function AdminConversacionesIA() {
  const { getToken } = useAuth();
  const [leads, setLeads] = useState<AgentLead[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const { data } = await api.get('/agente-ia/leads', {
        headers: authHeaders(token),
      });

      const highQualityLeads = (data.leads || []).filter((l: AgentLead) => l.score >= 80);
      setLeads(highQualityLeads);
      setSelectedId((current) => current || highQualityLeads[0]?._id || null);
    } catch (error: any) {
      toast.error('Error de sincronización', {
        description: error.response?.data?.error || 'No se pudo conectar con el motor. Verifique su red.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [...leads].sort((a, b) => new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime());

    return leads
      .filter((lead) => [
        lead.company, lead.intent, lead.industry, lead.currentSystem, lead.ip
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)))
      .sort((a, b) => new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime());
  }, [leads, search]);

  const selectedLead = filteredLeads.find((lead) => lead._id === selectedId) || leads[0];

  // ─── FUNCIONES CORREGIDAS (SOPORTAN UNDEFINED) ───
  const deleteLead = async (lead?: AgentLead) => {
    if (!lead) return;
    const confirmed = window.confirm(`ATENCIÓN: ¿Purgar permanentemente el dataset de ${lead.company || 'esta entidad'}? Esta acción es irreversible.`);
    if (!confirmed) return;

    try {
      const token = await getToken();
      if (!token) return;

      setDeletingId(lead._id);
      await api.delete(`/agente-ia/leads/${lead._id}`, { headers: authHeaders(token) });

      setLeads((current) => {
        const next = current.filter((item) => item._id !== lead._id);
        setSelectedId(next[0]?._id || null);
        return next;
      });
      toast.success('Registro purgado exitosamente del dataset.');
    } catch (error: any) {
      toast.error('Fallo al purgar', { description: 'Reintente la operación.' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (lead?: AgentLead) => {
    if (!lead) return;
    try {
      downloadConversationAsTxt(lead);
      toast.success('Dataset descargado en .txt');
    } catch {
      toast.error('Error al generar el archivo');
    }
  };

  const handleCopyTranscript = (lead?: AgentLead) => {
    if (!lead || !lead.conversation) return;
    const textContent = lead.conversation
      .map((msg) => `${msg.role === 'user' ? 'USER_INPUT' : 'SYSTEM_RESPONSE'}:\n${msg.text}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    toast.success('Transcripción copiada al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] px-4 py-6 text-[#F5F5F5] sm:px-8 font-sans selection:bg-[#C9A96E]/30 pb-10">
      
      {/* ── HEADER ── */}
      <header className="border border-[#1A1A1A] bg-[#0A0A0A] rounded-sm relative overflow-hidden mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent" />
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 p-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 border border-[#C9A96E]/20 bg-[#C9A96E]/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E] rounded-sm">
              <Database size={12} />
              Vault de Entrenamiento AI
            </div>
            <h1 className="font-serif text-3xl text-[#F5F5F5] tracking-tight">
              Dataset de Inferencia Crítica.
            </h1>
            <p className="mt-2 text-[13px] text-[#888] max-w-3xl leading-relaxed">
              Repositorio de transcripciones de alto valor (Score ≥ 80). Extraiga estos registros como contexto estructurado para fine-tuning del motor LLM y análisis de patrones en arquitecturas Oracle.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 xl:min-w-[320px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full border border-[#2A2A2A] bg-[#050505] pl-9 pr-8 text-[11px] font-mono text-[#F5F5F5] outline-none focus:border-[#C9A96E]/50 transition-colors rounded-sm placeholder:text-[#444]"
                placeholder="Buscar por entidad, IP, sector o intención..."
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#C9A96E] font-mono text-[10px]">
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={loadLeads}
              disabled={loading}
              className="flex h-10 w-10 items-center justify-center border border-[#2A2A2A] bg-[#0A0A0A] text-[#888] hover:text-[#F5F5F5] hover:border-[#555] transition-colors disabled:opacity-50 rounded-sm shrink-0"
              title="Sincronizar base vectorial"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-[#C9A96E]' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* ── SPLIT VIEW ── */}
      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)] items-start">
        
        {/* ==========================================
            IZQUIERDA: ÍNDICE DE REGISTROS (LOGS)
            ========================================== */}
        <aside className="border border-[#1A1A1A] bg-[#0A0A0A] rounded-sm flex flex-col h-[calc(100vh-220px)] min-h-[500px] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] px-5 py-4 shrink-0 bg-[#050505]">
            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#888]">
              <Filter size={12} className="text-[#C9A96E]" />
              Índice Vectorial
            </div>
            <span className="font-mono text-[9px] text-[#C9A96E] border border-[#C9A96E]/20 bg-[#C9A96E]/5 px-2 py-0.5 rounded-sm">
              N: {filteredLeads.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-[#1A1A1A] scrollbar-track-transparent">
            {loading && <div className="text-center py-10 font-mono text-[10px] text-[#555] uppercase tracking-widest animate-pulse">Sincronizando vectores...</div>}
            
            {!loading && filteredLeads.length === 0 && (
              <div className="text-center py-10 font-mono text-[10px] text-[#555] uppercase tracking-widest">Dataset Vacío o sin coincidencias</div>
            )}

            {filteredLeads.map((lead) => {
              const active = selectedLead?._id === lead._id;
              return (
                <button
                  key={lead._id}
                  onClick={() => setSelectedId(lead._id)}
                  className={`relative w-full flex items-center justify-between p-3 border text-left transition-colors rounded-sm overflow-hidden group ${
                    active ? 'border-[#C9A96E]/40 bg-[#C9A96E]/5' : 'border-[#1A1A1A] bg-[#050505] hover:border-[#2A2A2A]'
                  }`}
                >
                  {/* Resalte lateral para el activo */}
                  {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C9A96E]" />}
                  
                  <div className={`min-w-0 flex-1 ${active ? 'pl-2' : ''} transition-all`}>
                    <div className="font-mono text-[8px] text-[#555] tracking-widest uppercase mb-1.5">
                      {formatDateTime(lead.lastSeenAt)}
                    </div>
                    <div className={`truncate font-serif text-[15px] leading-none ${active ? 'text-[#C9A96E]' : 'text-[#F5F5F5] group-hover:text-white'}`}>
                      {lead.company && lead.company !== 'No detectada' ? lead.company : lead.intent?.replace('_', ' ') || 'Sesión Anónima'}
                    </div>
                  </div>
                  <div className={`ml-3 shrink-0 font-mono text-[11px] w-9 h-9 border rounded-sm flex items-center justify-center transition-colors ${active ? 'border-[#C9A96E]/30 text-[#C9A96E] bg-[#C9A96E]/10' : 'border-[#2A2A2A] text-[#888] bg-[#0A0A0A]'}`}>
                    {lead.score || 0}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ==========================================
            DERECHA: INSPECTOR DE ENTIDAD
            ========================================== */}
        <main className="border border-[#1A1A1A] bg-[#0A0A0A] rounded-sm h-[calc(100vh-220px)] min-h-[500px] flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          {selectedLead ? (
            <>
              {/* HEADER DEL INSPECTOR */}
              <div className="border-b border-[#1A1A1A] px-6 py-5 shrink-0 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 bg-[#050505]">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-1.5 flex items-center gap-2">
                    <Activity size={10} /> Inspector de Contexto
                  </div>
                  <h2 className="font-serif text-3xl text-[#F5F5F5]">
                    {selectedLead.company && selectedLead.company !== 'No detectada' ? selectedLead.company : 'Entidad Anonimizada'}
                  </h2>
                  <div className="mt-2.5 flex items-center gap-4">
                    <span className="font-mono text-[10px] text-[#555] bg-[#111] px-2 py-1 rounded-sm border border-[#2A2A2A]">
                      ID: {selectedLead._id?.slice(-8) || 'N/A'}
                    </span>
                    <span className="font-mono text-[10px] text-[#555] bg-[#111] px-2 py-1 rounded-sm border border-[#2A2A2A]">
                      IP: {selectedLead.ip || 'Oculta'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopyTranscript(selectedLead)}
                    className="flex items-center justify-center w-10 border border-[#2A2A2A] bg-[#050505] hover:border-[#C9A96E]/50 hover:text-[#C9A96E] text-[#888] transition-colors rounded-sm"
                    title="Copiar transcripción"
                  >
                    {copied ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                  <button 
                    onClick={() => handleDownload(selectedLead)}
                    className="flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 hover:bg-[#C9A96E]/20 text-[#C9A96E] px-4 py-2 font-mono text-[9px] uppercase tracking-widest transition-colors rounded-sm"
                  >
                    <Download size={13} /> Exportar
                  </button>
                  <button 
                    onClick={() => deleteLead(selectedLead)}
                    disabled={deletingId === selectedLead._id}
                    className="flex items-center justify-center w-10 border border-[#2A2A2A] bg-[#050505] hover:border-red-500/30 hover:text-red-400 text-[#555] transition-colors rounded-sm disabled:opacity-50"
                    title="Purgar registro"
                  >
                    {deletingId === selectedLead._id ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>

              {/* CONTENIDO SCROLLEABLE */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#1A1A1A] scrollbar-track-transparent">
                
                {/* 1. METADATA TÉCNICA (Properties) */}
                <div>
                  <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#888] border-b border-[#1A1A1A] pb-2 mb-3">
                    Métricas de Inferencia
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Property label="Score del Modelo" value={String(selectedLead.score || 0)} highlight />
                    <Property label="Timestamp (Local)" value={formatDateTime(selectedLead.lastSeenAt)} />
                    <Property label="Turnos de Diálogo" value={String(selectedLead.conversation?.length || 0)} />
                    <Property label="Estimación Tokens" value={`~${estimateTokens(selectedLead.conversation)} tkns`} />
                  </div>
                </div>

                {/* 2. VECTORES EXTRAÍDOS (Comercial / Técnico) */}
                <div>
                  <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#888] border-b border-[#1A1A1A] pb-2 mb-3 mt-4">
                    Vectores de Clasificación
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Property label="Intención Principal" value={selectedLead.intent?.replace('_', ' ')} />
                    <Property label="Sector Industrial" value={selectedLead.industry} />
                    <Property label="Revenue Estimado" value={selectedLead.estimatedRevenue} />
                    <Property label="Sistema Core Actual" value={selectedLead.currentSystem} />
                  </div>
                </div>

                {/* 3. ANÁLISIS NLP */}
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div className="border border-[#1A1A1A] bg-[#050505] p-5 rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
                    <div className="font-mono text-[8px] uppercase tracking-widest text-[#C9A96E] mb-2.5 flex items-center gap-1.5">
                      <Zap size={12} /> Falla Crítica Detectada
                    </div>
                    <p className="text-[13px] text-[#A0A0A0] leading-relaxed">{selectedLead.painPoint || 'Sin dolor explícito detectado.'}</p>
                  </div>
                  <div className="border border-[#1A1A1A] bg-[#050505] p-5 rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
                    <div className="font-mono text-[8px] uppercase tracking-widest text-[#C9A96E] mb-2.5 flex items-center gap-1.5">
                      <Bot size={12} /> Resumen Generado
                    </div>
                    <p className="text-[13px] text-[#A0A0A0] leading-relaxed">{selectedLead.summary || 'Sin resumen disponible.'}</p>
                  </div>
                </div>

                {/* 4. PREGUNTAS PENDIENTES */}
                {selectedLead.pendingQuestions && selectedLead.pendingQuestions.length > 0 && (
                  <div>
                    <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#888] border-b border-[#1A1A1A] pb-2 mb-3 mt-4">
                      Vectores Faltantes (Preguntas Pendientes)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedLead.pendingQuestions.map((q, i) => (
                        <span key={i} className="border border-[#2A2A2A] bg-[#111] px-3 py-1.5 rounded-sm font-sans text-[11px] text-[#888]">
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. TRANSCRIPCIÓN TERMINAL */}
                <div className="mt-6">
                  <h3 className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#888] border-b border-[#1A1A1A] pb-2 mb-3 flex items-center gap-2">
                    <Terminal size={12} /> Log de Transcripción Cruda
                  </h3>
                  <div className="border border-[#1A1A1A] bg-[#050505] rounded-sm p-5 space-y-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]">
                    {selectedLead.conversation && selectedLead.conversation.length > 0 ? (
                      selectedLead.conversation.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'ml-8 border-l-2 border-[#2A2A2A] pl-4' : 'mr-8 border-l-2 border-[#C9A96E]/50 pl-4'}`}>
                          <div className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-[#555] flex items-center gap-2">
                            {msg.role === 'user' ? 'USER_INPUT' : 'SYSTEM_RESPONSE'}
                          </div>
                          <div className={`font-mono text-[12px] leading-[1.6] ${msg.role === 'user' ? 'text-[#A0A0A0]' : 'text-[#C9A96E]'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center font-mono text-[10px] text-[#555] uppercase tracking-widest py-8">
                        Historial no disponible
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#333]">
              <Database size={40} className="mb-4 opacity-30" />
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#555]">Seleccione un dataset para inspeccionar</div>
            </div>
          )}
        </main>

      </section>
    </div>
  );
}

// ─── COMPONENTES SECUNDARIOS ───

function Property({ label, value, highlight = false }: { label: string; value: string | null | undefined; highlight?: boolean }) {
  const displayValue = value || 'N/A';
  return (
    <div className="flex flex-col gap-1.5 border border-[#1A1A1A] bg-[#050505] p-3 rounded-sm">
      <div className="font-mono text-[8.5px] uppercase tracking-[0.15em] text-[#555]">{label}</div>
      <div className={`font-mono text-[12px] truncate ${highlight ? 'text-[#C9A96E] font-bold' : 'text-[#F5F5F5]'}`} title={displayValue}>
        {displayValue}
      </div>
    </div>
  );
}