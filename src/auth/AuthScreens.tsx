import { Link, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { Mail } from 'lucide-react';
import { SecurityFrame } from './SecurityFrame';

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
  if (!params.get('__clerk_ticket')) {
    return <SecurityFrame title="Tu invitación es el primer paso" description="El acceso a FabricSoft está reservado a las personas autorizadas por el superadministrador.">
      <div className="fs-security__key-box"><Mail size={21} aria-hidden="true" /><p>Solicita una invitación a tu equipo y abre el enlace que recibirás en tu correo.</p></div>
      <Link to="/acceso" className="fs-security__button">Ya tengo cuenta: iniciar sesión</Link>
    </SecurityFrame>;
  }
  return <SecurityFrame title="Completa tu cuenta" description="Acepta la invitación con el mismo correo que la recibió, sea Gmail, Outlook o corporativo.">
    <SignUp appearance={appearance} routing="virtual" signInUrl="/acceso" forceRedirectUrl="/admin" />
  </SecurityFrame>;
}
