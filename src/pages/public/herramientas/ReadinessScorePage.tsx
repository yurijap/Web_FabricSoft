import { useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../../components/BackButton';
import { api } from '../../../config/api';
import { getInteractionTracking } from '../../../utils/tracking';

const PREGUNTAS = [
  {
    id: 'patrocinio',
    texto: '¿Tienes patrocinio ejecutivo confirmado para la iniciativa Oracle?',
    opciones: [
      { label: 'CFO + CTO ambos activos y comprometidos', puntos: 10 },
      { label: 'Solo CFO o solo CTO activo', puntos: 6 },
      { label: 'Director de IT sin respaldo de CFO/CTO', puntos: 3 },
      { label: 'Sin patrocinio ejecutivo definido', puntos: 0 },
    ],
  },
  {
    id: 'presupuesto',
    texto: '¿El presupuesto para la implementación está aprobado?',
    opciones: [
      { label: 'Aprobado formalmente con cifra definida', puntos: 10 },
      { label: 'En proceso de aprobación con número estimado', puntos: 6 },
      { label: 'En evaluación, sin cifra definida', puntos: 3 },
      { label: 'Sin presupuesto definido ni proceso activo', puntos: 0 },
    ],
  },
  {
    id: 'procesos',
    texto: '¿Qué tan documentados están los procesos críticos de negocio?',
    opciones: [
      { label: 'Documentados, actualizados y validados por el negocio', puntos: 10 },
      { label: 'Parcialmente documentados con brechas conocidas', puntos: 6 },
      { label: 'Existen mapas desactualizados', puntos: 3 },
      { label: 'Sin documentación — depende de personas clave', puntos: 0 },
    ],
  },
  {
    id: 'datos',
    texto: '¿Cuál es el estado de la calidad de datos en tu sistema actual?',
    opciones: [
      { label: 'Catalogados, limpios y validados por área financiera', puntos: 10 },
      { label: 'Algunos problemas conocidos con plan de limpieza', puntos: 6 },
      { label: 'Varios duplicados y registros inconsistentes', puntos: 3 },
      { label: 'Desconocemos la calidad real de los datos', puntos: 0 },
    ],
  },
  {
    id: 'equipo',
    texto: '¿Tienes equipo interno dedicado al proyecto?',
    opciones: [
      { label: 'Equipo formal liberado con dedicación exclusiva', puntos: 10 },
      { label: 'Equipo parcial con otras responsabilidades paralelas', puntos: 6 },
      { label: 'Solo un responsable de IT asignado', puntos: 3 },
      { label: 'Sin equipo interno definido', puntos: 0 },
    ],
  },
  {
    id: 'integraciones',
    texto: '¿Cuántas integraciones o sistemas satélite tiene tu ERP actual?',
    opciones: [
      { label: 'Ninguna — sistema standalone', puntos: 10 },
      { label: 'De 1 a 5 integraciones documentadas', puntos: 7 },
      { label: 'De 6 a 15 integraciones con complejidad media', puntos: 4 },
      { label: 'Más de 15 integraciones, algunas sin documentar', puntos: 0 },
    ],
  },
  {
    id: 'plazo',
    texto: '¿El plazo objetivo de go-live es realista para la complejidad del proyecto?',
    opciones: [
      { label: 'Sí — plazo validado con experto Oracle externo', puntos: 10 },
      { label: 'Creemos que sí — basado en experiencia interna', puntos: 6 },
      { label: 'Hay presión interna que puede comprimir el plazo', puntos: 3 },
      { label: 'El plazo lo definió un directivo sin análisis técnico', puntos: 0 },
    ],
  },
  {
    id: 'usuarios',
    texto: '¿Los usuarios clave están disponibles y comprometidos con el proyecto?',
    opciones: [
      { label: 'Sí — liberados y comprometidos por dirección', puntos: 10 },
      { label: 'Parcialmente — con otras cargas de trabajo', puntos: 5 },
      { label: 'Solo disponibles para revisiones puntuales', puntos: 2 },
      { label: 'Sin disponibilidad definida', puntos: 0 },
    ],
  },
  {
    id: 'compliance',
    texto: '¿Tu empresa opera bajo regulaciones financieras o fiscales específicas?',
    opciones: [
      { label: 'Sí — y ya hay mapa de requerimientos documentado', puntos: 10 },
      { label: 'Sí — pero sin mapa de requerimientos aún', puntos: 5 },
      { label: 'Solo regulaciones estándar (SAT, IMSS)', puntos: 7 },
      { label: 'No conocemos los requerimientos de compliance', puntos: 0 },
    ],
  },
  {
    id: 'experiencia',
    texto: '¿La organización tiene experiencia previa con implementaciones ERP?',
    opciones: [
      { label: 'Sí — implementación ERP exitosa y aprendizajes documentados', puntos: 10 },
      { label: 'Sí — pero la anterior fue problemática', puntos: 4 },
      { label: 'Solo sistemas legacy o básicos anteriormente', puntos: 6 },
      { label: 'Primera implementación de ERP empresarial', puntos: 3 },
    ],
  },
  {
    id: 'consultora',
    texto: '¿Ya tienes una consultora Oracle seleccionada o en evaluación?',
    opciones: [
      { label: 'En evaluación con criterios formales de selección', puntos: 10 },
      { label: 'Sí — seleccionada sin proceso formal de RFP', puntos: 5 },
      { label: 'Aún no iniciamos el proceso de selección', puntos: 7 },
      { label: 'La misma que implementó el sistema actual con problemas', puntos: 2 },
    ],
  },
  {
    id: 'alcance',
    texto: '¿El alcance funcional del proyecto está definido?',
    opciones: [
      { label: 'Sí — con módulos, fases y criterios de aceptación', puntos: 10 },
      { label: 'Parcialmente — módulos definidos, sin criterios claros', puntos: 6 },
      { label: 'Solo a nivel general, sin detalle funcional', puntos: 3 },
      { label: 'Sin alcance definido — depende de la consultora', puntos: 0 },
    ],
  },
  {
    id: 'gobierno',
    texto: '¿Tienes un modelo de gobierno de proyecto definido?',
    opciones: [
      { label: 'Sí — comité de proyecto con roles y frecuencia definida', puntos: 10 },
      { label: 'Informalmente — reuniones sin estructura formal', puntos: 5 },
      { label: 'Solo un PMO interno sin experiencia Oracle', puntos: 3 },
      { label: 'Sin gobierno definido', puntos: 0 },
    ],
  },
  {
    id: 'ciclo',
    texto: '¿Has definido qué significa "entrega exitosa" para tu organización?',
    opciones: [
      { label: 'Sí — primer ciclo crítico en producción, métricas definidas', puntos: 10 },
      { label: 'Sí — go-live en fecha con datos correctos', puntos: 6 },
      { label: 'No hay criterio formal — depende de percepción del equipo', puntos: 2 },
      { label: 'El contrato dice "go-live" y eso es todo', puntos: 0 },
    ],
  },
  {
    id: 'comunicacion',
    texto: '¿Hay un plan de gestión del cambio y comunicación interna?',
    opciones: [
      { label: 'Sí — con campaña de adopción y capacitación formal', puntos: 10 },
      { label: 'Parcialmente — hay plan de capacitación sin campaña', puntos: 6 },
      { label: 'Solo comunicado inicial de dirección', puntos: 2 },
      { label: 'Sin plan de cambio ni comunicación definida', puntos: 0 },
    ],
  },
];

type Respuesta = { label: string; puntos: number };
type Respuestas = Record<string, Respuesta>;

function calcularScore(respuestas: Respuestas) {
  const total = Object.values(respuestas).reduce((sum, r) => sum + r.puntos, 0);
  const max = PREGUNTAS.length * 10;
  return Math.round((total / max) * 100);
}

function getNivel(score: number) {
  if (score >= 75) return {
    nivel: 'LISTO',
    color: '#7B9E6B',
    titulo: 'Tu organización está lista para migrar a Oracle Fusion.',
    descripcion: 'Los fundamentos están en su lugar: patrocinio ejecutivo, presupuesto, datos y gobierno. El riesgo de la migración es bajo y las condiciones son favorables para iniciar en los próximos 3-6 meses.',
    accion: 'Conversa con FABRIC para comenzar la evaluación específica de tu proyecto.',
    cta: 'Solicitar evaluación específica',
    ctaPath: '/aplicar',
  };
  if (score >= 45) return {
    nivel: 'PREPARACIÓN PREVIA',
    color: 'var(--accent)',
    titulo: 'Hay brechas que pueden comprometer la migración si no se atienden.',
    descripcion: 'Tu organización tiene bases correctas pero hay factores de riesgo identificados. FABRIC recomienda una fase de Readiness antes del inicio formal para maximizar la probabilidad de éxito y proteger la inversión.',
    accion: 'Un Pre-Migration Readiness Pack de 4-6 semanas puede elevar tu score a la zona verde antes de comprometer presupuesto de implementación.',
    cta: 'Iniciar conversación con FABRIC',
    ctaPath: '/aplicar',
  };
  return {
    nivel: 'ESPERAR',
    color: '#B85450',
    titulo: 'Hay factores de riesgo que, sin corrección, comprometerán la migración.',
    descripcion: 'Iniciar la implementación en el estado actual aumenta significativamente la probabilidad de un proyecto fallido. FABRIC recomienda resolver las brechas críticas antes de comprometer inversión en Oracle.',
    accion: 'Solicita un Oracle Readiness Assessment de FABRIC para obtener un plan específico de corrección por área.',
    cta: 'Solicitar Readiness Assessment',
    ctaPath: '/aplicar',
  };
}

export default function ReadinessScorePage() {
  const [paso, setPaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [seleccion, setSeleccion] = useState<Respuesta | null>(null);
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
      setSeleccion(null);
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

    setLoading(true);
    try {
      const scoreTotal = calcularScore(respuestas);
      const nivel = getNivel(scoreTotal).nivel;
      await api.post('/leads/readiness-score', {
        ...form,
        respuestas: Object.fromEntries(Object.entries(respuestas).map(([k, v]) => [k, v.label])),
        scoreTotal,
        nivel,
        tracking: getInteractionTracking('readiness', 'readiness-score'),
      });
      setFase('resultado');
    } catch {
      setError('No se pudo registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const score = fase === 'resultado' ? calcularScore(respuestas) : 0;
  const nivel = fase === 'resultado' ? getNivel(score) : null;

  return (
    <div style={{ background: 'var(--bg-base)', paddingTop: 100, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 56px 0' }}>
        <BackButton />
      </div>

      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 64 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 56px' }}>
          <div className="label" style={{ marginBottom: 20 }}>Herramienta · FABRIC</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.02, marginBottom: 24 }}>
            Oracle Readiness Score.<br /><em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>15 preguntas · Score 0–100.</em>
          </h1>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 640 }}>
            Evaluación ejecutiva de los 15 factores que determinan si tu organización está lista para implementar Oracle Fusion Cloud sin comprometer la inversión ni los plazos.
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 56 }}>
            {pregunta.opciones.map((opt) => {
              const activo = seleccion?.label === opt.label;
              return (
                <button
                  key={opt.label}
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
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {paso > 0 ? (
              <button
                onClick={() => { setPaso(p => p - 1); setSeleccion(respuestas[PREGUNTAS[paso - 1].id] ?? null); }}
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
              {paso + 1 === totalPasos ? 'Ver mi score →' : 'Siguiente →'}
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
            Recibe tu Oracle Readiness Score.
          </h2>
          <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 40 }}>
            El score muestra en qué zona se encuentra tu organización y las brechas específicas que deben atenderse antes de comprometer presupuesto.
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
              {loading ? 'Calculando...' : 'Ver mi Readiness Score →'}
            </button>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.8 }}>
              Correo corporativo requerido. Sin spam.
            </div>
          </div>
        </div>
      )}

      {/* Resultado */}
      {fase === 'resultado' && nivel && (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 56px' }}>
          {/* Score visual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginBottom: 48 }}>
            <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke="var(--border)" strokeWidth="8" />
                <circle
                  cx="70" cy="70" r="58" fill="none"
                  stroke={nivel.color} strokeWidth="8"
                  strokeDasharray={`${(score / 100) * 364.4} 364.4`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 300, color: nivel.color, lineHeight: 1 }}>{score}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>/ 100</div>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: nivel.color, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
                {nivel.nivel}
              </div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 12 }}>
                {nivel.titulo}
              </h2>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                {nivel.descripcion}
              </p>
            </div>
          </div>

          {/* Brechas por área */}
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', padding: 32, marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 20 }}>
              Score por factor evaluado
            </div>
            <div className="grid-auto-fit" style={{ gap: 16 }}>
              {PREGUNTAS.map((p) => {
                const r = respuestas[p.id];
                const pct = r ? (r.puntos / 10) * 100 : 0;
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                        {p.id.charAt(0).toUpperCase() + p.id.slice(1)}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: pct >= 70 ? '#7B9E6B' : pct >= 40 ? 'var(--accent)' : '#B85450' }}>
                        {r?.puntos ?? 0}/10
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? '#7B9E6B' : pct >= 40 ? 'var(--accent)' : '#B85450', borderRadius: 2, transition: 'width 800ms ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: 'rgba(201,169,110,0.05)', border: '1px solid rgba(201,169,110,0.2)', padding: '24px 32px', marginBottom: 40 }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 0 }}>
              {nivel.accion}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to={nivel.ctaPath} style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bg-base)', background: 'var(--accent)', padding: '14px 28px', textDecoration: 'none' }}>
              {nivel.cta} →
            </Link>
            <Link to="/roadmap" style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', border: '1px solid rgba(201,169,110,0.35)', padding: '14px 28px', textDecoration: 'none' }}>
              Ver Migration Roadmap →
            </Link>
          </div>

          <div style={{ marginTop: 40, fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-tertiary)', letterSpacing: '0.12em', lineHeight: 1.9 }}>
            Score estimado basado en factores de riesgo Oracle. Cada caso requiere evaluación específica con un senior de FABRIC.
          </div>
        </div>
      )}
    </div>
  );
}
