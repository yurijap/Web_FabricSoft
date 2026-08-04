import { useEffect, useMemo, useState, type FormEvent } from "react";

// =========================================================================
// TYPES
// =========================================================================

type QuestionType = "single" | "multi";

type Question = {
  id: number;
  type: QuestionType;
  eyebrow: string;
  text: string;
  desc?: string;
  options: string[];
};

type Answers = Record<number, string | string[]>;

// =========================================================================
// PREGUNTAS
// =========================================================================

const QUESTIONS: Question[] = [
  {
    id: 1,
    type: "single",
    eyebrow: "Proyecto Oracle",
    text: "¿Qué tipo de proyecto Oracle estás considerando?",
    desc: "Define la base contractual que debe proteger tu inversión desde el SOW.",
    options: [
      "Implementación nueva de Fusion Cloud",
      "Migración desde EBS / JDE / PeopleSoft",
      "Migración desde SAP u otro ERP",
      "Optimización de Fusion existente",
      "DRP / Continuidad operativa",
      "No definido aún",
    ],
  },
  {
    id: 2,
    type: "single",
    eyebrow: "Industria",
    text: "¿En qué industria opera tu empresa?",
    desc: "Cada industria tiene riesgos distintos: regulación, cierre contable, trazabilidad o continuidad.",
    options: [
      "Servicios financieros / Fintech",
      "Inmobiliario / Centros comerciales",
      "Logística / Distribución",
      "Manufactura",
      "Retail",
      "Energía / Utilities",
      "Otro",
    ],
  },
  {
    id: 3,
    type: "single",
    eyebrow: "Revenue anual",
    text: "¿Cuál es el revenue anual aproximado?",
    desc: "Esto ayuda a ajustar el nivel de gobierno, documentación y protección contractual.",
    options: ["< USD 50M", "USD 50M - 250M", "USD 250M - 1B", "> USD 1B"],
  },
  {
    id: 4,
    type: "single",
    eyebrow: "Fecha de inicio",
    text: "¿Cuándo planeas iniciar el proyecto?",
    desc: "Mientras más cercana sea la fecha, más críticas son las cláusulas de alcance y estabilización.",
    options: ["Próximos 3 meses", "3-6 meses", "6-12 meses", "Sin plazo definido"],
  },
  {
    id: 5,
    type: "multi",
    eyebrow: "Riesgos principales",
    text: "¿Qué te preocupa más?",
    desc: "Selecciona todas las que apliquen.",
    options: [
      "Costos que se disparan",
      "Plazos que se eternizan",
      "Calidad de consultores",
      "Soporte post go-live",
      "Documentación y transferencia",
      "Adopción de usuarios",
      "Continuidad operativa",
    ],
  },
  {
    id: 6,
    type: "single",
    eyebrow: "Rol en el proyecto",
    text: "Tu rol en el proyecto",
    desc: "Ajustaremos el enfoque del documento según el tipo de patrocinador o responsable.",
    options: ["CFO", "CIO / CTO", "Director de Transformación", "CEO", "Otro"],
  },
];

// =========================================================================
// ICONOS
// =========================================================================

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QuestionIcon({ id }: { id: number }) {
  if (id === 1) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === 2) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M4 21V7l8-4 8 4v14M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === 3) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M4 19h16M7 16V9M12 16V5M17 16v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === 4) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M7 3v3M17 3v3M4 8h16M6 21h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === 5) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4M12 17h.01M10.3 4.3 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// =========================================================================
// COMPONENTE
// =========================================================================

export function DoctrineGeneratorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isCompiling, setIsCompiling] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
  });

  const [authorized, setAuthorized] = useState(false);
  const [formError, setFormError] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const currentQ = QUESTIONS[step - 1];

  const answeredCount = useMemo(() => {
    return QUESTIONS.filter((question) => {
      const value = answers[question.id];

      if (Array.isArray(value)) return value.length > 0;

      return Boolean(value);
    }).length;
  }, [answers]);

  const progressPercent = Math.round((answeredCount / QUESTIONS.length) * 100);

  const selectedRiskCount = Array.isArray(answers[5]) ? answers[5].length : 0;

  const profileSignal = useMemo(() => {
    const industry = answers[2];
    const revenue = answers[3];
    const project = answers[1];

    if (!industry && !revenue && !project) return "Perfil pendiente";

    if (
      revenue === "USD 250M - 1B" ||
      revenue === "> USD 1B" ||
      industry === "Servicios financieros / Fintech"
    ) {
      return "Alta criticidad contractual";
    }

    if (
      project === "DRP / Continuidad operativa" ||
      selectedRiskCount >= 3 ||
      revenue === "USD 50M - 250M"
    ) {
      return "Riesgo operativo relevante";
    }

    return "Evaluación inicial";
  }, [answers, selectedRiskCount]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    setStep(0);
    setAnswers({});
    setFormData({ name: "", email: "", company: "" });
    setAuthorized(false);
    setFormError("");
    setIsCompiling(false);
    setHoneypot("");

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (step !== 8) return;

    setIsCompiling(true);

    const timer = window.setTimeout(() => {
      setIsCompiling(false);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [step]);

  if (!isOpen) return null;

  const handleSingleSelect = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));

    window.setTimeout(() => {
      setStep((prev) => prev + 1);
    }, 260);
  };

  const handleMultiSelect = (questionId: number, option: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionId]) ? (prev[questionId] as string[]) : [];
      const exists = current.includes(option);

      return {
        ...prev,
        [questionId]: exists
          ? current.filter((item) => item !== option)
          : [...current, option],
      };
    });
  };

  const isOptionSelected = (questionId: number, option: string) => {
    const value = answers[questionId];

    if (Array.isArray(value)) return value.includes(option);

    return value === option;
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (honeypot) return;

    if (!formData.name || !formData.email || !formData.company) {
      setFormError("Completa nombre, empresa y correo corporativo.");
      return;
    }

    const email = formData.email.toLowerCase();

    if (
      email.includes("@gmail.") ||
      email.includes("@hotmail.") ||
      email.includes("@outlook.") ||
      email.includes("@yahoo.")
    ) {
      setFormError("Usa un correo corporativo para recibir el PDF.");
      return;
    }

    if (!authorized) {
      setFormError("Debes aceptar los términos de confidencialidad para recibir el PDF.");
      return;
    }

    console.log("Generar Doctrine PDF:", {
      answers,
      lead: formData,
      profileSignal,
      createdAt: new Date().toISOString(),
    });

    setStep(8);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#050203]/95 px-0 backdrop-blur-2xl sm:px-6">
      <style>{`
        @keyframes fabricFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fabricSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fabricSlideRight {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fabricPulseGlow {
          0%, 100% { box-shadow: 0 0 0 rgba(201,169,110,0); }
          50% { box-shadow: 0 0 34px rgba(201,169,110,0.28); }
        }

        .doctrine-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(201,169,110,0.65) rgba(10,10,10,0.95);
        }

        .doctrine-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .doctrine-scroll::-webkit-scrollbar-track {
          background: rgba(10,10,10,0.95);
          border-left: 1px solid rgba(42,42,42,0.55);
        }

        .doctrine-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(201,169,110,0.95), rgba(160,120,69,0.45));
          border-radius: 999px;
          border: 2px solid rgba(10,10,10,0.95);
        }

        .doctrine-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(201,169,110,1);
        }

        /* INYECCIÓN DEL ESTILO DEL BOTÓN BOUTIQUE (Como en la foto) */
        .btn-boutique {
          background-color: #080706;
          border: 1px solid #1A1A1A;
          color: #F5F5F5;
          transition: all 0.4s ease;
        }
        .btn-boutique:hover:not(:disabled) {
          border-color: rgba(201, 169, 110, 0.5);
          box-shadow: 0 0 20px rgba(201, 169, 110, 0.1);
          background-color: #050203;
        }
        .btn-boutique:active:not(:disabled) {
          transform: scale(0.98);
        }
      `}</style>

      <div className="relative flex h-full w-full max-w-[1080px] overflow-hidden border-y border-[#2A2A2A] bg-[#080706] shadow-[0_40px_140px_rgba(0,0,0,0.88)] sm:h-[90vh] sm:max-h-[820px] sm:rounded-[28px] sm:border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(201,169,110,0.12),transparent_28%),radial-gradient(circle_at_90%_70%,rgba(201,169,110,0.06),transparent_30%)]" />

        {/* SIDEBAR DESKTOP */}
        <aside className="relative hidden w-[305px] shrink-0 border-r border-[#1A1A1A] bg-[#060606]/72 p-7 lg:flex lg:flex-col">
          <div>
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#C9A96E]/25 bg-[#C9A96E]/[0.04] px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C9A96E] opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C9A96E]" />
              </span>

              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#C9A96E]">
                Doctrine Engine
              </span>
            </div>

            <h2 className="font-serif text-[38px] leading-[0.95] tracking-[-0.055em] text-[#F5F5F5]">
              Oracle
              <br />
              Contract
              <br />
              <span className="italic text-[#C9A96E]">Doctrine.</span>
            </h2>

            <p className="mt-5 font-sans text-sm leading-6 text-[#8A8A8A]">
              Genera una base de cláusulas para proteger alcance, gobierno,
              estabilización y transferencia.
            </p>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8A8A8A]">
                Progreso
              </span>

              <span className="font-serif text-4xl leading-none text-[#C9A96E]">
                {progressPercent}%
              </span>
            </div>

            <div className="h-px w-full overflow-hidden bg-[#2A2A2A]">
              <div
                className="h-full bg-[#C9A96E] shadow-[0_0_22px_rgba(201,169,110,0.7)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-7 space-y-2">
            {QUESTIONS.map((question) => {
              const value = answers[question.id];
              const isAnswered = Array.isArray(value) ? value.length > 0 : Boolean(value);
              const isCurrent = step === question.id;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => step > 0 && step <= 7 && setStep(question.id)}
                  className={`
                    grid w-full grid-cols-[30px_1fr_auto] items-center gap-3 border px-3 py-2.5 text-left transition-all duration-300
                    ${
                      isCurrent
                        ? "border-[#C9A96E]/45 bg-[#C9A96E]/[0.07]"
                        : "border-transparent hover:border-[#2A2A2A] hover:bg-[#111111]"
                    }
                  `}
                >
                  <span
                    className={`font-mono text-[10px] ${
                      isCurrent || isAnswered ? "text-[#C9A96E]" : "text-[#5A5A5A]"
                    }`}
                  >
                    {String(question.id).padStart(2, "0")}
                  </span>

                  <span
                    className={`font-sans text-xs leading-4 ${
                      isCurrent ? "text-[#F5F5F5]" : "text-[#8A8A8A]"
                    }`}
                  >
                    {question.eyebrow}
                  </span>

                  <span
                    className={`
                      h-2 w-2 rounded-full border transition-all
                      ${
                        isAnswered
                          ? "border-[#C9A96E] bg-[#C9A96E] shadow-[0_0_12px_rgba(201,169,110,0.55)]"
                          : "border-[#3A3A3A]"
                      }
                    `}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-auto border-t border-[#1A1A1A] pt-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
              {profileSignal}
            </p>

            <p className="mt-3 font-sans text-xs leading-5 text-[#6A6A6A]">
              {selectedRiskCount > 0
                ? `${selectedRiskCount} riesgos seleccionados para la matriz contractual.`
                : "Selecciona riesgos para activar recomendaciones más precisas."}
            </p>
          </div>
        </aside>

        {/* MAIN */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          {/* HEADER */}
          <header className="flex shrink-0 items-center justify-between border-b border-[#1A1A1A] bg-[#080706]/90 px-6 py-4 md:px-8">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-[#C9A96E]">
                  Doctrina Generator
                </span>
              </div>

              <p className="mt-2 hidden font-mono text-[8px] uppercase tracking-[0.22em] text-[#5A5A5A] sm:block">
                6 preguntas · PDF contractual · Oracle Critical Engineering
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="
                group flex h-10 w-10 items-center justify-center
                rounded-full border border-[#2A2A2A]
                bg-[#080706]/70
                text-[#8A8A8A]
                transition-all duration-300
                hover:border-[#C9A96E]/60
                hover:bg-[#C9A96E]/10
                hover:text-[#C9A96E]
              "
            >
              <CloseIcon />
            </button>
          </header>

          {/* MOBILE PROGRESS */}
          <div className="shrink-0 border-b border-[#1A1A1A] lg:hidden">
            <div className="h-px bg-[#1A1A1A]">
              <div
                className="h-full bg-[#C9A96E] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between px-6 py-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8A8A8A]">
                Progreso {progressPercent}%
              </span>

              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#C9A96E]">
                {profileSignal}
              </span>
            </div>
          </div>

          {/* BODY */}
          <div className="doctrine-scroll flex-1 overflow-y-auto px-6 py-6 md:px-9 md:py-8">
            {/* INTRO */}
            {step === 0 && (
              <section
                className="flex min-h-full flex-col justify-center max-w-[640px] mx-auto"
                style={{ animation: "fabricSlideUp 0.5s ease-out" }}
              >
                <div className="mb-6 inline-flex w-fit items-center gap-3 rounded-full border border-[#C9A96E]/25 bg-[#C9A96E]/[0.05] px-4 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#C9A96E]">
                    Herramienta · FABRIC
                  </span>
                </div>

                <h1 className="max-w-[720px] font-serif text-[44px] leading-[0.98] tracking-[-0.055em] text-[#F5F5F5] md:text-[56px]">
                  Doctrine
                  <br />
                  Generator.
                  <br />
                  <span className="italic text-[#C9A96E]">Tus cláusulas Oracle.</span>
                </h1>

                <p className="mt-7 max-w-[620px] font-sans text-[14px] md:text-[15px] leading-relaxed text-[#8A8A8A]">
                  Responde 6 preguntas sobre tu próximo contrato Oracle y genera
                  un PDF con cláusulas recomendadas para proteger alcance,
                  presupuesto, estabilización y transferencia operativa.
                </p>

                <div className="mt-9 grid gap-3 sm:grid-cols-3">
                  {[
                    ["06", "preguntas ejecutivas"],
                    ["03", "minutos"],
                    ["PDF", "descargable"],
                  ].map(([value, label]) => (
                    <div key={label} className="border border-[#1A1A1A] bg-[#050203] p-5">
                      <p className="font-serif text-3xl leading-none text-[#C9A96E]">
                        {value}
                      </p>

                      <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.18em] text-[#7A7A7A]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-col gap-5 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="group flex w-fit items-center gap-3 px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.2em] btn-boutique"
                  >
                    Comenzar configuración
                    <span className="transition-transform duration-300 group-hover:translate-x-1 font-light">→</span>
                  </button>

                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6A6A6A]">
                    Sin registro hasta el paso final
                  </span>
                </div>
              </section>
            )}

            {/* QUESTIONS */}
            {step > 0 && step <= 6 && currentQ && (
              <section
                key={currentQ.id}
                className="flex min-h-full flex-col"
                style={{ animation: "fabricSlideRight 0.38s ease-out" }}
              >
                <div className="mb-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9A96E]/35 bg-[#C9A96E]/10 text-[#C9A96E]">
                        <QuestionIcon id={currentQ.id} />
                      </span>

                      <div>
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] text-[#C9A96E]">
                          Pregunta {step} de 6
                        </p>

                        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.22em] text-[#5A5A5A]">
                          {currentQ.eyebrow}
                        </p>
                      </div>
                    </div>

                    {currentQ.type === "multi" && (
                      <span className="hidden rounded-full border border-[#C9A96E]/25 px-3 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-[#C9A96E] sm:inline-flex">
                        Selección múltiple
                      </span>
                    )}
                  </div>

                  <h2 className="max-w-[760px] font-serif text-[30px] leading-[1.05] tracking-[-0.04em] text-[#F5F5F5] md:text-[42px]">
                    {currentQ.text}
                  </h2>

                  {currentQ.desc && (
                    <p className="mt-3 max-w-[680px] font-sans text-sm leading-6 text-[#8A8A8A]">
                      {currentQ.desc}
                    </p>
                  )}
                </div>

                <div
                  className={`
                    grid gap-3
                    ${
                      currentQ.options.length >= 5
                        ? "grid-cols-1 md:grid-cols-2"
                        : "grid-cols-1"
                    }
                  `}
                >
                  {currentQ.options.map((option, index) => {
                    const isMulti = currentQ.type === "multi";
                    const selected = isOptionSelected(currentQ.id, option);

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          isMulti
                            ? handleMultiSelect(currentQ.id, option)
                            : handleSingleSelect(currentQ.id, option)
                        }
                        className={`
                          group relative overflow-hidden border px-4 py-3 text-left
                          transition-all duration-300
                          hover:-translate-y-0.5 hover:border-[#C9A96E]/65
                          ${
                            selected
                              ? "border-[#C9A96E] bg-[#C9A96E]/[0.09] shadow-[0_14px_35px_rgba(0,0,0,0.35)]"
                              : "border-[#2A2A2A] bg-[#111111]/70 hover:bg-[#161616]"
                          }
                        `}
                      >
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#C9A96E]/[0.06] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                        <div className="relative grid grid-cols-[28px_1fr_22px] items-center gap-3">
                          <span
                            className={`
                              flex h-7 w-7 items-center justify-center rounded-full
                              border font-mono text-[9px]
                              ${
                                selected
                                  ? "border-[#C9A96E] bg-[#C9A96E] text-[#0A0A0A]"
                                  : "border-[#2A2A2A] text-[#5A5A5A]"
                              }
                            `}
                          >
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <span
                            className={`font-sans text-[14px] leading-5 ${
                              selected ? "text-[#F5F5F5]" : "text-[#B0B0B0]"
                            }`}
                          >
                            {option}
                          </span>

                          <span
                            className={`
                              flex h-5 w-5 items-center justify-center border transition-all duration-300
                              ${isMulti ? "rounded-[5px]" : "rounded-full"}
                              ${
                                selected
                                  ? "border-[#C9A96E] bg-[#C9A96E] text-[#0A0A0A]"
                                  : "border-[#444444] text-transparent group-hover:border-[#C9A96E]/70"
                              }
                            `}
                          >
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
                              <path
                                d="M5 13l4 4L19 7"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-[#1A1A1A] pt-5">
                  <button
                    type="button"
                    onClick={() => setStep((prev) => Math.max(0, prev - 1))}
                    className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#777777] transition-colors duration-300 hover:text-[#F5F5F5]"
                  >
                    ← Anterior
                  </button>

                  {currentQ.type === "multi" ? (
                    <button
                      type="button"
                      onClick={() => setStep((prev) => prev + 1)}
                      disabled={
                        !answers[currentQ.id] ||
                        (answers[currentQ.id] as string[]).length === 0
                      }
                      className="
                        group flex items-center gap-3 px-8 py-3
                        font-mono text-[10px] font-bold uppercase tracking-[0.22em]
                        btn-boutique
                        disabled:cursor-not-allowed disabled:opacity-30
                        disabled:hover:bg-transparent disabled:hover:text-[#F5F5F5]
                        disabled:border-[#1A1A1A]
                      "
                    >
                      Confirmar selección
                      <span className="transition-transform group-hover:translate-x-1 font-light">→</span>
                    </button>
                  ) : (
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#5A5A5A]">
                      Selecciona una opción para continuar
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* LEAD FORM */}
            {step === 7 && (
              <section
                className="flex min-h-full flex-col justify-center max-w-[640px] mx-auto"
                style={{ animation: "fabricSlideRight 0.4s ease-out" }}
              >
                <div className="mb-8 inline-flex w-fit rounded-sm border border-[#C9A96E]/20 bg-[#C9A96E]/[0.05] px-4 py-2">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#C9A96E]">
                    Paso final · PDF privado
                  </span>
                </div>

                <h2 className="max-w-[680px] font-serif text-[38px] leading-[1.05] tracking-[-0.045em] text-[#F5F5F5] md:text-[48px]">
                  ¿A dónde enviamos tu Doctrina?
                </h2>

                <p className="mt-5 max-w-[620px] font-sans text-base leading-relaxed text-[#8A8A8A]">
                  Hemos perfilado tu escenario. Ingresa tus datos corporativos
                  para compilar el PDF con las cláusulas recomendadas.
                </p>

                <div className="mt-8 max-w-[680px] border border-[#1A1A1A] bg-[#050203] p-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#C9A96E]">
                    Perfil detectado
                  </p>

                  <p className="mt-2 font-serif text-2xl text-[#F5F5F5]">
                    {profileSignal}
                  </p>

                  <p className="mt-2 font-sans text-sm leading-relaxed text-[#8A8A8A]">
                    El documento priorizará cláusulas de alcance, gobierno,
                    estabilización y transferencia según tus respuestas.
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="mt-8 max-w-[680px] space-y-5">
                  <input
                    type="text"
                    name="hp_field"
                    className="absolute -z-10 h-0 w-0 opacity-0"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(event) => setHoneypot(event.target.value)}
                  />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8A8A]">
                        Nombre
                      </span>

                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(event) =>
                          setFormData({ ...formData, name: event.target.value })
                        }
                        className="w-full border border-[#1A1A1A] bg-[#050203] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-colors focus:border-[#C9A96E]"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8A8A]">
                        Empresa
                      </span>

                      <input
                        required
                        type="text"
                        value={formData.company}
                        onChange={(event) =>
                          setFormData({ ...formData, company: event.target.value })
                        }
                        className="w-full border border-[#1A1A1A] bg-[#050203] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-colors focus:border-[#C9A96E]"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.16em] text-[#8A8A8A]">
                      Correo corporativo
                    </span>

                    <input
                      required
                      type="email"
                      placeholder="nombre@empresa.com"
                      value={formData.email}
                      onChange={(event) =>
                        setFormData({ ...formData, email: event.target.value })
                      }
                      className="w-full border border-[#1A1A1A] bg-[#050203] px-4 py-3 text-sm text-[#F5F5F5] outline-none transition-colors placeholder:text-[#4A4A4A] focus:border-[#C9A96E]"
                    />
                  </label>

                  <label className="flex items-start gap-3">
                    <input
                      required
                      type="checkbox"
                      checked={authorized}
                      onChange={(event) => setAuthorized(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-[#C9A96E]"
                    />

                    <span className="font-sans text-[13px] leading-relaxed text-[#8A8A8A]">
                      Acepto la política de privacidad y autorizo el envío del
                      documento PDF a mi correo.
                    </span>
                  </label>

                  {formError && (
                    <p className="border border-[#B85450]/35 bg-[#B85450]/10 p-3 font-mono text-xs text-[#E7A09D]">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="group flex w-full items-center justify-center gap-3 px-8 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.22em] btn-boutique"
                  >
                    Compilar y enviar PDF
                    <span className="transition-transform duration-300 group-hover:translate-x-1 font-light">→</span>
                  </button>
                </form>
              </section>
            )}

            {/* SUCCESS */}
            {step === 8 && (
              <section
                className="flex min-h-full flex-col items-center justify-center text-center max-w-[500px] mx-auto"
                style={{ animation: "fabricFadeIn 0.5s ease-out" }}
              >
                {isCompiling ? (
                  <>
                    <div className="relative mb-8 flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-[#1A1A1A]" />
                      <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#C9A96E]" />
                      <span className="font-mono text-[10px] text-[#C9A96E]">
                        PDF
                      </span>
                    </div>

                    <h2 className="font-serif text-[32px] md:text-4xl text-[#F5F5F5] mb-2">
                      Compilando doctrina...
                    </h2>

                    <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8A8A8A] animate-pulse">
                      Aplicando matriz de riesgo contractual
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]">
                      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <h2 className="font-serif text-[36px] text-[#F5F5F5] md:text-5xl mb-4">
                      Documento enviado.
                    </h2>

                    <p className="mt-5 font-sans text-[14px] leading-relaxed text-[#8A8A8A]">
                      Hemos enviado el PDF con tus cláusulas contractuales a{" "}
                      <strong className="text-[#F5F5F5] font-normal">{formData.email}</strong>.
                      Revisa tu bandeja de entrada o correo no deseado.
                    </p>

                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-10 px-10 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#F5F5F5] btn-boutique"
                    >
                      Cerrar y volver a la web
                    </button>

                    <p className="mt-12 font-mono text-[8px] uppercase leading-5 tracking-[0.18em] text-[#4A4A4A]">
                      Aviso: este documento no constituye asesoría legal. Todo
                      contrato debe ser revisado por tu equipo jurídico.
                    </p>
                  </>
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}