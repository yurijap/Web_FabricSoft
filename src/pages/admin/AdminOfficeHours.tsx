import { useState, useEffect } from 'react';
import { useAuthApi } from '../../config/api';

interface Booking {
  _id: string;
  nombre: string;
  cargo?: string;
  empresa: string;
  email: string;
  revenue?: string;
  iniciativaOracle?: string;
  plazo?: string;
  dia: string;
  slot: string;
  status: 'pendiente' | 'confirmado' | 'cancelado';
  emailEnviado?: boolean;
  calendarEnviado?: boolean;
  calendarEventId?: string;
  notas?: string;
  tracking?: { sourceSection?: string; interactionType?: string; pagePath?: string };
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  pendiente:  '#C9A96E',
  confirmado: '#4ade80',
  cancelado:  '#B85450',
};

export default function AdminOfficeHours() {
  const adminApi = useAuthApi();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [saving, setSaving]     = useState(false);
  const [savedId, setSavedId]   = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    adminApi.get('/office-hours/admin')
      .then(res => setBookings(res.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []); // eslint-disable-line

  const handleStatus = async (id: string, status: Booking['status']) => {
    setSaving(true);
    try {
      const res = await adminApi.patch(`/office-hours/admin/${id}/status`, { status });
      const updated = res.data.data as Booking;
      setBookings(prev => prev.map(b => b._id === id ? { ...b, ...updated } : b));
      setSelected(prev => prev?._id === id ? { ...prev, ...updated } : prev);
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
      if (status === 'confirmado') {
        setTimeout(async () => {
          try {
            const r = await adminApi.get('/office-hours/admin');
            const next = (r.data.data ?? []) as Booking[];
            setBookings(next);
            setSelected(prev => prev ? next.find(b => b._id === prev._id) ?? prev : prev);
          } catch { /* ignore */ }
        }, 2500);
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleRetry = async (id: string, type: 'email' | 'calendar') => {
    setSaving(true);
    try {
      const endpoint = type === 'email' ? 'retry-email' : 'retry-calendar';
      const res = await adminApi.post(`/office-hours/admin/${id}/${endpoint}`);
      const updated = res.data.data as Booking;
      setBookings(prev => prev.map(b => b._id === id ? { ...b, ...updated } : b));
      setSelected(prev => prev?._id === id ? { ...prev, ...updated } : prev);
      setSavedId(id); setTimeout(() => setSavedId(null), 2000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const fmtDate = (iso: string) =>
    new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' }).toUpperCase();

  const fmtCreated = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });

  const pendiente  = bookings.filter(b => b.status === 'pendiente').length;
  const confirmado = bookings.filter(b => b.status === 'confirmado').length;
  const cancelado  = bookings.filter(b => b.status === 'cancelado').length;

  // Agrupar por mes
  const grouped: Record<string, Booking[]> = {};
  bookings.forEach(b => {
    const key = b.dia ? b.dia.slice(0, 7) : 'sin-fecha';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });
  const groupKeys = Object.keys(grouped).sort().reverse();

  const monthLabel = (key: string) => {
    if (key === 'sin-fecha') return 'Sin fecha asignada';
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  return (
    <div className="fabric-admin-page">
      {/* Hero */}
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">FABRIC · ADMIN · OFFICE HOURS</div>
            <h1 className="fabric-admin-title">Office Hours</h1>
            <div className="fabric-admin-subtitle">Sesiones 30 min · Prospectos calificados · Seguimiento por email y calendar</div>
          </div>
          <div className="aoh-hero-stats">
            {[
              { label: 'Pendiente',  val: pendiente,  color: '#C9A96E' },
              { label: 'Confirmado', val: confirmado, color: '#4ade80' },
              { label: 'Cancelado',  val: cancelado,  color: '#B85450' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif, Georgia)', fontSize: 28, color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#5A5A5A', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Banda info */}
      <div className="aoh-info-band">
        <span style={{ width: 5, height: 5, background: '#C9A96E', borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontSize: 9, letterSpacing: '0.14em', color: '#C9A96E', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
          Sesiones 30 min · Solo prospectos calificados · Correo corporativo obligatorio
        </span>
      </div>

      {/* Listado */}
      <div className="fabric-admin-content">
        {loading ? (
          <div style={{ fontSize: 9, color: '#5A5A5A', letterSpacing: '0.16em', padding: '40px 0' }}>Cargando reservas...</div>
        ) : bookings.length === 0 ? (
          <div style={{ fontSize: 11, color: '#5A5A5A', padding: '60px 0', textAlign: 'center' }}>Sin reservas registradas todavía.</div>
        ) : (
          groupKeys.map(key => (
            <div key={key} style={{ marginBottom: 32 }}>
              {/* Encabezado de mes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#C9A96E', letterSpacing: '0.2em' }}>{monthLabel(key)}</span>
                <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#3A3A3A', letterSpacing: '0.12em' }}>{grouped[key].length} sesión{grouped[key].length !== 1 ? 'es' : ''}</span>
              </div>

              {/* Filas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {grouped[key].map(b => (
                  <div
                    key={b._id}
                    onClick={() => setSelected(b)}
                    className="aoh-row"
                    style={{
                      background: selected?._id === b._id ? 'rgba(201,169,110,0.06)' : '#0D0D0D',
                      border: `1px solid ${savedId === b._id ? '#4ade8030' : selected?._id === b._id ? '#C9A96E40' : '#1a1a1a'}`,
                    }}
                    onMouseEnter={e => { if (selected?._id !== b._id) (e.currentTarget as HTMLElement).style.background = '#111'; }}
                    onMouseLeave={e => { if (selected?._id !== b._id) (e.currentTarget as HTMLElement).style.background = '#0D0D0D'; }}
                  >
                    {/* Columna fecha/hora */}
                    <div className="aoh-row-time">
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#5A5A5A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                        {b.dia ? fmtDate(b.dia) : 'Sin fecha'}
                      </div>
                      <div style={{ fontFamily: 'var(--serif, Georgia)', fontSize: 22, color: b.slot ? '#F5F5F5' : '#C9A96E', lineHeight: 1 }}>
                        {b.slot || 'Por asignar'}
                      </div>
                    </div>

                    {/* Columna nombre/empresa */}
                    <div className="aoh-row-info">
                      <div style={{ fontFamily: 'var(--sans)', fontSize: 13, color: '#F5F5F5', marginBottom: 3 }}>{b.nombre}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#5A5A5A', letterSpacing: '0.06em' }}>
                        {b.empresa}{b.cargo ? ` · ${b.cargo}` : ''}
                      </div>
                    </div>

                    {/* Columna estado + badges */}
                    <div className="aoh-row-status">
                      {b.status === 'confirmado' && (
                        <div className="aoh-row-badges">
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${b.emailEnviado ? '#4ade8030' : '#B8545030'}`, color: b.emailEnviado ? '#4ade80' : '#B85450', background: b.emailEnviado ? '#4ade8008' : '#B8545008' }}>
                            EMAIL {b.emailEnviado ? '✓' : '✗'}
                          </span>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${b.calendarEnviado ? '#4ade8030' : '#B8545030'}`, color: b.calendarEnviado ? '#4ade80' : '#B85450', background: b.calendarEnviado ? '#4ade8008' : '#B8545008' }}>
                            CAL {b.calendarEnviado ? '✓' : '✗'}
                          </span>
                        </div>
                      )}
                      <div style={{ textAlign: 'right', minWidth: 64 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: STATUS_COLOR[b.status], marginBottom: 3 }}>
                          {b.status}
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 7, color: '#3A3A3A', letterSpacing: '0.08em' }}>{fmtCreated(b.createdAt)}</div>
                      </div>
                      <div style={{ width: 3, alignSelf: 'stretch', background: STATUS_COLOR[b.status], opacity: 0.6, flexShrink: 0, minHeight: 32 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Panel lateral */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}
          onClick={() => setSelected(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="aoh-panel im-scroll-panel"
          >
            {/* Cabecera del panel */}
            <div className="aoh-panel-header" style={{ borderBottom: '1px solid #1a1a1a', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: STATUS_COLOR[selected.status] }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#5A5A5A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Office Hours · {fmtCreated(selected.createdAt)}
                  </div>
                  <div style={{ fontFamily: 'var(--serif, Georgia)', fontSize: 22, color: '#F5F5F5', marginBottom: 3 }}>{selected.nombre}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#8A8A8A' }}>{selected.empresa}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#5A5A5A', cursor: 'pointer', fontSize: 16, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
              </div>
            </div>

            {/* Sesión destacada */}
            <div className="aoh-panel-session">
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#5A5A5A', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Sesión reservada</div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'var(--serif, Georgia)', fontSize: 32, color: selected.slot ? '#F5F5F5' : '#C9A96E', lineHeight: 1 }}>{selected.slot || '—'}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#5A5A5A', letterSpacing: '0.1em', marginTop: 4 }}>
                    {selected.dia ? fmtDate(selected.dia) : 'Sin fecha asignada'}
                  </div>
                </div>
                <div style={{ flex: 1, height: 1, background: '#1a1a1a', minWidth: 20 }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: STATUS_COLOR[selected.status], marginBottom: 4 }}>{selected.status}</div>
                  {selected.status === 'confirmado' && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: selected.emailEnviado ? '#4ade80' : '#B85450' }}>Email {selected.emailEnviado ? '✓' : '✗'}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 7, color: selected.calendarEnviado ? '#4ade80' : '#B85450' }}>Cal {selected.calendarEnviado ? '✓' : '✗'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones — arriba para acceso inmediato */}
            <div className="aoh-panel-actions">
              <div style={{ display: 'grid', gridTemplateColumns: selected.status === 'pendiente' ? '1fr 1fr' : '1fr', gap: 8 }}>
                {selected.status !== 'confirmado' && (
                  <button onClick={() => handleStatus(selected._id, 'confirmado')} disabled={saving}
                    style={{ padding: '12px 8px', background: saving ? 'rgba(201,169,110,0.4)' : '#C9A96E', border: 'none', color: '#060606', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer' }}>
                    {saving ? '...' : 'Confirmar'}
                  </button>
                )}
                {selected.status !== 'cancelado' && (
                  <button onClick={() => handleStatus(selected._id, 'cancelado')} disabled={saving}
                    style={{ padding: '12px 8px', background: 'transparent', border: '1px solid #B8545040', color: '#B85450', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.5 : 1 }}>
                    Cancelar
                  </button>
                )}
                {selected.status === 'cancelado' && (
                  <button onClick={() => handleStatus(selected._id, 'pendiente')} disabled={saving}
                    style={{ padding: '12px 8px', background: 'transparent', border: '1px solid #2a2a2a', color: '#5A5A5A', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer' }}>
                    Restaurar pendiente
                  </button>
                )}
              </div>
              {selected.status === 'confirmado' && (!selected.calendarEnviado || !selected.emailEnviado) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  {!selected.calendarEnviado && (
                    <button onClick={() => handleRetry(selected._id, 'calendar')} disabled={saving}
                      style={{ padding: '10px 8px', background: 'transparent', border: '1px solid #C9A96E40', color: '#C9A96E', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.5 : 1 }}>
                      Retry Calendar
                    </button>
                  )}
                  {!selected.emailEnviado && (
                    <button onClick={() => handleRetry(selected._id, 'email')} disabled={saving}
                      style={{ padding: '10px 8px', background: 'transparent', border: '1px solid #2a2a2a', color: '#5A5A5A', fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.5 : 1 }}>
                      Retry Email
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Datos del prospecto */}
            <div className="aoh-panel-data">
              {([
                ['Email',      selected.email],
                ['Cargo',      selected.cargo      || '—'],
                ['Revenue',    selected.revenue     || '—'],
                ['Plazo',      selected.plazo       || '—'],
                ['Iniciativa', selected.iniciativaOracle || '—'],
                ['Origen',     [selected.tracking?.sourceSection, selected.tracking?.interactionType].filter(Boolean).join(' · ') || '—'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '12px 0', borderBottom: '1px solid #111', gap: 16 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: '#3A3A3A', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>{k}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#A0A0A0', textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
