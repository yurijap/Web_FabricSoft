import { useEffect, useState } from "react";
import { api } from "../../../config/api";
import { useInViewOnce } from "../../../hooks/useInViewOnce";

type MetricItem = {
  id: string;
  value: number;
  label: string;
  icon: "rescue" | "time" | "reports" | "close";
  prefix?: string;
  pad?: boolean;
};

const mainMetric: MetricItem = {
  id: "01",
  value: 2,
  label: "Implementaciones Oracle Fusion rescatadas",
  icon: "rescue",
  pad: true,
};

const metrics: MetricItem[] = [
  {
    id: "02",
    value: 12000,
    label: "Horas recuperadas para clientes",
    icon: "time",
    prefix: "~",
  },
  {
    id: "03",
    value: 7,
    label: "Reportes manuales eliminados",
    icon: "reports",
  },
  {
    id: "04",
    value: 2,
    label: "Cierres críticos estabilizados",
    icon: "close",
  },
];

function useCountUp(value: number, active: boolean, duration = 950) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    let start = 0;

    const animate = (time: number) => {
      if (!start) start = time;

      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, value]);

  return count;
}

function AnimatedValue({
  value,
  active,
  prefix = "",
  pad = false,
  className = "",
}: {
  value: number;
  active: boolean;
  prefix?: string;
  pad?: boolean;
  className?: string;
}) {
  const count = useCountUp(value, active);
  const formatted = pad ? String(count).padStart(2, "0") : count.toLocaleString("en-US");

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
    </span>
  );
}

function MetricIcon({ type }: { type: MetricItem["icon"] }) {
  const iconClass = "h-3.5 w-3.5";

  if (type === "rescue") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
        <path d="M12 3.5L18.5 6.3V11.4C18.5 15.6 15.8 19.3 12 20.5C8.2 19.3 5.5 15.6 5.5 11.4V6.3L12 3.5Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 12L11 14L15.2 9.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "time") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
        <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 12A8 8 0 1 1 4 12A8 8 0 0 1 20 12Z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  if (type === "reports") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
        <path d="M7 4H14L18 8V20H7V4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 4V8H18" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9.5 12H15.5M9.5 15H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className={iconClass} aria-hidden="true">
      <path d="M4 17L8.5 12.5L11.5 15.5L20 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 7V12.5M20 7H14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SmallMetricCard({ metric, active, index }: { metric: MetricItem; active: boolean; index: number }) {
  return (
    <article
      className={`group relative min-h-[106px] overflow-hidden border border-border bg-bg-panel p-3.5 transition duration-700 hover:-translate-y-1 hover:border-accent/55 hover:bg-bg-elevated md:min-h-[116px] md:p-4 ${
        active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{ transitionDelay: `${120 + index * 90}ms` }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-accent via-accent/55 to-transparent transition-transform duration-1000" style={{ transform: active ? "scaleX(1)" : "scaleX(0)", transitionDelay: `${260 + index * 130}ms` }} />

      <div className="flex items-center justify-between gap-3">
        <span className="font-technical text-[7.5px] font-black uppercase tracking-[0.22em] text-text-tertiary md:text-[8px]">
          {metric.id}
        </span>

        <span className="flex h-6 w-6 items-center justify-center border border-border-strong bg-bg-base text-accent transition duration-300 group-hover:border-accent/65 group-hover:bg-accent-soft md:h-7 md:w-7">
          <MetricIcon type={metric.icon} />
        </span>
      </div>

      <p className="mt-3 font-technical text-[clamp(24px,2.45vw,34px)] font-black leading-none tracking-[-0.055em] text-text-primary transition-colors duration-300 group-hover:text-accent">
        <AnimatedValue value={metric.value} prefix={metric.prefix} active={active} />
      </p>

      <p className="mt-2.5 max-w-[12rem] font-technical text-[8.5px] font-black uppercase leading-4 tracking-[0.16em] text-text-secondary md:text-[9px]">
        {metric.label}
      </p>
    </article>
  );
}

export default function S02Optimizador() {
  const [sectionRef, isInView] = useInViewOnce<HTMLElement>();
  const [rescueValue, setRescueValue] = useState(mainMetric.value);

  useEffect(() => {
    api.get("/metricas")
      .then((res) => {
        const list = res.data.data;
        if (Array.isArray(list)) {
          const m = list.find((item: any) => item.id === "rescue");
          if (m && typeof m.value === "number") {
            setRescueValue(m.value);
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section id="optimizador" ref={sectionRef} className="pre-dossier-section p2-dossier-aligned relative w-full overflow-hidden bg-bg-base py-7 text-text-primary md:py-9">
      <style>{`
        @keyframes p2-soft-pulse {
          0%, 100% { opacity: .12; transform: scale(1); }
          50% { opacity: .24; transform: scale(1.08); }
        }
      `}</style>



      <div className="relative z-10 mx-auto max-w-[980px] px-6 md:px-12">
        <div
          className={`relative overflow-hidden border border-border bg-fabric-base p-3.5 transition duration-700 md:p-4 ${
            isInView ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
          }`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

          <article className="relative mb-2.5 overflow-hidden border border-border bg-fabric-base px-4 py-3.5 md:px-5 md:py-4">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-accent/75" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="font-technical text-[8px] font-black uppercase tracking-[0.24em] text-accent/75">
                  {mainMetric.id}
                </span>

                <span className="flex h-7 w-7 items-center justify-center border border-accent/35 bg-accent-soft text-accent">
                  <MetricIcon type={mainMetric.icon} />
                </span>

                <p className="max-w-[360px] font-technical text-[9px] font-black uppercase leading-4 tracking-[0.18em] text-accent md:text-[10px]">
                  {mainMetric.label}
                </p>
              </div>

              <p className="font-technical text-[clamp(42px,5.2vw,68px)] font-black leading-none tracking-[-0.08em] text-accent drop-shadow-[0_0_14px_rgba(201,169,110,0.16)]">
                <AnimatedValue value={rescueValue} active={isInView} pad={mainMetric.pad} />
              </p>
            </div>
          </article>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {metrics.map((metric, index) => (
              <SmallMetricCard key={metric.id} metric={metric} active={isInView} index={index} />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <p className="font-technical text-[7.5px] font-black uppercase tracking-[0.2em] text-text-tertiary md:text-[8px]">
              Proyectos documentados · 2022–2026
            </p>
            <p className="font-technical text-[7.5px] font-black uppercase tracking-[0.2em] text-text-tertiary md:text-[8px]">
              Números verificables bajo NDA
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
