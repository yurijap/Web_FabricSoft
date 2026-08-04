import { useEffect, useState } from 'react';
import { useAuthApi } from '../../config/api';

type Severity = 'BAJO' | 'MODERADO' | 'ALTO' | 'CRÍTICO';

type Escenario = 'fusion-fallando' | 'migrando' | 'greenfield';

const ESCENARIO_LABEL: Record<Escenario, string> = {
  'fusion-fallando': 'Fusion fallando',
  'migrando':        'Migrando',
  'greenfield':      'Greenfield',
};

const ESCENARIO_COLOR: Record<Escenario, string> = {
  'fusion-fallando': '#ef4444',
  'migrando':        '#60a5fa',
  'greenfield':      '#4ade80',
};

interface AssessmentItem {
  _id: string;
  email: string;
  nombre: string;
  empresa: string;
  cargo: string;
  escenario?: Escenario;
  totalScore: number;
  severity: Severity;
  emailSent: boolean;
  tracking?: { sourceSection?: string; interactionType?: string; pagePath?: string };
  createdAt: string;
}

interface QuestionOption {
  label: string;
  score: number;
}

interface RescueQuestion {
  id: string;
  text: string;
  options: QuestionOption[];
}

interface BySeverity {
  BAJO: number;
  MODERADO: number;
  ALTO: number;
  CRÍTICO: number;
}

const SEVERITY_COLOR: Record<string, string> = {
  BAJO: '#4ade80',
  MODERADO: '#fbbf24',
  ALTO: '#f97316',
  CRÍTICO: '#ef4444',
};

const EMPTY_COUNTS = { BAJO: 0, MODERADO: 0, ALTO: 0, CRÍTICO: 0 };
const S = { fontFamily: 'var(--mono, "JetBrains Mono", monospace)' } as const;

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminRescueAssessment() {
  const adminApi = useAuthApi();
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [bySeverity, setBySeverity] = useState<BySeverity>(EMPTY_COUNTS);
  const [questions, setQuestions] = useState<RescueQuestion[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [message, setMessage] = useState('');

  const cargar = async (severity?: string) => {
    setLoading(true);
    try {
      const params = severity ? `?severity=${severity}` : '';
      const res = await adminApi.get(`/rescue-assessment/admin${params}`);
      setItems(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
      const counts = res.data.bySeverity ?? EMPTY_COUNTS;
      setBySeverity({
        BAJO: counts.BAJO ?? 0,
        MODERADO: counts.MODERADO ?? 0,
        ALTO: counts.ALTO ?? 0,
        CRÍTICO: counts.CRÍTICO ?? 0,
      });
    } catch {
      setMessage('No se pudieron cargar los assessments.');
    } finally {
      setLoading(false);
    }
  };

  const cargarPreguntas = async () => {
    setQuestionsLoading(true);
    try {
      const res = await adminApi.get('/rescue-assessment/questions');
      setQuestions(res.data.questions ?? []);
    } catch {
      setMessage('No se pudieron cargar las preguntas.');
    } finally {
      setQuestionsLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    cargarPreguntas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltro = (sev: string) => {
    setFilter(sev);
    cargar(sev || undefined);
  };

  const updateQuestion = (id: string, patch: Partial<RescueQuestion>) => {
    setQuestions((prev) => prev.map((question) => (
      question.id === id ? { ...question, ...patch } : question
    )));
  };

  const updateOption = (questionId: string, optionIndex: number, patch: Partial<QuestionOption>) => {
    setQuestions((prev) => prev.map((question) => {
      if (question.id !== questionId) return question;
      return {
        ...question,
        options: question.options.map((option, index) => (
          index === optionIndex ? { ...option, ...patch } : option
        )),
      };
    }));
  };

  const guardarPreguntas = async () => {
    setSavingQuestions(true);
    setMessage('');
    try {
      const res = await adminApi.put('/rescue-assessment/admin/questions', { questions });
      setQuestions(res.data.questions ?? questions);
      setMessage('Preguntas actualizadas. El formulario público usará esta configuración.');
    } catch (error) {
      const response = error as { response?: { data?: { error?: string } } };
      setMessage(response.response?.data?.error || 'No se pudieron guardar las preguntas.');
    } finally {
      setSavingQuestions(false);
    }
  };

  const restaurarPreguntas = async () => {
    setSavingQuestions(true);
    setMessage('');
    try {
      const res = await adminApi.put('/rescue-assessment/admin/questions/reset');
      setQuestions(res.data.questions ?? []);
      setMessage('Se restauraron las 12 preguntas originales del assessment.');
    } catch (error) {
      const response = error as { response?: { data?: { error?: string } } };
      setMessage(response.response?.data?.error || 'No se pudieron restaurar las preguntas.');
    } finally {
      setSavingQuestions(false);
    }
  };

  const FILTROS = [
    { label: 'Todos', value: '' },
    { label: 'Crítico', value: 'CRÍTICO' },
    { label: 'Alto', value: 'ALTO' },
    { label: 'Moderado', value: 'MODERADO' },
    { label: 'Bajo', value: 'BAJO' },
  ];

  return (
    <div className="fabric-admin-page">
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">ADMIN · RESCUE ASSESSMENT</div>
            <h1 className="fabric-admin-title">Rescue Assessment</h1>
            <div className="fabric-admin-subtitle">
              Triage ejecutivo de rescates Oracle Fusion · preguntas editables · score operativo 0-36.
            </div>
          </div>
          <button
            onClick={() => cargar(filter || undefined)}
            style={{ ...S, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '9px 18px', background: 'transparent', border: '1px solid #252525', color: '#8A8A8A', cursor: 'pointer' }}
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="fabric-admin-content">
        <div className="fabric-admin-panel ara-info-panel" style={{ marginBottom: 28 }}>
          <div className="ara-info-grid">
            <div className="ara-info-desc">
              <div className="fabric-admin-eyebrow">METODOLOGÍA</div>
              <div className="ara-info-subtitle">
                12 preguntas · 7 dimensiones operativas · score 0-36
              </div>
              <h2 className="ara-info-title">
                Diagnóstico en 12 preguntas.
              </h2>
              <p className="ara-info-text">
                El assessment evalúa cierre contable, reportes manuales, adopción de usuarios,
                incidencias críticas, relación con la consultora anterior, tiempo desde go-live
                y patrocinio ejecutivo.
              </p>
            </div>
            
            <div className="ara-severity-box">
              <div className="ara-severity-title">
                Escala de severidad
              </div>
              <div className="ara-severity-list">
                {[
                  ['0-8', 'BAJO'],
                  ['9-16', 'MODERADO'],
                  ['17-24', 'ALTO'],
                  ['25-36', 'CRÍTICO'],
                ].map(([range, label]) => (
                  <div key={label} className="ara-severity-row">
                    <span className="ara-severity-range">{range} puntos</span>
                    <span
                      className="ara-severity-badge"
                      style={{
                        color: SEVERITY_COLOR[label],
                        border: `1px solid ${SEVERITY_COLOR[label]}33`,
                        background: `${SEVERITY_COLOR[label]}0D`
                      }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total', value: total, color: '#C9A96E' },
            { label: 'Crítico', value: bySeverity.CRÍTICO, color: '#ef4444' },
            { label: 'Alto', value: bySeverity.ALTO, color: '#f97316' },
            { label: 'Moderado', value: bySeverity.MODERADO, color: '#fbbf24' },
            { label: 'Bajo', value: bySeverity.BAJO, color: '#4ade80' },
          ].map((stat) => (
            <div key={stat.label} className="fabric-admin-stat-card">
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: stat.color, fontWeight: 300 }}>{stat.value}</div>
              <div style={{ ...S, fontSize: 9, color: '#5A5A5A', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 6 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <section className="fabric-admin-panel" style={{ marginBottom: 36 }}>
          <div className="ara-section-header">
            <div>
              <div className="fabric-admin-eyebrow">CONFIGURACIÓN DEL FORMULARIO</div>
              <h2 style={{ margin: '8px 0 0', color: '#F5F5F5', fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 400 }}>
                Preguntas del assessment
              </h2>
              <p style={{ marginTop: 8, color: '#777', fontSize: 13 }}>
                {questions.length} preguntas activas · edita el texto o las opciones y guarda para publicar.
              </p>
            </div>
            <div className="ara-section-actions">
              <button
                onClick={restaurarPreguntas}
                disabled={savingQuestions || questionsLoading}
                style={{ ...S, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '11px 18px', background: 'transparent', border: '1px solid #2b261b', color: '#C9A96E', cursor: savingQuestions ? 'wait' : 'pointer', opacity: savingQuestions ? .65 : 1 }}
              >
                Restaurar originales
              </button>
              <button
                onClick={guardarPreguntas}
                disabled={savingQuestions || questionsLoading}
                style={{ ...S, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '11px 18px', background: '#C9A96E', border: '1px solid #C9A96E', color: '#080808', cursor: savingQuestions ? 'wait' : 'pointer', opacity: savingQuestions ? .65 : 1 }}
              >
                {savingQuestions ? 'Guardando...' : 'Guardar preguntas'}
              </button>
            </div>
          </div>

          {message && (
            <div style={{ ...S, fontSize: 10, letterSpacing: '0.08em', color: '#C9A96E', border: '1px solid #2a2418', background: 'rgba(201,169,110,.06)', padding: 12, marginBottom: 18 }}>
              {message}
            </div>
          )}

          {questionsLoading ? (
            <div style={{ ...S, fontSize: 10, color: '#555', padding: '32px 0', textAlign: 'center' }}>Cargando preguntas...</div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {questions.map((question, index) => (
                <article key={question.id} style={{ border: '1px solid #1b1b1b', background: 'rgba(0,0,0,.18)', padding: 18 }}>
                  <div className="ara-question-row">
                    <div style={{ ...S, color: '#C9A96E', letterSpacing: '0.18em', fontSize: 10 }}>{String(index + 1).padStart(2, '0')}</div>
                    <textarea
                      value={question.text}
                      onChange={(event) => updateQuestion(question.id, { text: event.target.value })}
                      rows={2}
                      style={{ resize: 'vertical', minHeight: 54, background: '#070707', border: '1px solid #232323', color: '#E8E8E8', padding: 12, fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.45, outline: 'none' }}
                    />
                  </div>

                  <div className="ara-options-grid">
                    {question.options.map((option, optionIndex) => (
                      <div key={`${question.id}-${optionIndex}`} style={{ border: '1px solid #171717', padding: 10, background: 'rgba(255,255,255,.015)' }}>
                        <div style={{ ...S, color: '#5A5A5A', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
                          Score {option.score}
                        </div>
                        <input
                          value={option.label}
                          onChange={(event) => updateOption(question.id, optionIndex, { label: event.target.value })}
                          style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #252525', color: '#BDBDBD', padding: '0 0 7px', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }}
                        />
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTROS.map((filtro) => (
            <button
              key={filtro.value}
              onClick={() => aplicarFiltro(filtro.value)}
              style={{
                ...S,
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '5px 14px',
                cursor: 'pointer',
                background: filter === filtro.value ? 'rgba(201,169,110,0.12)' : 'transparent',
                border: `1px solid ${filter === filtro.value ? '#C9A96E' : '#252525'}`,
                color: filter === filtro.value ? '#C9A96E' : '#5A5A5A',
              }}
            >
              {filtro.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ ...S, fontSize: 10, color: '#3A3A3A', padding: '40px 0', textAlign: 'center' }}>Cargando...</div>
        ) : items.length === 0 ? (
          <div style={{ ...S, fontSize: 10, color: '#3A3A3A', padding: '40px 0', textAlign: 'center' }}>Sin resultados.</div>
        ) : (
          <div style={{ borderTop: '1px solid #1E1E1E' }}>
            {items.map((item) => (
              <div key={item._id} className="ara-result-row">
                <div className="ara-result-main">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <div style={{ ...S, fontSize: 11, color: '#F5F5F5' }}>
                      {item.empresa || <span style={{ color: '#3A3A3A' }}>Sin empresa</span>}
                    </div>
                    {item.escenario && (
                      <span style={{
                        ...S, fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase',
                        padding: '2px 8px',
                        border: `1px solid ${ESCENARIO_COLOR[item.escenario]}44`,
                        color: ESCENARIO_COLOR[item.escenario],
                        background: `${ESCENARIO_COLOR[item.escenario]}0D`,
                        whiteSpace: 'nowrap',
                      }}>
                        {ESCENARIO_LABEL[item.escenario]}
                      </span>
                    )}
                  </div>
                  <div style={{ ...S, fontSize: 10, color: '#8A8A8A' }}>
                    {item.nombre || item.email}
                    {item.nombre ? <span style={{ color: '#5A5A5A' }}> · {item.email}</span> : null}
                  </div>
                  {item.cargo && <div style={{ ...S, fontSize: 9, color: '#5A5A5A', marginTop: 4 }}>{item.cargo}</div>}
                  <div style={{ ...S, fontSize: 8, color: '#3A3A3A', marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {[item.tracking?.sourceSection, item.tracking?.interactionType].filter(Boolean).join(' · ') || (item.emailSent ? 'Resultado enviado' : 'Email pendiente')}
                  </div>
                </div>
                <div className="ara-result-meta">
                  <div style={{ ...S, fontSize: 9, color: '#5A5A5A' }}>{fmt(item.createdAt)}</div>
                  <div style={{ ...S, fontSize: 10, color: '#8A8A8A' }}>
                    <span style={{ color: SEVERITY_COLOR[item.severity] }}>{item.totalScore}</span>
                    <span style={{ color: '#3A3A3A' }}> / 36</span>
                  </div>
                  <span style={{ ...S, fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '3px 10px', border: `1px solid ${SEVERITY_COLOR[item.severity]}44`, color: SEVERITY_COLOR[item.severity], background: `${SEVERITY_COLOR[item.severity]}10`, whiteSpace: 'nowrap', alignSelf: 'center' }}>
                    {item.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
