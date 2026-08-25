import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  Plus, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { useAuthApi } from '../../../config/api';

export default function AdminRescueSettings() {
  const adminApi = useAuthApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Array de correos de notificación
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        let res;
        try {
          res = await adminApi.get('/fusion-rescue/settings');
        } catch {
          res = await adminApi.get('/settings');
        }
        
        const data = res.data?.data;
        if (data && Array.isArray(data.notification_emails)) {
          setEmails(data.notification_emails);
        }
      } catch (err) {
        console.error('Error al obtener correos de la BD:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'Escribe un correo electrónico antes de presionar Agregar.' });
      return;
    }
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setMessage({ type: 'error', text: 'Ingresa un correo electrónico válido (ejemplo: correo@empresa.com).' });
      return;
    }
    if (emails.map(e => e.toLowerCase()).includes(trimmed)) {
      setMessage({ type: 'error', text: 'Este correo ya se encuentra en la lista.' });
      return;
    }

    setEmails(prev => [...prev, trimmed]);
    setNewEmail('');
    setMessage(null);
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(prev => prev.filter(e => e !== emailToRemove));
    setMessage(null);
  };

  const handleSaveToDatabase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let res;
      try {
        res = await adminApi.post('/fusion-rescue/settings', { notification_emails: emails });
      } catch {
        res = await adminApi.post('/settings', { notification_emails: emails });
      }

      const data = res.data?.data;
      if (data && Array.isArray(data.notification_emails)) {
        setEmails(data.notification_emails);
      }
      setMessage({ type: 'success', text: 'Correos de notificación guardados exitosamente en MongoDB Atlas.' });
    } catch (err: any) {
      console.error('Error guardando en BD:', err);
      setMessage({ type: 'error', text: 'Error al guardar en la BD: ' + (err.response?.data?.error || err.message || 'Error de red') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07192F] text-white flex items-center justify-center p-8 font-sans">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 border-4 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-300">Cargando correos desde MongoDB Atlas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07192F] text-white font-sans pb-16">
      {/* Header */}
      <div className="p-6 md:p-8 bg-[#07192F] border-b border-[#C9A96E]/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#0E2747] px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <Sliders size={13} /> FABRIC · SETTINGS
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Correos de Notificación
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 font-sans">
              Administra los correos a los que se enviarán las alertas cuando un prospecto realice el diagnóstico.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-3xl space-y-6">
        {message && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono animate-fadeIn ${
            message.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <AlertCircle size={18} className="text-red-400 shrink-0" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSaveToDatabase} className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-[#0E2747] border border-[#C9A96E]/30 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#C9A96E]/20 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Destinatarios de Alertas de Leads
                </h3>
                <p className="text-xs text-slate-300">
                  Agrega los correos que recibirán los detalles completos de cada evaluación terminada.
                </p>
              </div>
            </div>

            {/* Input para agregar nuevo correo */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider block">
                Agregar Nuevo Correo
              </label>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEmail();
                    }
                  }}
                  placeholder="ejemplo@fabricsoft.com.mx"
                  className="flex-1 px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E] transition"
                />
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="px-6 py-3 bg-[#C9A96E]/20 hover:bg-[#C9A96E]/30 border-2 border-[#C9A96E] text-[#C9A96E] font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {/* Lista de Correos Guardados */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider block">
                Correos Registrados ({emails.length})
              </span>

              {emails.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#07192F] border border-slate-800 text-slate-400 text-xs font-mono text-center">
                  No hay correos registrados.
                </div>
              ) : (
                <div className="space-y-2">
                  {emails.map((email, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#07192F] border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono transition hover:border-[#C9A96E]/30"
                    >
                      <div className="flex items-center gap-3">
                        <Mail size={15} className="text-[#C9A96E] shrink-0" />
                        <span className="font-bold text-white">{email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmail(email)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition border border-slate-800 hover:border-rose-500/30 cursor-pointer flex items-center gap-1 text-[11px]"
                        title="Quitar de la lista"
                      >
                        <Trash2 size={14} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botón Guardar Cambios */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto px-8 py-4 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-black rounded-2xl text-sm transition-all border-2 border-[#FFE8A3] flex items-center justify-center gap-2.5 cursor-pointer shadow-xl disabled:opacity-50"
            >
              <Save size={18} className="text-[#050203]" />
              <span>{saving ? 'Guardando en la BD...' : 'Guardar Correos en Base de Datos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
