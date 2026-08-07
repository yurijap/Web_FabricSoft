import BackButton from '../../../components/BackButton';
import { Link } from 'react-router-dom';

const formato = [
  { num: '01', titulo: 'Cena privada en hotel premium', descripcion: 'Formato cerrado, sin cámaras y con lugar confirmado únicamente a participantes aceptados.' },
  { num: '02', titulo: '8–12 CFO / CTO participantes', descripcion: 'Mesa reducida para líderes con iniciativas Oracle activas, retos de cierre, migración o rescate en curso.' },
  { num: '03', titulo: 'Sin pitch de FABRIC', descripcion: 'El objetivo es generar conversación ejecutiva real entre pares, no presentar servicios. FABRIC modera, no vende.' },
  { num: '04', titulo: 'NDA mutuo entre participantes', descripcion: 'La conversación se mantiene privada para permitir discusión franca sobre fallas, riesgos y decisiones ejecutivas.' },
  { num: '05', titulo: 'Moderada por Julio Álvarez', descripcion: 'Agenda breve, preguntas difíciles y conversación entre pares. Sin panel decorativo ni contenido patrocinado.' },
];

export default function RoundtablePage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Comunidad Ejecutiva · FABRIC</div>
          <div className="grid-2col">
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, lineHeight: 1.02, color: 'var(--text-primary)', marginBottom: 24 }}>
                Confidential Roundtable.<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>CFO · CTO · Oracle.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Una vez por trimestre, FABRIC reúne a 8–12 CFO y CTO de empresas evaluando Oracle en una cena privada. Sin agenda de ventas. Sin presentaciones. Solo conversación ejecutiva bajo NDA.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Trimestral · Invitación directa · NDA mutuo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 56px' }} className="grid-3col">
          {[
            { num: 'Trimestral', label: 'Frecuencia' },
            { num: '8–12', label: 'CFO / CTO por edición' },
            { num: 'CDMX', label: 'Ubicación privada' },
          ].map((s, i) => (
            <div key={i} style={{ borderRight: i < 2 ? '1px solid var(--border)' : 'none', paddingRight: i < 2 ? 48 : 0, paddingLeft: i > 0 ? 48 : 0 }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 48, fontWeight: 300, color: 'var(--accent)', lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 56px' }} className="grid-2col">

        {/* Formato */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 40 }}>
            Formato
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {formato.map((f) => (
              <div key={f.num} style={{ padding: '28px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', flexShrink: 0, marginTop: 3 }}>{f.num}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--text-primary)', marginBottom: 6 }}>{f.titulo}</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.descripcion}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Solicitud */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 40 }}>
            Solicitar invitación
          </div>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: 40 }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 32 }}>
              El acceso es por invitación directa o solicitud calificada. Los criterios de participación aplican: empresa con iniciativa Oracle activa, cargo CFO / CTO / CIO, empresa USD 50M+.
            </p>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>
              Solicitud sujeta a admisión
            </p>
            <Link
              to="/aplicar"
              style={{ display: 'inline-block', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bg-base)', background: 'var(--accent)', padding: '14px 32px', textDecoration: 'none' }}
            >
              Solicitar invitación →
            </Link>
            <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
              Respuesta en menos de 48 horas hábiles.<br />
              NDA mutuo antes de confirmar participación.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
