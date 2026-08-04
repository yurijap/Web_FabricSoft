
import { Link } from 'react-router-dom';
import { useInViewOnce } from '../../../hooks/useInViewOnce';

interface MetricRow {
  label: string;
  value: string;
  detail: string;
  highlight?: boolean;
  verified?: boolean;
}

interface CaseData {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  status: string;
  metrics: MetricRow[];
  quote: string;
  author: string;
  href: string;
  proofHref: string;
  pdfCta: {
    label: string;
    disabled?: boolean;
  };
}

const cases: CaseData[] = [
  {
    id: "ape-plazas",
    tag: "Caso Ancla · Abril 2026",
    title: "APE Plazas",
    subtitle: "Implementación Oracle Fusion Cloud en operadora de centros comerciales",
    status: "En Producción",
    href: "/casos/ape-plazas",
    proofHref: "/casos/ape-plazas/audit-trail",
    pdfCta: {
      label: "Solicitar PDF bajo NDA",
    },
    metrics: [
      { label: "Go-live planeado", value: "06 abril 2026", detail: "Fecha contractual", verified: true },
      { label: "Go-live ejecutado", value: "06 abril 2026", detail: "Cumplimiento", verified: true },
      { label: "Primer cierre contable", value: "Abril 2026", detail: "Primer ciclo crítico", verified: true },
      { label: "Incidencias críticas", value: "0", detail: "Primer cierre", verified: true },
      { label: "Transición a soporte", value: "En firma", detail: "Acta formal", verified: true }
    ],
    quote:
      "El cierre contable de abril se ejecutó sin incidencias con acompañamiento FABRIC. Ese es el momento en el que consideramos el proyecto entregado.",
    author: ""
  },
  {
    id: "aplazo",
    tag: "Caso de Rescate · Fintech",
    title: "Aplazo",
    subtitle: "Rescate de implementación Oracle Fusion en fintech regulada de crédito al consumo",
    status: "Bajo NDA",
    href: "/casos/aplazo",
    proofHref: "/casos/aplazo/audit-trail",
    pdfCta: {
      label: "Solicitar PDF bajo NDA",
    },
    metrics: [
      { label: "Estado inicial", value: "Crítico", detail: "Post go-live", verified: false },
      { label: "Reportes manuales eliminados", value: "5", detail: "Controles paralelos", verified: true },
      { label: "Tiempo de cierre", value: "18d → 6d", detail: "Cierre contable", verified: true },
      { label: "Adopción usuarios", value: "95%", detail: "Usuarios clave", verified: true },
      { label: "Compliance regulatorio", value: "Operativo", detail: "Fintech", verified: true }
    ],
    quote:
      "FABRIC tomó una implementación abandonada y la convirtió en plataforma operativa estable en 10 semanas. Sin renegociaciones.",
    author: ""
  }
];

export default function S07Casos() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  return (
    <section ref={ref} id="s07" className={`demo-section s07 transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="container">
        <div className="s07-intro">
          <div className="label">Casos Seleccionados · 2026</div>
          <h2>
            Entregas y rescates documentados, <span className="text-[#C9A96E]">verificables bajo NDA.</span>
          </h2>
          <p>
            Una implementación ancla y un rescate Oracle Fusion documentados con evidencia
            disponible bajo NDA para prospectos calificados.
          </p>
          <div className="s07-meta">
            <span>Última actualización · 19.05.2026</span>
            <span>Idioma · ES / EN</span>
            <span>Acceso · Bajo NDA</span>
          </div>
        </div>

        <div className="casos-grid">
          {cases.map((item) => (
            <article className="caso-card" key={item.id}>
              <div className="caso-head">
                <div>
                  <div className="caso-tag">{item.tag}</div>
                  <h3 className="caso-title">{item.title}</h3>
                  <div className="caso-subtitle">{item.subtitle}</div>
                </div>
                <div className="caso-head-meta">
                  <span className="status-badge available">{item.status}</span>
                  <div className="nda-stamp">Verificable bajo NDA</div>
                </div>
              </div>

              <div className="caso-metrics">
                {item.metrics.map((metric) => (
                  <div className="caso-metric" key={metric.label}>
                    <span className="caso-metric-label">
                      {metric.label}
                      <small>{metric.detail}</small>
                    </span>
                    <span className="caso-metric-val">
                      {metric.highlight ? <span className="text-[#C9A96E]">{metric.value}</span> : metric.value}
                      {metric.verified ? <span className="check">✓</span> : null}
                    </span>
                  </div>
                ))}
              </div>

              <blockquote className="caso-quote">
                {item.quote}
                <span className="caso-quote-attr">{item.author}</span>
              </blockquote>

              <div className="caso-footer">
                <div className="caso-ctas">
                  <Link to={item.href} className="caso-action caso-action-primary">
                    Leer caso completo
                  </Link>
                  {item.pdfCta.disabled ? (
                    <span className="caso-action caso-action-disabled" aria-disabled="true">
                      {item.pdfCta.label}
                    </span>
                  ) : (
                    <a
                      href="#"
                      className="caso-action"
                      data-interaction="nda-pdf"
                      data-documento="paper-nda"
                      data-caso={item.id}
                      data-source={`s07-${item.id}`}
                    >
                      {item.pdfCta.label}
                    </a>
                  )}
                </div>
                <span className="nda-seal">NDA · Auditado</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
