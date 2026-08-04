import logoFabric from '../../assets/logo/logo.png';

interface LoaderProps {
  mensaje?: string;
  error?: string | null;
  pantallaCompleta?: boolean;
}

export const LoaderPersonalizado = ({
  mensaje = 'Cargando FABRIC',
  error = null,
  pantallaCompleta = true,
}: LoaderProps) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden ${
        pantallaCompleta ? 'min-h-screen' : 'h-full w-full py-10'
      } bg-[#050505] px-6 text-center`}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C9A96E]/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center border border-[#C9A96E]/30 bg-[#0A0A0A]/80">
            <img src={logoFabric} alt="FABRIC" className="h-9 w-9 object-contain" />
          </div>

          <div className="text-left">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[#C9A96E]">
              FABRIC
            </p>
            <p className="mt-1 font-mono text-[8px] font-semibold uppercase tracking-[0.2em] text-[#8A8A8A]">
              Oracle Critical Engineering
            </p>
          </div>
        </div>

        {!error && (
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border border-[#C9A96E]/25" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#C9A96E]" />
            <div className="absolute inset-3 rounded-full border border-[#2A2A2A]" />
          </div>
        )}

        <h2 className="mt-6 max-w-md px-4 font-serif text-2xl font-semibold tracking-normal text-[#F5F5F5]">
          {error ? 'Error de conexion' : mensaje}
        </h2>

        {error ? (
          <p className="mt-3 max-w-md px-4 text-sm leading-6 text-[#C9A96E]">
            {error}
          </p>
        ) : (
          <p className="mt-3 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8A8A8A]">
            Preparando experiencia segura
          </p>
        )}
      </div>
    </div>
  );
};
