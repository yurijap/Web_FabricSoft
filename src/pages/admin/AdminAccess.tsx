import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, HelpCircle, Mail, Plus, RefreshCw, Search, Settings2, ShieldCheck, Trash2, UsersRound, X } from 'lucide-react';
import '../../auth/styles/security.css';
import { api } from '../../config/api';
import { useAccess } from '../../auth/AccessContext';

type Role = 'admin' | 'superadmin';
type AccessUser = {
  id: string; name: string; email: string; role: Role | null;
  status: 'active' | 'blocked' | 'unauthorized';
  emailVerified: boolean; canGrantAccess: boolean; authorizedEmail: string;
  accessIssue: 'email_missing' | 'email_unverified' | 'email_changed' | 'banned' | null;
};
type Invitation = { id: string; email: string; role: Role; status: string };
const field = 'fs-access__field';
const button = 'fs-access__button';
const secondary = `${button} fs-access__button--secondary`;
const danger = `${button} fs-access__button--danger`;
const ROLE_DETAILS: Record<Role, { label: string; summary: string; permissions: string[]; limit: string }> = {
  admin: {
    label: 'Admin', summary: 'Gestiona leads, citas, documentos y paneles. No administra usuarios ni vacía la base de datos.',
    permissions: ['Leads y solicitudes', 'Citas y reuniones', 'Documentos, paneles y campañas'],
    limit: 'Sin gestión de usuarios, roles ni vaciado de datos.',
  },
  superadmin: {
    label: 'Superadmin', summary: 'Incluye Admin. Puede dar y quitar accesos, cambiar roles, eliminar cuentas y vaciar la base de datos.',
    permissions: ['Todas las funciones de Admin', 'Invitaciones, usuarios y roles', 'Eliminar cuentas y vaciar la base de datos'],
    limit: 'No puede cambiar su propio rol, bloquearse ni eliminar su cuenta.',
  },
};
const ISSUES = {
  email_missing: 'Debe añadir y verificar un correo antes de recibir acceso.',
  email_unverified: 'Debe verificar su correo principal antes de recibir acceso.',
  email_changed: 'El correo autorizado ya no está verificado en esta cuenta. Revisa la dirección antes de dar acceso de nuevo.',
  banned: 'Cuenta suspendida en el proveedor de identidad. Contacta al responsable del sistema.',
};
function message(error: unknown) {
  return (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'No se pudo completar la operación. Intenta de nuevo.';
}
function useModal() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      const target = previousFocus?.isConnected && previousFocus !== document.body && !previousFocus.matches(':disabled') ? previousFocus : document.getElementById('users-list-heading');
      target?.focus({ preventScroll: true });
    };
  }, []);
  return ref;
}
function AccessDialog({ title, description, busy, onClose, children }: { title: string; description: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useModal();
  const id = useId();
  return <dialog ref={ref} className="fs-access__dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="fs-access__dialog-heading"><span className="fs-access__dialog-icon"><ShieldCheck size={21} aria-hidden="true" /></span><button type="button" className={`${secondary} fs-access__dialog-close`} aria-label="Cerrar ventana" disabled={busy} onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
    <h2 id={`${id}-title`}>{title}</h2><p id={`${id}-description`}>{description}</p>
    {children}
  </dialog>;
}
function RolePicker({ role, onChange, disabled }: { role: Role; onChange: (role: Role) => void; disabled: boolean }) {
  const id = useId();
  return <div className="fs-access__role-picker"><label htmlFor={id}><span>Rol de acceso</span></label><select id={id} className={field} value={role} disabled={disabled} onChange={event => onChange(event.target.value as Role)} aria-describedby={`${id}-help`}><option value="admin">Admin</option><option value="superadmin">Superadmin</option></select><p id={`${id}-help`} className="fs-access__role-note" aria-live="polite">{ROLE_DETAILS[role].summary}</p></div>;
}
function InviteDialog({ busy, onClose, onInvite }: { busy: boolean; onClose: () => void; onInvite: (email: string, role: Role) => Promise<void> }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('admin');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    try { await onInvite(email.trim(), role); } catch (failure) { setError(message(failure)); }
  }
  return <AccessDialog title="Invitar a una persona" description="Recibirá un enlace para crear su cuenta. Vence en 7 días." busy={busy} onClose={onClose}>
    <form className="fs-access__dialog-form" onSubmit={submit} aria-busy={busy}>
      <label htmlFor="invite-email"><span>Correo de la persona</span><input id="invite-email" type="email" className={field} value={email} onChange={event => setEmail(event.target.value)} placeholder="persona@empresa.com" autoComplete="email" maxLength={254} required disabled={busy} aria-describedby="invite-email-help" /></label>
      <p id="invite-email-help" className="fs-access__field-help">Gmail, Outlook o corporativo. Debe poder abrir ese buzón. Si ya tiene cuenta, usa Gestionar acceso en la lista.</p>
      <RolePicker role={role} onChange={setRole} disabled={busy} />
      {error && <div role="alert" className="fs-access__alert fs-access__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
      <div className="fs-access__dialog-actions"><button type="button" className={secondary} disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className={button} disabled={busy}><Mail size={15} aria-hidden="true" />{busy ? 'Enviando…' : 'Enviar invitación'}</button></div>
    </form>
  </AccessDialog>;
}
function EditAccessDialog({ user, busy, onClose, onSave }: { user: AccessUser; busy: boolean; onClose: () => void; onSave: (user: AccessUser, role: Role, status: 'active' | 'blocked') => Promise<void> }) {
  const [role, setRole] = useState<Role>(user.role || 'admin');
  const [error, setError] = useState('');
  const unchanged = user.status === 'active' && role === user.role && (user.authorizedEmail || '').toLowerCase() === user.email.toLowerCase();
  async function save(status: 'active' | 'blocked') {
    if (busy) return;
    setError('');
    try { await onSave(user, status === 'blocked' ? user.role || 'admin' : role, status); } catch (failure) { setError(message(failure)); }
  }
  return <AccessDialog title="Gestionar acceso" description="Revisa la cuenta y sus permisos antes de guardar." busy={busy} onClose={onClose}>
    <form className="fs-access__dialog-form" aria-busy={busy} onSubmit={event => { event.preventDefault(); if (user.canGrantAccess && !unchanged) void save('active'); }}>
      <div className="fs-access__account"><span className="fs-access__avatar" aria-hidden="true">{(user.name || user.email || '?')[0].toUpperCase()}</span><div><strong>{user.name || 'Usuario'}</strong><span>{user.email || 'Sin correo principal'}</span><small>{user.emailVerified ? 'Correo verificado' : 'Correo pendiente de verificar'}</small></div></div>
      {user.accessIssue && <div role="note" className="fs-access__alert"><AlertCircle size={17} aria-hidden="true" /><span>{ISSUES[user.accessIssue]}</span></div>}
      <RolePicker role={role} onChange={setRole} disabled={busy || !user.canGrantAccess} />
      {user.authorizedEmail && user.authorizedEmail.toLowerCase() !== user.email.toLowerCase() && <p className="fs-access__field-help">Correo autorizado antes: <strong>{user.authorizedEmail}</strong>. Al dar acceso, se usará el correo principal mostrado arriba.</p>}
      <p className="fs-access__field-help">El permiso pertenece a esta cuenta. Otra cuenta con un correo diferente necesita su propia autorización. Bloquear conserva la cuenta y suspende su acceso.</p>
      {error && <div role="alert" className="fs-access__alert fs-access__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
      <div className="fs-access__dialog-actions">
        {user.status !== 'blocked' && <button type="button" className={`${danger} fs-access__block`} disabled={busy} onClick={() => void save('blocked')}>Bloquear</button>}
        <button type="button" className={secondary} disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className={button} disabled={busy || !user.canGrantAccess || unchanged}>{busy ? 'Guardando…' : user.status === 'active' ? 'Guardar cambios' : 'Dar acceso'}</button>
      </div>
    </form>
  </AccessDialog>;
}
function UserRow({ user, self, disabled, onEdit, onDelete }: { user: AccessUser; self: boolean; disabled: boolean; onEdit: (user: AccessUser) => void; onDelete: (user: AccessUser) => void }) {
  return <tr className="fs-access__user" role="row">
    <td data-label="Persona" role="cell"><div className="fs-access__person"><span className="fs-access__avatar" aria-hidden="true">{(user.name || user.email || '?')[0].toUpperCase()}</span><div><strong>{user.name || 'Usuario'}{self && <small>Tú</small>}</strong><span>{user.email || 'Sin correo principal'}</span></div></div></td>
    <td data-label="Rol" role="cell"><span className={`fs-access__role-badge${user.role === 'superadmin' ? ' fs-access__role-badge--owner' : ''}`}>{user.role === 'superadmin' && <ShieldCheck size={13} aria-hidden="true" />}{user.role ? ROLE_DETAILS[user.role].label : 'Sin rol'}</span></td>
    <td data-label="Estado" role="cell"><span className={`fs-access__status fs-access__status--${user.status}`}><span aria-hidden="true" className="fs-access__dot" />{user.status === 'active' ? 'Activo' : user.status === 'blocked' ? 'Bloqueado' : 'Sin acceso'}</span>{user.status !== 'active' && user.accessIssue && <small className="fs-access__issue">{user.accessIssue === 'email_missing' ? 'Sin correo' : user.accessIssue === 'email_unverified' ? 'Correo sin verificar' : user.accessIssue === 'email_changed' ? 'Revisar correo' : 'Suspendido'}</small>}</td>
    <td data-label="Acciones" role="cell"><div className="fs-access__actions">{self ? <span className="fs-access__self"><ShieldCheck size={14} aria-hidden="true" />Tu cuenta</span> : <><button type="button" className={secondary} disabled={disabled} aria-label={`Gestionar acceso de ${user.email || user.name || user.id}`} onClick={() => onEdit(user)}><Settings2 size={14} aria-hidden="true" />Gestionar acceso</button><button type="button" className={`${danger} fs-access__icon-button`} disabled={disabled} aria-label={`Eliminar cuenta de ${user.email || user.name || user.id}`} title="Eliminar cuenta" onClick={() => onDelete(user)}><Trash2 size={15} aria-hidden="true" /></button></>}</div></td>
  </tr>;
}

export function DeleteAccountDialog({ user, busy, onClose, onConfirm }: {
  user: AccessUser; busy: boolean; onClose: () => void;
  onConfirm: (user: AccessUser, confirmation: string) => Promise<void>;
}) {
  const dialogRef = useModal();
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const expected = user.email || user.id;
  const matches = user.email ? confirmation.trim().toLowerCase() === expected.toLowerCase() : confirmation.trim() === expected;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !matches) return;
    setError('');
    try { await onConfirm(user, confirmation.trim()); } catch (failure) { setError(message(failure)); }
  }
  return <dialog ref={dialogRef} className="fs-access__dialog fs-access__delete-dialog" aria-labelledby="delete-user-title" aria-describedby="delete-user-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="fs-access__dialog-heading"><span className="fs-access__dialog-icon fs-access__delete-icon"><Trash2 size={21} aria-hidden="true" /></span><button type="button" className={`${secondary} fs-access__dialog-close`} aria-label="Cancelar eliminación" disabled={busy} onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
    <h2 id="delete-user-title">Eliminar cuenta</h2><p id="delete-user-description">Se eliminará la cuenta de acceso de <strong>{user.name || expected}</strong> y dejará de aparecer en esta lista. Esta acción es permanente.</p>
    <p>Los leads, citas y documentos se conservarán. Para suspender el acceso sin eliminar la cuenta, usa Bloquear.</p>
    <form onSubmit={submit} aria-busy={busy} className="fs-access__dialog-form">
      <label htmlFor="delete-user-confirmation"><span>Para confirmar, escribe {user.email ? 'su correo' : 'su identificador'}:</span><strong className="fs-access__delete-identity">{expected}</strong></label>
      <input id="delete-user-confirmation" className={field} value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} required maxLength={254} disabled={busy} aria-describedby={error ? 'delete-user-error' : undefined} />
      {error && <div id="delete-user-error" role="alert" className="fs-access__alert fs-access__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
      <div className="fs-access__dialog-actions"><button type="button" className={secondary} disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className={`${button} fs-access__button--destructive`} disabled={busy || !matches}>{busy ? 'Eliminando…' : 'Eliminar cuenta'}</button></div>
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
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'users' | 'invitations'>('users');
  const [showHelp, setShowHelp] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AccessUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccessUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const loadSequence = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    try {
      const [members, pending] = await Promise.all([api.get('/access/users', { params: { offset, query } }), api.get('/access/invitations', { params: { offset: inviteOffset } })]);
      if (sequence !== loadSequence.current) return;
      setUsers(members.data.users); setTotal(members.data.total);
      setInvitations(pending.data.invitations); setMoreInvites(pending.data.hasMore);
      if (offset > 0 && offset >= members.data.total) setOffset(Math.max(0, Math.floor((members.data.total - 1) / 25) * 25));
    } catch (failure) { if (sequence === loadSequence.current) throw failure; }
    finally { if (sequence === loadSequence.current) setLoading(false); }
  }, [offset, inviteOffset, query]);
  useEffect(() => { setError(''); void load().catch(failure => setError(message(failure))); return () => { loadSequence.current++; }; }, [load]);
  useEffect(() => { const timer = window.setTimeout(() => { setQuery(search.trim()); setOffset(0); }, 300); return () => window.clearTimeout(timer); }, [search]);

  async function mutate(operation: () => Promise<void>, success: string, close?: () => void) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await operation(); close?.(); setNotice(success);
      try { await load(); } catch { setError('El cambio se guardó, pero no pudimos actualizar la lista. Pulsa Actualizar.'); }
    } finally { setBusy(false); }
  }
  async function invite(email: string, role: Role) {
    await mutate(async () => { await api.post('/access/invitations', { email, role }); }, 'Invitación enviada. El enlace vence en 7 días.', () => setInviteOpen(false));
  }
  async function save(user: AccessUser, role: Role, status: 'active' | 'blocked') {
    await mutate(async () => { await api.patch(`/access/users/${user.id}`, { email: user.email, role, status }); }, status === 'blocked' ? 'Acceso bloqueado. La cuenta se conserva.' : 'Permisos guardados para esta cuenta.', () => setEditTarget(null));
  }
  async function deleteAccount(user: AccessUser, confirmation: string) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await api.delete(`/access/users/${user.id}`, { data: { confirmation } });
      setUsers(current => current.filter(item => item.id !== user.id)); setTotal(current => Math.max(0, current - 1)); setDeleteTarget(null);
      setNotice('Cuenta eliminada. Los registros de la operación se conservan.');
      if (users.length === 1 && offset > 0) setOffset(current => Math.max(0, current - 25));
      else { try { await load(); } catch { setError('La cuenta se eliminó, pero no pudimos actualizar la lista. Pulsa Actualizar.'); } }
    } finally { setBusy(false); }
  }
  const disabled = busy || loading || search.trim() !== query;

  return <div className="fs-access">
    <header className="fs-access__header"><div><span className="fs-security__eyebrow">Sistema / Equipo</span><h1>Usuarios y accesos</h1><p>Las personas correctas, con los permisos necesarios.</p></div><div className="fs-access__header-actions"><button type="button" className={secondary} aria-expanded={showHelp} aria-controls="access-help" onClick={() => setShowHelp(current => !current)}><HelpCircle size={16} aria-hidden="true" />Roles y ayuda<ChevronDown size={13} aria-hidden="true" /></button><button type="button" className={button} disabled={busy} onClick={() => setInviteOpen(true)}><Plus size={16} aria-hidden="true" />Invitar usuario</button></div></header>
    <div className="fs-access__policy"><ShieldCheck size={16} aria-hidden="true" /><p>Solo superadmin gestiona accesos. <span>Se admite cualquier correo verificado.</span></p></div>
    {showHelp && <div id="access-help" className="fs-access__help">
      <div className="fs-access__help-roles">{(['admin', 'superadmin'] as const).map(key => <div className="fs-access__help-role" key={key}><h2>{ROLE_DETAILS[key].label}</h2><ul>{ROLE_DETAILS[key].permissions.map(permission => <li key={permission}><Check size={13} aria-hidden="true" />{permission}</li>)}</ul><p>{ROLE_DETAILS[key].limit}</p></div>)}</div>
      <div className="fs-access__help-answers"><h2>Cómo funciona el acceso</h2><p><strong>Sin cuenta:</strong> invita a su correo real. Puede usar Gmail, Outlook o uno corporativo y aceptar el enlace desde ese buzón.</p><p><strong>Con cuenta:</strong> búscala en Usuarios y abre Gestionar acceso. Se autoriza su correo principal verificado.</p><p><strong>Con otro correo:</strong> otra cuenta necesita su propia autorización. Google solo sirve para cuentas de Google; para otros correos usa el inicio de sesión por correo.</p><p><strong>Si cambia de dirección:</strong> el correo autorizado debe seguir verificado en la misma cuenta. Si lo elimina, pierde el acceso hasta que autorices su nuevo correo verificado.</p></div>
    </div>}
    {error && <div role="alert" className="fs-access__alert fs-access__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
    {notice && <div role="status" className="fs-access__alert fs-access__alert--success"><Check size={17} aria-hidden="true" /><span>{notice}</span></div>}
    <div className="fs-access__directory">
      <div className="fs-access__directory-heading"><h2 id="users-list-heading" tabIndex={-1}>Directorio del equipo</h2><span className="fs-access__private"><ShieldCheck size={13} aria-hidden="true" />Acceso privado</span></div>
      <div className="fs-access__tabs" role="group" aria-label="Vista de accesos"><button type="button" aria-pressed={view === 'users'} onClick={() => setView('users')}><UsersRound size={16} aria-hidden="true" />Usuarios<span className="fs-access__count">{total}</span></button><button type="button" aria-pressed={view === 'invitations'} onClick={() => setView('invitations')}><Mail size={16} aria-hidden="true" />Pendientes{invitations.length > 0 && <span className="fs-access__pending-dot" aria-label="Hay invitaciones pendientes" />}</button></div>
      <div className="fs-access__toolbar">{view === 'users' ? <div className="fs-access__search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Buscar usuarios por nombre o correo" placeholder="Nombre o correo…" maxLength={254} value={search} disabled={busy} onChange={event => setSearch(event.target.value)} />{search && <button type="button" aria-label="Limpiar búsqueda" disabled={busy} onClick={() => setSearch('')}><X size={15} aria-hidden="true" /></button>}</div> : <p>Invitaciones enviadas por tu equipo.</p>}<button type="button" aria-label="Actualizar lista" disabled={busy || loading} className={`${secondary} fs-access__refresh`} onClick={() => { setError(''); void load().catch(failure => setError(message(failure))); }}><RefreshCw size={15} aria-hidden="true" /><span>Actualizar</span></button></div>
      {view === 'users' ? <>
        <div className="fs-access__table-wrap" aria-busy={loading}>
          <table className="fs-access__table" role="table" aria-label="Usuarios y permisos"><thead role="rowgroup"><tr role="row">{['Persona', 'Rol', 'Estado', 'Acciones'].map(label => <th scope="col" role="columnheader" key={label}>{label}</th>)}</tr></thead><tbody role="rowgroup">{users.map(user => <UserRow key={user.id} user={user} self={user.id === identity?.userId} disabled={disabled} onEdit={setEditTarget} onDelete={setDeleteTarget} />)}</tbody></table>
          {!users.length && <div className="fs-access__empty" role="status"><UsersRound size={24} aria-hidden="true" /><strong>{loading ? 'Cargando cuentas…' : query ? 'No encontramos esa cuenta' : 'Todavía no hay cuentas'}</strong><p>{!loading && (query ? 'Prueba otro nombre o correo, o invita a la persona.' : 'Invita a una persona para empezar.')}</p></div>}
        </div>
        <nav className="fs-access__pagination" aria-label="Páginas de usuarios"><span role="status">{total ? offset + 1 : 0}–{Math.min(offset + users.length, total)} de {total}{query ? ' resultados' : ' usuarios'}</span><div><button type="button" disabled={disabled || offset === 0} className={secondary} onClick={() => setOffset(Math.max(0, offset - 25))}><ChevronLeft size={14} aria-hidden="true" />Anterior</button><button type="button" disabled={disabled || offset + 25 >= total} className={secondary} onClick={() => setOffset(offset + 25)}>Siguiente<ChevronRight size={14} aria-hidden="true" /></button></div></nav>
      </> : <div aria-busy={loading}>
        {!invitations.length && <div className="fs-access__empty" role="status"><Mail size={24} aria-hidden="true" /><strong>{loading ? 'Cargando invitaciones…' : 'Todo al día'}</strong><p>{!loading && 'No hay invitaciones pendientes en esta página.'}</p></div>}
        {invitations.map(invitation => <div key={invitation.id} className="fs-access__invitation"><div><strong>{invitation.email}</strong><span>{ROLE_DETAILS[invitation.role]?.label || 'Sin rol'} · Pendiente de aceptar</span></div><button type="button" disabled={busy || loading} className={danger} onClick={() => { if (window.confirm('¿Revocar esta invitación? El enlace dejará de servir.')) void mutate(async () => { await api.post(`/access/invitations/${invitation.id}/revoke`); }, 'Invitación revocada.').catch(failure => setError(message(failure))); }}>Revocar</button></div>)}
        <nav className="fs-access__pagination" aria-label="Páginas de invitaciones"><span>El enlace de invitación vence en 7 días.</span><div><button type="button" disabled={busy || loading || inviteOffset === 0} className={secondary} onClick={() => setInviteOffset(Math.max(0, inviteOffset - 25))}>Anterior</button><button type="button" disabled={busy || loading || !moreInvites} className={secondary} onClick={() => setInviteOffset(inviteOffset + 25)}>Siguiente</button></div></nav>
      </div>}
    </div>
    {inviteOpen && <InviteDialog busy={busy} onClose={() => { if (!busy) setInviteOpen(false); }} onInvite={invite} />}
    {editTarget && <EditAccessDialog key={editTarget.id} user={editTarget} busy={busy} onClose={() => { if (!busy) setEditTarget(null); }} onSave={save} />}
    {deleteTarget && <DeleteAccountDialog key={deleteTarget.id} user={deleteTarget} busy={busy} onClose={() => { if (!busy) setDeleteTarget(null); }} onConfirm={deleteAccount} />}
  </div>;
}
