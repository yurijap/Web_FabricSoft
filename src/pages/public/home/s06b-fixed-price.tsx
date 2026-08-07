import { useEffect, useRef, useState } from 'react';

export default function S06bFixedPrice() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.3 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="fixed-price"
      ref={containerRef}
      className="
        parte8-section relative w-full overflow-hidden
        bg-[#050203]
        flex items-center justify-center
        border-t border-[#2A2A2A]/50
        py-24 md:py-36
      "
    >
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050203_72%)] pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#050203] via-transparent to-[#050203] pointer-events-none" />

      <div
        className={`
          relative z-10 w-full max-w-[1120px] px-6
          transition-[transform,opacity] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity]
          ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-14 scale-[0.98]'}
        `}
      >
        <div
          className="
            relative mx-auto
            grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr]
            overflow-hidden
            rounded-[2rem]
            border border-[#2A2A2A]
            bg-[#111111]
            shadow-[0_40px_120px_rgba(0,0,0,0.55)]
          "
        >
          <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-[#C9A96E]/10" />
          <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-[#C9A96E]/[0.07] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#C9A96E]/[0.045] blur-3xl" />

          <aside
            className="
              relative flex flex-col justify-between
              border-b border-[#2A2A2A] lg:border-b-0 lg:border-r
              bg-[#080706]/55
              px-8 py-9 md:px-10 md:py-12
            "
          >
            <div>
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-10 bg-[#C9A96E]" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[#C9A96E]">
                  Garantía contractual
                </span>
              </div>

              <div className="mb-12 text-center">
                <h3 className="font-serif text-[48px] md:text-[72px] lg:text-[86px] leading-[0.9] tracking-[-0.055em] text-[#F5F5F5]">
                  Garantía
                  <br />
                  <span className="text-[#C9A96E]">FABRIC</span>
                </h3>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <div className="h-px w-full bg-[#2A2A2A]" />

              <p className="max-w-[320px] font-sans text-sm leading-6 text-[#8A8A8A]">
                Diseñada para eliminar el riesgo real después del go-live:
                reportes manuales, operación paralela e incertidumbre ejecutiva.
              </p>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A96E]/25 px-4 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C9A96E]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
                  Doctrina FABRIC
                </span>
              </div>
            </div>
          </aside>

          <article className="relative px-8 py-10 md:px-12 md:py-14 lg:px-14 lg:py-16">
            <blockquote className="relative">
              <span className="pointer-events-none absolute -top-8 -left-3 font-serif text-7xl leading-none text-[#C9A96E]/15 select-none">
                &ldquo;
              </span>

              <p className="relative z-10 max-w-[680px] font-serif text-[28px] leading-[1.25] tracking-[-0.025em] text-[#F5F5F5] md:text-4xl md:leading-[1.28]">
                Si después de 90 días post go-live, tu Oracle Fusion sigue
                requiriendo reportes manuales ejecutivos paralelos por causa
                atribuible a FABRIC,
                <span className="text-[#C9A96E]">
                  {' '}devolvemos el 100% de los honorarios
                </span>{' '}
                de la fase de estabilización.
              </p>
            </blockquote>

            <div className="mt-10 grid gap-4 border-t border-[#2A2A2A]/70 pt-8 md:grid-cols-[1fr_auto] md:items-end">
              <p className="max-w-[560px] font-sans text-sm leading-6 text-[#8A8A8A] md:text-base">
                Esto no es marketing. Es una cláusula contractual estándar en cada
                proyecto FABRIC.
              </p>

              <button
                type="button"
                data-interaction="doctrina"
                className="
                  group inline-flex w-fit items-center gap-3
                  font-mono text-[10px] font-semibold uppercase tracking-[0.22em]
                  text-[#C9A96E]
                  transition-colors duration-300 hover:text-[#F5F5F5]
                  cursor-pointer
                "
              >
                Ver doctrina
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#C9A96E]/35 transition-all duration-300 group-hover:translate-x-1 group-hover:border-[#C9A96E] group-hover:bg-[#C9A96E]/10">
                  -&gt;
                </span>
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
