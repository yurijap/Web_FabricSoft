import { useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import { api } from '../../../config/api';
import { getInteractionTracking } from '../../../utils/tracking';

const HALLAZGOS = [
  {
    num: '01',
    titulo: 'Tasa de fracaso en el primer ciclo crítico',
    valor: '68%',
    unidad: 'de implementaciones',
    descripcion: 'Porcentaje de proyectos Oracle Fusion que requieren soporte no planificado durante el primer cierre contable en producción, según registros de rescate 2023–2025.',
    fuente: 'FABRIC Internal Case Registry',
  },
  {
    num: '02',
    titulo: 'Sobrecosto promedio por retrasos del proveedor',
    valor: '2.4×',
    unidad: 'del presupuesto inicial',
    descripcion: 'Multiplicador de costo final vs presupuesto inicial en proyectos con modelos Time & Materials sin penalización contractual por retrasos del proveedor.',
    fuente: 'FABRIC Project Audits 2024',
  },
  {
    num: '03',
    titulo: 'Tiempo para el primer cierre real',
    valor: '7.2 meses',
    unidad: 'promedio post go-live',
    descripcion: 'Tiempo promedio desde el go-live oficial hasta que el primer cierre contable opera en producción sin intervención manual paralela.',
    fuente: 'FABRIC Benchmark Q1 2026',
  },
  {
    num: '04',
    titulo: 'Reportes manuales activos al go-live',
    valor: '4.1',
    unidad: 'reportes paralelos',
    descripcion: 'Número promedio de reportes ejecutivos generados fuera del ERP en el momento del go-live. Indica adopción incompleta del sistema.',
    fuente: 'FABRIC Rescue Assessments 2025',
  },
];

const SECCIONES_REPORT = [
  {
    num: 'Cap. I',
    titulo: 'Estado de las Implementaciones Oracle Fusion en México y LATAM',
    items: [
      'Distribución de proyectos por industria y tamaño de empresa',
      'Tasas de éxito/fracaso en el primer ciclo crítico (2023-2025)',
      'Tiempo real go-live vs tiempo contractual por tipo de proyecto',
      'Consultoras más frecuentes en proyectos que requirieron rescate',
    ],
  },
  {
    num: 'Cap. II',
    titulo: 'Anatomía del Fracaso: Patrones Recurrentes',
    items: [
      'Las 5 causas técnicas más comunes de implementación fallida',
      'Señales de alerta tempranas identificadas en semana 1-4',
      'Correlación entre estructura contractual y probabilidad de rescate',
      'Impacto de la composición del equipo en la tasa de estabilización',
    ],
  },
  {
    num: 'Cap. III',
    titulo: 'Costos Reales: Lo que no se publica en los case studies',
    items: [
      'Costo de rescate vs costo de implementación original',
      'Horas no facturadas absorbidas por el cliente post go-live',
      'Impacto en operación: días de cierre contable prolongado',
      'Costo de rotación de consultores en proyectos T&M',
    ],
  },
  {
    num: 'Cap. IV',
    titulo: 'Benchmark de Modelos Contractuales',
    items: [
      'Fixed-Price por fase vs Time & Materials: comparativa de resultados',
      'Cláusulas de penalización que cambian el comportamiento del proveedor',
      'Modelos de Success-Fee: cuándo alinean y cuándo desvían incentivos',
      'Anatomía del acta de transición que protege al cliente',
    ],
  },
  {
    num: 'Cap. V',
    titulo: 'Proyecciones 2026: El Mercado Oracle en Transformación',
    items: [
      'Pipeline de migraciones EBS/JDE/PeopleSoft activas en la región',
      'Impacto de Oracle Fusion 25B en proyectos en curso',
      'Tendencias en patrocinio ejecutivo: CFO vs CTO como sponsor principal',
      'Expectativa de precios y plazos para el ciclo 2026-2027',
    ],
  },
];

const PUBLIC_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live', 'msn', 'me', 'proton'];

export default function BenchmarkIndexPage() {
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
        iniciativa: 'Descarga FABRIC Benchmark Index 2026.',
        plazo: 'sin-plazo',
        source: 'benchmark-index',
        tracking: getInteractionTracking('benchmark-index', 'benchmark-index'),
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
          <div className="label" style={{ marginBottom: 20 }}>Investigación Anual · FABRIC</div>
          <div className="grid-2col" style={{ alignItems: 'end' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.02, marginBottom: 24 }}>
                FABRIC Benchmark Index.<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Oracle Fusion 2026.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Índice anual sobre el estado real de las implementaciones Oracle Fusion Cloud en México y LATAM. Patrones de falla, costos verificados, benchmarks contractuales y proyecciones de mercado para el ciclo 2026-2027.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Research privado · Acceso calificado · Datos verificados
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hallazgos destacados */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 56px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 40 }}>
            Hallazgos principales — Vista previa
          </div>
          <div className="grid-auto-fit" style={{ gap: 2 }}>
            {HALLAZGOS.map((h) => (
              <div key={h.num} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '32px 28px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>{h.num}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px, 3vw, 48px)', fontWeight: 300, color: 'var(--accent)', lineHeight: 1, marginBottom: 4 }}>{h.valor}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: 16 }}>{h.unidad}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 16 }}>{h.descripcion}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: 'var(--text-tertiary)', letterSpacing: '0.12em', textTransform: 'uppercase', borderTop: '1px solid var(--border)', paddingTop: 10 }}>{h.fuente}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido + Gating */}
      <div className="grid-2col" style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 56px', gridTemplateColumns: '1.4fr 0.6fr', gap: '0 64px' }}>
        {/* Contenido del reporte */}
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 40 }}>
            Contenido del reporte completo
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECCIONES_REPORT.map((s) => (
              <div key={s.num} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '32px 36px' }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.12em', flexShrink: 0, marginTop: 3 }}>{s.num}</span>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>{s.titulo}</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 48 }}>
                  {s.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 4 }}>→</span>
                      <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.15em', lineHeight: 2 }}>
            FABRIC Benchmark Index es un reporte anual independiente. Los datos se actualizan cada Q4 con casos cerrados en el año en curso.
            Los hallazgos reflejan proyectos en México, Colombia, Chile, Argentina y Perú. Muestra mínima para publicación: 10 proyectos por categoría.
          </div>
        </div>

        {/* Gating */}
        <div style={{ position: 'sticky', top: 100, alignSelf: 'start' }}>
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-strong)', padding: 32 }}>
            {!sent ? (
              <>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
                  Acceder al reporte completo
                </div>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 24 }}>
                  El reporte completo incluye tablas de datos, metodología, fuentes primarias y comparativas por industria. Acceso para CFO, CTO y directores de transformación digital.
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
                    {loading ? 'Registrando...' : 'Recibir reporte →'}
                  </button>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
                    El PDF se envía a tu correo corporativo. Sin spam.
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--accent)', marginBottom: 12 }}>Reporte en camino.</div>
                <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Revisa {form.email}. El FABRIC Benchmark Index 2026 llegará en los próximos minutos.
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
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Próxima edición</div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, margin: 0 }}>
              El Benchmark Index Q4 2026 incluirá datos agregados de los primeros 10 proyectos FABRIC cerrados. Publicación comprometida: diciembre 2026.
            </p>
          </div>

          <div style={{ marginTop: 12, padding: '20px 24px', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>También disponible</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/rfp-template" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
                RFP Template — 47 preguntas →
              </Link>
              <Link to="/readiness" style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', textDecoration: 'none' }}>
                Readiness Score — Evaluación →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
