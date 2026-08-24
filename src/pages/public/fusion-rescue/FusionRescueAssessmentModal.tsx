import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  ChevronRight,
  HelpCircle,
  Building2,
  Globe,
  Briefcase,
  Users,
  Clock,
  Sparkles,
  User,
  Mail,
  Phone
} from 'lucide-react';
import type { 
  AnswerValue, 
  EnvironmentData, 
  ContactData, 
  AssessmentResult 
} from '../../../utils/fusionRescueEngine';
import { 
  QUESTIONS, 
  DIMENSIONS, 
  ANSWER_OPTIONS, 
  calculateAssessmentResult, 
  parseUTMParameters 
} from '../../../utils/fusionRescueEngine';
import FusionRescueResultsView from './FusionRescueResultsView';

interface FusionRescueAssessmentModalProps {
  onClose?: () => void;
  isEmbedded?: boolean;
}

const CACHE_USER_KEY = 'fusion_rescue_cached_user';
const CACHE_ENV_KEY = 'fusion_rescue_cached_environment';

export const FusionRescueAssessmentModal: React.FC<FusionRescueAssessmentModalProps> = ({
  onClose,
  isEmbedded = false
}) => {
  // Wizard steps: 0 (Environment & Contact Initial), 1..6 (Dimension questions), 7 (Problem & Timing), 8 (Gated Score & Contact), 9 (Results)
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Environment State
  const [environment, setEnvironment] = useState<EnvironmentData>({
    company: '',
    country: 'México',
    industry: 'Servicios Financieros / Fintech',
    solution: 'Oracle Fusion Cloud ERP',
    goLiveAge: '1–2 años',
    role: 'CFO / Finanzas'
  });

  // Contact Form State
  const [contact, setContact] = useState<ContactData>({
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    email: '',
    phone: '',
    privacyAccepted: true
  });

  // Answers State: map questionId (q01..q25) -> AnswerValue
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});

  // Additional Problem & Timing State
  const [mainProblem, setMainProblem] = useState<string>('Cierre financiero');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [timing, setTiming] = useState<string>('Queremos resolverlo durante los próximos 3 meses.');

  // Result & API submission state
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [submissionId, setSubmissionId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDrafting, setIsDrafting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load from cache on mount
  useEffect(() => {
    try {
      const cachedEnv = localStorage.getItem(CACHE_ENV_KEY);
      if (cachedEnv) {
        setEnvironment(JSON.parse(cachedEnv));
      }
      const cachedUser = localStorage.getItem(CACHE_USER_KEY);
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        setContact(parsed);
      }
    } catch (e) {
      console.error('Error loading cached user data:', e);
    }

    // Load submission data if URL contains resumeId
    const params = new URLSearchParams(window.location.search);
    const resumeIdParam = params.get('resumeId');
    if (resumeIdParam) {
      fetch(`/api/fusion-rescue/submission/${resumeIdParam}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const lead = json.data;
            setSubmissionId(lead._id);
            if (lead.session_id) {
              sessionStorage.setItem('fusion_rescue_session_id', lead.session_id);
            }
            // Pre-fill contact details
            setContact((prev) => ({
              ...prev,
              firstName: lead.first_name || lead.nombre || prev.firstName,
              lastName: lead.last_name || lead.apellidos || prev.lastName,
              company: lead.empresa || lead.company_name || prev.company,
              jobTitle: lead.cargo || lead.job_title || prev.jobTitle,
              email: lead.email || prev.email,
              phone: lead.telefono || lead.phone || prev.phone
            }));
            // Pre-fill environment details
            setEnvironment((prev) => ({
              ...prev,
              company: lead.empresa || lead.company_name || prev.company,
              country: lead.country || prev.country,
              solution: lead.fusion_products || prev.solution,
              goLiveAge: lead.go_live_age || prev.goLiveAge,
              role: lead.cargo || lead.job_title || prev.role
            }));
            // Pre-fill answers
            if (lead.answers && typeof lead.answers === 'object' && !Array.isArray(lead.answers)) {
              setAnswers(lead.answers);
            }
            // Jump directly to Step 1
            setCurrentStep(1);
          }
        })
        .catch((e) => console.error('Error resuming assessment:', e));
    }
  }, []);

  // Sync state between environment and contact forms
  useEffect(() => {
    if (environment.company && !contact.company) {
      setContact((prev) => ({ ...prev, company: environment.company }));
    }
  }, [environment.company]);

  // Current dimension questions
  const dimensionKeys = Object.keys(DIMENSIONS);
  const currentDimensionKey = currentStep >= 1 && currentStep <= 6 ? dimensionKeys[currentStep - 1] : null;
  const currentDimensionObj = currentDimensionKey ? DIMENSIONS[currentDimensionKey as keyof typeof DIMENSIONS] : null;
  const currentQuestions = currentDimensionKey ? QUESTIONS.filter((q) => q.dimensionId === currentDimensionKey) : [];

  // Check if current dimension questions are all answered
  const isCurrentDimensionComplete = currentQuestions.length > 0 && currentQuestions.every((q) => !!answers[q.id]);

  // Handle single answer selection with background DB PATCH sync
  const handleAnswerSelect = (questionId: string, value: AnswerValue) => {
    const updatedAnswers = { ...answers, [questionId]: value };
    setAnswers(updatedAnswers);

    fetch('/api/fusion-rescue/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'question_answered',
        question_id: questionId,
        path: '/fusion-rescue'
      })
    }).catch(() => {});

    if (submissionId) {
      const currentAnswersCount = Object.keys(updatedAnswers).length;
      fetch(`/api/fusion-rescue/${submissionId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: updatedAnswers,
          questions_answered_count: currentAnswersCount,
          status: currentAnswersCount >= 25 ? 'Preguntas Respondidas' : 'Incompleto'
        })
      }).catch((err) => console.error('Error auto-syncing progress to DB:', err));
    }
  };

  // Step 0 validation
  const isStep0Valid = contact.firstName.trim() !== '' && contact.email.trim() !== '' && environment.company.trim() !== '';

  const getRegistrationSessionId = () => {
    if (typeof window === 'undefined') return '';
    let sid = sessionStorage.getItem('fusion_rescue_session_id');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('fusion_rescue_session_id', sid);
    }
    return sid;
  };

  // Handle Step 0 Submit (Save to DB as lead initial & cache)
  const handleStep0Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep0Valid) {
      setErrorMessage('Por favor ingresa al menos tu Nombre, Correo Corporativo y Empresa.');
      return;
    }
    setErrorMessage('');
    setIsDrafting(true);

    try {
      localStorage.setItem(CACHE_ENV_KEY, JSON.stringify(environment));
      localStorage.setItem(CACHE_USER_KEY, JSON.stringify(contact));
    } catch (e) {
      console.error('Failed saving to localStorage:', e);
    }

    const utmParams = parseUTMParameters();
    const sessionId = getRegistrationSessionId();
    const activeSubmissionId = submissionId || sessionStorage.getItem('fusion_rescue_submission_id');

    const payload = {
      session_id: sessionId,
      submissionId: activeSubmissionId,
      nombre: contact.firstName,
      apellidos: contact.lastName,
      empresa: environment.company || contact.company,
      email: contact.email,
      telefono: contact.phone,
      cargo: contact.jobTitle || environment.role,
      pais: environment.country,
      industria: environment.industry,
      solucion_oracle: environment.solution,
      antiguedad_golive: environment.goLiveAge,
      status: 'Incompleto',
      questions_answered_count: 0,
      answers: {},
      ...utmParams
    };

    try {
      const res = await fetch('/api/fusion-rescue/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data?._id) {
        setSubmissionId(data.data._id);
        sessionStorage.setItem('fusion_rescue_submission_id', data.data._id);
      }
    } catch (err) {
      console.error('Error saving step 0 draft to DB:', err);
    } finally {
      setIsDrafting(false);
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Preliminary score calculation for Step 8
  const preliminaryResult = calculateAssessmentResult(answers);

  // Final submission from Step 8 (Contact Form confirmation & Full Score View)
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!contact.firstName || !contact.email || !contact.company || !contact.jobTitle) {
      setErrorMessage('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (!contact.privacyAccepted) {
      setErrorMessage('Debes aceptar el Aviso de Privacidad para continuar.');
      return;
    }

    setIsSubmitting(true);

    try {
      localStorage.setItem(CACHE_USER_KEY, JSON.stringify(contact));
      localStorage.setItem(CACHE_ENV_KEY, JSON.stringify(environment));
    } catch (e) {
      console.error('Error saving cache:', e);
    }

    fetch('/api/fusion-rescue/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'assessment_complete', path: '/fusion-rescue' })
    }).catch(() => {});

    fetch('/api/fusion-rescue/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'lead_capture', path: '/fusion-rescue' })
    }).catch(() => {});

    const utmParams = parseUTMParameters();
    const computedResult = calculateAssessmentResult(answers);
    setResult(computedResult);

    const sessionId = getRegistrationSessionId();
    const activeSubmissionId = submissionId || sessionStorage.getItem('fusion_rescue_submission_id');

    const payload = {
      session_id: sessionId,
      submissionId: activeSubmissionId,
      nombre: contact.firstName,
      apellidos: contact.lastName,
      empresa: contact.company || environment.company,
      email: contact.email,
      telefono: contact.phone,
      cargo: contact.jobTitle,
      pais: environment.country,
      industria: environment.industry,
      solucion_oracle: environment.solution,
      antiguedad_golive: environment.goLiveAge,
      problema_principal: mainProblem,
      descripcion_problema: problemDescription,
      timing_prioridad: timing,
      health_score: computedResult.healthScore,
      classification: computedResult.classification,
      recommended_path: computedResult.recommendedPath,
      top_priorities: computedResult.topPriorities,
      dimension_results: computedResult.dimensionResults,
      critical_flags: computedResult.criticalFlags,
      answers: answers,
      questions_answered_count: Object.keys(answers).length,
      status: 'Preguntas Respondidas',
      ...utmParams
    };

    try {
      const res = await fetch('/api/fusion-rescue/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data?._id) {
        setSubmissionId(data.data._id);
      }
    } catch (err) {
      console.error('Error submitting final lead:', err);
    } finally {
      setIsSubmitting(false);
      sessionStorage.removeItem('fusion_rescue_session_id');
      sessionStorage.removeItem('fusion_rescue_submission_id');
      setCurrentStep(9);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`w-full text-white font-sans ${isEmbedded ? '' : 'min-h-screen bg-[#07192F] py-10 px-4 sm:px-6 md:px-12'}`}>
      <div className="w-full bg-[#0E2747] border border-[#C9A96E]/30 rounded-3xl p-6 sm:p-10 md:p-12 shadow-2xl backdrop-blur-xl relative">
        
        {/* Close Button if modal mode */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-300 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}

        {/* STEP 0: ENVIRONMENT SETUP & INITIAL CONTACT */}
        {currentStep === 0 && (
          <form onSubmit={handleStep0Submit} className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#C9A96E]/20 pb-6">
              <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
                FABRIC FUSION RESCUE HEALTH CHECK™
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Antes de comenzar
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                Cuéntanos brevemente sobre tu entorno Oracle para calibrar tu evaluación y guardar tu progreso.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C9A96E]" />
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={contact.firstName}
                  onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                  placeholder="Ej. Carlos"
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#C9A96E]" />
                  Apellido
                </label>
                <input
                  type="text"
                  value={contact.lastName}
                  onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                  placeholder="Ej. Mendoza"
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C9A96E]" />
                  Correo Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="ej. c.mendoza@empresa.com"
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#C9A96E]" />
                  Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={environment.company}
                  onChange={(e) => setEnvironment({ ...environment, company: e.target.value })}
                  placeholder="Ej. Grupo Financiero Bal"
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#C9A96E]" />
                  País
                </label>
                <select
                  value={environment.country}
                  onChange={(e) => setEnvironment({ ...environment, country: e.target.value })}
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors"
                >
                  <option>México</option>
                  <option>Colombia</option>
                  <option>Chile</option>
                  <option>Perú</option>
                  <option>España</option>
                  <option>Estados Unidos</option>
                  <option>Argentina</option>
                  <option>Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#C9A96E]" />
                  Industria
                </label>
                <select
                  value={environment.industry}
                  onChange={(e) => setEnvironment({ ...environment, industry: e.target.value })}
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors"
                >
                  <option>Servicios Financieros / Fintech</option>
                  <option>Retail / Comercio / E-commerce</option>
                  <option>Manufactura / SCM</option>
                  <option>Inmobiliaria / Construcción</option>
                  <option>Tecnología / SaaS</option>
                  <option>Salud / Pharma</option>
                  <option>Educación</option>
                  <option>Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]" />
                  Solución Oracle Implementada
                </label>
                <select
                  value={environment.solution}
                  onChange={(e) => setEnvironment({ ...environment, solution: e.target.value })}
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors"
                >
                  <option>Oracle Fusion Cloud ERP</option>
                  <option>Oracle Fusion Cloud ERP + SCM</option>
                  <option>Oracle Fusion Cloud ERP + EPM</option>
                  <option>Oracle Fusion Cloud ERP + HCM</option>
                  <option>Oracle Fusion Suite Completa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C9A96E]" />
                  Antigüedad del Go-Live
                </label>
                <select
                  value={environment.goLiveAge}
                  onChange={(e) => setEnvironment({ ...environment, goLiveAge: e.target.value })}
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-[#C9A96E] transition-colors"
                >
                  <option>Menos de 6 meses (Reciente)</option>
                  <option>6 meses – 1 año</option>
                  <option>1–2 años</option>
                  <option>3+ años</option>
                  <option>Aún en proceso de implementación</option>
                </select>
              </div>
            </div>

            {errorMessage && (
              <div className="text-xs text-red-400 font-medium text-center bg-red-950/40 p-2.5 rounded-xl border border-red-500/40 font-mono">
                {errorMessage}
              </div>
            )}

            <div className="pt-6 border-t border-[#C9A96E]/20 flex justify-end">
              <button
                type="submit"
                disabled={!isStep0Valid || isDrafting}
                className="btn-primary cursor-pointer"
              >
                <span>{isDrafting ? 'Guardando entorno...' : 'Comenzar evaluación (25 preguntas)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEPS 1 to 6: DIMENSION QUESTION WIZARD */}
        {currentStep >= 1 && currentStep <= 6 && currentDimensionObj && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header progress bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C9A96E]/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] font-mono text-[10px] font-bold uppercase tracking-wider">
                    DIMENSIÓN {currentStep} DE 6
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    ({currentDimensionObj.name})
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {currentDimensionObj.name}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  {currentDimensionObj.description}
                </p>
              </div>

              {/* Step indicator pills */}
              <div className="w-full sm:w-auto flex items-center gap-1.5 pt-2 sm:pt-0">
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 sm:w-7 h-2.5 rounded-full transition-all ${
                      s === currentStep
                        ? 'bg-[#C9A96E]'
                        : s < currentStep
                        ? 'bg-[#C9A96E]/50'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question cards for current dimension */}
            <div className="space-y-6">
              {currentQuestions.map((q) => {
                const currentAnswer = answers[q.id];
                return (
                  <div 
                    key={q.id}
                    className="p-4 sm:p-6 rounded-2xl bg-[#07192F] border border-[#C9A96E]/30 hover:border-[#C9A96E]/60 transition-all space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {q.number}
                      </span>
                      <h3 className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
                        {q.text}
                      </h3>
                    </div>

                    {/* Answer Radio Pills - 1 col on mobile, 2 col on sm, 7 col on lg */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 pl-0 sm:pl-10">
                      {ANSWER_OPTIONS.map((opt) => {
                        const isSelected = currentAnswer === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleAnswerSelect(q.id, opt.value)}
                            style={
                              isSelected
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
                            className="py-3 px-4 sm:px-2.5 rounded-xl text-xs transition-all flex items-center justify-between sm:justify-center gap-2 cursor-pointer min-h-[44px]"
                          >
                            <span className={isSelected ? 'font-black text-[#050203]' : ''}>{opt.label}</span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#050203] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons & helper message */}
            {errorMessage && (
              <div className="p-3 bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs font-mono rounded-xl text-center">
                {errorMessage}
              </div>
            )}

            <div className="pt-6 border-t border-[#C9A96E]/20 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setCurrentStep((prev) => Math.max(0, prev - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer border-2 border-[#C9A96E]/40 hover:border-[#C9A96E]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{currentStep === 1 ? 'Volver a Entorno' : 'Anterior'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isCurrentDimensionComplete) {
                    const unanswered = currentQuestions.filter((q) => !answers[q.id]);
                    setErrorMessage(`Por favor responde las preguntas pendientes de esta dimensión (${unanswered.map(q => `P${q.number}`).join(', ')}) para continuar.`);
                  } else {
                    setErrorMessage('');
                    setCurrentStep((prev) => prev + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`px-7 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-2 ${
                  isCurrentDimensionComplete
                    ? 'bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-black border-[#C9A96E] hover:border-[#FFE8A3]'
                    : 'bg-[#C9A96E]/20 hover:bg-[#C9A96E]/40 text-slate-200 border-[#C9A96E]/50'
                }`}
              >
                <span>{currentStep === 6 ? 'Siguiente: Problema & Prioridad' : 'Siguiente Dimensión'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: ADDITIONAL PROBLEM & TIMING */}
        {currentStep === 7 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-[#C9A96E]/20 pb-4">
              <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
                PREGUNTAS COMPLEMENTARIAS
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Problema Principal & Timing de Atención
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Esta información servirá para entregarte recomendaciones personalizadas de intervención.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-2">
                  Si pudieras resolver un solo problema de tu implementación durante los próximos 90 días, ¿cuál elegirías?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    'Cierre financiero',
                    'Reporting',
                    'Integraciones',
                    'Calidad de datos',
                    'Procesos',
                    'Performance',
                    'Adopción de usuarios',
                    'Backlog de incidencias',
                    'Soporte / partner',
                    'Controles',
                    'Otro'
                  ].map((prob) => (
                    <button
                      key={prob}
                      type="button"
                      onClick={() => setMainProblem(prob)}
                      style={
                        mainProblem === prob
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
                      className="p-3 rounded-xl text-xs text-left transition-all cursor-pointer"
                    >
                      {prob}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-2">
                  Cuéntanos brevemente qué está ocurriendo (opcional)
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe brevemente las incidencias o cuellos de botella..."
                  className="w-full p-4 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#C9A96E]"
                />
                <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                  {problemDescription.length} / 1000 caracteres
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-2">
                  ¿Qué tan prioritario es resolver este problema? (TIMING)
                </label>
                <div className="space-y-2">
                  {[
                    'Ya estamos buscando una solución.',
                    'Queremos resolverlo durante los próximos 3 meses.',
                    'Durante los próximos 3–6 meses.',
                    'Durante los próximos 6–12 meses.',
                    'Por ahora sólo estamos evaluando.'
                  ].map((tOption) => (
                    <button
                      key={tOption}
                      type="button"
                      onClick={() => setTiming(tOption)}
                      style={
                        timing === tOption
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
                      className="w-full p-3 rounded-xl text-xs text-left transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>{tOption}</span>
                      {timing === tOption && <CheckCircle2 className="w-4 h-4 text-[#050203]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#C9A96E]/20 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(6)}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <button
                onClick={() => setCurrentStep(8)}
                className="px-7 py-3 rounded-xl bg-[#C9A96E] hover:bg-[#b8985d] text-[#050203] font-black text-xs transition-all border-2 border-[#C9A96E] flex items-center gap-2 cursor-pointer"
              >
                <span>Generar Score Preliminar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 8: GATED PRELIMINARY SCORE & CONTACT CAPTURE (PRE-FILLED) */}
        {currentStep === 8 && (
          <div className="space-y-6 animate-fadeIn max-w-xl mx-auto">
            {/* Preliminary Score Preview Badge */}
            <div className="bg-[#07192F] border border-[#C9A96E]/30 rounded-2xl p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A96E]/10 rounded-full blur-2xl pointer-events-none" />
              
              <span className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-widest">
                EVALUACIÓN COMPLETADA
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                Tu Fusion Health Score está listo.
              </h2>

              <div className="my-4 inline-flex items-center gap-3 bg-[#0E2747] border border-[#C9A96E]/40 py-3 px-6 rounded-2xl">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  {preliminaryResult.healthScore} <span className="text-slate-400 text-xl font-normal">/100</span>
                </span>
                <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold rounded-lg uppercase">
                  {preliminaryResult.classification}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Identificamos las principales áreas que podrían estar limitando el desempeño de tu implementación. Confirma tus datos para consultar el diagnóstico completo.
              </p>
            </div>

            {/* Pre-fill Notification Badge */}
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3.5 text-xs text-emerald-300 font-mono flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tus datos de contacto se han cargado automáticamente de tu registro inicial.</span>
            </div>

            {/* Contact Form Pre-filled */}
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={contact.firstName}
                    onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                    placeholder="Carlos"
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#C9A96E] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={contact.lastName}
                    onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                    placeholder="Mendoza"
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#C9A96E] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Empresa *</label>
                  <input
                    type="text"
                    required
                    value={contact.company || environment.company}
                    onChange={(e) => setContact({ ...contact, company: e.target.value })}
                    placeholder="Grupo Bal"
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#C9A96E] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Cargo *</label>
                  <input
                    type="text"
                    required
                    value={contact.jobTitle || environment.role}
                    onChange={(e) => setContact({ ...contact, jobTitle: e.target.value })}
                    placeholder="VP de Finanzas / CIO"
                    className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#C9A96E] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Email corporativo *</label>
                <input
                  type="email"
                  required
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="c.mendoza@bal.com.mx"
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#C9A96E] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Teléfono / WhatsApp (opcional)</label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  placeholder="+52 55 1234 5678"
                  className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#C9A96E]"
                />
              </div>

              {/* Privacy Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="privacy"
                  required
                  checked={contact.privacyAccepted}
                  onChange={(e) => setContact({ ...contact, privacyAccepted: e.target.checked })}
                  className="mt-1 rounded bg-[#07192F] border-slate-700 text-[#C9A96E] focus:ring-[#C9A96E] cursor-pointer"
                />
                <label htmlFor="privacy" className="text-[11px] text-slate-300 leading-normal cursor-pointer">
                  He leído y acepto el{' '}
                  <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-[#C9A96E] underline">
                    Aviso de Privacidad
                  </a>{' '}
                  y autorizo el tratamiento de mis datos para consultar el diagnóstico.
                </label>
              </div>

              {errorMessage && (
                <div className="text-xs text-red-400 font-medium text-center bg-red-950/40 p-2.5 rounded-xl border border-red-500/40 font-mono">
                  {errorMessage}
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary cursor-pointer w-full"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'Procesando diagnóstico...' : 'Consultar mi Diagnóstico'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 9: FULL RESULTS REPORT VIEW */}
        {currentStep === 9 && result && (
          <FusionRescueResultsView
            result={result}
            environment={environment}
            contact={contact}
            submissionId={submissionId}
            onRestart={() => setCurrentStep(0)}
          />
        )}
      </div>
    </div>
  );
};

export default FusionRescueAssessmentModal;
