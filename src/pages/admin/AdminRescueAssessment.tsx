import { useState, useEffect } from 'react';
import { Search, RefreshCw, Trash2, Eye, ClipboardList, X } from 'lucide-react';
import { useAuthApi } from '../../config/api';

interface AnswerItem {
  questionId: string;
  questionText: string;
  selectedOptionLabel: string;
  score: number;
}

interface SubmissionItem {
  _id: string;
  nombre: string;
  email: string;
  empresa: string;
  escenario: string;
  totalScore: number;
  answers: AnswerItem[];
  createdAt: string;
}

export default function AdminRescueAssessment() {
  const adminApi = useAuthApi();
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    adminApi.get('/rescue-assessment/submissions')
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta evaluación de severidad?')) return;
    setSaving(true);
    try {
      await adminApi.delete(`/rescue-assessment/submissions/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      if (selectedSubmission?._id === id) setSelectedSubmission(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(i => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      (i.nombre || '').toLowerCase().includes(term) ||
      (i.empresa || '').toLowerCase().includes(term) ||
      (i.email || '').toLowerCase().includes(term) ||
      (i.escenario || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-[#0B1F3A] text-white font-sans pb-16">
      {/* Header / Hero */}
      <div className="p-6 md:p-8 bg-[#0B1F3A] border-b border-[#1E3A5F]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <ClipboardList size={13} /> FABRIC · SUPER ADMIN · RESCUE ASSESSMENT
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight">
              Oracle Fusion Rescue Assessment
            </h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-1 font-sans">
              Historial de evaluaciones de severidad ejecutadas por clientes y leads.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0E2747] border border-[#1E3A5F] px-5 py-2.5 rounded-2xl shadow-md shrink-0">
            <div className="text-center px-2">
              <div className="font-serif text-2xl font-bold leading-none text-[#C9A96E]">
                {items.length}
              </div>
              <div className="font-mono text-[9px] text-[#94A3B8] tracking-wider uppercase mt-1">Evaluaciones</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Buscador y Acción de Actualizar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0E2747] border border-[#1E3A5F] p-4 rounded-2xl shadow-lg">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, empresa o email..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] rounded-xl text-xs text-white placeholder:text-[#94A3B8] font-mono focus:outline-none focus:border-[#C9A96E] transition"
            />
          </div>

          <button
            onClick={fetchItems}
            className="px-4 py-2.5 bg-[#07192F] border border-[#1E3A5F] hover:border-[#C9A96E]/50 text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Tabla de Evaluaciones */}
        <div className="rounded-2xl border border-[#1E3A5F] bg-[#0E2747] shadow-xl overflow-hidden">
          <div className="p-4 border-b border-[#1E3A5F] bg-[#07192F] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-[#C9A96E]" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Listado de Diagnósticos Registrados ({filteredItems.length})
              </span>
            </div>
            <span className="font-mono text-[9px] text-[#94A3B8] uppercase">
              Colección: rescueassessments · MongoDB Atlas
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center font-mono text-xs text-[#94A3B8] tracking-widest">
                Cargando evaluaciones desde la BD...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <ClipboardList size={32} className="mx-auto text-[#1E3A5F]" />
                <div className="font-serif text-base font-bold text-white">Sin evaluaciones registradas</div>
                <p className="text-xs text-[#94A3B8] font-mono max-w-sm mx-auto">
                  {searchTerm ? 'No se encontraron registros para la búsqueda.' : 'No hay evaluaciones cargadas en la BD.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E3A5F] bg-[#07192F]/60 font-mono text-[9px] text-[#94A3B8] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Fecha</th>
                    <th className="py-3.5 px-5">Usuario</th>
                    <th className="py-3.5 px-5">Empresa</th>
                    <th className="py-3.5 px-5">Email</th>
                    <th className="py-3.5 px-5">Situación</th>
                    <th className="py-3.5 px-5 font-mono">Score</th>
                    <th className="py-3.5 px-5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A5F]/60 text-xs">
                  {filteredItems.map(item => {
                    const dateStr = new Date(item.createdAt).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
                    return (
                      <tr
                        key={item._id}
                        onClick={() => setSelectedSubmission(item)}
                        className="hover:bg-[#123254]/50 transition cursor-pointer group"
                      >
                        <td className="py-4 px-5 font-mono text-[#94A3B8]">
                          {dateStr}
                        </td>
                        <td className="py-4 px-5 font-bold text-white">
                          {item.nombre}
                        </td>
                        <td className="py-4 px-5 text-slate-200">
                          {item.empresa}
                        </td>
                        <td className="py-4 px-5 text-[#94A3B8] font-mono">
                          {item.email}
                        </td>
                        <td className="py-4 px-5">
                          <span className="px-2 py-0.5 border text-[9px] uppercase font-bold tracking-wider rounded border-blue-500/40 text-blue-400 bg-blue-950/30">
                            {item.escenario === 'fusion-fallando' ? 'Fusion Fallando' : item.escenario === 'migrando' ? 'Migrando a Oracle' : 'Greenfield'}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono text-[#C9A96E] font-bold">
                          {item.totalScore ?? 0}
                        </td>
                        <td className="py-4 px-5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedSubmission(item)}
                              className="p-1.5 text-slate-300 hover:text-white transition rounded-lg hover:bg-slate-700/50"
                              title="Ver respuestas completas"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
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

      {/* Modal para ver Respuestas */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-[#07192F]/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#0E2747] border border-[#1E3A5F] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#1E3A5F] flex justify-between items-center bg-[#07192F]">
              <div>
                <span className="text-[9px] font-mono text-[#C9A96E] font-bold uppercase tracking-wider block">// RESPUESTAS DEL DIAGNÓSTICO</span>
                <h4 className="text-sm font-bold text-white font-serif">{selectedSubmission.nombre} — {selectedSubmission.empresa}</h4>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-8 h-8 rounded-xl border border-[#1E3A5F] bg-[#123254] text-[#94A3B8] hover:text-white flex items-center justify-center text-lg cursor-pointer transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-200">
              <div className="grid grid-cols-2 gap-4 p-4 border border-[#1E3A5F] rounded-xl bg-[#07192F] font-mono text-[10px]">
                <div>
                  <span className="text-[#94A3B8] block uppercase">Correo corporativo:</span>
                  <span className="text-white font-bold">{selectedSubmission.email}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] block uppercase">Puntaje total:</span>
                  <span className="text-white font-bold">{selectedSubmission.totalScore} / 36</span>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block font-mono">Cuestionario Respondido</span>
                <div className="space-y-3">
                  {selectedSubmission.answers && selectedSubmission.answers.length > 0 ? (
                    selectedSubmission.answers.map((ans, idx) => (
                      <div key={idx} className="p-4 border border-[#1E3A5F]/60 rounded-xl bg-[#123254]/30 space-y-1.5">
                        <div className="flex justify-between items-start gap-3">
                          <span className="font-semibold text-white text-xs">{idx + 1}. {ans.questionText || `Pregunta ID: ${ans.questionId}`}</span>
                          <span className="font-mono text-[10px] bg-[#1E3A5F] text-[#C9A96E] px-1.5 py-0.5 rounded shrink-0 font-bold border border-[#C9A96E]/20">
                            +{ans.score} pts
                          </span>
                        </div>
                        <div className="text-xs text-[#C9A96E] font-medium">
                          Respuesta: <span className="text-slate-300">{ans.selectedOptionLabel || `Opción score: ${ans.score}`}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-[#94A3B8] font-mono text-xs">No se enviaron respuestas detalladas.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1E3A5F] bg-[#07192F] flex justify-end">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-5 py-2.5 border border-[#1E3A5F] text-[#94A3B8] hover:text-white font-mono text-xs rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
