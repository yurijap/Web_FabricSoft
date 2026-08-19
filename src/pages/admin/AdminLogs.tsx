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
  const [statusInfo, setStatusInfo] = useState<{
    dbStatus: string;
    apiStatus: string;
    authStatus: string;
  } | null>(null);
  const limit = 50;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargarStatus = async () => {
    try {
      const res = await api.get('/status/admin');
      setStatusInfo(res.data);
    } catch (e) {
      console.error('Error cargando status del sistema', e);
      setStatusInfo({
        dbStatus: 'ERROR',
        apiStatus: 'ERROR',
        authStatus: 'ACTIVO'
      });
    }
  };

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
      await cargarStatus();
    } catch {
      setError('Error cargando logs.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    cargar(filter, page);
    cargarStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicarFiltro = (cat: string) => {
    setFilter(cat);
    setPage(1);
    cargar(cat, 1);
  };

  // Auto-refresh cada 30 s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      cargar(filter, page);
      cargarStatus();
    }, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [filter, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white font-sans pb-12">
      {/* Header */}
      <div className="p-6 md:p-8 bg-[#0B1F3A] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              FABRIC · ADMIN · LOGS
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">Bitácora inmutable</h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Registro no editable · {total} logs en el sistema. Autorefresco cada 30 segundos.
            </p>

            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-[#0E2747] border border-[#1E3A5F] px-3 py-1.5 rounded-xl text-xs">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#94A3B8]">MongoDB:</span>
                <span className={`inline-flex items-center gap-1.5 font-bold font-mono text-[10px] ${
                  statusInfo?.dbStatus === 'CONECTADO' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    statusInfo?.dbStatus === 'CONECTADO' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`} />
                  {statusInfo?.dbStatus || 'CARGANDO'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-[#0E2747] border border-[#1E3A5F] px-3 py-1.5 rounded-xl text-xs">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#94A3B8]">API Gateway:</span>
                <span className={`inline-flex items-center gap-1.5 font-bold font-mono text-[10px] ${
                  statusInfo?.apiStatus === 'OPERATIVO' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    statusInfo?.apiStatus === 'OPERATIVO' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                  }`} />
                  {statusInfo?.apiStatus || 'CARGANDO'}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-[#0E2747] border border-[#1E3A5F] px-3 py-1.5 rounded-xl text-xs">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#94A3B8]">Clerk Auth:</span>
                <span className="inline-flex items-center gap-1.5 font-bold font-mono text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACTIVO
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => cargar(filter, page)}
              className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] border border-[#1E3A5F] bg-[#123254] px-4 py-2 text-[#94A3B8] hover:border-[#C9A96E] hover:text-white transition rounded-xl cursor-pointer"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap border-b border-[#1E3A5F] bg-[#07192F] p-4 px-6 md:px-8">
        {CATS.map(c => (
          <button
            key={c}
            onClick={() => aplicarFiltro(c)}
            className={`font-mono text-[10px] font-bold uppercase tracking-[0.16em] px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
              filter === c
                ? 'border border-[#C9A96E] bg-[#C9A96E]/15 text-[#C9A96E]'
                : 'border border-[#1E3A5F] bg-[#0E2747] text-[#94A3B8] hover:border-[#1E3A5F] hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="p-6 md:p-8">
        {loading ? (
          <div style={{ ...S, fontSize: 11, color: '#94A3B8', padding: '60px 0', textAlign: 'center' }}>Cargando logs...</div>
        ) : error ? (
          <div style={{ ...S, fontSize: 11, color: '#B85450', padding: '60px 0', textAlign: 'center' }}>{error}</div>
        ) : logs.length === 0 ? (
          <div style={{ ...S, fontSize: 11, color: '#94A3B8', padding: '60px 0', textAlign: 'center' }} className="bg-[#0E2747] border border-[#1E3A5F] rounded-2xl p-8">
            Sin registros. Los logs aparecen cuando hay actividad en el sistema.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-lg">
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E3A5F', background: '#07192F' }}>
                    {['Timestamp', 'Acción', 'Detalle', 'Autor', 'Hash', 'Cat.', 'Estado'].map(h => (
                      <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 8, fontFamily: 'var(--mono)', letterSpacing: '0.2em', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]">
                  {logs.map(entry => (
                    <tr key={entry._id} className="transition hover:bg-[#123254]/50">
                      <td style={{ ...S, padding: '14px 16px', fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {formatTs(entry.createdAt)}
                      </td>
                      <td style={{ ...S, padding: '14px 16px', fontSize: 11, fontWeight: 600, color: entry.status === 'ERR' ? '#B85450' : entry.status === 'WARN' ? '#fbbf24' : '#FFFFFF', maxWidth: 280 }}>
                        {entry.accion}
                      </td>
                      <td style={{ ...S, padding: '14px 16px', fontSize: 10, color: '#94A3B8', maxWidth: 200 }}>
                        {entry.detalle || '—'}
                      </td>
                      <td style={{ ...S, padding: '14px 16px', fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        {entry.autor}
                      </td>
                      <td style={{ ...S, padding: '14px 16px', fontSize: 10, color: '#94A3B8', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.06em' }}>
                        {shortId(entry._id)}
                      </td>
                      <td style={{ ...S, padding: '14px 16px', fontSize: 9, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {entry.categoria}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          ...S, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 4,
                          color: STATUS_COLOR[entry.status] ?? '#4ade80',
                          border: `1px solid ${STATUS_COLOR[entry.status] ?? '#4ade80'}44`,
                          background: `${STATUS_COLOR[entry.status] ?? '#4ade80'}15`,
                        }}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {logs.map(entry => (
                <div key={entry._id} className="rounded-xl border border-[#1E3A5F] bg-[#0E2747] p-4 shadow-md space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span style={{ ...S }} className="text-[10px] text-[#94A3B8] block mb-1">{formatTs(entry.createdAt)}</span>
                      <h3 className="font-bold text-sm" style={{ ...S, color: entry.status === 'ERR' ? '#B85450' : entry.status === 'WARN' ? '#fbbf24' : '#FFFFFF' }}>
                        {entry.accion}
                      </h3>
                      <p style={{ ...S }} className="text-xs text-[#94A3B8] mt-0.5">Por: {entry.autor}</p>
                    </div>
                    <span style={{
                      ...S, fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
                      color: STATUS_COLOR[entry.status] ?? '#4ade80',
                      border: `1px solid ${STATUS_COLOR[entry.status] ?? '#4ade80'}44`,
                      background: `${STATUS_COLOR[entry.status] ?? '#4ade80'}15`,
                      height: 'fit-content'
                    }}>
                      {entry.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#94A3B8] border-t border-[#1E3A5F] pt-2">
                    <p style={{ ...S }}>{entry.detalle || 'Sin detalles'}</p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono border-t border-[#1E3A5F] pt-2 text-[#94A3B8]">
                    <span>ID: {shortId(entry._id)}</span>
                    <span className="uppercase tracking-wider text-[#C9A96E]">{entry.categoria}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between border border-[#1E3A5F] bg-[#0E2747] p-4 px-6 rounded-2xl mt-6 shadow-md">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#94A3B8]">
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
                  className="group flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#94A3B8] hover:text-[#C9A96E] disabled:opacity-30 disabled:hover:text-[#94A3B8] disabled:cursor-not-allowed cursor-pointer transition"
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
                  className="group flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#94A3B8] hover:text-[#C9A96E] disabled:opacity-30 disabled:hover:text-[#94A3B8] disabled:cursor-not-allowed cursor-pointer transition"
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
