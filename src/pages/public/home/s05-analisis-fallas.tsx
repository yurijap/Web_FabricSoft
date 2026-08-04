import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "../../../config/api";

// --- HOOK DE ANIMACIÓN ---
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); 
        }
      },
      { threshold, rootMargin: "50px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// --- ICONOS ---
function ArrowIcon() {
  return (
    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M13 6L19 12L13 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// =========================================================================
// PREGUNTAS DEL DIAGNÓSTICO
// =========================================================================
const QUESTIONS = [
  { id: 1,  text: "¿Hace cuánto está implementado tu Oracle Fusion?",                          options: ["Menos de 3 meses", "3–6 meses", "6–12 meses", "Más de 1 año"] },
  { id: 2,  text: "¿Cuántos días toma tu cierre contable mensual actualmente?",                options: ["Menos de 5 días", "5–10 días", "10–15 días", "Más de 15 días"] },
  { id: 3,  text: "¿Cuántos reportes ejecutivos se generan FUERA del ERP actualmente?",        options: ["0", "1–3", "4–7", "Más de 7"] },
  { id: 4,  text: "¿Cuál es el % aproximado de usuarios clave que realmente usan el sistema?", options: [">90%", "70–90%", "50–70%", "<50%"] },
  { id: 5,  text: "¿Cuántas incidencias críticas tienes abiertas?",                            options: ["0", "1–3", "4–7", "Más de 7"] },
  { id: 6,  text: "¿Cuál es el estado de la consultora que implementó?",                       options: ["Sigue activa", "Soporte limitado", "No responde", "No aplica"] },
  { id: 7,  text: "¿Tienes patrocinio ejecutivo activo del proyecto?",                         options: ["CFO + CTO", "CFO o CTO", "Solo IT", "Sin patrocinio"] },
  { id: 8,  text: "¿Cuál es el módulo con más problemas?",                                     options: ["Financials", "Procurement", "SCM", "HCM", "Reporting"] },
  { id: 9,  text: "¿En qué industria opera tu empresa?",                                       options: ["Servicios Financieros", "Inmobiliario", "Logística", "Otro"] },
  { id: 10, text: "¿Cuál es el revenue anual aproximado de tu empresa?",                       options: ["< USD 50M", "USD 50–250M", "USD 250–500M", "> USD 500M"] },
  { id: 11, text: "¿En qué plazo deseas remediar la situación?",                               options: ["Inmediato (< 3 meses)", "Corto (3–6 meses)", "Medio (6–12 meses)", "No definido"] },
];

function answerScore(questionId: number, answer: string) {
  const question = QUESTIONS.find((item) => item.id === questionId);
  if (!question) return 0;
  const index = question.options.indexOf(answer);

  if (questionId === 8 || questionId === 9) return 0;
  if (questionId === 10) return index === 0 ? 0 : 1;
  return Math.max(index, 0);
}

function getDiagnosticResult(answers: Record<number, string>) {
  const total = Object.entries(answers).reduce((sum, [questionId, answer]) => sum + answerScore(Number(questionId), answer), 0);
  const closing = answers[2];
  const reports = answers[3];
  const adoption = answers[4];
  const incidents = answers[5];
  const consultant = answers[6];

  const patterns = [
    (reports === "4–7" || reports === "Más de 7") && "Reportes manuales paralelos",
    (closing === "10–15 días" || closing === "Más de 15 días") && "Cierre contable >10 días",
    (adoption === "50–70%" || adoption === "<50%") && "Baja adopción de usuarios clave",
    (incidents === "4–7" || incidents === "Más de 7") && "Incidencias críticas abiertas",
    (consultant === "Soporte limitado" || consultant === "No responde") && "Riesgo por consultora anterior",
  ].filter(Boolean) as string[];

  if (total >= 20) {
    return {
      level: "CRÍTICO",
      tone: "#B85450",
      description: "Tu implementación presenta señales de crisis operativa activa.",
      action: "Rescate FABRIC prioritario en 6-10 semanas.",
      investment: "USD 200K-500K",
      roi: "6-9 meses",
      pattern: patterns.length ? patterns.join(" + ") : "Riesgo operativo acumulado",
    };
  }

  if (total >= 13) {
    return {
      level: "ALTO",
      tone: "#B85450",
      description: "Tu implementación presenta señales de abandono post go-live.",
      action: "Rescate FABRIC en 8-12 semanas.",
      investment: "USD 150K-300K",
      roi: "6-9 meses",
      pattern: patterns.length ? patterns.join(" + ") : "Fricción operativa post go-live",
    };
  }

  if (total >= 7) {
    return {
      level: "MEDIO",
      tone: "#C9A96E",
      description: "Tu implementación muestra fricción operativa que puede escalar en el siguiente cierre.",
      action: "Diagnóstico técnico senior en las próximas 4 semanas.",
      investment: "Por definir tras evaluación",
      roi: "Variable según alcance",
      pattern: patterns.length ? patterns.join(" + ") : "Señales tempranas de fricción",
    };
  }

  return {
    level: "BAJO",
    tone: "#8A8A8A",
    description: "Tu implementación no muestra señales críticas de rescate inmediato.",
    action: "Optimización puntual o revisión de estabilidad.",
    investment: "No aplica a rescate urgente",
    roi: "No aplica",
    pattern: patterns.length ? patterns.join(" + ") : "Operación aparentemente estable",
  };
}

// =========================================================================
// MODAL INTERACTIVO DE DIAGNÓSTICO (WIZARD PREMIUM)
// =========================================================================
function DiagnosticModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const createCaptcha = () => {
    const a = Math.floor(Math.random() * 8) + 3;
    const b = Math.floor(Math.random() * 7) + 2;
    return { a, b, answer: a + b };
  };

  const [step, setStep] = useState(0); 
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  // Datos del formulario
  const [honeypot, setHoneypot] = useState("");
  const [captcha, setCaptcha] = useState(createCaptcha);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [contact, setContact] = useState({
    name: "",
    role: "",
    email: "",
    company: "",
    phone: "",
  });

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(0);
        setAnswers({});
        setHoneypot("");
        setCaptcha(createCaptcha());
        setCaptchaAnswer("");
        setAuthorized(false);
        setFormError("");
        setIsProcessing(false);
        setContact({ name: "", role: "", email: "", company: "", phone: "" });
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refreshCaptcha = () => {
    setCaptcha(createCaptcha());
    setCaptchaAnswer("");
  };

  // Lógica de Selección Premium
  const handleAnswerSelect = (questionId: number, answer: string) => {
    if (answers[questionId]) return; // Evita doble clic
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Pausa dramática para mostrar la selección en dorado antes de avanzar
    setTimeout(() => {
      setStep(prev => prev === 11 ? 12 : prev + 1);
    }, 650);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (honeypot.length > 0) return; // Trampa anti-bot silenciosa

    const publicEmail = /(gmail|hotmail|outlook|yahoo)\./i.test(contact.email);
    const cLevelRole = /(cfo|cio|cto|ceo|director|vp|presidente|finanzas|tecnolog)/i.test(contact.role);

    if (!contact.name.trim() || !contact.role.trim() || !contact.company.trim() || !contact.email.trim()) {
      setFormError("Completa nombre, cargo, empresa y email corporativo.");
      return;
    }

    if (contact.name.trim().length > 80) {
      setFormError("El nombre no puede superar 80 caracteres.");
      return;
    }

    if (contact.phone && !/^\d{10}$/.test(contact.phone)) {
      setFormError("El teléfono debe tener exactamente 10 dígitos.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email) || publicEmail) {
      setFormError("Usa un email corporativo. No se aceptan dominios públicos.");
      return;
    }

    if (!cLevelRole) {
      setFormError("El diagnóstico está reservado para CFO, CIO, CTO, CEO o dirección ejecutiva equivalente.");
      return;
    }

    if (Number(captchaAnswer) !== captcha.answer) {
      setFormError("La validación de seguridad no coincide. Inténtalo de nuevo.");
      refreshCaptcha();
      return;
    }

    if (!authorized) {
      setFormError("Requerimos tu autorización explícita para auditar estos datos.");
      return;
    }

    try {
      setIsProcessing(true);

      await api.post('/diagnostico-oracle', {
        answers,
        contact,
        honeypot,
        captcha: {
          a: captcha.a,
          b: captcha.b,
        },
        captchaAnswer,
        authorized,
      });

      setIsProcessing(false);
      setStep(14); 
    } catch (error: any) {
      setIsProcessing(false);
      setFormError(error.response?.data?.error || "No pudimos guardar el diagnóstico. Inténtalo de nuevo.");
      refreshCaptcha();
    }
  };

  const diagnostic = getDiagnosticResult(answers);
  const progressPercentage = step > 0 && step <= 11 ? (step / 12) * 100 : step === 12 || step === 13 ? 100 : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-[fadeIn_0.3s_ease-out]">
      
      <style>{`
        @keyframes slideInFade {
          0% { opacity: 0; transform: translateX(20px) scale(0.98); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-step {
          animation: slideInFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="relative flex flex-col w-full max-w-[700px] min-h-[550px] max-h-[90vh] overflow-hidden bg-[#080706] border border-[#2A2A2A] shadow-[0_0_80px_rgba(0,0,0,0.8)] rounded-xl">
        
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#C9A96E] opacity-[0.03] blur-[100px]" />

        {/* Header del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2A2A]/60 bg-[#050203]">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A96E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A96E]"></span>
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
              Terminal de Diagnóstico FABRIC
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-[#888] hover:text-[#C9A96E] transition-colors rounded-full hover:bg-white/5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Barra de Progreso */}
        {step > 0 && step <= 13 && (
          <div className="w-full h-[2px] bg-[#1A1A1A]">
            <div 
              className="h-full bg-gradient-to-r from-[#C9A96E]/50 to-[#C9A96E] transition-all duration-700 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 sm:p-12 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#2A2A2A]">
          
          {/* ================= PASO 0 ================= */}
          {step === 0 && (
            <div className="animate-step h-full flex flex-col justify-center">
              <h3 className="font-serif text-3xl md:text-4xl text-[#F5F5F5] mb-4">
                Auditoría Ejecutiva de Riesgo
              </h3>
              <p className="font-sans text-base text-[#F5F5F5]/60 mb-10 leading-relaxed max-w-[500px]">
                Identificaremos si tu implementación Oracle califica para un protocolo de rescate. El proceso toma 5 minutos y requiere total transparencia corporativa.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                <div className="border border-[#2A2A2A] bg-[#111]/50 p-5 rounded-md text-center">
                  <span className="block text-[#C9A96E] font-serif text-2xl mb-1">12</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/50">Preguntas</span>
                </div>
                <div className="border border-[#2A2A2A] bg-[#111]/50 p-5 rounded-md text-center">
                  <span className="block text-[#C9A96E] font-serif text-2xl mb-1">5m</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/50">Tiempo Est.</span>
                </div>
                <div className="border border-[#2A2A2A] bg-[#111]/50 p-5 rounded-md text-center">
                  <span className="block text-[#C9A96E] font-serif text-2xl mb-1">100%</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/50">Confidencial</span>
                </div>
              </div>

              <button 
                onClick={() => setStep(1)}
                className="btn-primary w-full"
              >
                Iniciar Escaneo Técnico
                <ArrowIcon />
              </button>
            </div>
          )}

          {/* ================= PASOS 1-11: DIAGNOSTICO OPERATIVO ================= */}
          {step > 0 && step <= 11 && (
            <div key={`question-${step}`} className="animate-step h-full flex flex-col justify-center">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F5F5F5]/40 mb-4 flex items-center gap-2">
                <span className="text-[#C9A96E]">[{String(step).padStart(2, '0')}]</span> de 12
              </span>
              
              <h3 className="font-serif text-2xl md:text-[32px] text-[#F5F5F5] leading-[1.3] mb-10">
                {QUESTIONS[step - 1].text}
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {QUESTIONS[step - 1].options.map((opt, idx) => {
                  const isSelected = answers[QUESTIONS[step - 1].id] === opt;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(QUESTIONS[step - 1].id, opt)}
                      disabled={!!answers[QUESTIONS[step - 1].id]} // Deshabilita tras seleccionar
                      className={`relative w-full text-left p-5 md:p-6 border rounded-sm transition-all duration-400 font-sans text-sm md:text-base leading-relaxed flex items-center justify-between group overflow-hidden
                        ${isSelected 
                          ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E] shadow-[0_0_25px_rgba(201,169,110,0.15)] scale-[1.02]' 
                          : 'border-[#2A2A2A] bg-[#111]/50 text-[#F5F5F5]/70 hover:border-[#C9A96E]/50 hover:bg-[#1A1A1A] hover:text-[#F5F5F5]'
                        }
                      `}
                    >
                      <span className="relative z-10 pr-6">{opt}</span>
                      
                      {/* Círculo indicador / Check dorado */}
                      <div className={`relative z-10 shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300
                        ${isSelected ? 'border-[#C9A96E] bg-[#C9A96E] text-[#0A0A0A]' : 'border-[#444] group-hover:border-[#C9A96E]/50'}`}>
                        {isSelected && <CheckIcon className="w-3 h-3" />}
                      </div>

                      {/* Resplandor interno de selección */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A96E]/5 to-transparent animate-[wave_1.5s_ease-in-out_infinite]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= PASO 12: OUTPUT INMEDIATO ================= */}
          {step === 12 && (
            <div key="step-12" className="animate-step">
              <div className="mb-8">
                <span className="inline-flex mb-3 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E] rounded-sm">
                  Resultado inmediato
                </span>
                <h3 className="font-serif text-3xl text-[#F5F5F5] md:text-4xl tracking-tight mb-4">
                  Nivel de severidad: <span style={{ color: diagnostic.tone }}>{diagnostic.level}</span>
                </h3>
                <p className="font-sans text-base text-[#F5F5F5]/65 leading-relaxed">
                  {diagnostic.description}
                </p>
              </div>

              <div className="border border-[#2A2A2A] bg-[#111]/60 rounded-sm overflow-hidden">
                <div className="p-5 border-b border-[#2A2A2A]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#C9A96E] mb-2">Patrón detectado</p>
                  <p className="font-serif text-2xl text-[#F5F5F5] leading-tight">{diagnostic.pattern}</p>
                </div>
                <div className="grid gap-px bg-[#2A2A2A] sm:grid-cols-3">
                  <div className="bg-[#111] p-5">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/40 mb-2">Acción recomendada</p>
                    <p className="font-sans text-sm text-[#F5F5F5]/80">{diagnostic.action}</p>
                  </div>
                  <div className="bg-[#111] p-5">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/40 mb-2">Inversión típica</p>
                    <p className="font-sans text-sm text-[#C9A96E]">{diagnostic.investment}</p>
                  </div>
                  <div className="bg-[#111] p-5">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/40 mb-2">ROI esperado</p>
                    <p className="font-sans text-sm text-[#F5F5F5]/80">{diagnostic.roi}</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setStep(13)} className="btn-primary mt-8 w-full">
                Solicitar evaluación detallada
                <ArrowIcon />
              </button>
            </div>
          )}

          {/* ================= PASO 13: FORMULARIO ================= */}
          {step === 13 && (
            <div key="step-13" className="animate-step">
              <div className="mb-8">
                <span className="inline-flex mb-3 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E] rounded-sm">
                  Pregunta 12 de 12
                </span>
                <h3 className="font-serif text-3xl text-[#F5F5F5] md:text-4xl tracking-tight mb-4">
                  Datos de contacto para la evaluación detallada
                </h3>
                
                {/* Mensaje de Exclusividad */}
                <div className="border-l-2 border-[#C9A96E] bg-gradient-to-r from-[#C9A96E]/10 to-transparent p-4 mb-6">
                  <p className="font-sans text-sm text-[#F5F5F5]/80 leading-relaxed">
                    FABRIC no acepta todos los proyectos de rescate. El equipo de <span className="font-bold text-[#C9A96E]">Ingeniería Crítica</span> auditará la veracidad de estos datos para determinar la viabilidad operativa y financiera del caso.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <input type="text" name="hp_field" className="opacity-0 absolute -z-10 w-0 h-0" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e)=>setHoneypot(e.target.value)} />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Nombre directivo</span>
                    <input required type="text" maxLength={80} value={contact.name} onChange={(e) => setContact(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-[#050203] border border-[#2A2A2A] rounded-sm px-4 py-3.5 text-sm text-[#F5F5F5] outline-none focus:border-[#C9A96E] focus:shadow-[0_0_15px_rgba(201,169,110,0.1)] transition-all" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Cargo (Ej. CFO / CIO)</span>
                    <input required type="text" value={contact.role} onChange={(e) => setContact(prev => ({ ...prev, role: e.target.value }))} className="w-full bg-[#050203] border border-[#2A2A2A] rounded-sm px-4 py-3.5 text-sm text-[#F5F5F5] outline-none focus:border-[#C9A96E] focus:shadow-[0_0_15px_rgba(201,169,110,0.1)] transition-all" />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Correo corporativo oficial</span>
                    <input required type="email" value={contact.email} onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-[#050203] border border-[#2A2A2A] rounded-sm px-4 py-3.5 text-sm text-[#F5F5F5] outline-none focus:border-[#C9A96E] focus:shadow-[0_0_15px_rgba(201,169,110,0.1)] transition-all" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Nombre de la Empresa</span>
                    <input required type="text" value={contact.company} onChange={(e) => setContact(prev => ({ ...prev, company: e.target.value }))} className="w-full bg-[#050203] border border-[#2A2A2A] rounded-sm px-4 py-3.5 text-sm text-[#F5F5F5] outline-none focus:border-[#C9A96E] focus:shadow-[0_0_15px_rgba(201,169,110,0.1)] transition-all" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.15em] text-[#F5F5F5]/50">Teléfono (opcional)</span>
                  <input type="tel" inputMode="numeric" maxLength={10} value={contact.phone} onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }))} placeholder="10 dígitos" className="w-full bg-[#050203] border border-[#2A2A2A] rounded-sm px-4 py-3.5 text-sm text-[#F5F5F5] outline-none focus:border-[#C9A96E] focus:shadow-[0_0_15px_rgba(201,169,110,0.1)] transition-all placeholder:text-[#F5F5F5]/20" />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px] sm:items-end bg-[#111]/30 p-4 border border-[#2A2A2A] rounded-sm">
                  <div>
                    <span className="block font-mono text-[9px] uppercase tracking-[0.15em] text-[#C9A96E]">Protocolo Anti-Bot</span>
                    <p className="mt-1 text-sm text-[#F5F5F5]/65">Autenticación requerida: <span className="font-mono font-bold text-[#F5F5F5]">{captcha.a} + {captcha.b}</span></p>
                  </div>
                  <input required type="number" inputMode="numeric" value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} placeholder="Suma" className="w-full bg-[#050203] border border-[#2A2A2A] rounded-sm px-4 py-3 text-center text-sm text-[#F5F5F5] outline-none focus:border-[#C9A96E] transition-all" />
                </div>

                <label className="flex items-start gap-4 p-2 cursor-pointer group">
                  <input required type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-1 h-4 w-4 accent-[#C9A96E]" />
                  <span className="text-xs leading-5 text-[#F5F5F5]/60 group-hover:text-[#F5F5F5]/90 transition-colors">
                    Autorizo formalmente a FABRIC SOFT MEXICO SA DE CV a procesar estos datos bajo estricto acuerdo de confidencialidad (NDA implícito) para emitir un veredicto técnico.
                  </span>
                </label>

                {formError && (
                  <div className="animate-step border border-[#B85450] bg-[#B85450]/10 p-4 rounded-sm flex items-center gap-3">
                    <p className="text-xs text-[#E7A09D] font-mono">{formError}</p>
                  </div>
                )}

                <button type="submit" disabled={isProcessing} className="btn-primary mt-4 w-full disabled:opacity-50 disabled:cursor-wait">
                  {isProcessing ? "Cifrando y Enviando..." : "Enviar a Ingeniería Crítica"}
                  {!isProcessing && <ArrowIcon />}
                </button>
              </form>
            </div>
          )}

          {/* ================= PASO 14: ÉXITO ================= */}
          {step === 14 && (
            <div key="step-14" className="animate-step h-full flex flex-col items-center justify-center text-center">
              <div className="mb-8 relative flex h-24 w-24 items-center justify-center rounded-full border border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E] shadow-[0_0_40px_rgba(201,169,110,0.2)]">
                <div className="absolute inset-0 rounded-full border border-[#C9A96E] animate-[ping_2s_ease-out_infinite] opacity-30" />
                <CheckIcon className="w-8 h-8" />
              </div>
              
              <h3 className="font-serif text-3xl md:text-4xl text-[#F5F5F5] mb-4">
                Expediente Cifrado y Recibido
              </h3>
              
              <p className="font-sans text-base leading-relaxed text-[#F5F5F5]/60 max-w-lg mb-4">
                La data ha sido transferida de manera segura. Nuestro comité técnico está realizando el análisis cruzado de tus 12 métricas operativas.
              </p>
              
              <div className="inline-block border border-[#2A2A2A] bg-[#111]/50 px-6 py-3 rounded-sm mb-10">
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#C9A96E]">
                  Resolución estimada: Máx. 5 Días Hábiles
                </p>
              </div>

              <button onClick={onClose} className="border-b border-[#2A2A2A] font-mono text-[11px] uppercase tracking-[0.2em] text-[#888] pb-1 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors duration-300">
                Cerrar Terminal
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// =========================================================================
// COMPONENTE PRINCIPAL (La Landing Section)
// =========================================================================
export default function Parte5Home() {
  const { ref: headerRef, isInView: headerInView } = useInView(0.2);
  const { ref: previewRef, isInView: previewInView } = useInView(0.2);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const features = [
    "Patrones de fracaso identificados según síntomas",
    "Estimación de complejidad de rescate",
    "Plan de remediación accionable",
    "Costos y plazos estimados"
  ];

  return (
    <section id="rescue-diagnostic" className="relative w-full overflow-hidden bg-[#050203] py-24 text-[#F5F5F5] md:py-32">
      
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute right-0 top-1/2 -z-10 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/4 bg-[#C9A96E] opacity-[0.03] blur-[150px]" />

      <div className="relative z-10 mx-auto max-w-[1300px] px-6 md:px-12">
        <div className="grid gap-16 lg:grid-cols-[1fr_0.9fr] lg:items-center xl:gap-20">
          
          {/* ================= LEFT: COPYWRITING ================= */}
          <div ref={headerRef} className={`relative flex flex-col justify-center transition-all duration-1000 ${headerInView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>
            
            <div className="mb-6 inline-flex w-fit items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/5 px-4 py-1.5 rounded-sm backdrop-blur-sm">
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
                Lead Magnet · Rescue Diagnostic
              </span>
            </div>

            <h2 className="font-serif text-[38px] leading-[1.05] md:text-[54px] lg:text-[60px] text-[#F5F5F5] tracking-tight mb-6">
              ¿Tu Oracle Fusion está implementado pero <span className="text-[#C9A96E] italic">el negocio sigue sufriendo?</span>
            </h2>

            <p className="text-base md:text-lg leading-relaxed text-[#F5F5F5]/60 mb-10 max-w-[580px]">
              Si tienes cierre contable pesado, reportes manuales paralelos, usuarios sin adopción o incidencias críticas, FABRIC realiza un <span className="text-[#F5F5F5]">diagnóstico ejecutivo en 5 días hábiles</span>.
            </p>

            <div className="space-y-4 mb-12">
              {features.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E]">
                    <CheckIcon />
                  </div>
                  <p className="font-sans text-[15px] leading-relaxed text-[#F5F5F5]/80">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-start gap-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn-primary"
              >
                Auditar Implementación
                <ArrowIcon />
              </button>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#F5F5F5]/30 ml-1">
                12 preguntas · 5 minutos · Resolución en 5 días
              </p>
            </div>
          </div>

          {/* ================= RIGHT: LIVE PREVIEW ================= */}
          <div ref={previewRef} className={`relative flex-col justify-center lg:flex transition-all duration-1000 delay-300 ${previewInView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>
            <div className="relative border border-[#2A2A2A] bg-[#080706] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.8)] md:p-8 rounded-xl hover:border-[#C9A96E]/30 transition-colors duration-500">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#C9A96E]/50 to-transparent" />

              <div className="mb-6 flex items-center justify-between border-b border-[#2A2A2A]/60 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
                    Live Preview
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#F5F5F5]/40">Diagnostic_Report.pdf</span>
              </div>

              <div className="border border-[#2A2A2A] bg-[#111] rounded-sm overflow-hidden">
                <div className="bg-red-950/20 border-b border-[#B85450]/30 px-6 py-4 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#F5F5F5]/60">Nivel de Severidad</span>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#B85450] animate-pulse" />
                    <span className="font-mono text-[11px] font-bold tracking-widest text-[#E7A09D]">ALTO</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-[#2A2A2A]">
                  <div className="bg-[#111] p-5 hover:bg-[#161616] transition-colors">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/40 mb-2">Cierre Contable</p>
                    <p className="font-serif text-2xl text-[#E7A09D]">&gt;15 días</p>
                  </div>
                  <div className="bg-[#111] p-5 hover:bg-[#161616] transition-colors">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/40 mb-2">Reportes Manuales</p>
                    <p className="font-serif text-2xl text-[#F5F5F5]">12 activos</p>
                  </div>
                  <div className="bg-[#111] p-5 hover:bg-[#161616] transition-colors">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/40 mb-2">Adopción Usuarios</p>
                    <p className="font-serif text-2xl text-[#E7A09D]">42%</p>
                  </div>
                  <div className="bg-[#111] p-5 hover:bg-[#161616] transition-colors">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-[#F5F5F5]/40 mb-2">Incidencias Críticas</p>
                    <p className="font-serif text-2xl text-[#F5F5F5]">7 abiertas</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-[#111] to-[#C9A96E]/5 border-t border-[#2A2A2A]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#C9A96E] mb-3">Patrón Detectado</p>
                  <p className="font-serif text-2xl md:text-3xl text-[#F5F5F5] mb-6">Abandono post go-live</p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-[#2A2A2A]/60 gap-3">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-widest text-[#F5F5F5]/40 mb-1">Plazo remediación</p>
                      <p className="font-mono text-[11px] text-[#F5F5F5]/80">8-12 semanas</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-mono text-[8px] uppercase tracking-widest text-[#F5F5F5]/40 mb-1">Inversión Típica</p>
                      <p className="font-mono text-[11px] font-bold text-[#C9A96E]">USD 150K - 300K</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DiagnosticModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
