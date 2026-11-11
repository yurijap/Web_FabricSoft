import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertCircle, Check, Mail, RefreshCw, ShieldCheck, Trash2, UsersRound, X } from 'lucide-react';
import '../../auth/styles/security.css';
import { api } from '../../config/api';
import { useAccess } from '../../auth/AccessContext';

type Role = 'admin' | 'superadmin';
type AccessUser = { id: string; name: string; email: string; role: Role | null; status: 'active' | 'blocked' | 'unauthorized' };
type Invitation = { id: string; email: string; role: Role; status: string };
const field = 'fs-access__field';
const button = 'fs-access__button';
const ROLE_DETAILS: Record<Role, {
  label: string;
  summary: string;
  confirmation: string;
  permissions: { label: string; critical?: boolean }[];
  limit: string;
}> = {
  admin: {
    label: 'Admin',
    summary: 'Gestiona leads, citas, documentos y paneles de la consola.',
    confirmation: 'Podrá gestionar leads, citas, documentos y paneles. No podrá administrar usuarios ni vaciar la base de datos.',
    permissions: [
      { label: 'Gestionar leads y solicitudes' },
      { label: 'Administrar citas y reuniones' },
      { label: 'Gestionar documentos y archivos' },
      { label: 'Consultar paneles, campañas y registros' },
    ],
    limit: 'No puede gestionar usuarios, cambiar roles ni vaciar la base de datos.',
  },
  superadmin: {
    label: 'Superadmin',
    summary: 'Incluye Admin, gestión de usuarios y roles, y vaciado de la base de datos.',
    confirmation: 'Tendrá todas las funciones de Admin. También podrá invitar, bloquear y eliminar cuentas, cambiar roles, revocar invitaciones y vaciar la base de datos.',
    permissions: [
      { label: 'Todas las funciones de Admin' },
      { label: 'Invitar, autorizar y bloquear usuarios' },
      { label: 'Cambiar roles y revocar invitaciones' },
      { label: 'Eliminar cuentas de acceso', critical: true },
      { label: 'Vaciar la base de datos', critical: true },
    ],
    limit: 'No puede modificar su propio rol, bloquear ni eliminar su propia cuenta.',
  },
};
function message(error: unknown) {
  return (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'No se pudo completar la operación. Intenta de nuevo.';
}
function UserRow({ user, self, disabled, onSave, onDelete }: { user: AccessUser; self: boolean; disabled: boolean; onSave: (id: string, role: Role, status: 'active' | 'blocked') => Promise<void>; onDelete: (user: AccessUser) => void }) {
  const [role, setRole] = useState<Role>(user.role || 'admin');
  const changed = role !== user.role;
  return <tr className="fs-access__user" role="row">
    <td data-label="Persona" role="cell"><div className="fs-access__person"><span className="fs-access__avatar" aria-hidden="true">{(user.name || user.email || '?').slice(0, 1).toUpperCase()}</span><div><strong>{user.name || 'Usuario'}</strong><span>{user.email || 'Cuenta sin correo'}</span>{self && <small>Tu cuenta</small>}</div></div></td>
    <td data-label="Rol" role="cell"><div className="fs-access__role-control"><select aria-label={`Rol de ${user.email}`} aria-describedby={`role-help-${user.id}`} className={field} value={role} disabled={self || disabled} onChange={event => setRole(event.target.value as Role)}><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select><span id={`role-help-${user.id}`} className="fs-access__role-help" aria-live="polite">{ROLE_DETAILS[role].summary}{!user.role && ' Se aplicará al dar acceso.'}</span></div></td>
    <td data-label="Acceso" role="cell"><span className={`fs-access__status fs-access__status--${user.status}`}>{user.status === 'active' ? 'Activo' : user.status === 'blocked' ? 'Bloqueado' : 'Sin acceso'}</span></td>
    <td data-label="Acciones" role="cell"><div className="fs-access__actions">
      {!self && (changed || user.status !== 'active') && <button disabled={disabled} className={button} onClick={() => void onSave(user.id, role, 'active')}>{user.status !== 'active' ? 'Dar acceso' : 'Guardar rol'}</button>}
      {!self && user.status === 'active' && <button disabled={disabled} className="fs-access__button fs-access__button--danger" onClick={() => void onSave(user.id, user.role || 'admin', 'blocked')}>Bloquear</button>}
      {!self && <button type="button" disabled={disabled} className="fs-access__button fs-access__button--danger" aria-label={`Eliminar cuenta de ${user.email || user.name || user.id}`} onClick={() => onDelete(user)}><Trash2 size={14} aria-hidden="true" />Eliminar cuenta</button>}
      {self && <span className="fs-access__self"><ShieldCheck size={14} aria-hidden="true" /> Acceso protegido</span>}
    </div></td>
  </tr>;
}

export function DeleteAccountDialog({ user, busy, onClose, onConfirm }: {
  user: AccessUser; busy: boolean; onClose: () => void;
  onConfirm: (user: AccessUser, confirmation: string) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const expected = user.email || user.id;
  const matches = user.email ? confirmation.trim().toLowerCase() === expected.toLowerCase() : confirmation.trim() === expected;

  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      const focusTarget = previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : document.getElementById('users-list-heading');
      focusTarget?.focus({ preventScroll: true });
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !matches) return;
    setError('');
    try { await onConfirm(user, confirmation.trim()); }
    catch (failure) { setError(message(failure)); }
  }

  return <dialog ref={dialogRef} className="fs-access__delete-dialog" aria-labelledby="delete-user-title" aria-describedby="delete-user-description"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="fs-access__delete-heading"><span className="fs-access__delete-icon"><Trash2 size={23} aria-hidden="true" /></span><button type="button" className="fs-access__button fs-access__button--secondary fs-access__dialog-close" aria-label="Cancelar eliminación" disabled={busy} onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
    <h2 id="delete-user-title">Eliminar cuenta</h2>
    <p id="delete-user-description">Se eliminará la cuenta de acceso de <strong>{user.name || expected}</strong> y dejará de aparecer en esta lista. Esta acción es permanente.</p>
    <p>Los leads, citas y documentos de la operación se conservarán. Para suspender el acceso sin eliminar la cuenta, usa Bloquear.</p>
    <form onSubmit={submit} aria-busy={busy} className="fs-access__delete-form">
      <label htmlFor="delete-user-confirmation"><span>Para confirmar, escribe {user.email ? 'su correo' : 'su identificador'}:</span><strong className="fs-access__delete-identity">{expected}</strong></label>
      <input id="delete-user-confirmation" className={field} value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={254} disabled={busy} aria-describedby={error ? 'delete-user-error' : undefined} />
      {error && <div id="delete-user-error" role="alert" className="fs-access__alert fs-access__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
      <div className="fs-access__delete-actions"><button type="button" className="fs-access__button fs-access__button--secondary" disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className="fs-access__button fs-access__button--destructive" disabled={busy || !matches}>{busy ? 'Eliminando…' : 'Eliminar cuenta'}</button></div>
    </form>
  </dialog>;
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
  const [deleteTarget, setDeleteTarget] = useState<AccessUser | null>(null);
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
    if (role === 'superadmin' && !window.confirm(`${ROLE_DETAILS[role].confirmation}\n\n¿Enviar invitación de superadmin?`)) return;
    void perform(async () => { await api.post('/access/invitations', { email, role }); setEmail(''); }, 'Invitación enviada. El enlace vence en 7 días.');
  }
  async function save(id: string, nextRole: Role, status: 'active' | 'blocked') {
    if (!window.confirm(status === 'blocked' ? '¿Bloquear el acceso de esta persona? Sus siguientes solicitudes serán rechazadas.' : `${ROLE_DETAILS[nextRole].confirmation}\n\n¿Autorizar esta cuenta como ${ROLE_DETAILS[nextRole].label}?`)) return;
    await perform(async () => { await api.patch(`/access/users/${id}`, { role: nextRole, status }); }, 'Acceso actualizado.');
  }

  async function deleteAccount(user: AccessUser, confirmation: string) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await api.delete(`/access/users/${user.id}`, { data: { confirmation } });
      setUsers(current => current.filter(item => item.id !== user.id));
      setTotal(current => Math.max(0, current - 1));
      setDeleteTarget(null);
      setNotice('Cuenta eliminada. Ya no aparece en la lista de usuarios.');
      if (users.length === 1 && offset > 0) setOffset(current => Math.max(0, current - 25));
      else {
        try { await load(); }
        catch { setError('La cuenta se eliminó, pero no pudimos actualizar la lista completa. Pulsa Actualizar.'); }
      }
    } finally { setBusy(false); }
  }

  return <div className="fs-access">
    <header className="fs-access__header">
      <div><span className="fs-security__eyebrow">Administración del equipo</span><h1>Usuarios y accesos</h1><p>Decide quién entra a tu consola y qué puede hacer.</p></div>
      <span className="fs-access__status"><ShieldCheck size={15} aria-hidden="true" /> Solo superadmin</span>
    </header>
    <div className="fs-access__panel" aria-labelledby="role-permissions-title">
      <div className="fs-access__panel-heading"><span className="fs-access__panel-icon"><ShieldCheck size={20} aria-hidden="true" /></span><div><h2 id="role-permissions-title">¿Qué puede hacer cada rol?</h2><p>Revisa sus permisos antes de dar acceso a una persona.</p></div></div>
      <div className="fs-access__role-grid">
        {(['admin', 'superadmin'] as const).map(roleKey => <div key={roleKey} className="fs-access__role-card">
          <h3 className="fs-access__role-title">{ROLE_DETAILS[roleKey].label}</h3>
          <ul className="fs-access__role-permissions">{ROLE_DETAILS[roleKey].permissions.map(permission => <li key={permission.label} className={permission.critical ? 'fs-access__role-permission--critical' : undefined}>{permission.critical ? <AlertCircle size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}<span>{permission.label}</span></li>)}</ul>
          <p className="fs-access__role-limit">{ROLE_DETAILS[roleKey].limit}</p>
        </div>)}
      </div>
    </div>
    <div className="fs-access__panel">
      <div className="fs-access__panel-heading"><span className="fs-access__panel-icon"><Mail size={20} aria-hidden="true" /></span><div><h2>Invitar a una persona</h2><p>Envía un enlace seguro a su correo. Vence en 7 días.</p></div></div>
      <form onSubmit={invite} className="fs-access__invite-form">
        <label><span>Correo electrónico</span><input type="email" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} placeholder="persona@empresa.com" className={field} /></label>
        <label><span>Permisos</span><select value={role} aria-describedby="invitation-role-help" onChange={event => setRole(event.target.value as Role)} className={field}><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select></label>
        <button className={button} disabled={busy || loading} type="submit">{busy ? 'Procesando…' : 'Enviar invitación'}</button>
      </form>
      <p id="invitation-role-help" className="fs-access__hint" aria-live="polite"><strong>{ROLE_DETAILS[role].label}:</strong> {ROLE_DETAILS[role].confirmation}</p>
      <p className="fs-access__hint">¿Ya tiene cuenta? Puedes autorizarla directamente en la lista de usuarios.</p>
    </div>
    {error && <div role="alert" className="fs-access__alert fs-access__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
    {notice && <div role="status" className="fs-access__alert fs-access__alert--success"><Check size={17} aria-hidden="true" /><span>{notice}</span></div>}
    <div className="fs-access__panel fs-access__panel--table">
      <div className="fs-access__section-heading"><h2 id="users-list-heading" tabIndex={-1}><UsersRound size={20} aria-hidden="true" /> Usuarios <span className="fs-access__count">{total}</span></h2><button disabled={busy || loading} className="fs-access__button fs-access__button--secondary" onClick={() => void load().catch(failure => setError(message(failure)))}><RefreshCw size={15} aria-hidden="true" />Actualizar</button></div>
      <div className="fs-access__table-wrap" aria-busy={loading}>
        <table className="fs-access__table" role="table" aria-label="Usuarios y permisos"><thead role="rowgroup"><tr role="row">{['Persona', 'Rol', 'Acceso', 'Acciones'].map(label => <th scope="col" role="columnheader" key={label}>{label}</th>)}</tr></thead>
          <tbody role="rowgroup">{users.map(user => <UserRow key={`${user.id}-${user.role}-${user.status}`} user={user} self={user.id === identity?.userId} disabled={busy || loading} onSave={save} onDelete={setDeleteTarget} />)}</tbody>
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
    {deleteTarget && <DeleteAccountDialog key={deleteTarget.id} user={deleteTarget} busy={busy} onClose={() => { if (!busy) setDeleteTarget(null); }} onConfirm={deleteAccount} />}
  </div>;
}
