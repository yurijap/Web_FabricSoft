import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/clerk-react';
import { AlertCircle, LogOut, Mail } from 'lucide-react';
import { SecurityFrame, SecurityLoading } from './SecurityFrame';

const appearance = {
  elements: {
    rootBox: 'fs-security__clerk-root',
    cardBox: 'fs-security__clerk-box',
    card: 'fs-security__clerk-card',
    header: 'fs-security__clerk-hidden',
    footerAction: 'fs-security__clerk-hidden',
  },
};

export function AccesoScreen() {
  return <SecurityFrame title="Bienvenido a tu consola" description="Entra con tu correo autorizado: Gmail, Outlook o corporativo. Usa Google si tu cuenta pertenece a Google.">
    <SignIn appearance={appearance} routing="virtual" signUpUrl="/crear-cuenta" forceRedirectUrl="/admin" />
  </SecurityFrame>;
}

export function CrearCuentaScreen() {
  const [params] = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  if (!params.get('__clerk_ticket')) {
    return <SecurityFrame title="Tu invitación es el primer paso" description="El acceso a FabricSoft está reservado a las personas autorizadas por el superadministrador.">
      <div className="fs-security__key-box"><Mail size={21} aria-hidden="true" /><p>Solicita una invitación a tu equipo y abre el enlace que recibirás en tu correo.</p></div>
      <Link to="/acceso" className="fs-security__button">Ya tengo cuenta: iniciar sesión</Link>
    </SecurityFrame>;
  }
  if (!isLoaded) return <SecurityLoading message="Abriendo tu invitación…" />;
  return <InvitationAccountFlow key={params.get('__clerk_ticket')} signedIn={Boolean(isSignedIn)} />;
}

function InvitationAccountFlow({ signedIn }: { signedIn: boolean }) {
  const location = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [hadSession, setHadSession] = useState(signedIn);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');
  // SignUp redirects an already signed-in visitor before consuming the invitation.
  // Wait for an explicit account switch and preserve the original ticket in the URL.
  // The ticket is handled by Clerk; it never grants permissions in this component.
  // Only intercept sessions present on entry; let a newly completed SignUp redirect normally.
  if (signedIn && hadSession) {
    async function continueInvitation() {
      if (switching) return;
      setSwitching(true); setError('');
      try { await signOut({ redirectUrl: `${location.pathname}${location.search}${location.hash}` }); setHadSession(false); }
      catch { setError('No pudimos cerrar la sesión. Intenta de nuevo; tu invitación sigue en este enlace.'); setSwitching(false); }
    }
    return <SecurityFrame title="Ya hay una sesión abierta" description="Revisa la cuenta conectada. Para completar el registro invitado, continúa con el correo que recibió el enlace." email={user?.primaryEmailAddress?.emailAddress}>
      <div className="fs-security__key-box"><Mail size={21} aria-hidden="true" /><p>Abrir una invitación no cambia la cuenta conectada. Cierra esta sesión para abrir el registro del correo invitado.</p></div>
      {error && <div role="alert" className="fs-security__alert fs-security__alert--error"><AlertCircle size={17} aria-hidden="true" /><span>{error}</span></div>}
      <button type="button" className="fs-security__button" disabled={switching} onClick={() => void continueInvitation()}><LogOut size={17} aria-hidden="true" />{switching ? 'Cerrando sesión…' : 'Cerrar sesión y continuar invitación'}</button>
      <p className="fs-security__hint">Conservaremos este enlace para abrir el registro después de cerrar sesión. Si ya aceptaste esta invitación, puedes entrar con tu cuenta existente.</p>
      <Link to="/admin" className="fs-security__link">Volver a mi cuenta actual</Link>
    </SecurityFrame>;
  }
  return <SecurityFrame title="Completa tu cuenta" description="Tu correo viene de la invitación. Completa los datos que se soliciten con esa misma cuenta.">
    <SignUp appearance={appearance} routing="virtual" signInUrl="/acceso" forceRedirectUrl="/admin" />
    <p className="fs-security__hint">La invitación puede verificar tu correo. La contraseña aparece si está habilitada como método de acceso; no hace falta crear otra si entras con Google.</p>
  </SecurityFrame>;
}
