import { useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import { api } from '../../../config/api';
import { getInteractionTracking } from '../../../utils/tracking';

const SECCIONES_RFP = [
  {
    num: '01',
    titulo: 'Experiencia verificable en Oracle Fusion',
    clausulas: [
      '¿Cuántos proyectos Oracle Fusion Cloud han cerrado su primer ciclo crítico en producción (no solo go-live) en los últimos 24 meses?',
      '¿Pueden mostrar el acta de transición a soporte firmada por el cliente para al menos dos proyectos?',
      '¿Cuántos de sus proyectos en los últimos 3 años terminaron en litigio, disputa contractual o terminación anticipada?',
    ],
  },
  {
    num: '02',
    titulo: 'Composición real del equipo',
    clausulas: [
      '¿Qué porcentaje del equipo facturable asignado a nuestro proyecto tendrá 8+ años de experiencia Oracle? Listar nombres y años de experiencia.',
      '¿Se comprometen contractualmente a no sustituir a los consultores senior asignados sin aprobación escrita del cliente?',
      '¿Cuántos de los consultores propuestos tienen certificación Oracle vigente? Adjuntar evidencia.',
    ],
  },
  {
    num: '03',
    titulo: 'Modelo de entrega y definición de "entregado"',
    clausulas: [
      '¿Cómo definen contractualmente el hito de entrega del proyecto? ¿Es el go-live o el primer ciclo crítico operado en producción?',
      '¿Qué incluye formalmente la fase de estabilización post go-live? ¿Cuántas semanas y con qué recursos?',
      '¿Se comprometen a permanecer hasta el cierre del primer ciclo contable, operativo o regulatorio sin costo adicional?',
    ],
  },
  {
    num: '04',
    titulo: 'Modelo de pricing y protección económica',
    clausulas: [
      '¿Operan con Fixed-Price por fase o con esquema Time & Materials? Si es Fixed-Price, ¿qué cubre exactamente cada fase?',
      '¿Existe penalización contractual si el proveedor se atrasa por causas propias? ¿De cuánto y en qué forma?',
      '¿Cuál es el mecanismo formal de control de cambios? ¿Quién aprueba y en qué plazo se resuelven?',
    ],
  },
  {
    num: '05',
    titulo: 'Gestión de datos y calidad',
    clausulas: [
      '¿Qué metodología usan para la migración y validación de datos históricos? ¿Quién es responsable de la calidad final?',
      '¿Tienen experiencia documentada en migración de datos con la arquitectura específica del sistema que reemplazamos?',
      '¿Cómo garantizan que al cierre del primer ciclo no habrá reportes manuales paralelos por causa de migración incompleta?',
    ],
  },
  {
    num: '06',
    titulo: 'Soporte post go-live y transición',
    clausulas: [
      '¿Qué incluye el soporte post go-live en términos de SLA, horas y tiempo de respuesta para incidencias críticas?',
      '¿Entregan documentación viva (configuraciones, runbooks, matrices de roles) auditable sin dependencia del proveedor?',
      '¿Se firma un acta formal de transición a soporte con todos los stakeholders del cliente?',
    ],
  },
  {
    num: '07',
    titulo: 'Señales de alerta a evaluar en la propuesta',
    clausulas: [
      '⊗ Propuesta que define entrega en go-live sin incluir primer ciclo crítico',
      '⊗ Equipo con más del 40% de consultores sin certificación Oracle vigente',
      '⊗ Ausencia de penalización contractual por retrasos del proveedor',
      '⊗ Soporte post go-live limitado a tickets, sin acompañamiento presencial',
      '⊗ Sin acta formal de transición ni documentación transferible',
    ],
    esAlertas: true,
  },
];

const PUBLIC_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live', 'msn', 'me', 'proton'];

export default function RFPTemplatePage() {
  const [form, setForm] = useState({ nombre: '', cargo: '', empresa: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const enviar = async () => {
    setError('');
    if (!form.nombre.trim() || !form.cargo.trim() || !form.empresa.trim() || !form.email.trim()) {
      setError('Completa todos los campos.'); return;
    }
    if (!form.email.includes('@')) { setError('Email inválido.'); return; }
    const dominio = form.email.split('@')[1]?.split('.')[0]?.toLowerCase() ?? '';
    if (PUBLIC_DOMAINS.includes(dominio)) { setError('Usa tu correo corporativo.'); return; }

    setLoading(true);
    try {
      await api.post('/leads/solicitar', {
        ...form,
        iniciativa: 'Descarga RFP Template — 47 preguntas Oracle.',
        plazo: 'sin-plazo',
        source: 'rfp-template',
        tracking: getInteractionTracking('rfp-template', 'rfp-template'),
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

      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Recurso Ejecutivo · FABRIC</div>
          <div className="grid-2col" style={{ alignItems: 'end' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.02, marginBottom: 24 }}>
                RFP Template Oracle.<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>47 preguntas obligatorias.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Plantilla para evaluar a cualquier consultora Oracle con las preguntas que separan un proveedor serio de uno que abandona al cliente en el go-live. Basada en doctrina FABRIC y casos reales.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Descarga calificada · Correo corporativo · Sin compromiso
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2col apply-page-main" style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 56px' }}>
        {/* Contenido del RFP */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 40 }}>
            Estructura del template
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECCIONES_RFP.map((s) => (
              <div key={s.num} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '32px 36px' }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', flexShrink: 0, marginTop: 3 }}>{s.num}</span>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>{s.titulo}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 29 }}>
                  {s.clausulas.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: s.esAlertas ? '#B85450' : 'var(--text-tertiary)', flexShrink: 0, marginTop: 4 }}>
                        {s.esAlertas ? '' : '→'}
                      </span>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: s.esAlertas ? 'var(--text-secondary)' : 'var(--text-secondary)', lineHeight: 1.65 }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', lineHeight: 2 }}>
            El template completo incluye 47 preguntas organizadas en scorecard con criterios de evaluación por sección.
            No constituye asesoría legal. Cada proceso de RFP debe validarse con el área jurídica del cliente.
          </div>
        </div>

        {/* Gating */}
        <div style={{ position: 'sticky', top: 100, alignSelf: 'start' }}>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-strong)', padding: 32 }}>
            {!sent ? (
              <>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
                  Descargar template completo
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24 }}>
                  El PDF completo incluye las 47 preguntas, scorecard de evaluación, cláusulas contractuales recomendadas y señales de alerta por sección.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([['nombre', 'Nombre completo', 'text'], ['cargo', 'Cargo', 'text'], ['empresa', 'Empresa', 'text'], ['email', 'Email corporativo', 'email']] as const).map(([f, label, type]) => (
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
                  {error && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#B85450' }}>{error}</div>}
                  <button
                    onClick={enviar}
                    disabled={loading}
                    style={{ marginTop: 4, padding: '13px 18px', background: loading ? 'rgba(201,169,110,0.5)' : 'var(--accent)', color: 'var(--bg-base)', border: 'none', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer' }}
                  >
                    {loading ? 'Registrando...' : 'Recibir template →'}
                  </button>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
                    El PDF se envía a tu correo corporativo. Sin spam.
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--accent)', marginBottom: 12 }}>Template en camino.</div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Revisa {form.email}. El PDF con las 47 preguntas llegará en los próximos minutos.
                </p>
                <div style={{ marginTop: 24 }}>
                  <Link to="/aplicar" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none' }}>
                    ¿Quieres que FABRIC evalúe tu caso? →
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, padding: '20px 24px', border: '1px solid var(--border)', background: 'rgba(201,169,110,0.04)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>¿Por qué funciona?</div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, margin: 0 }}>
              Los CFOs que usan este template para evaluar a otras consultoras descubren que muy pocas cumplen los criterios. Eso posiciona a FABRIC automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
