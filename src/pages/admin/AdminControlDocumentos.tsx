import { useState, useEffect, useRef } from 'react';
import { FileText, Search, RefreshCw, Trash2, ShieldCheck, Upload, Download, Tag, HardDrive, Eye } from 'lucide-react';
import { useAuthApi } from '../../config/api';

interface FileItem {
  _id: string;
  nombreOriginal: string;
  tipoMime: string;
  tamanoBytes: number;
  seccionTag: string;
  descripcion?: string;
  subidoPor?: string;
  createdAt: string;
}

const SECCIONES = [
  { id: 'doctrina', label: 'Doctrina' },
  { id: 'paper caso ancla', label: 'Paper Caso Ancla' },
  { id: 'papers casos de exito', label: 'Papers Casos de éxito' },
  { id: 'papers investigacion', label: 'Papers Investigación' },
];

export default function AdminControlDocumentos() {
  const adminApi = useAuthApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeccion, setSelectedSeccion] = useState('todos');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  // Formulario Carga de Archivo
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetTag, setTargetTag] = useState('doctrina');
  const [descripcion, setDescripcion] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFiles = () => {
    setLoading(true);
    const url = selectedSeccion === 'todos' ? '/files' : `/files?seccionTag=${selectedSeccion}`;
    adminApi.get(url)
      .then(res => {
        const data = res.data.data ?? [];
        setFiles(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedSeccion]);


  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Por favor selecciona un archivo.' });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('archivo', selectedFile);
    formData.append('seccionTag', targetTag);
    formData.append('descripcion', descripcion);
    formData.append('subidoPor', 'Administrador');

    try {
      await adminApi.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus({ type: 'success', message: `Archivo "${selectedFile.name}" subido con éxito a la sección [${targetTag}].` });
      setSelectedFile(null);
      setDescripcion('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchFiles();
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Error al subir el archivo.';
      setUploadStatus({ type: 'error', message: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el archivo "${nombre}"?`)) return;
    try {
      await adminApi.delete(`/files/${id}?permanent=true`);
      setFiles(prev => prev.filter(f => f._id !== id));
    } catch {
      alert('Error al eliminar el archivo');
    }
  };

  const filteredFiles = files.filter(f => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (f.nombreOriginal || '').toLowerCase().includes(term) ||
      (f.seccionTag || '').toLowerCase().includes(term) ||
      (f.descripcion || '').toLowerCase().includes(term) ||
      (f.subidoPor || '').toLowerCase().includes(term)
    );
  });

  const fmtSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fmtDate = (d?: string) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return d;
    }
  };

  const getDownloadUrl = (id: string, download = false) => {
    const base = `${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/files/${id}/download`;
    return download ? `${base}?download=true` : base;
  };

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white p-6 md:p-8 space-y-6 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E3A5F] pb-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
            <ShieldCheck size={13} /> FABRIC · CONTROL DE DOCUMENTOS
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-white tracking-wide">
            Control de Documentos
          </h1>
          <p className="font-mono text-xs text-[#94A3B8] mt-1">
            Gestión centralizada de archivos para las secciones del sistema
          </p>
        </div>
      </div>

      <div className="bg-[#0E2747] border border-[#1E3A5F] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-[#1E3A5F] pb-3">
          <Upload className="text-[#C9A96E]" size={18} />
          <h2 className="font-serif text-lg font-bold text-white">Subir Nuevo Documento</h2>
        </div>

        {uploadStatus && (
          <div className={`p-3 rounded-xl text-xs font-mono border ${uploadStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
            {uploadStatus.message}
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Seleccionar Archivo</label>
              <input ref={fileInputRef} type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="w-full text-xs text-slate-300 font-mono file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-[#1E3A5F] file:text-white hover:file:bg-[#C9A96E] hover:file:text-[#07192F] transition cursor-pointer" />
            </div>
            <div>
              <label className="block font-mono text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Etiqueta de Sección</label>
              <select value={targetTag} onChange={e => setTargetTag(e.target.value)} className="w-full bg-[#07192F] border border-[#1E3A5F] text-white rounded-xl px-4 py-2 text-xs font-mono focus:outline-none focus:border-[#C9A96E] transition">
                {SECCIONES.map(sec => <option key={sec.id} value={sec.id}>{sec.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-mono text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
            <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Ej. Documentación legal 2024..." className="w-full bg-[#07192F] border border-[#1E3A5F] text-white placeholder:text-[#94A3B8] rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-[#C9A96E] transition" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={uploading || !selectedFile} className="px-6 py-2.5 bg-[#C9A96E] hover:bg-[#b5955a] text-[#07192F] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50">
              {uploading ? <><RefreshCw size={14} className="animate-spin" /> <span>Subiendo...</span></> : <><Upload size={14} /> <span>Subir</span></>}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button onClick={() => setSelectedSeccion('todos')} className={`px-4 py-2 rounded-xl font-mono text-xs font-bold whitespace-nowrap transition cursor-pointer border ${selectedSeccion === 'todos' ? 'bg-[#C9A96E] text-[#07192F] border-[#C9A96E]' : 'bg-[#0E2747] text-[#94A3B8] border-[#1E3A5F]'}`}>Todas</button>
          {SECCIONES.map(sec => (
            <button key={sec.id} onClick={() => setSelectedSeccion(sec.id)} className={`px-4 py-2 rounded-xl font-mono text-xs font-bold whitespace-nowrap transition flex items-center gap-2 cursor-pointer border ${selectedSeccion === sec.id ? 'bg-[#C9A96E] text-[#07192F] border-[#C9A96E]' : 'bg-[#0E2747] text-[#94A3B8] border-[#1E3A5F]'}`}>
              <Tag size={13} /> <span>{sec.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0E2747] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E]" />
          </div>
          <button onClick={fetchFiles} className="px-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> <span>Actualizar</span>
          </button>
        </div>

        <div className="rounded-2xl border border-[#1E3A5F] bg-[#0E2747] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1E3A5F] bg-[#07192F]/60 font-mono text-[9px] text-[#94A3B8] uppercase">
                <th className="py-3.5 px-5">Archivo</th>
                <th className="py-3.5 px-5">Sección</th>
                <th className="py-3.5 px-5">Tamaño</th>
                <th className="py-3.5 px-5">Fecha</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A5F]">
              {filteredFiles.map(f => (
                <tr key={f._id} className="hover:bg-[#123254]/50 text-xs">
                  <td className="py-4 px-5 font-bold">{f.nombreOriginal}</td>
                  <td className="py-4 px-5"><span className="px-2 py-1 rounded bg-[#C9A96E]/10 text-[#C9A96E]">{f.seccionTag}</span></td>
                  <td className="py-4 px-5">{fmtSize(f.tamanoBytes)}</td>
                  <td className="py-4 px-5">{fmtDate(f.createdAt)}</td>
                  <td className="py-4 px-5 text-right flex justify-end gap-2">
                    <button onClick={() => setPreviewFile(f)} className="text-sky-400 p-1"><Eye size={14} /></button>
                    <a href={getDownloadUrl(f._id, true)} className="text-emerald-400 p-1"><Download size={14} /></a>
                    <button onClick={() => handleDeleteFile(f._id, f.nombreOriginal)} className="text-[#F87171] p-1"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 bg-[#07192F]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-5xl h-[85vh] bg-[#0E2747] border border-[#1E3A5F] rounded-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[#1E3A5F] flex justify-between items-center">
              <h3 className="font-bold truncate">{previewFile.nombreOriginal}</h3>
              <button onClick={() => setPreviewFile(null)} className="text-2xl">×</button>
            </div>
            <div className="flex-1 bg-white">
              <iframe src={getDownloadUrl(previewFile._id)} className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
