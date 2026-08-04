import BackButton from '../../../components/BackButton';
export default function RechazadosPage() {
  const proyectos = [
    { id: 'E-2026-01', industria: 'Retail Nacional', razon: 'Sin patrocinio CFO directo. El programa era operado por TI sin visibilidad ejecutiva.', trimestre: 'Q1 2026', modulos: 'Fusion Financials · HCM' },
    { id: 'E-2026-02', industria: 'Manufactura', razon: 'Definición de alcance imposible de fijar. Tres iteraciones de SOW sin acuerdo interno del cliente.', trimestre: 'Q1 2026', modulos: 'SCM · Manufacturing' },
    { id: 'E-2026-03', industria: 'Fintech', razon: 'Plazo de 12 semanas no permite primer ciclo crítico estabilizado. Riesgo operativo inaceptable.', trimestre: 'Q2 2026', modulos: 'Fusion Financials · CNBV Compliance' },
    { id: 'E-2026-04', industria: 'Centros Comerciales', razon: 'Migración EBS sin compromiso de capacitación interna. Dependencia perpetua de consultoría externa.', trimestre: 'Q2 2026', modulos: 'Oracle EBS → Fusion' },
    { id: 'E-2026-05', industria: 'Logística / Distribución', razon: 'Presupuesto insuficiente para cubrir fase STABILIZE. Cliente quería entregar en go-live.', trimestre: 'Q1 2026', modulos: 'SCM · WMS · Transportación' },
    { id: 'E-2026-06', industria: 'Servicios Financieros', razon: 'Alcance de upgrade sin ventana operativa realista. Cierre regulatorio en conflicto con timeline propuesto.', trimestre: 'Q2 2026', modulos: 'Oracle EBS Upgrade · HCM' },
    { id: 'E-2026-07', industria: 'Inmobiliario', razon: 'Patrocinio ejecutivo insuficiente: CTO delegó a coordinador sin autoridad de decisión.', trimestre: 'Q2 2026', modulos: 'Fusion Financials · EPM · Real Estate' },
  ];

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Transparencia · FABRIC</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 80px', alignItems: 'end' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, lineHeight: 1.02, color: 'var(--text-primary)', marginBottom: 24 }}>
                Proyectos evaluados.<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>2026.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Publicamos los proyectos que evaluamos y no aceptamos, con las razones de rechazo. La selectividad es parte de nuestra doctrina: no todos los proyectos son adecuados para el modelo FABRIC.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                23 evaluados · {proyectos.length} rechazados · YTD 2026
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { num: '23', label: 'Proyectos evaluados YTD' },
            { num: '30%', label: 'Tasa de rechazo · 7 de 23' },
            { num: '4', label: 'Criterios de evaluación aplicados' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '48px 0', borderRight: i < 2 ? '1px solid var(--border)' : 'none', paddingRight: i < 2 ? 48 : 0, paddingLeft: i > 0 ? 48 : 0 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 56, fontWeight: 300, color: 'var(--accent)', lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla de proyectos */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 56px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 40 }}>
          Registro anonimizado · Identidades protegidas bajo NDA
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 2fr 100px', gap: 24, padding: '12px 24px', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
            <span>ID</span><span>Industria</span><span>Razón de rechazo</span><span>Trimestre</span>
          </div>
          {proyectos.map((p) => (
            <div
              key={p.id}
              style={{ display: 'grid', gridTemplateColumns: '120px 1fr 2fr 100px', gap: 24, padding: '28px 24px', background: 'var(--bg-panel)', borderLeft: '2px solid transparent', transition: 'border-color 200ms' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderLeftColor = 'var(--accent)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'}
            >
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em' }}>{p.id}</div>
              <div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{p.industria}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>{p.modulos}</div>
              </div>
              <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.razon}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>{p.trimestre}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', lineHeight: 2 }}>
          Los proyectos listados han sido anonimizados. Razones de rechazo publicadas con autorización. Criterios completos de evaluación en{' '}
          <a href="/#criterios" style={{ color: 'var(--accent)' }}>Criterios de admisión →</a>
        </div>
      </div>
    </div>
  );
}
