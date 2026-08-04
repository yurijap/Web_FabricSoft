import { useEffect, useState, useRef } from 'react';
import { useAuthApi } from '../../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogEntry {
  _id: string;
  accion: string;
  categoria: string;
  autor: string;
  status: 'OK' | 'WARN' | 'ERR';
  detalle: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  OK:   '#4ade80',
  WARN: '#fbbf24',
  ERR:  '#B85450',
};

const CATS = ['Todas', 'Leads', 'Papers', 'Office Hours', 'Research Letters', 'NDA', 'Capacidad', 'Sistema'];

const S = { fontFamily: 'var(--mono, "JetBrains Mono", monospace)' };

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function shortId(id: string) {
  return id.slice(-12);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLogs() {
  const api = useAuthApi();
  const [logs, setLogs]       = useState<LogEntry[]>([]);
  const [filter, setFilter]   = useState('Todas');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const limit = 50;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargar = async (cat: string, p: number) => {
    setLoading(true);
    setError('');
    try {
      const catParam = cat !== 'Todas' ? `categoria=${encodeURIComponent(cat)}` : '';
      const pageParam = `page=${p}`;
      const limitParam = `limit=${limit}`;
      const query = [catParam, pageParam, limitParam].filter(Boolean).join('&');
      const res = await api.get(`/logs/admin?${query}`);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setError('Error cargando logs.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    cargar(filter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltro = (cat: string) => {
    setFilter(cat);
    setPage(1);
    cargar(cat, 1);
  };

  // Auto-refresh cada 30 s
  useEffect(() => {
    timerRef.current = setInterval(() => cargar(filter, page), 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [filter, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="fabric-admin-page">
      {/* Header */}
      <div className="fabric-admin-hero">
        <div className="fabric-admin-hero-inner">
          <div>
            <div className="fabric-admin-eyebrow">FABRIC · ADMIN · LOGS</div>
            <h1 className="fabric-admin-title">Bitácora inmutable</h1>
            <div className="fabric-admin-subtitle">Registro no editable · {total} logs en el sistema. Autorefresco cada 30 segundos.</div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => cargar(filter, page)}
              className="font-mono text-[9px] uppercase tracking-[0.18em] border border-[#252525] px-4 py-2 text-[#8A8A8A] hover:border-[#C9A96E] hover:text-[#C9A96E] transition rounded-sm cursor-pointer"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap border-b border-[#1a1a1a] p-4 px-6 md:px-9">
        {CATS.map(c => (
          <button
            key={c}
            onClick={() => aplicarFiltro(c)}
            className={`font-mono text-[9px] uppercase tracking-[0.16em] px-3.5 py-1.5 rounded-sm transition-all duration-300 cursor-pointer ${
              filter === c
                ? 'border border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                : 'border border-[#252525] bg-transparent text-[#5A5A5A] hover:border-[#C9A96E]/50 hover:text-[#C9A96E]/80'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="p-4 px-6 md:px-9 pb-9">
        {loading ? (
          <div style={{ ...S, fontSize: 10, color: '#3A3A3A', padding: '60px 0', textAlign: 'center' }}>Cargando...</div>
        ) : error ? (
          <div style={{ ...S, fontSize: 10, color: '#E57373', padding: '60px 0', textAlign: 'center' }}>{error}</div>
        ) : logs.length === 0 ? (
          <div style={{ ...S, fontSize: 10, color: '#3A3A3A', padding: '60px 0', textAlign: 'center' }}>
            Sin registros. Los logs aparecen cuando hay actividad en el sistema.
          </div>
        ) : (
          <>
            <div className="admin-logs-table-wrap">
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                    {['Timestamp', 'Acción', 'Detalle', 'Autor', 'Hash', 'Cat.', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 7, letterSpacing: '0.2em', color: '#3A3A3A', textTransform: 'uppercase', fontWeight: 400, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(entry => (
                    <tr key={entry._id} style={{ borderBottom: '1px solid #0e0e0e' }}>
                      <td style={{ ...S, padding: '12px 14px', fontSize: 9, color: '#5A5A5A', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {formatTs(entry.createdAt)}
                      </td>
                      <td style={{ ...S, padding: '12px 14px', fontSize: 10, color: entry.status === 'ERR' ? '#B85450' : entry.status === 'WARN' ? '#fbbf24' : '#F5F5F5', maxWidth: 280 }}>
                        {entry.accion}
                      </td>
                      <td style={{ ...S, padding: '12px 14px', fontSize: 9, color: '#5A5A5A', maxWidth: 200 }}>
                        {entry.detalle || '—'}
                      </td>
                      <td style={{ ...S, padding: '12px 14px', fontSize: 9, color: '#8A8A8A', whiteSpace: 'nowrap' }}>
                        {entry.autor}
                      </td>
                      <td style={{ ...S, padding: '12px 14px', fontSize: 9, color: '#2A2A2A', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.06em' }}>
                        {shortId(entry._id)}
                      </td>
                      <td style={{ ...S, padding: '12px 14px', fontSize: 8, color: '#5A5A5A', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {entry.categoria}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          ...S, fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '3px 8px',
                          color: STATUS_COLOR[entry.status] ?? '#4ade80',
                          border: `1px solid ${STATUS_COLOR[entry.status] ?? '#4ade80'}33`,
                          background: `${STATUS_COLOR[entry.status] ?? '#4ade80'}10`,
                        }}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-logs-cards">
              {logs.map(entry => (
                <div key={entry._id} className="admin-logs-card">
                  <div className="admin-logs-card-header">
                    <div>
                      <span className="admin-logs-card-date">{formatTs(entry.createdAt)}</span>
                      <h3 className="admin-logs-card-action" style={{ color: entry.status === 'ERR' ? '#B85450' : entry.status === 'WARN' ? '#fbbf24' : '#F5F5F5' }}>
                        {entry.accion}
                      </h3>
                      <p className="admin-logs-card-autor">Por: {entry.autor}</p>
                    </div>
                    <span style={{
                      ...S, fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '3px 8px',
                      color: STATUS_COLOR[entry.status] ?? '#4ade80',
                      border: `1px solid ${STATUS_COLOR[entry.status] ?? '#4ade80'}33`,
                      background: `${STATUS_COLOR[entry.status] ?? '#4ade80'}10`,
                      height: 'fit-content'
                    }}>
                      {entry.status}
                    </span>
                  </div>

                  <div className="admin-logs-card-body">
                    <p className="admin-logs-card-detail">{entry.detalle || 'Sin detalles'}</p>
                  </div>

                  <div className="admin-logs-card-footer">
                    <span className="admin-logs-card-hash">ID: {shortId(entry._id)}</span>
                    <span className="admin-logs-card-cat">{entry.categoria}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between border-t border-[#2A2A2A] bg-[#111] p-4 px-6 mt-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#F5F5F5]/40">
                Página <span className="text-[#C9A96E] font-bold">{page}</span> de <span className="text-[#C9A96E] font-bold">{totalPages}</span>
              </span>
              <div className="flex gap-6">
                <button
                  disabled={page === 1}
                  onClick={() => {
                    const next = Math.max(1, page - 1);
                    setPage(next);
                    cargar(filter, next);
                  }}
                  className="group flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F5F5]/50 transition-colors hover:text-[#C9A96E] disabled:opacity-20 disabled:hover:text-[#F5F5F5]/50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="transition-transform duration-300 group-hover:-translate-x-0.5">←</span>
                  <span>Anterior</span>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    const next = Math.min(totalPages, page + 1);
                    setPage(next);
                    cargar(filter, next);
                  }}
                  className="group flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#F5F5F5]/50 transition-colors hover:text-[#C9A96E] disabled:opacity-20 disabled:hover:text-[#F5F5F5]/50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Siguiente</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
