import { useState, useEffect } from 'react';
import { useAuthApi } from '../../config/api';

type OciStatus = 'Nuevo' | 'Contactado' | 'Acceso Coordinado' | 'Reporte Enviado' | 'Descartado';

interface HistorialEntry {
  fecha: string;
  estado: string;
  autor: string;
}

interface OciAudit {
  _id: string;
  empresa: string;
  cargo: string;
  email: string;
  gastoOci: string;
  ndaAceptado: boolean;
  score: number;
  status: OciStatus;
  notas: string;
  historial: HistorialEntry[];
  tracking?: { sourceSection?: string; interactionType?: string; pagePath?: string };
  createdAt: string;
}

interface Stats {
  total: number;
  porStatus: Partial<Record<OciStatus, number>>;
  scoreAlto: number;
}

const STATUS_COLOR: Record<OciStatus, string> = {
  'Nuevo':             '#C9A96E',
  'Contactado':        '#60a5fa',
  'Acceso Coordinado': '#a78bfa',
  'Reporte Enviado':   '#4ade80',
  'Descartado':        '#B85450',
};

const PIPELINE: OciStatus[] = ['Nuevo', 'Contactado', 'Acceso Coordinado', 'Reporte Enviado', 'Descartado'];
const FILTROS: Array<OciStatus | 'Todos'> = ['Todos', ...PIPELINE];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? '#4ade80' : score >= 45 ? '#C9A96E' : '#fbbf24';
  return (
    <span style={{
      fontFamily: 'var(--mono, monospace)',
      fontSize: 9,
      fontWeight: 700,
      color,
      letterSpacing: '0.12em',
      border: `1px solid ${color}40`,
      padding: '2px 7px',
    }}>
      {score}
    </span>
  );
}

export default function AdminOciAudit() {
  const adminApi = useAuthApi();

  const [solicitudes, setSolicitudes] = useState<OciAudit[]>([]);
  const [stats, setStats]             = useState<Stats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [filtro, setFiltro]           = useState<OciStatus | 'Todos'>('Todos');
  const [selected, setSelected]       = useState<OciAudit | null>(null);
  const [saving, setSaving]           = useState(false);
  const [savedId, setSavedId]         = useState<string | null>(null);
  const [notaEdit, setNotaEdit]       = useState('');
  const [savingNota, setSavingNota]   = useState(false);

  const fetchData = () => {
    setLoading(true);
    const params = filtro !== 'Todos' ? `?status=${encodeURIComponent(filtro)}` : '';
    Promise.all([
      adminApi.get(`/oci-audit${params}`),
      adminApi.get('/oci-audit/stats'),
    ])
      .then(([res, statsRes]) => {
        setSolicitudes(res.data.data ?? []);
        setStats(statsRes.data.data ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filtro]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatus = async (id: string, status: OciStatus) => {
    setSaving(true);
    try {
      const res = await adminApi.patch(`/oci-audit/${id}/status`, { status, autor: 'Admin' });
      const updated = res.data.data as OciAudit;
      setSolicitudes(prev => prev.map(s => s._id === id ? { ...s, ...updated } : s));
      setSelected(prev => prev?._id === id ? { ...prev, ...updated } : prev);
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleGuardarNota = async () => {
    if (!selected) return;
    setSavingNota(true);
    try {
      await adminApi.patch(`/oci-audit/${selected._id}/notas`, { notas: notaEdit });
      setSolicitudes(prev => prev.map(s => s._id === selected._id ? { ...s, notas: notaEdit } : s));
      setSelected(prev => prev ? { ...prev, notas: notaEdit } : prev);
    } catch { /* ignore */ }
    finally { setSavingNota(false); }
  };

  const abrirDetalle = (s: OciAudit) => {
    setSelected(s);
    setNotaEdit(s.notas || '');
  };

  const totalSolicitudes = stats?.total ?? solicitudes.length;
  const scoreAlto = stats?.scoreAlto ?? 0;

  return (
    <div className="fabric-admin-page">

      {/* Hero */}
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">FABRIC · ADMIN · OCI COST AUDIT</div>
            <h1 className="fabric-admin-title">Diagnósticos OCI</h1>
            <div className="fabric-admin-subtitle">
              Solicitudes de auditoría OCI · pipeline de contacto y entrega de reporte
            </div>
          </div>
          <span className="fabric-admin-pill">
            {totalSolicitudes} total · {scoreAlto} score alto
          </span>
        </div>
      </div>

      {/* Stats rápidas */}
      {stats && (
        <div style={{ padding: '16px 36px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {PIPELINE.map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[s], flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 9, letterSpacing: '0.14em', color: '#5A5A5A', textTransform: 'uppercase' }}>
                {s}
              </span>
              <span style={{ fontSize: 11, color: '#F5F5F5', fontWeight: 600 }}>
                {stats.porStatus[s] ?? 0}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="admin-oci-filters">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              padding: '5px 14px',
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontFamily: 'inherit',
              cursor: 'pointer',
              border: filtro === f ? '1px solid #C9A96E' : '1px solid #2a2a2a',
              background: filtro === f ? 'rgba(201,169,110,0.1)' : 'transparent',
              color: filtro === f ? '#C9A96E' : '#5A5A5A',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tabla e Tarjetas */}
      <div className="fabric-admin-content admin-oci-content-container">
        {loading ? (
          <div style={{ fontSize: 9, color: '#5A5A5A', letterSpacing: '0.16em', padding: '40px 0' }}>
            Cargando solicitudes...
          </div>
        ) : solicitudes.length === 0 ? (
          <div style={{ fontSize: 11, color: '#5A5A5A', padding: '40px 0' }}>
            Sin solicitudes registradas.
          </div>
        ) : (
          <>
            {/* Tabla (Desktop/Tablet grande) */}
            <div className="admin-oci-table-wrap">
              <div className="admin-oci-table-grid">
                {/* Cabecera */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 160px 180px 80px 120px 80px',
                  gap: '0 16px',
                  padding: '8px 16px',
                  borderBottom: '1px solid #1a1a1a',
                  fontSize: 8,
                  letterSpacing: '0.18em',
                  color: '#3A3A3A',
                  textTransform: 'uppercase',
                }}>
                  <span>Empresa · Cargo</span>
                  <span>Email</span>
                  <span>Gasto OCI</span>
                  <span>Score</span>
                  <span>Estado</span>
                  <span>Fecha</span>
                </div>

                {solicitudes.map(s => (
                  <div
                    key={s._id}
                    onClick={() => abrirDetalle(s)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 160px 180px 80px 120px 80px',
                      gap: '0 16px',
                      padding: '14px 16px',
                      borderBottom: '1px solid #141414',
                      cursor: 'pointer',
                      background: selected?._id === s._id ? 'rgba(201,169,110,0.05)' : savedId === s._id ? 'rgba(74,222,128,0.04)' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: '#F5F5F5', lineHeight: 1.3 }}>{s.empresa}</div>
                      <div style={{ fontSize: 9, color: '#5A5A5A', letterSpacing: '0.1em', marginTop: 3 }}>{s.cargo}</div>
                    </div>
                    <div style={{ fontSize: 10, color: '#8A8A8A', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.email}
                    </div>
                    <div style={{ fontSize: 10, color: '#8A8A8A', alignSelf: 'center' }}>
                      {s.gastoOci}
                    </div>
                    <div style={{ alignSelf: 'center' }}>
                      <ScoreBadge score={s.score} />
                    </div>
                    <div style={{ alignSelf: 'center' }}>
                      <span style={{
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: STATUS_COLOR[s.status],
                      }}>
                        {s.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: '#3A3A3A', alignSelf: 'center' }}>
                      {fmt(s.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tarjetas (Móvil/Tablet pequeña) */}
            <div className="admin-oci-cards">
              {solicitudes.map(s => (
                <div
                  key={s._id}
                  className="admin-oci-card"
                  onClick={() => abrirDetalle(s)}
                >
                  <div className="admin-oci-card-header">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span className="admin-oci-card-date">{fmt(s.createdAt)}</span>
                      <h3 className="admin-oci-card-empresa">{s.empresa}</h3>
                      <p className="admin-oci-card-nombre">{s.cargo}</p>
                    </div>
                    <div className="admin-oci-card-score">
                      <span className="score-label">SCORE</span>
                      <ScoreBadge score={s.score} />
                    </div>
                  </div>

                  <div className="admin-oci-card-body">
                    <div className="admin-oci-card-meta">
                      <span className="meta-label">Email:</span>
                      <span className="meta-val" style={{ wordBreak: 'break-all' }}>{s.email}</span>
                    </div>
                    <div className="admin-oci-card-meta">
                      <span className="meta-label">Gasto OCI:</span>
                      <span className="meta-val">{s.gastoOci}</span>
                    </div>
                    <div className="admin-oci-card-meta">
                      <span className="meta-label">NDA Aceptado:</span>
                      <span className="meta-val">{s.ndaAceptado ? 'Sí' : 'No'}</span>
                    </div>
                  </div>

                  <div className="admin-lead-card-footer" style={{ borderTop: '1px solid #111', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 8,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: STATUS_COLOR[s.status],
                      border: `1px solid ${STATUS_COLOR[s.status]}44`,
                      padding: '4px 10px',
                      background: `${STATUS_COLOR[s.status]}10`,
                    }}>
                      {s.status}
                    </span>
                    <span style={{ fontSize: 9, color: '#C9A96E', fontFamily: 'var(--mono, "JetBrains Mono", monospace)' }}>Detalle →</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Panel lateral de detalle */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
          onClick={() => setSelected(null)}
        >
          <div className="admin-detail-panel" onClick={e => e.stopPropagation()}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#5A5A5A', textTransform: 'uppercase' }}>
                OCI Audit · {fmt(selected.createdAt)}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#5A5A5A', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>

            <div style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 20, color: '#F5F5F5', marginBottom: 4 }}>
              {selected.empresa}
            </div>
            <div style={{ fontSize: 11, color: '#8A8A8A', marginBottom: 4 }}>{selected.cargo}</div>
            <div style={{ fontSize: 10, color: '#5A5A5A', marginBottom: 20 }}>{selected.email}</div>

            {/* Datos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {([
                ['Gasto OCI estimado', selected.gastoOci],
                ['Score',             String(selected.score)],
                ['Estado actual',     selected.status],
                ['NDA aceptado',      selected.ndaAceptado ? 'Sí' : 'No'],
                ['Origen',            [selected.tracking?.sourceSection, selected.tracking?.interactionType].filter(Boolean).join(' · ') || 'Sin tracking'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: 10 }}>
                  <span style={{ fontSize: 9, color: '#5A5A5A', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{k}</span>
                  <span style={{
                    fontSize: 11,
                    color: k === 'Estado actual' ? STATUS_COLOR[selected.status as OciStatus]
                         : k === 'Score' ? (selected.score >= 70 ? '#4ade80' : selected.score >= 45 ? '#C9A96E' : '#fbbf24')
                         : '#F5F5F5',
                    fontWeight: k === 'Score' ? 700 : 400,
                  }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Pipeline de estados */}
            <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 12 }}>
              Mover a estado
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {PIPELINE.filter(s => s !== selected.status).map(s => (
                <button
                  key={s}
                  onClick={() => handleStatus(selected._id, s)}
                  disabled={saving}
                  style={{
                    padding: '10px 14px',
                    background: s === 'Descartado' ? 'transparent' : s === 'Reporte Enviado' ? 'rgba(74,222,128,0.08)' : 'rgba(201,169,110,0.06)',
                    border: `1px solid ${STATUS_COLOR[s]}40`,
                    color: STATUS_COLOR[s],
                    fontSize: 9,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    cursor: saving ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: saving ? 0.6 : 1,
                    textAlign: 'left',
                  }}
                >
                  {saving ? 'Guardando...' : `→ ${s}`}
                </button>
              ))}
            </div>

            {/* Notas internas */}
            <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 8 }}>
              Notas internas
            </div>
            <textarea
              value={notaEdit}
              onChange={e => setNotaEdit(e.target.value)}
              rows={4}
              placeholder="Contexto de la llamada, acceso coordinado, estado del reporte..."
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0A0A0A',
                border: '1px solid #2a2a2a',
                color: '#F5F5F5',
                fontFamily: 'var(--mono, monospace)',
                fontSize: 11,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                marginBottom: 8,
              }}
            />
            <button
              onClick={handleGuardarNota}
              disabled={savingNota}
              style={{
                padding: '10px 16px',
                background: 'transparent',
                border: '1px solid #C9A96E',
                color: '#C9A96E',
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: savingNota ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                opacity: savingNota ? 0.6 : 1,
                width: '100%',
              }}
            >
              {savingNota ? 'Guardando...' : 'Guardar nota'}
            </button>

            {/* Historial */}
            {selected.historial?.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 12 }}>
                  Historial
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...selected.historial].reverse().map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#3A3A3A', letterSpacing: '0.1em' }}>
                      <span>{h.estado} · {h.autor}</span>
                      <span>{h.fecha}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
