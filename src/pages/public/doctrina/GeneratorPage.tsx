import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import { api } from '../../../config/api';
import { getInteractionTracking } from '../../../utils/tracking';

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #doctrina-pdf, #doctrina-pdf * { visibility: visible !important; }
  #doctrina-pdf { position: absolute; inset: 0; padding: 40px; background: #fff !important; color: #000 !important; }
  #doctrina-pdf .pdf-hide { display: none !important; }
  #doctrina-pdf h2, #doctrina-pdf h3 { color: #000 !important; }
  #doctrina-pdf [style*="color: var(--accent)"] { color: #8B6914 !important; }
  #doctrina-pdf [style*="color: var(--text-secondary)"] { color: #444 !important; }
  #doctrina-pdf [style*="color: var(--text-tertiary)"] { color: #888 !important; }
  #doctrina-pdf [style*="background: var(--bg-panel)"] { background: #f8f8f8 !important; border-color: #ddd !important; }
  #doctrina-pdf [style*="background: var(--bg-base)"] { background: #fff !important; }
  @page { margin: 20mm; size: A4; }
}
`;

const PREGUNTAS = [
  {
    id: 'iniciativa',
    texto: '¿Qué tipo de iniciativa Oracle estás evaluando?',
    opciones: [
      'Rescate de una implementación post go-live fallida',
      'Implementación nueva de Oracle Fusion Cloud',
      'Migración de un ERP legacy (SAP, EBS, JD Edwards, PeopleSoft)',
      'Renegociación de SOW o extensión de contrato con partner actual'
    ],
  },
  {
    id: 'patrocinio',
    texto: '¿Quién es el principal patrocinador ejecutivo del proyecto?',
    opciones: [
      'CFO y CTO trabajando de forma conjunta y comprometidos',
      'Solo el CFO o solo el CTO de forma independiente',
      'Director de IT / Sistemas sin patrocinio formal a nivel C-level',
      'No hay un patrocinador ejecutivo formal definido aún'
    ],
  },
  {
    id: 'entrega',
    texto: '¿Cómo define el contrato del integrador el hito de entrega del proyecto?',
    opciones: [
      'Únicamente basado en la fecha de Go-Live (salida en vivo del sistema)',
      'Basado en el cierre exitoso del primer ciclo crítico contable en producción',
      'Hitos de consultoría basados en avance de horas / entregables teóricos',
      'El contrato no define con claridad qué significa "proyecto entregado"'
    ],
  },
  {
    id: 'modelo',
    texto: '¿Cuál es el modelo comercial propuesto por el integrador para la implementación?',
    opciones: [
      'Fixed-Price (Llave en mano / Precio fijo por alcance cerrado)',
      'Time & Materials (Facturación mensual de horas incurridas)',
      'Modelo híbrido (Fijo para implantación + horas para soporte/gaps)',
      'Aún no se ha definido el modelo comercial ni contractual'
    ],
  },
  {
    id: 'penalizaciones',
    texto: '¿Qué nivel de penalizaciones por retraso del integrador contempla el SOW?',
    opciones: [
      'Penalizaciones severas ligadas a hitos críticos del negocio (e.g. cierre contable)',
      'Penalizaciones estándar sobre el pago final (máximo 5-10% del contrato)',
      'No se contemplan penalizaciones por retrasos en el SOW',
      'Las penalizaciones están en revisión / negociación'
    ],
  },
  {
    id: 'datos',
    texto: '¿Quién es el responsable formal de la migración y validación de datos maestros?',
    opciones: [
      'El integrador bajo su metodología y responsabilidad de cuadre contable',
      'El cliente (nuestro equipo interno) de forma exclusiva',
      'Es un esfuerzo compartido sin penalizaciones para el integrador en caso de fallas',
      'No se ha definido detalladamente la responsabilidad en el SOW'
    ],
  }
];

const PUBLIC_DOMAINS = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live', 'msn', 'me', 'proton'];

export default function GeneratorPage() {
  useEffect(() => {
    const tag = document.createElement('style');
    tag.id = 'doctrina-print-styles';
    tag.textContent = PRINT_STYLES;
    document.head.appendChild(tag);
    return () => document.getElementById('doctrina-print-styles')?.remove();
  }, []);

  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [seleccion, setSeleccion] = useState<string>('');
  const [fase, setFase] = useState<'wizard' | 'captura' | 'resultado'>('wizard');
  const [form, setForm] = useState({ nombre: '', cargo: '', empresa: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pregunta = PREGUNTAS[paso];
  const totalPasos = PREGUNTAS.length;

  const siguiente = () => {
    if (!seleccion) return;
    const newRespuestas = { ...respuestas, [pregunta.id]: seleccion };
    setRespuestas(newRespuestas);
    if (paso + 1 < totalPasos) {
      setPaso(p => p + 1);
      setSeleccion(newRespuestas[PREGUNTAS[paso + 1].id] ?? '');
    } else {
      setFase('captura');
    }
  };

  const anterior = () => {
    if (paso > 0) {
      setPaso(p => p - 1);
      setSeleccion(respuestas[PREGUNTAS[paso - 1].id] ?? '');
    }
  };

  const enviar = async () => {
    setError('');
    if (!form.nombre.trim() || !form.cargo.trim() || !form.empresa.trim() || !form.email.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    if (!form.email.includes('@')) {
      setError('Email inválido.');
      return;
    }
    const dominio = form.email.split('@')[1]?.split('.')[0]?.toLowerCase() ?? '';
    if (PUBLIC_DOMAINS.includes(dominio)) {
      setError('Usa tu correo corporativo.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/leads/solicitar', {
        ...form,
        iniciativa: `Generación de Cláusulas Doctrinales Oracle SOW. Iniciativa: ${respuestas.iniciativa}`,
        plazo: 'sin-plazo',
        source: 'doctrine-generator',
        tracking: getInteractionTracking('doctrina', 'doctrine-generator'),
      });
      setFase('resultado');
    } catch {
      setError('No se pudo registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica de generación de cláusulas basadas en respuestas
  const obtenerClausulas = () => {
    const lista = [];

    // Cláusula de entrega
    if (respuestas.entrega !== 'Basado en el cierre exitoso del primer ciclo crítico contable en producción') {
      lista.push({
        num: '01',
        titulo: 'Hito Contractual de Entrega por Ciclo Crítico',
        texto: 'La entrega del proyecto no se perfeccionará con la salida en vivo (Go-Live). Las partes acuerdan que el Hito de Entrega Final y el inicio de la garantía contractual ocurrirán únicamente cuando el primer cierre contable mensual haya sido ejecutado en producción en su totalidad, sin errores de integración de severidad 1 o 2, y con el reporte de balances conciliado y firmado por el CFO del Cliente.',
        riesgo: 'El proveedor intentará cobrar el 100% de la implantación en el Go-Live, dejándote sin soporte durante el periodo de cierre que es donde ocurren los problemas reales.'
      });
    }

    // Cláusula de soporte / estabilización
    if (respuestas.patrocinio !== 'CFO y CTO trabajando de forma conjunta y comprometidos') {
      lista.push({
        num: '02',
        titulo: 'Comité de Estabilización y Gobernanza Ejecutiva',
        texto: 'Se constituye un Comité de Proyecto integrado obligatoriamente por el CFO, el CTO del Cliente y el Director del Proyecto por parte del Integrador. Este comité sesionará semanalmente durante la fase de estabilización y será el único órgano facultado para autorizar el acta de transición a soporte técnico, requiriendo firma mancomunada de todos sus miembros.',
        riesgo: 'La falta de gobernanza compartida CFO/CTO suele derivar en disputas sobre si una falla es técnica (CTO) o del proceso de negocio (CFO).'
      });
    }

    // Cláusula de precios y gaps
    if (respuestas.modelo === 'Time & Materials (Facturación mensual de horas incurridas)') {
      lista.push({
        num: '03',
        titulo: 'Toque de Techo y Conversión a Precio Fijo',
        texto: 'Las partes acuerdan que el presente contrato bajo esquema de Horas y Materiales tiene un tope económico absoluto e inamovible de [Monto]. Cualquier hora adicional requerida para estabilizar el primer ciclo crítico operado en producción será por cuenta y riesgo del Integrador, sin costo adicional para el Cliente.',
        riesgo: 'El esquema puro de facturación por horas incentiva al proveedor a prolongar la etapa de soporte contable inestable.'
      });
    } else {
      lista.push({
        num: '03',
        titulo: 'Garantía de Desviaciones de Alcance (Fixed-Price)',
        texto: 'Bajo el esquema de Precio Fijo, el Integrador garantiza que el alcance especificado en el SOW cubre la totalidad de la arquitectura requerida para operar el primer ciclo contable. No se reconocerán órdenes de cambio por integraciones omitidas o configuraciones estándar faltantes necesarias para consolidar la contabilidad.',
        riesgo: 'Aún en precio fijo, los integradores cobran cargos adicionales (Change Orders) argumentando brechas de análisis inicial.'
      });
    }

    // Cláusula de penalizaciones
    if (respuestas.penalizaciones === 'No se contemplan penalizaciones por retrasos en el SOW') {
      lista.push({
        num: '04',
        titulo: 'Retención Financiera por Ciclo Inestable',
        texto: 'El Cliente retendrá el 15% del pago final de implantación hasta que se cumpla la entrega del primer ciclo contable. Si por causas imputables al Integrador el primer cierre mensual sufre un retraso mayor a 5 días hábiles respecto al calendario fiscal del Cliente, el Integrador pagará una pena convencional equivalente al 1% del valor total del contrato por cada día de retraso.',
        riesgo: 'Sin penalizaciones financieras ligadas al cierre, el proveedor priorizará otros proyectos activos una vez que ocurra el Go-Live.'
      });
    }

    // Cláusula de calidad de datos
    if (respuestas.datos !== 'El integrador bajo su metodología y responsabilidad de cuadre contable') {
      lista.push({
        num: '05',
        titulo: 'Corresponsabilidad de Cuadre en Migración de Datos',
        texto: 'El Integrador es responsable de auditar e importar las balanzas de saldos históricos. El Integrador garantiza que los saldos migrados cuadrarán con la contabilidad previa del Cliente. Cualquier diferencia de balance derivada de scripts de migración defectuosos deberá ser corregida por el Integrador en un plazo máximo de 48 horas bajo su costo.',
        riesgo: 'El integrador suele delegar la responsabilidad de datos al cliente para deslindarse de balances descuadrados en el cierre contable.'
      });
    }

    return lista;
  };

  const clausulasGeneradas = fase === 'resultado' ? obtenerClausulas() : [];

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>

      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Herramienta · FABRIC</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 80px', alignItems: 'end' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, lineHeight: 1.02, color: 'var(--text-primary)', marginBottom: 24 }}>
                Doctrine Generator.<br />
                <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Tus cláusulas Oracle.</em>
              </h1>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                Responde 6 preguntas sobre tu próximo contrato Oracle y genera un paquete de cláusulas contractuales recomendadas para proteger tu inversión en el SOW.
              </p>
              <div style={{ marginTop: 24, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                6 preguntas · 3 minutos · PDF descargable
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fase 1: Asistente / Wizard */}
      {fase === 'wizard' && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 56px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Pregunta {paso + 1} de {totalPasos}
            </span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.12em' }}>
              {Math.round((paso / totalPasos) * 100)}%
            </span>
          </div>

          <div style={{ height: 1, background: 'var(--border)', marginBottom: 56, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: `${(paso / totalPasos) * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 300ms ease' }} />
          </div>

          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 40 }}>
            {pregunta.texto}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56 }}>
            {pregunta.opciones.map((opt) => {
              const activo = seleccion === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setSeleccion(opt)}
                  style={{
                    background: activo ? 'rgba(201,169,110,0.08)' : 'var(--bg-panel)',
                    border: `1px solid ${activo ? 'var(--accent)' : 'var(--border)'}`,
                    padding: '18px 24px',
                    textAlign: 'left',
                    fontFamily: 'var(--sans)',
                    fontSize: 14,
                    color: activo ? 'var(--text-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: activo ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0 }}>
                    {activo ? '◆' : '◇'}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {paso > 0 ? (
              <button
                onClick={anterior}
                style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' }}
              >
                ← Anterior
              </button>
            ) : <span />}
            <button
              onClick={siguiente}
              disabled={!seleccion}
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: seleccion ? 'var(--bg-base)' : 'var(--text-tertiary)',
                background: seleccion ? 'var(--accent)' : 'var(--border)',
                border: 'none', padding: '14px 32px', cursor: seleccion ? 'pointer' : 'not-allowed', transition: 'all 200ms',
              }}
            >
              {paso + 1 === totalPasos ? 'Ver cláusulas →' : 'Siguiente →'}
            </button>
          </div>
        </div>
      )}

      {/* Fase 2: Captura de Datos */}
      {fase === 'captura' && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 56px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            Último paso
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 12 }}>
            Recibe tus Cláusulas Doctrinales SOW.
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 40 }}>
            Se compilará un documento con las redacciones recomendadas para mitigar los riesgos específicos detectados en tu cuestionario.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: 32 }}>
            {([['nombre', 'Nombre completo', 'text'], ['cargo', 'Cargo', 'text'], ['empresa', 'Empresa', 'text'], ['email', 'Email corporativo', 'email']] as const).map(([f, label, type]) => (
              <div key={f}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
                <input
                  type={type}
                  value={form[f]}
                  onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
            {error && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#B85450' }}>{error}</div>}
            <button
              onClick={enviar}
              disabled={loading}
              style={{ marginTop: 4, padding: '14px 18px', background: loading ? 'rgba(201,169,110,0.5)' : 'var(--accent)', color: 'var(--bg-base)', border: 'none', fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: loading ? 'wait' : 'pointer' }}
            >
              {loading ? 'Generando cláusulas...' : 'Ver mis cláusulas →'}
            </button>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
              Correo corporativo requerido. Sin spam.
            </div>
          </div>
        </div>
      )}

      {/* Fase 3: Resultados */}
      {fase === 'resultado' && (
        <div id="doctrina-pdf" style={{ maxWidth: 960, margin: '0 auto', padding: '80px 56px' }}>
          
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Cláusulas de SOW Generadas · FABRIC
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 16 }}>
              Cláusulas Doctrinales recomendadas<br />
              <span style={{ color: 'var(--accent)' }}>para tu SOW de Oracle.</span>
            </h2>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 640 }}>
              Basado en las respuestas de {form.empresa}, hemos redactado cláusulas modelo listas para integrar en tu borrador de contrato, mitigando los riesgos operativos más habituales.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginBottom: 64 }}>
            {clausulasGeneradas.map((clausula) => (
              <div key={clausula.num} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '36px 40px' }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.12em', flexShrink: 0, marginTop: 4 }}>
                    CLÁUSULA {clausula.num}
                  </span>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.3, margin: 0 }}>
                    {clausula.titulo}
                  </h3>
                </div>

                <div style={{ paddingLeft: 0 }}>
                  <div style={{ background: 'var(--bg-base)', borderLeft: '2px solid var(--accent)', padding: '20px 24px', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.75, marginBottom: 20, whiteSpace: 'pre-line' }}>
                    "{clausula.texto}"
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    <strong style={{ color: '#B85450', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      ⊗ Riesgo mitigado
                    </strong>
                    {clausula.riesgo}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', lineHeight: 1.9, marginBottom: 32 }}>
              Las cláusulas son sugerencias basadas en doctrina contractual de FABRIC. No sustituyen asesoría legal formal de tu organización.
            </p>

            <div className="pdf-hide" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => window.print()}
                style={{ padding: '14px 28px', background: 'var(--accent)', border: 'none', color: 'var(--bg-base)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }}
              >
                ↓ Descargar PDF
              </button>
              <Link to="/aplicar" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', border: '1px solid rgba(201,169,110,0.35)', padding: '14px 28px', textDecoration: 'none' }}>
                Solicitar evaluación de SOW →
              </Link>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
