import { useState, useEffect } from 'react';
import { ShieldCheck, Search, RefreshCw, Trash2, Edit3, Plus, AlertTriangle, Building, Lock } from 'lucide-react';
import { useAuthApi } from '../../config/api';

interface ReferenciaItem {
  _id: string;
  titulo: string;
  contexto: string;
  auditId: string;
  status: string;
  tipo: string;
  orden?: number;
  createdAt?: string;
}

export default function AdminValidacionDirecta() {
  const adminApi = useAuthApi();
  const [items, setItems] = useState<ReferenciaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<ReferenciaItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    titulo: '',
    auditId: '',
    status: '',
    tipo: '',
    contexto: '',
  });

  const fetchItems = () => {
    setLoading(true);
    adminApi.get('/referencias')
      .then(res => {
        const data = res.data.data ?? [];
        setItems(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openEdit = (item: ReferenciaItem) => {
    setEditingItem(item);
    setFormData({
      titulo: item.titulo || '',
      auditId: item.auditId || '',
      status: item.status || '',
      tipo: item.tipo || '',
      contexto: item.contexto || '',
    });
    setFormError('');
  };

  const openNew = () => {
    if (items.length >= 5) {
      alert('La capacidad máxima es de 5 referencias auditadas. Elimina una existente para agregar una nueva.');
      return;
    }
    setEditingItem(null);
    setFormData({
      titulo: '',
      auditId: `REF-${Math.floor(100 + Math.random() * 900)}-2026`,
      status: 'Validado · ' + new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
      tipo: 'General',
      contexto: '',
    });
    setFormError('');
    setIsNewModalOpen(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!formData.titulo || !formData.contexto || !formData.auditId) {
      setFormError('Por favor completa el Título, Código y Contexto.');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Update existing item
        const res = await adminApi.put(`/referencias/${editingItem._id}`, formData);
        if (res.data?.success && res.data.data) {
          setItems(prev => prev.map(i => i._id === editingItem._id ? res.data.data : i));
          setEditingItem(null);
        }
      } else {
        // Create new item (enforces max 5 on backend)
        const res = await adminApi.post('/referencias', formData);
        if (res.data?.success && res.data.data) {
          setItems(prev => [...prev, res.data.data]);
          setIsNewModalOpen(false);
        }
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFormError(msg ?? 'Error al guardar la referencia.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta referencia auditada? Liberará un espacio en la lista de 5.')) return;
    setSaving(true);
    try {
      await adminApi.delete(`/referencias/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      if (editingItem?._id === id) setEditingItem(null);
    } catch {
      setItems(prev => prev.filter(i => i._id !== id));
      if (editingItem?._id === id) setEditingItem(null);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(i => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (i.titulo || '').toLowerCase().includes(term) ||
      (i.auditId || '').toLowerCase().includes(term) ||
      (i.contexto || '').toLowerCase().includes(term) ||
      (i.tipo || '').toLowerCase().includes(term)
    );
  });

  const isFull = items.length >= 5;

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white font-sans pb-16">
      {/* Header / Hero */}
      <div className="p-6 md:p-8 bg-[#0B1F3A] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <ShieldCheck size={13} /> FABRIC · SUPER ADMIN · VALIDACIÓN DIRECTA
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Referencias Auditadas (Validación Directa)
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Gestión de referencias ejecutivas mostradas en la pantalla principal. Límite estricto de máximo 5 referencias auditadas.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0E2747] border border-[#1E3A5F] px-5 py-2.5 rounded-2xl shadow-md shrink-0">
            <div className="text-center px-2">
              <div className="font-serif text-2xl font-bold leading-none text-white">
                {items.length} <span className="text-[#94A3B8] text-sm font-sans">/ 5</span>
              </div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Capacidad Usada</div>
            </div>

            <div className="text-center px-2 border-l border-[#1E3A5F] pl-4">
              {isFull ? (
                <div className="inline-flex items-center gap-1.5 text-amber-400 font-mono text-[10px] font-bold uppercase bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                  <Lock size={12} /> Capacidad Llena
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                  Espacio Disponible ({5 - items.length})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Banner de Aviso de Capacidad (Máximo 5) */}
        {isFull && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 text-xs font-mono text-amber-200">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-400 shrink-0" />
              <span>
                <strong>Límite de capacidad alcanzado (5/5):</strong> Solo se permite tener 5 referencias auditadas registradas. Si deseas agregar una nueva, primero elimina alguna de la lista actual.
              </span>
            </div>
          </div>
        )}

        {/* Buscador y Acción de Crear */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0E2747] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por rol, código, contexto o industria..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E] transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={fetchItems}
              className="px-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Actualizar</span>
            </button>

            <button
              onClick={openNew}
              disabled={isFull}
              className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                isFull
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                  : 'bg-[#C9A96E] text-[#0B1F3A] hover:bg-[#d8b87d] shadow-md'
              }`}
            >
              <Plus size={16} />
              <span>Agregar Referencia</span>
            </button>
          </div>
        </div>

        {/* Tabla de Referencias Auditadas */}
        <div className="rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] bg-[#07192F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#C9A96E]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Referencias Auditadas Mostradas en la Página Principal ({filteredItems.length} / 5)
              </span>
            </div>
            <span className="font-mono text-[9px] text-[#94A3B8] uppercase">
              Colección: referencias · MongoDB Atlas
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center font-mono text-xs text-[#94A3B8] tracking-widest">
                Cargando referencias auditadas desde la BD...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Building size={32} className="mx-auto text-[#1E3A5F]" />
                <div className="font-serif text-base font-bold text-white">Sin referencias auditadas</div>
                <p className="text-xs text-[#94A3B8] font-mono max-w-sm mx-auto">
                  {searchTerm ? 'No se encontraron referencias para la búsqueda.' : 'No hay referencias auditadas cargadas en la BD.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E3A5F] bg-[#07192F]/60 font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Título / Rol Ejecutivo</th>
                    <th className="py-3.5 px-5">Código Audit</th>
                    <th className="py-3.5 px-5">Estado Auditado</th>
                    <th className="py-3.5 px-5">Industria / Tipo</th>
                    <th className="py-3.5 px-5">Contexto y Relevancia</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60 text-xs">
                  {filteredItems.map(item => (
                    <tr
                      key={item._id}
                      onClick={() => openEdit(item)}
                      className="hover:bg-[#123254]/50 transition cursor-pointer group"
                    >
                      <td className="py-4 px-5 font-bold text-white max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[#C9A96E]">🏢</span>
                          <span className="truncate">{item.titulo}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono text-[10px]">
                        <span className="bg-[#07192F] border border-[#1E3A5F] text-[#94A3B8] px-2 py-0.5 rounded uppercase font-bold">
                          {item.auditId}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-mono text-emerald-400 font-bold text-[10px]">
                        ✓ {item.status}
                      </td>

                      <td className="py-4 px-5 font-mono text-[#C9A96E]">
                        {item.tipo}
                      </td>

                      <td className="py-4 px-5 text-[#94A3B8] max-w-sm">
                        <div className="truncate font-sans">{item.contexto}</div>
                        <div className="text-[9px] font-mono text-[#C9A96E]/80 mt-0.5">
                          🛡️ Documentación de Acreditación Firmada & Verificada
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-slate-300 hover:text-white transition rounded-lg hover:bg-slate-700/50"
                            title="Editar referencia"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={saving}
                            className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10"
                            title="Eliminar referencia"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Editar o Crear Referencia */}
      {(editingItem || isNewModalOpen) && (
        <div className="fixed inset-0 bg-[#07192F]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0E2747] border border-[#1E3A5F] rounded-2xl shadow-2xl p-6 md:p-8 space-y-5"
          >
            <div className="border-b border-[#1E3A5F] pb-4 flex justify-between items-center">
              <div>
                <div className="font-mono text-[9px] text-[#C9A96E] tracking-widest uppercase mb-1">
                  FABRIC · VALIDACIÓN DIRECTA
                </div>
                <h3 className="font-serif text-xl font-bold text-white">
                  {editingItem ? 'Editar Referencia Auditada' : 'Agregar Nueva Referencia Auditada'}
                </h3>
              </div>
              <button
                onClick={() => { setEditingItem(null); setIsNewModalOpen(false); }}
                className="w-8 h-8 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center text-lg cursor-pointer transition"
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs rounded-xl">
                {formError}
              </div>
            )}

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                  Título / Rol Ejecutivo *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej. CFO de operadora de centros comerciales (LATAM)"
                  className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                    Código de Auditoría *
                  </label>
                  <input
                    type="text"
                    value={formData.auditId}
                    onChange={e => setFormData({ ...formData, auditId: e.target.value })}
                    placeholder="Ej. REF-APE-2026"
                    className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                    Industria / Tipo *
                  </label>
                  <input
                    type="text"
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                    placeholder="Ej. Retail / Inmobiliario"
                    className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                  Estado Auditado *
                </label>
                <input
                  type="text"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  placeholder="Ej. Validado · Abril 2026"
                  className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                  Contexto y Descripción *
                </label>
                <textarea
                  rows={3}
                  value={formData.contexto}
                  onChange={e => setFormData({ ...formData, contexto: e.target.value })}
                  placeholder="Conciliaciones complejas y reportabilidad multimoneda en Fusion Cloud..."
                  className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => { setEditingItem(null); setIsNewModalOpen(false); }}
                className="px-5 py-2.5 border border-[#1E3A5F] text-[#94A3B8] hover:text-white font-mono text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#C9A96E] hover:bg-[#d8b87d] text-[#0B1F3A] font-mono text-xs font-bold rounded-xl cursor-pointer shadow-md transition"
              >
                {saving ? 'Guardando...' : 'Guardar Referencia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
