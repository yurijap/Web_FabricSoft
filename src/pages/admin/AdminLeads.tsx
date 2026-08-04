import { useState, useEffect } from 'react';
import { useAuthApi } from '../../config/api';

type LeadStatus = 'Nuevo' | 'Aprobado' | 'WaitList' | 'Revisión' | 'Rechazado';

interface HistorialEntry {
  fecha: string;
  estado: string;
  autor: string;
}

interface Lead {
  _id: string;
  nombre: string;
  cargo: string;
  empresa: string;
  revenue: string;
  email: string;
  industria: string;
  iniciativa: string;
  plazo: string;
  source: string;
  score: number;
  status: LeadStatus;
  notas: string;
  historial: HistorialEntry[];
  queryChat?: string;
  createdAt: string;
}

const STATUS_COLOR: Record<LeadStatus, string> = {
  Nuevo:     '#C9A96E',
  Aprobado:  '#4ade80',
  WaitList:  '#60a5fa',
  Revisión:  '#fbbf24',
  Rechazado: '#B85450',
};

const FILTERS: Array<LeadStatus | 'Todos'> = ['Todos', 'Nuevo', 'Revisión', 'Aprobado', 'WaitList', 'Rechazado'];

const INDUSTRY_LABEL: Record<string, string> = {
  financiero: 'Financiero',
  inmobiliario: 'Inmobiliario',
  logistica: 'Logística',
};

type TabKey = 'aplicar' | 'waitlist' | 'rfp-template' | 'benchmark-index' | 'cloud-comparator';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'aplicar',           label: 'Aplicar' },
  { key: 'waitlist',          label: 'Waitlist' },
  { key: 'rfp-template',      label: 'RFP Template' },
  { key: 'benchmark-index',   label: 'Benchmark' },
  { key: 'cloud-comparator',  label: 'Cloud Comparator' },
];

// Columns shown per tab
const TAB_COLUMNS: Record<TabKey, string[]> = {
  'aplicar':          ['Fecha', 'Compañía', 'Cargo', 'Industria', 'Revenue', 'Plazo', 'Score', 'Estado', ''],
  'waitlist':         ['Fecha', 'Compañía', 'Cargo', 'Email', 'Estado', ''],
  'rfp-template':     ['Fecha', 'Compañía', 'Cargo', 'Email', 'Estado', ''],
  'benchmark-index':  ['Fecha', 'Compañía', 'Cargo', 'Email', 'Estado', ''],
  'cloud-comparator': ['Fecha', 'Compañía', 'Cargo', 'Email', 'Estado', ''],
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function LeadCell({ col, lead }: { col: string; lead: Lead }) {
  switch (col) {
    case 'Fecha':     return <td style={{ padding: '13px 16px', fontSize: 10, color: '#5A5A5A', whiteSpace: 'nowrap' }}>{fmt(lead.createdAt)}</td>;
    case 'Compañía':  return <td style={{ padding: '13px 16px', fontSize: 11, color: '#F5F5F5', fontWeight: 500 }}>{lead.empresa}</td>;
    case 'Cargo':     return <td style={{ padding: '13px 16px', fontSize: 10, color: '#8A8A8A' }}>{lead.cargo}</td>;
    case 'Email':     return <td style={{ padding: '13px 16px', fontSize: 10, color: '#5A5A5A' }}>{lead.email}</td>;
    case 'Industria': return <td style={{ padding: '13px 16px', fontSize: 10, color: '#8A8A8A' }}>{INDUSTRY_LABEL[lead.industria] ?? lead.industria}</td>;
    case 'Revenue':   return <td style={{ padding: '13px 16px', fontSize: 10, color: '#8A8A8A' }}>{lead.revenue}</td>;
    case 'Plazo':     return <td style={{ padding: '13px 16px', fontSize: 10, color: '#8A8A8A' }}>{lead.plazo}</td>;
    case 'Iniciativa':return <td style={{ padding: '13px 16px', fontSize: 10, color: '#5A5A5A', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.iniciativa}</td>;
    case 'Score':     return <td style={{ padding: '13px 16px' }}><span style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 17, fontStyle: 'italic', color: '#C9A96E' }}>{lead.score}</span></td>;
    case 'Estado':    return (
      <td style={{ padding: '13px 16px' }}>
        <span style={{ fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '4px 10px', border: `1px solid ${STATUS_COLOR[lead.status]}44`, color: STATUS_COLOR[lead.status], background: `${STATUS_COLOR[lead.status]}10` }}>
          {lead.status}
        </span>
      </td>
    );
    case '': return <td style={{ padding: '13px 16px', fontSize: 10, color: '#5A5A5A' }}>Abrir →</td>;
    default: return <td />;
  }
}

export default function AdminLeads() {
  const adminApi = useAuthApi();
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('aplicar');
  const [filter, setFilter]       = useState<LeadStatus | 'Todos'>('Todos');
  const [selected, setSelected]   = useState<Lead | null>(null);
  const [notasEdit, setNotasEdit] = useState('');
  const [updating, setUpdating]   = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await adminApi.get('/leads/admin');
      setLeads(res.data.data);
      setTotal(res.data.total);
    } catch {
      console.error('Error cargando leads');
    } finally {
      setLoading(false);
    }
  }

  function tabCount(key: TabKey) {
    return leads.filter(l => l.source === key).length;
  }

  const tabLeads = leads.filter(l => l.source === activeTab);
  const visible  = tabLeads.filter(l => filter === 'Todos' || l.status === filter);
  const columns  = TAB_COLUMNS[activeTab];

  const openDetail = (lead: Lead) => {
    setSelected(lead);
    setNotasEdit(lead.notas ?? '');
  };

  function switchTab(key: TabKey) {
    setActiveTab(key);
    setFilter('Todos');
  }

  async function handleStatusChange(id: string, status: LeadStatus) {
    setUpdating(id);
    try {
      const res = await adminApi.patch(`/leads/admin/${id}/status`, { status });
      const updated: Lead = res.data.data;
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
      const updated: Lead = res.data.data;
      setLeads(prev => prev.map(l => l._id === selected._id ? updated : l));
      setSelected(updated);
    } catch {
      console.error('Error guardando notas');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="fabric-admin-page">
      {/* Hero */}
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">FABRIC · ADMIN · LEADS</div>
            <h1 className="fabric-admin-title">Leads</h1>
            <div className="fabric-admin-subtitle">
              Prospectos calificados · scoring automático · pipeline de admisión
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="fabric-admin-pill">{total} en evaluación</span>
            <button
              onClick={fetchLeads}
              style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '9px 18px', background: 'transparent', border: '1px solid #252525', color: '#8A8A8A', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs por fuente */}
      <div style={{ padding: '0 36px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 0, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const count = tabCount(tab.key);
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              style={{
                padding: '16px 20px',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${active ? '#C9A96E' : 'transparent'}`,
                color: active ? '#C9A96E' : '#3A3A3A',
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'color .15s, border-color .15s',
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 8,
                padding: '2px 7px',
                background: active ? 'rgba(201,169,110,0.12)' : '#141414',
                border: `1px solid ${active ? '#C9A96E44' : '#1e1e1e'}`,
                color: active ? '#C9A96E' : '#3A3A3A',
                fontFamily: 'inherit',
                letterSpacing: '0.08em',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtros de estado dentro del tab */}
      <div style={{ padding: '10px 36px', display: 'flex', gap: 8, borderBottom: '1px solid #111', flexWrap: 'wrap', background: '#030303' }}>
        {FILTERS.map(f => {
          const count = f === 'Todos' ? tabLeads.length : tabLeads.filter(l => l.status === f).length;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '5px 12px',
              background: filter === f ? 'rgba(201,169,110,0.08)' : 'transparent',
              border: `1px solid ${filter === f ? '#C9A96E' : '#1e1e1e'}`,
              color: filter === f ? '#C9A96E' : '#3A3A3A',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {f} · {count}
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="fabric-admin-content" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Cargando...</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>
            {tabLeads.length === 0 ? 'Sin leads de esta fuente aún.' : 'Sin leads con este filtro.'}
          </div>
        ) : (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {columns.map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(lead => (
                <tr
                  key={lead._id}
                  style={{ borderBottom: '1px solid #111', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0F0F0F')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => openDetail(lead)}
                >
                  {columns.map(col => <LeadCell key={col} col={col} lead={lead} />)}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Panel de detalle */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', justifyContent: 'flex-end',
            background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, #050505 38%)',
          }}
          onClick={() => setSelected(null)}
        >
          <div className="admin-slide-panel" onClick={e => e.stopPropagation()}>

            {/* Cabecera */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
              <div>
                <div style={{ fontSize: 8, letterSpacing: '0.28em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 10 }}>
                  FABRIC · ADMIN · LEADS · DETALLE
                </div>
                <div style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 32, color: '#F5F5F5', lineHeight: 1.05 }}>{selected.empresa}</div>
                <div style={{ fontSize: 11, color: '#5A5A5A', marginTop: 8 }}>{selected.nombre} · {selected.cargo}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: 'none', border: '1px solid #1e1e1e', color: '#3A3A3A',
                  cursor: 'pointer', fontSize: 16, width: 36, height: 36,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontFamily: 'inherit',
                }}
              >×</button>
            </div>

            {/* Métricas superiores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', marginBottom: 40, border: '1px solid #141414' }}>
              <div style={{ padding: '24px 28px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 10 }}>Score FABRIC</div>
                <div style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 60, fontStyle: 'italic', color: '#C9A96E', lineHeight: 1 }}>{selected.score}</div>
              </div>
              <div style={{ background: '#141414' }} />
              <div style={{ padding: '24px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase' }}>Estado</div>
                <span style={{
                  fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '7px 18px',
                  border: `1px solid ${STATUS_COLOR[selected.status]}55`,
                  color: STATUS_COLOR[selected.status],
                  background: `${STATUS_COLOR[selected.status]}0D`,
                }}>{selected.status}</span>
              </div>
              <div style={{ background: '#141414' }} />
              <div style={{ padding: '24px 28px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase' }}>Fuente</div>
                <div style={{ fontSize: 11, color: '#C9A96E', letterSpacing: '0.1em' }}>{selected.source}</div>
                {selected.industria && <div style={{ fontSize: 9, color: '#3A3A3A' }}>{INDUSTRY_LABEL[selected.industria] ?? selected.industria}</div>}
              </div>
            </div>

            {/* Cuerpo en dos columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 48px' }}>

              {/* Columna izquierda — datos */}
              <div>
                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2A2A2A', textTransform: 'uppercase', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #111' }}>Datos del prospecto</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 32 }}>
                  {([
                    ['Email',  selected.email],
                    ['Plazo',  selected.plazo],
                    ['Revenue', selected.revenue],
                    ['Fecha',  fmt(selected.createdAt)],
                  ] as [string, string][]).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 11, color: '#C8C8C8', wordBreak: 'break-word' }}>{v}</div>
                    </div>
                  ))}
                </div>

                {selected.iniciativa && (
                  <div style={{ marginBottom: 32 }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 8 }}>Iniciativa</div>
                    <div style={{ fontSize: 11, color: '#8A8A8A', lineHeight: 1.7 }}>{selected.iniciativa}</div>
                  </div>
                )}

                {selected.queryChat && (
                  <div style={{ padding: '16px 18px', borderLeft: '2px solid #C9A96E22', background: '#080808', marginBottom: 32 }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 8 }}>Consulta vía chat IA</div>
                    <div style={{ fontSize: 10, color: '#5A5A5A', fontStyle: 'italic', lineHeight: 1.7 }}>"{selected.queryChat}"</div>
                  </div>
                )}

                {/* Historial */}
                {selected.historial.length > 0 && (
                  <div>
                    <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2A2A2A', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #111' }}>Historial</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[...selected.historial].reverse().map((h, i) => (
                        <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #0a0a0a' }}>
                          <span style={{ fontSize: 9, color: '#2A2A2A', minWidth: 76, flexShrink: 0 }}>{h.fecha}</span>
                          <span style={{
                            fontSize: 8, padding: '2px 9px',
                            border: `1px solid ${STATUS_COLOR[h.estado as LeadStatus] ?? '#5A5A5A'}33`,
                            color: STATUS_COLOR[h.estado as LeadStatus] ?? '#5A5A5A',
                          }}>{h.estado}</span>
                          <span style={{ fontSize: 8, color: '#3A3A3A' }}>{h.autor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Columna derecha — acciones */}
              <div>
                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2A2A2A', textTransform: 'uppercase', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #111' }}>Pipeline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40 }}>
                  {(['Aprobado', 'WaitList', 'Revisión'] as LeadStatus[])
                    .filter(s => s !== selected.status)
                    .map(s => (
                      <button
                        key={s}
                        disabled={updating === selected._id}
                        onClick={() => handleStatusChange(selected._id, s)}
                        style={{
                          padding: '14px 18px', background: `${STATUS_COLOR[s]}0A`,
                          border: `1px solid ${STATUS_COLOR[s]}33`,
                          color: STATUS_COLOR[s],
                          fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          transition: 'background .15s',
                        }}
                      >
                        → Mover a {s}
                      </button>
                    ))}
                  {selected.status !== 'Rechazado' && (
                    <button
                      disabled={updating === selected._id}
                      onClick={() => handleStatusChange(selected._id, 'Rechazado')}
                      style={{
                        padding: '14px 18px', background: 'transparent',
                        border: '1px solid #B8545033', color: '#B85450',
                        fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      }}
                    >
                      → Rechazar lead
                    </button>
                  )}
                </div>

                <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#2A2A2A', textTransform: 'uppercase', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #111' }}>Notas internas</div>
                <textarea
                  value={notasEdit}
                  onChange={e => setNotasEdit(e.target.value)}
                  rows={7}
                  placeholder="Observaciones internas sobre este prospecto..."
                  style={{
                    width: '100%', background: '#080808', border: '1px solid #141414',
                    color: '#C8C8C8', fontFamily: 'inherit', fontSize: 11,
                    padding: '14px 16px', outline: 'none', resize: 'vertical',
                    boxSizing: 'border-box', lineHeight: 1.7,
                  }}
                />
                <button
                  onClick={handleSaveNotas}
                  disabled={updating === selected._id}
                  style={{
                    marginTop: 10, padding: '11px 22px',
                    background: 'rgba(201,169,110,0.06)',
                    border: '1px solid #C9A96E33', color: '#C9A96E',
                    fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase',
                    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
                  }}
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
