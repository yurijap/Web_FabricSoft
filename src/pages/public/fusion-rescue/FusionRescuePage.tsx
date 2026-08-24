import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  DollarSign, 
  Database, 
  Cpu, 
  Users, 
  LifeBuoy, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  FileCheck2,
  ChevronRight,
  Activity
} from 'lucide-react';
import FusionRescueAssessmentModal from './FusionRescueAssessmentModal';

import { parseUTMParameters } from '../../../utils/fusionRescueEngine';

export const FusionRescuePage: React.FC = () => {
  const [showAssessment, setShowAssessment] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const trackedVisitRef = React.useRef(false);

  // Track landing visit on mount with UTM campaign parameters
  useEffect(() => {
    if (!trackedVisitRef.current) {
      trackedVisitRef.current = true;
      const utmParams = parseUTMParameters();
      fetch('/api/fusion-rescue/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'landing_visit',
          path: '/fusion-rescue',
          ...utmParams
        })
      }).catch(() => {});
    }
  }, []);

  // If path is /fusion-rescue/assessment or URL contains resumeId, start assessment directly
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('resumeId') || location.pathname.includes('/assessment')) {
      setShowAssessment(true);
    }
  }, [location.pathname, location.search]);

  const handleStartAssessment = () => {
    fetch('/api/fusion-rescue/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'assessment_start', path: '/fusion-rescue' })
    }).catch(() => {});
    setShowAssessment(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full min-h-screen bg-[#07192F] text-white font-sans selection:bg-[#C9A96E] selection:text-black pt-28 md:pt-36">
      {/* If assessment wizard is active */}
      {showAssessment ? (
        <div className="py-8 px-4 sm:px-8 md:px-12 lg:px-16 w-full">
          <div className="w-full mb-6 flex justify-between items-center px-2">
            <button
              onClick={() => {
                setShowAssessment(false);
                if (location.pathname.includes('/assessment')) {
                  navigate('/fusion-rescue');
                }
              }}
              className="text-xs font-mono text-slate-300 hover:text-[#C9A96E] flex items-center gap-2 transition-colors cursor-pointer"
            >
              ← Volver a la Landing Page
            </button>
            <span className="text-[10px] font-mono text-[#C9A96E] font-bold uppercase tracking-widest">
              FABRIC CONTENT-TO-PIPELINE ENGINE
            </span>
          </div>
          <FusionRescueAssessmentModal onClose={() => setShowAssessment(false)} isEmbedded={true} />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative pt-12 pb-20 overflow-hidden border-b border-[#C9A96E]/20 w-full bg-[#07192F]">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-[#C9A96E]/15 to-[#8C7243]/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 relative z-10 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#0E2747] border border-[#C9A96E]/40 text-[#C9A96E] text-xs font-mono font-bold tracking-widest uppercase mb-8 shadow-inner">
                <Activity className="w-4 h-4 text-[#C9A96E] animate-pulse" />
                <span>FABRIC FUSION RESCUE HEALTH CHECK™</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 max-w-6xl mx-auto">
                ¿Oracle Fusion está funcionando para el negocio o simplemente está en producción?
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl md:text-2xl text-slate-200 max-w-5xl mx-auto leading-relaxed mb-10 font-normal">
                Evalúa en pocos minutos el estado de tu implementación de <strong className="text-white font-semibold">Oracle Fusion Cloud ERP</strong> e identifica posibles riesgos en procesos, finanzas, datos, integraciones, adopción y soporte.
              </p>

              {/* Primary CTA */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleStartAssessment}
                  className="btn-primary cursor-pointer"
                >
                  <span>Realizar Fusion Health Check</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#050203]" />
                </button>

                {/* Microcopy */}
                <p className="text-xs font-mono text-slate-300 tracking-wider">
                  25 preguntas · Resultado inmediato · Sin costo
                </p>
              </div>
            </div>
          </section>

          {/* Sección: Problema */}
          <section className="py-20 bg-[#0E2747]/90 border-b border-[#C9A96E]/20 w-full">
            <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16">
              <div className="text-center max-w-5xl mx-auto mb-14">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4">
                  Una implementación puede estar técnicamente terminada y seguir teniendo problemas para el negocio.
                </h2>
                <p className="text-base md:text-lg text-slate-300">
                  ¿Te ocurre alguno de estos escenarios en tu día a día operativo?
                </p>
              </div>

              {/* 9 Scenarios Checklist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                  'Finanzas sigue dependiendo demasiado de Excel.',
                  'El cierre financiero requiere demasiadas actividades manuales.',
                  'Existen incidencias que reaparecen constantemente.',
                  'Las integraciones requieren intervención frecuente.',
                  'Los usuarios trabajan alrededor del ERP en lugar de dentro de él.',
                  'Los reportes no entregan la información esperada.',
                  'El backlog de soporte no disminuye.',
                  'Existe dependencia excesiva del partner o del equipo de TI.',
                  'No está claro si los problemas vienen de configuración, procesos, datos, integraciones o adopción.'
                ].map((scenario, index) => (
                  <div 
                    key={index}
                    className="p-6 sm:p-8 rounded-2xl bg-[#123254] border border-[#C9A96E]/30 hover:border-[#C9A96E]/60 transition-all flex items-start gap-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold">
                      !
                    </div>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                      {scenario}
                    </p>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={handleStartAssessment}
                  className="btn-primary cursor-pointer"
                >
                  <span>Evaluar mi implementación</span>
                  <ChevronRight className="w-4 h-4 text-[#C9A96E] group-hover:translate-x-1 transition-transform group-hover:text-white" />
                </button>
              </div>
            </div>
          </section>

          {/* Sección: Qué evaluamos (6 Dimensiones) */}
          <section className="py-14 sm:py-20 border-b border-[#C9A96E]/20 w-full bg-[#07192F]">
            <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16">
              <div className="text-center max-w-5xl mx-auto mb-10 sm:mb-16">
                <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
                  COBERTURA INTEGRAL
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mt-2 mb-4">
                  El Fusion Health Check analiza seis dimensiones
                </h2>
                <p className="text-sm sm:text-base text-slate-300">
                  Un diagnóstico estructurado para evaluar la salud real de tu ERP de punta a punta.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* 1. Procesos */}
                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0E2747] border border-[#C9A96E]/30 hover:border-[#C9A96E]/60 transition-all">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-4 sm:mb-6">
                    <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">1. Procesos</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Determina si Fusion realmente soporta la operación de punta a punta o si existen procesos paralelos y workarounds fuera del sistema.
                  </p>
                </div>

                {/* 2. Finanzas & Reporting */}
                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0E2747] border border-[#C9A96E]/30 hover:border-[#C9A96E]/60 transition-all">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-4 sm:mb-6">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">2. Finanzas & Reporting</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Evalúa cierre, conciliaciones, reporting financiero, estructura contable y dependencia de actividades manuales.
                  </p>
                </div>

                {/* 3. Datos */}
                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0E2747] border border-[#C9A96E]/30 hover:border-[#C9A96E]/60 transition-all">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-4 sm:mb-6">
                    <Database className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">3. Datos</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Analiza calidad, gobierno, consistencia y confiabilidad de los datos maestros y transaccionales migrados.
                  </p>
                </div>

                {/* 4. Integraciones */}
                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0E2747] border border-[#C9A96E]/30 hover:border-[#C9A96E]/60 transition-all">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-4 sm:mb-6">
                    <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">4. Integraciones</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Evalúa estabilidad, monitoreo, manejo de errores y mantenibilidad de las interfaces entre sistemas.
                  </p>
                </div>

                {/* 5. Adopción */}
                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0E2747] border border-[#C9A96E]/30 hover:border-[#C9A96E]/60 transition-all">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-4 sm:mb-6">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">5. Adopción</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Determina si los usuarios realmente trabajan en Fusion y si existe ownership claro de los procesos de negocio.
                  </p>
                </div>

                {/* 6. Governance & Support */}
                <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0E2747] border border-[#C9A96E]/30 hover:border-[#C9A96E]/60 transition-all">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center mb-4 sm:mb-6">
                    <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">6. Governance & Support</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Evalúa backlog, modelo de soporte, ownership, pruebas de actualizaciones y resolución sistemática de causa raíz.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sección: Qué recibirá el usuario */}
          <section className="py-20 bg-[#0E2747]/90 border-b border-[#C9A96E]/20 w-full">
            <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Bullet list */}
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
                      RESULTADOS CLAROS
                    </span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-2">
                      Al finalizar recibirás:
                    </h2>
                  </div>

                  <ul className="space-y-4">
                    {[
                      'Fusion Health Score de 0 a 100.',
                      'Resultado puntual por cada una de las seis dimensiones.',
                      'Identificación de las principales áreas de riesgo operativo.',
                      'Principales prioridades de atención jerarquizadas.',
                      'Recomendación inicial sobre el tipo de intervención necesaria.'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-base text-slate-200">
                        <CheckCircle2 className="w-5 h-5 text-[#C9A96E] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    <button
                      onClick={handleStartAssessment}
                      className="btn-primary cursor-pointer"
                    >
                      <span>Realizar mi Fusion Health Check</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Right Posibles Resultados Cards */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* OPTIMIZE */}
                  <div className="p-6 rounded-2xl bg-[#123254] border border-emerald-500/40">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold rounded-md border border-emerald-500/40 uppercase">
                      OPTIMIZE
                    </span>
                    <p className="text-sm text-slate-200 mt-3 leading-relaxed">
                      La plataforma presenta un nivel alto de madurez y las oportunidades son puntuales.
                    </p>
                  </div>

                  {/* REMEDIATE */}
                  <div className="p-6 rounded-2xl bg-[#123254] border border-[#C9A96E]/40">
                    <span className="px-3 py-1 bg-[#C9A96E]/20 text-[#C9A96E] font-mono text-xs font-bold rounded-md border border-[#C9A96E]/40 uppercase">
                      REMEDIATE
                    </span>
                    <p className="text-sm text-slate-200 mt-3 leading-relaxed">
                      Existen gaps específicos que pueden ser corregidos sin una intervención estructural.
                    </p>
                  </div>

                  {/* RESCUE */}
                  <div className="p-6 rounded-2xl bg-[#123254] border border-amber-500/40">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-mono text-xs font-bold rounded-md border border-amber-500/40 uppercase">
                      RESCUE
                    </span>
                    <p className="text-sm text-slate-200 mt-3 leading-relaxed">
                      Existen problemas en varias dimensiones y es recomendable realizar una revisión integral.
                    </p>
                  </div>

                  {/* REASSESS */}
                  <div className="p-6 rounded-2xl bg-[#123254] border border-red-500/40">
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 font-mono text-xs font-bold rounded-md border border-red-500/40 uppercase">
                      REASSESS
                    </span>
                    <p className="text-sm text-slate-200 mt-3 leading-relaxed">
                      El diseño, arquitectura o modelo operativo puede requerir una revisión más profunda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sección Institucional: ¿Por qué FABRIC? */}
          <section className="py-20 border-b border-[#C9A96E]/20 w-full bg-[#07192F]">
            <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E2747] border border-[#C9A96E]/40 text-slate-200 text-xs font-mono font-semibold mb-6">
                <Building2 className="w-3.5 h-3.5 text-[#C9A96E]" />
                <span>FABRIC SOFT MÉXICO</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                ¿Por qué FABRIC?
              </h2>

              <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-6 max-w-5xl mx-auto">
                <strong className="text-white font-semibold">FABRIC SOFT MÉXICO</strong> ayuda a organizaciones a implementar, optimizar y rescatar entornos empresariales basados en <strong className="text-white font-semibold">Oracle ERP Fusion Cloud, Cloud e Inteligencia Artificial</strong>.
              </p>

              <p className="text-base text-slate-300 leading-relaxed mb-10 max-w-4xl mx-auto">
                Nuestro enfoque no comienza proponiendo una reimplementación. Primero buscamos identificar: <span className="text-slate-100 italic font-medium">qué está fallando, por qué está fallando y cuál es la intervención mínima necesaria para corregirlo.</span>
              </p>

              <button
                onClick={handleStartAssessment}
                className="btn-primary cursor-pointer"
              >
                <span>Evaluar mi implementación</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#050203]" />
              </button>
            </div>
          </section>

          {/* Footer institucional */}
          <footer className="py-12 bg-[#07192F] text-center font-mono text-xs text-slate-300 border-t border-[#C9A96E]/20">
            <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 space-y-3">
              <p className="text-[#C9A96E] font-bold">FABRIC FUSION RESCUE HEALTH CHECK™</p>
              <p>Oracle Fusion Cloud ERP es una marca registrada de Oracle Corporation.</p>
              <p>© {new Date().getFullYear()} FABRIC SOFT MÉXICO. Todos los derechos reservados.</p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default FusionRescuePage;
