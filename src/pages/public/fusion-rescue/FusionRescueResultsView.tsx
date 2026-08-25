import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  Clock, 
  Mail, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  FileText,
  Building2,
  Lock,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../../../config/api';
import type { 
  AssessmentResult, 
  ContactData, 
  EnvironmentData, 
  DimensionId 
} from '../../../utils/fusionRescueEngine';
import { DIMENSIONS } from '../../../utils/fusionRescueEngine';

interface FusionRescueResultsViewProps {
  result: AssessmentResult;
  environment: EnvironmentData;
  contact: ContactData;
  submissionId?: string;
  onRestart?: () => void;
}

export const FusionRescueResultsView: React.FC<FusionRescueResultsViewProps> = ({
  result,
  environment,
  contact,
  submissionId,
  onRestart
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [contactPref, setContactPref] = useState<'Email' | 'WhatsApp' | 'Teléfono'>('Email');
  const [phoneNumber, setPhoneNumber] = useState(contact.phone || '');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const getScoreBadge = (score: number) => {
    if (score >= 85) return { text: 'OPTIMIZED', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (score >= 70) return { text: 'STABLE', bg: 'bg-[#C9A96E]/20 text-[#C9A96E] border-[#C9A96E]/40' };
    if (score >= 40) return { text: 'AT RISK', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    return { text: 'CRITICAL', bg: 'bg-red-500/20 text-red-300 border-red-500/40' };
  };

  const badge = getScoreBadge(result.healthScore);

  const getRecommendedPathDetails = (path: string) => {
    switch (path) {
      case 'OPTIMIZE':
        return {
          title: 'Recomendación inicial: OPTIMIZE',
          description: 'La plataforma presenta un alto nivel de madurez operativa y contable. Las oportunidades son puntuales y se pueden abordar con optimizaciones específicas de automatización o analítica avanzada.'
        };
      case 'REMEDIATE':
        return {
          title: 'Recomendación inicial: REMEDIATE',
          description: 'Existen gaps específicos concentrados en pocas dimensiones que pueden corregirse puntualmente sin necesidad de una reingeniería estructural o cambio de arquitectura.'
        };
      case 'RESCUE':
        return {
          title: 'Recomendación inicial: RESCUE',
          description: 'Tus resultados sugieren problemas significativos en varias dimensiones. Antes de continuar resolviendo incidencias de manera aislada, recomendamos identificar patrones y causas raíz para determinar qué debe corregirse, rediseñarse u optimizarse integralmente.'
        };
      case 'REASSESS':
      default:
        return {
          title: 'Recomendación inicial: REASSESS',
          description: 'El diseño, arquitectura, gobierno o modelo operativo presenta desviaciones críticas. Se recomienda una revisión profunda previa para reestructurar la solución y mitigar riesgos financieros y operativos.'
        };
    }
  };

  const pathDetails = getRecommendedPathDetails(result.recommendedPath);

  // Handle Review Submission Modal logic
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // If WhatsApp or Teléfono chosen and phone number is empty, demand phone number
    if ((contactPref === 'WhatsApp' || contactPref === 'Teléfono') && !phoneNumber.trim()) {
      setErrorMessage('Por favor ingresa tu número telefónico o de WhatsApp.');
      return;
    }

    setSubmittingReview(true);

    api.post('/fusion-rescue/track', { event_type: 'review_request', path: '/fusion-rescue' }).catch(() => {});

    try {
      if (submissionId) {
        await api.patch(`/fusion-rescue/${submissionId}/review`, {
          review_requested: true,
          contact_preference: contactPref,
          phone: phoneNumber
        });
      }
    } catch (err) {
      console.error('Error submitting review request:', err);
    } finally {
      setSubmittingReview(false);
      setReviewSubmitted(true);
    }
  };

  return (
    <div className="w-full py-8 px-4 sm:px-8 md:px-12 lg:px-16 text-white font-sans relative">
      
      {/* Header Result Card */}
      <div className="bg-[#0E2747] border border-[#C9A96E]/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#C9A96E]/20">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[11px] font-mono tracking-widest text-[#C9A96E] font-bold uppercase">
                DIAGNÓSTICO EJECUTIVO COMPLETO
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-300">{environment.company} ({environment.solution})</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tu Fusion Health Score
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Preparado para <span className="text-white font-medium">{contact.firstName} {contact.lastName}</span> ({contact.jobTitle})
            </p>
          </div>

          {/* Main Score Display */}
          <div className="flex items-center gap-5 bg-[#07192F] p-5 rounded-2xl border border-[#C9A96E]/30 shrink-0">
            <div className="text-right">
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {result.healthScore} <span className="text-slate-400 text-2xl font-normal">/100</span>
              </div>
              <div className="text-xs text-slate-300 mt-1 font-mono uppercase">Salud Global ERP</div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase border ${badge.bg}`}>
              {badge.text}
            </div>
          </div>
        </div>

        {/* Dynamic Context Paragraph */}
        <p className="text-base text-slate-200 mt-6 leading-relaxed">
          {result.healthScore >= 70
            ? 'Tu evaluación indica que Oracle Fusion está funcionando adecuadamente, aunque existen áreas específicas donde se pueden capturar mayores eficiencias y automatización.'
            : 'Tu evaluación indica que Oracle Fusion está operativamente funcionando, pero existen riesgos relevantes en varias dimensiones que pueden estar reduciendo el valor que el negocio obtiene de la plataforma.'}
        </p>

        {result.criticalFlags.length > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Flags críticos detectados: </span>
              {result.criticalFlags.filter(f => f !== 'UNKNOWN_RESPONSE').join(' · ')}
              {result.unknownFlagsCount > 0 && ` (${result.unknownFlagsCount} respuestas sin certeza)`}
            </div>
          </div>
        )}
      </div>

      {/* Grid: 6 Dimensions Breakdown & Top Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* 6 Dimensions Bars (Col 7) */}
        <div className="lg:col-span-7 bg-[#0E2747] border border-[#C9A96E]/20 rounded-2xl sm:rounded-3xl p-5 sm:p-8 backdrop-blur-xl">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#C9A96E]" />
            Análisis por Dimensión
          </h2>
          <p className="text-xs text-slate-300 mb-6">
            Puntuación ponderada sobre 100 puntos en las 6 dimensiones clave de la arquitectura Oracle Fusion.
          </p>

          <div className="space-y-5">
            {(Object.keys(DIMENSIONS) as DimensionId[]).map((dimKey) => {
              const dimData = result.dimensionResults[dimKey];
              const score = dimData.score;
              let barColor = 'bg-red-500';
              if (score >= 85) barColor = 'bg-emerald-500';
              else if (score >= 70) barColor = 'bg-[#C9A96E]';
              else if (score >= 40) barColor = 'bg-amber-500';

              return (
                <div key={dimKey} className="group">
                  <div className="flex justify-between items-center mb-1.5 text-sm">
                    <span className="font-medium text-slate-100 group-hover:text-[#C9A96E] transition-colors">
                      {dimData.name} <span className="text-xs text-slate-400 font-mono">({Math.round(dimData.weight * 100)}%)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-100">
                      {score} <span className="text-slate-400 text-xs">/100</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#07192F] h-3 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 3 Priorities (Col 5) */}
        <div className="lg:col-span-5 bg-[#0E2747] border border-[#C9A96E]/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#C9A96E] animate-ping" />
              <h2 className="text-xl font-bold text-white">Principales Áreas de Atención</h2>
            </div>
            <p className="text-xs text-slate-300 mb-6">
              Dimensiones con mayor nivel de riesgo ordenadas automáticamente por prioridad.
            </p>

            <div className="space-y-4">
              {result.topPriorities.map((item, idx) => (
                <div key={item.dimensionId} className="p-4 rounded-2xl bg-[#07192F] border border-[#C9A96E]/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase">
                      #{idx + 1} Prioridad
                    </span>
                    <span className="text-xs font-mono text-slate-300 font-bold">
                      {item.score} / 100
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.dimensionId === 'integraciones' && 'Se detectan posibles problemas de estabilidad, monitoreo, reproceso o mantenibilidad de interfaces.'}
                    {item.dimensionId === 'finanzas' && 'Existen señales de dependencia de procesos manuales, conciliaciones o reporting fuera de Fusion.'}
                    {item.dimensionId === 'governance' && 'El modelo actual puede estar reaccionando a incidencias en lugar de eliminar sistemáticamente causas raíz.'}
                    {item.dimensionId === 'procesos' && 'Se evidencian cuellos de botella transaccionales o excepciones gestionadas externamente.'}
                    {item.dimensionId === 'datos' && 'Se detectan discrepancias en datos maestros o falta de gobierno formal de información.'}
                    {item.dimensionId === 'adopcion' && 'Los usuarios trabajan alrededor del ERP en lugar de usar las herramientas nativas.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Path Card */}
      <div className="bg-[#0E2747] border border-[#C9A96E]/40 rounded-3xl p-6 sm:p-8 mb-8 backdrop-blur-xl relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#C9A96E]/15 rounded-2xl border border-[#C9A96E]/40 text-[#C9A96E] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{pathDetails.title}</h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {pathDetails.description}
            </p>
          </div>
        </div>
      </div>

      {/* Commercial Call to Action Banner */}
      <div className="bg-gradient-to-r from-[#8C7243]/30 via-[#07192F] to-[#C9A96E]/15 border border-[#C9A96E]/40 rounded-3xl p-8 text-center relative overflow-hidden">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
            ¿Quieres revisar estos resultados con nosotros?
          </h2>
          <p className="text-sm text-slate-200 mb-8 leading-relaxed">
            Podemos revisar contigo el diagnóstico durante una conversación ejecutiva de 30 minutos y ayudarte a determinar si los problemas requieren una optimización puntual, remediación o una intervención más estructurada.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {reviewSubmitted ? (
              <div className="w-full sm:w-auto px-8 py-4 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold rounded-2xl text-sm flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/10 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Solicitud enviada</span>
              </div>
            ) : (
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full sm:w-auto px-10 py-5 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-black rounded-2xl text-base md:text-lg transition-all border-2 border-[#FFE8A3] flex items-center justify-center gap-3 group cursor-pointer"
              >
                <span>Solicitar revisión de 30 minutos</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#050203]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MODAL SOLICITAR REVISIÓN (ONLY ASKS FOR CONTACT METHOD IF DATA ALREADY EXISTS) */}
      {showReviewModal && (
        <div 
          onClick={() => setShowReviewModal(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-hidden"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#0E2747] border border-[#C9A96E]/40 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fadeIn text-left"
          >
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!reviewSubmitted ? (
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
                    FABRIC FUSION RESCUE
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    Solicitar revisión de 30 minutos
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Revisaremos juntos el diagnóstico para <strong className="text-white">{contact.company || environment.company}</strong>.
                  </p>
                </div>

                {/* Pregunta única */}
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-3">
                    ¿Cuál es la mejor forma de contactarte?
                  </label>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'Email', label: 'Email', icon: Mail },
                      { id: 'WhatsApp', label: 'WhatsApp', icon: MessageSquare },
                      { id: 'Teléfono', label: 'Teléfono', icon: Phone }
                    ].map((item) => {
                      const IconComp = item.icon;
                      const isSel = contactPref === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setContactPref(item.id as any)}
                          style={
                            isSel
                              ? {
                                  backgroundColor: '#C9A96E',
                                  color: '#050203',
                                  borderColor: '#FFE8A3',
                                  borderWidth: '2px',
                                  fontWeight: 900
                                }
                              : {
                                  backgroundColor: '#07192F',
                                  color: '#E2E8F0',
                                  borderColor: '#334155',
                                  borderWidth: '1px'
                                }
                          }
                          className="py-3 px-3 rounded-2xl text-xs transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <IconComp className={`w-4 h-4 ${isSel ? 'text-[#050203]' : 'text-[#C9A96E]'}`} />
                          <span className={isSel ? 'font-black text-[#050203]' : ''}>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pedir número solo si elige WhatsApp o Teléfono y no se tenía número previo */}
                {(contactPref === 'WhatsApp' || contactPref === 'Teléfono') && (
                  <div className="animate-fadeIn">
                    <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C9A96E]" />
                      Número de {contactPref} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+52 55 1234 5678"
                      className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono rounded-xl">
                    {errorMessage}
                  </div>
                )}

                {/* Botón Solicitar revisión */}
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary cursor-pointer w-full"
                >
                  <span>{submittingReview ? 'Enviando solicitud...' : 'Solicitar revisión'}</span>
                  <ArrowRight className="w-4 h-4 text-[#050203]" />
                </button>
              </form>
            ) : (
              /* Success Screen */
              <div className="py-6 text-center space-y-5 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">¡Solicitud recibida!</h3>
                <p className="text-sm text-slate-200 leading-relaxed max-w-sm mx-auto">
                  Gracias. Un integrante del equipo de <strong className="text-white">FABRIC</strong> se pondrá en contacto contigo para coordinar la revisión.
                </p>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FusionRescueResultsView;
