import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle2, CalendarClock, AlertCircle, ArrowDownRight, Layers, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuthApi } from '../../../config/api';

const DEFAULT_QUESTION_DROPOFFS = [
  { question: 'P01 - Procesos principales en Fusion', dropOffRate: '0.0%' },
  { question: 'P02 - Manualidad fuera de Fusion', dropOffRate: '0.0%' },
  { question: 'P03 - Conciliaciones manuales', dropOffRate: '0.0%' },
  { question: 'P04 - Cierre mensual', dropOffRate: '0.0%' },
  { question: 'P05 - Carga de asientos contables', dropOffRate: '0.0%' },
  { question: 'P06 - Variación de saldos', dropOffRate: '0.0%' },
  { question: 'P07 - Calidad de datos maestros', dropOffRate: '0.0%' },
  { question: 'P08 - Datos duplicados o incompletos', dropOffRate: '0.0%' },
  { question: 'P09 - Fallas en integraciones', dropOffRate: '0.0%' },
  { question: 'P10 - Intervención manual en interfaces', dropOffRate: '0.0%' },
  { question: 'P11 - Adopción real de usuarios', dropOffRate: '0.0%' },
  { question: 'P12 - Uso de Excel paralelo', dropOffRate: '0.0%' },
  { question: 'P13 - Backlog de tickets', dropOffRate: '0.0%' },
  { question: 'P14 - Tiempo de respuesta de soporte', dropOffRate: '0.0%' },
  { question: 'P15 - Pruebas de updates trimestrales', dropOffRate: '0.0%' },
  { question: 'P16 - Documentación de procesos', dropOffRate: '0.0%' },
  { question: 'P17 - Reportes de BI/OTBI', dropOffRate: '0.0%' },
  { question: 'P18 - Gobernanza de cambios', dropOffRate: '0.0%' },
  { question: 'P19 - Seguridad y roles de Fusion', dropOffRate: '0.0%' },
  { question: 'P20 - Capacidad del equipo interno', dropOffRate: '0.0%' },
  { question: 'P21 - Dependencia del partner actual', dropOffRate: '0.0%' },
  { question: 'P22 - Visibilidad del roadmap OCI', dropOffRate: '0.0%' },
  { question: 'P23 - Impacto financiero de fallas', dropOffRate: '0.0%' },
  { question: 'P24 - Grado de urgencia del negocio', dropOffRate: '0.0%' },
  { question: 'P25 - Expectativa de resolución', dropOffRate: '0.0%' },
];

export default function AdminRescueDashboard() {
  const adminApi = useAuthApi();
  const [loading, setLoading] = useState(true);

  // Conversion funnel metrics (pure 0 default)
  const [landingVisits, setLandingVisits] = useState(0);
  const [assessmentStarts, setAssessmentStarts] = useState(0);
  const [assessmentCompletes, setAssessmentCompletes] = useState(0);
  const [leadCaptures, setLeadCaptures] = useState(0);
  const [reviewRequests, setReviewRequests] = useState(0);
  const [questionDropOffs, setQuestionDropOffs] = useState(DEFAULT_QUESTION_DROPOFFS);

  const fetchStats = () => {
    setLoading(true);
    adminApi.get('/fusion-rescue/dashboard-stats')
      .then(res => {
        const stats = res.data.data;
        if (stats) {
          setLandingVisits(stats.landing_visits ?? 0);
          setAssessmentStarts(stats.assessment_starts ?? 0);
          setAssessmentCompletes(stats.assessment_completes ?? 0);
          setLeadCaptures(stats.lead_captures ?? 0);
          setReviewRequests(stats.review_requests ?? 0);
          if (stats.questionDropOffs && stats.questionDropOffs.length > 0) {
            setQuestionDropOffs(stats.questionDropOffs);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleClearAnalytics = async () => {
    if (!window.confirm('⚠️ ¿Estás seguro de que deseas limpiar TODOS los datos de analítica de /fusion-rescue de la BD?\n\nEsta acción restablecerá los contadores y métricas a 0.')) {
      return;
    }
    try {
      setLoading(true);
      await adminApi.delete('/fusion-rescue/analytics/clear');
      setLandingVisits(0);
      setAssessmentStarts(0);
      setAssessmentCompletes(0);
      setLeadCaptures(0);
      setReviewRequests(0);
      setQuestionDropOffs(DEFAULT_QUESTION_DROPOFFS);
      alert('✅ Todos los datos de analítica han sido limpiados de la BD.');
    } catch (err) {
      console.error('Error al limpiar analítica:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-white font-sans pb-16">
      {/* Header */}
      <div className="p-6 md:p-8 bg-[var(--bg-base)] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <BarChart3 size={13} /> FABRIC · CONTENT-TO-PIPELINE ENGINE · DASHBOARD
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Dashboard General (Embudo Global)
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Medición en tiempo real del embudo de conversión y eventos de interacción en MongoDB Atlas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleClearAnalytics}
              className="px-4 py-2 bg-rose-950/60 border border-rose-500/50 hover:bg-rose-900/80 text-rose-300 font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
              title="Borra los datos de eventos y analítica de la BD para dejar todo en 0"
            >
              <AlertCircle size={14} className="text-rose-400" />
              <span>Limpiar datos (No Tocar)</span>
            </button>

            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-[#07192F] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refrescar Estadísticas</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Visitas Totales */}
          <div className="p-6 rounded-2xl bg-[var(--bg-panel)] border border-[#1E3A5F] relative overflow-hidden">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block mb-2">
              1. Visitas a Landing
            </span>
            <div className="font-serif text-3xl font-extrabold text-white">
              {landingVisits.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-[#94A3B8]">Tráfico Total</span>
              <span className="text-emerald-400 font-bold">100% Baseline</span>
            </div>
          </div>

          {/* Card 2: Assessments Iniciados */}
          <div className="p-6 rounded-2xl bg-[var(--bg-panel)] border border-[#1E3A5F] relative overflow-hidden">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block mb-2">
              2. Assessments Iniciados
            </span>
            <div className="font-serif text-3xl font-extrabold text-blue-400">
              {assessmentStarts.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-[#94A3B8]">Conv. Landing → Quiz</span>
              <span className="text-blue-400 font-bold">
                {landingVisits > 0 ? ((assessmentStarts / landingVisits) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>

          {/* Card 3: Leads Capturados */}
          <div className="p-6 rounded-2xl bg-[var(--bg-panel)] border border-[#1E3A5F] relative overflow-hidden">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block mb-2">
              3. Leads Capturados
            </span>
            <div className="font-serif text-3xl font-extrabold text-amber-400">
              {leadCaptures.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-[#94A3B8]">Conv. Quiz → Lead</span>
              <span className="text-amber-400 font-bold">
                {assessmentStarts > 0 ? ((leadCaptures / assessmentStarts) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>

          {/* Card 4: Solicitudes de Revisión */}
          <div className="p-6 rounded-2xl bg-[var(--bg-panel)] border border-[#1E3A5F] relative overflow-hidden">
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider block mb-2">
              4. Solicitudes de Revisión
            </span>
            <div className="font-serif text-3xl font-extrabold text-emerald-400">
              {reviewRequests.toLocaleString()}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs font-mono">
              <span className="text-[#94A3B8]">Conv. Lead → Cita</span>
              <span className="text-emerald-400 font-bold">
                {leadCaptures > 0 ? ((reviewRequests / leadCaptures) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>

        {/* Embudo de Conversión (Funnel Chart) */}
        <div className="p-6 md:p-8 rounded-2xl bg-[var(--bg-panel)] border border-[#1E3A5F] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#1E3A5F] pb-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-white">
                Embudo de Conversión Content-to-Pipeline Engine
              </h3>
              <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                Visualización paso a paso de la retención de usuarios en cada etapa del pipeline.
              </p>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded-lg self-start">
              Conversion Global: {landingVisits > 0 ? ((reviewRequests / landingVisits) * 100).toFixed(1) : '0.0'}%
            </div>
          </div>

          {/* Step Bars */}
          <div className="space-y-4 font-mono">
            {/* Step 1 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>1. Landing Visit (Visitantes únicos)</span>
                <span className="text-white font-bold">{landingVisits} ({landingVisits > 0 ? '100%' : '0%'})</span>
              </div>
              <div className="w-full bg-[#07192F] h-8 rounded-xl overflow-hidden p-1 border border-[#1E3A5F]">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-lg flex items-center justify-end px-3 text-[10px] text-white font-bold transition-all duration-500"
                  style={{ width: landingVisits > 0 ? '100%' : '0%' }}
                >
                  {landingVisits > 0 ? '100%' : '0%'}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>2. Assessment Start (Clic en "Iniciar Health Check")</span>
                <span className="text-blue-400 font-bold">{assessmentStarts} ({landingVisits > 0 ? ((assessmentStarts / landingVisits) * 100).toFixed(1) : '0.0'}%)</span>
              </div>
              <div className="w-full bg-[#07192F] h-8 rounded-xl overflow-hidden p-1 border border-[#1E3A5F]">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-lg flex items-center justify-end px-3 text-[10px] text-white font-bold transition-all duration-500"
                  style={{ width: landingVisits > 0 && assessmentStarts > 0 ? `${Math.max(4, (assessmentStarts / landingVisits) * 100)}%` : '0%' }}
                >
                  {landingVisits > 0 ? ((assessmentStarts / landingVisits) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>3. Assessment Complete (Respondió 25 preguntas)</span>
                <span className="text-indigo-400 font-bold">{assessmentCompletes} ({landingVisits > 0 ? ((assessmentCompletes / landingVisits) * 100).toFixed(1) : '0.0'}%)</span>
              </div>
              <div className="w-full bg-[#07192F] h-8 rounded-xl overflow-hidden p-1 border border-[#1E3A5F]">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-lg flex items-center justify-end px-3 text-[10px] text-white font-bold transition-all duration-500"
                  style={{ width: landingVisits > 0 && assessmentCompletes > 0 ? `${Math.max(4, (assessmentCompletes / landingVisits) * 100)}%` : '0%' }}
                >
                  {landingVisits > 0 ? ((assessmentCompletes / landingVisits) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>4. Lead Capture (Formulario de contacto completado)</span>
                <span className="text-amber-400 font-bold">{leadCaptures} ({landingVisits > 0 ? ((leadCaptures / landingVisits) * 100).toFixed(1) : '0.0'}%)</span>
              </div>
              <div className="w-full bg-[#07192F] h-8 rounded-xl overflow-hidden p-1 border border-[#1E3A5F]">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-lg flex items-center justify-end px-3 text-[10px] text-white font-bold transition-all duration-500"
                  style={{ width: landingVisits > 0 && leadCaptures > 0 ? `${Math.max(4, (leadCaptures / landingVisits) * 100)}%` : '0%' }}
                >
                  {landingVisits > 0 ? ((leadCaptures / landingVisits) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>5. Review Request (Solicitó revisión de 30 min con FABRIC)</span>
                <span className="text-emerald-400 font-bold">{reviewRequests} ({landingVisits > 0 ? ((reviewRequests / landingVisits) * 100).toFixed(1) : '0.0'}%)</span>
              </div>
              <div className="w-full bg-[#07192F] h-8 rounded-xl overflow-hidden p-1 border border-[#1E3A5F]">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-lg flex items-center justify-end px-3 text-[10px] text-white font-bold transition-all duration-500"
                  style={{ width: landingVisits > 0 && reviewRequests > 0 ? `${Math.max(4, (reviewRequests / landingVisits) * 100)}%` : '0%' }}
                >
                  {landingVisits > 0 ? ((reviewRequests / landingVisits) * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Abandono por Pregunta */}
        <div className="p-6 md:p-8 rounded-2xl bg-[var(--bg-panel)] border border-[#1E3A5F] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#1E3A5F] pb-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <AlertCircle className="text-amber-400" size={18} /> Gráfico de Abandono & Fricción por Pregunta (P1 a P25)
              </h3>
              <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                Identifica en qué número de pregunta exacta la gente abandona más el assessment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questionDropOffs.map((q, idx) => {
              const rateVal = parseFloat(q.dropOffRate);
              const isHigh = rateVal > 4.5;
              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border flex items-center justify-between font-mono text-xs transition-all ${
                    isHigh ? 'bg-red-950/20 border-red-500/40 text-red-300' : 'bg-[#07192F] border-[#1E3A5F] text-slate-300'
                  }`}
                >
                  <span className="truncate pr-2">{q.question}</span>
                  <span className={`font-bold px-2 py-0.5 rounded border text-[11px] shrink-0 ${
                    isHigh ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-[#123254] border-[#1E3A5F] text-blue-300'
                  }`}>
                    {q.dropOffRate} {isHigh && '⚠️ Fricción alta'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
