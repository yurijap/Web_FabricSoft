import { useEffect, useRef, useState } from 'react';
import { useAuthApi } from '../../config/api';

type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO';
type LeadStatus = 'Nuevo' | 'Aprobado' | 'WaitList' | 'Revisión' | 'Rechazado';

interface MigrationRoadmapLead {
  _id: string;
  nombre: string;
  cargo: string;
  empresa: string;
  email: string;
  score: number;
  status: LeadStatus;
  notas: string;
  createdAt: string;
  historial: { fecha: string; estado: string; autor: string }[];
  migrationRoadmap: {
    sistema: string;
    modulos: string[];
    industria: string;
    geografia: string;
    plazo: string;
    compliance: string;
    patrocinio: string;
    presupuesto: string;
    integraciones: string;
    datos: string;
    equipo: string;
    experiencia: string;
    riskLevel: RiskLevel;
    estimatedTimeline: string;
  };
}

const RISK_COLOR: Record<string, string> = {
  BAJO:  '#7B9E6B',
  MEDIO: '#C9A96E',
  ALTO:  '#B85450',
};

const STATUS_COLOR: Record<LeadStatus, string> = {
  Nuevo:     '#C9A96E',
  Aprobado:  '#4ade80',
  WaitList:  '#60a5fa',
  Revisión:  '#fbbf24',
  Rechazado: '#B85450',
};

const VALID_STATUSES: LeadStatus[] = ['Aprobado', 'WaitList', 'Revisión', 'Rechazado'];

const PREGUNTAS_LABELS: Record<string, string> = {
  sistema:       'Sistema de origen',
  industria:     'Industria',
  geografia:     'Geografía de operación',
  plazo:         'Plazo de inicio',
  compliance:    'Compliance / Regulación',
  patrocinio:    'Patrocinio ejecutivo',
  presupuesto:   'Presupuesto',
  integraciones: 'Integraciones ERP',
  datos:         'Calidad de datos',
  equipo:        'Equipo interno',
  experiencia:   'Experiencia previa ERP',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminMigrationRoadmap() {
  const adminApi = useAuthApi();
  const [leads, setLeads]         = useState<MigrationRoadmapLead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<MigrationRoadmapLead | null>(null);
  const [notasEdit, setNotasEdit] = useState('');
  const [updating, setUpdating]   = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'Todos'>('Todos');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchLeads(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selected && panelRef.current) panelRef.current.scrollTop = 0;
  }, [selected?._id]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await adminApi.get('/leads/admin?source=migration-roadmap&limit=200');
      setLeads(res.data.data ?? []);
    } catch {
      console.error('Error cargando migration roadmaps');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: LeadStatus) {
    setUpdating(id);
    try {
      const res = await adminApi.patch(`/leads/admin/${id}/status`, { status });
      const updated: MigrationRoadmapLead = res.data.data;
      setLeads(prev => prev.map(l => l._id === id ? updated : l));
      if (selected?._id === id) setSelected(updated);
    } catch {
      console.error('Error actualizando status');
    } finally {
      setUpdating(null);
    }
  }

  async function handleSaveNotas() {
    if (!selected) return;
    setUpdating(selected._id);
    try {
      const res = await adminApi.patch(`/leads/admin/${selected._id}/notas`, { notas: notasEdit });
      const updated: MigrationRoadmapLead = res.data.data;
      setLeads(prev => prev.map(l => l._id === selected._id ? updated : l));
      setSelected(updated);
    } catch {
      console.error('Error guardando notas');
    } finally {
      setUpdating(null);
    }
  }

  const visible = leads.filter(l => {
    if (riskFilter === 'Todos') return true;
    return l.migrationRoadmap?.riskLevel === riskFilter;
  });

  const counts = {
    BAJO:  leads.filter(l => l.migrationRoadmap?.riskLevel === 'BAJO').length,
    MEDIO: leads.filter(l => l.migrationRoadmap?.riskLevel === 'MEDIO').length,
    ALTO:  leads.filter(l => l.migrationRoadmap?.riskLevel === 'ALTO').length,
  };

  return (
    <div className="fabric-admin-page">
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">FABRIC · ADMIN · MIGRATION ROADMAP</div>
            <h1 className="fabric-admin-title">Migration Roadmap</h1>
            <div className="fabric-admin-subtitle">
              Leads calificados con diagnóstico de riesgo y roadmap 30-60-90-180 días
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="fabric-admin-pill">{leads.length} evaluaciones</span>
            <button
              onClick={fetchLeads}
              style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '9px 18px', background: 'transparent', border: '1px solid #252525', color: '#8A8A8A', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="amr-metrics-strip">
        {(['BAJO', 'MEDIO', 'ALTO'] as RiskLevel[]).map(level => (
          <div key={level} className="amr-metric-cell">
            <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 8 }}>Riesgo {level}</div>
            <div style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 40, fontStyle: 'italic', color: RISK_COLOR[level], lineHeight: 1 }}>{counts[level]}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="amr-filters">
        {(['Todos', 'BAJO', 'MEDIO', 'ALTO'] as const).map(f => (
          <button key={f} onClick={() => setRiskFilter(f)} style={{
            fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '6px 14px',
            background: riskFilter === f ? `${f === 'Todos' ? '#C9A96E' : RISK_COLOR[f]}15` : 'transparent',
            border: `1px solid ${riskFilter === f ? (f === 'Todos' ? '#C9A96E' : RISK_COLOR[f]) : '#252525'}`,
            color: riskFilter === f ? (f === 'Todos' ? '#C9A96E' : RISK_COLOR[f]) : '#5A5A5A',
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          }}>
            {f === 'Todos' ? `Todos · ${leads.length}` : `${f} · ${counts[f]}`}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="fabric-admin-content">
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Cargando...</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Sin evaluaciones con este filtro.</div>
        ) : (
          <>
          <div className="amr-table-wrap">
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Fecha', 'Empresa', 'Cargo', 'Sistema → Fusion', 'Geografía', 'Riesgo', 'Plazo estimado', 'Estado', ''].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(lead => {
                const rm = lead.migrationRoadmap ?? {};
                return (
                  <tr
                    key={lead._id}
                    style={{ borderBottom: '1px solid #111', cursor: 'pointer', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#0F0F0F')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => { setSelected(lead); setNotasEdit(lead.notas ?? ''); }}
                  >
                    <td style={{ padding: '13px 16px', fontSize: 10, color: '#5A5A5A', whiteSpace: 'nowrap' }}>{fmt(lead.createdAt)}</td>
                    <td style={{ padding: '13px 16px', fontSize: 11, color: '#F5F5F5', fontWeight: 500 }}>{lead.empresa}</td>
                    <td style={{ padding: '13px 16px', fontSize: 10, color: '#8A8A8A' }}>{lead.cargo}</td>
                    <td style={{ padding: '13px 16px', fontSize: 10, color: '#8A8A8A' }}>{rm.sistema || '—'}</td>
                    <td style={{ padding: '13px 16px', fontSize: 10, color: '#5A5A5A' }}>{rm.geografia || '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      {rm.riskLevel ? (
                        <span style={{
                          fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', padding: '4px 10px',
                          border: `1px solid ${RISK_COLOR[rm.riskLevel]}44`,
                          color: RISK_COLOR[rm.riskLevel],
                          background: `${RISK_COLOR[rm.riskLevel]}10`,
                          fontFamily: 'inherit',
                        }}>{rm.riskLevel}</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 10, color: '#8A8A8A' }}>{rm.estimatedTimeline || '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <span style={{
                        fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '4px 10px',
                        border: `1px solid ${STATUS_COLOR[lead.status]}44`,
                        color: STATUS_COLOR[lead.status],
                        background: `${STATUS_COLOR[lead.status]}10`,
                      }}>{lead.status}</span>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 10, color: '#5A5A5A' }}>Abrir →</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          {/* Tarjetas (Mobile) */}
          <div className="amr-cards">
            {visible.map(lead => {
              const rm = lead.migrationRoadmap ?? {};
              const riskColor = RISK_COLOR[rm.riskLevel] ?? '#5A5A5A';
              return (
                <div
                  key={lead._id}
                  className="amr-card"
                  onClick={() => { setSelected(lead); setNotasEdit(lead.notas ?? ''); }}
                >
                  <div className="amr-card-header">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span className="amr-card-date">{fmt(lead.createdAt)}</span>
                      <h3 className="amr-card-empresa">{lead.empresa}</h3>
                      <p className="amr-card-cargo">{lead.nombre} · {lead.cargo}</p>
                    </div>
                    <div className="amr-card-risk">
                      {rm.riskLevel && (
                        <span style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${riskColor}44`, color: riskColor, background: `${riskColor}10` }}>
                          {rm.riskLevel}
                        </span>
                      )}
                      <span style={{ fontSize: 9, color: '#3A3A3A', fontFamily: 'var(--mono, monospace)' }}>{rm.estimatedTimeline || '—'}</span>
                    </div>
                  </div>

                  <div className="amr-card-body">
                    <div className="amr-card-meta">
                      <span className="meta-label">Sistema:</span>
                      <span className="meta-val">{rm.sistema || '—'}</span>
                    </div>
                    <div className="amr-card-meta">
                      <span className="meta-label">Geografía:</span>
                      <span className="meta-val">{rm.geografia || '—'}</span>
                    </div>
                    <div className="amr-card-meta">
                      <span className="meta-label">Email:</span>
                      <span className="meta-val">{lead.email}</span>
                    </div>
                  </div>

                  <div className="amr-card-footer">
                    <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '4px 10px', border: `1px solid ${STATUS_COLOR[lead.status]}44`, color: STATUS_COLOR[lead.status], background: `${STATUS_COLOR[lead.status]}10` }}>
                      {lead.status}
                    </span>
                    <span style={{ fontSize: 9, color: '#C9A96E', fontFamily: 'var(--mono, "JetBrains Mono", monospace)' }}>Detalle →</span>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>

      {/* Panel de detalle */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end', background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, #050505 38%)' }}
          onClick={() => setSelected(null)}
        >
          <div ref={panelRef} className="admin-slide-panel" onClick={e => e.stopPropagation()}>
            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 36 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 8, letterSpacing: '0.18em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 10, overflowWrap: 'break-word' }}>
                  FABRIC · ADMIN · MIGRATION ROADMAP · DETALLE
                </div>
                <div style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 'clamp(22px, 5vw, 32px)', color: '#F5F5F5', lineHeight: 1.05, wordBreak: 'break-word' }}>{selected.empresa}</div>
                <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 8, wordBreak: 'break-word' }}>{selected.nombre} · {selected.cargo}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: '1px solid #1e1e1e', color: '#3A3A3A', cursor: 'pointer', fontSize: 16, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'inherit' }}
              >×</button>
            </div>

            {/* Métricas superiores */}
            <div className="amr-detail-metrics">
              <div style={{ padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 8 }}>Nivel de riesgo</div>
                <div style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 32, fontStyle: 'italic', color: RISK_COLOR[selected.migrationRoadmap?.riskLevel] ?? '#C9A96E', lineHeight: 1 }}>
                  {selected.migrationRoadmap?.riskLevel ?? '—'}
                </div>
              </div>
              <div className="amr-detail-divider" />
              <div style={{ padding: '20px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 8 }}>Plazo estimado</div>
                <div style={{ fontSize: 13, color: '#C9A96E', lineHeight: 1.4 }}>{selected.migrationRoadmap?.estimatedTimeline ?? '—'}</div>
              </div>
              <div className="amr-detail-divider" />
              <div style={{ padding: '20px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase' }}>Estado</div>
                <span style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '5px 14px', border: `1px solid ${STATUS_COLOR[selected.status]}55`, color: STATUS_COLOR[selected.status], background: `${STATUS_COLOR[selected.status]}0D` }}>
                  {selected.status}
                </span>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="amr-detail-body">

              {/* Izquierda — datos del roadmap */}
              <div>
                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2A2A2A', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #111' }}>
                  Diagnóstico del proyecto
                </div>

                {/* Sistema + módulos */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 6 }}>Sistema → Fusion</div>
                  <div style={{ fontSize: 13, color: '#F5F5F5' }}>{selected.migrationRoadmap?.sistema || '—'}</div>
                </div>
                {selected.migrationRoadmap?.modulos?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 8 }}>Módulos críticos</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selected.migrationRoadmap.modulos.map(m => (
                        <span key={m} style={{ fontSize: 9, padding: '4px 10px', border: '1px solid #252525', color: '#8A8A8A', background: '#0F0F0F' }}>{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preguntas clave */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                  {(Object.entries(PREGUNTAS_LABELS) as [string, string][]).map(([key, label]) => {
                    const val = selected.migrationRoadmap?.[key as keyof typeof selected.migrationRoadmap];
                    if (!val || key === 'sistema') return null;
                    return (
                      <div key={key}>
                        <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 11, color: '#8A8A8A', lineHeight: 1.6 }}>{String(val)}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Contacto */}
                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2A2A2A', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #111' }}>
                  Contacto
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {([['Email', selected.email], ['Fecha', fmt(selected.createdAt)]] as [string, string][]).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 11, color: '#C8C8C8', wordBreak: 'break-word' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Historial */}
                {selected.historial?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2A2A2A', textTransform: 'uppercase', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #111' }}>Historial</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[...selected.historial].reverse().map((h, i) => (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #0a0a0a' }}>
                          <span style={{ fontSize: 9, color: '#2A2A2A', minWidth: 76, flexShrink: 0 }}>{h.fecha}</span>
                          <span style={{ fontSize: 8, padding: '2px 8px', border: `1px solid ${STATUS_COLOR[h.estado as LeadStatus] ?? '#5A5A5A'}33`, color: STATUS_COLOR[h.estado as LeadStatus] ?? '#5A5A5A' }}>{h.estado}</span>
                          <span style={{ fontSize: 8, color: '#3A3A3A' }}>{h.autor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Derecha — pipeline + notas */}
              <div>
                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2A2A2A', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #111' }}>Pipeline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
                  {VALID_STATUSES.filter(s => s !== selected.status).map(s => (
                    <button
                      key={s}
                      disabled={updating === selected._id}
                      onClick={() => handleStatusChange(selected._id, s)}
                      style={{ padding: '13px 16px', background: `${STATUS_COLOR[s]}0A`, border: `1px solid ${STATUS_COLOR[s]}33`, color: STATUS_COLOR[s], fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                    >
                      → Mover a {s}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2A2A2A', textTransform: 'uppercase', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #111' }}>Notas internas</div>
                <textarea
                  value={notasEdit}
                  onChange={e => setNotasEdit(e.target.value)}
                  rows={8}
                  placeholder="Observaciones sobre este proyecto de migración..."
                  style={{ width: '100%', background: '#080808', border: '1px solid #141414', color: '#C8C8C8', fontFamily: 'inherit', fontSize: 11, padding: '12px 14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7 }}
                />
                <button
                  onClick={handleSaveNotas}
                  disabled={updating === selected._id}
                  style={{ marginTop: 10, padding: '11px 22px', background: 'rgba(201,169,110,0.06)', border: '1px solid #C9A96E33', color: '#C9A96E', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
                >
                  Guardar notas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
