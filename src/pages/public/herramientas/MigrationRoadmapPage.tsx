import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import { api } from '../../../config/api';
import { getInteractionTracking } from '../../../utils/tracking';

const PRINT_STYLES = `
@media print {
  body * { visibility: hidden !important; }
  #roadmap-pdf, #roadmap-pdf * { visibility: visible !important; }
  #roadmap-pdf { position: absolute; inset: 0; padding: 40px; background: #fff !important; color: #000 !important; }
  #roadmap-pdf .pdf-hide { display: none !important; }
  #roadmap-pdf h2, #roadmap-pdf h3 { color: #000 !important; }
  #roadmap-pdf [style*="color: var(--accent)"] { color: #8B6914 !important; }
  #roadmap-pdf [style*="color: var(--text-secondary)"] { color: #444 !important; }
  #roadmap-pdf [style*="color: var(--text-tertiary)"] { color: #888 !important; }
  #roadmap-pdf [style*="background: var(--bg-panel)"] { background: #f8f8f8 !important; border-color: #ddd !important; }
  #roadmap-pdf [style*="background: var(--bg-base)"] { background: #fff !important; }
  @page { margin: 20mm; size: A4; }
}
`;

const PREGUNTAS = [
  {
    id: 'sistema',
    texto: '¿Qué sistema estás migrando a Oracle Fusion?',
    opciones: ['SAP S/4 HANA', 'SAP ECC', 'Oracle EBS R12', 'Oracle JD Edwards', 'Oracle PeopleSoft', 'Microsoft Dynamics 365', 'NetSuite', 'Sin ERP — Greenfield'],
  },
  {
    id: 'modulos',
    texto: '¿Cuáles son los módulos críticos para tu operación?',
    opciones: ['Financials / Contabilidad', 'Procurement / Compras', 'SCM / Cadena de suministro', 'HCM / Recursos Humanos', 'EPM / Planeación financiera', 'Reporting / Inteligencia de negocios'],
    multi: true,
  },
  {
    id: 'industria',
    texto: '¿En qué industria opera tu empresa?',
    opciones: ['Servicios Financieros / Fintech', 'Inmobiliario / Centros Comerciales', 'Logística / Distribución', 'Manufactura', 'Retail', 'Energía / Utilities', 'Otro'],
  },
  {
    id: 'geografia',
    texto: '¿En cuántos países opera tu empresa?',
    opciones: [
      'Solo México',
      '2 – 3 países de LATAM',
      '4 o más países',
      'Operación global (incluyendo fuera de LATAM)',
    ],
  },
  {
    id: 'plazo',
    texto: '¿Cuándo planeas iniciar el proyecto?',
    opciones: ['Próximos 3 meses', 'En 3 – 6 meses', 'En 6 – 12 meses', 'Sin plazo definido aún'],
  },
  {
    id: 'compliance',
    texto: '¿Tu empresa opera bajo regulaciones financieras o fiscales específicas?',
    opciones: [
      'Sí — con mapa de requerimientos documentado (CNBV, SAT avanzado, CFDI 4.0, regulación bancaria)',
      'Sí — regulaciones conocidas pero sin mapa documentado',
      'Solo regulaciones estándar (SAT, IMSS, INFONAVIT)',
      'No conocemos los requerimientos de compliance aplicables',
    ],
  },
  {
    id: 'patrocinio',
    texto: '¿Tienes patrocinio ejecutivo confirmado para el proyecto?',
    opciones: ['CFO + CTO ambos activos', 'Solo CFO o solo CTO', 'Solo IT / Director de Sistemas', 'Sin patrocinio ejecutivo aún'],
  },
  {
    id: 'presupuesto',
    texto: '¿El presupuesto para la migración está aprobado?',
    opciones: ['Aprobado y confirmado', 'En proceso de aprobación', 'En evaluación (RFP activo)', 'Sin presupuesto definido'],
  },
  {
    id: 'integraciones',
    texto: '¿Cuántos sistemas satélite o integraciones tiene tu ERP actual?',
    opciones: ['Ninguno — standalone', '1 a 5 integraciones', '6 a 15 integraciones', 'Más de 15 integraciones'],
  },
  {
    id: 'datos',
    texto: '¿Cómo describirías la calidad de los datos en tu sistema actual?',
    opciones: ['Limpios y estructurados', 'Algunos problemas conocidos', 'Varios duplicados y errores', 'Sin catalogar — desconocemos la calidad'],
  },
  {
    id: 'equipo',
    texto: '¿Tienes equipo interno dedicado al proyecto?',
    opciones: ['Sí — equipo dedicado con liberación formal', 'Parcial — algunas personas con otro trabajo paralelo', 'Solo un responsable de IT', 'Sin equipo interno asignado'],
  },
  {
    id: 'experiencia',
    texto: '¿Tu empresa ha vivido una migración ERP anteriormente?',
    opciones: ['Sí — fue exitosa', 'Sí — fue problemática o incompleta', 'No — esta sería la primera', 'Hubo intentos pero se cancelaron'],
  },
];

type Respuestas = Record<string, string | string[]>;

function calcularRiesgo(respuestas: Respuestas): {
  nivel: 'BAJO' | 'MEDIO' | 'ALTO';
  descripcion: string;
  plazo: string;
  fases: { label: string; hitos: string[] }[];
  recursos: string[];
  quickwins: string[];
} {
  let puntos = 0;

  if (respuestas.patrocinio === 'CFO + CTO ambos activos') puntos += 2;
  else if (respuestas.patrocinio === 'Solo CFO o solo CTO') puntos += 1;

  if (respuestas.presupuesto === 'Aprobado y confirmado') puntos += 2;
  else if (respuestas.presupuesto === 'En proceso de aprobación') puntos += 1;

  if (respuestas.datos === 'Limpios y estructurados') puntos += 2;
  else if (respuestas.datos === 'Algunos problemas conocidos') puntos += 1;

  if (respuestas.equipo === 'Sí — equipo dedicado con liberación formal') puntos += 2;
  else if (respuestas.equipo === 'Parcial — algunas personas con otro trabajo paralelo') puntos += 1;

  if (respuestas.integraciones === 'Ninguno — standalone') puntos += 2;
  else if (respuestas.integraciones === '1 a 5 integraciones') puntos += 1;

  if (respuestas.experiencia === 'Sí — fue exitosa') puntos += 1;

  if (respuestas.geografia === 'Solo México') puntos += 2;
  else if (respuestas.geografia === '2 – 3 países de LATAM') puntos += 1;

  const c = respuestas.compliance as string ?? '';
  if (c.startsWith('Sí — con mapa')) puntos += 2;
  else if (c.startsWith('Sí — regulaciones conocidas')) puntos += 1;
  else if (c.startsWith('Solo regulaciones estándar')) puntos += 2;

  if (puntos >= 13) return {
    nivel: 'BAJO',
    descripcion: 'Tu organización tiene fundamentos sólidos para una migración controlada. Patrocinio ejecutivo confirmado, datos en buen estado y equipo dedicado son las variables que más reducen riesgo en proyectos Oracle.',
    plazo: '4 – 8 meses',
    fases: [
      {
        label: '30 días — Diagnóstico y arquitectura',
        hitos: [
          'Kick-off formal con comité ejecutivo',
          'Diagnóstico técnico de arquitectura actual y gaps vs Fusion',
          'Mapeo de datos maestros y plan de migración',
          'Definición de módulos prioritarios (phase 1)',
        ],
      },
      {
        label: '60 días — Configuración core',
        hitos: [
          'Configuración de módulos Financials y Procurement en ambiente de desarrollo',
          'Migración de datos piloto (cuentas contables, catálogo de proveedores)',
          'Integración de sistemas satélite prioritarios',
          'Capacitación inicial de usuarios clave',
        ],
      },
      {
        label: '90 días — UAT y go-live',
        hitos: [
          'User Acceptance Testing con usuarios clave liberados',
          'Corrección de hallazgos críticos del UAT',
          'Go-live planificado (módulos phase 1)',
          'Inicio de fase STABILIZE — acompañamiento FABRIC',
        ],
      },
      {
        label: '180 días — Primer ciclo crítico',
        hitos: [
          'Primer cierre contable en producción con acompañamiento FABRIC',
          'Activación de módulos restantes (phase 2)',
          'Tablero ejecutivo de estabilización entregado',
          'Acta formal de transición a soporte firmada',
        ],
      },
    ],
    recursos: [
      '1 Senior Architect Oracle (8+ años)',
      '1 Senior Functional Consultant — módulo core',
      '1 Data Migration Specialist',
      'PMO interno con dedicación ≥50%',
      'Comité de proyecto activo (reuniones semanales)',
    ],
    quickwins: [
      'Definir arquitectura financiera multi-entidad en semana 1',
      'Quick-win de cierre contable en módulo piloto a semana 6',
      'Go-live por fases para reducir riesgo operativo',
    ],
  };

  if (puntos >= 7) return {
    nivel: 'MEDIO',
    descripcion: 'Hay elementos de riesgo identificados que pueden controlarse con preparación previa. FABRIC recomienda una fase de readiness antes del inicio formal del proyecto para maximizar la probabilidad de éxito.',
    plazo: '6 – 12 meses',
    fases: [
      {
        label: '30 días — Readiness y diagnóstico de brechas',
        hitos: [
          'Oracle Readiness Assessment (4 semanas)',
          'Diagnóstico de brechas críticas por área (datos, equipo, patrocinio)',
          'Plan de corrección priorizado con responsables y fechas',
          'Validación de presupuesto y aprobación formal',
        ],
      },
      {
        label: '60 días — Cierre de brechas + kick-off',
        hitos: [
          'Cierre de brechas críticas identificadas en la fase anterior',
          'Kick-off formal del proyecto (si se superaron las brechas)',
          'Definición de arquitectura técnica con FSO Engine FABRIC',
          'Mapeo de integraciones y plan de migración de datos',
        ],
      },
      {
        label: '90 días — Configuración e integración',
        hitos: [
          'Configuración de módulos core en ambiente de desarrollo',
          'Migración de datos (cuentas maestras, históricos críticos)',
          'Integración de sistemas satélite documentados',
          'Capacitación de usuarios clave (primera ronda)',
        ],
      },
      {
        label: '180 días — UAT, go-live y primer ciclo',
        hitos: [
          'User Acceptance Testing completo',
          'Go-live con acompañamiento FABRIC presencial',
          'Primer cierre contable en producción documentado',
          'Acta de transición a soporte con tablero ejecutivo',
        ],
      },
    ],
    recursos: [
      '1 Senior Architect + 1 Senior Functional (ambos 8+ años Oracle)',
      '1 Data Migration Specialist',
      '1 Integration Specialist (si hay 6+ integraciones)',
      'PMO interno con dedicación exclusiva (recomendado)',
      'Change Management Lead (interno o externo)',
      'Pre-readiness: 4 – 6 semanas previas al kick-off formal',
    ],
    quickwins: [
      'Fase de diagnóstico de datos y limpieza previa (4 semanas)',
      'Definición de patrocinio ejecutivo formal antes del kick-off',
      'Mapeo de integraciones y plan de migración de datos en semana 2',
    ],
  };

  return {
    nivel: 'ALTO',
    descripcion: 'Hay múltiples factores de riesgo que, sin atención previa, pueden comprometer la migración. FABRIC recomienda iniciar con un Oracle Readiness Assessment antes de comprometer presupuesto de implementación.',
    plazo: '8 – 18 meses con preparación previa',
    fases: [
      {
        label: '30 días — Readiness Assessment',
        hitos: [
          'Oracle Readiness Assessment completo por FABRIC',
          'Identificación de brechas críticas por área (datos, equipo, patrocinio, compliance)',
          'Reporte ejecutivo de riesgos con plan de corrección',
          'Decisión: iniciar corrección o diferir el proyecto',
        ],
      },
      {
        label: '60 días — Programa de corrección de brechas',
        hitos: [
          'Programa formal de patrocinio ejecutivo (CFO + CTO)',
          'Plan de mejora de calidad de datos (catalogación y limpieza)',
          'Asignación y liberación formal de equipo interno',
          'Validación de compliance y mapa de requerimientos regulatorios',
        ],
      },
      {
        label: '90 días — Validación de readiness',
        hitos: [
          'Re-evaluación del readiness score tras corrección de brechas',
          'Kick-off formal del proyecto solo si se superaron brechas críticas',
          'Definición de arquitectura técnica y FSO Engine',
          'Primer go-live parcial (módulo piloto de menor riesgo)',
        ],
      },
      {
        label: '180 días — Implementación core',
        hitos: [
          'Configuración de módulos core con datos migrados y validados',
          'Go-live principal con acompañamiento FABRIC intensivo',
          'Acompañamiento del primer ciclo crítico en producción',
          'Tablero de estabilización y acta formal de transición',
        ],
      },
    ],
    recursos: [
      'Oracle Readiness Consultant (antes del proyecto)',
      '1 Senior Architect + 1 Senior Functional + 1 Data + 1 Integration Specialist',
      'PMO interno con dedicación exclusiva (no negociable)',
      'Programa formal de patrocinio ejecutivo (CFO + CTO)',
      'Change Management y comunicación interna intensiva',
    ],
    quickwins: [
      'Oracle Readiness Assessment antes de iniciar (4 semanas)',
      'Programa de patrocinio ejecutivo formal',
      'Plan de mejora de calidad de datos previo al proyecto',
    ],
  };
}

const RISK_COLOR = { BAJO: '#7B9E6B', MEDIO: 'var(--accent)', ALTO: '#B85450' } as const;

export default function MigrationRoadmapPage() {
  useEffect(() => {
    const tag = document.createElement('style');
    tag.id = 'roadmap-print-styles';
    tag.textContent = PRINT_STYLES;
    document.head.appendChild(tag);
    return () => document.getElementById('roadmap-print-styles')?.remove();
  }, []);

  const [paso, setPaso]         = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [seleccion, setSeleccion]   = useState<string | string[]>('');
  const [fase, setFase]         = useState<'wizard' | 'captura' | 'resultado'>('wizard');
  const [form, setForm]         = useState({ nombre: '', cargo: '', empresa: '', email: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const pregunta       = PREGUNTAS[paso];
  const esMulti        = pregunta?.multi ?? false;
  const totalPasos     = PREGUNTAS.length;
  const seleccionValida = Array.isArray(seleccion) ? seleccion.length > 0 : seleccion !== '';

  const toggleMulti = (opcion: string) => {
    setSeleccion(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      return arr.includes(opcion) ? arr.filter(o => o !== opcion) : [...arr, opcion];
    });
  };

  const siguiente = () => {
    if (!seleccionValida) return;
    setRespuestas(prev => ({ ...prev, [pregunta.id]: seleccion }));
    if (paso + 1 < totalPasos) {
      setPaso(p => p + 1);
      setSeleccion('');
    } else {
      setFase('captura');
    }
  };

  const enviar = async () => {
    setError('');
    if (!form.nombre.trim() || !form.cargo.trim() || !form.empresa.trim() || !form.email.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    if (!form.email.includes('@')) { setError('Email inválido.'); return; }
    const dominio = form.email.split('@')[1]?.split('.')[0]?.toLowerCase();
    const publicos = ['gmail', 'hotmail', 'yahoo', 'outlook', 'icloud', 'live'];
    if (publicos.includes(dominio ?? '')) { setError('Usa tu correo corporativo.'); return; }

    const finalRespuestas = { ...respuestas };
    const resultado = calcularRiesgo(finalRespuestas);

    setLoading(true);
    try {
      await api.post('/leads/migration-roadmap', {
        ...form,
        sistema:       finalRespuestas.sistema,
        modulos:       finalRespuestas.modulos,
        industria:     finalRespuestas.industria,
        geografia:     finalRespuestas.geografia,
        plazo:         finalRespuestas.plazo,
        compliance:    finalRespuestas.compliance,
        patrocinio:    finalRespuestas.patrocinio,
        presupuesto:   finalRespuestas.presupuesto,
        integraciones: finalRespuestas.integraciones,
        datos:         finalRespuestas.datos,
        equipo:        finalRespuestas.equipo,
        experiencia:   finalRespuestas.experiencia,
        riskLevel:         resultado.nivel,
        estimatedTimeline: resultado.plazo,
        tracking: getInteractionTracking('roadmap', 'migration-roadmap'),
      });
      setFase('resultado');
    } catch {
      setError('No se pudo registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const resultado = fase === 'resultado' ? calcularRiesgo({ ...respuestas }) : null;

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>

      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Herramienta · FABRIC</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.02, marginBottom: 24 }}>
            Migration Roadmap.<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>12 preguntas · Ruta 30-60-90-180 días.</em>
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 640 }}>
            Diagnóstico ejecutivo para estimar nivel de riesgo, plazo realista y roadmap de hitos para tu migración a Oracle Fusion Cloud.
          </p>
        </div>
      </div>

      {/* Wizard */}
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
          {esMulti && (
            <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 24 }}>
              Selección múltiple permitida
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56 }}>
            {pregunta.opciones.map((opt) => {
              const activo = esMulti
                ? Array.isArray(seleccion) && seleccion.includes(opt)
                : seleccion === opt;
              return (
                <button
                  key={opt}
                  onClick={() => esMulti ? toggleMulti(opt) : setSeleccion(opt)}
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
                onClick={() => { setPaso(p => p - 1); setSeleccion(respuestas[PREGUNTAS[paso - 1].id] ?? ''); }}
                style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.15em', textTransform: 'uppercase' }}
              >
                ← Anterior
              </button>
            ) : <span />}
            <button
              onClick={siguiente}
              disabled={!seleccionValida}
              style={{
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: seleccionValida ? 'var(--bg-base)' : 'var(--text-tertiary)',
                background: seleccionValida ? 'var(--accent)' : 'var(--border)',
                border: 'none', padding: '14px 32px', cursor: seleccionValida ? 'pointer' : 'not-allowed', transition: 'all 200ms',
              }}
            >
              {paso + 1 === totalPasos ? 'Ver mi roadmap →' : 'Siguiente →'}
            </button>
          </div>
        </div>
      )}

      {/* Captura */}
      {fase === 'captura' && (
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '80px 56px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>
            Último paso
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 12 }}>
            Recibe tu roadmap personalizado.
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 40 }}>
            El roadmap muestra nivel de riesgo, plazo estimado, fases 30-60-90-180 días y recursos necesarios según tus respuestas.
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
              {loading ? 'Generando roadmap...' : 'Ver mi roadmap →'}
            </button>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
              Correo corporativo requerido. Sin spam. NDA disponible bajo solicitud.
            </div>
          </div>
        </div>
      )}

      {/* Resultado */}
      {fase === 'resultado' && resultado && (
        <div id="roadmap-pdf" style={{ maxWidth: 960, margin: '0 auto', padding: '80px 56px' }}>

          {/* Encabezado de resultado */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
              Tu Migration Roadmap · FABRIC
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 0 }}>
              Nivel de riesgo:{' '}
              <em style={{ color: RISK_COLOR[resultado.nivel], fontStyle: 'italic' }}>{resultado.nivel}</em>
            </h2>
          </div>

          {/* Métricas top */}
          <div className="grid-2col" style={{ gap: 2, marginBottom: 48 }}>
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Plazo estimado</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--accent)' }}>{resultado.plazo}</div>
            </div>
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '28px 32px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Sistema de origen</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: 24, color: 'var(--text-primary)' }}>{respuestas.sistema as string}</div>
            </div>
          </div>

          {/* Diagnóstico */}
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '32px', marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Diagnóstico</div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>{resultado.descripcion}</p>
          </div>

          {/* Roadmap 30-60-90-180 días */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 24 }}>
              Roadmap de hitos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {resultado.fases.map((fase, i) => (
                <div key={i} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '24px 28px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                    {fase.label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {fase.hitos.map((hito, j) => (
                      <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', flexShrink: 0, marginTop: 4 }}>→</span>
                        <span style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{hito}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recursos necesarios */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
              Recursos necesarios típicos
            </div>
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resultado.recursos.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', flexShrink: 0, marginTop: 4 }}>◇</span>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick wins */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16 }}>
              Primeras acciones recomendadas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {resultado.quickwins.map((qw, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 20px', background: 'var(--bg-panel)', border: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', flexShrink: 0, marginTop: 3 }}>0{i + 1}</span>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{qw}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer + descarga */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.15em', lineHeight: 1.9, marginBottom: 24 }}>
              Estimaciones basadas en benchmarks de proyectos Oracle similares. Cada caso requiere evaluación específica con un senior de FABRIC.
            </p>

            {/* Botón PDF */}
            <button
              onClick={() => window.print()}
              style={{ marginBottom: 16, padding: '13px 28px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              ↓ Descargar PDF
            </button>

            {/* CTAs — ocultos al imprimir */}
            <div className="pdf-hide" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/aplicar" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bg-base)', background: 'var(--accent)', padding: '14px 28px', textDecoration: 'none' }}>
                Solicitar evaluación específica →
              </Link>
              <Link to="/office-hours" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', border: '1px solid rgba(201,169,110,0.35)', padding: '14px 28px', textDecoration: 'none' }}>
                Office Hours con Julio →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
