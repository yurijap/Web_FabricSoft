import { useEffect, useState } from 'react';
import { useInViewOnce } from '../../../hooks/useInViewOnce';
import { api } from '../../../config/api';

type Question = {
  id: string;
  text: string;
  options: { label: string; score: number }[];
};

const defaultQuestions: Question[] = [
  {
    id: 'q1',
    text: '¿Cuántos días tarda hoy el cierre contable mensual en Fusion?',
    options: [
      { label: '1-5 días', score: 0 },
      { label: '6-10 días', score: 1 },
      { label: '11-20 días', score: 2 },
      { label: 'Más de 20 días', score: 3 },
    ],
  },
  {
    id: 'q2',
    text: '¿Qué parte del cierre sigue ocurriendo fuera de Fusion?',
    options: [
      { label: 'Nada relevante', score: 0 },
      { label: 'Solo conciliaciones menores', score: 1 },
      { label: 'Partidas clave en Excel', score: 2 },
      { label: 'El cierre depende de procesos manuales', score: 3 },
    ],
  },
  {
    id: 'q3',
    text: '¿Cuántos reportes ejecutivos o financieros se generan fuera del ERP?',
    options: [
      { label: 'Ninguno', score: 0 },
      { label: '1-3 reportes', score: 1 },
      { label: '4-10 reportes', score: 2 },
      { label: 'Más de 10 reportes', score: 3 },
    ],
  },
  {
    id: 'q4',
    text: '¿Qué tan críticos son los reportes manuales que siguen activos?',
    options: [
      { label: 'No impactan decisiones', score: 0 },
      { label: 'Apoyan revisiones internas', score: 1 },
      { label: 'Se usan para dirección o auditoría', score: 2 },
      { label: 'La operación depende de ellos', score: 3 },
    ],
  },
  {
    id: 'q5',
    text: '¿Qué porcentaje de usuarios clave usa Fusion como sistema principal?',
    options: [
      { label: 'Más del 80%', score: 0 },
      { label: '60-80%', score: 1 },
      { label: '30-60%', score: 2 },
      { label: 'Menos del 30%', score: 3 },
    ],
  },
  {
    id: 'q6',
    text: '¿Qué tan frecuente es que los usuarios evadan Fusion con Excel, correo o sistemas paralelos?',
    options: [
      { label: 'Casi nunca', score: 0 },
      { label: 'En casos puntuales', score: 1 },
      { label: 'En procesos importantes', score: 2 },
      { label: 'Es la forma normal de operar', score: 3 },
    ],
  },
  {
    id: 'q7',
    text: '¿Cuántas incidencias críticas bloqueantes están abiertas hoy?',
    options: [
      { label: 'Ninguna', score: 0 },
      { label: '1-3', score: 1 },
      { label: '4-10', score: 2 },
      { label: 'Más de 10', score: 3 },
    ],
  },
  {
    id: 'q8',
    text: '¿Qué impacto tienen esas incidencias en cierre, facturación, compras u operación?',
    options: [
      { label: 'Sin impacto operativo', score: 0 },
      { label: 'Molestias controladas', score: 1 },
      { label: 'Retrasan procesos críticos', score: 2 },
      { label: 'Bloquean procesos críticos', score: 3 },
    ],
  },
  {
    id: 'q9',
    text: '¿Cuál es el estado actual de la relación con la consultora implementadora anterior?',
    options: [
      { label: 'Soporte activo y funcional', score: 0 },
      { label: 'Soporte parcial o lento', score: 1 },
      { label: 'Sin soporte o contrato vencido', score: 2 },
      { label: 'Conflicto contractual abierto', score: 3 },
    ],
  },
  {
    id: 'q10',
    text: '¿Qué tan transferido quedó el conocimiento de la consultora al equipo interno?',
    options: [
      { label: 'Documentado y transferido', score: 0 },
      { label: 'Transferencia parcial', score: 1 },
      { label: 'Dependencia alta de la consultora', score: 2 },
      { label: 'Sin transferencia real', score: 3 },
    ],
  },
  {
    id: 'q11',
    text: '¿Cuánto tiempo ha pasado desde el go-live?',
    options: [
      { label: 'Más de 18 meses y estable', score: 0 },
      { label: '6-18 meses', score: 1 },
      { label: '1-6 meses', score: 2 },
      { label: 'Menos de 1 mes o go-live reciente', score: 3 },
    ],
  },
  {
    id: 'q12',
    text: '¿Qué tan activo está el patrocinio ejecutivo para resolver la situación?',
    options: [
      { label: 'CFO/CTO activos y alineados', score: 0 },
      { label: 'Sponsor activo pero parcial', score: 1 },
      { label: 'Patrocinio delegado o intermitente', score: 2 },
      { label: 'Sin patrocinio ejecutivo', score: 3 },
    ],
  },
];

type SeverityLevel = 'BAJO' | 'MODERADO' | 'ALTO' | 'CRÍTICO';
type Escenario = 'fusion-fallando' | 'migrando' | 'greenfield';

const ESCENARIOS: { id: Escenario; label: string; desc: string; tag: string }[] = [
  {
    id: 'fusion-fallando',
    label: 'Fusion fallando',
    desc: 'Tienes Oracle Fusion en producción con problemas críticos activos — cierres lentos, incidencias abiertas, usuarios evadiendo el sistema.',
    tag: 'Rescate activo',
  },
  {
    id: 'migrando',
    label: 'Migrando a Oracle',
    desc: 'Estás en proceso de migración o implementación de Oracle ERP y necesitas validar que vas por buen camino.',
    tag: 'Implementación en curso',
  },
  {
    id: 'greenfield',
    label: 'Greenfield',
    desc: 'Estás evaluando Oracle ERP desde cero — sin implementación previa. Buscas evitar los errores comunes antes de comenzar.',
    tag: 'Nueva implementación',
  },
];

const SEVERITY_COPY: Record<Escenario, Record<SeverityLevel, { desc: string; action: string }>> = {
  'fusion-fallando': {
    BAJO:     { desc: 'Tu implementación muestra señales de estabilidad relativa. Los problemas detectados son gestionables sin intervención de emergencia.', action: 'FABRIC recomienda una revisión de optimización en los próximos 60 días.' },
    MODERADO: { desc: 'Hay fricción operativa visible. Sin atención en las próximas semanas, los problemas actuales pueden bloquear el próximo cierre contable.', action: 'Diagnóstico técnico FABRIC recomendado: inicio en 2-4 semanas.' },
    ALTO:     { desc: 'Tu Fusion presenta patrones clásicos de abandono post go-live. El riesgo operativo es documentable y el costo de inacción crece cada semana.', action: 'Rescate FABRIC estimado: 8-12 semanas · Inversión típica: USD 150-300K.' },
    'CRÍTICO':{ desc: 'Crisis operativa activa. Tu implementación Oracle requiere intervención inmediata de ingenieros senior especializados en rescate.', action: 'Rescate de emergencia FABRIC: inicio en 72 horas · Inversión típica: USD 200-500K.' },
  },
  'migrando': {
    BAJO:     { desc: 'Tu migración muestra indicadores saludables. El ritmo actual sugiere que puedes llegar al go-live sin desviaciones críticas.', action: 'FABRIC puede acompañar como validador independiente en los hitos clave.' },
    MODERADO: { desc: 'Hay señales de que la migración acumulará deuda técnica antes del go-live. Algunos procesos críticos aún no están cubiertos correctamente.', action: 'FABRIC recomienda revisión de arquitectura y plan de pruebas antes del siguiente hito.' },
    ALTO:     { desc: 'La migración presenta riesgos estructurales que comprometen el go-live. El patrón detectado es común en proyectos que terminan en rescate 6 meses después.', action: 'Intervención FABRIC recomendada antes del go-live · Inversión típica: USD 100-250K.' },
    'CRÍTICO':{ desc: 'La migración está en riesgo severo de fracasar o requerir rescate inmediato post go-live. Los indicadores apuntan a una implementación sin base sólida.', action: 'FABRIC recomienda pausa técnica y auditoría urgente · Contacto en menos de 48 horas.' },
  },
  'greenfield': {
    BAJO:     { desc: 'Tu punto de partida es sólido. Tienes claridad en objetivos y el contexto organizacional favorece una implementación exitosa.', action: 'FABRIC puede estructurar el RFP y los criterios de selección de consultora.' },
    MODERADO: { desc: 'Hay vacíos en la definición que, si no se abordan antes de comenzar, se convierten en los problemas típicos de los primeros 6 meses post go-live.', action: 'FABRIC recomienda un workshop de arquitectura antes de seleccionar consultora.' },
    ALTO:     { desc: 'El contexto organizacional presenta factores de riesgo altos para una implementación Oracle. Sin intervención en el diseño, el proyecto tendrá problemas predecibles.', action: 'FABRIC recomienda un programa de gobierno y arquitectura desde el inicio · USD 80-150K.' },
    'CRÍTICO':{ desc: 'Las condiciones actuales hacen que una implementación Oracle sin acompañamiento especializado tenga probabilidad muy alta de fracaso en los primeros 12 meses.', action: 'FABRIC debe ser parte del equipo desde el día uno · Contacto prioritario recomendado.' },
  },
};

function getSeverity(score: number, escenario: Escenario): { level: SeverityLevel; color: string; desc: string; action: string } {
  let level: SeverityLevel;
  let color: string;

  if (score <= 8)       { level = 'BAJO';     color = '#4ade80'; }
  else if (score <= 16) { level = 'MODERADO'; color = '#fbbf24'; }
  else if (score <= 24) { level = 'ALTO';     color = '#f97316'; }
  else                  { level = 'CRÍTICO';  color = '#ef4444'; }

  const copy = SEVERITY_COPY[escenario][level];
  return { level, color, ...copy };
}


export default function S07bRescueAssessment() {
  const [ref, isInView] = useInViewOnce<HTMLElement>();
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [escenario, setEscenario] = useState<Escenario | null>(null);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [step, setStep] = useState<'quiz' | 'capture' | 'result'>('quiz');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [sending, setSending] = useState(false);
  const [severity, setSeverity] = useState<ReturnType<typeof getSeverity> | null>(null);

  useEffect(() => {
    let mounted = true;

    api.get('/rescue-assessment/questions')
      .then((res) => {
        const nextQuestions = res.data?.questions;
        if (mounted && Array.isArray(nextQuestions) && nextQuestions.length === 12) {
          setQuestions(nextQuestions);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const q = questions[current] ?? questions[0];
  const hasAnswer = q.id in answers;
  const isLast = current === questions.length - 1;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSelect = (score: number) => {
    setAnswers((prev) => ({ ...prev, [q.id]: score }));
  };

  const handleNext = () => {
    if (isLast) {
      setStep('capture');
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const handleBack = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const handleSubmit = async () => {
    if (!validEmail) return;
    setSending(true);
    const answersPayload = questions.map((question) => ({ questionId: question.id, score: answers[question.id] ?? 0 }));
    try {
      await api.post('/rescue-assessment/submit', { email, nombre, empresa, escenario: escenario ?? 'fusion-fallando', answers: answersPayload });
    } catch {
      // El resultado público no se bloquea si el email o el CRM fallan.
    } finally {
      setSeverity(getSeverity(totalScore, escenario ?? 'fusion-fallando'));
      setStep('result');
      setSending(false);
    }
  };

  const handleReset = () => {
    setStep('quiz');
    setStarted(false);
    setEscenario(null);
    setAnswers({});
    setCurrent(0);
    setEmail('');
    setNombre('');
    setEmpresa('');
    setSeverity(null);
  };

  return (
    <section
      ref={ref}
      id="rescue-assessment"
      className={`demo-section transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      style={{ borderTop: '1px solid var(--border)' }}
    >
      <div className="container">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0, maxWidth: 820, marginInline: 'auto' }}>
          <div className="label">Oracle Fusion Rescue Assessment</div>
          <h2>
            ¿Qué tan grave está <span className="text-[#C9A96E]">tu implementación?</span>
          </h2>

          {!started && (
            <>
              <p style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.7, marginTop: 24 }}>
                12 preguntas · 3 minutos · Diagnóstico de severidad inmediato.
              </p>

              {/* Selector de escenario */}
              <div className="rescue-scenario-selector">
                <div className="rescue-scenario-kicker">
                  ¿Cuál es tu situación actual?
                </div>
                <div className="rescue-scenario-grid">
                  {ESCENARIOS.map((esc) => {
                    const isSelected = escenario === esc.id;
                    return (
                      <button
                        key={esc.id}
                        onClick={() => setEscenario(esc.id)}
                        className="rescue-scenario-card"
                        style={{
                          background: isSelected ? 'rgba(201,169,110,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <div className="rescue-scenario-card-top">
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                          }}>
                            {esc.tag}
                          </span>
                          {isSelected && (
                            <span className="rescue-scenario-dot" />
                          )}
                        </div>
                        <div className="rescue-scenario-title" style={{ color: isSelected ? '#F5F5F5' : '#8A8A8A' }}>
                          {esc.label}
                        </div>
                        <div className="rescue-scenario-desc">
                          {esc.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginTop: 28 }}>
                <button
                  onClick={() => setStarted(true)}
                  disabled={!escenario}
                  style={{
                    padding: '14px 36px',
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    background: escenario ? 'var(--accent)' : 'transparent',
                    color: escenario ? '#0A0A0A' : 'var(--text-secondary)',
                    border: escenario ? 'none' : '1px solid var(--border)',
                    cursor: escenario ? 'pointer' : 'not-allowed',
                    transition: 'all .2s ease',
                  }}
                >
                  Iniciar diagnóstico →
                </button>
              </div>
            </>
          )}
        </div>

        {started && step === 'quiz' && (
          <div style={{ marginTop: 48, animation: 'fadeIn .3s ease' }}>
            {escenario && (
              <div style={{ marginBottom: 24 }}>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.2em',
                  textTransform: 'uppercase', padding: '5px 12px',
                  border: '1px solid var(--accent)', color: 'var(--accent)',
                  background: 'rgba(201,169,110,0.06)',
                }}>
                  {ESCENARIOS.find(e => e.id === escenario)?.label}
                </span>
              </div>
            )}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                  {String(current + 1).padStart(2, '0')} / {questions.length}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.12em' }}>
                  {current} respondidas
                </span>
              </div>
              <div style={{ height: 2, background: 'var(--border)', position: 'relative' }}>
                <div style={{
                  height: '100%',
                  width: `${(current / questions.length) * 100}%`,
                  background: 'var(--accent)',
                  transition: 'width .3s ease',
                }} />
              </div>
            </div>

            <div key={q.id} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0 64px',
              alignItems: 'center',
              animation: 'fadeIn .25s ease',
            }}>
              <p style={{ fontSize: 36, lineHeight: 1.2, color: 'var(--text-primary)', fontWeight: 400, fontFamily: 'var(--serif)', margin: 0 }}>
                {q.text}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.score;
                  return (
                    <button
                      key={`${q.id}-${opt.label}`}
                      onClick={() => handleSelect(opt.score)}
                      style={{
                        textAlign: 'left',
                        padding: '14px 18px',
                        fontSize: 14,
                        fontFamily: 'var(--sans)',
                        background: isSelected ? 'rgba(201,169,110,0.12)' : 'rgba(255,255,255,0.03)',
                        border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                        color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all .18s ease',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        flexShrink: 0,
                        border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        transition: 'all .18s ease',
                      }} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 12 }}>
              {current > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    padding: '12px 20px',
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  ← Anterior
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!hasAnswer}
                style={{
                  padding: '13px 32px',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  background: hasAnswer ? 'var(--accent)' : 'transparent',
                  border: hasAnswer ? 'none' : '1px solid var(--border)',
                  color: hasAnswer ? '#0A0A0A' : 'var(--text-secondary)',
                  cursor: hasAnswer ? 'pointer' : 'not-allowed',
                  transition: 'all .2s ease',
                }}
              >
                {isLast ? 'Ver diagnóstico →' : 'Siguiente →'}
              </button>
            </div>
          </div>
        )}

        {step === 'capture' && (
          <div style={{ marginTop: 48, maxWidth: 520, marginInline: 'auto', animation: 'fadeIn .3s ease' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 16 }}>
              Un paso más
            </div>
            <p style={{ fontSize: 17, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 32 }}>
              Ingresa tu correo para ver el diagnóstico y recibir el resultado.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              <input type="email" placeholder="correo@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 13, outline: 'none' }} />
              <input type="text" placeholder="Nombre (opcional)" value={nombre} onChange={(event) => setNombre(event.target.value)} style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 13, outline: 'none' }} />
              <input type="text" placeholder="Empresa (opcional)" value={empresa} onChange={(event) => setEmpresa(event.target.value)} style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'var(--mono)', fontSize: 13, outline: 'none' }} />
            </div>
            <button
              onClick={handleSubmit}
              disabled={sending || !validEmail}
              style={{
                padding: '14px 36px',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                background: validEmail ? 'var(--accent)' : 'transparent',
                border: '1px solid var(--accent)',
                color: validEmail ? '#0A0A0A' : 'var(--accent)',
                cursor: sending ? 'wait' : 'pointer',
                opacity: sending ? 0.7 : 1,
              }}
            >
              {sending ? 'Procesando...' : 'Ver diagnóstico →'}
            </button>
          </div>
        )}

        {step === 'result' && severity ? (
          <div
            className="rescue-result-card"
            style={{
              border: `1px solid ${severity.color}40`,
              background: `${severity.color}08`,
              animation: 'fadeIn .4s ease',
            }}
          >
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Nivel de severidad
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 900, letterSpacing: '0.1em', color: severity.color, marginBottom: 24 }}>
              {severity.level}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: severity.color, marginBottom: 24 }}>
              Severidad {totalScore}/36
            </div>
            <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-primary)', marginBottom: 20, maxWidth: 680 }}>
              {severity.desc}
            </p>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: severity.color, letterSpacing: '0.12em', background: `${severity.color}10`, border: `1px solid ${severity.color}30`, padding: '12px 18px', marginBottom: 36, display: 'inline-block' }}>
              {severity.action}
            </div>
            <div className="rescue-result-ctas">
              <a href="/office-hours" className="btn-primary" data-interaction="office-hours">
                Solicitar evaluación detallada →
              </a>
              <button onClick={handleReset} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '12px 20px', cursor: 'pointer' }}>
                Reiniciar
              </button>
              <span className="nda-seal">Conversación bajo NDA mutuo</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
