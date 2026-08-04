import { useEffect, useState, useRef, type FormEvent } from "react";
import { api } from "../../../config/api";
import './chatIa.css';

// --- HOOK PARA ANIMACIÓN AL HACER SCROLL ---
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

// --- TIPOS Y DATOS ---
type ScenarioKey = "fusion" | "migration" | "greenfield";

type Scenario = {
  key: ScenarioKey;
  shortLabel: string;
  prompt: string;
  response: string;
};

type AgentCta = {
  type: "apply" | "schedule" | "send_case";
  label: string;
  href: string;
};

type ChatMessage = {
  role: "user" | "agent";
  text: string;
  cta?: AgentCta | null;
  score?: number;
};

const DISCLAIMER = "\n\n— Recomendaciones generales basadas en best practices. Cada caso requiere evaluación específica con un senior de FABRIC. fabricsoft.com.mx/aplicar";

const scenarios: Scenario[] = [
  {
    key: "fusion",
    shortLabel: "Mi Fusion está fallando",
    prompt: "Mi implementación Fusion tiene 6 meses y aún tenemos cierre contable manual. ¿Qué sugieres?",
    response: "Patrón detectado: abandono post go-live.\n\nUn cierre contable manual a los 6 meses indica falta de estabilización técnica. Los síntomas típicos son: reportes paralelos en Excel, baja adopción de usuarios y conciliaciones fuera del ERP.\n\nFABRIC opera bajo doctrina pública: el proyecto no se entrega en el go-live, sino al cierre del primer ciclo crítico operado en producción. Si tu consultora anterior ya no está presente, esto es exactamente el escenario de rescate que atendemos.\n\nPlazo típico de remediación: 8–12 semanas. Inversión estimada: USD 150–300K." + DISCLAIMER,
  },
  {
    key: "migration",
    shortLabel: "Migración SAP/EBS a Fusion",
    prompt: "Queremos migrar desde SAP/EBS a Oracle Fusion con menor riesgo.",
    response: "Escenario: Migración con control de riesgo.\n\nMigraciones SAP S/4 HANA o EBS R12 a Fusion Cloud típicamente toman entre 6 y 18 meses dependiendo de la complejidad, número de módulos y geografías. El riesgo principal no es técnico — es la falta de estabilización post go-live.\n\nFABRIC aplica su doctrina de entrega en primer ciclo crítico: el proyecto no se considera entregado hasta que tu primer cierre contable opera sin incidencias en producción.\n\nPlazo de assessment y diseño: 6–10 semanas. ¿Quieres calcular el TCO comparativo con tu sistema actual?" + DISCLAIMER,
  },
  {
    key: "greenfield",
    shortLabel: "Greenfield Oracle",
    prompt: "Quiero iniciar un greenfield Oracle Fusion sin sobrecostos.",
    response: "Escenario: Greenfield con gobierno desde día cero.\n\nUn greenfield Oracle Fusion en empresa USD 50M+ requiere decisiones críticas tempranas: arquitectura financiera multi-entidad, definición de chart of accounts, diseño de integraciones y gobierno del proyecto antes de que el primer consultor toque la configuración.\n\nEl riesgo más frecuente en greenfield es el scope creep y la definición tardía de criterios de éxito. FABRIC mitiga esto con Fixed-Price por fase y un hito de entrega en primer ciclo crítico, no en go-live.\n\nPlazo típico de discovery y diseño: 4–6 semanas." + DISCLAIMER,
  },
];

// --- ICONS ---
function ArrowIcon() {
  return (
    <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M13 6L19 12L13 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3L13.9 8.1L19 10L13.9 11.9L12 17L10.1 11.9L5 10L10.1 8.1L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// --- TYPEWRITER EFFECT COMPONENT ---
function TypingEffect({ text, isTyping }: { text: string; isTyping: boolean }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    if (!isTyping) {
      setVisibleText(text);
      return;
    }

    setVisibleText("");
    let i = 0;
    const interval = setInterval(() => {
      setVisibleText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 15);

    return () => clearInterval(interval);
  }, [text, isTyping]);

  useEffect(() => {
    const container = document.getElementById("chat-scroll-container");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [visibleText]);

  return (
    <div className="font-sans text-[12px] leading-[1.7] text-[#A0A0A0] whitespace-pre-wrap">
      {visibleText}
      {isTyping && visibleText.length < text.length && (
        <span className="ml-1 inline-block h-[12px] w-[3px] animate-pulse bg-[#C9A96E] align-middle" />
      )}
    </div>
  );
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================
export default function ChatIa() {
  const { ref: sectionRef, isInView } = useInView(0.15);
  
  const [inputValue, setInputValue] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'agent', text: "Sistema de diagnóstico FABRIC IA en línea.\nEscribe tu problema o selecciona un escenario predeterminado." }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionIdRef = useRef(
    window.crypto?.randomUUID?.() || `fabric-ai-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );

  useEffect(() => {
    const container = document.getElementById("chat-scroll-container");
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const askPublicAgent = async (message: string) => {
    const cleanMessage = message.trim();
    if (!cleanMessage || isTyping) return;

    const recentHistory = chatHistory
      .filter((item) => item.text && !item.text.startsWith('Sistema de diagn'))
      .slice(-8);

    setChatHistory(prev => [...prev, { role: 'user', text: cleanMessage }]);
    setIsTyping(true);

    try {
      const { data } = await api.post('/agente-ia/public', {
        message: cleanMessage,
        history: recentHistory,
        sessionId: sessionIdRef.current,
      });

      const reply =
        data?.reply ||
        'Puedo ayudarte a evaluar el caso, pero necesito un poco más de contexto: industria, sistema actual y bloqueo principal.';
      const score = Number(data?.score || 0);
      const cta = data?.cta
        ? {
            ...data.cta,
            href: '/aplicar',
            label: score >= 86 ? 'Agendar cita con FABRIC' : 'Agendar diagnóstico',
          }
        : null;

      setChatHistory(prev => [...prev, { role: 'agent', text: reply, cta, score }]);
    } catch (error: any) {
      const fallbackReply =
        error.response?.data?.error ||
        'Ahora mismo el agente no pudo responder. Intenta de nuevo en unos segundos o comparte tu industria, sistema actual y bloqueo principal para retomar el diagnóstico.';

      setChatHistory(prev => [...prev, { role: 'agent', text: fallbackReply }]);
    } finally {
      window.setTimeout(() => setIsTyping(false), 450);
    }
  };

  const handleScenarioClick = (scenarioKey: ScenarioKey) => {
    const scenario = scenarios.find(s => s.key === scenarioKey);
    if (!scenario) return;

    askPublicAgent(scenario.prompt);
  };

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const message = inputValue;
    setInputValue("");
    askPublicAgent(message);
  };

  const handleFocusChat = () => {
    inputRef.current?.focus();
  };

  const handleCtaClick = async (cta: AgentCta) => {
    try {
      await api.post('/agente-ia/public/action', {
        sessionId: sessionIdRef.current,
        action: cta.type,
      });
    } catch {
      // El CTA debe seguir funcionando aunque el tracking falle.
    } finally {
      window.location.href = cta.href;
    }
  };

  return (
    <section id="fabric-ai" className="chat-section-bg relative w-full overflow-hidden py-24 border-t border-[rgba(240,207,122,0.16)] md:py-32">
      
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 -z-10 m-auto h-[500px] w-[500px] -translate-y-1/2 bg-[#C9A96E] opacity-[0.03] blur-[120px]" />

      <div ref={sectionRef} className="relative z-10 mx-auto max-w-[1360px] px-6 md:px-12">
        <div className="grid gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-center xl:gap-20">
          
          {/* =========================================
              LEFT: COPYWRITING & INTRO
              ========================================= */}
          <div className={`relative transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="inline-flex items-center gap-2 border border-[#C9A96E]/20 bg-[#C9A96E]/5 px-4 py-1.5 rounded-sm mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A96E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C9A96E]"></span>
              </span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
                Fabric AI · Inferencia
              </span>
            </div>

            <h2 className="chat-heading font-serif text-[42px] md:text-[56px] lg:text-[64px] leading-[1.02] mb-7">
              Asistente de diagnóstico <span className="text-[#C9A96E] italic">Oracle</span>.
            </h2>

            <p className="chat-body-text font-sans text-base md:text-lg leading-[1.75] mb-10 max-w-[560px]">
              Evalúa tu infraestructura en segundos. Identifica riesgos ocultos en tu implementación Fusion o planifica migraciones sin sobrecostos usando nuestro motor técnico.
            </p>

            {/* Badges de estado */}
            <div className="chat-stat-border flex flex-wrap gap-8 border-l pl-5">
              <div>
                <p className="chat-label-text font-mono text-[8px] uppercase tracking-widest mb-1">Versión</p>
                <p className="chat-value-text font-mono text-[10.5px] font-bold">FABRIC AI v2.4</p>
              </div>
              <div>
                <p className="chat-label-text font-mono text-[8px] uppercase tracking-widest mb-1">Estado</p>
                <p className="font-mono text-[10.5px] font-bold text-[#C9A96E]">Operational</p>
              </div>
            </div>

            <div className="mt-12">
              <button
                onClick={handleFocusChat}
                className="chat-cta-btn group inline-flex items-center gap-3 border bg-transparent px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.22em] transition-all duration-300 hover:border-[#C9A96E] hover:text-[#C9A96E] hover:bg-[#C9A96E]/[0.04]"
              >
                Activar Consola <ArrowIcon />
              </button>
            </div>
          </div>

          {/* =========================================
              RIGHT: CHATBOX INTERACTIVO (Atelier Grade)
              ========================================= */}
          <div className={`relative w-full max-w-[760px] justify-self-center lg:justify-self-end transition-all duration-1000 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            
            {/* Contenedor principal de la Consola */}
            <div className="chat-console relative flex flex-col rounded-sm group">
              
              <div className="chat-console-border absolute inset-0 z-0 rounded-sm" />

              {/* El interior que enmascara el centro, dejando solo un borde de 1px visible */}
              <div className="chat-console-inner absolute inset-[1px] z-10 flex flex-col rounded-sm transition-shadow duration-500 focus-within:shadow-[inset_0_0_40px_rgba(201,169,110,0.05)]">
                
                {/* Cabecera del chat */}
                <div className="chat-bar chat-console-header flex items-center justify-between border-b px-5 py-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center border border-[#C9A96E]/20 bg-[#C9A96E]/5 text-[#C9A96E] rounded-sm">
                      <SparkIcon />
                    </div>
                    <div>
                      <p className="chat-heading font-mono text-[10.5px] font-bold uppercase tracking-[0.15em]">Diagnostic Engine</p>
                      <p className="chat-label-text font-mono text-[8px] uppercase tracking-wider">Oracle ecosystem ready</p>
                    </div>
                  </div>
                </div>

                {/* Historial del Chat */}
                <div id="chat-scroll-container" className="chat-messages-area flex-1 overflow-y-auto p-5 space-y-6">
                  {chatHistory.map((msg, idx) => {
                    const isAgent = msg.role === 'agent';
                    const animateText = isAgent && idx === chatHistory.length - 1 && isTyping;

                    return (
                      <div key={idx} className={`flex ${isAgent ? 'justify-start' : 'justify-end'} animate-[fadeIn_0.3s_ease-out]`}>
                        <div className={`max-w-[85%] flex flex-col gap-1.5 ${isAgent ? 'items-start' : 'items-end'}`}>
                          
                          <div className="flex items-center gap-1.5 opacity-50">
                            {isAgent ? <SparkIcon /> : <UserIcon />}
                            <span className="chat-heading font-mono text-[8px] uppercase tracking-widest">
                              {isAgent ? 'FABRIC AI' : 'Usuario'}
                            </span>
                          </div>
                          
                          {/* Burbuja mejorada: Textos a 12px y padding ajustado */}
                          <div className={`px-5 py-4 rounded-sm ${
                            isAgent 
                              ? 'chat-agent-bubble border' 
                              : 'chat-user-bubble border font-sans text-[12px]'
                          }`}>
                            {animateText ? (
                              <TypingEffect text={msg.text} isTyping={true} />
                            ) : (
                              <p className={`whitespace-pre-wrap leading-[1.7] ${isAgent ? 'chat-agent-text font-sans text-[12px]' : 'font-sans text-[12px]'}`}>
                                {msg.text}
                              </p>
                            )}
                            {isAgent && msg.cta && (
                              <div className="mt-4 border border-[#C9A96E]/35 bg-[#C9A96E]/[0.07] p-3 shadow-[0_0_28px_rgba(201,169,110,0.08)]">
                                <p className="chat-agent-text mb-3 font-sans text-[12px] leading-5">
                                  Podemos revisar tu caso con más detalle y definir el siguiente paso.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleCtaClick(msg.cta as AgentCta)}
                                  className="group flex w-full items-center justify-center gap-2 border border-[#C9A96E] bg-[#C9A96E] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-black shadow-[0_0_24px_rgba(201,169,110,0.24)] transition hover:bg-[#D8BD82] active:scale-[0.99]"
                                >
                                  {msg.cta.label}
                                  <ArrowIcon />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isTyping && chatHistory[chatHistory.length - 1]?.role === 'user' && (
                    <div className="flex justify-start animate-[fadeIn_0.3s_ease-out]">
                      <div className="max-w-[85%] flex flex-col gap-1.5 items-start">
                        <div className="flex items-center gap-1.5 opacity-50">
                          <SparkIcon />
                          <span className="chat-heading font-mono text-[8px] uppercase tracking-widest">
                            FABRIC AI
                          </span>
                        </div>
                        <div className="chat-agent-bubble border px-5 py-4 rounded-sm">
                          <div className="flex items-center gap-2">
                            <span className="chat-label-text font-mono text-[9px] uppercase tracking-[0.16em]">
                              Analizando
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E] animate-bounce" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E] animate-bounce [animation-delay:120ms]" />
                            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E] animate-bounce [animation-delay:240ms]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Controles Inferiores */}
                <div className="chat-bar chat-console-composer border-t p-4 shrink-0">
                  
                  {/* Escenarios predeterminados */}
                  <div className="mb-3" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {scenarios.map((scen) => (
                      <button
                        key={scen.key}
                        onClick={() => handleScenarioClick(scen.key)}
                        disabled={isTyping}
                        className="chat-scenario-btn"
                      >
                        <span style={{ color: 'rgba(201,169,110,0.4)', fontSize: 11 }}>›</span>
                        {scen.shortLabel}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleManualSubmit} className="relative flex items-center">
                    <span className="absolute left-4 font-mono text-[11px] text-[#C9A96E]">&gt;</span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isTyping}
                      placeholder={isTyping ? "Diagnosticando..." : "Describe tu escenario técnico..."}
                      className="chat-input w-full border rounded-sm py-3.5 pl-9 pr-12 font-mono text-xs outline-none transition-colors focus:border-[#C9A96E]/40 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      aria-label="Enviar mensaje"
                      disabled={!inputValue.trim() || isTyping}
                      className="absolute right-4 text-[#C9A96E] disabled:text-[var(--text-tertiary)] transition-colors"
                    >
                      <ArrowIcon />
                    </button>
                  </form>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
