import { useState, useEffect, useCallback } from 'react';
import { api, useAuthApi } from '../../config/api';

interface Metrica {
  id: string;
  label: string;
  value: number;
  unit: string;
  publicLabel: string;
  period: string;
  visible: boolean;
  appearsIn: string;
  version: number;
}

export default function AdminMetricas() {
  const adminApi = useAuthApi();
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [autoActivos, setAutoActivos]   = useState<number | null>(null);
  const [autoWaitlist, setAutoWaitlist] = useState<number | null>(null);
  const [loading, setLoading]   = useState(true);
  const [savedId, setSavedId]   = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi.get('/metricas'),
      api.get('/stats'),
    ]).then(([mRes, sRes]) => {
      setMetricas(mRes.data.data ?? []);
      setAutoActivos(sRes.data.data.proyectosActivos ?? null);
      setAutoWaitlist(sRes.data.data.enListaEspera ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdate = async (id: string, field: keyof Metrica, val: number | boolean | string) => {
    setMetricas(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
    try {
      await adminApi.patch(`/metricas/${id}`, { [field]: val });
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch {
      fetchData();
    }
  };

  return (
    <div className="fabric-admin-page">
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">FABRIC · ADMIN · METRICAS</div>
            <h1 className="fabric-admin-title">Metricas publicas</h1>
            <div className="fabric-admin-subtitle">Editor operativo · preview publico · visibilidad granular para datos de S15 y transparencia.</div>
          </div>
          <a href="/" target="_blank" rel="noreferrer" style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C9A96E', textDecoration: 'none', border: '1px solid #252525', padding: '9px 18px' }}>
            Vista previa →
          </a>
        </div>
      </div>

      <div style={{ padding: '12px 36px', borderBottom: '1px solid #1a1a1a', background: 'rgba(201,169,110,0.04)' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.14em', color: '#C9A96E', textTransform: 'uppercase' }}>
          ◆ Proyectos activos y Wait list se calculan en tiempo real desde la base de datos
        </span>
      </div>

      <div className="fabric-admin-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Auto-computed (read-only) */}
        <AutoMetricRow
          label="Proyectos activos"
          value={autoActivos}
          unit="/12"
          appearsIn="S15 Founder · Dashboard"
        />
        <AutoMetricRow
          label="Wait list actual"
          value={autoWaitlist}
          unit="orgs"
          appearsIn="S15 Founder"
        />

        {/* Editable desde DB */}
        {loading ? (
          <div style={{ fontSize: 9, color: '#5A5A5A', letterSpacing: '0.16em' }}>Cargando métricas...</div>
        ) : metricas.map(m => (
          <MetricaCard
            key={m.id}
            m={m}
            justSaved={savedId === m.id}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
}

function AutoMetricRow({ label, value, unit, appearsIn }: {
  label: string; value: number | null; unit: string; appearsIn: string;
}) {
  return (
    <div className="fabric-admin-panel" style={{ background: '#0A0A0A', border: '1px solid #1a1a1a', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#3A3A3A', textTransform: 'uppercase', marginBottom: 6 }}>
          {label} · auto-calculado desde DB
        </div>
        <div style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 36, color: '#4a4a4a' }}>
          {value !== null ? `${value}${unit === '%' || unit === '/12' ? unit : ''}` : '—'}
        </div>
        <div style={{ fontSize: 8, color: '#3A3A3A', marginTop: 6, letterSpacing: '0.12em' }}>
          Aparece en: {appearsIn}
        </div>
      </div>
      <span style={{ fontSize: 8, letterSpacing: '0.18em', color: '#3A3A3A', textTransform: 'uppercase', padding: '4px 10px', border: '1px solid #1a1a1a' }}>
        Solo lectura
      </span>
    </div>
  );
}

function MetricaCard({ m, justSaved, onUpdate }: {
  m: Metrica;
  justSaved: boolean;
  onUpdate: (id: string, field: keyof Metrica, val: number | boolean | string) => void;
}) {
  return (
    <div className="fabric-admin-panel" style={{ background: '#0F0F0F', border: `1px solid ${justSaved ? '#4ade8055' : '#1e1e1e'}`, padding: '28px 32px', transition: 'border-color .3s' }}>
      <div className="admin-metrics-card-grid">

        {/* Vista previa pública */}
        <div>
          <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 12 }}>
            {m.label} · v{m.version}
          </div>
          <div style={{ border: '1px solid #252525', padding: '20px 24px', background: '#060606' }}>
            <div style={{ fontSize: 8, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 8 }}>
              Vista previa pública
            </div>
            <div style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 40, color: m.visible ? '#C9A96E' : '#3A3A3A', marginBottom: 4 }}>
              {m.value}{m.unit === '%' || m.unit === '/12' ? m.unit : ''}
            </div>
            <div style={{ fontSize: 10, color: '#8A8A8A' }}>{m.publicLabel}</div>
            <div style={{ fontSize: 8, color: '#3A3A3A', marginTop: 8, letterSpacing: '0.12em' }}>
              Aparece en: {m.appearsIn}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div>
          <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 12 }}>
            Editor
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 8, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Valor
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => onUpdate(m.id, 'value', Math.max(0, m.value - 1))}
                  style={{ width: 28, height: 28, background: '#1a1a1a', border: '1px solid #252525', color: '#C9A96E', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}
                >−</button>
                <span style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 24, color: '#C9A96E', minWidth: 40, textAlign: 'center' }}>
                  {m.value}
                </span>
                <button
                  onClick={() => onUpdate(m.id, 'value', m.value + 1)}
                  style={{ width: 28, height: 28, background: '#1a1a1a', border: '1px solid #252525', color: '#C9A96E', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}
                >+</button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 8, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Etiqueta pública
              </label>
              <input
                value={m.publicLabel}
                onChange={e => onUpdate(m.id, 'publicLabel', e.target.value)}
                style={{ width: '100%', background: '#060606', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'inherit', fontSize: 11, padding: '8px 10px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Visibilidad */}
        <div>
          <div style={{ fontSize: 8, letterSpacing: '0.22em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 12 }}>
            Visibilidad
          </div>
          <button
            onClick={() => onUpdate(m.id, 'visible', !m.visible)}
            style={{ padding: '10px 18px', background: m.visible ? 'rgba(74,222,128,0.1)' : 'rgba(90,90,90,0.1)', border: `1px solid ${m.visible ? '#4ade80' : '#252525'}`, color: m.visible ? '#4ade80' : '#5A5A5A', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', width: '100%' }}
          >
            {m.visible ? '● VISIBLE' : '○ OCULTO'}
          </button>
          <div style={{ marginTop: 8, fontSize: 8, color: '#3A3A3A', letterSpacing: '0.1em' }}>
            Período: {m.period}
          </div>
          {justSaved && (
            <div style={{ marginTop: 8, fontSize: 8, color: '#4ade80', letterSpacing: '0.14em' }}>✓ Guardado</div>
          )}
        </div>
      </div>
    </div>
  );
}
