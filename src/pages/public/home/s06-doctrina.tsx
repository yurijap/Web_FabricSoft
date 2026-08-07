import { lazy, Suspense, useEffect, useRef, useState } from "react";

const DoctrineGeneratorModal = lazy(() =>
  import("./DoctrinaModal").then((module) => ({
    default: module.DoctrineGeneratorModal,
  })),
);

// --- HOOK DE ANIMACIÓN ---
function useInView(threshold = 0.15) {
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
      { threshold, rootMargin: "100px" }
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

function ShieldIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4L12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- DATOS DE LA DOCTRINA ---
const clauses = [
  {
    id: "01",
    title: "Entrega en primer ciclo crítico.",
    description: "El proyecto se entrega cuando tu primer cierre contable, primer ciclo operativo o primer ciclo regulatorio crítico opera en producción con estabilidad documentada.",
    tag: "VALIDADO · APE PLAZAS",
    type: "validated"
  },
  {
    id: "02",
    title: "Solo seniors. Cero juniors facturables.",
    description: "Cada consultor de FABRIC tiene mínimo 8 años de experiencia real en Oracle. Sin excepciones.",
    tag: "CONTRACTUAL",
    type: "contractual"
  },
  {
    id: "03",
    title: "Fixed-Price por fase. Cero sorpresas.",
    description: "Operamos con presupuestos cerrados. Si nos atrasamos por nuestra causa, no facturamos las semanas adicionales.",
    tag: "CONTRACTUAL",
    type: "contractual"
  },
  {
    id: "04",
    title: "Cero reportes manuales post go-live.",
    description: "Si subsiste un reporte manual paralelo por causa atribuible a FABRIC, se resuelve sin costo adicional hasta su eliminación.",
    tag: "VALIDADO · APE PLAZAS",
    type: "validated"
  },
  {
    id: "05",
    title: "Transición formal con documentación viva.",
    description: "Acta firmada por todos los stakeholders, tablero de KPIs verificado, y documentación auditable y actualizable por el cliente sin dependencia de FABRIC.",
    tag: "VALIDADO · APE PLAZAS",
    type: "validated"
  }
];

// =========================================================================
// COMPONENTE PRINCIPAL (Asymmetrical Sticky Layout)
// =========================================================================
export default function S06Doctrina() {
  const { ref: headerRef, isInView: headerInView } = useInView(0.1);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const clausesRef = useRef<HTMLDivElement>(null);
  const [visibleClauses, setVisibleClauses] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const root = clausesRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.clauseId;
            if (id) {
              setVisibleClauses((current) => {
                if (current.has(id)) return current;
                const next = new Set(current);
                next.add(id);
                return next;
              });
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.3, rootMargin: "80px" },
    );

    const nodes = root.querySelectorAll<HTMLElement>("[data-clause-id]");
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="doctrina" className="relative w-full bg-[#050203] py-24 md:py-32 border-t border-[#111]">

      {/* --- FONDOS Y EFECTOS --- */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-[0.05]" />
      <div className="pointer-events-none absolute left-0 top-1/4 h-[600px] w-[600px] -translate-x-1/4 bg-[#C9A96E] opacity-[0.03] blur-[150px]" />

      {/* GRID ASIMÉTRICO (La magia del "Scrollytelling") */}
      <div className="relative z-10 mx-auto max-w-[1300px] px-6 md:px-12 flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">

        {/* =========================================================
            COLUMNA IZQUIERDA (Se queda pegada en la pantalla)
            ========================================================= */}
        <div className="lg:w-5/12 lg:sticky lg:top-32 flex flex-col">
          <div ref={headerRef} className={`transition-[transform,opacity] duration-1000 ${headerInView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"}`}>

            <div className="mb-6 inline-flex items-center gap-3 px-4 py-1.5 rounded-sm border border-[#C9A96E]/20 bg-[#C9A96E]/5 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C9A96E]"></span>
              </span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">
                Doctrina FABRIC
              </span>
            </div>

            <h2 className="font-serif text-[42px] leading-[1.05] md:text-[56px] lg:text-[64px] text-[#F5F5F5] tracking-tight mb-8">
              No somos consultores.<br />
              Somos ingenieros que asumen <br className="hidden md:block" />
              <span className="text-[#C9A96E] italic">riesgo técnico y financiero</span><br />
              por contrato.
            </h2>

            <p className="font-sans text-base text-[#F5F5F5]/50 leading-relaxed mb-12 max-w-[450px]">
              La industria del software empresarial está rota. Nosotros no vendemos horas-hombre, vendemos estabilidad operativa garantizada. Conoce nuestras cláusulas innegociables.
            </p>




            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="group flex w-fit items-center gap-3 border border-[#C9A96E] bg-[#C9A96E]/5 px-8 py-4 rounded-sm font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9A96E] transition-all duration-300 hover:bg-[#C9A96E] hover:text-[#0A0A0A] hover:shadow-[0_0_20px_rgba(201,169,110,0.3)]"
            >
              Generador de doctrina
              <ArrowIcon />
            </button>

          </div>
        </div>

        {/* =========================================================
            COLUMNA DERECHA (El "Feed" que fluye al hacer scroll)
            ========================================================= */}
        <div ref={clausesRef} className="lg:w-7/12 relative flex flex-col gap-8 pb-10">

          {/* Línea conectora de la línea de tiempo */}
          <div className="absolute left-[38px] top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-[#C9A96E]/30 to-transparent hidden sm:block" />

          {clauses.map((clause) => {
            const isInView = visibleClauses.has(clause.id);
            const isContractual = clause.type === "contractual";

            return (
              <div
                key={clause.id}
                data-clause-id={clause.id}
                className={`relative pl-0 sm:pl-24 transition-[transform,opacity] duration-700 ease-out will-change-[transform,opacity]
                  ${isInView ? "opacity-100 translate-x-0 scale-100" : "opacity-30 translate-x-12 scale-[0.96]"}`}
              >
                {/* Número flotante (Timeline node) */}
                <div className="hidden sm:flex absolute left-0 top-6 w-[76px] justify-center bg-[#050203] py-2">
                  <span className={`font-mono text-3xl font-light transition-colors duration-500 ${isInView ? 'text-[#C9A96E]' : 'text-[#2A2A2A]'}`}>
                    {clause.id}
                  </span>
                </div>

                {/* Tarjeta de Cláusula */}
                <div className={`p-8 md:p-10 border rounded-xl transition-[border-color,box-shadow] duration-500 bg-[#080706]
                  ${isInView ? 'border-[#C9A96E]/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'border-[#1A1A1A] shadow-none'}`}
                >
                  <div className="flex flex-col gap-6">

                    {/* Header de tarjeta (Mobile number + Tag) */}
                    <div className="flex items-center justify-between">
                      <span className="sm:hidden font-mono text-2xl font-light text-[#C9A96E]">
                        {clause.id}
                      </span>

                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-sm font-mono text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-300
                        ${isContractual
                          ? 'border-[#C9A96E]/30 bg-[#C9A96E]/10 text-[#C9A96E]'
                          : 'border-[#2A2A2A] bg-[#111] text-[#F5F5F5]/50'
                        }`}
                      >
                        {isContractual ? <ShieldIcon /> : <CheckCircleIcon />}
                        {clause.tag}
                      </div>
                    </div>

                    {/* Textos */}
                    <div>
                      <h3 className="text-xl md:text-2xl font-serif text-[#F5F5F5] mb-4 tracking-tight">
                        {clause.title}
                      </h3>
                      <p className="text-[#F5F5F5]/60 font-sans text-base leading-relaxed">
                        {clause.description}
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {isGeneratorOpen && (
        <Suspense fallback={null}>
          <DoctrineGeneratorModal
            isOpen={isGeneratorOpen}
            onClose={() => setIsGeneratorOpen(false)}
          />
        </Suspense>
      )}
    </section>
  );
}
