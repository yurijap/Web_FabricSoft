import BackButton from '../../../components/BackButton';
import { Link } from 'react-router-dom';

const entregables = [
  { num: '01', titulo: '2 días de inmersión', descripcion: 'Sesiones cerradas con dirección, usuarios clave y responsables técnicos para reconstruir decisiones, riesgos y bloqueos.' },
  { num: '02', titulo: 'Análisis técnico · funcional · operativo', descripcion: 'Revisión de arquitectura, procesos críticos, integraciones, datos, gobierno y responsabilidades reales del proyecto.' },
  { num: '03', titulo: 'Diagnóstico de causas raíz', descripcion: 'Separación clara entre síntomas visibles, causas estructurales y decisiones que deben corregirse antes de invertir más.' },
  { num: '04', titulo: 'Plan de remediación con costos', descripcion: 'Ruta ejecutable con fases, dependencias, inversión estimada y criterios para saber si el rescate vale la pena.' },
  { num: '05', titulo: 'Reporte ejecutivo para junta directiva', descripcion: 'Documento sobrio para CFO, CIO, CTO y consejo: qué pasó, qué riesgo queda y qué decisión sigue.' },
];

export default function PostMortemPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Servicio Premium · FABRIC</div>
          <div className="grid-2col" style={{ alignItems: 'end' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, lineHeight: 1.02, color: 'var(--text-primary)', marginBottom: 24 }}>
                Post-Mortem Privado.<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>USD 25,000.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Para organizaciones con una implementación Oracle que no operó como se esperaba. FABRIC realiza un análisis post-mortem confidencial con diagnóstico de causas raíz y plan de remediación ejecutable.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Confidencial · NDA mutuo desde el primer contacto · Precio fijo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Por qué se cobra */}
      <div className="postmortem-section container grid-2col" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64, gap: 0 }}>
        {[{ num: 'USD 25K', label: 'Precio fijo · sin sorpresas' }, { num: '2 días', label: 'Inmersión con tu equipo' }, { num: '80%', label: 'Convierten a proyecto de remediación' }].map((s, i) => (
          <div className="postmortem-card" key={i}>
            <div className="postmortem-number">{s.num}</div>
            <div className="postmortem-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="container grid-2col" style={{ padding: '80px 56px', gap: '0 80px' }}>

        {/* Entregables */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 40 }}>
            Entregables
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {entregables.map((e) => (
              <div key={e.num} style={{ padding: '32px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', flexShrink: 0, marginTop: 3 }}>{e.num}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 8 }}>{e.titulo}</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{e.descripcion}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario / CTA */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 40 }}>
            Solicitar Post-Mortem
          </div>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: 40 }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 32 }}>
              El precio de USD 25,000 filtra prospectos serios y cubre la inmersión completa. El 80% de los post-mortems convierten en un proyecto de remediación de USD 200–500K.
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>
              Solicitud sujeta a admisión
            </p>
            <Link
              to="/aplicar"
              style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bg-base)', background: 'var(--accent)', padding: '14px 32px', textDecoration: 'none' }}
            >
              Iniciar conversación →
            </Link>
            <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
              Respuesta en menos de 24 horas hábiles.<br />
              NDA mutuo desde el primer contacto.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
