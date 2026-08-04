import { useEffect, useState, useRef } from 'react';
import { useAuthApi } from '../../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Suscriptor {
  _id: string;
  email: string;
  nombre: string;
  empresa: string;
  cargo: string;
  revenueAprox: string;
  iniciativaOracle: 'activa' | 'planeada' | 'evaluando';
  industria: string;
  tracking?: { sourceSection?: string; interactionType?: string; pagePath?: string };
  status: 'pendiente' | 'aprobado' | 'rechazado';
  createdAt: string;
}

interface Config {
  cupoActivo: boolean;
  cupoMaximo: number;
  admisionAbierta: boolean;
}

// ─── Helpers de estilo ────────────────────────────────────────────────────────

const btn = ({ accent = false, danger = false, small = false } = {}) => ({
  padding: small ? '5px 12px' : '8px 18px',
  fontSize: small ? 9 : 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
  cursor: 'pointer',
  border: `1px solid ${danger ? '#6B2D2D' : accent ? '#C9A96E' : '#2A2A2A'}`,
  background: accent ? '#C9A96E' : 'transparent',
  color: accent ? '#060606' : danger ? '#E57373' : '#8A8A8A',
});

const inp = (extra: object = {}) => ({
  background: '#0D0D0D',
  border: '1px solid #252525',
  color: '#F5F5F5',
  padding: '7px 12px',
  fontSize: 11,
  fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
  outline: 'none',
  ...extra,
});

function statusColor(s: Suscriptor['status']) {
  return s === 'aprobado' ? '#C9A96E' : s === 'rechazado' ? '#E57373' : '#5A5A5A';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminResearchLetters() {
  const api = useAuthApi();
  const [suscriptores, setSuscriptores] = useState<Suscriptor[]>([]);
  const [aprobados, setAprobados]       = useState(0);
  const [total, setTotal]               = useState(0);
  const [config, setConfig]             = useState<Config>({ cupoActivo: true, cupoMaximo: 50, admisionAbierta: true });
  const [filtro, setFiltro]             = useState<string>('');
  const [cupoInput, setCupoInput]       = useState('50');
  const [msg, setMsg]                   = useState('');
  const [msgType, setMsgType]           = useState<'ok' | 'err'>('ok');
  const [loading, setLoading]           = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = (text: string, type: 'ok' | 'err' = 'ok') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMsg(text);
    setMsgType(type);
    timerRef.current = setTimeout(() => setMsg(''), 4000);
  };

  const cargar = async (status?: string) => {
    setLoading(true);
    try {
      const params = status ? `?status=${status}` : '';
      const res = await api.get(`/research-letters/admin${params}`);
      const d = res.data;
      setSuscriptores(d.data || []);
      setAprobados(d.aprobados ?? 0);
      setTotal(d.total ?? 0);
      if (d.config) {
        setConfig(d.config);
        setCupoInput(String(d.config.cupoMaximo));
      }
    } catch {
      flash('Error cargando datos.', 'err');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar();   // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltro = (f: string) => {
    setFiltro(f);
    cargar(f || undefined);
  };

  const cambiarStatus = async (id: string, status: Suscriptor['status']) => {
    try {
      await api.patch(`/research-letters/admin/${id}/status`, { status });
      flash(status === 'aprobado' ? 'Acceso aprobado. Email de bienvenida enviado.' : 'Estado actualizado.');
      cargar(filtro || undefined);
    } catch {
      flash('Error actualizando estado.', 'err');
    }
  };

  const guardarConfig = async () => {
    const cupoMaximo = Number(cupoInput);
    if (config.cupoActivo && (!cupoMaximo || cupoMaximo < 1)) {
      flash('Cupo máximo debe ser un número mayor a 0.', 'err');
      return;
    }
    try {
      await api.put('/research-letters/admin/config', {
        cupoActivo:      config.cupoActivo,
        cupoMaximo,
        admisionAbierta: config.admisionAbierta,
      });
      setConfig(c => ({ ...c, cupoMaximo }));
      flash('Configuración guardada.');
    } catch {
      flash('Error guardando configuración.', 'err');
    }
  };

  const toggleConfig = async (campo: keyof Config, valor: boolean) => {
    const next = { ...config, [campo]: valor };
    setConfig(next);
    try {
      await api.put('/research-letters/admin/config', { [campo]: valor });
      flash('Configuración actualizada.');
    } catch {
      setConfig(config);
      flash('Error actualizando configuración.', 'err');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const FILTROS: { label: string; value: string }[] = [
    { label: 'Todos',     value: '' },
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Aprobado',  value: 'aprobado' },
    { label: 'Rechazado', value: 'rechazado' },
  ];

  const S = { fontFamily: 'var(--mono, "JetBrains Mono", monospace)' };

  return (
      <div className="fabric-admin-page">
        <div className="fabric-admin-hero">
          <div className="fabric-admin-hero-inner">
            <div>
              <div className="fabric-admin-eyebrow">ADMIN · RESEARCH LETTERS</div>
              <h1 className="fabric-admin-title">Research Letters</h1>
              <div className="fabric-admin-subtitle">Cupo editorial · admision calificada · aprobacion con email de bienvenida.</div>
            </div>
            <span className="fabric-admin-pill">{aprobados}/{config.cupoMaximo} aprobados · {total} solicitudes</span>
          </div>
        </div>

        <div className="fabric-admin-content">

        {/* Flash */}
        {msg && (
          <div style={{ ...S, marginBottom: 24, padding: '10px 16px', fontSize: 10, letterSpacing: '0.12em',
            border: `1px solid ${msgType === 'ok' ? '#2A3A2A' : '#3A2A2A'}`,
            color: msgType === 'ok' ? '#7ABF7A' : '#E57373',
            background: msgType === 'ok' ? 'rgba(122,191,122,0.06)' : 'rgba(229,115,115,0.06)',
          }}>
            {msg}
          </div>
        )}

        {/* ── Config ──────────────────────────────────────────────────────── */}
        <section style={{ border: '1px solid #1E1E1E', padding: '28px 32px', marginBottom: 32 }}>
          <div style={{ ...S, fontSize: 9, color: '#5A5A5A', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 24 }}>
            Configuración de membresía
          </div>

          <div className="admin-research-config-grid">

            {/* Admisión abierta */}
            <div>
              <div style={{ ...S, fontSize: 9, color: '#5A5A5A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                Admisión
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => toggleConfig('admisionAbierta', true)}
                  style={{ ...btn({ accent: config.admisionAbierta, small: true }) }}
                >
                  Abierta
                </button>
                <button
                  onClick={() => toggleConfig('admisionAbierta', false)}
                  style={{ ...btn({ danger: !config.admisionAbierta, small: true }) }}
                >
                  Cerrada
                </button>
              </div>
              <div style={{ ...S, fontSize: 9, color: '#3A3A3A', marginTop: 8 }}>
                {config.admisionAbierta ? 'Acepta nuevas solicitudes' : 'Solicitudes bloqueadas'}
              </div>
            </div>

            {/* Cupo activo */}
            <div>
              <div style={{ ...S, fontSize: 9, color: '#5A5A5A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                Límite de cupo
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => toggleConfig('cupoActivo', true)}
                  style={{ ...btn({ accent: config.cupoActivo, small: true }) }}
                >
                  Activo
                </button>
                <button
                  onClick={() => toggleConfig('cupoActivo', false)}
                  style={{ ...btn({ small: true }), color: !config.cupoActivo ? '#F5F5F5' : '#5A5A5A' }}
                >
                  Sin límite
                </button>
              </div>
              <div style={{ ...S, fontSize: 9, color: '#3A3A3A', marginTop: 8 }}>
                {config.cupoActivo ? `Máximo ${config.cupoMaximo} aprobados` : 'Sin restricción de cupo'}
              </div>
            </div>

            {/* Cupo máximo */}
            <div>
              <div style={{ ...S, fontSize: 9, color: config.cupoActivo ? '#5A5A5A' : '#2A2A2A', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
                Cupo máximo
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  min={1}
                  value={cupoInput}
                  disabled={!config.cupoActivo}
                  onChange={e => setCupoInput(e.target.value)}
                  style={{ ...inp({ width: 80, opacity: config.cupoActivo ? 1 : 0.3 }) }}
                />
                <button onClick={guardarConfig} style={{ ...btn({ small: true }) }}>
                  Guardar
                </button>
              </div>
              {config.cupoActivo && (
                <div style={{ ...S, fontSize: 9, marginTop: 8, color: aprobados >= config.cupoMaximo ? '#E57373' : '#C9A96E' }}>
                  {aprobados} / {config.cupoMaximo} aprobados
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        <div className="admin-research-stats-grid">
          {[
            { label: 'Total solicitudes', value: total },
            { label: 'Aprobados',         value: aprobados },
            { label: 'Pendientes',        value: suscriptores.filter(s => s.status === 'pendiente').length },
          ].map(s => (
            <div key={s.label} style={{ border: '1px solid #1E1E1E', padding: '20px 24px' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: '#C9A96E', fontWeight: 300 }}>{s.value}</div>
              <div style={{ ...S, fontSize: 9, color: '#5A5A5A', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filtros ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {FILTROS.map(f => (
            <button
              key={f.value}
              onClick={() => aplicarFiltro(f.value)}
              style={{ ...btn({ accent: filtro === f.value, small: true }) }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Lista ───────────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ ...S, fontSize: 10, color: '#3A3A3A', padding: '40px 0', textAlign: 'center' }}>Cargando...</div>
        ) : suscriptores.length === 0 ? (
          <div style={{ ...S, fontSize: 10, color: '#3A3A3A', padding: '40px 0', textAlign: 'center' }}>Sin resultados.</div>
        ) : (
          <div style={{ borderTop: '1px solid #1E1E1E' }}>
            {suscriptores.map(s => (
              <div key={s._id} className="admin-research-list-row">
                {/* Info */}
                <div>
                  <div style={{ ...S, fontSize: 11, color: '#F5F5F5', marginBottom: 4 }}>{s.empresa}</div>
                  <div style={{ ...S, fontSize: 10, color: '#8A8A8A' }}>{s.nombre} · {s.cargo}</div>
                  <div style={{ ...S, fontSize: 9, color: '#5A5A5A', marginTop: 4 }}>{s.email}</div>
                  <div style={{ ...S, fontSize: 8, color: '#3A3A3A', marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {[s.tracking?.sourceSection, s.tracking?.interactionType].filter(Boolean).join(' · ') || 'Sin tracking'}
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                    <span style={{ ...S, fontSize: 9, color: '#3A3A3A' }}>
                      Oracle: <span style={{ color: '#5A5A5A' }}>{s.iniciativaOracle}</span>
                    </span>
                    {s.revenueAprox !== 'No especificado' && (
                      <span style={{ ...S, fontSize: 9, color: '#3A3A3A' }}>
                        Revenue: <span style={{ color: '#5A5A5A' }}>{s.revenueAprox}</span>
                      </span>
                    )}
                    {s.industria && (
                      <span style={{ ...S, fontSize: 9, color: '#3A3A3A' }}>
                        <span style={{ color: '#5A5A5A' }}>{s.industria}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Fecha */}
                <div style={{ ...S, fontSize: 9, color: '#5A5A5A', paddingTop: 2 }}>
                  {formatDate(s.createdAt)}
                </div>

                {/* Status */}
                <div style={{ ...S, fontSize: 9, color: statusColor(s.status), letterSpacing: '0.16em', textTransform: 'uppercase', paddingTop: 2 }}>
                  {s.status}
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {s.status !== 'aprobado' && (
                    <button onClick={() => cambiarStatus(s._id, 'aprobado')} style={{ ...btn({ accent: true, small: true }) }}>
                      Aprobar
                    </button>
                  )}
                  {s.status !== 'pendiente' && (
                    <button onClick={() => cambiarStatus(s._id, 'pendiente')} style={{ ...btn({ small: true }) }}>
                      Pendiente
                    </button>
                  )}
                  {s.status !== 'rechazado' && (
                    <button onClick={() => cambiarStatus(s._id, 'rechazado')} style={{ ...btn({ danger: true, small: true }) }}>
                      Rechazar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
  );
}
