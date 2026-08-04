import { useParams } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import './casos-detalle.css';

const CASOS: Record<string, {
  nombre: string;
  verificablePor: string;
  hitos: { fecha: string; titulo: string; descripcion: string; evidencia: string; documento: string; verificable: boolean; }[];
}> = {
  'ape-plazas': {
    nombre: 'APE Plazas',
    verificablePor: 'Responsable financiero de APE Plazas · Accesible bajo NDA mutuo',
    hitos: [
      {
        fecha: '06 ABR 2026',
        titulo: 'Go-live ejecutado',
        descripcion: 'Salida a producción en fecha contractual. Módulos Financials, Procurement y EPM operando con datos reales. Hito intermedio — el proyecto no se considera entregado aquí.',
        evidencia: 'Acta de go-live',
        documento: 'acta-golive',
        verificable: true,
      },
      {
        fecha: '15 ABR 2026',
        titulo: 'Cierre quincenal validado',
        descripcion: 'Primer corte de validación quincenal ejecutado en producción con acompañamiento FABRIC. Cero incidencias críticas abiertas al cierre del día.',
        evidencia: 'Reporte FABRIC',
        documento: 'reporte-quincenal',
        verificable: true,
      },
      {
        fecha: '30 ABR 2026',
        titulo: 'Cierre contable completo',
        descripcion: 'Primer ciclo contable completo ejecutado en producción sin incidencias críticas. Este es el hito final contractual de FABRIC — el momento en que el proyecto se considera entregado. Acta de transición firmada por todos los stakeholders.',
        evidencia: 'Acta de transición firmada',
        documento: 'acta-transicion',
        verificable: true,
      },
    ],
  },
  'aplazo': {
    nombre: 'Aplazo',
    verificablePor: 'Acceso restringido · Solo en conversación calificada bajo NDA',
    hitos: [
      {
        fecha: 'Reservado',
        titulo: 'Referencia privada de rescate',
        descripcion: 'Caso disponible únicamente en conversación calificada por confidencialidad operativa.',
        evidencia: '',
        documento: '',
        verificable: false,
      },
      {
        fecha: 'Reservado',
        titulo: 'Métricas de rescate bajo NDA',
        descripcion: 'Los indicadores del rescate se comparten solo con organizaciones que atraviesan una situación comparable.',
        evidencia: '',
        documento: '',
        verificable: false,
      },
    ],
  },
};

export default function AuditTrailPage() {
  const { slug } = useParams<{ slug: string }>();
  const caso = CASOS[slug ?? ''];

  if (!caso) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--mono)', color: 'var(--text-tertiary)', fontSize: 12, letterSpacing: '0.2em' }}>CASO NO ENCONTRADO</p>
      </div>
    );
  }

  const verificables = caso.hitos.filter(h => h.verificable).length;

  return (
    <div className="audit-trail-page" style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 100 }}>
      <div className="audit-trail-back" style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>

      {/* Hero */}
      <div className="audit-trail-hero" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div className="audit-trail-hero-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Audit Trail · {caso.nombre}</div>
          <div className="audit-trail-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 80px', alignItems: 'end' }}>
            <div>
              <h1 className="audit-trail-title" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, lineHeight: 1.02, color: 'var(--text-primary)', marginBottom: 24 }}>
                Transparencia radical.<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Verificable.</em>
              </h1>
            </div>
            <div className="audit-trail-summary">
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Registro público de los hitos del proyecto con fechas exactas. La evidencia respaldatoria está disponible bajo NDA mutuo para CFO, CIO y CTO evaluando FABRIC.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                {verificables} hitos verificables · {caso.hitos.length} hitos totales
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="audit-trail-timeline-wrap" style={{ maxWidth: 900, margin: '0 auto', padding: '80px 56px' }}>
        <div className="audit-trail-timeline" style={{ position: 'relative', paddingLeft: 40 }}>
          <div className="audit-trail-line" style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: 'linear-gradient(to bottom, var(--accent) 80%, var(--border))' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
            {caso.hitos.map((hito, i) => (
              <div className="audit-trail-item" key={i} style={{ position: 'relative' }}>
                {/* Dot */}
                <div className="audit-trail-dot" style={{
                  position: 'absolute', left: -40, top: 6,
                  width: 14, height: 14,
                  border: `1px solid ${hito.verificable ? 'var(--accent)' : 'var(--border)'}`,
                  background: hito.verificable ? 'var(--accent)' : 'var(--bg-base)',
                }} />

                <div className="audit-trail-date" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
                  {hito.fecha}
                  {hito.verificable && (
                    <span style={{ color: 'var(--accent)', opacity: 0.55, fontSize: 8 }}>◆ Verificable bajo NDA</span>
                  )}
                </div>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 12 }}>
                  {hito.titulo}
                </h3>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 620 }}>
                  {hito.descripcion}
                </p>
                {hito.evidencia && (
                  <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      Evidencia: {hito.evidencia}
                    </div>
                    <a
                      href="#"
                      data-interaction="nda-pdf"
                      data-documento={hito.documento}
                      data-caso={slug}
                      data-source={`audit-trail-${slug}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        border: '1px solid rgba(201,169,110,0.35)',
                        padding: '7px 14px',
                        color: 'var(--accent)',
                        fontFamily: 'var(--mono)', fontSize: 9,
                        letterSpacing: '0.15em', textTransform: 'uppercase',
                        textDecoration: 'none',
                      }}
                    >
                      Solicitar bajo NDA →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verificable por */}
        <div style={{ marginTop: 64, padding: '28px 32px', border: '1px solid var(--border)', background: 'rgba(201,169,110,0.03)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>
            Verificable por
          </div>
          <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {caso.verificablePor}
          </div>
        </div>

        <div style={{ marginTop: 32, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', lineHeight: 2 }}>
          Los hitos verificables incluyen documentación respaldatoria bajo NDA mutuo. El acceso requiere evaluación previa de FABRIC.
        </div>
      </div>
    </div>
  );
}
