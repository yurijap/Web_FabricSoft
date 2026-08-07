import BackButton from '../../../components/BackButton';
export default function DoctrinaNoAlineacionPage() {
  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Doctrina · FABRIC</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 80px', alignItems: 'end' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, lineHeight: 1.02, color: 'var(--text-primary)', marginBottom: 24 }}>
                Doctrina de<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>no alineación.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                FABRIC no vende licencias, no representa a Oracle y no recibe incentivos por empujar una arquitectura específica. Nuestra obligación es con la operación del cliente y con el primer ciclo crítico funcionando.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Independencia técnica · Conflictos explícitos · Cliente primero
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 56px' }}>
        {[
          { num: '01', titulo: 'No vendemos licencias', cuerpo: 'FABRIC no monetiza la venta de software. La recomendación técnica no depende de comisiones, cuotas de canal ni presión comercial de terceros.' },
          { num: '02', titulo: 'No defendemos el go-live vacío', cuerpo: 'Un proyecto no termina cuando el sistema enciende. Termina cuando el primer ciclo crítico corre con evidencia, responsables y transición operativa.' },
          { num: '03', titulo: 'Conflictos visibles desde el inicio', cuerpo: 'Si existe una relación, restricción o dependencia que pueda afectar el juicio técnico, se declara antes de firmar alcance.' },
          { num: '04', titulo: 'El cliente conserva el control', cuerpo: 'La arquitectura, documentación y decisiones clave deben quedar entendibles para el equipo interno. FABRIC no diseña dependencia innecesaria.' },
        ].map((s) => (
          <div key={s.num} style={{ paddingBottom: 56, marginBottom: 56, borderBottom: '1px solid var(--border)', display: 'flex', gap: 32 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.15em', flexShrink: 0, marginTop: 4 }}>{s.num}</div>
            <div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 16 }}>{s.titulo}</h2>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{s.cuerpo}</p>
            </div>
          </div>
        ))}

        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', lineHeight: 2 }}>
          © 2026 FABRIC SOFT MEXICO SA DE CV · Doctrina en revisión permanente
        </div>
      </div>
    </div>
  );
}
