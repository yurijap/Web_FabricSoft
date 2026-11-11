import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Check, Mail, RefreshCw, ShieldCheck, UsersRound } from 'lucide-react';
import '../../auth/styles/security.css';
import { api } from '../../config/api';
import { useAccess } from '../../auth/AccessContext';

type Role = 'admin' | 'superadmin';
type AccessUser = { id: string; name: string; email: string; role: Role | null; status: 'active' | 'blocked' | 'unauthorized' };
type Invitation = { id: string; email: string; role: Role; status: string };
const field = 'fs-access__field';
const button = 'fs-access__button';
function message(error: unknown) {
  return (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'No se pudo completar la operación. Intenta de nuevo.';
}
function UserRow({ user, self, disabled, onSave }: { user: AccessUser; self: boolean; disabled: boolean; onSave: (id: string, role: Role, status: 'active' | 'blocked') => Promise<void> }) {
  const [role, setRole] = useState<Role>(user.role || 'admin');
  const changed = role !== user.role;
  return <tr className="fs-access__user" role="row">
    <td data-label="Persona" role="cell"><div className="fs-access__person"><span className="fs-access__avatar" aria-hidden="true">{(user.name || user.email || '?').slice(0, 1).toUpperCase()}</span><div><strong>{user.name || 'Usuario'}</strong><span>{user.email || 'Cuenta sin correo'}</span>{self && <small>Tu cuenta</small>}</div></div></td>
    <td data-label="Rol" role="cell"><select aria-label={`Rol de ${user.email}`} className={field} value={role} disabled={self || disabled} onChange={event => setRole(event.target.value as Role)}><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select></td>
    <td data-label="Acceso" role="cell"><span className={`fs-access__status fs-access__status--${user.status}`}>{user.status === 'active' ? 'Activo' : user.status === 'blocked' ? 'Bloqueado' : 'Sin acceso'}</span></td>
    <td data-label="Acciones" role="cell"><div className="fs-access__actions">
      {!self && (changed || user.status !== 'active') && <button disabled={disabled} className={button} onClick={() => void onSave(user.id, role, 'active')}>{user.status !== 'active' ? 'Dar acceso' : 'Guardar rol'}</button>}
      {!self && user.status === 'active' && <button disabled={disabled} className="fs-access__button fs-access__button--danger" onClick={() => void onSave(user.id, user.role || 'admin', 'blocked')}>Bloquear</button>}
      {self && <span className="fs-access__self"><ShieldCheck size={14} aria-hidden="true" /> Acceso protegido</span>}
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
    if (role === 'superadmin' && !window.confirm('Esta persona podrá administrar usuarios y permisos. ¿Enviar invitación de superadmin?')) return;
    void perform(async () => { await api.post('/access/invitations', { email, role }); setEmail(''); }, 'Invitación enviada. El enlace vence en 7 días.');
  }
  async function save(id: string, nextRole: Role, status: 'active' | 'blocked') {
    if (!window.confirm(status === 'blocked' ? '¿Bloquear el acceso de esta persona? Sus siguientes solicitudes serán rechazadas.' : `¿Autorizar esta cuenta como ${nextRole}?${nextRole === 'superadmin' ? ' Podrá administrar accesos.' : ''}`)) return;
    await perform(async () => { await api.patch(`/access/users/${id}`, { role: nextRole, status }); }, 'Acceso actualizado.');
  }

  return <div className="fs-access">
    <header className="fs-access__header">
      <div><span className="fs-security__eyebrow">Administración del equipo</span><h1>Usuarios y accesos</h1><p>Decide quién entra a tu consola y qué puede hacer.</p></div>
      <span className="fs-access__status"><ShieldCheck size={15} aria-hidden="true" /> Solo superadmin</span>
    </header>
    <div className="fs-access__policy"><ShieldCheck size={20} aria-hidden="true" /><p><strong>Tú controlas el acceso.</strong> Los administradores operan la consola; los superadministradores también gestionan usuarios y permisos.</p></div>
    <div className="fs-access__panel">
      <div className="fs-access__panel-heading"><span className="fs-access__panel-icon"><Mail size={20} aria-hidden="true" /></span><div><h2>Invitar a una persona</h2><p>Envía un enlace seguro a su correo. Vence en 7 días.</p></div></div>
      <form onSubmit={invite} className="fs-access__invite-form">
        <label><span>Correo electrónico</span><input type="email" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} placeholder="persona@empresa.com" className={field} /></label>
        <label><span>Permisos</span><select value={role} onChange={event => setRole(event.target.value as Role)} className={field}><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select></label>
        <button className={button} disabled={busy || loading} type="submit">{busy ? 'Procesando…' : 'Enviar invitación'}</button>
      </form>
      <p className="fs-access__hint">¿Ya tiene cuenta? Puedes autorizarla directamente en la lista de usuarios.</p>
    </div>
    {error && <div role="alert" className="fs-access__alert fs-access__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
    {notice && <div role="status" className="fs-access__alert fs-access__alert--success"><Check size={17} aria-hidden="true" /><span>{notice}</span></div>}
    <div className="fs-access__panel fs-access__panel--table">
      <div className="fs-access__section-heading"><h2><UsersRound size={20} aria-hidden="true" /> Usuarios <span className="fs-access__count">{total}</span></h2><button disabled={busy || loading} className="fs-access__button fs-access__button--secondary" onClick={() => void load().catch(failure => setError(message(failure)))}><RefreshCw size={15} aria-hidden="true" />Actualizar</button></div>
      <div className="fs-access__table-wrap" aria-busy={loading}>
        <table className="fs-access__table" role="table" aria-label="Usuarios y permisos"><thead role="rowgroup"><tr role="row">{['Persona', 'Rol', 'Acceso', 'Acciones'].map(label => <th scope="col" role="columnheader" key={label}>{label}</th>)}</tr></thead>
          <tbody role="rowgroup">{users.map(user => <UserRow key={`${user.id}-${user.role}-${user.status}`} user={user} self={user.id === identity?.userId} disabled={busy || loading} onSave={save} />)}</tbody>
        </table>
        {!users.length && <div className="fs-access__empty" role="status"><UsersRound size={26} aria-hidden="true" /><p>{loading ? 'Cargando cuentas…' : 'No hay cuentas en esta página.'}</p></div>}
      </div>
      <nav className="fs-access__pagination" aria-label="Páginas de usuarios"><span>{total ? offset + 1 : 0}–{Math.min(offset + 25, total)} de {total} usuarios</span><div><button disabled={busy || loading || offset === 0} className="fs-access__button fs-access__button--secondary" onClick={() => setOffset(Math.max(0, offset - 25))}>Anterior</button><button disabled={busy || loading || offset + 25 >= total} className="fs-access__button fs-access__button--secondary" onClick={() => setOffset(offset + 25)}>Siguiente</button></div></nav>
    </div>
    <div className="fs-access__panel">
      <div className="fs-access__section-heading"><h2><Mail size={20} aria-hidden="true" /> Invitaciones pendientes</h2></div>
      {!invitations.length && <div className="fs-access__empty"><Mail size={26} aria-hidden="true" /><p>{loading ? 'Cargando invitaciones…' : 'No hay invitaciones pendientes en esta página.'}</p></div>}
      {invitations.map(invitation => <div key={invitation.id} className="fs-access__invitation"><div><strong>{invitation.email}</strong><span className="fs-access__muted">{invitation.role === 'superadmin' ? 'Superadministrador' : 'Administrador'} · Pendiente de aceptar</span></div><button disabled={busy || loading} className="fs-access__button fs-access__button--danger" onClick={() => {
        if (window.confirm('¿Revocar esta invitación? El enlace dejará de servir.')) void perform(async () => { await api.post(`/access/invitations/${invitation.id}/revoke`); }, 'Invitación revocada.');
      }}>Revocar invitación</button></div>)}
      <nav className="fs-access__pagination" aria-label="Páginas de invitaciones"><span>Invitaciones enviadas por tu equipo</span><div><button disabled={busy || loading || inviteOffset === 0} className="fs-access__button fs-access__button--secondary" onClick={() => setInviteOffset(Math.max(0, inviteOffset - 25))}>Anterior</button><button disabled={busy || loading || !moreInvites} className="fs-access__button fs-access__button--secondary" onClick={() => setInviteOffset(inviteOffset + 25)}>Siguiente</button></div></nav>
    </div>
  </div>;
}
