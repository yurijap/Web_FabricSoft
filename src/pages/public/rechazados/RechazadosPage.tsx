import BackButton from '../../../components/BackButton';
import './rechazados.css';


export default function RechazadosPage() {
  const proyectos = [
    { id: 'E-2026-01', industria: 'Retail Nacional',        razon: 'Sin patrocinio CFO directo. El programa era operado por TI sin visibilidad ejecutiva.',                                    trimestre: 'Q1 2026', modulos: 'Fusion Financials · HCM' },
    { id: 'E-2026-02', industria: 'Manufactura',            razon: 'Definición de alcance imposible de fijar. Tres iteraciones de SOW sin acuerdo interno del cliente.',                      trimestre: 'Q1 2026', modulos: 'SCM · Manufacturing' },
    { id: 'E-2026-03', industria: 'Fintech',                razon: 'Plazo de 12 semanas no permite primer ciclo crítico estabilizado. Riesgo operativo inaceptable.',                         trimestre: 'Q2 2026', modulos: 'Fusion Financials · CNBV Compliance' },
    { id: 'E-2026-04', industria: 'Centros Comerciales',    razon: 'Migración EBS sin compromiso de capacitación interna. Dependencia perpetua de consultoría externa.',                       trimestre: 'Q2 2026', modulos: 'Oracle EBS → Fusion' },
    { id: 'E-2026-05', industria: 'Logística / Distribución', razon: 'Presupuesto insuficiente para cubrir fase STABILIZE. Cliente quería entregar en go-live.',                             trimestre: 'Q1 2026', modulos: 'SCM · WMS · Transportación' },
    { id: 'E-2026-06', industria: 'Servicios Financieros',  razon: 'Alcance de upgrade sin ventana operativa realista. Cierre regulatorio en conflicto con timeline propuesto.',               trimestre: 'Q2 2026', modulos: 'Oracle EBS Upgrade · HCM' },
    { id: 'E-2026-07', industria: 'Inmobiliario',           razon: 'Patrocinio ejecutivo insuficiente: CTO delegó a coordinador sin autoridad de decisión.',                                  trimestre: 'Q2 2026', modulos: 'Fusion Financials · EPM · Real Estate' },
  ];

  const stats = [
    { num: '23',  label: 'Proyectos evaluados YTD' },
    { num: '30%', label: 'Tasa de rechazo' },
    { num: '4',   label: 'Criterios de admisión' },
  ];

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100, minHeight: '100vh' }}>

      {/* ── Back button ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>

      {/* ── Header ── */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 80 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 56px 0' }}>
          <div className="label" style={{ marginBottom: 24 }}>Rechazados · FABRIC</div>
          <div className="grid-2col" style={{ alignItems: 'end', gap: '0 80px' }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--serif)',
                fontSize: 'clamp(40px, 5vw, 72px)',
                fontWeight: 300,
                lineHeight: 1.02,
                color: 'var(--text-primary)',
                marginBottom: 0,
              }}>
                Proyectos evaluados.<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>2026.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24 }}>
                Publicamos los proyectos que evaluamos y no aceptamos, con las razones de rechazo.
                La selectividad es parte de nuestra doctrina: no todos los proyectos son adecuados para el modelo FABRIC.
              </p>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                23 evaluados · {proyectos.length} rechazados · YTD 2026
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Estadísticas ── */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 56px' }}>
          <div className="rechazados-stats-grid">
            {stats.map((s, i) => (
              <div key={i} style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '48px 40px',
                textAlign: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                transition: 'transform .25s, box-shadow .25s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'none';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
              }}>
                <div style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 'clamp(48px, 5vw, 72px)',
                  fontWeight: 300,
                  color: 'var(--accent)',
                  lineHeight: 1,
                  marginBottom: 16,
                }}>
                  {s.num}
                </div>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Registro de proyectos ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 56px' }}>

        {/* Subtítulo */}
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--accent)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom: 48,
        }}>
          Registro anonimizado · Identidades protegidas bajo NDA
        </div>

        {/* Lista de proyectos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {proyectos.map((p) => (
            <div
              key={p.id}
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '32px 40px',
                borderLeft: '4px solid transparent',
                transition: 'border-left-color .2s, box-shadow .2s',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderLeftColor = 'var(--accent)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.16)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
              }}
            >
              {/* Fila superior: ID + industria + trimestre */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.15em', fontWeight: 500 }}>
                    {p.id}
                  </span>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-primary)', fontWeight: 400 }}>
                    {p.industria}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em' }}>
                  {p.trimestre}
                </span>
              </div>

              {/* Módulos */}
              <div style={{
                fontFamily: 'var(--mono)',
                fontSize: 9,
                color: 'var(--accent)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 12,
                opacity: 0.7,
              }}>
                {p.modulos}
              </div>

              {/* Razón de rechazo */}
              <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {p.razon}
              </div>
            </div>
          ))}
        </div>

        {/* Nota al pie */}
        <div style={{
          marginTop: 80,
          paddingTop: 32,
          borderTop: '1px solid var(--border)',
          fontFamily: 'var(--mono)',
          fontSize: 9,
          color: 'var(--text-tertiary)',
          letterSpacing: '0.15em',
          lineHeight: 2,
        }}>
          Los proyectos listados han sido anonimizados. Razones de rechazo publicadas con autorización.
          Criterios completos de evaluación en{' '}
          <a href="/#criterios" style={{ color: 'var(--accent)' }}>Criterios de admisión →</a>
        </div>
      </div>

    </div>
  );
}
