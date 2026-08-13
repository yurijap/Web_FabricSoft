import { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, Edit3, Plus, AlertTriangle, Calendar, Sliders, Save, PlusCircle } from 'lucide-react';
import { useAuthApi } from '../../config/api';

interface QuarterItem {
  _id: string;
  quarter: string;
  status: string;
  label: string;
  description: string;
  deadline: string;
  orden?: number;
  createdAt?: string;
}

export default function AdminWaitlist() {
  const adminApi = useAuthApi();
  const [items, setItems] = useState<QuarterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<QuarterItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    quarter: '',
    status: 'upcoming',
    label: 'Próximo',
    description: 'Aplicaciones desde 01 sept',
    deadline: 'Próximo',
  });

  const fetchItems = () => {
    setLoading(true);
    adminApi.get('/waitlist-quarters')
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

  const openEdit = (item: QuarterItem) => {
    setEditingItem(item);
    setFormData({
      quarter: item.quarter || '',
      status: item.status || 'upcoming',
      label: item.label || 'Próximo',
      description: item.description || '',
      deadline: item.deadline || '',
    });
    setFormError('');
  };

  const openNewAuto = async () => {
    let nextQuarterName = 'Q1 2026';
    if (items.length > 0) {
      const lastQ = items[items.length - 1].quarter;
      const match = lastQ.match(/Q(\d)\s+(\d{4})/i);
      if (match) {
        let qNum = parseInt(match[1], 10);
        let year = parseInt(match[2], 10);
        if (qNum === 4) {
          qNum = 1;
          year += 1;
        } else {
          qNum += 1;
        }
        nextQuarterName = `Q${qNum} ${year}`;
      }
    }

    setSaving(true);
    try {
      const res = await adminApi.post('/admin/waitlist-quarters', {
        quarter: nextQuarterName,
        status: 'upcoming',
        label: 'Próximo',
        description: 'Aplicaciones desde 01 sept',
        deadline: 'Próximo'
      });
      if (res.data?.success && res.data.data) {
        setItems(prev => [...prev, res.data.data]);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al agregar trimestre');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setFormError('');
    if (!formData.quarter || !formData.description || !formData.deadline) {
      setFormError('Por favor completa todos los campos obligatorios.');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const res = await adminApi.put(`/admin/waitlist-quarters/${editingItem._id}`, formData);
        if (res.data?.success && res.data.data) {
          setItems(prev => prev.map(i => i._id === editingItem._id ? res.data.data : i));
          setEditingItem(null);
        }
      } else {
        const res = await adminApi.post('/admin/waitlist-quarters', formData);
        if (res.data?.success && res.data.data) {
          setItems(prev => [...prev, res.data.data]);
          setIsNewModalOpen(false);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error;
      setFormError(msg ?? 'Error al guardar el trimestre.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este trimestre del ciclo de admisión?')) return;
    setSaving(true);
    try {
      await adminApi.delete(`/admin/waitlist-quarters/${id}`);
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
      (i.quarter || '').toLowerCase().includes(term) ||
      (i.description || '').toLowerCase().includes(term) ||
      (i.deadline || '').toLowerCase().includes(term) ||
      (i.label || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white font-sans pb-16">
      {/* Header / Hero */}
      <div className="p-6 md:p-8 bg-[#0B1F3A] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <Sliders size={13} /> FABRIC · SUPER ADMIN · WAIT LIST
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Wait List (Quarters del Ciclo de Admisión)
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Gestión dinámica de los trimestres de admisión y su estado (Abierto, Cerrado, Próximo) mostrados en la sección de capacidad.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0E2747] border border-[#1E3A5F] px-5 py-2.5 rounded-2xl shadow-md shrink-0">
            <div className="text-center px-2">
              <div className="font-serif text-2xl font-bold leading-none text-[#C9A96E]">
                {items.length}
              </div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Trimestres Activos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Buscador y Acción de Crear */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0E2747] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar trimestre, descripción o estado..."
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
              onClick={openNewAuto}
              className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition bg-[#C9A96E] text-[#0B1F3A] hover:bg-[#d8b87d] shadow-md cursor-pointer"
            >
              <PlusCircle size={16} />
              <span>Agregar Trimestre (Incremental)</span>
            </button>
          </div>
        </div>

        {/* Tabla de Trimestres */}
        <div className="rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] bg-[#07192F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#C9A96E]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Listado de Trimestres Registrados ({filteredItems.length})
              </span>
            </div>
            <span className="font-mono text-[9px] text-[#94A3B8] uppercase">
              Colección: waitlistquarters · MongoDB Atlas
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center font-mono text-xs text-[#94A3B8] tracking-widest">
                Cargando trimestres desde la BD...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Calendar size={32} className="mx-auto text-[#1E3A5F]" />
                <div className="font-serif text-base font-bold text-white">Sin trimestres registrados</div>
                <p className="text-xs text-[#94A3B8] font-mono max-w-sm mx-auto">
                  {searchTerm ? 'No se encontraron trimestres para la búsqueda.' : 'No hay trimestres cargados en la BD.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E3A5F] bg-[#07192F]/60 font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Trimestre</th>
                    <th className="py-3.5 px-5">Estado Interno</th>
                    <th className="py-3.5 px-5">Etiqueta Pública</th>
                    <th className="py-3.5 px-5">Descripción</th>
                    <th className="py-3.5 px-5">Plazo / Cierre</th>
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
                      <td className="py-4 px-5 font-bold text-white font-mono">
                        {item.quarter}
                      </td>

                      <td className="py-4 px-5 font-mono text-[10px]">
                        <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold tracking-wider rounded ${
                          item.status === 'open'
                            ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                            : 'border-zinc-800 text-zinc-500 bg-zinc-900/50'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-mono text-[#C9A96E]">
                        {item.label}
                      </td>

                      <td className="py-4 px-5 text-[#94A3B8] font-sans">
                        {item.description}
                      </td>

                      <td className="py-4 px-5 text-zinc-400 font-mono">
                        {item.deadline}
                      </td>

                      <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-slate-300 hover:text-white transition rounded-lg hover:bg-slate-700/50"
                            title="Editar trimestre"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={saving}
                            className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10"
                            title="Eliminar trimestre"
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

      {/* Modal para Editar */}
      {editingItem && (
        <div className="fixed inset-0 bg-[#07192F]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0E2747] border border-[#1E3A5F] rounded-2xl shadow-2xl p-6 md:p-8 space-y-5"
          >
            <div className="border-b border-[#1E3A5F] pb-4 flex justify-between items-center">
              <div>
                <div className="font-mono text-[9px] text-[#C9A96E] tracking-widest uppercase mb-1">
                  FABRIC · WAIT LIST
                </div>
                <h3 className="font-serif text-xl font-bold text-white">
                  Editar Trimestre
                </h3>
              </div>
              <button
                onClick={() => { setEditingItem(null); }}
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
                  Nombre Trimestre *
                </label>
                <input
                  type="text"
                  value={formData.quarter}
                  onChange={e => setFormData({ ...formData, quarter: e.target.value })}
                  placeholder="Ej. Q4 2026"
                  className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                    Estado Interno *
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => {
                      const val = e.target.value;
                      let lbl = 'Próximo';
                      if (val === 'closed') lbl = 'Cerrado';
                      if (val === 'open') lbl = 'Abierto';
                      setFormData({ ...formData, status: val, label: lbl });
                    }}
                    className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                  >
                    <option value="closed">closed (Cerrado)</option>
                    <option value="open">open (Abierto)</option>
                    <option value="upcoming">upcoming (Próximo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                    Etiqueta Pública
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={e => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Ej. Próximo"
                    className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej. Aplicaciones desde 01 sept"
                  className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#94A3B8] uppercase tracking-wider mb-1">
                  Plazo / Cierre *
                </label>
                <input
                  type="text"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  placeholder="Ej. Próximo o Plazo · 30 julio"
                  className="w-full p-3 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-white outline-none focus:border-[#C9A96E]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => { setEditingItem(null); }}
                className="px-5 py-2.5 border border-[#1E3A5F] text-[#94A3B8] hover:text-white font-mono text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#C9A96E] hover:bg-[#d8b87d] text-[#0B1F3A] font-mono text-xs font-bold rounded-xl cursor-pointer shadow-md transition"
              >
                {saving ? 'Guardando...' : 'Guardar Trimestre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
