import { useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import { api } from '../../../config/api';
import { getInteractionTracking } from '../../../utils/tracking';

const HALLAZGOS = [
  { id: '01', label: 'Compute over-provisioning',        ejemplo: 'Instancias con <20% CPU promedio' },
  { id: '02', label: 'Storage huérfano',                 ejemplo: 'Block volumes sin attachment activo' },
  { id: '03', label: 'Networking sin uso',               ejemplo: 'Load balancers, NAT gateways inactivos' },
  { id: '04', label: 'Database right-sizing',            ejemplo: 'Autonomous DB sobre-dimensionado' },
  { id: '05', label: 'Servicios always-on → scale-to-zero', ejemplo: 'Cargas intermitentes sin auto-scaling' },
  { id: '06', label: 'Backup / snapshot cleanup',        ejemplo: 'Snapshots acumulados sin política de retención' },
];

const COMO_FUNCIONA = [
  {
    paso: '01',
    titulo: 'Solicitas el diagnóstico',
    descripcion: 'Completa el formulario con tu información. FABRIC contacta en 24 horas hábiles para coordinar el acceso.',
  },
  {
    paso: '02',
    titulo: 'Acceso de solo lectura',
    descripcion: 'Compartes acceso read-only a tu tenant OCI o ejecutas un script que FABRIC te proporciona. Sin acceso de escritura. Sin cambios.',
  },
  {
    paso: '03',
    titulo: 'Reporte en 48-72 horas',
    descripcion: 'Recibes un reporte con hallazgos cuantificados en USD, porcentaje de ahorro potencial y áreas de optimización priorizadas.',
  },
];

const PUBLIC_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live', 'msn', 'me', 'proton'];

const GASTO_OPTIONS = [
  'Menos de USD 5,000 / mes',
  'USD 5,000 – 15,000 / mes',
  'USD 15,000 – 50,000 / mes',
  'USD 50,000 – 150,000 / mes',
  'Más de USD 150,000 / mes',
];

export default function OptimizadorOciPage() {
  const [form, setForm] = useState({
    empresa: '',
    cargo: '',
    email: '',
    gastoOci: '',
    ndaAceptado: false,
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const enviar = async () => {
    setError('');

    if (!form.empresa.trim()) { setError('Ingresa el nombre de tu empresa.'); return; }
    if (!form.cargo.trim()) { setError('Ingresa tu cargo.'); return; }
    if (!form.email.trim() || !form.email.includes('@')) { setError('Email inválido.'); return; }

    const dominio = form.email.split('@')[1]?.split('.')[0]?.toLowerCase() ?? '';
    if (PUBLIC_DOMAINS.includes(dominio)) { setError('Usa tu correo corporativo.'); return; }

    if (!form.gastoOci) { setError('Selecciona tu gasto mensual aproximado en OCI.'); return; }
    if (!form.ndaAceptado) { setError('Debes aceptar la revisión bajo NDA.'); return; }

    setLoading(true);
    try {
      await api.post('/oci-audit/solicitar', {
        empresa:     form.empresa,
        cargo:       form.cargo,
        email:       form.email,
        gastoOci:    form.gastoOci,
        ndaAceptado: form.ndaAceptado,
        tracking:    getInteractionTracking('optimizador-oci', 'optimizador-oci-page'),
      });
      setSent(true);
    } catch {
      setError('No se pudo registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100, minHeight: '100vh' }}>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>FABRIC OCI Cost Audit · Diagnóstico gratuito</div>
          <div className="grid-2col" style={{ alignItems: 'end' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.02, marginBottom: 24 }}>
                Optimizador OCI.<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Ahorro cuantificado en 48h.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                FABRIC audita tu tenant OCI con acceso de solo lectura y entrega un reporte con hallazgos cuantificados en USD. Sin compromiso. Sin instrucciones técnicas incompletas. Solo lo que puedes ejecutar.
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: 'var(--accent)', lineHeight: 1 }}>48h</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>Entrega reporte</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: 'var(--accent)', lineHeight: 1 }}>$0</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>Costo diagnóstico</div>
                </div>
                <div style={{ width: 1, background: 'var(--border)' }} />
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: 32, color: 'var(--accent)', lineHeight: 1 }}>NDA</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>Desde el inicio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 56px', display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '0 64px' }}>

        {/* Contenido */}
        <div>

          {/* Cómo funciona */}
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
              Cómo funciona
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {COMO_FUNCIONA.map((c) => (
                <div key={c.paso} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '24px 28px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.15em', flexShrink: 0, marginTop: 3 }}>{c.paso}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8 }}>{c.titulo}</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{c.descripcion}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hallazgos típicos */}
          <div style={{ marginBottom: 64 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 32 }}>
              Hallazgos típicos que cuantificamos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {HALLAZGOS.map((h) => (
                <div key={h.id} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '18px 28px', display: 'grid', gridTemplateColumns: '28px 1fr 1fr', gap: '0 20px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.12em' }}>{h.id}</span>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>{h.label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>{h.ejemplo}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', lineHeight: 1.8 }}>
              El reporte incluye ahorro mensual y anual estimado por hallazgo. No incluye instrucciones técnicas ni scripts de remediación — eso es lo que FABRIC ejecuta si contratas.
            </div>
          </div>

          {/* Preview del reporte */}
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>
              Ejemplo de reporte
            </div>
            <div style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)', padding: '32px 36px', fontFamily: 'var(--mono)' }}>
              <div style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>OCI COST AUDIT — [Cliente] · Tenant: [redacted]</div>
              <div style={{ fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>Hallazgos cuantificados</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {[
                  ['Compute over-provisioning', 'USD $X,XXX / mes'],
                  ['Storage huérfano', 'USD $XXX / mes'],
                  ['Networking sin uso', 'USD $XXX / mes'],
                  ['Database right-sizing', 'USD $X,XXX / mes'],
                  ['Servicios always-on → scale-to-zero', 'USD $XXX / mes'],
                  ['Backup / snapshot cleanup', 'USD $XXX / mes'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8, fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ color: 'var(--accent)' }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '2px solid var(--accent)', paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Ahorro mensual potencial</div>
                  <div style={{ fontSize: 22, color: 'var(--accent)' }}>USD $X,XXX / mes</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Ahorro anual potencial</div>
                  <div style={{ fontSize: 22, color: 'var(--accent)' }}>USD $XX,XXX / año</div>
                </div>
              </div>
              <div style={{ marginTop: 20, fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.1em', lineHeight: 1.8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                Para ejecutar estas optimizaciones bajo modelo Fixed-Price o Success-Fee, conversa con FABRIC. · fabricsoft.com.mx/aplicar
              </div>
            </div>
          </div>

        </div>

        {/* Formulario */}
        <div style={{ position: 'sticky', top: 100, alignSelf: 'start' }}>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-strong)', padding: 32 }}>
            {!sent ? (
              <>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
                  Solicitar diagnóstico OCI
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24 }}>
                  FABRIC contacta en 24 horas hábiles para coordinar acceso de solo lectura a tu tenant. Reporte entregado en 48-72 horas.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {([
                    ['empresa', 'Empresa', 'text'],
                    ['cargo',   'Cargo (CFO / CTO / IT Director)', 'text'],
                    ['email',   'Email corporativo', 'email'],
                  ] as const).map(([f, label, type]) => (
                    <div key={f}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                      <input
                        type={type}
                        value={form[f]}
                        onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                        style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}

                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Gasto mensual aprox. en OCI</div>
                    <select
                      value={form.gastoOci}
                      onChange={e => setForm(p => ({ ...p, gastoOci: e.target.value }))}
                      style={{ width: '100%', padding: '11px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: form.gastoOci ? 'var(--text-primary)' : 'var(--text-tertiary)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                    >
                      <option value="">Selecciona un rango</option>
                      {GASTO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  <label className="oci-audit-consent" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                    <input
                      className="oci-audit-checkbox"
                      type="checkbox"
                      checked={form.ndaAceptado}
                      onChange={e => setForm(p => ({ ...p, ndaAceptado: e.target.checked }))}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <span className="oci-audit-consent-text" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.1em', lineHeight: 1.7 }}>
                      Acepto que el diagnóstico se realiza bajo NDA mutuo desde el primer contacto.
                    </span>
                  </label>

                  {error && (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#B85450' }}>{error}</div>
                  )}

                  <button
                    className="oci-audit-submit"
                    onClick={enviar}
                    disabled={loading}
                    style={{ marginTop: 4, padding: '13px 18px', background: loading ? 'rgba(201,169,110,0.5)' : 'var(--accent)', color: 'var(--bg-base)', border: 'none', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer' }}
                  >
                    {loading ? 'Registrando...' : 'Solicitar diagnóstico gratuito →'}
                  </button>

                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
                    Diagnóstico gratuito · Sin compromiso · NDA mutuo desde el inicio
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--accent)', marginBottom: 12 }}>Solicitud recibida.</div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Recibirás contacto en 24 horas hábiles para coordinar acceso de solo lectura a tu tenant OCI. El reporte se entrega en 48-72 horas.
                </p>
                <div style={{ marginTop: 24 }}>
                  <Link to="/" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    ← Volver al inicio
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, padding: '20px 24px', border: '1px solid var(--border)', background: 'rgba(201,169,110,0.04)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Acceso de solo lectura</div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, margin: 0 }}>
              FABRIC nunca escribe en tu tenant OCI. El diagnóstico usa permisos mínimos de auditoría — solo lectura de métricas y configuración de recursos.
            </p>
          </div>

          <div style={{ marginTop: 12, padding: '20px 24px', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>¿Quieres hablar primero?</div>
            <Link
              to="/office-hours"
              style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}
            >
              Agenda una Office Hour →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
