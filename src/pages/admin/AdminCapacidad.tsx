import { useState, useEffect } from 'react';
import { useAuthApi } from '../../config/api';

interface Slot {
  id: number;
  status: 'disponible' | 'activo' | 'reservado';
  assignedLeadId?: string;
  assignedLead?: string;
  notas?: string;
  updatedAt?: string;
}
interface WaitlistLead {
  _id: string; nombre: string; cargo: string; empresa: string;
  industria: string; score: number; createdAt: string;
}

const SLOT_BG: Record<string, string>     = { activo: '#C9A96E', reservado: '#4a4a30', disponible: '#1a1a1a' };
const SLOT_BORDER: Record<string, string> = { activo: '#C9A96E', reservado: '#6b5a2c', disponible: '#252525' };
const SLOT_TEXT: Record<string, string>   = { activo: '#060606', reservado: '#8A8A8A', disponible: '#5A5A5A' };
const NEXT_STATUS: Record<string, Slot['status']> = {
  disponible: 'activo',
  activo:     'reservado',
  reservado:  'disponible',
};

const ADMISSION_QUARTERS = [
  { quarter: 'Q1 2026', status: 'closed',   description: '3 proyectos aceptados',      deadline: '○ Completo'       },
  { quarter: 'Q2 2026', status: 'closed',   description: '2 proyectos aceptados',      deadline: '○ Completo'       },
  { quarter: 'Q3 2026', status: 'open',     description: 'Evaluando aplicaciones',     deadline: 'Plazo · 30 julio' },
  { quarter: 'Q4 2026', status: 'upcoming', description: 'Aplicaciones desde 01 sept', deadline: '○ Próximo'        },
];

export default function AdminCapacidad() {
  const adminApi = useAuthApi();
  const [slots, setSlots]                 = useState<Slot[]>([]);
  const [waitlist, setWaitlist]           = useState<WaitlistLead[]>([]);
  const [deadlineQ3, setDeadlineQ3]       = useState('');
  const [deadlineDraft, setDeadlineDraft] = useState('');
  const [loading, setLoading]             = useState(true);
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [savedDeadline, setSavedDeadline]   = useState(false);

  useEffect(() => {
    Promise.all([
      adminApi.get('/capacidad'),
      adminApi.get('/leads/admin?status=WaitList'),
    ]).then(([capRes, leadsRes]) => {
      setSlots(capRes.data.data.slots ?? []);
      const dl = capRes.data.data.deadlineQ3 ?? '';
      setDeadlineQ3(dl);
      setDeadlineDraft(dl);
      setWaitlist(leadsRes.data.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cycleSlot = async (slot: Slot) => {
    const next = NEXT_STATUS[slot.status];
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: next } : s));
    try {
      await adminApi.patch(`/capacidad/slot/${slot.id}`, { status: next });
    } catch {
      setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: slot.status } : s));
    }
  };

  const assignLeadToSlot = async (lead: WaitlistLead) => {
    const slot = slots.find(s => s.status === 'disponible') ?? slots.find(s => !s.assignedLeadId);
    if (!slot) return;

    const nextSlot = {
      ...slot,
      status: 'reservado' as const,
      assignedLeadId: lead._id,
      assignedLead: `${lead.empresa} · ${lead.nombre}`,
      notas: 'Asignado desde WaitList',
    };

    setSlots(prev => prev.map(s => s.id === slot.id ? nextSlot : s));
    try {
      await adminApi.patch(`/capacidad/slot/${slot.id}`, {
        status: 'reservado',
        assignedLeadId: lead._id,
        assignedLead: `${lead.empresa} · ${lead.nombre}`,
        notas: 'Asignado desde WaitList',
      });
    } catch {
      setSlots(prev => prev.map(s => s.id === slot.id ? slot : s));
    }
  };

  const saveDeadline = async () => {
    setSavingDeadline(true);
    try {
      await adminApi.put('/capacidad', { deadlineQ3: deadlineDraft });
      setDeadlineQ3(deadlineDraft);
      setSavedDeadline(true);
      setTimeout(() => setSavedDeadline(false), 2000);
    } catch { /* ignore */ }
    finally { setSavingDeadline(false); }
  };

  const activos    = slots.filter(s => s.status === 'activo').length;
  const reservados = slots.filter(s => s.status === 'reservado').length;
  const libres     = slots.filter(s => s.status === 'disponible').length;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });

  return (
    <div className="fabric-admin-page">
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">FABRIC · ADMIN · CAPACIDAD</div>
            <h1 className="fabric-admin-title">Capacidad operativa</h1>
            <div className="fabric-admin-subtitle">Slots Q3 2026 · waitlist calificada · admision y deadline sincronizados con S15.</div>
          </div>
          {!loading && (
            <span className="fabric-admin-pill">
              {activos} activos · {reservados} reservados · {libres} disponibles
            </span>
          )}
        </div>
      </div>
      <div className="fabric-admin-content admin-cap-main-grid">

        {/* Grid de slots */}
        <div className="fabric-admin-panel admin-cap-slots-panel">
          <div className="admin-cap-slots-title">
            Slots · capacidad Q3 2026
          </div>
          <div className="admin-cap-slots-subtitle">
            Click para rotar estado: Disponible → Activo → Reservado. Se sincroniza con S15.
          </div>
          <div className="admin-cap-slots-grid">
            {loading ? (
              <div style={{ fontSize: 9, color: '#5A5A5A' }}>Cargando slots...</div>
            ) : slots.map(s => (
              <div
                key={s.id}
                title={`Slot ${s.id} · ${s.status}${s.assignedLead ? ` · ${s.assignedLead}` : ''}`}
                onClick={() => cycleSlot(s)}
                style={{ width: 44, height: 44, background: SLOT_BG[s.status], border: `1px solid ${SLOT_BORDER[s.status]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: SLOT_TEXT[s.status], cursor: 'pointer', fontWeight: 700, transition: 'all .15s', userSelect: 'none' }}
              >
                {s.id}
              </div>
            ))}
          </div>
          <div className="admin-cap-slots-legend">
            {(['activo', 'reservado', 'disponible'] as const).map(st => (
              <div key={st}>
                <div style={{ width: 10, height: 10, background: SLOT_BG[st], border: `1px solid ${SLOT_BORDER[st]}`, flexShrink: 0 }} />
                <span>
                  {st.charAt(0).toUpperCase() + st.slice(1)} · {slots.filter(x => x.status === st).length}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wait list + Admisión */}
        <div className="admin-cap-grid">

          {/* Wait list real */}
          <div className="fabric-admin-panel admin-cap-waitlist-panel">
            <div className="admin-cap-waitlist-title">
              Wait list · {waitlist.length} leads en espera
            </div>

            <div className="admin-cap-waitlist-container">
              {/* Tabla (Desktop/Tablet grande) */}
              <div className="admin-cap-table-wrap">
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                      {['Empresa', 'Contacto', 'Sector', 'Score', 'Desde', 'Accion'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 7, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', fontWeight: 400 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px 12px', fontSize: 9, color: '#5A5A5A' }}>
                          Sin leads en WaitList.
                        </td>
                      </tr>
                    ) : waitlist.map(w => (
                      <tr key={w._id} style={{ borderBottom: '1px solid #111' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, color: '#F5F5F5' }}>{w.empresa}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, color: '#F5F5F5' }}>{w.nombre}</div>
                          <div style={{ fontSize: 9, color: '#5A5A5A' }}>{w.cargo}</div>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 9, color: '#8A8A8A' }}>{w.industria}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontFamily: 'var(--serif, Georgia, serif)', fontSize: 16, fontStyle: 'italic', color: '#C9A96E' }}>
                            {w.score}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 9, color: '#5A5A5A' }}>{fmt(w.createdAt)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            onClick={() => assignLeadToSlot(w)}
                            disabled={!slots.some(s => s.status === 'disponible')}
                            style={{ fontSize: 8, padding: '5px 10px', background: 'transparent', border: '1px solid #252525', color: slots.some(s => s.status === 'disponible') ? '#C9A96E' : '#3A3A3A', cursor: slots.some(s => s.status === 'disponible') ? 'pointer' : 'default', fontFamily: 'inherit', letterSpacing: '0.1em' }}
                          >
                            Reservar slot
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tarjetas (Móvil/Tablet pequeña) */}
              <div className="admin-cap-waitlist-cards">
                {waitlist.length === 0 ? (
                  <div style={{ padding: '20px 0', fontSize: 9, color: '#5A5A5A', textAlign: 'center' }}>
                    Sin leads en WaitList.
                  </div>
                ) : waitlist.map(w => (
                  <div key={w._id} className="admin-cap-waitlist-card">
                    <div className="admin-cap-waitlist-card-header">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <span className="admin-cap-waitlist-card-date">Desde: {fmt(w.createdAt)}</span>
                        <h3 className="admin-cap-waitlist-card-empresa">{w.empresa}</h3>
                        <p className="admin-cap-waitlist-card-nombre">{w.nombre} · {w.cargo}</p>
                      </div>
                      <div className="admin-cap-waitlist-card-score">
                        <span className="score-label">SCORE</span>
                        <span className="score-val">{w.score}</span>
                      </div>
                    </div>

                    <div className="admin-cap-waitlist-card-body">
                      <div className="admin-cap-waitlist-card-meta">
                        <span className="meta-label">Sector / Industria:</span>
                        <span className="meta-val">{w.industria}</span>
                      </div>
                    </div>

                    <div className="admin-cap-waitlist-card-footer">
                      <button
                        onClick={() => assignLeadToSlot(w)}
                        disabled={!slots.some(s => s.status === 'disponible')}
                        className="admin-cap-reserve-btn"
                        style={{
                          fontSize: 8, padding: '7px 14px', background: 'transparent',
                          border: `1px solid ${slots.some(s => s.status === 'disponible') ? '#C9A96E' : '#252525'}`,
                          color: slots.some(s => s.status === 'disponible') ? '#C9A96E' : '#5A5A5A',
                          cursor: slots.some(s => s.status === 'disponible') ? 'pointer' : 'default',
                          fontFamily: 'inherit', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600,
                          width: '100%'
                        }}
                      >
                        Reservar slot
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ciclo de admisión + deadline editable */}
          <div className="fabric-admin-panel admin-cap-admission-panel">
            <div style={{ fontSize: 9, letterSpacing: '0.22em', color: '#C9A96E', textTransform: 'uppercase' }}>
              Ciclo de admisión 2026
            </div>
            {ADMISSION_QUARTERS.map(q => (
              <div key={q.quarter} style={{ borderLeft: `2px solid ${q.status === 'open' ? '#C9A96E' : '#252525'}`, paddingLeft: 14 }}>
                <div style={{ fontSize: 10, color: q.status === 'open' ? '#F5F5F5' : '#5A5A5A', marginBottom: 4 }}>
                  {q.quarter}
                </div>
                <div style={{ fontSize: 9, color: q.status === 'open' ? '#8A8A8A' : '#3A3A3A' }}>
                  {q.description}
                </div>
                <div style={{ fontSize: 8, color: q.status === 'open' ? '#C9A96E' : '#3A3A3A', marginTop: 4, letterSpacing: '0.12em' }}>
                  {q.deadline}
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 16 }}>
              <div style={{ fontSize: 8, letterSpacing: '0.18em', color: '#5A5A5A', textTransform: 'uppercase', marginBottom: 10 }}>
                Deadline Q3 (ISO · visible en countdown)
              </div>
              <input
                value={deadlineDraft}
                onChange={e => setDeadlineDraft(e.target.value)}
                placeholder="2026-07-30T23:59:59-06:00"
                style={{ width: '100%', background: '#060606', border: '1px solid #252525', color: '#F5F5F5', fontFamily: 'inherit', fontSize: 10, padding: '8px 10px', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
              />
              <button
                onClick={saveDeadline}
                disabled={savingDeadline || deadlineDraft === deadlineQ3}
                style={{
                  width: '100%', padding: '10px', cursor: deadlineDraft === deadlineQ3 ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  background: savedDeadline ? 'rgba(74,222,128,0.08)' : deadlineDraft !== deadlineQ3 ? '#C9A96E' : 'rgba(90,90,90,0.08)',
                  border: `1px solid ${savedDeadline ? '#4ade80' : deadlineDraft !== deadlineQ3 ? 'transparent' : '#252525'}`,
                  color: savedDeadline ? '#4ade80' : deadlineDraft !== deadlineQ3 ? '#060606' : '#5A5A5A',
                  fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700,
                  opacity: savingDeadline ? 0.6 : 1,
                }}
              >
                {savedDeadline ? '✓ Guardado' : savingDeadline ? 'Guardando...' : 'Guardar deadline'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
