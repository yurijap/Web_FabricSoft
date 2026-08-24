import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Mail, 
  Link2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useAuthApi } from '../../../config/api';

export default function AdminRescueSettings() {
  const adminApi = useAuthApi();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [crmWebhookUrl, setCrmWebhookUrl] = useState('https://api.fabricsoft.com.mx/webhook/crm-fusion');
  const [emails, setEmails] = useState<string[]>(['fabrizio@fabricsoft.com.mx', 'antonio@fabricsoft.com.mx']);
  const [newEmail, setNewEmail] = useState('');
  
  // Inline edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    adminApi.get('/fusion-rescue/settings')
      .then(res => {
        const data = res.data?.data;
        if (data) {
          if (data.crm_webhook_url) setCrmWebhookUrl(data.crm_webhook_url);
          if (Array.isArray(data.notification_emails)) setEmails(data.notification_emails);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await adminApi.post('/fusion-rescue/settings', {
        crm_webhook_url: crmWebhookUrl,
        notification_emails: emails,
      });
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente en la Base de Datos.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error al guardar la configuración: ' + (err.message || 'Error desconocido') });
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setMessage({ type: 'error', text: 'Por favor ingresa un correo electrónico válido.' });
      return;
    }
    if (emails.includes(trimmed)) {
      setMessage({ type: 'error', text: 'Este correo ya se encuentra en la lista de destinatarios.' });
      return;
    }
    setEmails(prev => [...prev, trimmed]);
    setNewEmail('');
    setMessage({ type: 'success', text: `Correo ${trimmed} agregado a la lista. No olvides hacer clic en Guardar Configuración.` });
  };

  const handleRemoveEmail = (indexToRemove: number) => {
    const emailRemoved = emails[indexToRemove];
    setEmails(prev => prev.filter((_, idx) => idx !== indexToRemove));
    if (editingIndex === indexToRemove) {
      setEditingIndex(null);
    }
    setMessage({ type: 'success', text: `Correo ${emailRemoved} eliminado.` });
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(emails[index]);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editingValue.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setMessage({ type: 'error', text: 'Por favor ingresa un correo electrónico válido.' });
      return;
    }
    
    // Check duplicate if changing to an existing email in another slot
    if (emails.some((e, idx) => e === trimmed && idx !== index)) {
      setMessage({ type: 'error', text: 'Este correo ya existe en la lista.' });
      return;
    }

    const updated = [...emails];
    updated[index] = trimmed;
    setEmails(updated);
    setEditingIndex(null);
    setMessage({ type: 'success', text: 'Correo modificado exitosamente.' });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  return (
    <div className="min-h-screen bg-[#07192F] text-white font-sans pb-16">
      {/* Header */}
      <div className="p-6 md:p-8 bg-[#07192F] border-b border-[#C9A96E]/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 border border-[#C9A96E]/30 bg-[#0E2747] px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A96E] rounded-md">
              <Sliders size={13} /> FABRIC · CONTROL TÉCNICO · SETTINGS
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Configuración (Settings)
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 font-sans">
              Espacio de control técnico para webhooks de CRM y gestión de correos de notificación instantánea.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-4xl space-y-8">
        {message && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-mono animate-fadeIn ${
            message.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <AlertCircle size={18} className="text-red-400 shrink-0" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white p-1">
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Webhooks del CRM */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#0E2747] border border-[#C9A96E]/30 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#C9A96E]/20 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center">
                <Link2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  1. Webhooks del CRM Corporativo
                </h3>
                <p className="text-xs text-slate-300">
                  URL del webhook que disparará los prospectos y datos del assessment en tiempo real hacia el CRM de FABRIC.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-mono font-bold text-[#C9A96E] uppercase tracking-wider block">
                URL del Webhook CRM (Endpoint HTTP POST)
              </label>
              <input
                type="url"
                value={crmWebhookUrl}
                onChange={e => setCrmWebhookUrl(e.target.value)}
                placeholder="https://api.fabricsoft.com.mx/webhook/crm-fusion"
                className="w-full px-4 py-3 bg-[#07192F] border border-slate-700 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-[#C9A96E] transition"
                required
              />
              <p className="text-[11px] text-slate-400 font-mono">
                Cada respuesta enviada emitirá un payload JSON con `nombre`, `email`, `empresa`, `health_score`, `recommended_path`, `answers` y `UTMs`.
              </p>
            </div>
          </div>

          {/* Section 2: Correos de Notificación Interna (Agregar, Editar y Borrar) */}
          <div className="p-6 md:p-8 rounded-3xl bg-[#0E2747] border border-[#C9A96E]/30 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[#C9A96E]/20 pb-4">
              <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/15 border border-[#C9A96E]/40 text-[#C9A96E] flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  2. Correos de Notificación Interna
                </h3>
                <p className="text-xs text-slate-300">
                  Lista de destinatarios de alerta a donde se enviarán las notificaciones instantáneas de nuevos prospectos.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Formulario Agregar Nuevo Correo */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider block">
                  Agregar Nuevo Correo de Alerta
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

              {/* Lista de Correos Activos con Editar y Borrar */}
              <div className="space-y-2.5 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-[#C9A96E] font-bold uppercase tracking-wider">
                    Destinatarios Configurados ({emails.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    * Todos recibirán alerta automática
                  </span>
                </div>

                {emails.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#07192F] border border-slate-800 text-slate-400 text-xs font-mono text-center">
                    No hay correos de notificación configurados.
                  </div>
                ) : (
                  emails.map((email, idx) => {
                    const isEditing = editingIndex === idx;

                    return (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3.5 rounded-xl bg-[#07192F] border border-slate-700 hover:border-[#C9A96E]/50 transition font-mono text-xs text-slate-200"
                      >
                        {isEditing ? (
                          /* Inline Edit Mode */
                          <div className="flex-1 flex items-center gap-2 mr-3">
                            <Mail size={15} className="text-[#C9A96E] shrink-0" />
                            <input
                              type="email"
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEdit(idx);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                              className="w-full px-3 py-1.5 bg-[#0E2747] border border-[#C9A96E] rounded-lg text-xs font-mono text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(idx)}
                              className="p-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-500/30 transition cursor-pointer"
                              title="Guardar cambio"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          /* View Mode */
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-[#C9A96E]/15 text-[#C9A96E] border border-[#C9A96E]/30 flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </div>
                            <Mail size={15} className="text-[#C9A96E] shrink-0" />
                            <span className="font-bold text-white">{email}</span>
                          </div>
                        )}

                        {/* Action Buttons: Editar y Borrar */}
                        {!isEditing && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(idx)}
                              className="p-2 text-slate-300 hover:text-[#C9A96E] hover:bg-[#C9A96E]/15 rounded-lg transition border border-slate-700 hover:border-[#C9A96E]/40 cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Editar correo"
                            >
                              <Edit2 size={13} />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveEmail(idx)}
                              className="p-2 text-slate-300 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition border border-slate-700 hover:border-rose-500/40 cursor-pointer flex items-center gap-1 text-[11px]"
                              title="Borrar correo"
                            >
                              <Trash2 size={13} />
                              <span className="hidden sm:inline">Borrar</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-10 py-5 bg-[#C9A96E] hover:bg-[#D4B579] text-[#050203] font-black rounded-2xl text-base transition-all border-2 border-[#FFE8A3] flex items-center gap-3 cursor-pointer"
            >
              <Save size={18} className="text-[#050203]" />
              <span>{saving ? 'Guardando cambios...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
