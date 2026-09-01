import { useState, useEffect } from 'react';
import { FileText, Search, RefreshCw, Trash2, ShieldCheck, Mail, User, BookOpen, Send, Tag, Check, Download } from 'lucide-react';
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

interface FileItem {
  _id: string;
  nombreOriginal: string;
  tipoMime: string;
  tamanoBytes: number;
  seccionTag: string;
  descripcion?: string;
  createdAt: string;
}

const SECCIONES_ETIQUETAS = [
  { id: 'doctrina', label: 'Doctrina' },
  { id: 'paper caso ancla', label: 'Paper Caso Ancla' },
  { id: 'papers casos de exito', label: 'Papers Casos de éxito' },
  { id: 'papers investigacion', label: 'Papers Investigación' },
];

export default function AdminDoctrina() {
  const adminApi = useAuthApi();
  const [requests, setRequests] = useState<DoctrinaRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<DoctrinaRequestItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal para seleccionar y enviar documento
  const [sendModalRequest, setSendModalRequest] = useState<DoctrinaRequestItem | null>(null);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedTagTab, setSelectedTagTab] = useState<string>('doctrina');
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [sendingFile, setSendingFile] = useState(false);
  const [sendNotice, setSendNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const fetchFiles = () => {
    setLoadingFiles(true);
    adminApi.get('/files')
      .then(res => {
        const data = res.data.data ?? [];
        setAllFiles(data);
      })
      .catch(() => {})
      .finally(() => setLoadingFiles(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openSendModal = (reqItem: DoctrinaRequestItem) => {
    setSendModalRequest(reqItem);
    setSelectedFileId('');
    setSendNotice(null);
    fetchFiles();
  };

  const closeSendModal = () => {
    setSendModalRequest(null);
    setSelectedFileId('');
    setSendNotice(null);
  };

  const handleSendDocument = async () => {
    if (!sendModalRequest || !selectedFileId) return;
    setSendingFile(true);
    setSendNotice(null);
    try {
      const res = await adminApi.post(`/admin/doctrina/${sendModalRequest._id}/send-file`, {
        fileId: selectedFileId
      });

      const message = res.data.message || 'Documento enviado con éxito.';
      setSendNotice({ type: 'success', message });

      // Actualizar tabla localmente
      setRequests(prev => prev.map(r => r._id === sendModalRequest._id ? { ...r, status: 'Enviado' } : r));
      if (selected?._id === sendModalRequest._id) {
        setSelected(prev => prev ? { ...prev, status: 'Enviado' } : null);
      }

      setTimeout(() => {
        closeSendModal();
      }, 1800);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || 'Error al enviar el documento.';
      setSendNotice({ type: 'error', message: errorMsg });
    } finally {
      setSendingFile(false);
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

  const fmtSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const solicitadosCount = requests.filter(r => (r.status || '').toLowerCase() === 'solicitado').length;
  const enviadosCount = requests.filter(r => (r.status || '').toLowerCase() === 'enviado').length;

  const currentTagFiles = allFiles.filter(f => (f.seccionTag || '').toLowerCase() === selectedTagTab.toLowerCase());

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
              Envío de documentos personalizados y registro persistente de solicitudes.
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
                            <button
                              onClick={() => openSendModal(r)}
                              className="px-3 py-1.5 rounded-xl border border-[#C9A96E]/50 bg-[#C9A96E]/10 hover:bg-[#C9A96E] text-[#C9A96E] hover:text-[#07192F] font-mono text-[10px] font-bold uppercase transition flex items-center gap-1.5 cursor-pointer shadow-md"
                              title="Enviar documento por correo"
                            >
                              <Send size={12} />
                              <span>Enviar Documento</span>
                            </button>

                            <button
                              onClick={() => handleDelete(r._id)}
                              disabled={saving}
                              className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10 cursor-pointer"
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
              <button
                onClick={() => {
                  const reqItem = selected;
                  setSelected(null);
                  openSendModal(reqItem);
                }}
                className="flex-1 py-3 bg-[#C9A96E] hover:bg-[#b5955a] text-[#07192F] font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <Send size={15} /> Enviar Documento
              </button>
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

      {/* Modal Emergente para Selección y Envío de Documentos por Etiqueta */}
      {sendModalRequest && (
        <div
          className="fixed inset-0 bg-[#07192F]/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-8"
          onClick={closeSendModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-3xl bg-[#0E2747] border border-[#1E3A5F] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
          >
            {/* Cabecera del Modal */}
            <div className="p-4 md:px-6 bg-[#07192F] border-b border-[#1E3A5F] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/30 text-[#C9A96E]">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    Enviar Documento por Correo
                  </h3>
                  <p className="font-mono text-xs text-[#94A3B8]">
                    Destinatario: <span className="text-white font-bold">{sendModalRequest.nombre}</span> ({sendModalRequest.email})
                  </p>
                </div>
              </div>

              <button
                onClick={closeSendModal}
                className="w-8 h-8 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center text-lg cursor-pointer transition"
              >
                ×
              </button>
            </div>

            {/* Pestañas de Etiquetas de Secciones */}
            <div className="p-4 bg-[#0B1F3A] border-b border-[#1E3A5F] flex items-center gap-2 overflow-x-auto">
              {SECCIONES_ETIQUETAS.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setSelectedTagTab(sec.id);
                    setSelectedFileId('');
                  }}
                  className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer border ${
                    selectedTagTab === sec.id
                      ? 'bg-[#C9A96E] text-[#07192F] border-[#C9A96E] shadow-md'
                      : 'bg-[#0E2747] text-[#94A3B8] border-[#1E3A5F] hover:text-white'
                  }`}
                >
                  <Tag size={13} />
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>

            {/* Notificaciones */}
            {sendNotice && (
              <div
                className={`m-4 p-3 rounded-xl font-mono text-xs border ${
                  sendNotice.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                {sendNotice.message}
              </div>
            )}

            {/* Lista de Archivos de la Etiqueta Seleccionada */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-[#0B1F3A]">
              <div className="font-mono text-xs text-[#94A3B8] mb-2 flex items-center justify-between">
                <span>Selecciona el archivo para adjuntar en el correo:</span>
                <span className="text-[#C9A96E] font-bold">Total en [{selectedTagTab}]: {currentTagFiles.length}</span>
              </div>

              {loadingFiles ? (
                <div className="p-12 text-center font-mono text-xs text-[#94A3B8] tracking-widest">
                  Cargando archivos disponibles...
                </div>
              ) : currentTagFiles.length === 0 ? (
                <div className="p-12 text-center border border-dashed border-[#1E3A5F] rounded-2xl space-y-2">
                  <FileText size={32} className="mx-auto text-[#1E3A5F]" />
                  <div className="font-serif text-sm font-bold text-white">
                    No hay archivos en la categoría [{selectedTagTab}]
                  </div>
                  <p className="font-mono text-xs text-[#94A3B8]">
                    Puedes subir archivos para esta etiqueta en el menú <span className="text-[#C9A96E]">Control de Documentos</span>.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {currentTagFiles.map(file => {
                    const isSelected = selectedFileId === file._id;
                    return (
                      <div
                        key={file._id}
                        onClick={() => setSelectedFileId(file._id)}
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-[#C9A96E]/15 border-[#C9A96E] shadow-lg'
                            : 'bg-[#0E2747] border-[#1E3A5F] hover:border-[#1E3A5F]/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#C9A96E] border-[#C9A96E] text-[#07192F]'
                                : 'border-[#1E3A5F] bg-[#07192F]'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <FileText size={18} className={isSelected ? 'text-[#C9A96E]' : 'text-slate-400'} />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-white truncate">{file.nombreOriginal}</div>
                            {file.descripcion && (
                              <div className="text-[11px] text-[#94A3B8] truncate">{file.descripcion}</div>
                            )}
                          </div>
                        </div>

                        <div className="text-right font-mono text-[10px] text-[#94A3B8] shrink-0">
                          <div>{fmtSize(file.tamanoBytes)}</div>
                          <div>{fmtDate(file.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="p-4 md:px-6 bg-[#07192F] border-t border-[#1E3A5F] flex items-center justify-between">
              <button
                onClick={closeSendModal}
                className="px-4 py-2 bg-[#0E2747] border border-[#1E3A5F] hover:bg-[#123254] text-slate-300 font-mono text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                onClick={handleSendDocument}
                disabled={!selectedFileId || sendingFile}
                className="px-6 py-2.5 bg-[#C9A96E] hover:bg-[#b5955a] text-[#07192F] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingFile ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Enviando Correo...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Enviar Documento a {sendModalRequest.email}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

