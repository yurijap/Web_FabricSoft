import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';

export function AccesoScreen() {
  return (
    <div className="bg-[#FAF9F6] text-zinc-950 min-h-screen flex flex-col justify-center items-center px-4 relative font-sans">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.08),transparent_60%)] pointer-events-none"></div>

      <Link to="/" className="absolute top-8 left-8 inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-950 font-mono text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al Sitio
      </Link>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-flex flex-col items-center select-none group w-48 md:w-64">
            <img 
              src="/Logo_FabricSoft.webp" 
              alt="FabricSoft Logo" 
              className="h-16 md:h-20 object-contain"
            />
          </Link>
          <p className="text-zinc-500 font-mono text-[9px] tracking-wider uppercase mt-4">ADMIN PORTAL & CRITICAL TELEMETRY</p>
        </div>

        {/* Clerk Sign In component */}
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              cardBox: "shadow-none border-0 bg-transparent w-full",
              card: "bg-white border border-[rgba(201,169,110,0.25)] rounded-3xl p-6 md:p-8 w-full shadow-[0_15px_40px_rgba(201,169,110,0.08)]",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              header: "hidden",
              socialButtonsBlockButton: "bg-zinc-50 border border-zinc-200 text-zinc-800 hover:bg-zinc-100 font-mono text-xs rounded-xl transition-colors",
              socialButtonsBlockButtonText: "text-zinc-700 font-mono text-xs",
              formButtonPrimary: "w-full py-4 text-xs font-bold uppercase tracking-widest text-white bg-zinc-900 hover:bg-zinc-800 transition-colors font-mono rounded-full border-0 cursor-pointer shadow-sm",
              formFieldLabel: "text-zinc-800 font-bold block font-mono text-[10px] uppercase",
              formFieldInput: "w-full bg-white border border-zinc-200 focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355]/30 outline-none py-3.5 px-4 text-zinc-900 placeholder-zinc-400 transition-colors rounded-xl font-mono text-xs",
              formFieldAction: "text-[#8B7355] hover:text-[#705C44] underline decoration-[#8B7355]/30 hover:decoration-[#8B7355] transition-colors font-mono text-[10px] uppercase tracking-wider",
              formFieldActionLink: "text-[#8B7355] hover:text-[#705C44] underline decoration-[#8B7355]/30 hover:decoration-[#8B7355] transition-colors font-mono text-[10px] uppercase tracking-wider",
              formFieldHintText: "text-zinc-500 font-mono text-[10px]",
              footerActionLink: "text-[#8B7355] hover:text-[#705C44] underline decoration-[#8B7355]/30 hover:decoration-[#8B7355] transition-colors font-mono text-[11px] font-bold uppercase tracking-wider",
              dividerText: "text-zinc-400 font-mono text-[10px] uppercase",
              dividerLine: "bg-zinc-200",
              identityPreviewText: "text-zinc-800 font-mono text-xs",
              identityPreviewEditButtonIcon: "text-[#8B7355]",
              formFieldInputShowPasswordButton: "text-zinc-400 hover:text-zinc-600",
              footerActionText: "text-zinc-500 font-mono text-[11px] uppercase",
              formResendCodeLink: "text-[#8B7355] hover:text-[#705C44] underline decoration-[#8B7355]/30 hover:decoration-[#8B7355] transition-colors font-mono text-[11px] font-bold uppercase tracking-wider",
              alternativeMethodsBlockButton: "bg-zinc-50 border border-zinc-200 text-zinc-800 hover:bg-zinc-100 font-mono text-xs rounded-xl transition-colors",
              alternativeMethodsBlockButtonText: "text-zinc-700 font-mono text-xs",
              userPreviewSecondaryIdentifier: "text-zinc-500 font-mono text-xs",
              backLink: "text-[#8B7355] hover:text-[#705C44] underline decoration-[#8B7355]/30 hover:decoration-[#8B7355] transition-colors font-mono text-[11px] font-bold uppercase tracking-wider",
              footer: "mt-4",
            },
            variables: {
              colorPrimary: "#8B7355",
              colorBackground: "#FFFFFF",
              colorText: "#18181B",
              colorTextSecondary: "#52525B",
              colorInputText: "#18181B",
              colorDanger: "#EF4444",
              fontFamily: "var(--sans)",
            }
          }}
          routing="path"
          path="/acceso"
          signUpUrl="/crear-cuenta"
          forceRedirectUrl="/dashboard"
        />

        {/* Footer info */}
        <p className="text-center font-mono text-[9px] text-zinc-500 mt-6 leading-relaxed">
          El acceso está sujeto a auditoría de logs IP. <br />
          Cualquier intento de intrusión será derivado a los equipos de IT de FABRIC.
        </p>
      </div>
    </div>
  );
}

export function CrearCuentaScreen() {
  return (
    <div className="bg-[#FAF9F6] text-zinc-950 min-h-screen flex flex-col justify-center items-center px-4 relative font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,110,0.08),transparent_60%)] pointer-events-none"></div>

      <Link to="/" className="absolute top-8 left-8 inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-950 font-mono text-xs transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al Sitio
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="inline-flex flex-col items-center select-none group w-48 md:w-64">
            <img 
              src="/Logo_FabricSoft.webp" 
              alt="FabricSoft Logo" 
              className="h-16 md:h-20 object-contain"
            />
          </Link>
          <p className="text-zinc-500 font-mono text-[9px] tracking-wider uppercase mt-4">NUEVO REGISTRO DE OPERADOR</p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              cardBox: "shadow-none border-0 bg-transparent w-full",
              card: "bg-white border border-[rgba(201,169,110,0.25)] rounded-3xl p-6 md:p-8 w-full shadow-[0_15px_40px_rgba(201,169,110,0.08)]",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              header: "hidden",
              formButtonPrimary: "w-full py-4 text-xs font-bold uppercase tracking-widest text-white bg-zinc-900 hover:bg-zinc-800 transition-colors font-mono rounded-full border-0 cursor-pointer shadow-sm",
              formFieldLabel: "text-zinc-800 font-bold block font-mono text-[10px] uppercase",
              formFieldInput: "w-full bg-white border border-zinc-200 focus:border-[#8B7355] focus:ring-1 focus:ring-[#8B7355]/30 outline-none py-3.5 px-4 text-zinc-900 placeholder-zinc-400 transition-colors rounded-xl font-mono text-xs",
            },
            variables: {
              colorPrimary: "#8B7355",
              colorBackground: "#FFFFFF",
              colorText: "#18181B",
              fontFamily: "var(--sans)",
            }
          }}
          routing="path"
          path="/crear-cuenta"
          signInUrl="/acceso"
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
