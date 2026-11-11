import { useState } from 'react';
import type { FormEvent } from 'react';
import { useClerk, useReverification, useSession, useUser } from '@clerk/clerk-react';
import { ShieldCheck } from 'lucide-react';
import { useAccess } from './AccessContext';

export default function MfaScreen() {
  const { user } = useUser();
  const { session } = useSession();
  const { signOut } = useClerk();
  const { identity, refresh } = useAccess();
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [useBackup, setUseBackup] = useState(false);
  const [enrolled, setEnrolled] = useState(identity?.mfaEnrolled || false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const createTotp = useReverification(() => user!.createTOTP());
  const verifyTotp = useReverification((value: string) => user!.verifyTOTP({ code: value }));
  const createBackups = useReverification(() => user!.createBackupCode());

  async function act(operation: () => Promise<void>) {
    setBusy(true); setError('');
    try { await operation(); }
    catch (failure: unknown) {
      const detail = failure as { errors?: { longMessage?: string }[] };
      setError(detail.errors?.[0]?.longMessage || 'No se pudo verificar. Revisa el código. Si el autenticador no está disponible, el responsable debe habilitar TOTP en la configuración de Clerk.');
    } finally { setBusy(false); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void act(async () => {
      if (!enrolled) {
        const result = await verifyTotp(code);
        if (!result) return;
        await user!.reload();
        setEnrolled(true); setSecret(''); setCode('');
        if (result.backupCodes?.length) setBackupCodes(result.backupCodes);
        setNotice('Autenticador activado. Guarda tus códigos de recuperación y después verifica un código nuevo para entrar.');
        return;
      }
      await session!.startVerification({ level: 'second_factor' });
      const result = await session!.attemptSecondFactorVerification({ strategy: useBackup ? 'backup_code' : 'totp', code });
      if (result.status !== 'complete') throw new Error('Verificación incompleta');
      await refresh();
    });
  }

  const button = 'rounded-lg bg-[#C9A96E] px-5 py-3 font-semibold text-[#050B14] disabled:opacity-50';
  return <main className="min-h-screen bg-[#050B14] text-white flex items-center justify-center p-6">
    <section className="w-full max-w-lg rounded-2xl border border-[#1E3A5F] bg-[#0A1626] p-6 space-y-5">
      <ShieldCheck className="text-[#C9A96E]" size={32} />
      <h1 className="text-2xl font-semibold">Seguridad de superadministrador</h1>
      <p className="text-slate-300">{enrolled ? 'Confirma tu identidad con tu aplicación de autenticación. Se solicita una nueva verificación cada 15 minutos.' : 'Configura tu aplicación de autenticación para poder entrar al panel.'}</p>
      {!enrolled && !secret && <button className={button} disabled={busy} onClick={() => void act(async () => {
        const result = await createTotp();
        if (result?.secret) setSecret(result.secret);
      })}>Configurar autenticador</button>}
      {secret && <div className="space-y-3">
        <p className="text-sm text-slate-300">En Google Authenticator, Microsoft Authenticator o tu aplicación, agrega una cuenta con clave de configuración. Elige códigos basados en tiempo e introduce esta clave:</p>
        <code className="block break-all rounded-lg bg-black/30 p-4 select-all">{secret}</code>
        <p className="text-xs text-slate-400">Guárdala únicamente en tu autenticador. No compartas esta clave.</p>
      </div>}
      {notice && <p role="status" className="text-emerald-300">{notice}</p>}
      {enrolled && !user?.backupCodeEnabled && !backupCodes.length && <button className="text-[#C9A96E] underline" disabled={busy} onClick={() => void act(async () => {
        const result = await createBackups();
        if (result) setBackupCodes(result.codes);
      })}>Generar códigos de recuperación</button>}
      {backupCodes.length > 0 && <div className="rounded-lg border border-[#C9A96E]/40 p-4 space-y-3">
        <p>Guarda estos códigos en un lugar seguro. Cada uno sirve una sola vez si pierdes tu autenticador.</p>
        <pre className="select-all whitespace-pre-wrap">{backupCodes.join('\n')}</pre>
        <button className={button} onClick={() => setBackupCodes([])}>Ya los guardé</button>
      </div>}
      {(secret || enrolled) && !backupCodes.length && <form onSubmit={submit} className="space-y-4">
        <label className="block" htmlFor="mfa-code">{useBackup ? 'Código de recuperación' : 'Código del autenticador'}</label>
        <input id="mfa-code" autoComplete="one-time-code" inputMode={useBackup ? 'text' : 'numeric'} value={code} onChange={event => setCode(event.target.value.trim())} required maxLength={useBackup ? 64 : 6} pattern={useBackup ? undefined : '[0-9]{6}'} className="w-full rounded-lg border border-[#1E3A5F] bg-[#12253F] p-3 text-white" />
        <button type="submit" disabled={busy} className={button}>{busy ? 'Verificando…' : enrolled ? 'Verificar y entrar' : 'Activar autenticador'}</button>
        {enrolled && <button type="button" className="block text-sm text-slate-300 underline" onClick={() => { setUseBackup(!useBackup); setCode(''); }}>{useBackup ? 'Usar autenticador' : 'Usar código de recuperación'}</button>}
      </form>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <button className="text-sm text-slate-400 underline" onClick={() => void signOut({ redirectUrl: '/acceso' })}>Cerrar sesión</button>
    </section>
  </main>;
}
