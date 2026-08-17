import { useState, useEffect } from 'react';
import { FileText, Search, RefreshCw, Trash2, CheckCircle2, ShieldCheck, Mail, User, BookOpen } from 'lucide-react';
import { useAuthApi } from '../../config/api';

interface DoctrinaRequestItem {
  _id: string;
  nombre: string;
  email: string;
  empresa: string;
  cargo?: string;
  status: 'Solicitado' | 'Enviado' | string;
  createdAt: string;
}

export default function AdminDoctrina() {
  const adminApi = useAuthApi();
  const [requests, setRequests] = useState<DoctrinaRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<DoctrinaRequestItem | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchRequests = () => {
    setLoading(true);
    adminApi.get('/admin/doctrina')
      .then(res => {
        const data = res.data.data ?? [];
        setRequests(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setSaving(true);
    try {
      await adminApi.patch(`/admin/doctrina/${id}/status`, { status: newStatus }).catch(() => null);
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
      if (selected?._id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null);
    } catch {
      setRequests(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro de la base de datos?')) return;
    setSaving(true);
    try {
      await adminApi.delete(`/admin/doctrina/${id}`).catch(() => null);
      setRequests(prev => prev.filter(r => r._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch {
      setRequests(prev => prev.filter(r => r._id !== id));
      if (selected?._id === id) setSelected(null);
    } finally {
      setSaving(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (r.nombre || '').toLowerCase().includes(term) ||
      (r.empresa || '').toLowerCase().includes(term) ||
      (r.email || '').toLowerCase().includes(term) ||
      (r.cargo || '').toLowerCase().includes(term)
    );
  });

  const fmtDate = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const solicitadosCount = requests.filter(r => (r.status || '').toLowerCase() === 'solicitado').length;
  const enviadosCount = requests.filter(r => (r.status || '').toLowerCase() === 'enviado').length;

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white font-sans pb-16">
      {/* Header / Hero */}
      <div className="p-6 md:p-8 bg-[#0B1F3A] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <ShieldCheck size={13} /> FABRIC · SUPER ADMIN · SOLICITUDES DE DOCTRINA
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Solicitudes de Doctrina Detallada
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Registro persistente en MongoDB Atlas de usuarios que solicitaron la doctrina detallada.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0E2747] border border-[#1E3A5F] px-5 py-2.5 rounded-2xl shadow-md shrink-0">
            <div className="text-center px-2">
              <div className="font-serif text-2xl font-bold leading-none text-white">{requests.length}</div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Total Solicitudes</div>
            </div>
            <div className="text-center px-2">
              <div className="font-serif text-2xl font-bold leading-none text-[#C9A96E]">{solicitadosCount}</div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Pendientes</div>
            </div>
            <div className="text-center px-2">
              <div className="font-serif text-2xl font-bold leading-none text-[#4ade80]">{enviadosCount}</div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Enviados</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Buscador */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0E2747] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, empresa, email..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E] transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={fetchRequests}
              className="px-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar BD</span>
            </button>
          </div>
        </div>

        {/* Tabla Activa */}
        <div className="rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] bg-[#07192F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#C9A96E]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Tabla de Registrados ({filteredRequests.length})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center font-mono text-xs text-[#94A3B8] tracking-widest">
                Cargando registros desde MongoDB Atlas...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <BookOpen size={32} className="mx-auto text-[#1E3A5F]" />
                <div className="font-serif text-base font-bold text-white">Sin registros en esta tabla</div>
                <p className="text-xs text-[#94A3B8] font-mono max-w-sm mx-auto">
                  {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay solicitudes registradas todavía.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E3A5F] bg-[#07192F]/60 font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Solicitante</th>
                    <th className="py-3.5 px-5">Empresa / Cargo</th>
                    <th className="py-3.5 px-5">Email Corporativo</th>
                    <th className="py-3.5 px-5">Fecha</th>
                    <th className="py-3.5 px-5">Estado</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60 text-xs">
                  {filteredRequests.map(r => {
                    const isEnviado = (r.status || '').toLowerCase() === 'enviado';
                    return (
                      <tr
                        key={r._id}
                        onClick={() => setSelected(r)}
                        className="hover:bg-[#123254]/50 transition cursor-pointer group"
                      >
                        <td className="py-4 px-5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-[#C9A96E] shrink-0" />
                            <span className="truncate">{r.nombre}</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-[#94A3B8]">
                          <div className="font-mono">
                            <span className="text-white font-medium">{r.empresa}</span>
                            {r.cargo && <span className="text-[#94A3B8] block text-[10px]">{r.cargo}</span>}
                          </div>
                        </td>

                        <td className="py-4 px-5 font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Mail size={12} className="text-[#94A3B8] shrink-0" />
                            <span className="truncate">{r.email}</span>
                          </div>
                        </td>

                        <td className="py-4 px-5 font-mono text-[10px] text-[#94A3B8]">
                          {fmtDate(r.createdAt)}
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border inline-block ${
                              isEnviado
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            }`}
                          >
                            {r.status || 'Solicitado'}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {!isEnviado && (
                              <button
                                onClick={() => handleStatusChange(r._id, 'Enviado')}
                                disabled={saving}
                                className="px-2.5 py-1 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-mono text-[9px] font-bold uppercase transition"
                                title="Marcar como enviado"
                              >
                                Marcar Enviado
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(r._id)}
                              disabled={saving}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10"
                              title="Eliminar registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Slide-out Lateral de Detalle */}
      {selected && (
        <div
          className="fixed inset-0 bg-[#07192F]/80 backdrop-blur-xs z-50 flex justify-end"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0E2747] border-l border-[#1E3A5F] shadow-2xl p-6 md:p-8 overflow-y-auto min-h-screen space-y-6"
          >
            <div className="border-b border-[#1E3A5F] pb-5 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono text-[9px] text-[#C9A96E] tracking-widest uppercase mb-1">
                    Ficha de Solicitud de Doctrina Detallada
                  </div>
                  <div className="font-serif text-2xl font-bold text-white">{selected.nombre}</div>
                  <div className="font-mono text-xs text-[#94A3B8] mt-0.5">{selected.empresa}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center text-lg cursor-pointer transition"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C9A96E] mb-2">
                Datos Capturados
              </div>
              {([
                ['Nombre completo', selected.nombre],
                ['Empresa', selected.empresa],
                ['Email corporativo', selected.email],
                ['Cargo / Puesto', selected.cargo || '—'],
                ['Estado actual', selected.status || 'Solicitado'],
                ['Fecha de registro', fmtDate(selected.createdAt)],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2.5 border-b border-[#1E3A5F]/60 text-xs font-mono">
                  <span className="text-[#94A3B8] uppercase text-[9px]">{k}</span>
                  <span className="text-white text-right break-all max-w-[240px] font-semibold">{v}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-3">
              {(selected.status || '').toLowerCase() !== 'enviado' && (
                <button
                  onClick={() => handleStatusChange(selected._id, 'Enviado')}
                  disabled={saving}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Marcar como Enviado
                </button>
              )}
              <button
                onClick={() => handleDelete(selected._id)}
                disabled={saving}
                className="px-4 py-3 border border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
