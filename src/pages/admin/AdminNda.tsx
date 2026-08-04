import { useEffect, useState } from 'react';
import { useAuthApi } from '../../config/api';

type NdaStatus = 'pendiente' | 'aprobado' | 'enviado' | 'rechazado';

interface NdaRequest {
  _id: string;
  nombre: string;
  cargo: string;
  empresa: string;
  email: string;
  caso: string;
  documento: string;
  tracking?: { sourceSection?: string; interactionType?: string; pagePath?: string };
  status: NdaStatus;
  emailSent: boolean;
  createdAt: string;
}

const STATUS_COLOR: Record<NdaStatus, string> = {
  pendiente: '#C9A96E',
  aprobado:  '#60a5fa',
  enviado:   '#4ade80',
  rechazado: '#B85450',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminNda() {
  const adminApi = useAuthApi();
  const [requests, setRequests] = useState<NdaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function fetchRequests() {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.get('/nda/admin');
      setRequests(res.data.data ?? []);
    } catch {
      setError('No se pudieron cargar las solicitudes NDA.');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRequests();   // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id: string, status: NdaStatus) {
    setUpdating(id);
    setError('');
    try {
      const res = await adminApi.patch(`/nda/admin/${id}/status`, { status });
      setRequests(prev => prev.map(r => r._id === id ? res.data.data : r));
    } catch {
      setError('No se pudo actualizar la solicitud.');
    } finally {
      setUpdating(null);
    }
  }

  async function approveAndSend(id: string) {
    setUpdating(id);
    setError('');
    try {
      const res = await adminApi.post(`/nda/admin/${id}/aprobar-enviar`);
      setRequests(prev => prev.map(r => r._id === id ? res.data.data : r));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'No se pudo enviar el PDF NDA.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="fabric-admin-page">
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">FABRIC · ADMIN · NDA</div>
            <h1 className="fabric-admin-title">Solicitudes NDA</h1>
            <div className="fabric-admin-subtitle">{requests.length} solicitudes · aprobacion, envio y metadata documental en una sola vista.</div>
          </div>
          <button onClick={fetchRequests} style={{ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '9px 18px', background: 'transparent', border: '1px solid #252525', color: '#8A8A8A', cursor: 'pointer', fontFamily: 'inherit' }}>
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 36px', borderBottom: '1px solid #1a1a1a', color: '#B85450', fontSize: 10, letterSpacing: '0.12em' }}>
          {error}
        </div>
      )}

      <div className="fabric-admin-content">
        <div className="admin-nda-table-wrap">
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Cargando...</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Sin solicitudes NDA.</div>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  {['Fecha', 'Caso', 'Documento', 'Empresa', 'Contacto', 'Cargo', 'Email', 'Origen', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 8, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #111' }}>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#5A5A5A', whiteSpace: 'nowrap' }}>{fmt(r.createdAt)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#C9A96E', letterSpacing: '0.08em' }}>{r.caso}</td>
                    <td style={{ padding: '12px 16px', fontSize: 9, color: '#8A8A8A', letterSpacing: '0.08em', fontFamily: 'var(--mono, monospace)' }}>{r.documento}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#F5F5F5' }}>{r.empresa}</td>
                    <td style={{ padding: '12px 16px', fontSize: 11, color: '#F5F5F5' }}>{r.nombre}</td>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#8A8A8A' }}>{r.cargo}</td>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#8A8A8A' }}>{r.email}</td>
                    <td style={{ padding: '12px 16px', fontSize: 9, color: '#5A5A5A' }}>{[r.tracking?.sourceSection, r.tracking?.interactionType].filter(Boolean).join(' · ') || r.documento}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '3px 10px', border: `1px solid ${STATUS_COLOR[r.status]}44`, color: STATUS_COLOR[r.status], background: `${STATUS_COLOR[r.status]}10` }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {r.status !== 'enviado' && (
                          <button disabled={updating === r._id} onClick={() => approveAndSend(r._id)} style={{ fontSize: 8, padding: '4px 10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>
                            Aprobar y enviar
                          </button>
                        )}
                        {r.status !== 'rechazado' && (
                          <button disabled={updating === r._id} onClick={() => updateStatus(r._id, 'rechazado')} style={{ fontSize: 8, padding: '4px 10px', background: 'transparent', border: '1px solid #B85450', color: '#B85450', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>
                            Rechazar
                          </button>
                        )}
                        {r.status !== 'pendiente' && (
                          <button disabled={updating === r._id} onClick={() => updateStatus(r._id, 'pendiente')} style={{ fontSize: 8, padding: '4px 10px', background: 'transparent', border: '1px solid #252525', color: '#8A8A8A', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>
                            Pendiente
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-nda-cards">
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Cargando...</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 11, color: '#5A5A5A' }}>Sin solicitudes NDA.</div>
          ) : (
            requests.map(r => (
              <div key={r._id} className="admin-nda-card">
                <div className="admin-nda-card-header">
                  <div>
                    <span className="admin-nda-card-date">{fmt(r.createdAt)}</span>
                    <h3 className="admin-nda-card-empresa">{r.empresa}</h3>
                    <p className="admin-nda-card-nombre">{r.nombre} / {r.cargo}</p>
                  </div>
                  <span style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '3px 10px', border: `1px solid ${STATUS_COLOR[r.status]}44`, color: STATUS_COLOR[r.status], background: `${STATUS_COLOR[r.status]}10`, height: 'fit-content' }}>
                    {r.status}
                  </span>
                </div>

                <div className="admin-nda-card-body">
                  <div className="admin-nda-card-meta">
                    <span className="meta-label">Caso</span>
                    <span className="meta-val font-mono text-[#C9A96E]">{r.caso}</span>
                  </div>
                  <div className="admin-nda-card-meta">
                    <span className="meta-label">Documento</span>
                    <span className="meta-val font-mono text-[#8A8A8A]">{r.documento}</span>
                  </div>
                  <div className="admin-nda-card-meta">
                    <span className="meta-label">Email</span>
                    <span className="meta-val text-[#8A8A8A] break-all">{r.email}</span>
                  </div>
                  <div className="admin-nda-card-meta">
                    <span className="meta-label">Origen</span>
                    <span className="meta-val text-[#5A5A5A]">{[r.tracking?.sourceSection, r.tracking?.interactionType].filter(Boolean).join(' · ') || r.documento}</span>
                  </div>
                </div>

                <div className="admin-nda-card-footer">
                  <div className="flex flex-wrap gap-2 w-full justify-end">
                    {r.status !== 'enviado' && (
                      <button disabled={updating === r._id} onClick={() => approveAndSend(r._id)} style={{ fontSize: 8, padding: '5px 12px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>
                        Aprobar y enviar
                      </button>
                    )}
                    {r.status !== 'rechazado' && (
                      <button disabled={updating === r._id} onClick={() => updateStatus(r._id, 'rechazado')} style={{ fontSize: 8, padding: '5px 12px', background: 'transparent', border: '1px solid #B85450', color: '#B85450', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>
                        Rechazar
                      </button>
                    )}
                    {r.status !== 'pendiente' && (
                      <button disabled={updating === r._id} onClick={() => updateStatus(r._id, 'pendiente')} style={{ fontSize: 8, padding: '5px 12px', background: 'transparent', border: '1px solid #252525', color: '#8A8A8A', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.1em' }}>
                        Pendiente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
