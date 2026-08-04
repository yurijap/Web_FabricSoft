import { SignIn, SignUp } from '@clerk/clerk-react';

/**
 * Pantallas de Clerk extraidas a un modulo lazy: asi SignIn/SignUp (UI pesada
 * de Clerk) no entran al bundle principal y solo se cargan al visitar
 * /acceso o /crear-cuenta.
 */

export function AccesoScreen() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 bg-[#C9A96E] opacity-[0.03] blur-[120px]" />
      <div className="relative z-10">
        <SignIn routing="path" path="/acceso" signUpUrl="/crear-cuenta" forceRedirectUrl="/verificar-acceso" />
      </div>
    </div>
  );
}

export function CrearCuentaScreen() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="pointer-events-none absolute -bottom-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 bg-[#C9A96E] opacity-[0.03] blur-[120px]" />
      <div className="relative z-10">
        <SignUp routing="path" path="/crear-cuenta" signInUrl="/acceso" forceRedirectUrl="/verificar-acceso" />
      </div>
    </div>
  );
}
