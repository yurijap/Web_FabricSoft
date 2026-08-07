import { useParams, Link, Navigate } from 'react-router-dom';
import './casos-detalle.css';


interface TimelineItem { date: string; event: string; meta: string; }
interface CaseBlock {
  eyebrow: string;
  title: string;
  body?: string[];
  quote?: string;
  quoteAttr?: string;
  timeline?: TimelineItem[];
}

const caseStudies: Record<string, {
  tag: string;
  client: string;
  title: string;
  deck: string;
  meta: {label:string;value:string;sub:string}[];
  blocks: CaseBlock[];
  results: {label:string;before?:string;after?:string;value?:string}[];
}> = {
  'ape-plazas': {
    tag: "Caso Ancla · Abril 2026 · Verificable bajo NDA",
    client: "APE Plazas",
    title: "Implementación Oracle Fusion Cloud en APE Plazas.",
    deck: "Operadora multi-plaza en México con 7 centros comerciales y más de 1,200 arrendatarios activos. Go-live el 06 abril 2026. Primer cierre contable en producción ejecutado el 30 de abril sin incidencias críticas.",
    meta: [
      { label: "Módulos", value: "Financials · Procurement · EPM", sub: "Oracle Fusion Cloud" },
      { label: "Go-live", value: "06 abril 2026", sub: "En fecha contractual" },
      { label: "Primer cierre", value: "30 abril 2026", sub: "Sin incidencias críticas" },
      { label: "Estado", value: "Fase OPTIMIZE", sub: "Plan trimestral activo" },
    ],
    blocks: [
      {
        eyebrow: "01 · El reto",
        title: "Una arquitectura financiera que debía operar el primer mes sin margen de error.",
        body: [
          "APE Plazas opera 7 centros comerciales con múltiples entidades legales, conciliación de rentas variables por arrendatario (porcentaje sobre ventas) y obligaciones fiscales CFDI 4.0 con más de 1,200 contratos activos.",
          "El reto no era técnico: era garantizar que el cierre contable de abril —el primero en producción— ejecutara sin incidencias en un entorno donde cada día de retraso representa impacto regulatorio y pérdida de confianza ejecutiva.",
          "El cliente había intentado una implementación previa que fue suspendida después del go-live por inestabilidad en el módulo de conciliación. El historial pesaba sobre el equipo interno.",
        ],
      },
      {
        eyebrow: "02 · El modelo FABRIC",
        title: "Doctrina de entrega en primer ciclo crítico, aplicada.",
        body: [
          "FABRIC no considera entregado el proyecto en el go-live. El alcance contractual incluyó formalmente el acompañamiento del primer ciclo contable completo en producción, con SLA de respuesta de 2 horas para incidencias críticas durante todo abril.",
          "Se asignó una célula CFO-Tech-IA dedicada: consultor senior Oracle Fusion Financials, especialista en procesos de cierre contable y especialista IA aplicada a automatización de conciliación. La célula operó con reuniones diarias con el CFO durante las primeras dos semanas.",
        ],
        quote: "El cierre de abril se ejecutó el 30 sin una sola incidencia crítica abierta. Ese es el momento en el que FABRIC considera el proyecto entregado — no el 6 de abril.",
        quoteAttr: "— Doctrina FABRIC · Principio de primer ciclo crítico",
      },
      {
        eyebrow: "03 · Ejecución · 5 fases",
        title: "DIAGNOSE → ARCHITECT → DEPLOY → STABILIZE → OPTIMIZE.",
        body: [
          "DIAGNOSE: Análisis de procesos de cierre, mapeo de integraciones bancarias, identificación de riesgos en conciliación de rentas variables y definición de gobierno de proyecto con comité semanal C-level.",
          "ARCHITECT: Diseño de arquitectura multi-entidad, definición de plan de cuentas consolidado, integración con bancos y sistemas satélite de arrendamiento, configuración EPM para tablero ejecutivo.",
          "DEPLOY: Implementación bajo control de cambios estricto, capacitación de 14 usuarios clave, pruebas integrales con datos históricos de 18 meses, validación CFDI 4.0 con SAT.",
          "STABILIZE: Acompañamiento operativo durante todo abril — soporte presencial y remoto, resolución en tiempo de respuesta contractual, validación de cierre día a día, documentación de ajustes finos.",
          "OPTIMIZE: Plan trimestral de optimización en curso: automatización de conciliación de rentas variables con IA y expansión del tablero ejecutivo a nivel de plaza individual.",
        ],
        timeline: [
          { date: "06 ABR 2026", event: "Go-live Oracle Fusion Cloud", meta: "Acta de go-live · Evidencia bajo NDA" },
          { date: "07–14 ABR 2026", event: "Fase STABILIZE · Reuniones diarias CFO", meta: "Bitácora operativa disponible bajo NDA" },
          { date: "15–29 ABR 2026", event: "Validación de cierre contable día a día", meta: "0 incidencias críticas sin resolver" },
          { date: "30 ABR 2026", event: "Cierre contable completo sin incidencias", meta: "Acta de transición firmada · Evidencia bajo NDA" },
          { date: "MAY 2026", event: "Inicio fase OPTIMIZE · Plan trimestral", meta: "Acceso controlado" },
        ],
      },
      {
        eyebrow: "04 · Lecciones operativas",
        title: "Lo que documentamos para que no tengas que aprenderlo en producción.",
        body: [
          "1. El go-live no es el riesgo. El primer cierre lo es. La industria celebra el go-live como hito final. FABRIC documentó que el riesgo operativo real se materializa en los primeros 15–30 días en producción, cuando los procesos de negocio se ejercitan por primera vez bajo carga real.",
          "2. La célula CFO-Tech-IA acelera la estabilización. La asignación de un equipo multidisciplinario —senior Oracle, especialista en cierre contable y especialista IA— permitió identificar y resolver incidencias en horas, no días. La disponibilidad directa con el CFO eliminó cuellos de botella de escalación.",
          "3. La transición a soporte debe ser un hito formal, no una asunción. FABRIC entregó un acta formal de transición firmada por todos los stakeholders. Este documento elimina la ambigüedad sobre cuándo termina el proyecto y empieza la operación regular — una fuente frecuente de disputas post go-live en el mercado.",
        ],
      },
    ],
    results: [
      { label: "Go-live en fecha contractual", value: "✓ 06 abril 2026" },
      { label: "Multi-entidad en producción", value: "✓ 7 plazas operando" },
      { label: "Cierre contable abril", value: "✓ Sin incidencias críticas" },
      { label: "Tablero ejecutivo", value: "✓ CFO + DG activos" },
      { label: "Adopción usuarios clave", value: "✓ 14 usuarios documentados" },
      { label: "Transición a soporte", value: "✓ Acta firmada" },
    ],
  },
  'aplazo': {
    tag: "Referencia Reservada · Acceso bajo NDA",
    client: "Aplazo",
    title: "Rescate Oracle Fusion en Aplazo.",
    deck: "Referencia privada en servicios financieros. Por confidencialidad, los detalles operativos, métricas y evidencia se comparten únicamente en conversaciones calificadas bajo NDA mutuo.",
    meta: [
      { label: "Industria", value: "Fintech", sub: "Servicios financieros" },
      { label: "Tipo", value: "Rescate", sub: "Oracle Fusion" },
      { label: "Métricas", value: "Bajo NDA", sub: "Prospectos calificados" },
      { label: "Evidencia", value: "Restringida", sub: "Acceso controlado" },
    ],
    blocks: [
      {
        eyebrow: "01 · Contexto",
        title: "Rescate Oracle en entorno fintech.",
        body: [
          "El caso pertenece a una conversación de rescate Oracle Fusion en servicios financieros, donde la confidencialidad operativa es parte del valor.",
          "FABRIC no publica métricas sensibles, fechas internas ni documentos de cliente en abierto. El acceso se reserva a CFO, CIO y CTO evaluando una intervención real.",
        ],
      },
      {
        eyebrow: "02 · Aproximación",
        title: "Evidencia reservada para prospectos calificados.",
        body: [
          "Los rescates de misión crítica rara vez pueden exponerse en público sin comprometer información operacional.",
          "Por eso esta referencia funciona como puerta de acceso: si tu organización califica, el equipo comparte el contexto verificable bajo NDA mutuo.",
        ],
      },
    ],
    results: [
      { label: "Tipo", value: "Rescate" },
      { label: "Industria", value: "Fintech" },
      { label: "Métricas", value: "Bajo NDA" },
      { label: "Evidencia", value: "Restringida" },
    ],
  },
};

export default function CasoPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug || !(slug in caseStudies)) {
    return <Navigate to="/" replace />;
  }

  const c = caseStudies[slug];

  return (
    <>
      <main style={{ background: 'var(--bg-base)', minHeight: '100vh', paddingTop: 80 }}>
        {/* Hero */}
        <section className="case-page-hero" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <Link to="/#casos" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'inline-block', marginBottom: 40 }}>
              ← Volver a casos
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>{c.tag}</div>
              <Link to={`/casos/${slug}/audit-trail`} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', border: '1px solid var(--border)', padding: '6px 14px', transition: 'color 150ms, border-color 150ms' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
              >
                Audit Trail →
              </Link>
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px,5vw,72px)', fontWeight: 300, lineHeight: 1.05, marginBottom: 24, maxWidth: 900 }}>{c.title}</h1>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 720, marginBottom: 56 }}>{c.deck}</p>
            <div className="grid-auto-fit" style={{ border: '1px solid var(--border)', borderBottom: 'none' }}>
              {c.meta.map((m, i) => (
                <div key={i} style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', borderRight: i < c.meta.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 4 }}>{m.value}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Content blocks */}
        {c.blocks.map((block, bi) => (
          <section key={bi} style={{ borderBottom: '1px solid var(--border)', padding: '80px 0' }}>
            <div className="container">
              <div className="grid-2col" style={{ gap: '64px', alignItems: 'start' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.25em', textTransform: 'uppercase', paddingTop: 8, position: 'sticky', top: 100 }}>{block.eyebrow}</div>
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px,3vw,40px)', fontWeight: 300, marginBottom: 32, lineHeight: 1.15 }}>{block.title}</h2>
                  {block.body?.map((p, pi) => (
                    <p key={pi} style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.75, marginBottom: 20 }}>{p}</p>
                  ))}
                  {block.quote && (
                    <blockquote style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 24, margin: '32px 0', fontFamily: 'var(--serif)', fontSize: 19, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                      {block.quote}
                      <cite style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase', fontStyle: 'normal', marginTop: 12 }}>{block.quoteAttr}</cite>
                    </blockquote>
                  )}
                  {block.timeline && (
                    <div style={{ position: 'relative', paddingLeft: 32, marginTop: 24 }}>
                      <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: 'linear-gradient(to bottom, var(--accent) 80%, var(--border))' }} />
                      {block.timeline.map((t, ti) => (
                        <div key={ti} style={{ position: 'relative', paddingBottom: 28 }}>
                          <div style={{ position: 'absolute', left: -29, top: 4, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-base)' }} />
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.2em', marginBottom: 4 }}>{t.date}</div>
                          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 2 }}>{t.event}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>{t.meta}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Results */}
        <section className="case-results-section">
          <div className="container">
            <div className="case-results-layout">
              <div className="case-section-label">05 · Resultados verificables</div>
              <div className="case-results-content">
                <div className="case-results-heading">
                  <h2>Métricas <span>medibles y auditadas.</span></h2>
                  <p>Publicamos solo lo verificable. La evidencia completa se comparte bajo NDA mutuo.</p>
                </div>

                <div className="case-results-grid">
                  {c.results.map((r, ri) => (
                    <article key={ri} className="case-result-card">
                      <div className="case-result-label">{r.label}</div>
                      {r.before ? (
                        <div className="case-result-value case-result-delta">
                          <span>{r.before}</span>
                          <span aria-hidden="true">→</span>
                          <strong>{r.after}</strong>
                        </div>
                      ) : (
                        <div className="case-result-value">{r.value}</div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA final — evidencia y NDA */}
        <section style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <div className="grid-2col" style={{ gap: '64px', alignItems: 'start' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.25em', textTransform: 'uppercase', paddingTop: 8 }}>06 · Evidencia</div>
              <div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px,3vw,40px)', fontWeight: 300, marginBottom: 16, lineHeight: 1.15 }}>
                  Hitos verificables.<br /><span style={{ color: 'var(--accent)' }}>Fechas exactas.</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.75, marginBottom: 40, maxWidth: 560 }}>
                  El audit trail público documenta cada hito del proyecto con fecha exacta. La evidencia respaldatoria — actas, bitácoras y acta de transición — se comparte bajo NDA mutuo con prospectos calificados.
                </p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Link
                    to={`/casos/${slug}/audit-trail`}
                    style={{ padding: '14px 28px', background: 'var(--accent)', color: 'var(--bg-base)', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}
                  >
                    Ver audit trail →
                  </Link>
                  <a
                    href="#"
                    data-interaction="nda-pdf"
                    data-documento="paper-nda"
                    data-caso={slug}
                    data-source={`caso-${slug}`}
                    style={{ padding: '14px 28px', background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none' }}
                  >
                    Solicitar evidencia bajo NDA
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
