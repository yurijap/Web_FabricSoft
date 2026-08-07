import { Link } from 'react-router-dom';
import BackButton from '../../../components/BackButton';

const modelos = [
  {
    id: '01',
    tag: 'Prioridad 1',
    nombre: 'Rescate de Implementación Oracle',
    tagline: 'Para organizaciones con Fusion ya implementado pero sin operar.',
    descripcion:
      'Cuando el go-live ocurrió pero el negocio no funciona: cierres contables pesados, reportes manuales paralelos, usuarios que no adoptaron el sistema, incidencias críticas sin resolver. FABRIC entra, diagnostica y estabiliza.',
    cuando: [
      'Implementación Oracle Fusion incompleta o abandonada por la consultora anterior',
      'Cierre contable mensual mayor a 10 días',
      'Más de 3 reportes ejecutivos generados fuera del ERP',
      'Incidencias críticas abiertas sin fecha de resolución',
      'Usuarios clave con adopción menor al 50%',
    ],
    pricing: [
      { modelo: 'Fixed-Price por fase', detalle: 'Alcance cerrado con hitos atados a estabilización. Si FABRIC se atrasa, no factura semanas adicionales.' },
      { modelo: 'Success-Fee parcial', detalle: 'Porcentaje del valor recuperado. Alinea incentivos con el resultado operativo real.' },
    ],
    ticket: 'USD 150K – 500K',
    plazo: '8 – 16 semanas',
    conversion: '35 – 45% de prospectos evaluados',
    casos: [{ label: 'APE Plazas', slug: 'ape-plazas' }, { label: 'Aplazo', slug: 'aplazo' }],
    accent: 'var(--accent)',
  },
  {
    id: '02',
    tag: 'Prioridad 2',
    nombre: 'Migración a Oracle Fusion Cloud',
    tagline: 'Para empresas que migran desde SAP, EBS, JDE, PeopleSoft o Dynamics.',
    descripcion:
      'Migración controlada desde sistema legacy a Oracle Fusion Cloud, con doctrina de entrega en primer ciclo crítico. El proyecto no se considera entregado en el go-live: se entrega cuando tu primer cierre contable opera en producción sin incidencias.',
    cuando: [
      'SAP S/4 HANA, SAP ECC, Oracle EBS R12, Oracle JD Edwards, Oracle PeopleSoft, Microsoft Dynamics',
      'Empresa USD 50M+ que necesita plataforma ERP moderna en la nube',
      'Ciclo de decisión activo con patrocinio CFO + CTO confirmado',
      'Plazo objetivo de go-live en los próximos 6 – 18 meses',
    ],
    pricing: [
      { modelo: 'Fixed-Price por fase', detalle: 'Presupuesto cerrado con penalización si FABRIC se atrasa por causas propias. Cero sorpresas.' },
    ],
    ticket: 'USD 300K – 2M',
    plazo: '6 – 18 meses',
    conversion: '15 – 25% de prospectos evaluados',
    casos: [],
    accent: 'var(--accent)',
  },
  {
    id: '03',
    tag: 'Prioridad 3',
    nombre: 'Greenfield Oracle Fusion',
    tagline: 'Para empresas sin ERP empresarial que implementan Fusion directamente.',
    descripcion:
      'Implementación de Oracle Fusion Cloud desde cero para organizaciones que operan con QuickBooks, Excel o sistemas legacy y requieren un ERP moderno para sostener su siguiente etapa de crecimiento.',
    cuando: [
      'Sin ERP empresarial implementado o con sistemas legacy inadecuados para la escala actual',
      'Empresa USD 50M+ con crecimiento que exige operación financiera estructurada',
      'Decisión confirmada de implementar Oracle Fusion como plataforma central',
      'Patrocinio CFO + CTO activo desde el inicio del proyecto',
    ],
    pricing: [
      { modelo: 'Fixed-Price con hitos claros', detalle: 'Alcance por fases con quick-wins desde semana 3. Entrega en primer ciclo crítico por contrato.' },
    ],
    ticket: 'USD 250K – 1.5M',
    plazo: '4 – 8 meses',
    conversion: '20 – 30% de prospectos evaluados',
    casos: [],
    accent: 'var(--accent)',
  },
];

const comun = [
  '100% consultores senior con mínimo 8 años de experiencia Oracle',
  'Fixed-Price por fase — sin cobros adicionales por retrasos propios de FABRIC',
  'Cero reportes manuales al cierre del primer ciclo crítico, por contrato',
  'Acta formal de transición a soporte firmada por todos los stakeholders',
  'Documentación viva entregable y actualizable sin dependencia de FABRIC',
];

export default function ModelosPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Modelos de Compromiso · FABRIC</div>
          <div className="grid-2col">
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.02, marginBottom: 24 }}>
                Tres formas de<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>trabajar con FABRIC.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Rescate de implementación crítica, migración controlada desde legacy, o implementación Greenfield. En los tres casos: doctrina contractual de entrega en primer ciclo crítico. La admisión es por evaluación.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Capacidad limitada · Acceso por evaluación · Fixed-Price por defecto
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Garantías comunes */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 56px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
            Compromisos en todos los modelos
          </div>
          <div className="grid-auto-fit">
            {comun.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', flexShrink: 0, marginTop: 3 }}>◆</span>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modelos */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 56px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {modelos.map((m) => (
            <div
              key={m.id}
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '56px 48px', position: 'relative', borderLeft: '3px solid var(--accent)' }}
            >
              {/* Tag + ID */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 28 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{m.id}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', border: '1px solid var(--border)', padding: '3px 10px' }}>{m.tag}</span>
              </div>

              <div className="grid-2col">
                {/* Izquierda */}
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 12 }}>
                    {m.nombre}
                  </h2>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.08em', marginBottom: 24 }}>{m.tagline}</p>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 32 }}>{m.descripcion}</p>

                  {/* Cuándo aplica */}
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>Cuándo aplica</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {m.cuando.map((c, i) => (
                      <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', flexShrink: 0, marginTop: 4 }}>→</span>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c}</span>
                      </li>
                    ))}
                  </ul>

                  {m.casos.length > 0 && (
                    <div style={{ marginTop: 28 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Casos publicados</div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {m.casos.map((c) => (
                          <Link
                            key={c.slug}
                            to={`/casos/${c.slug}`}
                            style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: '1px solid rgba(201,169,110,0.3)', paddingBottom: 2 }}
                          >
                            {c.label} →
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Derecha */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                  {/* Métricas */}
                  <div className="grid-3col" style={{ borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)' }}>
                    {[
                      { label: 'Ticket típico', value: m.ticket },
                      { label: 'Plazo', value: m.plazo },
                      { label: 'Conversión', value: m.conversion },
                    ].map((s, i) => (
                      <div key={i} style={{ padding: '24px 20px', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--accent)', lineHeight: 1.2 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Modelos de pricing */}
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>Modelo de pricing</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {m.pricing.map((p, i) => (
                        <div key={i} style={{ padding: '20px 24px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', marginBottom: 6 }}>{p.modelo}</div>
                          <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.detalle}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    to="/aplicar"
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: 'var(--bg-base)',
                      background: 'var(--accent)',
                      padding: '16px 32px',
                      textDecoration: 'none',
                      textAlign: 'center',
                      transition: 'opacity 200ms',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                  >
                    Iniciar evaluación →
                  </Link>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8, marginTop: -12 }}>
                    Respuesta en 24 horas hábiles · Admisión por evaluación
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ borderTop: '1px solid var(--border)', maxWidth: 1280, margin: '0 auto', padding: '64px 56px 96px' }}>
        <div className="grid-2col" style={{ alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 2.5vw, 36px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 16 }}>
              ¿No sabes cuál modelo aplica a tu situación?
            </div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
              El Rescue Assessment identifica en 12 preguntas si tu implementación Oracle necesita rescate, migración o es candidata a Greenfield. Sin compromiso.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <a
              href="/#fabric-assessment"
              style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', border: '1px solid rgba(201,169,110,0.35)', padding: '16px 32px', textDecoration: 'none', textAlign: 'center', transition: 'border-color 200ms' }}
            >
              Hacer el Rescue Assessment →
            </a>
            <Link
              to="/aplicar"
              style={{ display: 'block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bg-base)', background: 'var(--accent)', padding: '16px 32px', textDecoration: 'none', textAlign: 'center' }}
            >
              Aplicar directamente →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
