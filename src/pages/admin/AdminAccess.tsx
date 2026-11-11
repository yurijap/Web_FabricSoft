import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck, UsersRound } from 'lucide-react';
import { api } from '../../config/api';
import { useAccess } from '../../auth/AccessContext';

type Role = 'admin' | 'superadmin';
type AccessUser = { id: string; name: string; email: string; role: Role | null; status: 'active' | 'blocked' | 'unauthorized'; mfaEnrolled: boolean };
type Invitation = { id: string; email: string; role: Role; status: string };
const field = 'rounded-lg border border-[#1E3A5F] bg-[#12253F] px-3 py-2 text-white';
const button = 'rounded-lg bg-[#C9A96E] px-4 py-2 text-[#050B14] font-semibold disabled:opacity-50';
function message(error: unknown) {
  return (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'No se pudo completar la operación. Intenta de nuevo.';
}
function UserRow({ user, self, disabled, onSave }: { user: AccessUser; self: boolean; disabled: boolean; onSave: (id: string, role: Role, status: 'active' | 'blocked') => Promise<void> }) {
  const [role, setRole] = useState<Role>(user.role || 'admin');
  const changed = role !== user.role;
  return <tr className="border-t border-[#1E3A5F]">
    <td className="p-4"><div className="font-medium">{user.name || user.email || 'Cuenta sin correo'}</div><div className="text-sm text-slate-400">{user.email}{self ? ' · Tu cuenta' : ''}</div></td>
    <td className="p-4"><select aria-label={`Rol de ${user.email}`} className={field} value={role} disabled={self || disabled} onChange={event => setRole(event.target.value as Role)}><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select></td>
    <td className="p-4 text-sm">{user.status === 'active' ? 'Activo' : user.status === 'blocked' ? 'Bloqueado' : 'Sin acceso'}</td>
    <td className="p-4 text-sm">{user.mfaEnrolled ? 'Configurado' : user.role === 'superadmin' ? 'Pendiente · debe verificar' : 'Sin configurar'}</td>
    <td className="p-4"><div className="flex flex-wrap gap-3">
      {!self && (changed || user.status !== 'active') && <button disabled={disabled} className={button} onClick={() => void onSave(user.id, role, 'active')}>{user.status !== 'active' ? 'Dar acceso' : 'Guardar rol'}</button>}
      {!self && user.status === 'active' && <button disabled={disabled} className="rounded-lg border border-red-400/40 px-4 py-2 text-red-300 disabled:opacity-50" onClick={() => void onSave(user.id, user.role || 'admin', 'blocked')}>Bloquear</button>}
      {self && <span className="text-xs text-slate-400">Tu acceso se conserva protegido</span>}
    </div></td>
  </tr>;
}

export default function AdminAccess() {
  const { identity } = useAccess();
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [offset, setOffset] = useState(0);
  const [inviteOffset, setInviteOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [moreInvites, setMoreInvites] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('admin');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [members, pending] = await Promise.all([
        api.get('/access/users', { params: { offset } }), api.get('/access/invitations', { params: { offset: inviteOffset } }),
      ]);
      setUsers(members.data.users); setTotal(members.data.total);
      setInvitations(pending.data.invitations); setMoreInvites(pending.data.hasMore);
    } finally { setLoading(false); }
  }, [offset, inviteOffset]);
  useEffect(() => { void load().catch(failure => setError(message(failure))); }, [load]);

  async function perform(operation: () => Promise<void>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await operation(); setNotice(success); await load(); }
    catch (failure) { setError(message(failure)); }
    finally { setBusy(false); }
  }
  function invite(event: FormEvent) {
    event.preventDefault();
    if (role === 'superadmin' && !window.confirm('Esta persona podrá administrar usuarios y permisos. Se le exigirá MFA. ¿Enviar invitación de superadmin?')) return;
    void perform(async () => { await api.post('/access/invitations', { email, role }); setEmail(''); }, 'Invitación enviada. El enlace vence en 7 días.');
  }
  async function save(id: string, nextRole: Role, status: 'active' | 'blocked') {
    if (!window.confirm(status === 'blocked' ? '¿Bloquear el acceso de esta persona? Sus siguientes solicitudes serán rechazadas.' : `¿Autorizar esta cuenta como ${nextRole}?${nextRole === 'superadmin' ? ' Podrá administrar accesos y deberá verificar MFA.' : ''}`)) return;
    await perform(async () => { await api.patch(`/access/users/${id}`, { role: nextRole, status }); }, 'Acceso actualizado.');
  }

  return <div className="p-4 md:p-8 space-y-7 text-white">
    <header className="space-y-2"><div className="flex items-center gap-2 text-[#C9A96E]"><ShieldCheck size={20} /><span className="text-xs uppercase tracking-widest">Solo superadmin</span></div>
      <h1 className="text-3xl font-semibold">Usuarios y accesos</h1><p className="text-slate-300">Invita a tu equipo y controla quién puede entrar a la consola.</p>
    </header>
    <div className="rounded-xl border border-[#C9A96E]/30 bg-[#C9A96E]/5 p-4 text-sm text-slate-300">Admin: opera la consola. Superadmin: también gestiona accesos y debe verificar MFA. Una cuenta sin autorización no puede entrar.</div>
    <section className="rounded-xl border border-[#1E3A5F] bg-[#0A1626] p-5 space-y-4">
      <h2 className="text-lg font-semibold">Invitar a una persona</h2>
      <form onSubmit={invite} className="flex flex-col sm:flex-row sm:items-end gap-4">
        <label className="flex-1 space-y-2"><span className="block text-sm">Correo electrónico</span><input type="email" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} placeholder="persona@empresa.com" className={`${field} w-full`} /></label>
        <label className="space-y-2"><span className="block text-sm">Rol</span><select value={role} onChange={event => setRole(event.target.value as Role)} className={field}><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select></label>
        <button className={button} disabled={busy || loading} type="submit">{busy ? 'Procesando…' : 'Enviar invitación'}</button>
      </form>
      <p className="text-xs text-slate-400">Si la persona ya tiene cuenta, puedes darle acceso desde la tabla.</p>
    </section>
    {error && <p role="alert" className="rounded-lg border border-red-400/30 p-4 text-red-300">{error}</p>}
    {notice && <p role="status" className="text-emerald-300">{notice}</p>}
    <section className="space-y-4"><div className="flex justify-between items-center gap-3"><h2 className="text-xl flex items-center gap-2"><UsersRound size={20} /> Cuentas</h2><button disabled={busy || loading} className="text-[#C9A96E] underline" onClick={() => void load().catch(failure => setError(message(failure)))}>Actualizar</button></div>
      <div className="overflow-x-auto rounded-xl border border-[#1E3A5F] bg-[#0A1626]" aria-busy={loading}>
        <table className="w-full text-left"><thead className="text-xs uppercase text-slate-400"><tr>{['Persona', 'Rol', 'Acceso', 'Autenticador', 'Acciones'].map(label => <th className="p-4" key={label}>{label}</th>)}</tr></thead>
          <tbody>{users.map(user => <UserRow key={`${user.id}-${user.role}-${user.status}`} user={user} self={user.id === identity?.userId} disabled={busy || loading} onSave={save} />)}</tbody>
        </table>
        {!users.length && <p className="p-5 text-slate-400">{loading ? 'Cargando cuentas…' : 'No hay cuentas en esta página.'}</p>}
      </div>
      <div className="flex gap-4 items-center text-sm"><button disabled={busy || loading || offset === 0} className="disabled:opacity-40" onClick={() => setOffset(Math.max(0, offset - 25))}>Anterior</button><span>{total ? offset + 1 : 0}–{Math.min(offset + 25, total)} de {total}</span><button disabled={busy || loading || offset + 25 >= total} className="disabled:opacity-40" onClick={() => setOffset(offset + 25)}>Siguiente</button></div>
    </section>
    <section className="rounded-xl border border-[#1E3A5F] bg-[#0A1626] p-5 space-y-4"><h2 className="text-xl">Invitaciones pendientes</h2>
      {!invitations.length && <p className="text-slate-400">{loading ? 'Cargando invitaciones…' : 'No hay invitaciones pendientes en esta página.'}</p>}
      {invitations.map(invitation => <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1E3A5F] pt-4"><div><p className="break-all">{invitation.email}</p><p className="text-sm text-slate-400">{invitation.role}</p></div><button disabled={busy || loading} className="text-red-300 underline disabled:opacity-40" onClick={() => {
        if (window.confirm('¿Revocar esta invitación? El enlace dejará de servir.')) void perform(async () => { await api.post(`/access/invitations/${invitation.id}/revoke`); }, 'Invitación revocada.');
      }}>Revocar invitación</button></div>)}
      <div className="flex gap-4 text-sm"><button disabled={busy || loading || inviteOffset === 0} className="disabled:opacity-40" onClick={() => setInviteOffset(Math.max(0, inviteOffset - 25))}>Anterior</button><button disabled={busy || loading || !moreInvites} className="disabled:opacity-40" onClick={() => setInviteOffset(inviteOffset + 25)}>Siguiente</button></div>
    </section>
  </div>;
}
