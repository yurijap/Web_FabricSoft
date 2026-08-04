interface LifecycleStep {
  num: string;
  name: string;
  duration: string;
  shortDuration: string;
  desc: React.ReactNode;
  deliverableTitle: string;
  deliverable: string;
  shortDeliverable?: string;
  badge?: string;
  highlight?: boolean;
  muted?: boolean;
}

import React from "react";

const steps: LifecycleStep[] = [
  {
    num: "01",
    name: "Diagnose",
    duration: "Duración · 2-3 sem",
    shortDuration: "2–3 SEM",
    desc: "Análisis ejecutivo de situación actual sin asumir nada. Diagnóstico de gaps, riesgos y oportunidades de remediación.",
    deliverableTitle: "Entregable",
    deliverable: "Acta de diagnóstico ejecutivo · Plan inicial",
    shortDeliverable: "Acta diagnóstico ejecutivo"
  },
  {
    num: "02",
    name: "Architect",
    duration: "Duración · 3-5 sem",
    shortDuration: "3–5 SEM",
    desc: "Diseño técnico completo de tu Fusion en producción. Arquitectura de integración, datos, controles, governance.",
    deliverableTitle: "Entregable",
    deliverable: "Blueprint técnico firmado · SOW Fixed-Price",
    badge: "Contractual"
  },
  {
    num: "03",
    name: "Deploy",
    duration: "Duración · 8-16 sem",
    shortDuration: "8–16 SEM",
    desc: "Implementación con seguridad de nivel bancario. Migración de datos, configuración, integraciones, training.",
    deliverableTitle: "Entregable",
    deliverable: "Go-live técnico documentado"
  },
  {
    num: "04",
    name: "Stabilize",
    duration: "Duración · 6-12 sem",
    shortDuration: "6–12 SEM",
    desc: <>Acompañamiento hasta el <span className="text-[#C9A96E]">primer ciclo crítico operado</span> en producción con estabilidad documentada.</>,
    deliverableTitle: "Entregable contractual",
    deliverable: "Acta de primer ciclo · Tablero KPI auditado",
    shortDeliverable: "Acta · KPI auditado",
    badge: "Cláusula contractual",
    highlight: true
  },
  {
    num: "05",
    name: "Optimize",
    duration: "Opcional · Trimestral",
    shortDuration: "OPCIONAL",
    desc: "Mejora continua con IA aplicada al proceso. Trimestres de optimización bajo modelo recurrente.",
    deliverableTitle: "Modalidad",
    deliverable: "Suscripción FABRIC OS · Q trimestral",
    muted: true
  }
];

import { useInViewOnce } from '../../../hooks/useInViewOnce';

export default function S10Lifecycle() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  return (
    <section ref={ref} id="s10" className={`demo-section s10 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="container">
        <div className="s10-intro">
          <div className="label">Cómo Entregamos</div>
          <h2>De diagnóstico a<br /><span className="text-[#C9A96E]">primer ciclo crítico operado.</span></h2>
        </div>

        {/* Desktop: horizontal timeline */}
        <div className="lifecycle s10-desktop">
          <div className="lifecycle-rail"></div>
          <div className="lifecycle-grid">
            {steps.map((step) => (
              <div className={`lifecycle-step${step.highlight ? " highlight" : ""}`} key={step.num}>
                <span className="lifecycle-num">{step.num}</span>
                <div className="lifecycle-node" style={step.muted ? { borderColor: "var(--border-strong)" } : undefined}></div>
                <div className="lifecycle-body">
                  <div className="lifecycle-name" style={step.muted ? { color: "var(--text-secondary)" } : undefined}>{step.name}</div>
                  <div className="lifecycle-duration">{step.duration}</div>
                  <div className="lifecycle-desc">{step.desc}</div>
                  <div className="lifecycle-deliverable">
                    <strong>{step.deliverableTitle}</strong>
                    {step.deliverable}
                  </div>
                  {step.badge ? <span className="contractual-badge">{step.badge}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical timeline */}
        <div className="s10-mobile">
          <div className="s10-mobile-inner">
            <div className="s10-mobile-spine"></div>
            {steps.map((step) => (
              <div
                key={step.num}
                className={[
                  "s10-mobile-step",
                  step.highlight ? "highlight" : "",
                  step.muted ? "muted" : ""
                ].filter(Boolean).join(" ")}
              >
                <div className={[
                  "s10-mobile-node",
                  step.highlight ? "highlight" : "",
                  step.muted ? "muted" : ""
                ].filter(Boolean).join(" ")}></div>

                {step.highlight && (
                  <div className="s10-mobile-entry-badge">PUNTO DE ENTREGA</div>
                )}

                <div className={`s10-mobile-num${step.muted ? " muted" : ""}`}>
                  {step.num} · {step.shortDuration}
                </div>
                <div className={[
                  "s10-mobile-name",
                  step.highlight ? "highlight" : "",
                  step.muted ? "muted" : ""
                ].filter(Boolean).join(" ")}>
                  {step.name}
                </div>
                {(step.shortDeliverable || step.deliverable) && (
                  <div className="s10-mobile-deliverable">
                    {step.shortDeliverable ?? step.deliverable}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
